# UPTIME_MONITORING.md

**Purpose:** Synthetic uptime monitoring, blackbox probes, and public status page for Ishbor  
**Stack:** Prometheus blackbox exporter · nginx · FastAPI · TanStack Start  
**Public status:** `https://ishbor.uz/status`

---

## 1. Monitoring layers

Ishbor uses three complementary uptime layers:

| Layer | Tool | Scope |
|-------|------|-------|
| **Synthetic HTTP** | Prometheus blackbox exporter | External availability — user perspective |
| **Application health** | FastAPI `/health`, `/health/ready` | Internal dependency checks (DB, Redis) |
| **Public status page** | React route `/status` | User-facing transparency |

Internal Docker healthchecks provide fourth layer — container liveness.

---

## 2. Health endpoints

### 2.1 FastAPI endpoints

| Endpoint | Checks | HTTP code | Use |
|----------|--------|-----------|-----|
| `GET /health` | Process alive | 200 always if process up | Docker HEALTHCHECK liveness |
| `GET /health/ready` | PostgreSQL + Redis ping | 200 ok / 503 degraded | nginx routing, blackbox probe |
| `GET /health/live` | Alias for `/health` | 200 | Legacy compatibility |

### 2.2 /health/ready response

```json
{
  "status": "ok",
  "db": "ok",
  "redis": "ok"
}
```

Degraded example (503):

```json
{
  "status": "degraded",
  "db": "ok",
  "redis": "fail"
}
```

nginx uptime monitors and load balancers should probe `/health/ready` — not `/health` alone.

### 2.3 nginx routing

```nginx
location /health {
    proxy_pass http://api_backend/health;
    access_log off;
}

location /health/ready {
    proxy_pass http://api_backend/health/ready;
    access_log off;
}
```

External URL: `https://api.ishbor.uz/health/ready`

### 2.4 Docker Compose healthcheck

```yaml
api:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health/ready"]
    interval: 30s
    timeout: 5s
    retries: 3
    start_period: 40s
```

---

## 3. Prometheus blackbox exporter

### 3.1 Installation

Add to `compose.yml`:

```yaml
blackbox-exporter:
  image: prom/blackbox-exporter:latest
  volumes:
    - ./monitoring/blackbox.yml:/etc/blackbox_exporter/config.yml:ro
  networks:
    - ishbor-internal
```

### 3.2 Blackbox modules

File: `monitoring/blackbox.yml`

```yaml
modules:
  http_2xx:
    prober: http
    timeout: 10s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
      valid_status_codes: [200]
      method: GET
      follow_redirects: true
      preferred_ip_protocol: ip4
      tls_config:
        insecure_skip_verify: false

  http_post_2xx:
    prober: http
    timeout: 10s
    http:
      method: POST
      valid_status_codes: [200, 204]

  tcp_connect:
    prober: tcp
    timeout: 5s
```

### 3.3 Prometheus scrape config

```yaml
scrape_configs:
  - job_name: blackbox
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
          - https://ishbor.uz
          - https://api.ishbor.uz/health/ready
          - https://cdn.ishbor.uz
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

### 3.4 Probe schedule and targets

| Target | Module | Interval | Alert |
|--------|--------|----------|-------|
| `https://ishbor.uz` | http_2xx | 60s | P0 if fail 2 min |
| `https://api.ishbor.uz/health/ready` | http_2xx | 60s | P0 if fail 2 min |
| `https://cdn.ishbor.uz` | http_2xx | 300s | P2 if fail 10 min |
| `https://ishbor.uz/status` | http_2xx | 300s | P2 if fail 10 min |

Key metrics:

- `probe_success` — 1 = up, 0 = down
- `probe_duration_seconds` — response time
- `probe_ssl_earliest_cert_expiry` — certificate expiry timestamp

---

## 4. Extended synthetic checks (staging)

Complex flows run on staging via cron script — not production blackbox:

| Check | Frequency | Script |
|-------|-----------|--------|
| Auth flow | 15 min | login → session cookie → logout |
| Marketplace browse | 5 min | GET `/v1/projects`, `/v1/services` |
| Checkout smoke | 30 min | Full escrow fund with Payme sandbox |
| WebSocket ping | 5 min | Connect `wss://staging-api.ishbor.uz/ws` |
| MinIO health | 5 min | GET `minio:9000/minio/health/live` (internal) |

Results posted to `#ishbor-staging` Telegram channel.

---

## 5. Public status page — `/status`

### 5.1 Route

Frontend route: `src/routes/status.tsx`  
URL: `https://ishbor.uz/status`  
Language: Uzbek  
Meta: `noindex` — not for SEO

### 5.2 Data source

Server function `getHealth` (`src/lib/api/health.functions.ts`):

```typescript
return {
  status: database === "error" ? "degraded" : "ok",
  version: "1.0.0",
  environment: config.nodeEnv,
  database: "connected" | "unconfigured" | "error",
  timestamp: ISO8601,
};
```

Production target: extend to call `https://api.ishbor.uz/health/ready` when `API_MODE=remote`.

### 5.3 UI components

| Row | Label (UZ) | Values |
|-----|------------|--------|
| API | API | "Ishlayapti" / "Cheklangan" |
| Database | Ma'lumotlar bazasi | "Ulangan" / "Xatolik" |
| Last check | Oxirgi tekshiruv | Auto-refresh 30s |

Features:

- Auto-refetch every 30 seconds
- Offline banner when browser loses connectivity
- Manual "Yangilash" refresh button
- Error state with retry

### 5.4 Status page during incidents

On-call updates status by deploying incident banner (P0 >15 min):

Option A — environment flag:

```bash
MAINTENANCE_MODE=true  # nginx serves static maintenance for checkout
# Status page shows incident message via system_config
```

Option B — manual frontend deploy with incident banner component.

Incident message template:

```
⚠️ Vaqtincha nosozlik
Ba'zi xizmatlar vaqtincha mavjud emas. Jamoamiz muammoni hal qilmoqda.
Yangilanish: [HH:MM Toshkent vaqti]
```

### 5.5 getReady server function

Used for readiness gating (not displayed on public page):

```typescript
// Returns { ready: boolean, mode: "demo" | "database" }
```

Demo mode when `DATABASE_URL` unset — local development only.

---

## 6. Admin system health

`/admin/system` — admin-only dashboard with real probe data:

| Service | Check | Source |
|---------|-------|--------|
| API | /health/ready latency | Prometheus |
| PostgreSQL | connections, lag | postgres_exporter |
| Redis | PING, memory | redis_exporter |
| MinIO | cluster health | minio metrics |
| Payme/Humo | sandbox ping | Celery health task |
| Email (Resend) | API status | Celery health task |
| SMS (Eskiz) | token valid | Celery health task |
| Celery | queue depths | celery_exporter |
| Disk | usage % | node_exporter |

Maps mock data to live Prometheus queries in production.

---

## 7. External uptime services (optional)

Self-hosted blackbox is primary. Optional secondary:

| Service | Purpose | Config |
|---------|---------|--------|
| UptimeRobot (free tier) | External perspective if VPS network blind | Monitor ishbor.uz + api health |
| Better Stack | Status page hosting P2 | Public subdomain |

Configure external monitors to alert different channel — detects VPS total outage where internal Prometheus also down.

---

## 8. SLA targets (beta)

| Metric | Target |
|--------|--------|
| API availability | 99.5% monthly |
| `/health/ready` probe success | 99.9% |
| Status page accuracy | Reflects actual state within 60s |
| Planned maintenance notice | 24h advance on /status |

Track via Prometheus:

```promql
avg_over_time(probe_success{instance="https://api.ishbor.uz/health/ready"}[30d])
```

---

## 9. Verification checklist

- [ ] `curl https://api.ishbor.uz/health/ready` returns 200 with db+redis ok
- [ ] Blackbox `probe_success` = 1 for all targets in Grafana
- [ ] `/status` page loads and auto-refreshes
- [ ] Stop redis container → `/health/ready` returns 503 within 60s
- [ ] Alert `ApiHealthCheckFailed` fires in Telegram
- [ ] SSL expiry alert configured (>14 days warning)
- [ ] Staging synthetic auth cron running

---

## 10. Related documents

- [ALERTING_RULES.md](./ALERTING_RULES.md)
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
- [../11-backend/MONITORING_ARCHITECTURE.md](../11-backend/MONITORING_ARCHITECTURE.md)
- [../11-backend/infrastructure/NGINX_ARCHITECTURE.md](../11-backend/infrastructure/NGINX_ARCHITECTURE.md)
- [../14-production/OBSERVABILITY_RUNBOOK.md](../14-production/OBSERVABILITY_RUNBOOK.md)

---

*Blackbox probes every 60s: ishbor.uz + api.ishbor.uz/health/ready. Public status at /status with 30s auto-refresh. P0 alert if probe fails 2 minutes.*
