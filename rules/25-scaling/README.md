# Ishbor Scaling Documentation

**Purpose:** Growth-phase architecture for Ishbor marketplace — 1k → 10k → 100k users  
**Region:** Uzbekistan / Central Asia · **Stack:** FastAPI · PostgreSQL · Redis · MinIO · Nginx

---

## Context

Ishbor's demo MVP hits ceilings at localStorage scale (~5–10 MB, single browser). Production backend ([11-backend/](../11-backend/README.md)) enables horizontal growth. This folder defines **when and how** to scale each layer.

---

## Reading order

| # | Document | Focus |
|---|----------|-------|
| 1 | [SCALING_STRATEGY.md](./SCALING_STRATEGY.md) | Growth phases, triggers, costs |
| 2 | [MULTI_SERVER_ARCHITECTURE.md](./MULTI_SERVER_ARCHITECTURE.md) | Horizontal API, WS, DB replicas |
| 3 | [CDN_STRATEGY.md](./CDN_STRATEGY.md) | Static assets, MinIO public bucket |
| 4 | [CACHING_STRATEGY.md](./CACHING_STRATEGY.md) | Redis layers, CDN, browser headers |

---

## Scale targets

| Phase | Users | Concurrent | Orders/day | Infra |
|-------|-------|------------|------------|-------|
| Beta | 1,000 | 100 | 100 | Single VPS |
| Launch | 10,000 | 1,000 | 1,000 | 2 API + replica |
| Growth | 100,000 | 10,000 | 10,000 | Multi-node + CDN |

---

## Related docs

| Doc | Link |
|-----|------|
| Backend scalability | [SCALABILITY_ARCHITECTURE.md](../11-backend/SCALABILITY_ARCHITECTURE.md) |
| Load testing | [LOAD_TEST_PLAN.md](../22-testing/LOAD_TEST_PLAN.md) |
| Redis | [REDIS_ARCHITECTURE.md](../11-backend/redis/REDIS_ARCHITECTURE.md) |
| PostgreSQL | [DATABASE_PERFORMANCE.md](../11-backend/postgresql/DATABASE_PERFORMANCE.md) |
| Launch | [BETA_LAUNCH_PLAN.md](../24-launch/BETA_LAUNCH_PLAN.md) |

---

## Principles

1. **Scale when metrics say so** — not prematurely
2. **Stateless API** — session in Redis/Postgres, not server memory
3. **Cache invalidation over cache absence** — marketplace data changes on publish events
4. **Money path never cached** — wallet, escrow always fresh
5. **Uzbekistan latency** — CDN PoP or regional VPS (Hetzner FI / Selectel)

---

*Update after each growth phase milestone.*
