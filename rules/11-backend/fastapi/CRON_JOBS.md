# CRON_JOBS.md

**Project:** Ishbor Marketplace  
**Scheduler:** Celery Beat · Redis broker DB 1  
**Complements:** [BACKGROUND_JOBS.md](./BACKGROUND_JOBS.md) (task registry, retry, idempotency)  
**Timezone:** UTC (display admin schedules in Asia/Tashkent UTC+5 where noted)

---

## 1. Purpose

Cron jobs (Celery Beat scheduled tasks) run periodic maintenance independent of user traffic:

- Ranking and search freshness
- Subscription billing cycles
- Session and OTP cleanup
- Analytics partition management
- Escrow/dispute SLA monitoring
- Featured listing expiry
- Wallet pending withdrawal processing

This document focuses on **when** jobs run, **what** they touch, and **operational expectations**. Task implementation details live in BACKGROUND_JOBS.md.

---

## 2. Beat configuration

```python
# app/workers/celery_app.py
celery_app.conf.beat_schedule = {
    "outbox-poller": {...},
    "ranking-refresh": {...},
    # ... full table below
}
celery_app.conf.timezone = "UTC"
```

**Heartbeat:** Each cron run sets Redis key `ishbor:cron:last:{task_name}` with TTL = 2× schedule interval. Monitoring alerts if missing.

**Idempotency:** Time-bucket dedupe keys prevent double-run if beat fires twice:

```
ishbor:celery:done:ishbor.analytics.refresh_rankings:2026-06-20T10:15
```

---

## 3. Complete schedule

### 3.1 High frequency (< 1 hour)

| Beat name | Schedule | Task | Queue | Description |
|-----------|----------|------|-------|-------------|
| `outbox-poller` | Every 5 seconds | `ishbor.outbox.poll` | cron | Drain domain event outbox to worker tasks |
| `ranking-refresh` | `*/15 * * * *` | `ishbor.analytics.refresh_rankings` | cron | Recompute freelancer/agency/service ranking scores |
| `wallet-pending` | `*/30 * * * *` | `ishbor.commerce.wallet_pending_release` | cron | Process approved withdrawals to gateway |
| `featured-expiry` | `0 * * * *` (hourly) | `ishbor.marketplace.expire_featured` | cron | Clear `featured_until` past projects/services |
| `dispute-sla-check` | `0 * * * *` | `ishbor.commerce.dispute_sla_check` | cron | Alert disputes open > 72h |

### 3.2 Daily

| Beat name | Schedule (UTC) | Local (Tashkent) | Task | Description |
|-----------|----------------|------------------|------|-------------|
| `session-cleanup` | `0 3 * * *` | 08:00 | `ishbor.auth.cleanup_sessions` | Delete expired sessions + Redis cache |
| `otp-cleanup` | `0 3 * * *` | 08:00 | `ishbor.auth.cleanup_otp` | Purge otp_verifications > 24h |
| `idempotency-cleanup` | `0 4 * * *` | 09:00 | `ishbor.commerce.cleanup_idempotency` | Hard delete idempotency_keys > 24h |
| `kyc-purge` | `0 5 * * *` | 10:00 | `ishbor.compliance.purge_kyc_documents` | Rejected KYC docs > 1 year |
| `subscription-renewal` | `0 6 * * *` | 11:00 | `ishbor.commerce.subscription_renewal` | Charge active subscriptions due today |
| `job-alert-digest` | `0 8 * * *` | 13:00 | `ishbor.marketplace.job_alert_digest` | Daily job alert emails (alerts-store) |
| `search-reindex-delta` | `0 2 * * *` | 07:00 | `ishbor.search.reindex_delta` | Catch-up FTS index for missed events |
| `gdpr-purge-queue` | `0 1 * * *` | 06:00 | `ishbor.compliance.process_delete_queue` | Anonymize/purge scheduled account deletions |

### 3.3 Weekly

| Beat name | Schedule | Task | Description |
|-----------|----------|------|-------------|
| `soft-delete-purge` | `0 4 * * 0` (Sun) | `ishbor.compliance.purge_soft_deleted` | Hard purge drafts/files > 30d grace |
| `ranking-full-rebuild` | `0 5 * * 0` | `ishbor.analytics.ranking_full_rebuild` | Full ranking recompute (correct drift) |
| `reconciliation` | `0 6 * * 1` (Mon) | `ishbor.commerce.wallet_reconciliation` | Wallet vs escrow pool balance check |

### 3.4 Monthly

| Beat name | Schedule | Task | Description |
|-----------|----------|------|-------------|
| `analytics-archive` | `0 4 1 * *` | `ishbor.analytics.archive_partition` | Drop analytics partitions > 24mo; write rollups |
| `audit-archive` | `0 5 1 * *` | `ishbor.audit.archive_old` | Move audit_logs > 24mo to archive table |
| `subscription-usage-reset` | `0 0 1 * *` | `ishbor.commerce.reset_subscription_usage` | Reset monthly AI/credits counters |

---

## 4. Job specifications

### 4.1 Ranking refresh (`ishbor.analytics.refresh_rankings`)

**Purpose:** Keep `/search`, `/freelancers`, `/services` sort order accurate.

**Inputs:**

- `freelancer_stats` table
- Recent `reviews`, `order_completed` events
- `response_metrics` from messages-store patterns
- Agency metrics from `agency-metrics-store` domain

**Outputs:**

- Update `ranking_scores` materialized table or Redis sorted sets `ishbor:rank:freelancers`, `ishbor:rank:services`
- Invalidate cache keys `ishbor:cache:projects:*`, `ishbor:cache:services:popular`

**Duration target:** < 60 seconds for 10k freelancers  
**Failure:** Retry 2×; stale rankings acceptable up to 30 min

Maps `ranking-store.ts`, `agency-ranking-store.ts`.

### 4.2 Subscription renewal (`ishbor.commerce.subscription_renewal`)

**Purpose:** Bill Pro/Elite plans — maps `subscription-store.ts`.

**Logic:**

```
FOR subscription IN active WHERE renews_at <= today:
  TRY charge payment_method on file
  ON success: extend renews_at, emit SubscriptionRenewed
  ON failure: status = past_due, notify user, retry day 3 and day 7
```

**Idempotency:** `subscription_id + date`  
**Audit:** `subscription_renewal_failed` on failure  
**Notification:** Uzbek email + in-app

**Related API:** `GET /api/v1/subscription`, `POST /api/v1/subscription/upgrade`

### 4.3 Session cleanup (`ishbor.auth.cleanup_sessions`)

**Purpose:** Remove expired sessions from PostgreSQL and Redis.

**Logic:**

```sql
DELETE FROM sessions WHERE expires_at < now() RETURNING token_hash;
```

For each `token_hash`: `DEL ishbor:session:{hash}`

Also deletes `remember_me` tokens expired.

**Volume:** Expect 10k–100k rows/day at scale  
**Duration target:** < 30 seconds

Maps SESSION_MANAGEMENT.md, SESSION_STORAGE.md.

### 4.4 Analytics rollup (`ishbor.analytics.archive_partition`)

**Purpose:** DATA_RETENTION_POLICY — drop old `analytics_events` partitions.

**Logic:**

1. INSERT INTO `analytics_rollups_daily` aggregated from partition `analytics_events_YYYY_MM`
2. DROP TABLE partition if age > 24 months
3. Emit metric `analytics.partition_dropped`

**Guard:** Never drop partition for current or previous month  
**Idempotency:** `month string` e.g. `2024-05`

Maps `analytics-events-store.ts` server replacement.

### 4.5 Featured expiry (`ishbor.marketplace.expire_featured`)

**Purpose:** Clear featured flags when `featured_until < now()`.

**Tables:** `projects`, `services`, `featured_listings`

**Logic:**

```sql
UPDATE projects SET featured = false, featured_until = NULL
WHERE featured = true AND featured_until < now();

UPDATE services SET featured = false, featured_until = NULL
WHERE featured = true AND featured_until < now();
```

Invalidate search cache; emit `FeaturedExpired` for analytics.

Maps `updateProjectFeatured`, `setServiceFeatured`, `featured-store.ts`.

### 4.6 Wallet pending release (`ishbor.commerce.wallet_pending_release`)

**Purpose:** Process withdrawal requests approved by admin.

**Logic:**

- Select `withdrawal_requests` status=approved, gateway_status=pending
- Batch size 50 per run
- Call Humo/Uzcard payout API
- On success: wallet_tx out, status=completed
- On failure: retry with backoff; alert finance_admin after 3 failures

**Idempotency:** `withdrawal_id`  
**Schedule:** Every 30 min — complements manual admin approval flow

### 4.7 Dispute SLA check (`ishbor.commerce.dispute_sla_check`)

**Purpose:** TRUST_SYSTEM 24h response / 72h resolution targets.

**Logic:**

```sql
SELECT id FROM disputes
WHERE status IN ('open', 'pending')
  AND opened_at < now() - interval '72 hours';
```

For each: PagerDuty P1 + notify founder  
Open > 14 days: auto-escalate + audit `dispute_sla_breach`

Maps MODERATION_DISPUTES.md, DISPUTE_LIFECYCLE.md.

### 4.8 Job alert digest (`ishbor.marketplace.job_alert_digest`)

**Purpose:** Daily email for freelancers with job alerts configured.

**Logic:**

- Query users with active alerts (alerts-store pattern)
- Match published projects in last 24h by category/skills
- Send digest email max 1/day per user
- Skip if `analytics_opt_out` or email unsubscribed

**Schedule:** 08:00 UTC = 13:00 Tashkent — peak engagement window

---

## 5. Operational runbook

### 5.1 Missed beat run

| Symptom | Action |
|---------|--------|
| Redis heartbeat missing | Check beat container, Redis connectivity |
| Queue depth spike | Scale workers on affected queue |
| Duplicate runs | Expected safe — idempotency keys dedupe |

### 5.2 Manual trigger

```bash
celery -A app.workers.celery_app call ishbor.analytics.refresh_rankings
celery -A app.workers.celery_app call ishbor.auth.cleanup_sessions
```

Admin API (super_admin only):

```
POST /api/v1/admin/system/jobs/trigger
{ "task": "ishbor.analytics.refresh_rankings" }
```

Logged in audit_logs.

### 5.3 Disable job (incident)

Set env `ISHBOR_CRON_DISABLED=ranking-refresh,subscription-renewal` — beat skips listed jobs. Remove after incident resolved.

---

## 6. Monitoring dashboard

| Metric | Alert threshold |
|--------|-----------------|
| `ishbor:cron:last:*` age | > 2× schedule interval |
| `ishbor.analytics.refresh_rankings` duration | > 120s |
| `ishbor.commerce.subscription_renewal` failures | > 5% of batch |
| `ishbor.commerce.wallet_reconciliation` discrepancy | Any non-zero |
| Outbox lag | > 5 min (outbox-poller) |

Flower + Prometheus exporters on worker nodes.

---

## 7. Local development

```bash
# Terminal 1: API
uvicorn app.main:create_app --factory --reload

# Terminal 2: Worker (include cron queue)
celery -A app.workers.celery_app worker -Q ishbor.cron,ishbor.analytics,ishbor.auth -l info

# Terminal 3: Beat
celery -A app.workers.celery_app beat -l info
```

Docker Compose profile `workers` starts worker + beat. Set `CELERY_BEAT_ENABLED=false` to disable locally.

---

## 8. Relationship to BACKGROUND_JOBS.md

| Document | Covers |
|----------|--------|
| BACKGROUND_JOBS.md | Task modules, retry policies, outbox dispatch, idempotency patterns |
| CRON_JOBS.md (this file) | Beat schedules, business purpose, ops runbook |

New cron task checklist:

1. Add task to `cron_tasks.py`
2. Register in beat_schedule
3. Add heartbeat + idempotency key
4. Document in this file §3
5. Add monitoring alert
6. Update DATA_RETENTION_POLICY if purging data

---

## 9. Related documents

- [BACKGROUND_JOBS.md](./BACKGROUND_JOBS.md)
- [QUEUE_ARCHITECTURE.md](../redis/QUEUE_ARCHITECTURE.md)
- [DATA_RETENTION_POLICY.md](../postgresql/DATA_RETENTION_POLICY.md)
- [SESSION_MANAGEMENT.md](../auth/SESSION_MANAGEMENT.md)
- [MONITORING_ARCHITECTURE.md](../MONITORING_ARCHITECTURE.md)

---

*Celery Beat drives Ishbor periodic tasks: ranking every 15 min, subscription renewal daily 06:00 UTC, session cleanup daily 03:00 UTC, analytics archive monthly.*
