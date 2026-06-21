# CHAT_EVENTS.md

**Scope:** WebSocket chat and offer events for Ishbor messaging  
**Domain source:** [MESSAGES.md](../../13-domains/MESSAGES.md)  
**Store mapping:** `messages-store.ts` — sendMessage, receiveMessage, updateOfferState, setTyping, markConversationRead

---

## 1. Message types in thread

| type | Direction | Purpose |
|------|-----------|---------|
| text | bidirectional | Standard chat body |
| file | bidirectional | Attachment metadata — file via presign flow |
| offer | freelancer → client | Price/delivery proposal |
| escrow | system | Escrow status embedded in thread |

All types use same `message.new` envelope with `payload.message.type` discriminator.

---

## 2. Client → Server: message.send

**Action:** `message.send`

| Field | Required | Notes |
|-------|----------|-------|
| conversationId | yes | UUID |
| type | yes | text \| file \| offer |
| body | text only | Max 8 KB, sanitized server-side |
| fileId | file only | From `/files/confirm` |
| offer | offer only | `{ amount, currency, deliveryDays, description? }` |

**Authorization:** Caller must be `conversation_participants` row.

**Server steps:**
1. Validate DTO + participant
2. INSERT `messages` PostgreSQL
3. UPDATE conversation `last_message_at`
4. PUBLISH `message.new` to conversation channel + recipient user channel
5. Enqueue notification for recipient if offline or not in thread focus

**Rate limit:** 30 messages/min/conversation per user.

---

## 3. Server → Client: message.new

**Type:** `message.new`

```json
{
  "v": 1,
  "type": "message.new",
  "id": "evt-uuid",
  "ts": "2026-06-20T12:00:00.000Z",
  "payload": {
    "conversationId": "uuid",
    "message": {
      "id": "uuid",
      "from": "user-uuid",
      "fromRole": "freelancer",
      "type": "text",
      "body": "Salom, loyiha tafsilotlarini yuboring",
      "time": "2026-06-20T12:00:00.000Z",
      "offer": null
    }
  }
}
```

### Offer message shape

When `type=offer`:

```json
"offer": {
  "id": "offer-uuid",
  "amount": 5000000,
  "currency": "UZS",
  "deliveryDays": 14,
  "state": "pending",
  "description": "Dizayn + frontend"
}
```

**Store mapping:** `receiveMessage(conversationId, message)` — append to thread, bump unread if not active conversation.

---

## 4. Typing indicators

### Client → Server

| Action | Payload |
|--------|---------|
| `typing.start` | `{ conversationId }` |
| `typing.stop` | `{ conversationId }` |

Client should emit `typing.start` on input change debounced 300ms; `typing.stop` on blur or 3s idle.

### Server → Client

**Type:** `typing`

```json
{
  "v": 1,
  "type": "typing",
  "id": "evt-uuid",
  "ts": "ISO8601",
  "payload": {
    "conversationId": "uuid",
    "userId": "uuid",
    "isTyping": true
  }
}
```

| Rule | Value |
|------|-------|
| TTL | Server clears `isTyping=true` after 5s without refresh |
| Scope | Broadcast to other participants only — not echo to sender |
| Store mapping | `setTyping(conversationId, userId, isTyping)` |

Fixes B-024 always-visible typing — real TTL-based indicator on `/messages`.

---

## 5. Read receipts

### Client → Server

**Action:** `message.read`

```json
{ "conversationId": "uuid", "messageId": "uuid-optional" }
```

| messageId | Behavior |
|-----------|----------|
| present | Mark read through that message |
| omitted | Mark entire conversation read |

### Server → Client

**Type:** `message.read`

```json
{
  "v": 1,
  "type": "message.read",
  "id": "evt-uuid",
  "ts": "ISO8601",
  "payload": {
    "conversationId": "uuid",
    "messageId": "uuid-or-null",
    "readBy": "user-uuid",
    "readAt": "ISO8601"
  }
}
```

**Store mapping:** `markConversationRead()` — sync unread badge; update `lastRead` per participant.

REST equivalent: `PATCH /conversations/:id/read` — same side effects, WS push to other participant.

---

## 6. Offer lifecycle events

Offer state machine: `pending` → `accepted` | `declined` | `expired`

### Accept flow (REST primary, WS notify)

Client calls `POST /conversations/:id/messages/:msgId/accept-offer`  
Server: `updateOfferState` → may create order  
WS broadcast:

**Type:** `offer.updated`

```json
{
  "v": 1,
  "type": "offer.updated",
  "id": "evt-uuid",
  "ts": "ISO8601",
  "payload": {
    "conversationId": "uuid",
    "messageId": "uuid",
    "offerId": "uuid",
    "state": "accepted",
    "orderId": "uuid-or-null",
    "acceptedBy": "client-uuid"
  }
}
```

| state | Side effects |
|-------|--------------|
| accepted | Order creation, notification.new, optional escrow.updated |
| declined | notification.new to freelancer |
| expired | System message in thread |

**Store mapping:** `updateOfferState(conversationId, messageId, state)` — update inline offer card UI.

---

## 7. System escrow messages

When escrow status changes, MessagingService inserts `type=escrow` message and emits `message.new`:

```json
"message": {
  "type": "escrow",
  "body": "Eskrou moliyalashtirildi",
  "escrow": {
    "escrowId": "uuid",
    "status": "funded",
    "amount": 5000000
  }
}
```

Maps `fundEscrowMessage()` in messages domain.

---

## 8. Channel routing

| Event | Redis channels |
|-------|----------------|
| message.new | `ishbor:ws:conversation:{id}`, `ishbor:ws:user:{recipientId}:messages` |
| typing | `ishbor:ws:conversation:{id}` |
| message.read | `ishbor:ws:conversation:{id}` |
| offer.updated | `ishbor:ws:conversation:{id}` |

Recipient must subscribe `conversation:{id}` while thread open — gateway auto-subscribes on `message.send` ack optional P1.

---

## 9. Offline and recovery

| Scenario | Behavior |
|----------|----------|
| Recipient offline | message.new delivered on reconnect after REST hydrate |
| Missed events | `GET /conversations/:id/messages?after={lastId}` |
| Optimistic send | Client assigns temp id; ack replaces with server id P1 |
| Duplicate message.new | Dedupe by `message.id` |

Offline queue: max 50 pending `message.send` in client — flush on reconnect.

---

## 10. Security summary

| Control | Detail |
|---------|--------|
| Participant ACL | Enforced on send and subscribe |
| XSS | Sanitize body server-side before INSERT and WS fan-out |
| Offer validation | Amount > 0, currency UZS default, deliveryDays 1–365 |
| File messages | Verify fileId ownership and scan status |

Full auth: [WEBSOCKET_SECURITY.md](./WEBSOCKET_SECURITY.md).

---

## 11. Frontend migration checklist

- [ ] Replace `subscribeMessages()` polling with WS `message.new`
- [ ] Wire input onChange to `typing.start` / `typing.stop`
- [ ] Handle `offer.updated` to refresh offer card without full reload
- [ ] Dedupe inbound events by `id`
- [ ] Initial page load via REST `GET /conversations`

---

## 12. Related documents

- [MESSAGES.md](../../13-domains/MESSAGES.md)
- [REALTIME_EVENTS.md](./REALTIME_EVENTS.md)
- [NOTIFICATION_EVENTS.md](./NOTIFICATION_EVENTS.md) — message triggers notification.new
- [WEBSOCKET_ARCHITECTURE.md](./WEBSOCKET_ARCHITECTURE.md)

---

*Chat WS events mirror messages-store semantics — typing, message.new, offer.accepted via offer.updated.*
