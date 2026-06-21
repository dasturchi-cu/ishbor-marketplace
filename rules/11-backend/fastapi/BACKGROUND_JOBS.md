# BACKGROUND_JOBS.md

**Project:** Ishbor Marketplace  
**Worker framework:** Celery 5.x (primary) · Redis 7 broker (DB index 1)  
**Task catalog source:** [QUEUE_ARCHITECTURE.md](../redis/QUEUE_ARCHITECTURE.md), [EVENT_ARCHITECTURE.md](../EVENT_ARCHITECTURE.md)

---

## 1. Purpose

Background jobs handle all async side effects after PostgreSQL commits: notifications, emails, SMS, search indexing, analytics ingestion, escrow wallet transfers, AI usage logging, and scheduled cron work. Tasks are idempotent, retriable, and observable.

**Entry points:**
1. Outbox dispatcher (post-domain-event)
2. Direct enqueue (WebSocket publish, cache invalidation)
3. Celery beat (cron schedules)

---

## 2. Task module layout

```
app/workers/
├── celery_app.py           # Celery instance + config
├── base.py                 # IshborTask base with retry + idempotency
├── outbox.py               # Outbox poller + dispatcher
├── auth_tasks.py
├── marketplace_tasks.py
├── commerce_tasks.py
├── notification_tasks.py
├── email_tasks.py
├── sms_tasks.py
├── analytics_tasks.py
├── search_tasks.py
├── escrow_tasks.py
├── ai_tasks.py
├── cache_tasks.py
├── audit_tasks.py
└── cron_tasks.py
```

---

## 3. Base task with idempotency

```python
class IshborTask(Task):
    autoretry_for = (ConnectionError, TimeoutError, RedisError)
    retry_backoff = True
    retry_backoff_max = 60
    retry_jitter = True
    max_retries = 5

    def before_start(self, task_id, args, kwargs):
        event_id = kwargs.get("event_id") or (args[0] if args else None)
        if event_id and redis.exists(f"ishbor:celery:done:{self.name}:{event_id}"):
            raise Ignore()  # Celery skip — already processed

    def on_success(self, retval, task_id, args, kwargs):
        event_id = kwargs.get("event_id")
        if event_id:
            redis.setex(f"ishbor:celery:done:{self.name}:{event_id}", 86400, "1")
```

---

## 4. Complete task registry

### 4.1 Outbox

| Task | Queue | Retry | Idempotency key |
|------|-------|-------|-----------------|
| `ishbor.outbox.poll` | cron | 3 | N/A (cursor-based) |
| `ishbor.outbox.dispatch` | notifications | 5 | `event_id` |

### 4.2 Auth

| Task | Queue | Retry | Idempotency key |
|------|-------|-------|-----------------|
| `ishbor.auth.send_verification_email` | email | 5 | `event_id` |
| `ishbor.auth.send_password_reset` | email | 5 | `token_hash` |
| `ishbor.auth.send_otp_sms` | sms | 3 | `otp_id` |
| `ishbor.auth.audit_login` | audit | 3 | `event_id` |
| `ishbor.auth.cleanup_sessions` | cron | 1 | date string |

### 4.3 Marketplace

| Task | Queue | Retry | Idempotency key |
|------|-------|-------|-----------------|
| `ishbor.marketplace.index_project` | search | 5 | `project_id` |
| `ishbor.marketplace.index_service` | search | 5 | `service_id` |
| `ishbor.marketplace.index_agency` | search | 5 | `agency_id` |
| `ishbor.marketplace.notify_proposal_received` | notifications | 5 | `event_id` |
| `ishbor.marketplace.notify_proposal_accepted` | notifications | 5 | `event_id` |
| `ishbor.marketplace.notify_proposal_rejected` | notifications | 5 | `event_id` |
| `ishbor.marketplace.job_alert_digest` | notifications | 2 | date string |
| `ishbor.marketplace.expire_featured` | cron | 2 | hour string |
| `ishbor.marketplace.invalidate_project_cache` | cache | 3 | `slug` + version |
| `ishbor.marketplace.invalidate_service_cache` | cache | 3 | `slug` + version |

### 4.4 Commerce & escrow

| Task | Queue | Retry | Idempotency key |
|------|-------|-------|-----------------|
| `ishbor.commerce.notify_order_created` | notifications | 5 | `event_id` |
| `ishbor.commerce.notify_checkout_completed` | notifications | 5 | `event_id` |
| `ishbor.commerce.process_escrow_funded` | escrow | 3 | `escrow_id` |
| `ishbor.commerce.release_milestone_wallet` | escrow | 3 | `milestone_id` |
| `ishbor.commerce.process_dispute_opened` | escrow | 3 | `dispute_id` |
| `ishbor.commerce.admin_escrow_release` | escrow | 3 | `idempotency_key` |
| `ishbor.commerce.admin_escrow_refund` | escrow | 3 | `idempotency_key` |
| `ishbor.commerce.record_revenue` | analytics | 5 | `event_id` |
| `ishbor.commerce.subscription_renewal` | cron | 3 | `subscription_id` + date |
| `ishbor.commerce.wallet_pending_release` | cron | 3 | batch date |

### 4.5 Notifications & realtime

| Task | Queue | Retry | Idempotency key |
|------|-------|-------|-----------------|
| `ishbor.notifications.create_in_app` | notifications | 5 | `event_id` + `user_id` |
| `ishbor.notifications.send_email` | email | 5 | `event_id` + template |
| `ishbor.notifications.send_sms` | sms | 3 | `event_id` |
| `ishbor.notifications.publish_ws` | notifications | 3 | `event_id` + `user_id` |
| `ishbor.notifications.mark_read_batch` | notifications | 3 | batch id |

### 4.6 Analytics & ranking

| Task | Queue | Retry | Idempotency key |
|------|-------|-------|-----------------|
| `ishbor.analytics.ingest_event` | analytics | 5 | `event_id` |
| `ishbor.analytics.ingest_batch` | analytics | 3 | request id |
| `ishbor.analytics.refresh_rankings` | cron | 2 | run timestamp |
| `ishbor.analytics.archive_partition` | cron | 1 | month string |

### 4.7 AI

| Task | Queue | Retry | Idempotency key |
|------|-------|-------|-----------------|
| `ishbor.ai.log_usage` | ai | 5 | `request_id` |
| `ishbor.ai.summarize_conversation` | ai | 3 | `conversation_id` (future) |

### 4.8 Agency

| Task | Queue | Retry | Idempotency key |
|------|-------|-------|-----------------|
| `ishbor.agency.send_member_invite` | email | 5 | `invite_token` |
| `ishbor.agency.notify_verification_request` | notifications | 5 | `agency_id` |

### 4.9 Audit & admin

| Task | Queue | Retry | Idempotency key |
|------|-------|-------|-----------------|
| `ishbor.audit.log_event` | audit | 5 | `event_id` |
| `ishbor.admin.notify_moderation_resolved` | notifications | 5 | `event_id` |

### 4.10 Cache

| Task | Queue | Retry | Idempotency key |
|------|-------|-------|-----------------|
| `ishbor.cache.invalidate_pattern` | cache | 3 | pattern + trigger ts |
| `ishbor.cache.warm_project` | cache | 2 | `slug` |

---

## 5. Retry policies by queue

| Queue | max_retries | backoff | acks_late | Notes |
|-------|-------------|---------|-----------|-------|
| `ishbor.escrow` | 3 | 1s → 30s | True | Alert on final failure — money |
| `ishbor.notifications` | 5 | 1s → 60s | True | User-facing delivery |
| `ishbor.email` | 5 | 2s → 120s | True | SMTP transient errors |
| `ishbor.sms` | 3 | 5s → 60s | True | Provider rate limits |
| `ishbor.analytics` | 5 | 1s → 60s | True | Loss acceptable with sampling |
| `ishbor.ai` | 3 | 2s → 30s | True | Log usage must succeed |
| `ishbor.search` | 5 | 1s → 60s | True | Index lag acceptable |
| `ishbor.cache` | 3 | 1s → 10s | False | Safe to drop |
| `ishbor.audit` | 5 | 1s → 60s | True | Must not lose audit entries |
| `ishbor.cron` | 2 | fixed 300s | True | Next beat run catches up |

---

## 6. Idempotency patterns

### 6.1 Event deduplication

Every outbox-dispatched task receives `event_id: UUID`. Before processing:

```python
@celery_app.task(base=IshborTask, bind=True, name="ishbor.notifications.create_in_app")
def create_in_app(self, event_id: str, user_id: str, kind: str, payload: dict):
    dedupe_key = f"ishbor:celery:done:{self.name}:{event_id}:{user_id}"
    if redis.set(dedupe_key, "1", nx=True, ex=86400) is None:
        return {"skipped": True}
    # ... create notification row ...
```

### 6.2 Money task idempotency

Escrow tasks require `idempotency_key` matching API header. Stored in `idempotency_keys` table — task checks before wallet mutation:

```python
def release_milestone_wallet(escrow_id: str, milestone_id: str, idempotency_key: str):
    existing = idempotency_repo.get(idempotency_key)
    if existing:
        return existing.response
    # ... wallet transfer in sync session ...
```

### 6.3 Cron idempotency

Cron tasks use time-bucket keys: `ishbor:celery:done:ishbor.analytics.refresh_rankings:2026-06-20T10:15` — prevents duplicate runs if beat fires twice.

---

## 7. Outbox dispatcher flow

```python
@celery_app.task(name="ishbor.outbox.poll")
def poll_outbox():
    events = outbox_repo.fetch_unprocessed(limit=50)
    for event in events:
        route = EVENT_TASK_MAP[event.event_type]
        route.delay(event_id=str(event.id), **event.payload)

EVENT_TASK_MAP = {
    "UserRegistered": ishbor.auth.send_verification_email,
    "CheckoutCompleted": ishbor.commerce.notify_checkout_completed,
    "EscrowMilestoneReleased": ishbor.commerce.release_milestone_wallet,
    "ApplicationSubmitted": ishbor.marketplace.notify_proposal_received,
    "ProjectPublished": ishbor.marketplace.index_project,
    "OrderCompleted": ishbor.analytics.ingest_event,
    # ... full map in EVENT_ARCHITECTURE.md
}
```

---

## 8. Scheduled jobs (Celery beat)

| Beat name | Schedule | Task | Description |
|-----------|----------|------|-------------|
| outbox-poller | every 5s | `ishbor.outbox.poll` | Drain outbox |
| ranking-refresh | */15 * * * * | `ishbor.analytics.refresh_rankings` | Recompute scores |
| session-cleanup | 0 3 * * * | `ishbor.auth.cleanup_sessions` | Delete expired sessions |
| featured-expiry | 0 * * * * | `ishbor.marketplace.expire_featured` | Clear expired featured |
| subscription-renewal | 0 6 * * * | `ishbor.commerce.subscription_renewal` | Charge renewals |
| job-alert-digest | 0 8 * * * | `ishbor.marketplace.job_alert_digest` | Daily job alerts |
| wallet-pending | */30 * * * * | `ishbor.commerce.wallet_pending_release` | Process withdrawals |
| analytics-archive | 0 4 1 * * | `ishbor.analytics.archive_partition` | Partition old events |

```python
celery_app.conf.beat_schedule = {
    "outbox-poller": {"task": "ishbor.outbox.poll", "schedule": 5.0},
    "ranking-refresh": {"task": "ishbor.analytics.refresh_rankings", "schedule": crontab(minute="*/15")},
    ...
}
```

---

## 9. Sync bridge for Celery

Celery workers run sync — use `asyncio.run()` or sync SQLAlchemy session for DB access:

```python
# app/workers/sync_db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sync_engine = create_engine(settings.DATABASE_URL_SYNC)
SyncSession = sessionmaker(sync_engine)

def run_with_session(fn):
    def wrapper(*args, **kwargs):
        with SyncSession() as session:
            return fn(session, *args, **kwargs)
    return wrapper
```

**Alternative:** `celery[gevent]` + asyncpg pool — evaluate in phase 2 if worker count grows.

---

## 10. Error handling and dead letters

| Failure type | Action |
|--------------|--------|
| Transient (Redis, SMTP, DB connection) | Retry with backoff |
| Permanent (validation, not found) | Mark outbox error, no retry, Sentry |
| Escrow wallet failure | Retry 3x → alert PagerDuty → manual review |
| Email bounce | Log to `email_delivery_logs`, no retry |

Dead letter storage: `outbox_events.error` column + `failed_tasks` admin view.

---

## 11. Monitoring checklist

| Metric | Tool | Alert |
|--------|------|-------|
| Queue depth per queue | Redis LLEN / Flower | > 500 |
| Task failure rate | Celery signals → Prometheus | > 5% |
| Outbox lag | `now() - min(created_at) WHERE processed_at IS NULL` | > 5 min |
| Escrow task errors | Sentry tag `queue:escrow` | Any |
| Beat last run | Custom heartbeat key in Redis | > 2× schedule interval |

---

## 12. Local development

```bash
# Terminal 1: API
uvicorn app.main:create_app --factory --reload

# Terminal 2: Worker (all queues)
celery -A app.workers.celery_app worker -Q ishbor.notifications,ishbor.email,ishbor.escrow -l info

# Terminal 3: Beat
celery -A app.workers.celery_app beat -l info
```

Docker Compose profile `workers` starts worker + beat containers.

---

*See also: [QUEUE_ARCHITECTURE.md](../redis/QUEUE_ARCHITECTURE.md), [EVENT_ARCHITECTURE.md](../EVENT_ARCHITECTURE.md), [SERVICE_LAYER.md](./SERVICE_LAYER.md)*
