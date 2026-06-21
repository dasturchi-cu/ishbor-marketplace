# NOTIFICATION_EVENTS.md

**Scope:** WebSocket notification events for Ishbor activity feed  
**Domain source:** [NOTIFICATIONS.md](../../13-domains/NOTIFICATIONS.md)  
**Store mapping:** `notifications-store.ts` — addNotification, markNotificationRead, getUnreadCount

---

## 1. Architecture overview

```
Domain action (e.g. acceptApplication)
  → NotificationService.create()
  → INSERT notifications (PostgreSQL)
  → PUBLISH Redis ishbor:ws:user:{userId}:notifications
  → WS Gateway pushes to client
  → notifications-store.addNotification()
  → Nav badge updates via useSyncExternalStore
```

Email digest for critical kinds (escrow funded, payment received) runs async via BullMQ — separate from WS push.

---

## 2. Notification kinds

From NotificationKind enum — all may appear in WS payload:

| kind | Example trigger |
|------|-----------------|
| application | New proposal on project |
| order | Order status change |
| message | New message when user not in thread |
| payment | Deposit confirmed |
| escrow | Funded, released, disputed |
| review | New review received |
| subscription | Plan upgrade/cancel |
| system | Platform announcements |

**Priority:** `low` | `normal` | `high` — affects toast display, not delivery.

---

## 3. Server → Client: notification.new

**Type:** `notification.new`

```json
{
  "v": 1,
  "type": "notification.new",
  "id": "evt-uuid",
  "ts": "2026-06-20T12:00:00.000Z",
  "payload": {
    "notification": {
      "id": "uuid",
      "kind": "escrow",
      "title": "Eskrou moliyalashtirildi",
      "body": "Buyurtma #1234 uchun 5 000 000 so'm band qilindi",
      "priority": "high",
      "href": "/escrow/uuid",
      "read": false,
      "createdAt": "2026-06-20T12:00:00.000Z",
      "meta": {
        "orderId": "uuid",
        "escrowId": "uuid"
      }
    },
    "unreadCount": 5
  }
}
```

| Field | Purpose |
|-------|---------|
| notification.id | Dedupe key — maps `AppNotification.id` |
| kind | Icon and routing in feed UI |
| title/body | Uzbek copy — generated server-side |
| href | In-app navigation target |
| unreadCount | Authoritative badge count — avoids extra REST round-trip |
| meta | Structured data for analytics — not shown raw in UI |

**Store mapping:** `addNotification(userId, notification)` + set unread from `unreadCount`.

Maps `notification-events.ts` helper functions → realtime push.

---

## 4. Server → Client: unread.count

**Type:** `unread.count`

Lightweight badge sync without full notification object:

```json
{
  "v": 1,
  "type": "unread.count",
  "id": "evt-uuid",
  "ts": "ISO8601",
  "payload": {
    "unreadCount": 3
  }
}
```

**Emitted when:**
- User marks single notification read (REST or WS)
- User marks all read
- Bulk dismiss
- Reconnect sync after `GET /notifications/unread-count` mismatch

**Store mapping:** Direct update to unread counter snapshot — stable `useSyncExternalStore` getter.

---

## 5. Server → Client: notification.read

**Type:** `notification.read`

Cross-tab sync when user reads on another device:

```json
{
  "v": 1,
  "type": "notification.read",
  "id": "evt-uuid",
  "ts": "ISO8601",
  "payload": {
    "notificationId": "uuid",
    "readAt": "ISO8601",
    "unreadCount": 2
  }
}
```

**Store mapping:** `markNotificationRead(userId, notificationId)`.

---

## 6. Trigger map (domain → notification.new)

| Domain event | Recipient | kind | priority |
|--------------|-----------|------|----------|
| createApplication | project owner (client) | application | normal |
| acceptApplication | freelancer | application | high |
| rejectApplication | freelancer | application | normal |
| sendOffer (WS message) | offer recipient | message | normal |
| order created | both parties | order | high |
| escrow funded | both parties | escrow | high |
| payment received | wallet owner | payment | high |
| new review | reviewee | review | normal |
| subscription expiring | subscriber | subscription | normal |

Worker reads from transactional outbox — at-least-once delivery to WS.

---

## 7. Client subscription

Subscribe to user notifications channel on connect:

```json
{ "v": 1, "action": "subscribe", "channels": ["notifications"] }
```

Resolves to Redis: `ishbor:ws:user:{authenticatedUserId}:notifications`

**ACL:** User may only subscribe to own userId channel — enforced at gateway.

Admin does not receive user notification channels — separate admin:activity feed.

---

## 8. Interaction with REST

| Operation | Primary transport | WS follow-up |
|-----------|-------------------|--------------|
| Page load | GET /notifications?page=1 | — |
| Badge only | GET /notifications/unread-count | unread.count on change |
| Mark read | PATCH /notifications/:id/read | notification.read + unread.count |
| Mark all read | POST /notifications/read-all | unread.count |
| Dismiss | DELETE P1 | notification.read or remove event |

REST remains authoritative for paginated history; WS for incremental updates.

---

## 9. Reconnect behavior

On WebSocket reconnect:

1. Client calls `GET /notifications/unread-count`
2. Compare with local badge — reconcile if drift
3. Optional: `GET /notifications?since={lastNotificationId}` P1
4. Resubscribe `notifications` channel

Missed notifications during disconnect recovered via REST — WS is not durable queue.

---

## 10. Preferences and filtering

User preferences (`GET/PATCH /notifications/preferences`) control:

| Preference | WS behavior |
|------------|-------------|
| kind disabled | Still INSERT DB — WS suppressed for that kind |
| email digest only | WS still pushes in-app — email async |
| quiet hours P1 | WS delivered — toast suppressed client-side |

Server includes `muted: true` in meta when kind disabled — client skips toast.

---

## 11. Scalability notes

From NOTIFICATIONS.md: 100k users × 20 notifications ≈ 2M rows.

| Practice | Detail |
|----------|--------|
| TTL archive | 90 days — WS only for live rows |
| unreadCount | Redis cache `ishbor:notify:unread:{userId}` invalidated on read |
| Fan-out | Single PUBLISH per notification — gateways handle local delivery |
| Payload size | Keep body < 512 chars — truncate with ellipsis server-side |

---

## 12. Security

| Control | Detail |
|---------|--------|
| Channel isolation | user:{id} ACL — no cross-user subscribe |
| href validation | Internal paths only — no `javascript:` |
| meta sanitization | JSON serializable scalars only |
| Rate limit | Max 100 notification.new / user / hour — burst protection |

---

## 13. Frontend migration checklist

- [ ] Replace `subscribeNotifications()` polling
- [ ] Nav badge driven by unread.count + initial REST
- [ ] Toast on notification.new when priority high and page visible
- [ ] Dedupe by notification.id
- [ ] /notifications page merges WS incremental into list

---

## 14. Related documents

- [NOTIFICATIONS.md](../../13-domains/NOTIFICATIONS.md)
- [NOTIFICATION_ARCHITECTURE.md](../NOTIFICATION_ARCHITECTURE.md)
- [REALTIME_EVENTS.md](./REALTIME_EVENTS.md)
- [CHAT_EVENTS.md](./CHAT_EVENTS.md)
- [WEBSOCKET_SECURITY.md](./WEBSOCKET_SECURITY.md)

---

*notification.new and unread.count drive notifications-store and nav badge in realtime.*
