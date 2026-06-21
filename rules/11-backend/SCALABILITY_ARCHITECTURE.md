# SCALABILITY_ARCHITECTURE.md

**Context:** Target 1,000 concurrent users (Phase 29D) → 100,000+ (production)

---

## 1. Current frontend limits (why backend required)

| Limitation | Ceiling | Backend solution |
|------------|---------|------------------|
| localStorage | ~5-10 MB | PostgreSQL |
| No sync | Single browser | Central DB |
| Mock merge | Stale/inconsistent | Single source of truth |
| Client ranking | CPU on client | Server cron + cache |
| 100+ messages | DOM lag (mitigated pagination) | WS + cursor pagination |
| Stress seed | Manual QA only | Load testing infrastructure |

---

## 2. Scale targets by phase

| Phase | Users | Orders/day | Messages/day | DB size |
|-------|-------|------------|--------------|---------|
| Beta | 1,000 | 100 | 5,000 | 10 GB |
| Launch | 10,000 | 1,000 | 50,000 | 100 GB |
| Growth | 100,000 | 10,000 | 500,000 | 1 TB |

---

## 3. Database scaling

| Technique | When |
|-----------|------|
| Connection pooling | Day 1 — PgBouncer via Neon |
| Read replicas | >5k concurrent reads |
| Partitioning | analytics_events, audit_logs, wallet_transactions by month |
| Indexes | All foreign keys + search FTS (see DATABASE_SCHEMA) |
| Materialized views | freelancer_stats, marketplace rankings — refresh 15min |
| Archival | wallet_transactions >2yr → cold storage |

**Search scale path:**
- Phase 1: PostgreSQL `pg_trgm` + FTS
- Phase 2: OpenSearch/Meilisearch for marketplace search

---

## 4. Application scaling

| Component | Scale strategy |
|-----------|----------------|
| API (Nitro) | Horizontal — stateless behind load balancer |
| WebSocket | Horizontal — Redis pub/sub |
| Workers (BullMQ) | Horizontal — increase worker count |
| Redis | Redis Cluster at high scale |
| CDN | Static assets + public images |

**Auto-scaling trigger:** CPU >70% for 5 min → +1 instance (max 10).

---

## 5. Caching strategy

| Cache | TTL | Invalidation |
|-------|-----|--------------|
| Public freelancer list | 60s | Ranking refresh |
| Service detail | 120s | On service update event |
| Session | Redis — session TTL | Logout |
| Search results | 30s | On publish events |
| User wallet | No cache — always fresh | WS update |

---

## 6. Rate limits (protection = scale)

See API_SPECIFICATION.md — prevents abuse-driven load.

---

## 7. Queue throughput

| Queue | Expected peak | Workers |
|-------|---------------|---------|
| notifications | 500/min | 2 |
| email | 100/min | 2 |
| analytics | 2000/min | 3 |
| search | 200/min | 2 |
| realtime | 1000/min | 4 |

Backpressure: queue depth >1000 → alert, scale workers.

---

## 8. WebSocket scale

| Metric | Target |
|--------|--------|
| Connections per gateway | 50,000 |
| Message fan-out latency | <100ms p99 |
| Redis pub/sub channels | Partition by userId hash |

---

## 9. Storage scale

| Asset | Estimate @ 10k users |
|-------|---------------------|
| Portfolio images | 500 GB |
| KYC documents | 50 GB (private) |
| Message attachments | 200 GB |

R2 lifecycle: move to infrequent access after 90 days.

---

## 10. Performance budgets

| Endpoint | p95 target |
|----------|------------|
| GET /projects | 200ms |
| GET /services/:slug | 150ms |
| POST /checkout/confirm | 500ms (includes TX) |
| WS message delivery | 100ms |
| Search | 300ms |

---

## 11. Load testing plan

| Tool | Scenario |
|------|----------|
| k6 | 1000 VU browse + checkout |
| k6 | 500 concurrent WS connections |
| pg stress | 10k inserts/min analytics |

Run before each major release.

---

*Addresses Phase 29D "1000 users" failure points and FUTURE_ROADMAP P0 #3.*
