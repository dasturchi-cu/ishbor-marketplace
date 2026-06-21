# ALERTING_RULES.md

**Purpose:** Prometheus alert rules for Ishbor VPS production stack  
**Stack:** Prometheus + Grafana Alertmanager → Telegram/Slack  
**Deployment:** Self-hosted on same VPS — see MONITORING_ARCHITECTURE.md

---

## 1. Alerting architecture

```
Exporters (node, api, postgres, redis, blackbox)
    │
    ▼
Prometheus (scrape + evaluate rules every 30s)
    │
    ▼
Alertmanager (group, dedupe, route by severity)
    │
    ├── P0 → Telegram #ishbor-p0 + phone (founder)
    ├── P1 → Telegram #ishbor-alerts
    ├── P2 → Slack #ishbor-ops
    └── P3 → Slack #ishbor-ops (business hours)
```

Alert rules live in `monitoring/prometheus/alerts/` — mounted into Prometheus container.

---

## 2. Severity definitions

| Severity | Response time | Examples |
|----------|---------------|----------|
| **P0** | Immediate (<15 min) | Checkout down, webhook failures, auth bypass, data breach |
| **P1** | <30 min | 5xx >1%, disk >85%, backup failed, SSL expiring |
| **P2** | <4 hours | p95 latency high, queue backlog, memory pressure |
| **P3** | Next business day | Non-critical metric drift, staging issues |

See [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) for response procedures.

---

## 3. API golden signals

File: `monitoring/prometheus/alerts/api.yml`

### 3.1 Error rate (5xx)

```yaml
groups:
  - name: ishbor_api
    rules:
      - alert: ApiHighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{job="api", status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total{job="api"}[5m]))
          ) > 0.01
        for: 5m
        labels:
          severity: P1
          team: backend
        annotations:
          summary: "API 5xx error rate above 1%"
          description: "Error rate is {{ $value | humanizePercentage }} over 5 minutes."
          runbook: "Check Sentry, docker compose logs api, /health/ready"
```

### 3.2 Latency (p95)

```yaml
      - alert: ApiHighLatencyP95
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket{job="api"}[5m])) by (le)
          ) > 2
        for: 10m
        labels:
          severity: P2
          team: backend
        annotations:
          summary: "API p95 latency above 2 seconds"
          description: "p95 latency is {{ $value }}s for 10 minutes."
```

### 3.3 Checkout-specific

```yaml
      - alert: CheckoutSuccessRateLow
        expr: |
          (
            sum(rate(checkout_completed_total[15m]))
            /
            sum(rate(checkout_attempts_total[15m]))
          ) < 0.95
        for: 15m
        labels:
          severity: P0
          team: backend
        annotations:
          summary: "Checkout success rate below 95%"
          description: "Only {{ $value | humanizePercentage }} of checkouts succeeding."

      - alert: CheckoutLatencyHigh
        expr: |
          histogram_quantile(0.95,
            sum(rate(checkout_duration_seconds_bucket[5m])) by (le)
          ) > 3
        for: 5m
        labels:
          severity: P1
          team: backend
        annotations:
          summary: "Checkout p95 latency above 3 seconds"
```

---

## 4. Infrastructure alerts

File: `monitoring/prometheus/alerts/infrastructure.yml`

### 4.1 Disk usage

```yaml
  - name: ishbor_infrastructure
    rules:
      - alert: DiskSpaceLow
        expr: |
          (
            node_filesystem_avail_bytes{mountpoint="/"}
            /
            node_filesystem_size_bytes{mountpoint="/"}
          ) < 0.15
        for: 5m
        labels:
          severity: P1
          team: devops
        annotations:
          summary: "Disk space below 15% on {{ $labels.instance }}"
          description: "Available: {{ $value | humanizePercentage }}. Clean logs or expand volume."

      - alert: DiskSpaceCritical
        expr: |
          (
            node_filesystem_avail_bytes{mountpoint="/"}
            /
            node_filesystem_size_bytes{mountpoint="/"}
          ) < 0.05
        for: 2m
        labels:
          severity: P0
          team: devops
        annotations:
          summary: "CRITICAL: Disk space below 5%"
```

### 4.2 Memory and CPU

```yaml
      - alert: HighMemoryUsage
        expr: |
          (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) > 0.90
        for: 15m
        labels:
          severity: P2
        annotations:
          summary: "Memory usage above 90%"

      - alert: HighCpuUsage
        expr: |
          100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85
        for: 15m
        labels:
          severity: P2
        annotations:
          summary: "CPU usage above 85% for 15 minutes"
```

### 4.3 Container health

```yaml
      - alert: ContainerDown
        expr: |
          up{job=~"api|postgres|redis|minio|nginx"} == 0
        for: 1m
        labels:
          severity: P0
        annotations:
          summary: "Container {{ $labels.job }} is down"
          description: "docker compose ps — check logs"
```

---

## 5. Database and Redis

File: `monitoring/prometheus/alerts/data.yml`

```yaml
  - name: ishbor_data
    rules:
      - alert: PostgresConnectionsHigh
        expr: |
          pg_stat_activity_count / pg_settings_max_connections > 0.80
        for: 5m
        labels:
          severity: P2
        annotations:
          summary: "PostgreSQL connections above 80% of max"

      - alert: PostgresDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: P0
        annotations:
          summary: "PostgreSQL exporter cannot reach database"

      - alert: RedisMemoryHigh
        expr: |
          redis_memory_used_bytes / redis_memory_max_bytes > 0.90
        for: 10m
        labels:
          severity: P2
        annotations:
          summary: "Redis memory above 90% of maxmemory"

      - alert: RedisDown
        expr: redis_up == 0
        for: 1m
        labels:
          severity: P0
        annotations:
          summary: "Redis is unreachable"
```

---

## 6. Uptime and blackbox probes

File: `monitoring/prometheus/alerts/uptime.yml`

```yaml
  - name: ishbor_uptime
    rules:
      - alert: ApiHealthCheckFailed
        expr: probe_success{job="blackbox", instance="https://api.ishbor.uz/health/ready"} == 0
        for: 2m
        labels:
          severity: P0
        annotations:
          summary: "API /health/ready probe failing"
          description: "External users cannot reach API."

      - alert: FrontendDown
        expr: probe_success{job="blackbox", instance="https://ishbor.uz"} == 0
        for: 2m
        labels:
          severity: P0
        annotations:
          summary: "Frontend https://ishbor.uz probe failing"

      - alert: SSLCertExpiringSoon
        expr: probe_ssl_earliest_cert_expiry - time() < 14 * 24 * 3600
        for: 1h
        labels:
          severity: P1
        annotations:
          summary: "SSL certificate expires in less than 14 days"
```

See [UPTIME_MONITORING.md](./UPTIME_MONITORING.md) for probe configuration.

---

## 7. Security and abuse alerts

File: `monitoring/prometheus/alerts/security.yml`

```yaml
  - name: ishbor_security
    rules:
      - alert: AuthBruteForceSpike
        expr: |
          sum(rate(rate_limit_exceeded_total{endpoint="auth.login"}[5m])) > 1.67
        for: 5m
        labels:
          severity: P1
        annotations:
          summary: "Login rate limit exceeded >100 times in 5 minutes"

      - alert: WebhookSignatureFailures
        expr: |
          sum(rate(webhook_signature_failures_total[5m])) > 0.17
        for: 2m
        labels:
          severity: P0
        annotations:
          summary: "Payment webhook signature verification failing"

      - alert: FailedLoginRateHigh
        expr: |
          sum(rate(auth_login_failures_total[5m]))
          /
          sum(rate(auth_login_attempts_total[5m])) > 0.20
        for: 5m
        labels:
          severity: P1
        annotations:
          summary: "Failed login rate above 20%"
```

---

## 8. Celery and background jobs

```yaml
  - name: ishbor_celery
    rules:
      - alert: CeleryPaymentsQueueBacklog
        expr: celery_queue_length{queue="payments"} > 100
        for: 10m
        labels:
          severity: P2
        annotations:
          summary: "Payments queue depth above 100 for 10 minutes"

      - alert: CeleryWorkerDown
        expr: celery_workers_active == 0
        for: 5m
        labels:
          severity: P1
        annotations:
          summary: "No active Celery workers"
```

---

## 9. Alertmanager routing

File: `monitoring/alertmanager.yml`

```yaml
route:
  receiver: default
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - match:
        severity: P0
      receiver: telegram-p0
      repeat_interval: 15m
    - match:
        severity: P1
      receiver: telegram-alerts
      repeat_interval: 1h
    - match:
        severity: P2
      receiver: slack-ops

receivers:
  - name: telegram-p0
    telegram_configs:
      - bot_token: ${ALERTMANAGER_TELEGRAM_BOT_TOKEN}
        chat_id: ${TELEGRAM_P0_CHAT_ID}
        parse_mode: HTML
  - name: telegram-alerts
    telegram_configs:
      - bot_token: ${ALERTMANAGER_TELEGRAM_BOT_TOKEN}
        chat_id: ${ALERTMANAGER_TELEGRAM_CHAT_ID}
  - name: slack-ops
    slack_configs:
      - api_url: ${SLACK_WEBHOOK_URL}
        channel: '#ishbor-ops'
```

---

## 10. Grafana dashboard links

Embed in alert annotations:

| Dashboard | UID | Use |
|-----------|-----|-----|
| API Overview | `ishbor-api` | 5xx, latency, RPS |
| VPS Infrastructure | `ishbor-infra` | CPU, RAM, disk |
| Founder Business | `ishbor-founder` | Orders, escrow volume |
| PostgreSQL | `ishbor-pg` | Connections, slow queries |

Admin `/admin/system` reads health summary — links to Grafana for detail.

---

## 11. Alert tuning guidelines

| Symptom | Action |
|---------|--------|
| Too many P2 alerts | Increase `for` duration or threshold |
| Missed incident | Lower threshold, add blackbox probe |
| Alert fatigue | Fix root cause, increase `group_interval` |
| False positive disk alert | Exclude tmpfs mounts in expr |

Review alert effectiveness monthly — silence stale rules.

---

## 12. Testing alerts

```bash
# Prometheus rule check
promtool check rules monitoring/prometheus/alerts/*.yml

# Fire test alert via amtool
amtool alert add alertname=TestAlert severity=P3

# Verify Telegram delivery
curl -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -d "chat_id=${CHAT_ID}&text=Alertmanager test"
```

Staging: temporarily lower thresholds to verify routing before production.

---

## 13. Related documents

- [UPTIME_MONITORING.md](./UPTIME_MONITORING.md)
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
- [SENTRY_GUIDE.md](./SENTRY_GUIDE.md)
- [../11-backend/MONITORING_ARCHITECTURE.md](../11-backend/MONITORING_ARCHITECTURE.md)

---

*Prometheus alerts: API 5xx >1% (P1), p95 latency >2s (P2), disk <15% (P1), /health/ready probe fail (P0). Alertmanager routes to Telegram by severity.*
