# QUEUE_ARCHITECTURE.md

**Project:** Ishbor Marketplace  
**Broker:** Redis 7 (DB index 1) · **Worker framework:** Celery 5.x (primary) or ARQ (lightweight alternative)  
**Replaces:** Synchronous side effects in `*-store.ts`, `setTimeout` email simulations

---

## 1. Purpose

Domain mutations in Ishbor (checkout, proposal accept, escrow release) must commit to PostgreSQL first, then fan out notifications, emails, search indexing, and analytics asynchronously. Celery workers consume tasks from Redis-backed queues with retry, idempotency, and dead-letter handling.

**Decision:** Celery is the default for Ishbor phase 1 due to mature retry/scheduling. ARQ may run alongside for lightweight cron-style jobs if team prefers async-native Python — both share the same Redis broker with distinct queue name prefixes.

---

## 2. Topology

```
┌─────────────────┐     INSERT outbox_events (same TX)
│  FastAPI API    │─────────────────────────────────────┐
└────────┬────────┘                                     │
         │ enqueue (post-commit)                         ▼
         ▼                                    ┌──────────────────┐
┌─────────────────┐                          │  Outbox poller   │
│  Redis broker   │◀─────────────────────────│  (Celery beat)   │
│  DB index 1     │                          └──────────────────┘
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼          ▼          ▼
┌────────┐ ┌──────┐ ┌───────┐ ┌──────────┐ ┌───────┐ ┌────┐
│notifi- │ │email │ │  sms  │ │analytics │ │escrow │ │ ai │
│cations │ │      │ │       │ │          │ │       │ │    │
└────────┘ └──────┘ └───────┘ └──────────┘ └───────┘ └────┘
  worker     worker    worker     worker      worker   worker
```

**Direct enqueue:** High-priority paths (WebSocket publish) may bypass outbox and enqueue directly after TX commit. Money-adjacent tasks always originate from outbox or idempotent task keys.

---

## 3. Queue definitions

| Queue name | Celery routing key | Workers (prod) | Concurrency | Priority |
|------------|-------------------|----------------|-------------|----------|
| `ishbor.notifications` | `notifications.*` | 2 | 4 | High |
| `ishbor.email` | `email.*` | 1 | 2 | Normal |
| `ishbor.sms` | `sms.*` | 1 | 2 | Normal |
| `ishbor.analytics` | `analytics.*` | 1 | 4 | Low |
| `ishbor.escrow` | `escrow.*` | 1 | 2 | Critical |
| `ishbor.ai` | `ai.*` | 1 | 2 | Normal |
| `ishbor.search` | `search.*` | 1 | 2 | Normal |
| `ishbor.audit` | `audit.*` | 1 | 1 | Low |
| `ishbor.cache` | `cache.*` | 1 | 2 | Low |
| `ishbor.cron` | `cron.*` | 1 (beat) | 1 | Scheduled |

**Redis key prefix (Celery):** `ishbor:celery:` — configured via `broker_transport_options` and `result_backend_transport_options`.

---

## 4. Task naming convention

All tasks use dotted namespace matching Ishbor domain events:

```
ishbor.{domain}.{action}
```

### 4.1 Auth tasks

| Task name | Queue | Trigger event | Payload |
|-----------|-------|---------------|---------|
| `ishbor.auth.send_verification_email` | email | UserRegistered | userId, email, token |
| `ishbor.auth.send_password_reset` | email | PasswordReset requested | userId, token |
| `ishbor.auth.send_otp_sms` | sms | OTP requested | phone, codeHash, purpose |
| `ishbor.auth.audit_login` | audit | UserLoggedIn | userId, ip, ua |

### 4.2 Marketplace tasks

| Task name | Queue | Trigger event | Payload |
|-----------|-------|---------------|---------|
| `ishbor.marketplace.index_project` | search | ProjectPublished | projectId, slug |
| `ishbor.marketplace.index_service` | search | ServicePublished | serviceId, slug |
| `ishbor.marketplace.notify_proposal_received` | notifications | ApplicationSubmitted | applicationId, clientId |
| `ishbor.marketplace.notify_proposal_accepted` | notifications | ApplicationAccepted | applicationId, orderId |
| `ishbor.marketplace.job_alert_digest` | notifications | cron | — |
| `ishbor.marketplace.invalidate_project_cache` | cache | Project* writes | slug |

### 4.3 Commerce / escrow tasks

| Task name | Queue | Trigger event | Payload |
|-----------|-------|---------------|---------|
| `ishbor.commerce.notify_order_created` | notifications | OrderCreated | orderId |
| `ishbor.commerce.notify_checkout_completed` | notifications | CheckoutCompleted | orderId, escrowId |
| `ishbor.commerce.process_escrow_funded` | escrow | EscrowFunded | escrowId, amount |
| `ishbor.commerce.release_milestone_wallet` | escrow | EscrowMilestoneReleased | escrowId, milestoneId |
| `ishbor.commerce.process_dispute_opened` | escrow | EscrowDisputeOpened | disputeId, escrowId |
| `ishbor.commerce.admin_escrow_release` | escrow | AdminActionPerformed | escrowId, adminId |
| `ishbor.commerce.record_revenue` | analytics | CheckoutCompleted | orderId, fee |

### 4.4 Notification delivery tasks

| Task name | Queue | Trigger | Payload |
|-----------|-------|---------|---------|
| `ishbor.notifications.create_in_app` | notifications | Any notify event | userId, kind, title, body, meta |
| `ishbor.notifications.send_email` | email | Preference allows | userId, template, vars |
| `ishbor.notifications.send_sms` | sms | P1+ | phone, template, vars |
| `ishbor.notifications.publish_ws` | notifications | Realtime | userId, eventType, payload |

### 4.5 Analytics tasks

| Task name | Queue | Trigger | Payload |
|-----------|-------|---------|---------|
| `ishbor.analytics.ingest_event` | analytics | Domain events | eventType, actorId, meta |
| `ishbor.analytics.refresh_rankings` | cron | */15 min | — |
| `ishbor.analytics.archive_partition` | cron | Monthly | month |

### 4.6 AI tasks

| Task name | Queue | Trigger | Payload |
|-----------|-------|---------|---------|
| `ishbor.ai.log_usage` | ai | AIToolUsed | userId, tool, tokens |
| `ishbor.ai.async_proposal_draft` | ai | Optional future | applicationId |

### 4.7 Agency tasks

| Task name | Queue | Trigger | Payload |
|-----------|-------|---------|---------|
| `ishbor.agency.send_member_invite` | email | AgencyMemberInvited | agencyId, email, token |
| `ishbor.agency.notify_verification_request` | notifications | AgencyVerificationRequested | agencyId |

---

## 5. Celery configuration

```python
# app/workers/celery_app.py
celery_app = Celery("ishbor")
celery_app.conf.update(
    broker_url=settings.CELERY_BROKER_URL,  # redis://.../1
    result_backend=settings.CELERY_RESULT_BACKEND,  # redis://.../2 or db+postgresql
    task_default_queue="ishbor.notifications",
    task_routes={
        "ishbor.auth.*": {"queue": "ishbor.email"},
        "ishbor.notifications.*": {"queue": "ishbor.notifications"},
        "ishbor.commerce.process_*": {"queue": "ishbor.escrow"},
        "ishbor.analytics.*": {"queue": "ishbor.analytics"},
        "ishbor.ai.*": {"queue": "ishbor.ai"},
        "ishbor.marketplace.index_*": {"queue": "ishbor.search"},
    },
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_serializer="json",
    result_expires=3600,
    broker_transport_options={"visibility_timeout": 3600},
)
```

---

## 6. Outbox integration

Transactional outbox pattern (EVENT_ARCHITECTURE.md):

1. API service inserts domain row + `outbox_events` row in one PostgreSQL transaction.
2. Post-commit hook enqueues `ishbor.outbox.dispatch` with `outbox_event_id`.
3. Dispatcher reads payload, routes to appropriate `ishbor.{domain}.{action}` task.
4. On success: `UPDATE outbox_events SET processed_at = now()`.
5. On failure: increment `retry_count`, exponential backoff.

**Outbox poller (Celery beat):** Every 5 seconds, fetch unprocessed events older than 2s (safety margin for stuck enqueue).

---

## 7. Retry and dead letter

| Setting | Value |
|---------|-------|
| Max retries | 5 |
| Backoff | Exponential: 1s, 2s, 4s, 16s, 60s |
| Retry jitter | ±20% |
| Dead letter | `outbox_events.error` column + Sentry alert |
| Idempotency key | `ishbor:celery:done:{task_name}:{event_id}` TTL 24h |

**Escrow tasks:** Max 3 retries then alert on-call — never silently drop.

---

## 8. ARQ alternative (optional)

For teams preferring native asyncio:

| ARQ queue | Maps to Celery |
|-----------|----------------|
| `arq:ishbor:notifications` | `ishbor.notifications` |
| `arq:ishbor:cache` | `ishbor.cache` |

**Rule:** Do not run duplicate consumers on the same queue. Choose Celery OR ARQ per queue, not both.

---

## 9. Docker worker deployment

```yaml
# docker-compose.yml (excerpt)
  celery-worker-notifications:
    build: .
    command: celery -A app.workers.celery_app worker -Q ishbor.notifications -c 4 --loglevel=info
    depends_on: [redis, postgres]
    restart: unless-stopped

  celery-worker-escrow:
    build: .
    command: celery -A app.workers.celery_app worker -Q ishbor.escrow -c 2 --loglevel=info

  celery-beat:
    build: .
    command: celery -A app.workers.celery_app beat --loglevel=info
```

**Scaling trigger:** Queue depth > 500 for 5 min → add worker replica for that queue.

---

## 10. Monitoring

| Metric | Alert |
|--------|-------|
| Queue depth per queue | > 500 sustained |
| Task failure rate | > 5% / 5 min |
| Task latency p95 | > 30s (notifications), > 60s (analytics) |
| Outbox backlog | > 100 unprocessed > 5 min old |
| Worker memory | > 80% container limit |

---

## 11. Scheduled jobs (Celery beat)

| Beat task | Schedule | Task name |
|-----------|----------|-----------|
| Outbox poller | Every 5s | `ishbor.outbox.poll` |
| Ranking refresh | */15 * * * * | `ishbor.analytics.refresh_rankings` |
| Session cleanup | 0 3 * * * | `ishbor.auth.cleanup_sessions` |
| Featured expiry | 0 * * * * | `ishbor.marketplace.expire_featured` |
| Subscription renewal | 0 6 * * * | `ishbor.commerce.subscription_renewal` |
| Job alert digest | 0 8 * * * | `ishbor.marketplace.job_alert_digest` |
| Wallet pending release | */30 * * * * | `ishbor.commerce.wallet_pending_release` |

---

*See also: [EVENT_ARCHITECTURE.md](../EVENT_ARCHITECTURE.md), [fastapi/BACKGROUND_JOBS.md](../fastapi/BACKGROUND_JOBS.md), [REDIS_ARCHITECTURE.md](./REDIS_ARCHITECTURE.md)*
