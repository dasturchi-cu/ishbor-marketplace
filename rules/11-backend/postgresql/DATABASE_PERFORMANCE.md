# DATABASE_PERFORMANCE.md

**Engine:** PostgreSQL 16 on VPS (FastAPI backend)  
**Scale target:** 100,000 MAU  
**Related:** [POSTGRESQL_ARCHITECTURE.md](./POSTGRESQL_ARCHITECTURE.md), [INDEXING_STRATEGY.md](./INDEXING_STRATEGY.md)

---

## 1. Performance objectives

| Metric | Target (p95) | Measurement |
|--------|--------------|-------------|
| Wallet balance read | <10 ms | `GET /wallet` |
| Order list (20 rows) | <25 ms | `GET /orders` |
| Message thread page | <30 ms | `GET /conversations/{id}/messages` |
| Freelancer search | <100 ms | `GET /freelancers?q=` |
| Admin audit query | <200 ms | Filtered 7-day window |
| Migration deploy | <5 min lock window | Alembic CONCURRENTLY |

User-facing timeout: FastAPI returns *"So'rov vaqti tugadi, qayta urinib ko'ring"* at 30s — DB `statement_timeout` set to 25s for app role.

---

## 2. Connection limits

### 2.1 PostgreSQL

```
max_connections = 200
superuser_reserved_connections = 3
```

Effective app concurrency is **not** 200 — PgBouncer multiplexes.

### 2.2 PgBouncer (transaction pooling)

| Setting | Value |
|---------|-------|
| `default_pool_size` | 40 |
| `max_db_connections` | 80 |
| `max_client_conn` | 500 |
| `reserve_pool_size` | 5 |
| `reserve_pool_timeout` | 3 |

### 2.3 FastAPI / SQLAlchemy

| Setting | Value |
|---------|-------|
| Uvicorn workers | 4–8 (2 × CPU cores) |
| `pool_size` per worker | 5 |
| `max_overflow` | 5 |
| `pool_pre_ping` | true |
| `pool_recycle` | 1800 |

**Total app pool:** 8 workers × 10 = 80 client connections → matches PgBouncer `max_db_connections`.

### 2.4 Connection storm prevention

- Health check uses dedicated small pool (max 2)
- BullMQ workers: separate PgBouncer user with `default_pool_size=10`
- Reject requests with `503` + *"Xizmat vaqtincha band"* when PgBouncer queue >100ms

---

## 3. Vacuum & autovacuum

Write-heavy tables: `messages`, `wallet_transactions`, `notifications`, `analytics_events`, `sessions`.

### 3.1 Global autovacuum tuning

```
autovacuum_vacuum_scale_factor = 0.05   # default 0.2 too lazy for messages
autovacuum_analyze_scale_factor = 0.02
autovacuum_max_workers = 4
maintenance_work_mem = 512MB
```

### 3.2 Per-table overrides

| Table | autovacuum_vacuum_scale_factor | autovacuum_analyze_scale_factor | Notes |
|-------|-------------------------------|--------------------------------|-------|
| `messages` | 0.01 | 0.01 | High insert rate |
| `wallet_transactions` | 0.02 | 0.02 | Append-only |
| `notifications` | 0.02 | 0.01 | UPDATE on read |
| `wallets` | 0.05 | 0.05 | HOT updates |
| `sessions` | 0.05 | 0.05 | Expiry deletes |
| `analytics_events` | 0.001 | 0.001 | Partition-level vacuum |

### 3.3 Manual maintenance windows

| Job | Schedule | Action |
|-----|----------|--------|
| Dead tuple check | Weekly | Alert if `n_dead_tup > 10%` on hot tables |
| `VACUUM (ANALYZE)` | Sunday 03:00 UTC | `messages`, `notifications` if autovacuum lagging |
| Session cleanup | Hourly | `DELETE FROM sessions WHERE expires_at < now()` |
| OTP cleanup | Daily | Expired rows >24h |

**Never** run plain `VACUUM FULL` in production without maintenance window — use `pg_repack` for bloat if needed.

---

## 4. Partitioning: `analytics_events`

Append-only, high volume. Partition by **month** on `created_at`.

### 4.1 Parent table

```sql
CREATE TABLE analytics_events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    session_id varchar(64),
    event_type varchar(100) NOT NULL,
    properties jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
```

### 4.2 Partition naming

`analytics_events_2026_06` — RANGE from `2026-06-01` to `2026-07-01`

### 4.3 Lifecycle

| Action | Timing |
|--------|--------|
| Create next month partition | 25th of prior month (pg_cron or deploy job) |
| Detach partition >24 months | Archive to S3 Parquet via logical export |
| DROP detached partition | After archive verified |

### 4.4 Query rules

FastAPI analytics service **must** include `created_at` range in WHERE — enables partition pruning.

Bad: `WHERE event_type = 'page_view'` — scans all partitions  
Good: `WHERE created_at >= $1 AND created_at < $2 AND event_type = $3`

### 4.5 Future candidates for partitioning

| Table | Trigger | Strategy |
|-------|---------|----------|
| `audit_logs` | >50M rows | Monthly range |
| `wallet_transactions` | >10M rows | Monthly range |
| `messages` | >100M rows | Hash on `conversation_id` (8 partitions) |

---

## 5. Materialized views: `freelancer_stats`

Source table `freelancer_stats` is updated via materialized view refresh from orders + reviews aggregates.

### 5.1 View definition (conceptual)

```sql
CREATE MATERIALIZED VIEW mv_freelancer_stats AS
SELECT
    u.id AS user_id,
    COALESCE(AVG(r.rating), 0)::numeric(3,2) AS rating,
    COUNT(r.id)::integer AS review_count,
    CASE
        WHEN AVG(r.rating) >= 4.8 AND COUNT(r.id) >= 50 THEN 'top_rated'
        WHEN AVG(r.rating) >= 4.5 THEN 'expert'
        ELSE 'rising'
    END AS level,
    ...
FROM users u
LEFT JOIN reviews r ON r.reviewee_user_id = u.id
LEFT JOIN orders o ON o.freelancer_user_id = u.id AND o.status = 'completed'
WHERE u.user_type = 'freelancer' AND u.account_status = 'active'
GROUP BY u.id;
```

### 5.2 Refresh strategy

| Method | When |
|--------|------|
| `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_freelancer_stats` | Every 15 minutes via BullMQ cron |
| Targeted refresh | On `order.status → completed` or new review — queue job for single `user_id` update to base table |

**CONCURRENTLY requires:** UNIQUE index on `mv_freelancer_stats(user_id)`

### 5.3 Read path

- Public browse `/freelancers` → reads `mv_freelancer_stats` (stale up to 15 min acceptable)
- Own dashboard `/dashboard/freelancer` → reads live computed stats from base `freelancer_stats` table updated synchronously on own actions

Demo nargiza appears as Top Rated in browse after MV refresh.

### 5.4 Other materialized views

| View | Refresh | Purpose |
|------|---------|---------|
| `mv_marketplace_rankings` | 15 min | Homepage featured freelancers |
| `mv_category_counts` | 1 hour | Filter facet counts |
| `mv_platform_revenue_daily` | 1 hour | Admin finance dashboard |

---

## 6. Caching interaction

| Data | Cache | DB hit |
|------|-------|--------|
| Wallet balance | **Never cached** | Always primary |
| Freelancer list page 1 | Redis 60s | MV on miss |
| Service detail | Redis 120s | Table on miss |
| Session | Redis | `sessions` table fallback |

Cache invalidation on publish events — not on wallet/escrow.

---

## 7. Hardware sizing (VPS)

### 7.1 Beta — 1k users

| Resource | Spec |
|----------|------|
| vCPU | 8 |
| RAM | 16 GB |
| Disk | 200 GB NVMe |
| IOPS | 3,000+ |

### 7.2 Growth — 100k users

| Resource | Primary | Replica |
|----------|---------|---------|
| vCPU | 32 | 16 |
| RAM | 64 GB | 32 GB |
| Disk | 2 TB NVMe | 2 TB |
| Network | 10 Gbps private | |

**Memory allocation:** `shared_buffers` = 16 GB, `effective_cache_size` = 48 GB at 100k tier.

---

## 8. Monitoring thresholds

| Alert | Condition | Action |
|-------|-----------|--------|
| DB CPU | >80% 5 min | Scale VPS / add replica |
| Disk | >85% | Expand volume, archive partitions |
| Replication lag | >5s | Pause replica reads |
| Long queries | >5s | Log + kill if >25s |
| Deadlocks | >5/hour | Review transaction order in WalletService |
| Cache hit ratio | <99% | Increase `shared_buffers`, review indexes |

---

## 9. Load testing baseline

Before launch, run against staging VPS:

| Scenario | Target |
|----------|--------|
| 500 concurrent wallet reads | p95 <15ms |
| 200 order list queries/sec | p95 <30ms |
| 1000 message inserts/min | No autovacuum backlog |
| 50 checkout transactions/sec | Zero deadlocks |

Tooling: k6 or Locust against FastAPI staging, not direct SQL.

---

*Backup & recovery: [DATABASE_BACKUP_STRATEGY.md](./DATABASE_BACKUP_STRATEGY.md)*
