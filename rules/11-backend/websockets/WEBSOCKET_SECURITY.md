# WEBSOCKET_SECURITY.md

**Scope:** Authentication and authorization for Ishbor WebSocket connections  
**Endpoint:** `wss://api.ishbor.uz/ws/v1`  
**Primary auth:** HttpOnly cookie `ishbor_sid` — same session as REST  
**Secondary auth:** Bearer JWT for future mobile — see [JWT_STRATEGY.md](../auth/JWT_STRATEGY.md)

---

## 1. Threat model (WebSocket-specific)

| Threat | Impact | Mitigation |
|--------|--------|------------|
| Unauthenticated subscribe | Data leak | Session validation on handshake |
| Cross-user channel subscribe | Read others' DMs/notifications | Channel ACL per userId |
| Token in query string | Log leakage, referrer exposure | Cookie or Authorization header only |
| Message injection | Spam, XSS | Server validation + sanitization |
| Connection exhaustion | DoS | 5 connections/user, IP rate limit |
| Replay of frames | Duplicate actions | Idempotent handlers + dedupe ids |
| Stolen session cookie | Account takeover | HttpOnly, Secure, rotation, short TTL |

Fail-closed: any auth or ACL failure → close socket with documented code.

---

## 2. Handshake authentication

### 2.1 Web browser (primary)

```
GET /ws/v1 HTTP/1.1
Host: api.ishbor.uz
Upgrade: websocket
Connection: Upgrade
Cookie: ishbor_sid=<opaque>
Origin: https://ishbor.uz
```

| Step | Server action |
|------|---------------|
| 1 | Extract `ishbor_sid` from Cookie header |
| 2 | Hash → Redis GET → PG fallback (same as REST) |
| 3 | Validate expires_at, account_status=active |
| 4 | Accept WebSocket OR reject before upgrade |

**Failure:** HTTP 401 before upgrade OR WebSocket close code **4001** immediately after accept if race condition.

**Never:** `?token=` query parameter on web.

### 2.2 Mobile app (future)

| Method | Header |
|--------|--------|
| Preferred | `Authorization: Bearer <access_jwt>` on upgrade request |
| Alternative | `Sec-WebSocket-Protocol: bearer, <access_jwt>` |

JWT validated per JWT_STRATEGY.md — same `SessionContext` attached to connection.

Access token must have ≥ 60 seconds remaining at handshake.

---

## 3. Origin validation

| Environment | Allowed Origin |
|-------------|----------------|
| production | `https://ishbor.uz`, `https://www.ishbor.uz` |
| staging | `https://staging.ishbor.uz` |
| development | `http://localhost:3000` |

Mismatch → close **4003** Forbidden.

Nginx may also enforce Origin at edge — defense in depth.

---

## 4. Channel ACL

Before Redis SUBSCRIBE, gateway validates:

| Channel pattern | ACL rule |
|-----------------|----------|
| `notifications` | Maps to `user:{self}:notifications` — self only |
| `messages` | Maps to `user:{self}:messages` — self only |
| `conversation:{uuid}` | User in `conversation_participants` |
| `presence:{uuid}` | Self OR shared conversation participant |
| `presence` (bulk) | Server resolves to permitted user set only |
| `admin:activity` | `is_admin` AND `canAccessSection(dashboard)` |

**Subscribe request:**

```json
{ "v": 1, "action": "subscribe", "channels": ["conversation:other-user-thread"] }
```

If ACL fails → error frame `{ code: "FORBIDDEN" }` — channel not subscribed.

**No wildcard subscribe:** `*` rejected.

---

## 5. Connection limits

| Limit | Value | Close code |
|-------|-------|------------|
| Connections per user | 5 | 4008 |
| Subscriptions per connection | 50 | error frame |
| Subscribe requests per minute | 30 | error frame |
| Messages sent per minute per conversation | 30 | error frame |
| Max frame size | 16 KB | 4009 |

Oldest connection evicted on 6th connect — same policy as session concurrent limit.

---

## 6. Session re-validation

Auth is not only at handshake — periodic re-check:

| Interval | Check |
|----------|-------|
| Every heartbeat (30s) | Session still valid in Redis/PG |
| On each message.send | account_status active |
| On admin channel subscribe | admin_role still assigned |

| Failure | Action |
|---------|--------|
| Session expired | Close 4001 |
| User suspended/banned | Close 4003 + clear cookie via REST parallel |
| Session revoked | Close 4001 |

Evicted session from password change → next heartbeat closes WS.

---

## 7. CSRF and cookies on WebSocket

SameSite=Lax cookie sent on same-site WebSocket upgrade from `ishbor.uz` → `api.ishbor.uz` when Domain=.ishbor.uz configured.

Cross-site WS not supported — no CORS equivalent for arbitrary origins.

BFF pattern (proxy WS through ishbor.uz) keeps cookie host-only — recommended for strictest CSRF posture.

---

## 8. Message content security

| Control | Detail |
|---------|--------|
| XSS | HTML strip/escape message body server-side |
| Injection | JSON schema validation on every action |
| Binary | Text frames only v1 — no binary |
| Offers | Amount bounds, currency whitelist UZS/USD |
| fileId | Verify uploader owns file or participant |

Client must not render raw HTML from message body — plain text + linkify server-side optional.

---

## 9. Rate limiting (Redis)

| Key | Limit |
|-----|-------|
| `rl:ws:connect:ip:{ip}` | 20/min |
| `rl:ws:msg:user:{userId}` | 30/min global |
| `rl:ws:subscribe:conn:{connectionId}` | 30/min |

Exceeded → error frame then close 4008 on abuse repeat.

---

## 10. Logging and PII

| Log | Include | Exclude |
|-----|---------|---------|
| Connect | userId, connectionId, ip | cookie value |
| Disconnect | code, reason | message body |
| ACL deny | userId, channel | — |
| Auth fail | ip, reason code | token |

Audit: `ws_connect`, `ws_acl_denied` → `audit_logs` for admin review P1.

---

## 11. TLS and proxy security

| Layer | Requirement |
|-------|-------------|
| Client → Nginx | TLS 1.2+ only |
| Certificate | Valid for api.ishbor.uz |
| Nginx | Pass Cookie, validate Upgrade headers |
| Internal | WS gateway on private network — not public except via Nginx |

Cloudflare WebSockets enabled — no SSL termination downgrade.

---

## 12. Close code reference

| Code | Meaning | Client action |
|------|---------|---------------|
| 4001 | Unauthorized | Redirect login |
| 4003 | Forbidden | Show error, no retry |
| 4008 | Policy violation | Retry after backoff |
| 4009 | Message too large | Fix payload |
| 1000 | Normal | Reconnect if unintended |
| 1001 | Server restart | Reconnect with backoff |

---

## 13. Security testing checklist

- [ ] Connect without cookie → rejected
- [ ] Connect with expired session → 4001
- [ ] Subscribe other user's notifications → FORBIDDEN
- [ ] Subscribe conversation without participation → FORBIDDEN
- [ ] Admin channel as regular user → FORBIDDEN
- [ ] Origin spoof from evil.com → rejected
- [ ] 6th simultaneous connection → oldest closed
- [ ] Password change → all WS close within 90s
- [ ] JWT mobile auth rejects expired token
- [ ] No token accepted in query string

---

## 14. Related documents

- [AUTH_ARCHITECTURE.md](../auth/AUTH_ARCHITECTURE.md)
- [JWT_STRATEGY.md](../auth/JWT_STRATEGY.md)
- [COOKIE_STRATEGY.md](../auth/COOKIE_STRATEGY.md)
- [SESSION_MANAGEMENT.md](../auth/SESSION_MANAGEMENT.md)
- [WEBSOCKET_ARCHITECTURE.md](./WEBSOCKET_ARCHITECTURE.md)
- [PERMISSION_MATRIX.md](../auth/PERMISSION_MATRIX.md) — WS channel rows
- [SECURITY_ARCHITECTURE.md](../SECURITY_ARCHITECTURE.md)

---

*WebSocket auth uses the same ishbor_sid session as REST — channel ACL enforced before every subscribe.*
