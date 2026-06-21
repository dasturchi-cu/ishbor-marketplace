# MONITORING_ARCHITECTURE.md

**Goal:** Detect failures before users — especially money, auth, and checkout paths  
**Stack:** Prometheus + Grafana on VPS, Sentry for errors, structured JSON logs  
**Deployment:** Self-hosted on same VPS (see infrastructure/INFRASTRUCTURE_ARCHITECTURE.md)

---

## 1. Observability stack

| Pillar | Tool | Purpose |
|--------|------|---------|
| Metrics | Prometheus + Grafana | Latency, throughput, queue depth, business KPIs |
| Errors | Sentry | Exceptions, breadcrumbs, release tracking |
| Logs | structlog JSON → Docker logs → Loki (optional) | Request tracing via X-Request-Id |
| Uptime | Prometheus blackbox exporter / external ping | Synthetic availability checks |
| Traces | Sentry Performance (P1) | Request waterfall |
| Alerting | Grafana Alertmanager → Telegram/Slack | P0–P3 routing |

**No Fly.io metrics, no Axiom** — self-hosted on VPS.

---

## 2. Prometheus on VPS

### Scrape targets

```yaml
# monitoring/prometheus.yml
scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: node
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: api
    metrics_path: /metrics
    static_configs:
      - targets: ["api:8000"]

  - job_name: postgres
    static_configs:
      - targets: ["postgres-exporter:9187"]

  - job_name: redis
    static_configs:
      - targets: ["redis-exporter:9121"]

  - job_name: minio
    metrics_path: /minio/v2/metrics/cluster
    static_configs:
      - targets: ["minio:9000"]

  - job_name: celery
    static_configs:
      - targets: ["celery-exporter:9808"]

  - job_name: blackbox
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
          - https://api.ishbor.uz/health/ready
          - https://ishbor.uz
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

Grafana dashboards provisioned from `monitoring/dashboards/` — API golden signals, business metrics, infrastructure.

---

## 3. Health endpoints

| Endpoint | Checks | Use |
|----------|--------|-----|
| `GET /health` | Process alive | Liveness — Docker HEALTHCHECK |
| `GET /health/ready` | PostgreSQL + Redis connectivity | Readiness — nginx routing, k8s-style |
| `GET /health/live` | Alias for /health | Legacy compat |

### /health/ready implementation

```python
@app.get("/health/ready")
async def health_ready():
    checks = {}
    try:
        await db.execute(text("SELECT 1"))
        checks["db"] = "ok"
    except Exception:
        checks["db"] = "fail"

    try:
        await redis.ping()
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "fail"

    status = "ok" if all(v == "ok" for v in checks.values()) else "degraded"
    code = 200 if status == "ok" else 503
    return JSONResponse({"status": status, **checks}, status_code=code)
```

nginx uptime monitors and Prometheus blackbox probe `/health/ready` every 60s.

Docker Compose:

```yaml
api:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health/ready"]
    interval: 30s
    timeout: 5s
    retries: 3
```

---

## 4. Structured logging

```json
{
  "level": "info",
  "timestamp": "2026-06-20T10:15:30.123Z",
  "event": "request_completed",
  "request_id": "req_abc",
  "user_id": "uuid",
  "method": "POST",
  "path": "/v1/checkout/confirm",
  "duration_ms": 342,
  "status_code": 200,
  "service": "ishbor-api"
}
```

**Never log:** passwords, session tokens, PAN, KYC content, OTP codes.

See [infrastructure/LOGGING_ARCHITECTURE.md](./infrastructure/LOGGING_ARCHITECTURE.md).

---

## 5. Key metrics and alerts

### Golden signals (Grafana dashboard: API Overview)

| Metric | PromQL (example) | Alert threshold |
|--------|------------------|-----------------|
| API error rate (5xx) | `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])` | >1% for 5 min → P1 |
| Checkout success rate | `rate(checkout_completed[15m]) / rate(checkout_attempts[15m])` | <95% for 15 min → P0 |
| p95 latency checkout | `histogram_quantile(0.95, checkout_duration_seconds)` | >2s for 10 min → P2 |
| WS connection failures | `rate(ws_connection_errors[5m])` | >5% → P2 |
| Celery queue depth | `celery_queue_length{queue="payments"}` | >100 for 10 min → P2 |
| DB pool saturation | `db_pool_checked_out / db_pool_size` | >80% → P2 |

### Infrastructure (Grafana dashboard: VPS Infrastructure)

| Metric | Alert |
|--------|-------|
| CPU usage | >85% for 15 min → P2 |
| Memory usage | >90% → P2 |
| Disk usage | >85% → P1 |
| MinIO bucket size | >80% disk → P1 |
| PostgreSQL connections | >80% max → P2 |
| Redis memory | >90% maxmemory → P2 |

### Business metrics (Grafana dashboard: Founder)

| Metric | Source |
|--------|--------|
| Orders created / hour | `analytics_events` or API counter |
| Escrow funded volume USD | `wallet_transactions{category="escrow"}` |
| Active sessions / day | Redis key count |
| Subscription conversions | `subscriptions` table gauge |
| Gateway deposit success | `payment_records{status="completed"}` |

Admin founder panel (`/admin/founder`) reads from Prometheus Grafana API or materialized aggregates.

---

## 6. Sentry configuration

| Setting | Value |
|---------|-------|
| Environment | local / staging / production |
| Release | git SHA (`IMAGE_TAG`) |
| Sample rate (errors) | 100% |
| Sample rate (performance) | 10% prod, 100% staging |
| PII scrubbing | Email hashed in breadcrumbs |

**Critical flows tagged:** `checkout`, `escrow`, `auth`, `payment_webhook`

FastAPI integration:

```python
sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    environment=settings.APP_ENV,
    release=settings.IMAGE_TAG,
    traces_sample_rate=0.1 if settings.APP_ENV == "production" else 1.0,
)
```

---

## 7. Synthetic monitoring

| Check | Frequency | Target |
|-------|-----------|--------|
| Landing alive | 60s | `GET https://ishbor.uz` |
| API ready | 60s | `GET https://api.ishbor.uz/health/ready` |
| Marketplace browse | 5 min | `GET /v1/projects`, `/v1/services` |
| Auth flow | 15 min | Staging — login → session → logout |
| Checkout smoke | 30 min | Staging — full escrow fund test |
| MinIO health | 5 min | `GET minio:9000/minio/health/live` |
| Payme sandbox | 15 min | Staging — gateway ping |

Prometheus blackbox exporter for HTTP checks. Complex flows via staging cron script.

---

## 8. Alert routing

| Severity | Condition | Channel | Response |
|----------|-----------|---------|----------|
| P0 | Checkout down, payment webhooks failing, /health/ready 503 | Telegram + phone | Immediate |
| P1 | 5xx >1%, backup failed, disk >85% | Telegram #ishbor-alerts | <30 min |
| P2 | p95 latency, queue backlog, memory pressure | Slack/Telegram | <4 hr |
| P3 | Non-critical metrics | Slack | Next business day |

Grafana Alertmanager config in `monitoring/alertmanager.yml`.

---

## 9. Admin system health page

Maps `/admin/system` — real data replacing mock:

| Service | Check | Source |
|---------|-------|--------|
| API | /health/ready latency | Prometheus |
| PostgreSQL | connections, replication lag | postgres_exporter |
| Redis | PING, memory | redis_exporter |
| MinIO | cluster health, bucket size | minio metrics |
| Payme/Humo | sandbox ping | Celery health task |
| Email (Resend) | API status | Celery health task |
| SMS (Eskiz) | token valid | Celery health task |
| Celery queues | job counts per queue | celery_exporter |
| Disk | usage % | node_exporter |

---

## 10. Audit and security monitoring

| Monitor | Alert |
|---------|-------|
| Failed login spike (>100/5min) | P1 — brute force |
| Admin action volume anomaly | Daily report |
| Large withdrawal requests (>5000 USD) | P1 → finance_admin |
| Webhook signature failures (>10/min) | P0 |
| rate_limit_exceeded on auth | P2 |
| ClamAV infected files (>5/day) | P2 |

---

## 11. Frontend monitoring

| Tool | Purpose |
|------|---------|
| Sentry browser SDK | Client errors with release tag |
| Web Vitals | LCP, CLS — reported to analytics |
| API error interceptor | Log 5xx with requestId to Sentry |

Replaces `lovable-error-reporting.ts` / `error-capture.ts`.

---

## 12. Post-incident

Template: timeline, root cause, fix, prevention — stored in `rules/99-reports/incidents/`.

Grafana snapshot + Sentry issue link attached to incident report.

---

## 13. Related documents

- [infrastructure/INFRASTRUCTURE_ARCHITECTURE.md](./infrastructure/INFRASTRUCTURE_ARCHITECTURE.md)
- [infrastructure/LOGGING_ARCHITECTURE.md](./infrastructure/LOGGING_ARCHITECTURE.md)
- [infrastructure/DOCKER_COMPOSE_STRUCTURE.md](./infrastructure/DOCKER_COMPOSE_STRUCTURE.md)

---

*Prometheus + Grafana on VPS replaces cloud metrics. Health endpoints `/health` (liveness) and `/health/ready` (DB+Redis) gate nginx routing and external uptime checks.*
