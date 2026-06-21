# NOTIFICATION_ARCHITECTURE.md

**Sources:** `notifications-store.ts`, `notification-events.ts`, settings notification tab, `ai-smart-notifications.ts`

---

## 1. Notification channels

| Channel | Phase | Provider |
|---------|-------|----------|
| In-app | P0 | PostgreSQL + WebSocket |
| Email | P1 | Resend / SendGrid |
| Push (web) | P2 | Web Push API |
| SMS | P3 | Eskiz (Uzbekistan) |

---

## 2. Notification kinds

From `NotificationKind` enum:

| Kind | Trigger events | Default priority |
|------|----------------|------------------|
| payment | WalletDeposited, withdrawal | high |
| proposal | ApplicationSubmitted, Accepted, Rejected | high |
| review | ReviewSubmitted | normal |
| system | ProjectClosed, account actions | normal |
| message | MessageSent (recipient offline) | normal |
| escrow | EscrowFunded, Released, Dispute | high |
| order | OrderCreated, Completed | high |
| portfolio | PortfolioApproved | normal |
| admin | AccountSuspended, verification | high |

---

## 3. Data model

### `notifications` table
See DATABASE_SCHEMA.md — cap 100 unread per user in UI, 500 total per user (archive older).

### `notification_preferences`
```json
{
  "email": {
    "proposals": true,
    "orders": true,
    "escrow": true,
    "messages": true,
    "marketing": false
  },
  "push": { ... },
  "inApp": { "all": true }
}
```

Maps settings tab toggles — persisted server-side (replaces localStorage prefs fix from Phase 14).

---

## 4. Notification pipeline

```
Domain Event
  → NotificationWorker
    → load user preferences
    → if inApp enabled: INSERT notifications
    → WebSocketPublisher → notification.new
    → if email enabled: enqueue EmailJob
    → if push enabled: enqueue PushJob
```

---

## 5. Template catalog (Uzbek)

| Template ID | Title | Body pattern |
|-------------|-------|--------------|
| `proposal.received` | Yangi taklif olindi | "{projectTitle}" loyihangiz uchun yangi taklif keldi. |
| `proposal.accepted` | Taklif qabul qilindi | "{projectTitle}" taklifingiz qabul qilindi. |
| `order.created` | Buyurtma yaratildi | "{orderTitle}" buyurtmasi yaratildi. |
| `escrow.funded` | Eskrou moliyalashtirildi | ${amount} eskrouda saqlanmoqda — {orderTitle}. |
| `escrow.released` | Eskrou mablag'i chiqarildi | ${amount} "{project}" uchun chiqarildi. |
| `review.received` | Yangi sharh olindi | "{project}" uchun {rating} yulduzli sharh. |
| `portfolio.approved` | Portfolio tasdiqlandi | "{title}" portfoliongiz e'lon qilindi. |
| `referral.credited` | Referral mukofoti | {amount} UZS kredit qo'shildi. |
| `subscription.renewed` | Obuna yangilandi | {planName} rejasi faollashtirildi. |
| `admin.action` | Platforma xabari | {custom body} |

Each template: `{ title, body, href, kind, priority }`

Maps every function in `notification-events.ts`.

---

## 6. Smart notifications (AI)

From `ai-smart-notifications.ts`:
- Digest proposals matching freelancer skills (daily job)
- Trust score drop alerts
- Stale order reminders (7 days no activity)

**Implementation:** Cron job queries `recommendations.ts` logic server-side → creates `system` kind notifications.

---

## 7. Job alerts

From `alerts-store.ts`:
- User saves search criteria (category, budget range, keywords)
- On `ProjectPublished` event → match against alerts → notify matching freelancers

**Table:** `job_alerts` (user_id, criteria jsonb, enabled)

---

## 8. Unread counts

```
GET /notifications/unread-count → { count: number }
WS notification.new → includes updated unreadCount
```

Replaces fake unread badge fix from Phase 29D.

---

## 9. Batch & pagination

| Endpoint | Behavior |
|----------|----------|
| GET /notifications?page=1&limit=50 | Paginated, newest first |
| POST /notifications/read-all | Mark all read for user |
| DELETE /notifications/:id | Soft delete (optional) |

Stress test: 100+ notifications — pagination required (Phase 28 fix pattern).

---

## 10. Admin notifications

Admin actions that notify users:
- Verification approved/rejected
- Account suspended
- Dispute resolved
- Portfolio moderation decision

Uses `notifyAdminAction()` equivalent server-side.

---

## 11. Email delivery

| Email type | Template |
|------------|----------|
| Welcome | register welcome |
| Verify email | link with token |
| Password reset | link with token |
| Proposal received | deep link to project |
| Order receipt | order summary |
| Weekly digest | optional P2 |

**From address:** `noreply@ishbor.uz`  
**Reply-to:** support@

---

## 12. Failure handling

| Failure | Action |
|---------|--------|
| Email bounce | Mark user email unverified flag |
| Push token invalid | Remove token |
| WS disconnect | In-app still persisted; fetch on reconnect |

---

*Replaces all `addNotification()` calls across 20+ store files.*
