# BACKEND_IMPLEMENTATION_MASTER_PLAN.md

**Status:** Architecture documentation complete — **FastAPI implementation NOT started**  
**Prerequisite:** All docs in `rules/11-backend/` reviewed ([DOCUMENTATION_COMPLETENESS_REPORT.md](./DOCUMENTATION_COMPLETENESS_REPORT.md))  
**Stack:** FastAPI · PostgreSQL 16 · Redis · MinIO · Celery · Docker · Nginx · VPS  
**Estimated duration:** 16–20 weeks (1 senior backend + 1 fullstack)

---

## Phase 0 — Foundation (Week 1–2)

**Docs:** [fastapi/FASTAPI_ARCHITECTURE.md](./fastapi/FASTAPI_ARCHITECTURE.md), [postgresql/MIGRATION_STRATEGY.md](./postgresql/MIGRATION_STRATEGY.md), [infrastructure/DOCKER_COMPOSE_STRUCTURE.md](./infrastructure/DOCKER_COMPOSE_STRUCTURE.md)

### Database
- [ ] Initialize `backend/` Python project with FastAPI + SQLAlchemy 2.0 async
- [ ] Alembic revision 001–005: extensions, users, auth, profiles
- [ ] Alembic 006–010: marketplace, commerce, messaging
- [ ] Alembic 011–016: admin, analytics, views, seed
- [ ] PostgreSQL on VPS staging + production (PgBouncer)

### Backend skeleton
- [ ] `backend/app/` structure per FASTAPI_ARCHITECTURE
- [ ] Routers mounted at `/api/v1`
- [ ] Middleware: requestId, auth, rbac, rateLimit, errorHandler
- [ ] Pydantic validation layer
- [ ] Docker compose local (postgres, redis, minio, celery)

### Deliverable
- `GET /health/ready` returns DB+Redis OK
- Demo seed: sardor@asaka.uz, nargiza@ishbor.uz, admin@ishbor.uz

---

## Phase 1 — Auth & sessions (Week 3–4)

**Docs:** [auth/](./auth/), [RBAC_SPECIFICATION.md](./RBAC_SPECIFICATION.md), [security/SECURITY_ARCHITECTURE.md](./security/SECURITY_ARCHITECTURE.md)

- [ ] Registration + login (email/password, bcrypt 12)
- [ ] HttpOnly `ishbor_sid` cookie + Redis session cache
- [ ] Password reset (Resend) + email verification
- [ ] Google OAuth PKCE
- [ ] Active role API
- [ ] Account status enforcement
- [ ] Frontend: proxy TanStack Start → FastAPI for auth
- [ ] Remove `auth-bootstrap.js` when SSR session works

### Exit criteria
- Demo accounts work against real DB on VPS staging
- No localStorage session mirror in production

---

## Phase 2 — Marketplace read (Week 5–6)

**Docs:** [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md), [API_SPECIFICATION.md](./API_SPECIFICATION.md)

- [ ] Projects, services, portfolios CRUD
- [ ] Public freelancer/client profiles
- [ ] Agencies list + detail
- [ ] Search (PostgreSQL FTS + Redis cache)
- [ ] Saved items
- [ ] MinIO presigned uploads ([minio/UPLOAD_FLOW.md](./minio/UPLOAD_FLOW.md))

### Exit criteria
- Guest browse without localStorage
- Create project persists to PostgreSQL

---

## Phase 3 — Commerce core (Week 7–9)

**Docs:** [payments/](./payments/), [EVENT_ARCHITECTURE.md](./EVENT_ARCHITECTURE.md)

- [ ] Applications + subscription limits
- [ ] Orders + checkout
- [ ] Escrow state machine (server-enforced)
- [ ] Wallet double-entry ledger
- [ ] Platform fee 5% + revenue_ledger
- [ ] Celery notification worker (in-app)
- [ ] Humo/Uzcard sandbox integration

### Exit criteria
- Checkout is server-authoritative — client cannot forge balance
- Idempotency-Key on fund/release

---

## Phase 4 — Realtime (Week 10–11)

**Docs:** [websockets/](./websockets/), [NOTIFICATION_ARCHITECTURE.md](./NOTIFICATION_ARCHITECTURE.md)

- [ ] WebSocket gateway (FastAPI + Redis pub/sub)
- [ ] Chat messages + typing + offers
- [ ] Notification push + unread counts
- [ ] Presence system
- [ ] Email (Resend) + SMS (Eskiz) workers

---

## Phase 5 — Admin OS (Week 12–13)

**Docs:** [admin/ADMIN_OS_BACKEND.md](./admin/ADMIN_OS_BACKEND.md), [security/AUDIT_LOG_SYSTEM.md](./security/AUDIT_LOG_SYSTEM.md)

- [ ] Admin RBAC (support, moderator, finance, superadmin)
- [ ] Moderation, disputes, escrow admin actions
- [ ] Audit log on all mutations
- [ ] Founder analytics views

---

## Phase 6 — Monetization & AI (Week 14–15)

- [ ] Subscriptions, credits, referrals, featured listings
- [ ] AI proxy with usage logging + rate limits
- [ ] Job alerts

---

## Phase 7 — Production hardening (Week 16–17)

**Docs:** [infrastructure/DEPLOYMENT_GUIDE.md](./infrastructure/DEPLOYMENT_GUIDE.md), [security/](./security/)

- [ ] Nginx SSL + CSP + rate limits
- [ ] Prometheus/Grafana monitoring
- [ ] Backup automation (postgres + minio)
- [ ] Load test 1k concurrent users
- [ ] Security review per THREAT_MODEL

---

## Phase 8 — Launch (Week 18–20)

- [ ] Production VPS deploy ishbor.uz
- [ ] Frontend `VITE_API_MODE=remote` full cutover
- [ ] Remove mock-data merge from stores
- [ ] DR drill documented in DISASTER_RECOVERY

---

## Ownership

| Area | Owner | Key docs |
|------|-------|----------|
| FastAPI core | Backend lead | fastapi/* |
| PostgreSQL | Backend lead | postgresql/* |
| Payments | Backend + finance | payments/* |
| Infrastructure | DevOps | infrastructure/* |
| Security | Backend lead | security/* |
| Frontend integration | Fullstack | API_SPECIFICATION |
