# SESSION_STORAGE.md

**Project:** Ishbor Marketplace  
**Pattern:** Hybrid — PostgreSQL primary, Redis hot cache  
**Replaces:** `ishbor-session` localStorage, `auth-bootstrap.js` client hydration

---

## 1. Purpose

Ishbor sessions authenticate every user API call and WebSocket handshake. The hybrid model stores authoritative session records in PostgreSQL (`sessions` table) while Redis provides sub-millisecond lookup for high-traffic paths (API middleware, WS gateway).

**Design goals:**
- SSR-safe HttpOnly cookie `ishbor_sid` readable by FastAPI middleware
- Session survives Redis restart (PostgreSQL fallback)
- TTL aligned with cookie `Max-Age` — no orphaned Redis keys
- Rotation on login, privilege change, password change (AUTH_ARCHITECTURE.md)

---

## 2. Architecture overview

```
┌──────────────┐     Cookie: ishbor_sid=<opaque_token>
│   Browser    │────────────────────────────────────────────┐
└──────────────┘                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FastAPI middleware (SessionMiddleware)                            │
│  1. Extract cookie token                                            │
│  2. token_hash = SHA-256(token)                                     │
│  3. Redis GET ishbor:session:{token_hash}  ──miss──▶ PostgreSQL    │
│  4. Attach SessionContext to request.state.auth                     │
└─────────────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐            ┌─────────────────────┐
│ Redis cache     │            │ PostgreSQL sessions │
│ ishbor:session:*│◀──write───│ (source of truth)   │
└─────────────────┘            └─────────────────────┘
```

---

## 3. PostgreSQL `sessions` table (primary)

Authoritative schema from DATABASE_SCHEMA.md:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | Internal session ID |
| `user_id` | uuid FK | Owner |
| `token_hash` | varchar(64) UNIQUE | SHA-256 hex of opaque cookie token |
| `remember` | boolean | Drives TTL selection |
| `ip_address` | inet | Login IP audit |
| `user_agent` | text | Device fingerprint |
| `expires_at` | timestamptz | Hard expiry |
| `created_at` | timestamptz | Session start |

**Indexes:** `idx_sessions_token_hash`, `idx_sessions_user_id`, `idx_sessions_expires_at`

**Never store:** Raw cookie token, password, wallet data in session row.

---

## 4. Redis session cache

### 4.1 Key format

```
ishbor:session:{token_hash}
```

- `token_hash`: 64-char lowercase hex SHA-256 of the 32-byte random token
- Value: JSON-serialized `SessionContext` (see §5)
- TTL: Computed as `expires_at - now()` in seconds — **must match cookie Max-Age**

### 4.2 TTL alignment with cookie

| Mode | Cookie `Max-Age` | PostgreSQL `expires_at` | Redis `EX` |
|------|------------------|-------------------------|------------|
| Default session | 86400 (24h) | `now() + 24 hours` | Same delta |
| Remember me | 2592000 (30d) | `now() + 30 days` | Same delta |
| Admin session | 28800 (8h) | `now() + 8 hours` | Same delta (stricter) |
| OAuth callback | 86400 | Same as default | Same delta |

**Implementation rule:** On session create, compute `ttl_seconds = int((expires_at - utcnow()).total_seconds())` once. Use identical value for:
1. PostgreSQL `expires_at` column
2. Redis `SETEX key ttl_seconds payload`
3. `Set-Cookie` header `Max-Age=ttl_seconds`

**On session refresh/rotation:** Delete old Redis key, insert new PostgreSQL row, set new cookie with fresh TTL.

### 4.3 Cached payload schema

```python
class SessionContext(BaseModel):
    session_id: UUID
    user_id: UUID
    email: str
    user_type: Literal["client", "freelancer"]
    active_role: Literal["client", "freelancer", "agency"]
    is_admin: bool
    admin_role: AdminRole | None = None
    account_status: Literal["active", "suspended", "banned", "pending"]
    expires_at: datetime  # ISO8601 in JSON
```

**Excluded from cache:** Password hash, payment methods, wallet balance. Load those via service layer when needed.

---

## 5. Request lifecycle

### 5.1 Session resolution (every authenticated request)

```python
async def resolve_session(token: str, redis: Redis, db: AsyncSession) -> SessionContext | None:
    token_hash = sha256_hex(token)
    cache_key = f"ishbor:session:{token_hash}"

    # 1. Redis fast path
    cached = await redis.get(cache_key)
    if cached:
        ctx = SessionContext.model_validate_json(cached)
        if ctx.expires_at > utcnow():
            return ctx
        await redis.delete(cache_key)  # expired in cache

    # 2. PostgreSQL fallback
    row = await session_repo.get_by_token_hash(db, token_hash)
    if not row or row.expires_at <= utcnow():
        return None

    ctx = build_session_context(row, user=row.user)
    ttl = int((row.expires_at - utcnow()).total_seconds())
    if ttl > 0:
        await redis.setex(cache_key, ttl, ctx.model_dump_json())

    return ctx
```

### 5.2 Login — session create

```
POST /api/v1/auth/login
  → validate credentials + rate limit (RATE_LIMIT_STORAGE.md)
  → token = secrets.token_urlsafe(32)
  → token_hash = SHA-256(token)
  → expires_at = now + (30d if remember else 24h)
  → INSERT sessions (user_id, token_hash, remember, ip, ua, expires_at)
  → SETEX ishbor:session:{token_hash} ttl SessionContext
  → Set-Cookie: ishbor_sid={token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age={ttl}
  → enforce max 10 sessions per user (delete oldest + DEL redis keys)
  → emit UserLoggedIn
```

### 5.3 Logout — session destroy

```
POST /api/v1/auth/logout
  → DELETE FROM sessions WHERE token_hash = ?
  → DEL ishbor:session:{token_hash}
  → Set-Cookie: ishbor_sid=; Max-Age=0
```

### 5.4 Password change / reset — invalidate all

```
POST /api/v1/auth/reset-password OR PATCH /api/v1/auth/password
  → UPDATE users SET password_hash = ?
  → SELECT token_hash FROM sessions WHERE user_id = ?
  → DELETE FROM sessions WHERE user_id = ?
  → Pipeline DEL ishbor:session:{hash} for each
  → emit PasswordReset
```

### 5.5 Active role switch — update cache

```
PATCH /api/v1/auth/active-role
  → UPSERT active_role_preferences
  → Reload SessionContext with new active_role
  → SETEX ishbor:session:{token_hash} remaining_ttl updated_context
  → No cookie rotation required (same token)
```

---

## 6. Bearer token support (mobile future)

Mobile clients send `Authorization: Bearer <token>` where `<token>` is the same opaque value as the cookie. Middleware checks cookie first, then Bearer header. Same Redis key `ishbor:session:{token_hash}`.

---

## 7. WebSocket session binding

WebSocket handshake at `/ws/v1` includes cookie `ishbor_sid`. Gateway runs identical `resolve_session()` before accepting connection. On session expiry mid-connection:
1. Server sends `{ type: "session_expired" }`
2. Closes WS with code 4001
3. Client redirects to `/login`

**Presence keys (separate from session):**
- `ishbor:ws:presence:{user_id}` — SET of connection IDs, TTL 120s refreshed by heartbeat

---

## 8. Concurrent session limits

| Rule | Value |
|------|-------|
| Max sessions per user | 10 |
| Eviction policy | Delete oldest `created_at` when creating 11th |
| Admin users | Max 5 sessions (stricter) |

On eviction: `DEL ishbor:session:{evicted_token_hash}` for each removed row.

---

## 9. Cleanup and cron

| Job | Schedule | Action |
|-----|----------|--------|
| `cleanup_sessions` | Daily 03:00 UTC | `DELETE FROM sessions WHERE expires_at < now()` |
| Redis TTL | Automatic | Keys expire aligned with `expires_at` — no orphan session cache |
| Stale cache sweep | Weekly (staging) | `SCAN ishbor:session:*` → verify against DB, delete orphans |

PostgreSQL cleanup is authoritative. Redis self-heals via TTL.

---

## 10. Security controls

| Threat | Mitigation |
|--------|------------|
| Session fixation | New token + new DB row on every login |
| Token theft | HttpOnly + Secure + SameSite=Lax; rotate on password change |
| Redis memory dump | Only token_hash as key — raw token never in Redis |
| Replay after logout | DB row deleted — cache miss returns 401 |
| Suspended account | Check `account_status` on every resolve; reject if not `active` |
| CSRF | SameSite=Lax; optional CSRF double-submit on forms |

---

## 11. Failure modes

| Scenario | Behavior |
|----------|----------|
| Redis down | Fall back to PostgreSQL only — p95 +30ms, no auth outage |
| PostgreSQL slow | Redis cache absorbs read load — monitor hit ratio |
| Clock skew | Use UTC everywhere; TTL from DB `expires_at` |
| Partial write (DB ok, Redis fail) | Next request populates cache from DB — acceptable |

---

## 12. Environment variables

| Variable | Purpose |
|----------|---------|
| `SESSION_SECRET` | HMAC for optional signed session metadata (not token) |
| `SESSION_DEFAULT_TTL_SECONDS` | 86400 |
| `SESSION_REMEMBER_TTL_SECONDS` | 2592000 |
| `SESSION_MAX_PER_USER` | 10 |

---

*See also: [AUTH_ARCHITECTURE.md](../AUTH_ARCHITECTURE.md), [REDIS_ARCHITECTURE.md](./REDIS_ARCHITECTURE.md), [fastapi/FASTAPI_ARCHITECTURE.md](../fastapi/FASTAPI_ARCHITECTURE.md)*
