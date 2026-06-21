# MIGRATION_STRATEGY.md

**Stack:** FastAPI + SQLAlchemy 2.x + Alembic + PostgreSQL 16 (VPS)  
**NOT:** Supabase migrations, Neon branches, Drizzle deploy-to-edge  
**Parent:** [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)

---

## 1. Overview

Ishbor schema changes flow through **Alembic** revision files in the FastAPI backend repository:

```
backend/
  alembic/
    versions/
      20260601_001_extensions_and_enums.py
      20260601_002_users_auth.py
      ...
    env.py
  app/
    models/          # SQLAlchemy declarative models
    db/session.py    # async engine
  scripts/
    seed_demo.py     # demo accounts
```

Migrations run in CI against ephemeral PostgreSQL 16, then in deploy pipeline against staging → production.

---

## 2. Alembic configuration

### 2.1 `env.py` requirements

- Use **sync driver** for Alembic (`psycopg2`) even if app uses `asyncpg` — Alembic autogenerate is sync
- Read `DATABASE_URL` from environment — direct `5432` as `ishbor_migrate` user, **not** through PgBouncer
- `target_metadata = Base.metadata` from all model modules
- `compare_type=True`, `compare_server_default=True` for drift detection

### 2.2 Naming convention (SQLAlchemy)

```python
convention = {
    "ix": "idx_%(table_name)s_%(column_0_name)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
```

Matches existing index names in [INDEXING_STRATEGY.md](./INDEXING_STRATEGY.md).

---

## 3. Revision naming

Format: `YYYYMMDD_NNN_short_description.py`

| Revision | File | Content |
|----------|------|---------|
| 001 | `20260601_001_extensions_and_enums.py` | Extensions + all CREATE TYPE enums |
| 002 | `20260601_002_users_auth.py` | users, sessions, oauth, otp |
| 003 | `20260601_003_profiles.py` | user_profiles, client_profiles, freelancer_stats |
| 004 | `20260601_004_marketplace_supply.py` | projects, services, applications, portfolios |
| 005 | `20260601_005_commerce_escrow.py` | orders, escrow, disputes |
| 006 | `20260601_006_wallets_payments.py` | wallets, wallet_transactions, payment_* |
| 007 | `20260601_007_subscriptions_credits.py` | subscriptions, credits, revenue |
| 008 | `20260601_008_agency.py` | agencies, members, invites |
| 009 | `20260601_009_messaging_notifications.py` | conversations, messages, notifications |
| 010 | `20260601_010_reviews_trust.py` | reviews, verification, saved_items |
| 011 | `20260601_011_admin_ops.py` | admin_role_assignments, audit_logs, support |
| 012 | `20260601_012_analytics_referrals.py` | analytics_events (partitioned), referrals |
| 013 | `20260601_013_files_ai.py` | files, ai_usage_logs |
| 014 | `20260601_014_views_and_search.py` | public views, search_documents, triggers |
| 015 | `20260601_015_seed_demo_data.py` | Demo seed (staging/local only) |

**Rule:** One logical domain per revision — easier rollback and code review.

---

## 4. Zero-downtime migration rules

### 4.1 Safe operations (online)

- `CREATE TABLE` new tables
- `CREATE INDEX CONCURRENTLY` — **always** in separate migration step
- `ADD COLUMN` with DEFAULT or NULL
- `CREATE VIEW` / materialized views
- New enum values: `ALTER TYPE ... ADD VALUE` (commit before use)

### 4.2 Requires expand/contract pattern

| Change | Expand phase | Contract phase |
|--------|--------------|----------------|
| Rename column | Add new col, dual-write in app | Drop old col after deploy |
| Change column type | Add new col, backfill job | Switch reads, drop old |
| Split table | Create new table, sync trigger | Move reads, drop old |
| NOT NULL on existing | Add nullable, backfill, SET NOT NULL | — |

### 4.3 Forbidden in production without window

- `ALTER TABLE ... SET NOT NULL` on populated column without backfill
- `ADD CONSTRAINT` validating full table without `NOT VALID` + `VALIDATE CONSTRAINT`
- `DROP COLUMN` before app deploy no longer references it
- `ACCESS EXCLUSIVE` locks from non-concurrent index builds

### 4.4 Deploy sequence

```
1. Run Alembic upgrade (expand migrations)
2. Deploy new FastAPI version (reads/writes new schema)
3. Run backfill jobs if needed
4. Run contract migration (drop old)
```

---

## 5. Rollback strategy

### 5.1 Alembic downgrade

Every revision **must** implement `downgrade()` for:

- Drop indexes created
- Drop tables in reverse FK order
- Drop enums last

**Exception:** Data-destructive downgrades (drop column with data) — document as irreversible; restore from backup instead.

### 5.2 Production rollback decision tree

```
Migration failed mid-deploy?
├── Before app deploy → alembic downgrade -1, fix revision, redeploy
├── After app deploy, backward compatible → deploy previous app version (no DB rollback)
└── After app deploy, incompatible → restore from backup (see DATABASE_BACKUP_STRATEGY.md)
```

### 5.3 Forward-only preferred

For production incidents, prefer **forward fix migration** (`016_hotfix_wallet_index.py`) over downgrade when data exists.

---

## 6. Enum migrations

PostgreSQL enums cannot drop values easily. Ishbor policy:

1. Add new value: `ALTER TYPE order_status ADD VALUE 'paused'`
2. Deprecate old value: stop writing in app, migrate rows in data job
3. Never remove enum values in v1 — document deprecated values in TABLE_SPECIFICATIONS

---

## 7. Seed data — demo accounts

Revision `015_seed_demo_data.py` runs **only** when `ISHBOR_ENV in (local, staging)`.

### 7.1 Fixed UUIDs (match frontend legacy IDs)

```python
DEMO_USERS = {
    "u-client-1": {
        "id": "11111111-1111-4111-8111-000000000001",
        "email": "sardor@asaka.uz",
        "password": "demo1234",  # bcrypt hash in seed
        "full_name": "Sardor Mirkomilov",
        "user_type": "client",
        "company_slug": "asaka-capital",
        "avatar_hue": 215,
    },
    "u-freelancer-1": {
        "id": "22222222-2222-4222-8222-000000000002",
        "email": "nargiza@ishbor.uz",
        "password": "demo1234",
        "full_name": "Nargiza Akhmedova",
        "user_type": "freelancer",
        "username": "nargiza",
        "avatar_hue": 250,
    },
}
```

### 7.2 Seed graph

| Entity | sardor (client) | nargiza (freelancer) |
|--------|-----------------|----------------------|
| `users` + profiles | Asaka Capital client | Freelancer profile, rate $45 |
| `client_profiles` | slug `asaka-capital` | — |
| `freelancer_stats` | — | Top Rated, 184 reviews |
| `services` | — | `mobile-app-design-fintech` |
| `projects` | `fintech-app-redesign` | — |
| `orders` | o1 client side | o1 freelancer side |
| `escrow_workflows` | funded $12,000 | — |
| `wallets` | available $8,420, escrow $12,000 | earned $184,000 |
| `conversations` + `messages` | thread on Fintech project | same thread |
| `payment_methods` | Humo ••4421 default | — |

### 7.3 Idempotent seed

Use `INSERT ... ON CONFLICT (id) DO NOTHING` or Alembic `op.execute` with existence checks — re-running seed must not duplicate.

### 7.4 Production

**Never** seed demo passwords in production. Production gets admin bootstrap via one-time CLI:

```bash
python -m app.cli create-admin --email admin@ishbor.uz
```

---

## 8. CI pipeline

```yaml
# .github/workflows/db-migrate-check.yml
services:
  postgres:
    image: postgres:16
steps:
  - alembic upgrade head
  - alembic downgrade base
  - alembic upgrade head
  - pytest tests/db/
```

PR check: autogenerate drift — if `alembic check` fails, developer must commit new revision.

---

## 9. Data migrations vs schema migrations

| Type | Tool | Example |
|------|------|---------|
| Schema | Alembic revision | Add column |
| Backfill | BullMQ job or `scripts/backfill.py` | Populate `company_slug` from users |
| One-off fix | Manual SQL with audit ticket | Correct duplicate wallet tx |

Backfill jobs log to `audit_logs` category `system`.

---

## 10. Frontend store migration mapping

Each localStorage key in STORE_REGISTRY.md maps to a post-migration API:

| Store key | Tables | Migration revision |
|-----------|--------|-------------------|
| `ishbor-session` | sessions, users | 002 |
| `ishbor-wallet` | wallets, wallet_transactions | 006 |
| `ishbor-messages` | conversations, messages | 009 |
| `ishbor-active-role-*` | active_role_preferences | 002 |

Cutover: feature flag `backend_authoritative=true` per domain after revision deployed + seed verified.

---

## 11. Checklist before merge

- [ ] `upgrade()` and `downgrade()` both tested locally
- [ ] New indexes use `CONCURRENTLY` in production path
- [ ] No RLS policies — access documented in RBAC
- [ ] Enum changes committed before code using new value
- [ ] Seed IDs match `auth.ts` demo UUID mapping
- [ ] Uzbek error messages documented in API_SPECIFICATION, not in migration

---

*Backup before production migrate: [DATABASE_BACKUP_STRATEGY.md](./DATABASE_BACKUP_STRATEGY.md)*
