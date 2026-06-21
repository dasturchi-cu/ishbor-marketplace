# Ishbor Notifications — Documentation Index

**Scope:** Multi-channel notification system for Ishbor marketplace  
**Primary language:** Uzbek (user-facing copy)  
**Stack:** FastAPI + PostgreSQL `notifications` table + Celery NotificationWorker + WebSocket + Resend email + Eskiz SMS  
**Domain spec:** [13-domains/NOTIFICATIONS.md](../13-domains/NOTIFICATIONS.md)  
**Architecture:** [11-backend/NOTIFICATION_ARCHITECTURE.md](../11-backend/NOTIFICATION_ARCHITECTURE.md)

---

## Purpose

Ishbor notifies users about marketplace activity — proposals, orders, escrow, payments, admin actions — across four channels. In-app notifications are P0; email is P1; SMS is critical-only; push is future mobile.

**Demo today:** `notifications-store.ts` + synchronous `addNotification()` calls from 20+ stores.  
**Production target:** Domain event outbox → `NotificationWorker` → DB insert → channel dispatch.

---

## Document map

| Document | Channel | Contents |
|----------|---------|----------|
| [EMAIL_NOTIFICATION_MATRIX.md](./EMAIL_NOTIFICATION_MATRIX.md) | Email (Resend) | Event → template → recipient for all Ishbor events |
| [SMS_NOTIFICATION_MATRIX.md](./SMS_NOTIFICATION_MATRIX.md) | SMS (Eskiz) | OTP + critical alerts only |
| [PUSH_NOTIFICATION_MATRIX.md](./PUSH_NOTIFICATION_MATRIX.md) | Mobile push (future) | Event mapping for React Native / FCM |
| [IN_APP_NOTIFICATION_MATRIX.md](./IN_APP_NOTIFICATION_MATRIX.md) | In-app feed | `NotificationKind` → store triggers → `/notifications` UI |

---

## Notification kinds (`NotificationKind`)

From `notifications-store.ts`:

```
payment | proposal | review | system | message | escrow | order | portfolio | admin
```

Each kind maps to nav badge styling and default priority. High-priority kinds bypass digest batching.

---

## Pipeline (production)

```
Domain Event (CheckoutCompleted, ApplicationSubmitted, …)
  → outbox_events INSERT
  → Celery NotificationWorker
    → load notification_preferences for user_id
    → if inApp: INSERT notifications + WS publish user:{id}
    → if email: enqueue EmailJob (Resend)
    → if sms (critical only): enqueue SmsJob (Eskiz)
    → if push (future): enqueue PushJob (FCM)
```

WebSocket event: `notification.new` with `{ id, kind, title, body, href, unreadCount }`.

---

## Storage

| Layer | Key / table | Cap |
|-------|-------------|-----|
| Demo | `ishbor-notifications` localStorage | 100 per user |
| Production | `notifications` PostgreSQL | 500 total; archive after 90 days |
| Preferences | `notification_preferences` JSONB | Per channel toggles |

Unread badge: `GET /notifications/unread-count` — replaces client `getUnreadCount()`.

---

## User-facing route

`/notifications` — feed with read/dismiss/mark-all-read.  
Nav badge via `useSyncExternalStore(subscribeNotifications, getUnreadCount)`.

Settings: `/settings` notification tab — maps to `notification_preferences` (server-side in production).

---

## Admin notifications

Admin actions that notify end users use `notifyAdminAction()` pattern:

- Verification approved/rejected
- Account suspended/banned
- Dispute resolved
- Portfolio moderation decision
- Withdrawal rejected

See [19-admin/KYC_VERIFICATION.md](../19-admin/KYC_VERIFICATION.md) and [USER_BAN_SYSTEM.md](../19-admin/USER_BAN_SYSTEM.md).

---

## Channel priority matrix

| Priority | In-app | Email | SMS | Push |
|----------|--------|-------|-----|------|
| Critical (escrow dispute, withdrawal fail) | ✅ immediate | ✅ immediate | ✅ if enabled | ✅ future |
| High (proposal, order, payment) | ✅ immediate | ✅ if pref | ❌ | ✅ future |
| Normal (review, portfolio) | ✅ immediate | ✅ digest optional | ❌ | opt-in |
| Low (AI tips, profile nudge) | ✅ immediate | ❌ | ❌ | ❌ |

---

## Template language rules

- All user-visible strings in Uzbek
- Amounts: USD with `formatUsd()` in app; email may show UZS equivalent for local users
- Deep links: absolute `https://ishbor.uz{href}` in email; relative `href` in-app
- From address: `noreply@ishbor.uz`
- Reply-to: `support@ishbor.uz`

---

## Related backend modules

```
app/
├── services/notification_service.py
├── workers/notification_worker.py
├── workers/email_worker.py
├── workers/sms_worker.py
├── templates/email/          # Jinja2 HTML + text
└── routers/notifications.py
```

---

## Migration checklist

- [ ] Replace all `addNotification()` in stores with domain events
- [ ] Persist preferences server-side (Phase 14 fix)
- [ ] Cap enforcement in API not client slice(0, 100)
- [ ] WebSocket unread count sync
- [ ] Email bounce handling → unverified flag
- [ ] 90-day archive cron job

---

## Cross-references

| Topic | Document |
|-------|----------|
| Payment alerts | [11-backend/payments/PAYOUT_SYSTEM.md](../11-backend/payments/PAYOUT_SYSTEM.md) |
| Auth OTP SMS | [11-backend/infrastructure/SMS_ARCHITECTURE.md](../11-backend/infrastructure/SMS_ARCHITECTURE.md) |
| Admin audit | [19-admin/AUDIT_LOG_WORKFLOW.md](../19-admin/AUDIT_LOG_WORKFLOW.md) |
| WebSocket spec | [11-backend/WEBSOCKET_SPECIFICATION.md](../11-backend/WEBSOCKET_SPECIFICATION.md) |

---

*Notifications re-engage users at every trust-critical moment — proposal received, escrow funded, payment landed. One event, four channels, Uzbek copy throughout.*
