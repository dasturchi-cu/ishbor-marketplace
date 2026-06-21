# WEBSOCKET_SPECIFICATION.md

> **Canonical websocket docs:** [websockets/](./websockets/) — FastAPI WS, Redis pub/sub, nginx upgrade.  
> Start with [websockets/WEBSOCKET_ARCHITECTURE.md](./websockets/WEBSOCKET_ARCHITECTURE.md).

**Endpoint:** `wss://api.ishbor.uz/ws/v1`  
**Replaces:** Polling/subscribe patterns in `messages-store`, `notifications-store`, live activity feed  
**Transport:** WebSocket with Redis pub/sub for horizontal scale

---

## 1. Connection handshake

```
Client → WSS connect with Cookie: ishbor_sid=...
Server → validate session
       → assign connectionId
       → subscribe Redis channels for userId
       → send { type: "connected", payload: { userId, serverTime } }
```

**Auth failure:** close code `4001` unauthorized  
**Rate limit:** max 5 connections per user (close oldest)

---

## 2. Channel subscriptions

Client sends after connect:

```json
{ "action": "subscribe", "channels": ["notifications", "messages", "presence"] }
```

| Channel | Scope | Purpose |
|---------|-------|---------|
| `user:{userId}:notifications` | Private | New notifications, unread count |
| `user:{userId}:messages` | Private | New messages, read receipts |
| `conversation:{conversationId}` | Participant only | Typing, live thread updates |
| `presence:{userId}` | Public opt-in | Online status |
| `admin:activity` | Admin only | Live platform feed |

Server validates channel access before Redis SUBSCRIBE.

---

## 3. Client → Server events

| Event | Payload | Handler |
|-------|---------|---------|
| `message.send` | `{ conversationId, type, body?, fileId?, offer? }` | MessagingService |
| `message.read` | `{ conversationId, messageId? }` | Mark read |
| `typing.start` | `{ conversationId }` | Broadcast to other participant |
| `typing.stop` | `{ conversationId }` | Broadcast |
| `presence.update` | `{ status: "online" \| "away" \| "offline" }` | PresenceService |
| `ping` | `{}` | `pong` |

**Validation:** Same DTOs as REST messaging endpoints.

---

## 4. Server → Client events

### 4.1 Notifications

```json
{
  "type": "notification.new",
  "payload": {
    "id": "uuid",
    "kind": "escrow",
    "title": "Eskrou moliyalashtirildi",
    "body": "...",
    "priority": "high",
    "href": "/escrow/uuid",
    "unreadCount": 5
  }
}
```

Maps `notification-events.ts` functions → realtime push.

### 4.2 Messages

```json
{
  "type": "message.new",
  "payload": {
    "conversationId": "uuid",
    "message": { "id", "from", "type", "body", "time", "offer?" }
  }
}
```

```json
{ "type": "message.read", "payload": { "conversationId", "messageId", "readBy" } }
```

```json
{ "type": "offer.updated", "payload": { "conversationId", "messageId", "state": "accepted", "orderId" } }
```

### 4.3 Typing

```json
{ "type": "typing", "payload": { "conversationId", "userId", "isTyping": true } }
```

**TTL:** Typing indicator expires 5s without refresh.

### 4.4 Presence

```json
{ "type": "presence", "payload": { "userId", "status": "online", "lastSeenAt" } }
```

### 4.5 Wallet / escrow (optional realtime)

```json
{ "type": "wallet.updated", "payload": { "available", "escrow", "pending" } }
{ "type": "escrow.updated", "payload": { "escrowId", "status", "milestones" } }
```

Triggered after checkout, release, dispute — keeps wallet page in sync.

### 4.6 Admin live feed

```json
{
  "type": "admin.activity",
  "payload": {
    "type": "order",
    "title": "Yangi buyurtma",
    "description": "...",
    "time": "ISO8601"
  }
}
```

Maps admin dashboard `ActivityEvent`.

---

## 5. Event → WebSocket fan-out map

| Domain event | WS event | Channels |
|--------------|----------|----------|
| NotificationCreated | notification.new | user:{id}:notifications |
| MessageCreated | message.new | conversation:{id}, user:{recipient}:messages |
| OfferAccepted | offer.updated | conversation:{id} |
| TypingStarted | typing | conversation:{id} |
| EscrowFunded | escrow.updated, notification.new | participants |
| WalletCredited | wallet.updated | user:{id} |
| UserRegistered | admin.activity | admin:activity |

Full map in [EVENT_ARCHITECTURE.md](./EVENT_ARCHITECTURE.md).

---

## 6. Reconnection & offline

| Scenario | Behavior |
|----------|----------|
| Disconnect | Client exponential backoff reconnect |
| Reconnect | Re-subscribe channels, `GET /notifications/unread-count`, fetch missed messages since `lastMessageId` |
| Offline queue | Client queues `message.send` until connected (max 50) |
| Duplicate delivery | Client dedupe by message `id` |

---

## 7. Scale architecture

```
[WS Gateway 1] ──┐
[WS Gateway 2] ──┼── Redis Pub/Sub ── [API Workers emit events]
[WS Gateway N] ──┘
```

- Sticky sessions via load balancer cookie OR Redis connection registry
- Max 50k concurrent connections per gateway (target)
- Heartbeat ping every 30s; disconnect after 90s silence

---

## 8. Security

| Control | Detail |
|---------|--------|
| Auth on connect | Session cookie only (no token in query string) |
| Channel ACL | Server validates participant before subscribe |
| Message size | Max 8KB text, offers validated server-side |
| Rate limit | 30 messages/min/conversation |
| XSS | Sanitize message body server-side |

---

## 9. Frontend migration

| Current store | Target |
|---------------|--------|
| `subscribeMessages()` | WS `message.new` + initial REST load |
| `subscribeNotifications()` | WS `notification.new` |
| Always-visible typing indicator (B-024) | Real typing events with TTL |
| Voice/video toast (B-025) | Future WebRTC — out of v1 WS scope |

---

*Realtime requirements derived from: `messages-store.ts`, `notifications-store.ts`, `live-activity-feed.tsx`, `call-store.ts`*
