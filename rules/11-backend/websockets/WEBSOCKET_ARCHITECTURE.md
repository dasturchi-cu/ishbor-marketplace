# WEBSOCKET_ARCHITECTURE.md

**Scope:** Realtime transport for Ishbor Marketplace  
**Endpoint:** `wss://api.ishbor.uz/ws/v1`  
**Stack:** FastAPI WebSocket, Redis pub/sub, Nginx upgrade proxy  
**Replaces:** Polling in `messages-store`, `notifications-store`, live activity feed

---

## 1. Purpose

Ishbor requires sub-second delivery for:

| Domain | Events |
|--------|--------|
| Messaging | message.new, typing, read receipts, offer.updated |
| Notifications | notification.new, unread.count |
| Presence | online, away, offline, last_seen |
| Wallet/escrow (P1) | wallet.updated, escrow.updated |
| Admin | admin.activity live feed |

WebSocket is the primary realtime channel. REST remains source of truth for history and recovery.

---

## 2. High-level topology

```
┌─────────────┐  WSS + Cookie     ┌──────────────────┐
│ Browser     │ ────────────────► │ Nginx (upgrade)  │
│ ishbor.uz   │                   │ api.ishbor.uz    │
└─────────────┘                   └────────┬─────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    ▼                      ▼                      ▼
            ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
            │ WS Gateway 1  │      │ WS Gateway 2  │      │ WS Gateway N  │
            │ FastAPI       │      │ FastAPI       │      │ FastAPI       │
            └───────┬───────┘      └───────┬───────┘      └───────┬───────┘
                    │                      │                      │
                    └──────────────────────┼──────────────────────┘
                                           ▼
                                  ┌─────────────────┐
                                  │ Redis Pub/Sub   │
                                  │ + connection    │
                                  │   registry      │
                                  └────────┬────────┘
                                           ▲
                                  ┌────────┴────────┐
                                  │ API Workers     │
                                  │ (emit events)   │
                                  └─────────────────┘
```

**Horizontal scale:** Any gateway may serve any user; Redis pub/sub fan-out crosses gateway boundaries.

---

## 3. FastAPI WebSocket handler

| Concern | Design |
|---------|--------|
| Router mount | `/ws/v1` on same FastAPI app as REST |
| Auth | Cookie `ishbor_sid` on upgrade — see WEBSOCKET_SECURITY.md |
| Connection ID | UUID per socket — stored in Redis SET |
| Lifecycle | accept → validate session → register → message loop → cleanup |
| Heartbeat | Server ping every 30s; client `ping` → `pong` |
| Idle timeout | Disconnect after 90s without client pong/message |
| Max connections | 5 per user — close oldest with code 4008 |

On connect success, server sends:

```json
{ "v": 1, "type": "connected", "payload": { "userId": "uuid", "serverTime": "ISO8601", "connectionId": "uuid" } }
```

---

## 4. Redis pub/sub channels

| Redis channel pattern | Publisher | Subscriber |
|-----------------------|-----------|------------|
| `ishbor:ws:user:{userId}:notifications` | NotificationWorker | User's gateways |
| `ishbor:ws:user:{userId}:messages` | MessagingService | User's gateways |
| `ishbor:ws:conversation:{conversationId}` | MessagingService | Subscribed gateways |
| `ishbor:ws:presence:{userId}` | PresenceService | Opt-in watchers |
| `ishbor:ws:admin:activity` | Domain events | Admin gateways |

**Connection registry:**

| Key | Type | Purpose |
|-----|------|---------|
| `ishbor:ws:conn:{connectionId}` | HASH | userId, gatewayId, subscribed channels |
| `ishbor:ws:user:{userId}:conns` | SET | connectionIds |
| `ishbor:ws:gateway:{gatewayId}:conns` | SET | local connection count |

On gateway shutdown: SCAN delete registry keys for that gatewayId; clients reconnect via backoff.

---

## 5. Client subscription protocol

After `connected`, client sends:

```json
{ "v": 1, "action": "subscribe", "channels": ["notifications", "messages", "presence"] }
```

Optional explicit conversation subscribe:

```json
{ "v": 1, "action": "subscribe", "channels": ["conversation:uuid-here"] }
```

Server validates ACL before Redis SUBSCRIBE — invalid channel → error frame, no subscribe.

Unsubscribe:

```json
{ "v": 1, "action": "unsubscribe", "channels": ["conversation:uuid"] }
```

---

## 6. Nginx WebSocket proxy

Location block requirements for `api.ishbor.uz`:

| Directive | Value |
|-----------|-------|
| `proxy_http_version` | 1.1 |
| `proxy_set_header Upgrade` | `$http_upgrade` |
| `proxy_set_header Connection` | `"upgrade"` |
| `proxy_set_header Host` | `$host` |
| `proxy_set_header Cookie` | `$http_cookie` |
| `proxy_read_timeout` | 3600s |
| `proxy_send_timeout` | 3600s |

**Sticky sessions:** Optional — not required when Redis pub/sub handles cross-gateway fan-out. Use IP hash only if connection registry is local-only (not recommended).

**TLS termination:** At Nginx or Cloudflare — WSS end-to-end in production.

---

## 7. Event flow (write path)

Example: user sends chat message

1. Client emits `message.send` over WS (or REST POST fallback)
2. MessagingService validates participant, persists PostgreSQL `messages`
3. Service PUBLISHes to `ishbor:ws:conversation:{id}` and `ishbor:ws:user:{recipient}:messages`
4. All gateways subscribed to those channels receive message
5. Gateways push envelope to local WebSocket connections
6. NotificationWorker creates notification row + PUBLISH `notification.new`

Domain event map: [REALTIME_EVENTS.md](./REALTIME_EVENTS.md), [EVENT_ARCHITECTURE.md](../EVENT_ARCHITECTURE.md).

---

## 8. Reconnection and recovery

| Scenario | Client behavior |
|----------|-----------------|
| Disconnect | Exponential backoff: 1s, 2s, 4s … max 30s |
| Reconnect | Resend subscribe; call REST `GET /notifications/unread-count` |
| Missed messages | `GET /conversations/:id/messages?after={lastMessageId}` |
| Duplicate delivery | Dedupe by message `id` in client store |
| Offline send queue | Buffer up to 50 `message.send` — flush on connect |

Client stores (`messages-store`, `notifications-store`) migrate from polling to WS push + initial REST hydrate.

---

## 9. Capacity targets

| Metric | Target |
|--------|--------|
| Concurrent connections per gateway | 50,000 |
| Message fan-out latency p99 | < 200ms |
| Redis pub/sub lag p99 | < 50ms |
| Max message payload | 8 KB text |
| Rate limit | 30 messages/min/conversation |

Auto-scale gateway pods on connection count CPU metric.

---

## 10. Fallback strategy

| Condition | Fallback |
|-----------|----------|
| WS unavailable | REST polling 30s for notifications (degraded banner) |
| Send failure | REST POST /conversations/:id/messages |
| Mobile background | Push notifications P2 — WS suspended |

Feature flag `REALTIME_WS_ENABLED` — default true in production.

---

## 11. Observability

| Metric | Purpose |
|--------|---------|
| `ws_connections_active` | Per gateway |
| `ws_messages_in/out` | Throughput |
| `ws_auth_failures` | Attack detection |
| `redis_pubsub_lag` | Pipeline health |
| `ws_disconnect_reason` | Labeled by close code |

Structured logs: connectionId, userId, action — never log message body in production.

---

## 12. Related documents

- [REALTIME_EVENTS.md](./REALTIME_EVENTS.md) — envelope format
- [CHAT_EVENTS.md](./CHAT_EVENTS.md) — messaging
- [NOTIFICATION_EVENTS.md](./NOTIFICATION_EVENTS.md)
- [PRESENCE_SYSTEM.md](./PRESENCE_SYSTEM.md)
- [WEBSOCKET_SECURITY.md](./WEBSOCKET_SECURITY.md)
- [WEBSOCKET_SPECIFICATION.md](../WEBSOCKET_SPECIFICATION.md) — legacy index

---

*FastAPI WebSocket + Redis pub/sub — nginx handles upgrade proxy on api.ishbor.uz.*
