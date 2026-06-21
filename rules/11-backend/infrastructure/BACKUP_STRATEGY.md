# BACKUP_STRATEGY.md

**Scope:** PostgreSQL, MinIO, Redis RDB backups on VPS  
**Retention:** 30 daily + 12 monthly offsite  
**Automation:** Celery beat scheduled jobs

---

## 1. Backup inventory

| Asset | Method | Frequency | Retention | Offsite |
|-------|--------|-----------|-----------|---------|
| PostgreSQL | pg_dump + WAL | Daily 02:00 UZT | 30 daily, 12 monthly | Yes |
| MinIO | mc mirror | Daily 02:30 UZT | 30 daily | Yes |
| Redis | RDB snapshot | Hourly | 7 daily | Optional |
| `.env` secrets | Encrypted manual | On change | 5 versions | Yes (vault) |
| nginx config | Git | Every commit | Unlimited | GitHub |
| Grafana dashboards | Git | Every commit | Unlimited | GitHub |

---

## 2. PostgreSQL backup

### Daily pg_dump (Celery task)

```python
# server/workers/tasks/maintenance.py
@celery_app.task(name="maintenance.backup_postgres")
def backup_postgres():
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    path = f"/backups/postgres/ishbor_{timestamp}.sql.gz"
    subprocess.run([
        "pg_dump", "-h", "postgres", "-U", "ishbor", "-d", "ishbor",
        "--format=custom", "--compress=9", "-f", path
    ], check=True)
    upload_offsite(path)
    prune_local("/backups/postgres/", keep_days=30)
```

Compose mount: `./backups/postgres:/backups/postgres`

### WAL archiving (P1 — PITR)

```bash
# postgresql.conf
archive_mode = on
archive_command = 'cp %p /backups/postgres/wal/%f'
wal_level = replica
```

Enables point-in-time recovery to any second within retention window.

### Restore test (monthly)

```bash
# On staging VPS
gunzip -c backups/postgres/latest.sql.gz | psql -U ishbor -d ishbor_restore_test
SELECT count(*) FROM users;  # sanity check
DROP DATABASE ishbor_restore_test;
```

---

## 3. MinIO backup

### Daily mirror

```bash
# Celery task
mc mirror --overwrite local/ishbor-uploads /backups/minio/uploads/$(date +%Y%m%d)/
mc mirror --overwrite local/ishbor-private /backups/minio/private/$(date +%Y%m%d)/
mc mirror --overwrite local/ishbor-public /backups/minio/public/$(date +%Y%m%d)/
```

### Offsite sync

```bash
# rclone to Hetzner Storage Box or external S3
rclone sync /backups/minio/ remote:ishbor-backups/minio/ --transfers 4
```

### Restore

```bash
mc mirror /backups/minio/uploads/20260620/ local/ishbor-uploads/
```

Verify random sample files accessible via CDN after restore.

---

## 4. Redis RDB backup

Redis configured with AOF + RDB:

```bash
# redis.conf via compose command
--appendonly yes
--save 3600 1    # snapshot if ≥1 key changed in 1 hour
--save 300 100   # snapshot if ≥100 keys changed in 5 min
```

### Hourly copy

```python
@celery_app.task(name="maintenance.backup_redis")
def backup_redis():
    subprocess.run(["redis-cli", "-h", "redis", "BGSAVE"], check=True)
    time.sleep(5)
    shutil.copy("/data/dump.rdb", f"/backups/redis/dump_{timestamp}.rdb")
```

**Note:** Redis backup is best-effort — sessions and cache are rebuildable. Priority: PostgreSQL > MinIO > Redis.

---

## 5. Offsite storage

| Provider | Use | Encryption |
|----------|-----|------------|
| Hetzner Storage Box | Primary offsite | HTTPS + optional GPG |
| Selectel S3 | UZ-region copy | Server-side AES |
| GitHub (configs only) | compose, nginx | Public repo — no secrets |

```bash
# GPG encrypt before offsite (optional extra layer)
gpg --symmetric --cipher-algo AES256 ishbor_20260620.sql.gz
```

---

## 6. Backup monitoring

| Check | Alert |
|-------|-------|
| pg_dump age >26h | P1 — backup missed |
| Offsite upload failed | P1 |
| Backup size anomaly (>50% change) | P2 — investigate |
| Disk usage backups/ >80% | P2 — prune or expand |

Prometheus metric: `ishbor_backup_last_success_timestamp`.

Admin system page shows last backup times.

---

## 7. Pre-migration backup

Mandatory before every production migration:

```bash
docker compose exec postgres pg_dump -U ishbor -Fc ishbor > \
  /backups/postgres/pre_migration_$(date +%Y%m%d_%H%M%S).dump
```

CI/CD deploy script includes this step — see CI_CD_PIPELINE.md.

---

## 8. Retention policy

```bash
# Local prune script
find /backups/postgres -name "*.sql.gz" -mtime +30 -delete
find /backups/minio -maxdepth 1 -type d -mtime +30 -exec rm -rf {} +
find /backups/redis -name "*.rdb" -mtime +7 -delete
```

Monthly backups tagged `monthly_YYYYMM` kept 12 months offsite regardless.

---

## 9. Encryption at rest

| Layer | Method |
|-------|--------|
| VPS disk | Provider-level encryption (if available) |
| Offsite backups | GPG symmetric or provider SSE |
| PostgreSQL | Application-level for sensitive columns (OAuth tokens) |
| MinIO private bucket | MinIO SSE-S3 |

---

## 10. Related documents

- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)
- [DOCKER_COMPOSE_STRUCTURE.md](./DOCKER_COMPOSE_STRUCTURE.md)
- [../minio/MINIO_ARCHITECTURE.md](../minio/MINIO_ARCHITECTURE.md)

---

*PostgreSQL pg_dump daily + MinIO mirror daily are the minimum viable backup strategy. Test restores monthly — untested backups are not backups.*
