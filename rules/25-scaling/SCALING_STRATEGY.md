# SCALING_STRATEGY.md

**Ishbor marketplace — growth phases from 1k to 100k users**  
**North star:** Platform liquidity without compromising escrow integrity or Uzbek UX quality

---

## 1. Why scale matters for Ishbor

Ishbor is a **two-sided marketplace** — clients post projects, freelancers apply, escrow protects payments. Growth creates asymmetric load:

| Side | Load pattern |
|------|--------------|
| Browse (guest) | Read-heavy, cacheable |
| Dashboard (auth) | Mixed read/write |
| Checkout/escrow | Write-heavy, transactional |
| Messages/WS | Persistent connections |
| AI proxy | CPU + external API latency |
| Admin | Low volume, high privilege |

Scaling must preserve **trust** (accurate balances, real-time messages) while keeping browse fast for Uzbekistan mobile users.

---

## 2. Growth phases

### Phase 1 — Beta (0 → 1,000 users)

**Timeline:** Months 1–3 post-staging  
**Concurrent target:** 100  
**Orders/day:** 100

| Component | Sizing |
|-----------|--------|
| VPS | 1× 8 vCPU, 16 GB RAM |
| PostgreSQL | Single instance, 100 GB SSD |
| Redis | Single 2 GB |
| MinIO | Co-located, 200 GB |
| FastAPI workers | 4 |
| Celery workers | 2 |

**Triggers to plan Phase 2:**

- CPU sustained >60% for 1 week
- DB connections >70% pool
- p95 API latency >800ms browse
- 800+ registered users

**Cost estimate:** $80–120/month VPS

---

### Phase 2 — Launch (1k → 10,000 users)

**Timeline:** Months 4–12  
**Concurrent target:** 1,000  
**Orders/day:** 1,000

| Component | Sizing |
|-----------|--------|
| API servers | 2× 4 vCPU (behind Nginx LB) |
| PostgreSQL | Primary + 1 read replica |
| Redis | 4 GB, persistence enabled |
| MinIO | Dedicated volume 500 GB |
| Celery | 4 workers |
| CDN | Cloudflare free/pro (optional) |

**Architecture changes:**

- Horizontal FastAPI instances (stateless)
- Read replica for public lists, search, profiles
- Redis cache for hot entities (see CACHING_STRATEGY.md)
- WebSocket sticky sessions or Redis pub/sub
- PgBouncer connection pooling (transaction mode)
- Materialized views for freelancer rankings (15-min refresh)

**Triggers to plan Phase 3:**

- 8,000+ MAU
- Read replica lag >5s consistently
- Redis memory >75%
- k6 1000 VU test p95 degrading
- WS connections >5,000

**Cost estimate:** $300–500/month

---

### Phase 3 — Growth (10k → 100,000 users)

**Timeline:** Year 2+  
**Concurrent target:** 10,000  
**Orders/day:** 10,000

| Component | Sizing |
|-----------|--------|
| API servers | 4–10 auto-scaled |
| PostgreSQL | Primary + 2–3 read replicas |
| Redis | Redis Cluster or 8 GB sentinel |
| Search | Meilisearch/OpenSearch dedicated node |
| MinIO | Clustered or S3-compatible cloud |
| CDN | Cloudflare Pro/Business |
| Queue | Dedicated Celery cluster |

**Architecture changes:**

- Table partitioning: `analytics_events`, `audit_logs`, `wallet_transactions` by month
- Dedicated search engine (pg_trgm insufficient)
- Separate WS gateway tier
- AI request queue with backpressure
- Multi-region CDN for Central Asia
- Database archival: transactions >2yr to cold storage

**Triggers beyond 100k:**

- Sharding consideration (unlikely before 500k)
- Multi-region active-active (Kazakhstan expansion)

**Cost estimate:** $2,000–5,000/month

---

## 3. Scaling metrics dashboard

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| API CPU | >60% 15min | >80% 5min | +1 instance |
| API p95 latency | >500ms | >2s | Profile + cache |
| DB CPU | >70% | >85% | Replica + query opt |
| DB connections | >70% pool | >90% | PgBouncer + pool size |
| Redis memory | >70% | >90% | Eviction tune / scale |
| Redis hit rate | <50% | <30% | Cache strategy review |
| WS connections | >5k/instance | >10k | WS tier scale |
| Disk usage | >70% | >85% | Expand / archive |
| Celery queue depth | >500 | >2000 | +workers |
| Error rate 5xx | >0.5% | >2% | Incident |

---

## 4. Scaling by subsystem

### Browse / discovery

| Phase | Strategy |
|-------|----------|
| 1 | PostgreSQL + basic indexes |
| 2 | Redis cache 60s TTL + read replica |
| 3 | CDN edge cache + search engine |

Bottleneck: FTS on projects/services — migrate to Meilisearch at Phase 2 exit.

### Auth / sessions

| Phase | Strategy |
|-------|----------|
| 1 | Postgres sessions + Redis cache |
| 2 | Redis-primary session reads |
| 3 | Session shard by user_id hash |

Never scale auth by disabling rate limits.

### Payments / escrow

| Phase | Strategy |
|-------|----------|
| All | Single primary DB writer — **no read replica** for money |
| 2+ | Dedicated connection pool for payment service |
| 3 | Partition wallet_transactions, async reconciliation workers |

Scale **vertically** on primary DB before sharding money tables.

### Messages / notifications

| Phase | Strategy |
|-------|----------|
| 1 | WS single instance |
| 2 | Redis pub/sub multi-instance |
| 3 | Dedicated WS nodes, cursor pagination |

### AI proxy

| Phase | Strategy |
|-------|----------|
| 1 | Sync requests, rate limited |
| 2 | Celery queue for long generations |
| 3 | Dedicated AI worker pool, provider load balancing |

Cost scales with tokens — enforce AI_USAGE_LIMITS strictly.

---

## 5. Auto-scaling rules (Phase 2+)

```text
IF api_cpu_avg > 70% FOR 5 min THEN scale_up (+1 instance, max 10)
IF api_cpu_avg < 30% FOR 30 min THEN scale_down (-1 instance, min 2)
IF celery_queue_depth > 1000 FOR 10 min THEN +2 celery workers
```

Implement via Docker Swarm, Kubernetes, or VPS API + cron (start conservative).

---

## 6. Data growth projections

| Phase | DB size | Messages | Files (MinIO) |
|-------|---------|----------|---------------|
| 1k users | 10 GB | 500K rows | 50 GB |
| 10k users | 100 GB | 5M rows | 500 GB |
| 100k users | 1 TB | 50M rows | 5 TB |

**Archival policy (Phase 3):**

- Analytics events >90 days → aggregate + archive
- Audit logs >1 year → cold storage
- Wallet transactions >2 years → read-only archive DB

---

## 7. Geographic strategy (Uzbekistan)

| Concern | Approach |
|---------|----------|
| Latency to Tashkent | VPS in EU (Hetzner Helsinki) ~80ms acceptable; consider Selectel if >150ms |
| CDN | Cloudflare PoPs in Tbilisi/Frankfurt |
| SMS | Eskiz local — no scale concern |
| Payments | Payme/Uzcard — respect provider rate limits |
| Regulatory | Data residency review before Kazakhstan expansion |

---

## 8. Team scaling alignment

| Users | Engineering focus |
|-------|-----------------|
| 1k | Backend completion, E2E, beta feedback |
| 10k | Performance, search, mobile polish |
| 100k | SRE, data platform, fraud prevention |

---

## 9. Load test gates per phase

| Phase | k6 scenario | Must pass |
|-------|-------------|-----------|
| Beta exit | browse 200 VU | p95 <500ms |
| Launch exit | mixed 1000 VU | SLOs in LOAD_TEST_PLAN |
| Growth | mixed 5000 VU + WS 2000 | Custom SLO review |

---

## 10. Cost vs revenue check

At 10k users with 5% on 1,000 UZS avg order (illustrative):

| Stream | Monthly estimate |
|--------|------------------|
| Platform fee 5% | Scales with GMV |
| Subscriptions (5% conversion Pro) | ~49.5M UZS |
| AI credits | Variable |
| Infra cost | ~$400 |
| LLM cost | Monitor tokens — cap per AI_USAGE_LIMITS |

Ensure LLM cost <10% subscription revenue at scale.

---

## 11. Anti-patterns (do not)

| Anti-pattern | Why |
|--------------|-----|
| Cache wallet balance | Stale money display |
| Scale DB writes horizontally without expertise | Escrow integrity risk |
| Unlimited AI on free tier | Cost bankruptcy |
| Skip load test before marketing spike | Viral collapse |
| localStorage at scale | Already replaced — never regress |

---

## 12. References

- [MULTI_SERVER_ARCHITECTURE.md](./MULTI_SERVER_ARCHITECTURE.md)
- [CACHING_STRATEGY.md](./CACHING_STRATEGY.md)
- [CDN_STRATEGY.md](./CDN_STRATEGY.md)
- [LOAD_TEST_PLAN.md](../22-testing/LOAD_TEST_PLAN.md)
- [SCALABILITY_ARCHITECTURE.md](../11-backend/SCALABILITY_ARCHITECTURE.md)

---

*Last updated: 2026-06-20*
