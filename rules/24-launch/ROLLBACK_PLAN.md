# ROLLBACK_PLAN.md

**Ishbor marketplace — deployment and migration rollback procedures**  
**Principle:** Roll back fast, preserve data integrity, communicate clearly

---

## 1. When to rollback

### Automatic rollback triggers

| Signal | Threshold | Action |
|--------|-----------|--------|
| HTTP 5xx rate | >5% for 5 min | Rollback API image |
| Health check fail | 3 consecutive | Rollback API image |
| Payment error rate | >1% | Pause payments + rollback if code-related |
| DB migration fail | Alembic error on deploy | Stop deploy, do not promote |

### Manual rollback triggers

| Scenario | Decision maker |
|----------|----------------|
| Cross-user data leak | Launch lead — immediate |
| Wallet/escrow corruption | Launch lead + finance — immediate |
| Auth bypass | Security lead — immediate |
| Severe UX regression | Frontend lead |
| AI cost runaway | Backend lead — disable `AI_LLM_ENABLED` |

---

## 2. Rollback types

| Type | Scope | Downtime | Data risk |
|------|-------|----------|-----------|
| **A: Image rollback** | API/worker containers | 1–3 min | Low |
| **B: Frontend rollback** | Nitro static build | 1–5 min | Low |
| **C: Migration rollback** | Database schema | 5–30 min | **High** |
| **D: Full stack rollback** | All services + DB | 15–60 min | High |
| **E: Feature flag rollback** | Config only | Seconds | None |

**Default:** Prefer E → A → B before C or D.

---

## 3. Docker image rollback (Type A)

### Prerequisites

- Every deploy tags images: `ishbor-api:{git-sha}` and `ishbor-api:previous`
- `docker-compose.prod.yml` references image tag via `IMAGE_TAG` env

### Procedure

```text
1. ALERT: Announce rollback in #launch-war-room
2. IDENTIFY: Last known good SHA from deploy log / GitHub releases
3. SET: export IMAGE_TAG=<good-sha>
4. PULL: docker compose -f docker-compose.prod.yml pull api worker beat
5. DEPLOY: docker compose -f docker-compose.prod.yml up -d api worker beat
6. VERIFY: curl https://api.ishbor.uz/health
7. VERIFY: Smoke test login + browse
8. MONITOR: Error rate 15 min
9. DOCUMENT: Incident ticket with SHA rolled back from/to
```

### Timing

| Step | Target |
|------|--------|
| Decision to rollback | <5 min |
| Containers replaced | <3 min |
| Verification | <5 min |

### Nginx

Usually no rollback needed — API upstream unchanged. If Nginx config changed:

```text
cp /etc/nginx/sites-available/ishbor.uz.bak /etc/nginx/sites-available/ishbor.uz
nginx -t && systemctl reload nginx
```

---

## 4. Frontend rollback (Type B)

### Static assets (Nitro output)

```text
1. CDN/nginx serves /var/www/ishbor/releases/{sha}/
2. Symlink /var/www/ishbor/current → previous release
3. ln -sfn releases/{previous-sha} current
4. Purge CDN cache if Cloudflare enabled
5. Verify: hard refresh home page, check build hash in asset URL
```

### Zero-downtime pattern

Keep last 3 releases on disk. Rollback = symlink swap only.

---

## 5. Database migration rollback (Type C)

**Warning:** Migration rollback can cause data loss. Only when migration is reversible and no production writes depended on new schema.

### Pre-migration rules

Per [MIGRATION_STRATEGY.md](../11-backend/postgresql/MIGRATION_STRATEGY.md):

1. Every migration has `downgrade()` function
2. Destructive migrations require maintenance window
3. Backup taken immediately before `alembic upgrade`

### Procedure

```text
1. STOP: Scale API workers to 0 (maintenance mode page up)
2. BACKUP: pg_dump ishbor > pre_rollback_$(date +%s).sql
3. DOWNGRADE: alembic downgrade -1  (or target revision)
4. VERIFY: Schema matches previous revision
5. ROLLBACK: Deploy previous API image (Type A)
6. START: Scale workers back
7. VERIFY: Integration smoke tests
8. ASSESS: Data written during bad deploy — manual cleanup if needed
```

### Irreversible migrations

If `downgrade()` drops columns with data:

- **Do not downgrade** — forward-fix with hotfix migration instead
- Restore from pre-deploy backup only as last resort (data loss since deploy)

### Point-in-time recovery (PITR)

```text
1. Stop application
2. Restore WAL to timestamp before bad deploy
3. Replay transactions until clean state
4. RTO target: 4 hours
```

See [DATABASE_BACKUP_STRATEGY.md](../11-backend/postgresql/DATABASE_BACKUP_STRATEGY.md).

---

## 6. Feature flag rollback (Type E)

Fastest path for AI, payments, registration issues:

| Flag | Rollback action |
|------|-----------------|
| `AI_LLM_ENABLED` | `false` — falls back to rule-based |
| `PAYMENTS_LIVE` | `false` — checkout shows maintenance |
| `REGISTRATION_OPEN` | `false` — invite only |
| `WEBSOCKET_ENABLED` | `false` — polling fallback |

```text
# On VPS
vi /opt/ishbor/.env
docker compose restart api
# No image change required
```

---

## 7. Redis rollback

Redis is cache + ephemeral state — generally **no rollback**:

| Data | On rollback |
|------|-------------|
| Session cache | Users re-login (acceptable) |
| Rate limit counters | Reset (acceptable) |
| Celery queue | Drain or purge |

```text
# Nuclear option — flush cache only (not production default)
redis-cli -a $REDIS_PASSWORD FLUSHDB
```

Document if flush required — users will be logged out.

---

## 8. MinIO rollback

| Scenario | Action |
|----------|--------|
| Bad deploy corrupted uploads | Restore bucket from daily backup |
| Wrong ACL | Re-apply bucket policy script |

Files uploaded during bad window may be lost if restoring backup.

---

## 9. Rollback decision matrix

| Failure | Recommended rollback |
|---------|---------------------|
| API 500 after deploy | Type A |
| Broken checkout UI | Type B |
| Migration added NOT NULL without default | Type C forward-fix preferred |
| LLM cost spike | Type E (`AI_LLM_ENABLED=false`) |
| Payment duplicate charge | Type E (`PAYMENTS_LIVE=false`) + incident |
| WS disconnect all users | Type A or E |
| Full data corruption | Type D + PITR |

---

## 10. Communication template

**Status page / Telegram:**

```text
Ishbor: Texnik muammo tufayli vaqtincha xizmatda uzilish bo'ldi.
Jamoa muammoni hal qilmoqda. Taxminan {ETA} da tiklanadi.
Kuting, rahmat.
```

**Resolved:**

```text
Ishbor xizmati tiklandi. Muammo {brief cause} bilan bog'liq edi.
Moliyaviy operatsiyalar tekshirildi. Savollar: support@ishbor.uz
```

---

## 11. Post-rollback requirements

| Task | Owner |
|------|-------|
| Root cause analysis | Backend lead |
| Fix forward on branch | Dev team |
| Re-run full test suite | QA |
| Update INCIDENT_PLAYBOOK if new pattern | DevOps |
| Stakeholder summary | Launch lead |

**Do not re-deploy** until RCA complete and fix verified on staging.

---

## 12. Rehearsal schedule

| Exercise | Frequency |
|----------|-----------|
| Docker image rollback | Monthly on staging |
| Frontend symlink swap | Quarterly |
| Migration downgrade | Per risky migration on staging |
| PITR restore | Quarterly |
| Feature flag toggle | Monthly |

---

## 13. References

- [DEPLOYMENT_GUIDE.md](../11-backend/infrastructure/DEPLOYMENT_GUIDE.md)
- [DOCKER_ARCHITECTURE.md](../11-backend/infrastructure/DOCKER_ARCHITECTURE.md)
- [MIGRATION_STRATEGY.md](../11-backend/postgresql/MIGRATION_STRATEGY.md)
- [INCIDENT_PLAYBOOK.md](./INCIDENT_PLAYBOOK.md)
- [DISASTER_RECOVERY.md](../11-backend/infrastructure/DISASTER_RECOVERY.md)

---

*Last updated: 2026-06-20*
