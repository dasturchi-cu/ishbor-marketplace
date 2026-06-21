# POSTGRESQL_ARCHITECTURE.md

**Project:** Ishbor Marketplace  
**Stack:** FastAPI + PostgreSQL 16 on self-managed VPS (NOT Supabase, NOT Neon)  
**Parent:** [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)  
**Related:** [INFRASTRUCTURE_ARCHITECTURE.md](../INFRASTRUCTURE_ARCHITECTURE.md), [RBAC_SPECIFICATION.md](../RBAC_SPECIFICATION.md)

---

## 1. Purpose

This document defines how Ishbor runs PostgreSQL 16 on a dedicated VPS as the single source of truth for users, commerce, escrow, messaging, and admin operations. All authorization is enforced in the FastAPI application layer — not via database RLS or managed-platform policies.

---

## 2. Deployment topology

```
                         ┌─────────────────────────────┐
                         │  Cloudflare (DNS/WAF/CDN)   │
                         └──────────────┬──────────────┘
                                        │ HTTPS
                         ┌──────────────▼──────────────┐
                         │  VPS #1 — Application       │
                         │  FastAPI (uvicorn/gunicorn) │
                         │  BullMQ workers             │
                         └──────────────┬──────────────┘
                                        │ TCP 6432 (PgBouncer)
                         ┌──────────────▼──────────────┐
                         │  VPS #2 — Database (primary)  │
                         │  PostgreSQL 16                │
                         │  PgBouncer (transaction pool)│
                         │  pgBackRest / WAL archive     │
                         └──────────────┬──────────────┘
                                        │ async replication (future)
                         ┌──────────────▼──────────────┐
                         │  VPS #3 — Read replica      │
                         │  (Phase: 100k users)          │
                         └─────────────────────────────┘
```

| Component | Host | Notes |
|-----------|------|-------|
| Primary DB | `db-primary.internal.ishbor.uz` | Ubuntu 24.04 LTS, dedicated NVMe |
| PgBouncer | Same host as primary | Transaction pooling mode |
| FastAPI | `api.ishbor.uz` VPS | Connects only through PgBouncer |
| Redis | Separate VPS or co-located | Sessions, rate limits, WS pub/sub |
| Object storage | Cloudflare R2 | File metadata in `files` table |

**Network:** PostgreSQL listens on private VPC / WireGuard only. No public `5432`. Firewall allows PgBouncer port from application subnet only.

---

## 3. PostgreSQL 16 configuration baseline

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `max_connections` | 200 | PgBouncer absorbs app concurrency |
| `shared_buffers` | 25% RAM (e.g. 4 GB on 16 GB VPS) | Standard OLTP tuning |
| `effective_cache_size` | 75% RAM | Planner hint for index vs seq scan |
| `work_mem` | 16 MB | Sort/hash for FTS and joins |
| `maintenance_work_mem` | 512 MB | Index builds, VACUUM |
| `wal_level` | `replica` | Enables future streaming replica |
| `max_wal_size` | 4 GB | Reduce checkpoint frequency |
| `random_page_cost` | 1.1 | NVMe SSD |
| `timezone` | `UTC` | All `timestamptz` stored UTC |
| `lc_collate` / `lc_ctype` | `en_US.UTF-8` | Consistent sorting; UI is Uzbek |

Locale for user-facing errors is handled in FastAPI (`detail` messages in Uzbek per API convention), not in PostgreSQL.

---

## 4. Extensions

Installed once in migration `001_extensions_and_enums`:

| Extension | Schema | Purpose |
|-----------|--------|---------|
| `pgcrypto` | `public` | `gen_random_uuid()`, password-adjacent hashing helpers |
| `citext` | `public` | Case-insensitive email (`users.email`) |
| `pg_trgm` | `public` | Trigram search on usernames, titles |
| `btree_gin` | `public` | Composite GIN where needed |
| `uuid-ossp` | — | **Not used** — prefer `gen_random_uuid()` from pgcrypto |

Optional at scale:

| Extension | When |
|-----------|------|
| `pg_stat_statements` | Day 1 — query observability |
| `pg_cron` | Scheduled MV refresh, partition maintenance |

---

## 5. Schema layout

Ishbor uses two PostgreSQL schemas:

### 5.1 `public` (default)

All application tables: `users`, `orders`, `wallets`, `messages`, `agencies`, etc. FastAPI SQLAlchemy/Alembic models target `public`.

### 5.2 `audit`

Append-only, restricted write access:

| Object | Purpose |
|--------|---------|
| `audit.audit_logs` | Mirror of admin audit trail (optional split from `public.audit_logs`) |
| `audit.payment_records_archive` | Cold storage for financial records >24 months |
| `audit.wallet_transactions_archive` | Ledger archive after 24 months |

**Access model:**

| Role | `public` | `audit` |
|------|----------|---------|
| `ishbor_app` | SELECT/INSERT/UPDATE/DELETE per service logic | INSERT only via `audit_writer` |
| `ishbor_migrate` | DDL for Alembic | DDL |
| `ishbor_readonly` | SELECT | SELECT |
| `ishbor_replica` | Replication | Replication |

FastAPI connects as `ishbor_app`. Migrations run as `ishbor_migrate` in CI/deploy.

---

## 6. Connection pooling (PgBouncer)

Application servers must **never** open raw connections to PostgreSQL for request handling.

```
FastAPI worker (×8) ──► PgBouncer :6432 ──► PostgreSQL :5432
     pool_size=10            max_client_conn=500
                             default_pool_size=40
                             pool_mode=transaction
```

| Setting | Value | Why |
|---------|-------|-----|
| `pool_mode` | `transaction` | FastAPI request = one transaction; compatible with SQLAlchemy |
| `default_pool_size` | 40 | ~8 workers × 5 concurrent queries headroom |
| `max_client_conn` | 500 | Burst during deploy / health checks |
| `server_reset_query` | `DISCARD ALL` | Clean session state between clients |
| `query_timeout` | 30s | Kill runaway analytics queries |

**SQLAlchemy URL (production):**

```
postgresql+asyncpg://ishbor_app:***@db-primary.internal:6432/ishbor_prod?sslmode=require
```

**Anti-patterns:**

- Long-held connections during WebSocket lifetime — use short transactions, Redis for presence
- Prepared statements with `transaction` pooling — use SQLAlchemy `prepare_threshold=0` for asyncpg
- Migrations through PgBouncer — Alembic uses direct `5432` as `ishbor_migrate`

---

## 7. Application-level access control (replaces RLS)

Ishbor does **not** use PostgreSQL Row Level Security. Authorization is enforced in FastAPI:

1. **Session middleware** — validate `sessions.token_hash`, load `users` row
2. **Account status gate** — reject `suspended` / `banned` with `403` and Uzbek message: *"Hisobingiz vaqtincha bloklangan"*
3. **RBAC dependency** — `require_role("client")`, `require_admin_section("escrow")` per [RBAC_SPECIFICATION.md](../RBAC_SPECIFICATION.md)
4. **Entity scope** — repository queries always include ownership filter, e.g. `WHERE client_user_id = :current_user_id`
5. **Service-only writes** — wallet balance mutations only via `WalletService`, never exposed as raw UPDATE endpoint

Every repository method accepts `CurrentUser` and applies filters before SQL execution. Integration tests assert cross-user access returns `404` (not `403`) for ID-guessing endpoints.

---

## 8. Read replicas (future — 100k users)

| Trigger | Action |
|---------|--------|
| Primary CPU >60% sustained | Add streaming replica |
| Read:write ratio >3:1 | Route read-only endpoints to replica |

**Replica routing in FastAPI:**

| Endpoint class | Target |
|----------------|--------|
| `GET /freelancers`, `GET /projects`, search | Replica (eventual consistency OK, max 1s lag) |
| Wallet, escrow, checkout, messages send | Primary only |
| Admin financial reports | Replica with `SET transaction_read_only = on` |

Use `pg_stat_replication` + alert if lag >5s.

---

## 9. Scale targets (100k users)

Derived from [SCALABILITY_ARCHITECTURE.md](../SCALABILITY_ARCHITECTURE.md):

| Metric | Target at 100k MAU |
|--------|-------------------|
| Registered users | 100,000 |
| Concurrent sessions | ~3,000 peak |
| Orders/day | 10,000 |
| Messages/day | 500,000 |
| DB size | ~1 TB (with partitioning) |
| Primary IOPS | 5,000+ (NVMe) |
| Connection budget | 40 pooled backends, not 3,000 raw |

**Growth path on VPS:**

| Stage | Hardware | Notes |
|-------|----------|-------|
| Beta (1k users) | 1× 8 vCPU / 16 GB / 200 GB NVMe | Single primary sufficient |
| Launch (10k) | 1× 16 vCPU / 32 GB / 500 GB NVMe | Enable `pg_stat_statements`, partition `analytics_events` |
| 100k | Primary 32 vCPU / 64 GB + replica 16 vCPU | PgBouncer on both; archive old wallet tx |

---

## 10. Environment isolation

| Environment | Database | VPS |
|-------------|----------|-----|
| `local` | Docker Compose PostgreSQL 16 | Developer machine |
| `staging` | `ishbor_staging` | Smaller VPS, anonymized prod snapshot monthly |
| `production` | `ishbor_prod` | Dedicated primary + replica |

No shared database between environments. Secrets in `/etc/ishbor/env` (systemd), not in repo.

---

## 11. Observability

| Signal | Tool |
|--------|------|
| Query latency | `pg_stat_statements` → Grafana |
| Connections | PgBouncer `SHOW POOLS` |
| Replication lag | `pg_stat_replication` |
| Disk | Node exporter + alert >80% |
| Slow queries | log_min_duration_statement = 500ms |

Sentry tags DB errors with `request_id`; user sees generic Uzbek message *"Ma'lumotlar bazasi vaqtincha javob bermayapti"* — never raw PG errors.

---

## 12. File map

| Document | Scope |
|----------|-------|
| [ERD.md](./ERD.md) | Entity relationships |
| [TABLE_SPECIFICATIONS.md](./TABLE_SPECIFICATIONS.md) | Column-level spec |
| [INDEXING_STRATEGY.md](./INDEXING_STRATEGY.md) | Indexes |
| [DATABASE_PERFORMANCE.md](./DATABASE_PERFORMANCE.md) | Vacuum, partitioning, MVs |
| [MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md) | Alembic workflow |
| [QUERY_OPTIMIZATION.md](./QUERY_OPTIMIZATION.md) | Hot query EXPLAIN |
| [DATABASE_BACKUP_STRATEGY.md](./DATABASE_BACKUP_STRATEGY.md) | Backup/restore |

---

*Stack mandate: FastAPI + PostgreSQL 16 on VPS. No Supabase. No Neon. No RLS.*
