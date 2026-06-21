# REALTIME_EVENTS.md

**Scope:** WebSocket event envelope specification for Ishbor Marketplace  
**Version:** v1 (protocol version in every frame)  
**Transport:** JSON text frames on `wss://api.ishbor.uz/ws/v1`

---

## 1. Design goals

| Goal | Approach |
|------|----------|
| Consistency | Single envelope shape for all event types |
| Evolution | Version field + additive payload fields |
| Debuggability | Correlation IDs link WS to REST/audit |
| Client deduplication | Stable `id` on every server→client event |
| Bilingual | User strings in payload; `type` keys English |

---

## 2. Wire format

### 2.1 Client → Server frame

```json
{
  "v": 1,
  "action": "message.send",
  "id": "client-uuid-optional",
  "payload": { }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `v` | yes | Protocol version — currently `1` |
| `action` | yes | Handler key — see action registry |
| `id` | no | Client correlation ID — echoed in ack/error |
| `payload` | yes | Action-specific body — may be `{}` |

### 2.2 Server → Client frame

```json
{
  "v": 1,
  "type": "message.new",
  "id": "server-event-uuid",
  "ts": "2026-06-20T12:00:00.000Z",
  "payload": { }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `v` | yes | Protocol version |
| `type` | yes | Event type key |
| `id` | yes | Unique event ID — dedupe key |
| `ts` | yes | Server ISO8601 UTC timestamp |
| `payload` | yes | Event body |

### 2.3 Error frame

```json
{
  "v": 1,
  "type": "error",
  "id": "server-event-uuid",
  "ts": "ISO8601",
  "payload": {
    "code": "FORBIDDEN",
    "message": "Ruxsat yo'q",
    "action": "message.send",
    "clientId": "client-uuid-if-provided"
  }
}
```

### 2.4 Ack frame (optional P1)

```json
{
  "v": 1,
  "type": "ack",
  "id": "server-event-uuid",
  "ts": "ISO8601",
  "payload": { "clientId": "...", "action": "message.send", "resultId": "message-uuid" }
}
```

---

## 3. Versioning policy

| Rule | Detail |
|------|--------|
| Current version | `v: 1` |
| Breaking change | Increment `v` to `2`; gateway accepts both for 90-day overlap |
| Additive fields | Same `v` — clients ignore unknown payload keys |
| Deprecated types | Document in changelog; emit `deprecated.warning` once per session |
| Client negotiation | Future: `connect` payload `{ minV: 1, maxV: 1 }` |

Never embed protocol version in URL path alone — always in frame body.

---

## 4. Client → Server action registry

| action | Payload summary | Handler module |
|--------|-----------------|----------------|
| `subscribe` | `{ channels: string[] }` | WSS gateway |
| `unsubscribe` | `{ channels: string[] }` | WSS gateway |
| `ping` | `{}` | Gateway → `pong` |
| `message.send` | conversationId, type, body?, fileId?, offer? | MessagingService |
| `message.read` | conversationId, messageId? | MessagingService |
| `typing.start` | conversationId | MessagingService |
| `typing.stop` | conversationId | MessagingService |
| `presence.update` | status: online \| away \| offline | PresenceService |

Validation mirrors REST DTOs in API_SPECIFICATION.md §14.

---

## 5. Server → Client type registry

| type | Domain doc |
|------|------------|
| `connected` | WEBSOCKET_ARCHITECTURE.md |
| `pong` | heartbeat |
| `error` | this document |
| `ack` | optional |
| `notification.new` | NOTIFICATION_EVENTS.md |
| `notification.read` | NOTIFICATION_EVENTS.md |
| `unread.count` | NOTIFICATION_EVENTS.md |
| `message.new` | CHAT_EVENTS.md |
| `message.read` | CHAT_EVENTS.md |
| `typing` | CHAT_EVENTS.md |
| `offer.updated` | CHAT_EVENTS.md |
| `presence` | PRESENCE_SYSTEM.md |
| `wallet.updated` | P1 |
| `escrow.updated` | P1 |
| `admin.activity` | admin dashboard |

---

## 6. Domain event → WS fan-out map

| Internal domain event | WS type | Redis channel |
|-----------------------|---------|---------------|
| NotificationCreated | notification.new | ishbor:ws:user:{id}:notifications |
| NotificationRead | notification.read | ishbor:ws:user:{id}:notifications |
| UnreadCountChanged | unread.count | ishbor:ws:user:{id}:notifications |
| MessageCreated | message.new | conversation + recipient user channel |
| MessageRead | message.read | conversation |
| OfferStateChanged | offer.updated | conversation |
| TypingIndicator | typing | conversation |
| PresenceChanged | presence | ishbor:ws:presence:{userId} |
| EscrowFunded | escrow.updated + notification.new | participants |
| WalletCredited | wallet.updated | user channel |
| UserRegistered | admin.activity | admin channel |

Full internal bus: [EVENT_ARCHITECTURE.md](../EVENT_ARCHITECTURE.md).

---

## 7. Correlation and tracing

| Field | Usage |
|-------|-------|
| Client `id` | Tie ack/error to optimistic UI row |
| Server `id` | Dedupe in `messages-store` / `notifications-store` |
| `trace_id` (P1 payload) | Cross-service OpenTelemetry |

REST responses that trigger WS events should return same entity `id` as WS payload when synchronous.

---

## 8. Ordering guarantees

| Scope | Guarantee |
|-------|-----------|
| Single conversation | Messages ordered by server `ts` + monotonic DB sequence |
| Notifications | Ordered by `created_at` — client sorts on insert |
| Cross-channel | No global order — client handles independently |
| At-least-once | Duplicates possible — client dedupes by `id` |

Use PostgreSQL `messages.seq` BIGSERIAL for strict conversation ordering.

---

## 9. Payload size limits

| Limit | Value |
|-------|-------|
| Max frame size | 16 KB |
| Max message body | 8 KB text |
| Max channels per subscribe | 20 |
| Max subscriptions per connection | 50 |

Oversized frame → error `PAYLOAD_TOO_LARGE` → close code 1009.

---

## 10. Close codes

| Code | Meaning |
|------|---------|
| 4001 | Unauthorized — invalid/expired session |
| 4003 | Forbidden — ACL violation |
| 4008 | Policy — connection limit exceeded |
| 4009 | Message too big |
| 1000 | Normal closure |
| 1001 | Server shutdown / deploy |

Client maps 4001 → refresh session or redirect login.

---

## 11. Frontend store mapping

| Store function | WS event |
|----------------|----------|
| `receiveMessage()` | message.new |
| `markConversationRead()` | message.read (inbound sync) |
| `setTyping()` | typing |
| `updateOfferState()` | offer.updated |
| `addNotification()` | notification.new |
| `getUnreadCount()` sync | unread.count |
| `setOnlineStatus()` | presence |

Initial load always REST; WS is incremental.

---

## 12. Testing requirements

- [ ] Every frame includes `v: 1`
- [ ] Unknown `type` does not crash client
- [ ] Duplicate `id` ignored by store
- [ ] Error frame includes Uzbek `message`
- [ ] Version mismatch returns documented error

---

## 13. Related documents

- [WEBSOCKET_ARCHITECTURE.md](./WEBSOCKET_ARCHITECTURE.md)
- [CHAT_EVENTS.md](./CHAT_EVENTS.md)
- [NOTIFICATION_EVENTS.md](./NOTIFICATION_EVENTS.md)
- [PRESENCE_SYSTEM.md](./PRESENCE_SYSTEM.md)
- [WEBSOCKET_SECURITY.md](./WEBSOCKET_SECURITY.md)

---

*All Ishbor realtime frames use the v1 envelope — no bare unwrapped payloads.*
