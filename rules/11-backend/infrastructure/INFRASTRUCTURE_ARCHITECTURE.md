# INFRASTRUCTURE_ARCHITECTURE.md

**Deployment model:** Self-hosted VPS in Uzbekistan / Central Asia region  
**Stack:** Nginx + FastAPI (×2) + PostgreSQL 16 + Redis 7 + MinIO + Celery workers  
**Domain:** ishbor.uz / api.ishbor.uz  
**No Supabase, no Neon, no Fly.io** — full control on VPS

---

## 1. Topology overview

```
                         Internet
                            │
                    ┌───────▼───────┐
                    │    Nginx      │  :443 TLS (certbot)
                    │  reverse proxy│  rate limits, CSP headers
                    └───┬───────┬───┘
                        │       │
           ┌────────────┘       └────────────┐
           ▼                                 ▼
    ┌─────────────┐                   ┌─────────────┐
    │  Frontend   │                   │  FastAPI    │
    │  Nitro SSR  │                   │  api ×2     │
    │  :3000      │                   │  :8000      │
    └─────────────┘                   └──────┬──────┘
                                             │
              ┌──────────────────────────────┼──────────────────┐
              ▼              ▼               ▼                  ▼
       ┌────────────┐ ┌────────────┐ ┌────────────┐      ┌────────────┐
       │ PostgreSQL │ │   Redis    │ │   MinIO    │      │   Celery   │
       │    :5432   │ │   :6379    │ │   :9000    │      │  workers   │
       └────────────┘ └────────────┘ └────────────┘      └────────────┘
```

All services run on same VPS via Docker Compose (production) or multi-VPS split at scale phase.

---

## 2. Service inventory

| Service | Image | Replicas | Purpose |
|---------|-------|----------|---------|
| nginx | nginx:1.25-alpine | 1 | TLS termination, reverse proxy, static cache |
| frontend | ishbor-frontend:latest | 1 | TanStack Start / Nitro SSR |
| api | ishbor-api:latest | 2 | FastAPI REST + WebSocket gateway |
| postgres | postgres:16-alpine | 1 | Primary database |
| redis | redis:7-alpine | 1 | Sessions, cache, rate limits, Celery broker |
| minio | minio/minio:latest | 1 | S3-compatible object storage |
| celery-worker | ishbor-api:latest | 2 | Background jobs |
| celery-beat | ishbor-api:latest | 1 | Scheduled tasks |
| clamav | clamav/clamav:latest | 1 | Virus scanning sidecar |
| prometheus | prom/prometheus:latest | 1 | Metrics collection (P1) |
| grafana | grafana/grafana:latest | 1 | Dashboards (P1) |

---

## 3. Network zones

| Zone | Services | Exposure |
|------|----------|----------|
| Public | nginx :443 | Internet |
| Application | frontend, api | nginx upstream only |
| Data | postgres, redis, minio | Docker internal network only |
| Monitoring | prometheus, grafana | VPN or admin IP allowlist |

Docker network: `ishbor-internal` (bridge). No data service ports published to host except via nginx where needed.

---

## 4. Environments

| Env | Host | Purpose |
|-----|------|---------|
| local | developer machine | docker compose minimal |
| staging | staging.ishbor.uz | QA, Payme/Humo sandbox |
| production | ishbor.uz | Live traffic |

Separate VPS per environment recommended. Separate PostgreSQL databases, MinIO buckets, Redis instances — no shared data.

---

## 5. DNS records

| Record | Target |
|--------|--------|
| ishbor.uz | A → VPS IP |
| www.ishbor.uz | CNAME → ishbor.uz |
| api.ishbor.uz | A → VPS IP |
| staging.ishbor.uz | A → staging VPS |
| staging-api.ishbor.uz | A → staging VPS |
| cdn.ishbor.uz | A → VPS (MinIO public bucket via nginx) |

Optional: Cloudflare proxy in front for DDoS — origin certificate on nginx.

---

## 6. Data flow — request lifecycle

```
1. User → https://ishbor.uz/projects
2. Nginx → frontend:3000 (SSR)
3. Frontend API call → https://api.ishbor.uz/v1/projects
4. Nginx → api:8000 (round-robin 2 instances)
5. FastAPI → PostgreSQL query + Redis cache
6. Response JSON → frontend render
```

WebSocket: `wss://api.ishbor.uz/ws` — nginx upgrade headers → sticky upstream by IP or cookie.

---

## 7. Background processing

Celery workers handle:

| Queue | Jobs |
|-------|------|
| `default` | Email, notifications |
| `payments` | Webhook retry, reconciliation, withdrawals |
| `media` | Image resize, virus scan |
| `maintenance` | Backups, cleanup, archival |

Broker: Redis DB 1. Result backend: Redis DB 2.

Beat schedule: subscription renewal, reconciliation, backup triggers — see DOCKER_COMPOSE_STRUCTURE.md.

---

## 8. Storage architecture

| Data type | Store | Backup |
|-----------|-------|--------|
| Relational | PostgreSQL | pg_dump daily + WAL |
| Cache/sessions | Redis | RDB snapshot hourly |
| Files | MinIO | mc mirror daily |
| Secrets | .env on VPS | Ansible vault / manual |

See [BACKUP_STRATEGY.md](./BACKUP_STRATEGY.md), [../minio/MINIO_ARCHITECTURE.md](../minio/MINIO_ARCHITECTURE.md).

---

## 9. Provider selection (Uzbekistan)

| Provider | Location | Use case |
|----------|----------|----------|
| Selectel Tashkent | UZ | Primary — low latency to local users |
| Hetzner Helsinki | FI | Secondary — cost-effective EU |
| Local ISP VPS | UZ | Compliance-sensitive deployments |

**Latency target:** <50ms API TTFB for Tashkent users with UZ-hosted VPS.

Data residency: PostgreSQL and MinIO on UZ VPS — document in privacy policy.

---

## 10. Scaling path

| Phase | Users | Architecture |
|-------|-------|--------------|
| Beta | <2k | Single VPS (8 vCPU, 16GB) |
| Growth | 2k–20k | Split DB to dedicated VPS |
| Scale | 20k+ | Read replica, Redis Sentinel, MinIO distributed |

Horizontal: add api replicas behind nginx. Vertical: upgrade VPS before split.

---

## 11. Cost estimate (single VPS beta)

| Item | ~USD/mo |
|------|---------|
| VPS 8 vCPU / 16GB (Selectel) | $40–60 |
| Domain ishbor.uz | $3 |
| Resend email | $0–20 |
| Eskiz SMS | $10 |
| Payme merchant | per transaction |
| Backups (offsite S3) | $5 |
| **Total** | **~$60–100/mo** |

No managed DB markup — self-hosted PostgreSQL.

---

## 12. Related documents

- [SERVER_ARCHITECTURE.md](./SERVER_ARCHITECTURE.md)
- [NGINX_ARCHITECTURE.md](./NGINX_ARCHITECTURE.md)
- [DOCKER_ARCHITECTURE.md](./DOCKER_ARCHITECTURE.md)
- [DOCKER_COMPOSE_STRUCTURE.md](./DOCKER_COMPOSE_STRUCTURE.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [CI_CD_PIPELINE.md](./CI_CD_PIPELINE.md)
- [ENVIRONMENT_STRATEGY.md](./ENVIRONMENT_STRATEGY.md)
- [LOGGING_ARCHITECTURE.md](./LOGGING_ARCHITECTURE.md)
- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)
- [BACKUP_STRATEGY.md](./BACKUP_STRATEGY.md)
- [EMAIL_ARCHITECTURE.md](./EMAIL_ARCHITECTURE.md)
- [SMS_ARCHITECTURE.md](./SMS_ARCHITECTURE.md)

---

*Self-hosted VPS gives Ishbor full control over payment data residency and eliminates vendor lock-in to serverless platforms.*
