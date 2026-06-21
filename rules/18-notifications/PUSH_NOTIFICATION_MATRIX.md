# PUSH_NOTIFICATION_MATRIX.md

**Status:** Future — React Native mobile app (P2/P3 roadmap)  
**Provider target:** Firebase Cloud Messaging (FCM) for Android + APNs via FCM for iOS  
**Web Push:** Optional P2 via Web Push API for PWA — lower priority than native  
**Stack:** FastAPI `PushService` + `device_push_tokens` table + Celery `PushWorker`

---

## 1. Scope

This document defines event → push payload mapping for Ishbor mobile clients **before implementation**. In-app notifications (`notifications-store`) remain source of truth; push is a delivery channel mirroring high-priority in-app events.

**Not in scope P0:** Push for demo web app — badge uses `getUnreadCount()` only.

---

## 2. Platform assumptions

| Platform | Min version | Notes |
|----------|-------------|-------|
| Android | API 26+ | FCM default channel `ishbor_high` |
| iOS | 15+ | APNs permission prompt on first high-value event |
| Web PWA | Chrome 90+ | Optional; user opt-in per browser |

Token storage:

```sql
CREATE TABLE device_push_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  platform enum('android','ios','web'),
  created_at timestamptz,
  last_used_at timestamptz
);
```

Invalidate token on logout from device; remove on FCM `InvalidRegistration`.

---

## 3. Payload schema

```json
{
  "notification": {
    "title": "Yangi taklif olindi",
    "body": "\"{projectTitle}\" loyihangiz uchun yangi taklif keldi."
  },
  "data": {
    "kind": "proposal",
    "href": "/projects/{slug}",
    "notification_id": "{uuid}",
    "priority": "high"
  }
}
```

**Rules:**
- `title` + `body` in Uzbek — same copy as in-app
- `data.href` for deep link — mobile router resolves
- Never put PII or amounts in notification tray on lock screen for sensitive events — use generic title ("To'lov yangilanishi") with detail in-app only (user setting)

---

## 4. Event matrix — high priority (push default ON)

| Event | kind | Title (UZ) | Body pattern | Deep link |
|-------|------|------------|--------------|-----------|
| ApplicationSubmitted | proposal | Yangi taklif olindi | "{projectTitle}" loyihangiz uchun yangi taklif keldi. | /projects/{slug} |
| ApplicationAccepted | proposal | Taklif qabul qilindi | "{projectTitle}" taklifingiz qabul qilindi. | /orders/{id} |
| OrderCreated | order | Buyurtma yaratildi | "{orderTitle}" buyurtmasi yaratildi. | /orders/{id} |
| CheckoutConfirmed | escrow | Eskrou moliyalashtirildi | ${amount} eskrouda — {orderTitle}. | /escrow/{id} |
| EscrowMilestoneReleased | payment | Bosqich to'lovi qabul qilindi | ${amount} "{project}" dan. | /wallet |
| MessageReceivedOffline | message | Yangi xabar | {senderName}: {preview} | /messages?thread={id} |
| EscrowDisputeOpened | escrow | Nizo ochildi | "{orderTitle}" — javob bering. | /escrow/{id} |
| WithdrawalCompleted | payment | Yechib olish yakunlandi | ${amount} kartangizga o'tkazildi. | /wallet |
| VerificationApproved | admin | Tasdiqlash tasdiqlandi | Endi yechib olish mumkin. | /wallet |
| AccountSuspended | admin | Hisob to'xtatildi | Qo'llab-quvvatlash bilan bog'laning. | /support |

Maps `notification-events.ts` + checkout/escrow route inline notifications.

---

## 5. Event matrix — normal priority (push opt-in)

| Event | kind | Default push |
|-------|------|--------------|
| ReviewSubmitted | review | off |
| PortfolioApproved | portfolio | on |
| JobAlertMatch | proposal | on (freelancers) |
| SavedSearchMatch | system | off |
| SubscriptionRenewed | system | off |
| FeaturedListingActivated | system | off |
| ReferralCredited | system | off |
| AgencyInviteSent | system | on |

User toggles in mobile Settings → `notification_preferences.push.{category}`.

---

## 6. Event matrix — never push

| Event | Reason |
|-------|--------|
| OtpLoginSend | SMS only — never push OTP |
| ProfileCompletionNudge | In-app noise |
| AI opportunity score tips | In-app only |
| Analytics / digest batch | Email digest instead |
| Admin internal audit | Not user-facing |
| WebSocket heartbeat | N/A |

---

## 7. Android notification channels

| Channel ID | Importance | Events |
|------------|------------|--------|
| `ishbor_critical` | HIGH | disputes, suspend, withdrawal |
| `ishbor_payments` | HIGH | escrow, wallet |
| `ishbor_work` | DEFAULT | orders, proposals |
| `ishbor_social` | LOW | reviews, portfolio |
| `ishbor_messages` | DEFAULT | messages |

User can disable channels in OS settings — app respects but shows in-app banner to re-enable for payments.

---

## 8. iOS considerations

- Request permission after first escrow fund or proposal — not at cold launch (conversion)
- `UNNotificationCategory` actions:
  - `PROPOSAL_VIEW` → "Ko'rish"
  - `MESSAGE_REPLY` → "Javob berish" (text input P3)
- Badge count synced from `GET /notifications/unread-count`

---

## 9. PushWorker (FastAPI / Celery)

```python
@celery.task(queue="notifications")
def send_push(notification_id: UUID):
    n = notifications_repo.get(notification_id)
    tokens = push_tokens.list_active(n.user_id)
    if not should_push(n.kind, n.user_id):
        return
    payload = build_fcm_payload(n)
    for token in tokens:
        fcm.send(token, payload)
```

Coalesce: max 1 push per `(user_id, kind, entity_id)` per 5 minutes — prevents spam on message bursts.

---

## 10. Silent/data pushes (background)

| Event | Data-only | Purpose |
|-------|-----------|---------|
| WalletBalanceUpdated | yes | Refresh wallet widget |
| UnreadCountChanged | yes | Badge sync |
| EscrowStatusChanged | yes | Refresh order screen if open |

No user-visible notification — `content_available: true` on iOS.

---

## 11. Preference defaults (mobile first install)

```json
{
  "push": {
    "proposals": true,
    "orders": true,
    "escrow": true,
    "payments": true,
    "messages": true,
    "reviews": false,
    "marketing": false
  }
}
```

Aligns with `notification_preferences` in NOTIFICATION_ARCHITECTURE.md.

---

## 12. Testing checklist (pre-launch)

- [ ] Deep link opens correct screen cold start
- [ ] Tap coalescing works for 10 messages in 1 min
- [ ] Logout removes token from server
- [ ] Suspended user tokens rejected at send time
- [ ] Uzbek copy fits without truncation on small devices
- [ ] Lock screen privacy mode hides amounts

---

## 13. Relationship to other channels

| Priority | Push | SMS | Email | In-app |
|----------|------|-----|-------|--------|
| Critical dispute | ✅ | ✅ | ✅ | ✅ |
| Proposal | ✅ | ❌ | ✅ | ✅ |
| OTP | ❌ | ✅ | ❌ | ❌ |

Push fills gap when user offline from web but has mobile app installed.

---

*Push notifications extend Ishbor in-app feed to the lock screen — same events, same Uzbek copy, deep-linked into mobile routes when the native app ships.*
