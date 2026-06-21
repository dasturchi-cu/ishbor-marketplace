# SESSION_MANAGEMENT.md

**Scope:** Server-side session lifecycle for Ishbor Marketplace  
**Storage:** PostgreSQL `sessions` (authoritative) + Redis `ishbor:session:{token_hash}` (cache)  
**Identifier:** HttpOnly cookie `ishbor_sid` on web; mobile uses linked `sessions.id` as `sid` claim

---

## 1. Session record schema

PostgreSQL table `sessions` (see DATABASE_SCHEMA.md):

| Column | Purpose |
|--------|---------|
| `id` | UUID — referenced in audit logs and mobile JWT `sid` |
| `user_id` | Owner |
| `token_hash` | SHA-256 of opaque cookie value — never store raw token |
| `remember` | Boolean — determines TTL class |
| `ip_address` | Client IP at creation (inet) |
| `user_agent` | Truncated UA string for device list UI |
| `expires_at` | Hard expiry — checked every validation |
| `created_at` | For ordering concurrent session eviction |
| `last_active_at` | Updated on validated requests (throttled) |

Optional P1 column: `session_type` enum `web | mobile | oauth` for analytics.

---

## 2. Redis cache layout

| Key | Value | TTL |
|-----|-------|-----|
| `ishbor:session:{token_hash}` | JSON SessionContext + session metadata | Match `expires_at` minus now |
| `ishbor:user:sessions:{user_id}` | SET of session IDs | No TTL — cleaned on delete |

**Cache-aside pattern:**
1. Validate: Redis GET → hit → return
2. Miss: PG SELECT → if valid, SET Redis → return
3. Revoke: PG DELETE + Redis DEL + SREM from user set

**Invalidation triggers:** logout, password change, admin suspend, concurrent limit eviction, explicit rotation.

---

## 3. Token rotation policy

| Trigger | Action |
|---------|--------|
| Successful login | Always new token — prevents session fixation |
| Password change | New token for current device; all others deleted |
| Password reset | All sessions deleted; user must login fresh |
| Privilege change (admin role grant/revoke) | Rotate current session |
| Detected session reuse (hash mismatch) | Revoke all user sessions — possible theft |
| Optional periodic rotation | Every 7 days on active use — P1 hardening |

Rotation updates `token_hash` in place OR delete+insert — implementation choice; must invalidate old Redis key atomically.

---

## 4. Concurrent session limit

**Limit:** 5 active sessions per user (web + mobile combined)

| Step | Behavior |
|------|----------|
| On INSERT new session | COUNT sessions WHERE user_id AND expires_at > now |
| If count >= 5 | DELETE oldest by `created_at` (or least `last_active_at`) |
| Evicted session | Redis key deleted; no push notification v1 |
| User visibility | Settings → Security → "Faol qurilmalar" lists up to 5 devices |

Admin accounts: same limit — no unlimited sessions exception (reduces hijack blast radius).

**WebSocket impact:** Evicted session closes WS with code `4001` on next heartbeat validation.

---

## 5. Revoke on password change

```text
PATCH /auth/password (authenticated)
  → verify current password
  → UPDATE users.password_hash
  → DELETE FROM sessions WHERE user_id = :id
  → Redis: DEL all ishbor:session:* for user (via session ID index)
  → Redis: DEL all mobile_refresh_tokens cache entries
  → INSERT new session for current request
  → Set-Cookie new ishbor_sid
```

Password reset (`POST /auth/reset-password`) follows identical revocation — user lands on login, no auto-session.

---

## 6. Session validation path

Every authenticated FastAPI request:

| Check | Failure |
|-------|---------|
| Cookie present | 401 NO_SESSION |
| Hash lookup PG/Redis | 401 INVALID_SESSION |
| `expires_at > now()` | 401 SESSION_EXPIRED |
| User `account_status` | 403 if suspended/banned |
| Session not in revoked set | 401 SESSION_REVOKED |

Update `last_active_at` at most once per 5 minutes to reduce write load.

**Sliding window extension:** If session `< 50%` TTL consumed and `remember=false`, extend `expires_at` by 24h from now (cap at absolute max 7 days idle for non-remember).

---

## 7. Logout semantics

| Endpoint | Scope |
|----------|-------|
| `POST /auth/logout` | Current session only |
| `POST /auth/logout-all` | All sessions for user — requires re-auth or recent password confirm P1 |
| Admin `POST /admin/users/{id}/revoke-sessions` | All sessions for target user — audit logged |

Logout response always clears cookie per COOKIE_STRATEGY.md even if session row already missing (idempotent).

---

## 8. Active role in session context

Session cache includes `activeRole` from `active_role_preferences`:

| Event | Session update |
|-------|----------------|
| `PATCH /auth/active-role` | Redis UPDATE only — no cookie rotation |
| Agency membership revoked | Next validation reloads from PG — may 403 agency routes |
| Admin role changed | Force rotation recommended |

Role switch does not create new session row — reduces cookie churn.

---

## 9. Device and session listing (P1 UI)

`GET /auth/sessions` returns for current user:

| Field | Description |
|-------|-------------|
| `id` | Session UUID |
| `deviceLabel` | Parsed from user_agent |
| `ipAddress` | Masked last octet for display |
| `lastActiveAt` | ISO timestamp |
| `current` | Boolean — matches request session |
| `remember` | Boolean |

`DELETE /auth/sessions/{id}` — revoke specific device (cannot delete current without logout).

Maps `security-store.ts` devices tab.

---

## 10. Session cleanup jobs

| Job | Schedule | Action |
|-----|----------|--------|
| `expire_sessions` | Hourly | DELETE FROM sessions WHERE expires_at < now() |
| `redis_session_gc` | Daily | Scan orphan keys (belt-and-suspenders) |
| `audit_archive` | Monthly | Archive session creation logs |

BullMQ cron — not inline on request path.

---

## 11. Failure and edge cases

| Scenario | Handling |
|----------|----------|
| Redis unavailable | Fall back to PG only — degraded latency, no auth bypass |
| PG unavailable | 503 — fail closed, no anonymous elevation |
| Clock skew | Use DB `now()` for expiry comparisons |
| Duplicate tab login | Two sessions count toward limit of 5 |
| SSR double request | Idempotent session read — no double INSERT |

---

## 12. Audit events

| Event | `audit_logs.action` |
|-------|---------------------|
| Session created | `session_created` |
| Session revoked | `session_revoked` |
| Concurrent eviction | `session_evicted` |
| Logout all | `sessions_revoked_all` |
| Rotation | `session_rotated` |

Include `session_id`, `ip_address`, `user_agent` in metadata JSON.

---

## 13. Related documents

- [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md)
- [COOKIE_STRATEGY.md](./COOKIE_STRATEGY.md)
- [JWT_STRATEGY.md](./JWT_STRATEGY.md) — mobile refresh linked to same session table
- [PASSWORD_RESET_FLOW.md](./PASSWORD_RESET_FLOW.md) — full revocation
- [WEBSOCKET_SECURITY.md](../websockets/WEBSOCKET_SECURITY.md) — WS re-validation

---

*Concurrent limit 5 per user; password change revokes all sessions — non-negotiable security requirements.*
