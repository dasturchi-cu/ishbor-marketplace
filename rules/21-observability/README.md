# Observability — Ishbor Marketplace

**Location:** `rules/21-observability/`  
**Stack:** Self-hosted VPS · Docker · Nginx · FastAPI · Prometheus · Grafana · Sentry  
**Principle:** Detect failures before users — especially money, auth, and checkout paths

---

## 1. What this folder covers

Observability documentation for Ishbor production operations. Complements:

| Folder | Focus |
|--------|-------|
| `rules/11-backend/MONITORING_ARCHITECTURE.md` | Stack design, scrape targets, dashboards |
| `rules/11-backend/infrastructure/LOGGING_ARCHITECTURE.md` | Structured JSON logs, request IDs |
| `rules/14-production/OBSERVABILITY_RUNBOOK.md` | Legacy runbook — superseded by this folder |
| `rules/06-quality/QA_CHECKLIST.md` | Pre-release functional verification |

This folder provides **operational runbooks** — setup guides, alert rules, incident procedures.

**No Supabase, no Neon, no Fly.io** — all monitoring runs on Ishbor VPS or external SaaS (Sentry only).

---

## 2. Three pillars

```
┌─────────────────────────────────────────────────────────┐
│                    OBSERVABILITY                         │
├──────────────┬──────────────────┬───────────────────────┤
│   METRICS    │     ERRORS       │        LOGS           │
│ Prometheus   │ Sentry           │ structlog JSON        │
│ Grafana      │ (SaaS)           │ Docker logs → Loki    │
├──────────────┴──────────────────┴───────────────────────┤
│              UPTIME (blackbox + /status)                 │
└─────────────────────────────────────────────────────────┘
```

| Pillar | Tool | Primary use |
|--------|------|-------------|
| Metrics | Prometheus + Grafana | Latency, error rate, disk, queue depth, business KPIs |
| Errors | Sentry | Exceptions, performance traces, release regression |
| Logs | structlog → Docker | Request tracing via `X-Request-Id`, audit events |
| Uptime | Blackbox exporter + `/status` | Synthetic availability, user-facing status |

Alerting: Grafana Alertmanager → Telegram (P0/P1) / Slack (P2/P3).

---

## 3. Document index

| # | Document | Purpose |
|---|----------|---------|
| 1 | [SENTRY_GUIDE.md](./SENTRY_GUIDE.md) | Sentry setup for FastAPI + React, PII scrubbing, releases |
| 2 | [ALERTING_RULES.md](./ALERTING_RULES.md) | Prometheus alert rules: error rate, latency, disk, security |
| 3 | [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) | Severity P0–P3, on-call rotation, communication templates |
| 4 | [UPTIME_MONITORING.md](./UPTIME_MONITORING.md) | Blackbox probes, `/health/ready`, public `/status` page |

---

## 4. Quick reference — key endpoints

| Endpoint | URL | Use |
|----------|-----|-----|
| API liveness | `GET https://api.ishbor.uz/health` | Process alive |
| API readiness | `GET https://api.ishbor.uz/health/ready` | DB + Redis — **primary probe** |
| Public status | `GET https://ishbor.uz/status` | User-facing status page |
| Prometheus | `http://localhost:9090` (SSH tunnel) | Metrics query |
| Grafana | `http://localhost:3000` (SSH tunnel) | Dashboards |
| Sentry | `https://sentry.io/organizations/ishbor` | Error tracking |

---

## 5. Alert severity summary

| Severity | Response | Channel | Examples |
|----------|----------|---------|----------|
| **P0** | <15 min | Telegram + phone | Checkout down, webhook failures, probe fail 2 min |
| **P1** | <30 min | Telegram | 5xx >1%, disk <15%, SSL expiring, auth brute force |
| **P2** | <4 hr | Slack | p95 >2s, Celery backlog, memory >90% |
| **P3** | Next day | Slack | Metric drift, staging issues |

Full definitions: [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)

---

## 6. Key metrics and thresholds

| Metric | Threshold | Severity |
|--------|-----------|----------|
| API 5xx rate | >1% for 5 min | P1 |
| API p95 latency | >2s for 10 min | P2 |
| Checkout success rate | <95% for 15 min | P0 |
| Disk available | <15% for 5 min | P1 |
| Disk available | <5% for 2 min | P0 |
| `/health/ready` probe | fail 2 min | P0 |
| Failed login rate | >20% for 5 min | P1 |
| Celery payments queue | >100 for 10 min | P2 |
| PostgreSQL connections | >80% max | P2 |

PromQL examples: [ALERTING_RULES.md](./ALERTING_RULES.md)

---

## 7. On-call first steps

When paged:

1. Ack in Telegram — "Investigating"
2. `curl https://api.ishbor.uz/health/ready`
3. Open `https://ishbor.uz/status`
4. Check Sentry for spike (filter: last 1h, production)
5. SSH: `docker compose ps && docker compose logs api --tail 50`
6. Grafana: API Overview + VPS Infrastructure dashboards
7. Recent deploy? Consider rollback to previous `IMAGE_TAG`

Full procedure: [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)

---

## 8. Grafana dashboards

Provisioned from `monitoring/dashboards/`:

| Dashboard | Contents |
|-----------|----------|
| **API Overview** | RPS, 5xx rate, p50/p95 latency, rate limit hits |
| **VPS Infrastructure** | CPU, RAM, disk, network, container stats |
| **PostgreSQL** | Connections, transactions, slow queries |
| **Founder Business** | Orders/hour, escrow volume, subscription mix |
| **Celery** | Queue depths, task success/failure rates |

Admin panels:

- `/admin/system` — product health summary (Prometheus-backed in production)
- `/admin/founder` — business KPIs

---

## 9. Logging standards

Structured log shape:

```json
{
  "level": "info",
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

**Never log:** passwords, session tokens, OTP codes, full card numbers, KYC content.  
**Always log:** auth failures, escrow mutations, admin actions, webhook events.

Request ID: nginx generates `X-Request-Id` if absent — FastAPI propagates to logs and Sentry.

---

## 10. Environment variables

| Variable | Purpose |
|----------|---------|
| `SENTRY_DSN` | FastAPI error tracking |
| `VITE_SENTRY_DSN` | React error tracking (public DSN OK) |
| `SENTRY_ENVIRONMENT` | local / staging / production |
| `IMAGE_TAG` | Git SHA — Sentry release + deploy tracking |
| `PROMETHEUS_ENABLED` | Enable `/metrics` endpoint |
| `GRAFANA_PASSWORD` | Grafana admin login |
| `ALERTMANAGER_TELEGRAM_BOT_TOKEN` | Alert delivery |
| `ALERTMANAGER_TELEGRAM_CHAT_ID` | Alert channel |

Full list: [../11-backend/infrastructure/ENVIRONMENT_SETUP.md](../11-backend/infrastructure/ENVIRONMENT_SETUP.md)

---

## 11. Directory layout (VPS)

```
/opt/ishbor/monitoring/
├── prometheus/
│   ├── prometheus.yml
│   └── alerts/
│       ├── api.yml
│       ├── infrastructure.yml
│       ├── uptime.yml
│       └── security.yml
├── alertmanager/
│   └── alertmanager.yml
├── blackbox.yml
└── dashboards/
    ├── api-overview.json
    ├── infrastructure.json
    └── founder.json
```

Deployed via Docker Compose alongside application stack.

---

## 12. Implementation phases

| Phase | Deliverable | Status |
|-------|-------------|--------|
| P0 | `/health/ready` + nginx probe | Required for launch |
| P0 | Sentry FastAPI + React | Required for launch |
| P0 | Public `/status` page | Exists — wire to remote API |
| P1 | Prometheus + node_exporter | VPS beta |
| P1 | Blackbox probes + alerts | VPS beta |
| P1 | Grafana dashboards | VPS beta |
| P2 | Loki log aggregation | Optional |
| P2 | Sentry Performance 100% staging | QA phase |

---

## 13. Related documents

### Security
- [../11-backend/security/SECURITY_CHECKLIST.md](../11-backend/security/SECURITY_CHECKLIST.md)
- [../11-backend/security/ABUSE_PREVENTION.md](../11-backend/security/ABUSE_PREVENTION.md)

### Infrastructure
- [../11-backend/infrastructure/VPS_SETUP.md](../11-backend/infrastructure/VPS_SETUP.md)
- [../11-backend/infrastructure/ENVIRONMENT_SETUP.md](../11-backend/infrastructure/ENVIRONMENT_SETUP.md)
- [../11-backend/MONITORING_ARCHITECTURE.md](../11-backend/MONITORING_ARCHITECTURE.md)

### Quality
- [../06-quality/LAUNCH_CHECKLIST.md](../06-quality/LAUNCH_CHECKLIST.md)
- [../06-quality/AUDIT_PLAYBOOK.md](../06-quality/AUDIT_PLAYBOOK.md)

### Production
- [../14-production/OBSERVABILITY_RUNBOOK.md](../14-production/OBSERVABILITY_RUNBOOK.md)
- [../14-production/DISASTER_RECOVERY.md](../14-production/DISASTER_RECOVERY.md)

---

## 14. Post-incident reports

Store in `rules/99-reports/incidents/`:

```
YYYY-MM-DD-short-title.md
```

Include: timeline, impact, root cause, fix, prevention actions, Grafana snapshot, Sentry links.

Template in [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) § Phase 5.

---

*Self-hosted Prometheus + Grafana on VPS. Sentry SaaS for errors. Blackbox probes + /status for uptime. Alert P0 on checkout failure and /health/ready down.*
