# PRESENCE_SYSTEM.md

**Scope:** Online status and last-seen for Ishbor users  
**Redis key pattern:** `ishbor:presence:{user_id}`  
**Store mapping:** `messages-store.setOnlineStatus()`, profile online badges

---

## 1. Purpose

Presence answers: **Is this user available now?** Used in:

| Surface | Display |
|---------|---------|
| `/messages` conversation list | Green dot on avatar |
| Thread header | "Onlayn" / "Yaqinda bo'lgan" |
| Freelancer public profile | Availability hint (opt-in P1) |
| Admin user detail | Support context |

Not a full activity tracker — no granular "viewing page X" in v1.

---

## 2. Status values

| status | Meaning | Set when |
|--------|---------|----------|
| online | Active now | WS connected + recent activity |
| away | Idle | No activity 5 min, WS still open |
| offline | Unavailable | WS closed or explicit logout |

**last_seen_at:** ISO8601 UTC — updated on disconnect, away transition, and heartbeat.

---

## 3. Redis data model

### Primary key: `ishbor:presence:{user_id}`

HASH fields:

| Field | Type | Description |
|-------|------|-------------|
| status | string | online \| away \| offline |
| last_seen_at | string | ISO8601 |
| connection_count | int | Active WS connections |
| updated_at | string | ISO8601 server write time |

**TTL:** 86400 seconds — refreshed on every update; key expires if user offline > 24h without update.

### Secondary index: `ishbor:presence:watchers:{user_id}`

SET of userIds watching this user's presence — for efficient fan-out cap P1.

---

## 4. Client → Server: presence.update

**Action:** `presence.update`

```json
{
  "v": 1,
  "action": "presence.update",
  "payload": { "status": "online" }
}
```

| Client event | Server action |
|--------------|---------------|
| WS connect | Implicit online — increment connection_count |
| WS disconnect | Decrement connection_count; if 0 → offline + last_seen_at |
| Tab visible | online |
| Tab hidden 5 min | away (client hint — server may override) |
| Logout | offline |

**Rate limit:** Max 1 presence.update per 30 seconds per connection — connect/disconnect always processed.

---

## 5. Server → Client: presence

**Type:** `presence`

```json
{
  "v": 1,
  "type": "presence",
  "id": "evt-uuid",
  "ts": "2026-06-20T12:00:00.000Z",
  "payload": {
    "userId": "uuid",
    "status": "online",
    "lastSeenAt": "2026-06-20T11:55:00.000Z"
  }
}
```

Broadcast to:
- Redis channel `ishbor:ws:presence:{userId}`
- Subscribers who passed ACL (conversation participants or explicit watch)

**Store mapping:** `setOnlineStatus(userId, status, lastSeenAt)` in messages-store.

---

## 6. Subscription model

Default subscribe on connect:

```json
{ "v": 1, "action": "subscribe", "channels": ["presence"] }
```

**Behavior v1:** Gateway loads presence for users in active conversations only — not global firehose.

Explicit watch (P1):

```json
{ "v": 1, "action": "subscribe", "channels": ["presence:uuid-of-user"] }
```

**ACL rules:**

| Watcher | Target | Allowed |
|---------|--------|---------|
| Authenticated user | Conversation participant | yes |
| Authenticated user | Random user | no |
| Guest | Anyone | no |

---

## 7. Connection count logic

```
On WS connect:
  HINCRBY ishbor:presence:{user_id} connection_count 1
  HSET status online, updated_at now

On WS disconnect:
  HINCRBY connection_count -1
  If connection_count <= 0:
    HSET status offline, last_seen_at now
    PUBLISH presence event
```

Multiple tabs = multiple connections — user stays online until all tabs close.

Max 5 connections per user aligns with session limit — same eviction policy.

---

## 8. Away detection

| Layer | Mechanism |
|-------|-----------|
| Client | Page Visibility API → presence.update away/online |
| Server | No WS ping for 90s while connected → away |
| Server | WS disconnect → offline |

Client hint preferred — reduces false away during long message compose.

---

## 9. Privacy settings

From user settings (P1) — `users.settings.presence_visible`:

| Setting | Behavior |
|---------|----------|
| everyone | Participants + profile visitors see status |
| contacts_only | Only conversation participants |
| nobody | Always show offline to others; still tracked server-side |

Default v1: **contacts_only** — participants in shared conversations only.

---

## 10. REST fallback

| Endpoint | Purpose |
|----------|---------|
| GET /users/:id/presence | Poll fallback when WS unavailable |
| GET /conversations (list) | Include participant presence snapshot inline |

Bulk fetch for conversation list reduces N WS subscriptions on mobile P1.

---

## 11. Integration with messaging

| Event | Presence interaction |
|-------|---------------------|
| message.new | Do not force online — independent |
| typing | Requires online or away — not offline |
| User offline | typing TTL clears automatically |

Typing without active WS: rejected — typing requires live connection.

---

## 12. Admin visibility

Support admin may view presence in `/admin/users/:id` via internal REST — not via public WS channel.

Admin WS `admin:activity` unrelated to user presence — separate feed.

---

## 13. Scalability

| Concern | Mitigation |
|---------|------------|
| Fan-out storm | Limit watchers per user to 50 |
| Redis memory | TTL 24h on stale keys |
| Hot celebrities | Rate limit presence publishes 1/min per user |
| Cross-region | Redis primary in same region as WS gateways |

Target: 100k concurrent online users across platform peak.

---

## 14. Observability

| Metric | Alert |
|--------|-------|
| presence_updates_total | Baseline |
| presence_redis_latency | p99 > 20ms |
| stale_online_users | Cron reconcile connection registry vs Redis |

Reconcile job hourly: if connection_count > 0 but no registry entry → set offline.

---

## 15. Frontend checklist

- [ ] Subscribe presence when opening /messages
- [ ] Update local avatar dots on presence event
- [ ] Send presence.update on visibility change
- [ ] Do not show exact last_seen unless offline > 2 min (UX polish)
- [ ] Uzbek labels: Onlayn, Yo'qda, Yaqinda faol

---

## 16. Related documents

- [WEBSOCKET_ARCHITECTURE.md](./WEBSOCKET_ARCHITECTURE.md)
- [REALTIME_EVENTS.md](./REALTIME_EVENTS.md)
- [CHAT_EVENTS.md](./CHAT_EVENTS.md)
- [WEBSOCKET_SECURITY.md](./WEBSOCKET_SECURITY.md)
- [MESSAGES.md](../../13-domains/MESSAGES.md)

---

*Presence state lives in Redis `ishbor:presence:{user_id}` — online, away, offline, last_seen.*
