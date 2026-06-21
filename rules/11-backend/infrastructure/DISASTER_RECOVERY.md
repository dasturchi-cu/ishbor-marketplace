# DISASTER_RECOVERY.md

**Targets:** RTO 4 hours, RPO 1 hour (production)  
**Scope:** VPS failure, data corruption, security breach recovery  
**Stack:** Self-hosted PostgreSQL + Redis + MinIO on VPS

---

## 1. Recovery objectives

| Tier | RTO | RPO | Scope |
|------|-----|-----|-------|
| P0 — Production | 4 hours | 1 hour | Full platform restore |
| P1 — Staging | 24 hours | 24 hours | QA environment |
| P2 — Monitoring | 8 hours | N/A | Grafana/Prometheus |

RPO achieved via: PostgreSQL WAL archiving + hourly snapshots, Redis RDB hourly, MinIO daily mirror.

---

## 2. Failure scenarios

| Scenario | Impact | Recovery path |
|----------|--------|---------------|
| VPS hardware failure | Total outage | Provision new VPS, restore backups |
| PostgreSQL corruption | Data loss risk | PITR from WAL + last pg_dump |
| MinIO data loss | Files unavailable | Restore from offsite mirror |
| Redis loss | Sessions lost, cache cold | Rebuild from empty — users re-login |
| Security breach | Compromised secrets | Rotate all secrets, invalidate sessions |
| Bad deploy | API errors | Rollback Docker image tag |
| Bad migration | Schema/data damage | Compensating migration or restore |
| DDoS | Service degraded | Nginx rate limits + provider mitigation |

---

## 3. Failover procedure — VPS total loss

### Step 1: Provision (0–30 min)

1. Provision new VPS (same spec — SERVER_ARCHITECTURE.md)
2. Install Docker, configure UFW
3. Create `deploy` user, add SSH key
4. Point DNS to new IP (TTL 300 recommended)

### Step 2: Restore infrastructure (30–90 min)

```bash
cd /opt/ishbor
# Copy compose.yml, nginx config from git repo
cp repo/docker/compose.yml .
cp -r repo/docker/nginx ./nginx

# Restore .env from secure backup (NOT git)
scp backup-server:/backups/ishbor/.env.production .env
chmod 600 .env

# Start data services
docker compose up -d postgres redis minio
```

### Step 3: Restore PostgreSQL (90–150 min)

```bash
# Stop postgres, restore dump
docker compose stop postgres
docker run --rm -v ishbor_postgres_data:/data -v $(pwd)/backups/postgres:/backup \
  postgres:16-alpine sh -c "rm -rf /data/* && pg_restore ..."

# Or from latest pg_dump
gunzip -c backups/postgres/latest.sql.gz | \
  docker compose exec -T postgres psql -U ishbor -d ishbor

docker compose start postgres
docker compose run --rm api alembic upgrade head  # if needed
```

### Step 4: Restore MinIO (150–210 min)

```bash
docker compose exec minio mc mirror /backup/minio/latest/ local/ishbor-uploads/
docker compose exec minio mc mirror /backup/minio/latest-private/ local/ishbor-private/
```

### Step 5: Start application (210–240 min)

```bash
export IMAGE_TAG=last-known-good
docker compose pull
docker compose up -d
curl -f https://api.ishbor.uz/health/ready
```

### Step 6: Verification

- [ ] Login flow works
- [ ] Wallet balances match pre-incident reconciliation export
- [ ] File uploads/downloads work
- [ ] WebSocket connects
- [ ] Payment webhook test (sandbox)
- [ ] Admin panel accessible

---

## 4. Security breach response

| Step | Action | Time |
|------|--------|------|
| 1 | Isolate — block public traffic via UFW or nginx | Immediate |
| 2 | Rotate SESSION_SECRET → invalidate all sessions | 15 min |
| 3 | Rotate payment gateway keys | 30 min |
| 4 | Rotate S3/MinIO credentials | 30 min |
| 5 | Rotate DATABASE password | 30 min |
| 6 | Review audit_logs for exfiltration scope | 2 hours |
| 7 | Patch vulnerability, redeploy | Variable |
| 8 | Notify affected users if PII exposed | Legal review |

Freeze all withdrawals during investigation — admin finance flag.

---

## 5. Bad deploy rollback

```bash
cd /opt/ishbor
export IMAGE_TAG=<previous-sha>
docker compose pull api frontend
docker compose up -d --no-deps api frontend celery-worker
```

If migration ran: write compensating `alembic downgrade` or forward fix migration — never `alembic downgrade` in production without testing.

Auto-rollback trigger: error rate >1% for 5 min — manual decision per MONITORING_ARCHITECTURE.md.

---

## 6. Communication plan

| Audience | Channel | Template |
|----------|---------|----------|
| Users | Status page + in-app banner | "Texnik xizmat ko'rsatish" |
| Admins | Telegram alert group | Incident severity + ETA |
| Payment partners | Email | If webhook downtime >1h |

Post-incident report in `rules/99-reports/incidents/` within 48 hours.

---

## 7. DR testing schedule

| Test | Frequency | Scope |
|------|-----------|-------|
| Backup restore to staging | Monthly | PostgreSQL + MinIO |
| Full DR drill | Quarterly | Simulated VPS loss |
| Secret rotation drill | Quarterly | SESSION_SECRET rotation |
| Failover DNS | Annually | TTL + propagation timing |

Document actual RTO/RPO achieved vs targets.

---

## 8. Offsite backup location

| Asset | Offsite target |
|-------|----------------|
| pg_dump daily | Hetzner Storage Box / S3-compatible |
| MinIO mirror | Separate provider region |
| `.env` backup | Encrypted vault (Bitwarden/org vault) |
| Docker image tags | ghcr.io (already offsite) |

Minimum 3-2-1 rule: 3 copies, 2 media types, 1 offsite.

---

## 9. Related documents

- [BACKUP_STRATEGY.md](./BACKUP_STRATEGY.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [CI_CD_PIPELINE.md](./CI_CD_PIPELINE.md)

---

*DR plan assumes self-hosted VPS with offsite backups. Redis session loss is acceptable — PostgreSQL and MinIO are critical recovery paths.*
