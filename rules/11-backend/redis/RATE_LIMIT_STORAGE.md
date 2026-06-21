# RATE_LIMIT_STORAGE.md

**Project:** Ishbor Marketplace  
**Algorithm:** Sliding window log (Redis sorted sets)  
**Source of truth for limits:** `src/lib/rate-limit.ts` + API_SPECIFICATION.md §24

---

## 1. Purpose

Rate limiting protects Ishbor from credential stuffing, checkout abuse, AI cost overrun, and API scraping. The frontend currently enforces login throttling in localStorage (`ishbor-login-attempts`, `ishbor-client-login-attempts`). The backend enforces authoritative limits in Redis — frontend checks are UX hints only.

**Stack:** Redis 7 sorted sets (`ZADD` / `ZCOUNT`) with automatic expiry via key TTL.

---

## 2. Frontend reference (`rate-limit.ts`)

Client-side constants mirrored server-side:

| Constant | Value | Storage key (frontend) |
|----------|-------|------------------------|
| `MAX_ATTEMPTS` | 5 | — |
| `WINDOW_MS` | 15 × 60 × 1000 (900s) | — |
| Email login bucket | 5 / 15 min | `ishbor-login-attempts` → normalized email |
| Client browser bucket | 5 / 15 min | `ishbor-client-login-attempts` → `"client"` |
| Rate limit message | `"Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring."` | — |

**Backend rule:** Server limits are strict superset — never trust client `isRateLimited()` alone.

---

## 3. Redis key catalog

| Key pattern | Scope | Limit | Window | Endpoint(s) |
|-------------|-------|-------|--------|-------------|
| `ishbor:rl:login:{email}` | Per normalized email | 5 attempts | 15 min | `POST /api/v1/auth/login` |
| `ishbor:rl:login:ip:{ip}` | Per client IP | 20 attempts | 15 min | `POST /api/v1/auth/login` |
| `ishbor:rl:register:ip:{ip}` | Per IP | 10 registrations | 1 hour | `POST /api/v1/auth/register` |
| `ishbor:rl:forgot:email:{email}` | Per email | 3 requests | 1 hour | `POST /api/v1/auth/forgot-password` |
| `ishbor:rl:api:public:{ip}` | Per IP | 120 requests | 1 min | Public GET endpoints |
| `ishbor:rl:api:{user_id}` | Per authenticated user | 300 read / 60 write | 1 min | User API (split by method) |
| `ishbor:rl:checkout:{user_id}` | Per user | 10 requests | 1 min | `POST /api/v1/checkout/*` |
| `ishbor:rl:ai:{user_id}` | Per user | 20 (free) / 100 (pro) | 1 hour | `POST /api/v1/ai/*` |
| `ishbor:rl:upload:{user_id}` | Per user | 30 presigns | 1 hour | `POST /api/v1/files/presign` |
| `ishbor:rl:ws:connect:{user_id}` | Per user | 10 connections | 1 min | WebSocket handshake |
| `ishbor:rl:admin:{user_id}` | Per admin | 600 requests | 1 min | `/api/v1/admin/*` |

**Email normalization:** Lowercase, trim — same as `normalizeEmail()` in `sanitize.ts`.

---

## 4. Sliding window algorithm

### 4.1 Implementation (sorted set)

```python
async def check_rate_limit(
    redis: Redis,
    key: str,
    limit: int,
    window_seconds: int,
) -> tuple[bool, int]:
    """
    Returns (allowed, retry_after_seconds).
    retry_after_seconds = 0 when allowed.
    """
    now = time.time()
    window_start = now - window_seconds
    pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, window_start)      # drop expired
    pipe.zadd(key, {str(now): now})                   # record attempt
    pipe.zcard(key)                                    # count in window
    pipe.expire(key, window_seconds + 1)              # key TTL = window
    _, _, count, _ = await pipe.execute()

    if count > limit:
        oldest = await redis.zrange(key, 0, 0, withscores=True)
        retry_after = int(oldest[0][1] + window_seconds - now) + 1 if oldest else window_seconds
        await redis.zrem(key, str(now))  # don't count blocked attempt
        return False, retry_after
    return True, 0
```

### 4.2 Read vs write split (authenticated API)

For `ishbor:rl:api:{user_id}`, use suffixed keys:

| Key | Limit | Window |
|-----|-------|--------|
| `ishbor:rl:api:{user_id}:read` | 300 | 60s |
| `ishbor:rl:api:{user_id}:write` | 60 | 60s |

Middleware selects suffix based on HTTP method (`GET`/`HEAD`/`OPTIONS` → read; others → write).

---

## 5. Login rate limiting (detailed)

Mirrors `rate-limit.ts` behavior with server enforcement:

```
POST /api/v1/auth/login { email, password }
  1. email_key = f"ishbor:rl:login:{normalize_email(email)}"
  2. ip_key = f"ishbor:rl:login:ip:{client_ip}"
  3. Check both keys — block if EITHER exceeded
  4. If blocked: 429 { code: "RATE_LIMITED", message: rateLimitMessage(), retryAfter }
  5. Attempt authentication
  6. On failure: record attempt on both keys (do not short-circuit before step 3 on retry)
  7. On success: DELETE email_key (clearLoginAttempts equivalent)
  8. Emit audit event for repeated failures (>3 in window)
```

**Response headers (RFC 6585 style):**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 847
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1718870400
```

**User-facing message (Uzbek):** `"Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring."` — identical to `rateLimitMessage()`.

---

## 6. AI rate limiting (plan-aware)

```python
async def get_ai_limit(user_id: UUID, subscription: Subscription) -> int:
    if subscription.plan in ("pro", "agency", "enterprise"):
        return 100
    return 20

key = f"ishbor:rl:ai:{user_id}"
limit = await get_ai_limit(user_id, sub)
allowed, retry_after = await check_rate_limit(redis, key, limit, 3600)
```

On limit: `429` with `{ code: "AI_RATE_LIMITED", message: "Soatlik AI limit tugadi. Pro rejaga o'ting." }`

---

## 7. Checkout rate limiting

Protects against card testing and duplicate fund attempts:

| Key | Limit | Window |
|-----|-------|--------|
| `ishbor:rl:checkout:{user_id}` | 10 | 60s |

Applies to: `POST /api/v1/checkout/preview`, `POST /api/v1/checkout/confirm`, `POST /api/v1/escrow/:id/fund`.

**Note:** Idempotency keys (`X-Idempotency-Key`) dedupe identical requests — rate limit counts distinct keys.

---

## 8. Public API / CDN coordination

| Layer | Limit | Key |
|-------|-------|-----|
| Cloudflare WAF | 1000 req/min/IP (baseline) | CF native |
| nginx `limit_req` | 200 req/s burst | zone `api_limit` |
| Redis (authoritative) | 120 req/min/IP | `ishbor:rl:api:public:{ip}` |

Cloudflare absorbs DDoS; Redis enforces application-aware limits.

---

## 9. FastAPI middleware integration

```python
# app/middleware/rate_limit.py
class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/v1/auth/login"):
            # login-specific — handled in auth router
            return await call_next(request)

        auth = request.state.auth  # may be None
        ip = request.client.host

        if auth:
            suffix = "read" if request.method in ("GET", "HEAD") else "write"
            key = f"ishbor:rl:api:{auth.user_id}:{suffix}"
            limit = 300 if suffix == "read" else 60
        else:
            key = f"ishbor:rl:api:public:{ip}"
            limit = 120

        allowed, retry_after = await check_rate_limit(redis, key, limit, 60)
        if not allowed:
            return JSONResponse(status_code=429, content={...}, headers={"Retry-After": str(retry_after)})
        return await call_next(request)
```

---

## 10. Bypass and exemptions

| Actor | Exemption |
|-------|-----------|
| Health checks | `/health`, `/api/v1/admin/system/health` — no limit |
| Webhook endpoints | HMAC auth — separate `ishbor:rl:webhook:{provider}:{ip}` 100/min |
| Internal cron | Service account token — no user rate limit |
| Admin founder metrics | Uses `ishbor:rl:admin:{user_id}` higher ceiling |

**Never bypass:** Login, checkout, AI endpoints.

---

## 11. Monitoring

| Metric | Alert |
|--------|-------|
| `rate_limit_blocked_total{key_type="login"}` | Spike > 100/min (possible attack) |
| `rate_limit_blocked_total{key_type="checkout"}` | Any sustained > 10/min per user |
| Redis memory for `ishbor:rl:*` | > 25 MB |
| False positive reports | User support tickets mentioning 429 on normal use |

---

## 12. Migration from frontend-only limits

| Phase | Behavior |
|-------|----------|
| A | Backend enforces; frontend keeps localStorage (defense in depth) |
| B | Frontend calls `GET /auth/rate-limit-status?email=` before login form submit |
| C | Remove localStorage login attempt tracking — server is sole authority |

**Action item:** Add optional `429` handler in TanStack Query global error handler to display `rateLimitMessage()`.

---

## 13. Complete limits reference table

| Tier | Limit | Window | Redis key |
|------|-------|--------|-----------|
| Public read | 120 req | 1 min | `ishbor:rl:api:public:{ip}` |
| Auth read | 300 req | 1 min | `ishbor:rl:api:{user_id}:read` |
| Auth write | 60 req | 1 min | `ishbor:rl:api:{user_id}:write` |
| Checkout | 10 req | 1 min | `ishbor:rl:checkout:{user_id}` |
| AI free | 20 req | 1 hour | `ishbor:rl:ai:{user_id}` |
| AI pro | 100 req | 1 hour | `ishbor:rl:ai:{user_id}` |
| Login email | 5 attempts | 15 min | `ishbor:rl:login:{email}` |
| Login IP | 20 attempts | 15 min | `ishbor:rl:login:ip:{ip}` |

Matches API_SPECIFICATION.md §24 and `src/lib/rate-limit.ts`.

---

*See also: [SECURITY_ARCHITECTURE.md](../SECURITY_ARCHITECTURE.md), [AUTH_ARCHITECTURE.md](../AUTH_ARCHITECTURE.md), [REDIS_ARCHITECTURE.md](./REDIS_ARCHITECTURE.md)*
