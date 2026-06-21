# DEPLOYMENT_ARCHITECTURE.md

**Stack:** GitHub → GitHub Actions → Fly.io (API) + Nitro (frontend) + Neon migrations

---

## 1. Repository structure (post-implementation)

```
ishbor-marketplace/
├── src/                    # Frontend (existing)
├── server/                 # NEW: API routes, services, middleware
│   ├── api/v1/             # REST handlers
│   ├── ws/                 # WebSocket gateway
│   ├── services/           # Domain services
│   ├── repositories/       # DB access (Drizzle)
│   ├── workers/            # BullMQ job processors
│   └── lib/                # Shared server utils
├── packages/
│   └── db/                 # Drizzle schema + migrations
├── docker/
│   ├── Dockerfile.api
│   └── Dockerfile.worker
├── fly.toml
└── .github/workflows/
    ├── ci.yml
    ├── deploy-staging.yml
    └── deploy-production.yml
```

---

## 2. CI pipeline (`ci.yml`)

Triggers: PR + push to main

```yaml
jobs:
  lint:
    - npm run lint
  typecheck:
    - tsc --noEmit
  build:
    - npm run build
  test:
    - npm run test          # unit + integration
  migrate-check:
    - drizzle-kit check     # migration drift
  security:
    - npm audit --audit-level=high
```

**Gate:** All jobs pass before merge.

---

## 3. Staging deploy

Trigger: push to `main`

```
1. Build Docker image (API + worker)
2. Run migrations against staging DATABASE_URL
3. Deploy API to Fly.io staging
4. Deploy worker to Fly.io staging
5. Deploy frontend to staging.ishbor.uz
6. Smoke test: /health, /auth/session, GET /projects
7. Notify Slack
```

---

## 4. Production deploy

Trigger: manual approval OR tag `v*`

```
1. Require staging green <24h
2. Database migration (expand-only pattern)
3. Blue-green deploy API (Fly.io)
4. Deploy worker
5. Deploy frontend
6. Run synthetic checkout test
7. Monitor error rate 15 min — auto-rollback if >1%
```

---

## 5. Database migrations

| Rule | Detail |
|------|--------|
| Tool | Drizzle Kit |
| Naming | `YYYYMMDDHHMMSS_description.sql` |
| Expand-contract | Add columns nullable first, backfill, then enforce |
| Rollback | Forward-only — write down migration separately |
| Seed | `016_seed_demo_data.sql` staging only |

**Never** run destructive migrations without backup.

---

## 6. Feature flags

| Flag | Purpose |
|------|---------|
| `API_MODE=remote` | Frontend uses API vs localStorage |
| `ENABLE_WEBSOCKET` | Gradual realtime rollout |
| `ENABLE_PAYME` | Payment gateway |
| `ALLOW_DEMO_AUTH` | Demo accounts staging only |

Stored in env + optional `system_config` table for runtime toggles.

---

## 7. Health checks

| Endpoint | Checks |
|----------|--------|
| GET /health | 200 OK |
| GET /health/ready | DB + Redis connectivity |
| GET /health/live | Process alive |

Fly.io uses `/health/ready` for routing.

---

## 8. Rollback procedure

| Component | Rollback |
|-----------|----------|
| API | `fly releases rollback` |
| Frontend | Redeploy previous artifact |
| Migrations | Run compensating migration (not auto-rollback) |
| Feature flag | Disable `API_MODE=remote` → fallback localStorage (emergency only) |

---

## 9. Local development

```bash
# Start dependencies
docker compose up -d postgres redis

# Migrate
npm run db:migrate

# Seed demo
npm run db:seed

# Dev (frontend + API)
npm run dev          # TanStack Start
npm run dev:api      # API server :3001
npm run dev:worker   # BullMQ worker
```

`docker-compose.yml`:
- postgres:16
- redis:7
- minio (S3 local)

---

## 10. Environment promotion

```
local → staging (auto on main) → production (manual approve)
```

Config diff reviewed in deploy PR template.

---

*No deployment code until implementation phase per user instruction.*
