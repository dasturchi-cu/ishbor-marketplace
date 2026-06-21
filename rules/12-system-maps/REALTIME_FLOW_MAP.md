# REALTIME_FLOW_MAP.md — Messages, Presence, Notifications

---

## 1. Current state (client-only)

| Capability | Implementation | Realtime? |
|------------|----------------|-----------|
| Message delivery | `messages-store` localStorage per user | **No** — same browser only |
| Typing indicator | `setTyping` + input onChange + refresh tick | **Local UI only** |
| Online status | `setOnlineStatus`, `getLastSeen` | **Local flag** |
| Notifications | `notifications-store` push on events | **No push** — poll on mount |
| Unread badges | nav `getTotalUnread`, `getUnreadCount` | useSyncExternalStore |
| Call history | `call-store` | Static records |

**Root gap:** No WebSocket, no SSE, no push notifications.

---

## 2. Messages architecture (code)

**Storage key:** `ishbor-messages-{userId}` (migrated from legacy `ishbor-messages`)

**Structure:**
```typescript
MessagesState {
  conversations: Conversation[]
  threads: Record<conversationId, ThreadMessage[]>
}
```

**Message types:** `text` | `offer` | `escrow` | `file`

**Offer lifecycle:** `pending` → `accepted` | `declined` | `expired`

**Key functions:**
- `sendMessage`, `receiveMessage` — append to thread
- `sendOffer`, `updateOfferState` — deal negotiation
- `fundEscrowMessage` — system escrow event in thread
- `markConversationRead`, `getTotalUnread`
- `searchConversations`, `archiveConversation`, `pinConversation`

**Route:** `/messages` — inbox filters: active | archived | all

---

## 3. Target realtime architecture

Per [WEBSOCKET_SPECIFICATION.md](../11-backend/WEBSOCKET_SPECIFICATION.md):

```
Client                    WebSocket Gateway              Redis           API
  │                              │                        │              │
  ├── connect (cookie auth) ────►│                        │              │
  │◄── connection.established ───│                        │              │
  ├── subscribe:conversation:* ─►│                        │              │
  │                              ├── subscribe channel ───►│              │
  POST /messages ────────────────────────────────────────────────────────►│
  │                              │◄── publish new_message ─│◄── outbox ──│
  │◄── message.new ──────────────│                        │              │
```

**Channels:**
- `user:{userId}` — notifications
- `conversation:{id}` — messages + typing
- `presence:{userId}` — online/away

---

## 4. Typing flow (target)

```
Client A: typing_start → WS → Redis pub → Client B: typing indicator (3s TTL)
Client A: typing_stop  → WS → clear
```

Current: `messages.tsx` calls `setTyping` on input — sufficient for demo single-user.

---

## 5. Notification flow (target)

```
Domain event → Outbox → NotificationWorker
  → INSERT notifications table
  → WS push to user:{userId}
  → Optional: email (Resend), push (future)

Client:
  GET /notifications (paginated)
  WS notification.new → increment badge
  markNotificationRead → PATCH API
```

Current kinds (`notifications-store`): application, order, message, system, payment, review, …

---

## 6. Presence flow (target)

```
Heartbeat every 30s → PATCH /presence
Disconnect → last_seen_at update
GET /users/:id/presence for profile "Mavjud" badge
```

Current: `formatLastSeen` in messages-store — client-computed strings.

---

## 7. Mobile / offline requirements

| Requirement | Target |
|-------------|--------|
| Offline queue | IndexedDB pending messages |
| Reconnect | Exponential backoff WS |
| Read receipts | message.read WS event |
| Push (PWA) | Service worker + web push |

See [MOBILE_STANDARDS.md](../05-mobile/MOBILE_STANDARDS.md).

---

## 8. Implementation priority

1. **Phase 4** (master plan): REST messages + WS gateway
2. Notification pipeline (in-app first)
3. Presence + typing via Redis TTL
4. Email digest for offline users
5. Mobile push (P2)

**Exit criteria:** Two browsers, two users, message appears <500ms without refresh.
