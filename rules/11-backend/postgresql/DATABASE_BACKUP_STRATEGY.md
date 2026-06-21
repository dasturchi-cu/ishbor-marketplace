# DATABASE_BACKUP_STRATEGY.md

**Engine:** PostgreSQL 16 on self-managed VPS  
**Application:** FastAPI  
**Tooling:** pgBackRest (primary), pg_dump (logical exports)  
**Related:** [POSTGRESQL_ARCHITECTURE.md](./POSTGRESQL_ARCHITECTURE.md), [MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md)

---

## 1. Objectives

Ishbor handles real money (wallets, escrow) and legally sensitive KYC data. Backup strategy must guarantee recoverability with defined RPO/RTO targets.

| Metric | Target | Definition |
|--------|--------|------------|
| **RPO** (Recovery Point Objective) | **≤15 minutes** | Max acceptable data loss |
| **RTO** (Recovery Time Objective) | **≤2 hours** | Max downtime to restore service |
| **Retention** | 30 daily + 12 monthly | Compliance + accidental delete recovery |

---

## 2. Backup architecture

```
┌─────────────────────────────────────────────────────────────┐
│  VPS #2 — PostgreSQL Primary                                 │
│  ┌─────────────┐    continuous    ┌──────────────────────┐  │
│  │ PostgreSQL  │ ───WAL stream──► │ pgBackRest archive   │  │
│  │ 16          │                  │ /var/lib/pgbackrest  │  │
│  └─────────────┘                  └──────────┬───────────┘  │
│         │ full/incr backup                    │              │
│         └─────────────────────────────────────┼──────────────┤
└─────────────────────────────────────────────────┼──────────────┘
                                                  │ encrypted sync
                                                  ▼
                                    ┌─────────────────────────┐
                                    │ Off-site storage         │
                                    │ S3-compatible (R2)       │
                                    │ bucket: ishbor-pg-backup │
                                    └─────────────────────────┘
```

**Rules:**

- Backups stored **off VPS** — separate provider/account from primary
- Encryption at rest: AES-256 (pgBackRest repo encryption)
- Backup credentials separate from app `DATABASE_URL`
- Production backups never contain unencrypted KYC document files — only DB metadata in `files` table

---

## 3. pgBackRest configuration

### 3.1 Backup types

| Type | Schedule | Retention | Purpose |
|------|----------|-----------|---------|
| **Full** | Weekly (Sunday 02:00 UTC) | 4 full | Base restore point |
| **Incremental** | Daily (02:30 UTC) | 7 incremental | Reduce full backup frequency |
| **Differential** | Optional mid-week | 3 | Faster restore than incremental chain |
| **WAL archive** | Continuous | 15 days online | Point-in-time recovery (PITR) |

### 3.2 pgBackRest stanza

```ini
[global]
repo1-type=s3
repo1-s3-endpoint=r2.cloudflarestorage.com
repo1-s3-bucket=ishbor-pg-backup
repo1-s3-region=auto
repo1-cipher-type=aes-256-cbc
repo1-retention-full=4
repo1-retention-diff=3
process-max=4
start-fast=y
delta=y

[ishbor_prod]
pg1-path=/var/lib/postgresql/16/main
pg1-port=5432
```

### 3.3 WAL archiving

`postgresql.conf`:

```
archive_mode = on
archive_command = 'pgbackrest --stanza=ishbor_prod archive-push %p'
wal_level = replica
max_wal_senders = 5
```

Enables PITR to any second within retention window — critical for wallet ledger integrity.

---

## 4. pg_dump schedule (logical backups)

Physical backups (pgBackRest) are primary. Logical dumps supplement:

| Dump | Schedule | Format | Purpose |
|------|----------|--------|---------|
| Schema-only | After each migration | `pg_dump -s` | Drift audit, documentation |
| Full logical | Weekly | `pg_dump -Fc` | Cross-version migration, table-level restore |
| Demo subset | On staging refresh | Custom | Anonymized QA data |

### 4.1 Schema dump command

```bash
pg_dump -h localhost -U ishbor_migrate -d ishbor_prod \
  --schema-only --no-owner --no-privileges \
  -f /backups/schema_$(date +%Y%m%d).sql
```

### 4.2 Logical full dump

```bash
pg_dump -h localhost -U ishbor_migrate -d ishbor_prod \
  -Fc -Z6 \
  -f /backups/ishbor_prod_$(date +%Y%m%d).dump
```

Upload to R2 with lifecycle: delete after 90 days (logical dumps are secondary).

### 4.3 Tables excluded from logical dump (optional)

None for Ishbor — full consistency required. Large partitions (`analytics_events`) included; restore can skip partitions if needed via `--exclude-table`.

---

## 5. Staging refresh

Monthly: restore production backup to staging VPS (anonymized):

| Step | Action |
|------|--------|
| 1 | Restore pgBackRest backup to `ishbor_staging_restore` |
| 2 | Run anonymization script: emails → `user{N}@staging.ishbor.uz`, clear `password_hash`, redact KYC jsonb |
| 3 | Re-seed demo accounts (sardor, nargiza) with known passwords |
| 4 | Verify FastAPI staging health |

Anonymization prevents demo credential leaks from prod data.

---

## 6. Restore procedures

### 6.1 Point-in-time recovery (PITR) — primary scenario

**Trigger examples:** Accidental `DELETE` on `wallet_transactions`, bad migration, data corruption

```bash
# Stop application
systemctl stop ishbor-api

# Restore to new timeline
pgbackrest --stanza=ishbor_prod --type=time \
  --target="2026-06-20 14:32:00+00" \
  --target-action=promote \
  restore

# Start PostgreSQL, verify integrity
systemctl start postgresql
psql -c "SELECT COUNT(*) FROM wallet_transactions;"
psql -c "SELECT SUM(available) FROM wallets;"

# Start application
systemctl start ishbor-api
```

**Communication:** Status page + in-app banner: *"Texnik xizmat ko'rsatilmoqda, tez orada qaytamiz"*

### 6.2 Full disaster recovery (VPS lost)

| Step | ETA | Action |
|------|-----|--------|
| 1 | 0–30 min | Provision new VPS, install PostgreSQL 16 |
| 2 | 30–60 min | Install pgBackRest, pull latest full + WAL |
| 3 | 60–90 min | Restore + promote |
| 4 | 90–105 min | Update DNS/private IP, redeploy FastAPI |
| 5 | 105–120 min | Smoke tests: login sardor, wallet read, order list |

**RTO 2 hours** assumes pre-documented runbook and on-call engineer.

### 6.3 Single-table restore

From weekly logical dump:

```bash
pg_restore -t wallet_transactions -d ishbor_prod_restore ishbor_prod.dump
# Merge rows via idempotent INSERT ... ON CONFLICT
```

Prefer PITR over single-table — ledger consistency requires transaction-level recovery.

---

## 7. Restore drill schedule

| Drill | Frequency | Success criteria |
|-------|-----------|------------------|
| WAL replay to timestamp | Monthly | Wallet sum matches pre-incident audit |
| Full restore to isolated VPS | Quarterly | FastAPI login + checkout smoke pass |
| Failover to read replica | Semi-annual (at 100k) | Replica promoted, app reconnects |
| Runbook review | Quarterly | On-call can execute without docs lookup |

**Last drill logged in:** `audit_logs` category `system`, action `backup_restore_drill`

---

## 8. Monitoring & alerts

| Check | Tool | Alert if |
|-------|------|----------|
| Backup completed | pgBackRest exit code | Non-zero or >26h since last full |
| WAL archive lag | `pgbackrest info` | Archive gap >15 min (RPO breach) |
| Backup size delta | Custom script | >50% change day-over-day |
| R2 upload failure | pgBackRest log | Any S3 error |
| Disk on primary | Node exporter | >85% — backups need space for WAL |

PagerDuty/on-call for production backup failures — not email-only.

---

## 9. Security

| Control | Detail |
|---------|--------|
| Backup encryption | pgBackRest repo AES-256 |
| Transport | TLS to R2 |
| Access | IAM key scoped to `ishbor-pg-backup` bucket only |
| Restore access | Requires 2-person approval for production PITR |
| Secret rotation | Backup credentials rotated quarterly |

Backup files never stored on application VPS disk long-term.

---

## 10. Ishbor-specific integrity checks post-restore

Run before opening traffic:

```sql
-- Wallet ledger vs balance
SELECT w.user_id, w.available,
       (SELECT running_balance FROM wallet_transactions wt
        WHERE wt.user_id = w.user_id ORDER BY created_at DESC LIMIT 1) AS last_running
FROM wallets w
WHERE w.available != (
    SELECT running_balance FROM wallet_transactions wt
    WHERE wt.user_id = w.user_id ORDER BY created_at DESC LIMIT 1
);
-- Must return 0 rows

-- Escrow funded orders have workflow
SELECT o.id FROM orders o
LEFT JOIN escrow_workflows e ON e.order_id = o.id
WHERE o.escrow_funded = true AND e.id IS NULL;
-- Must return 0 rows

-- Demo accounts exist (staging)
SELECT email FROM users
WHERE email IN ('sardor@asaka.uz', 'nargiza@ishbor.uz');
```

FastAPI health endpoint `/health/db` runs lightweight `SELECT 1` + migration version check.

---

## 11. RPO/RTO summary for stakeholders

| Scenario | RPO | RTO | Method |
|----------|-----|-----|--------|
| Single table accidental delete | 0–15 min | 1–2 hr | PITR |
| VPS hardware failure | 0–15 min | 2 hr | pgBackRest full + WAL |
| Region/provider outage | 0–15 min | 4 hr | Restore to secondary region VPS |
| Ransomware / compromise | Last clean full | 4 hr | Offline backup copy (weekly export to separate account) |

**Offline copy:** Monthly pgBackRest full copied to separate AWS account with Object Lock — 7-day immutability.

---

## 12. Pre-migration backup requirement

Before **every** production Alembic `upgrade`:

```bash
pgbackrest --stanza=ishbor_prod backup --type=incr
pgbackrest --stanza=ishbor_prod info  # verify last backup <1h
```

Document backup ID in deploy ticket. Roll forward preferred; PITR available if migration corrupts data.

---

*Architecture: [POSTGRESQL_ARCHITECTURE.md](./POSTGRESQL_ARCHITECTURE.md)*
