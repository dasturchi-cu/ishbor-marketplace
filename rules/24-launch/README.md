# Ishbor Launch Documentation

**Purpose:** Phased rollout, production go-live, rollback, and incident response for ishbor.uz  
**Region:** Uzbekistan first · **Stack:** Docker · FastAPI · PostgreSQL · Redis · MinIO · Nginx

---

## Scope

This folder governs the transition from **demo MVP (localStorage)** to **production marketplace** serving real clients, freelancers, and agencies in Uzbekistan.

| Phase | Environment | Users |
|-------|-------------|-------|
| Demo | Local / preview | Developers, investors |
| Closed beta | staging.ishbor.uz | 50–200 invited |
| Open beta | beta.ishbor.uz | 1,000 target |
| Production | ishbor.uz | Public |

---

## Reading order

| # | Document | When |
|---|----------|------|
| 1 | [BETA_LAUNCH_PLAN.md](./BETA_LAUNCH_PLAN.md) | Planning rollout |
| 2 | [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | Go-live week |
| 3 | [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) | Deploy failure |
| 4 | [INCIDENT_PLAYBOOK.md](./INCIDENT_PLAYBOOK.md) | Production incident |

---

## Dependencies

| Area | Doc |
|------|-----|
| Backend deploy | [DEPLOYMENT_GUIDE.md](../11-backend/infrastructure/DEPLOYMENT_GUIDE.md) |
| Environments | [ENVIRONMENT_STRATEGY.md](../11-backend/infrastructure/ENVIRONMENT_STRATEGY.md) |
| Pre-launch QA | [LAUNCH_CHECKLIST.md](../06-quality/LAUNCH_CHECKLIST.md) |
| Testing gates | [22-testing/](../22-testing/README.md) |
| Monitoring | [MONITORING_ARCHITECTURE.md](../11-backend/MONITORING_ARCHITECTURE.md) |

---

## Launch principles

1. **No ship with dead buttons** — PROJECT_BIBLE quality gate
2. **Audit → Fix → Retest → Verify** for every launch blocker
3. **Demo auth disabled** in production (`ALLOW_DEMO_AUTH=false`)
4. **Escrow test** with real payment sandbox before public beta
5. **Uzbek-first** — all user-facing copy verified
6. **Rollback ready** — every deploy has documented rollback path

---

## Roles

| Role | Responsibility |
|------|----------------|
| Launch lead | Go/no-go decision |
| Backend lead | API, DB migrations, deploy |
| Frontend lead | Nitro build, CDN assets |
| DevOps | Docker, Nginx, SSL, monitoring |
| Support lead | Beta user comms, incident triage |
| Founder | Beta invites, Uzbekistan partnerships |

---

## Communication channels

| Channel | Use |
|---------|-----|
| `#launch-war-room` | Deploy day |
| `status.ishbor.uz` | Public status page (target) |
| `@ishbor_uz` Telegram | User announcements |
| Email waitlist | Beta invites |

---

## Success metrics (beta)

| Metric | Target |
|--------|--------|
| First escrow transaction | Week 1 |
| Registered users | 500 by week 4 |
| D7 retention | >30% |
| Critical incidents | 0 unresolved >4h |
| E2E journey pass | 100% |

---

*Coordinate with 14-production/ for ongoing stability after launch.*
