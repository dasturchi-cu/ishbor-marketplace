# RATE_LIMITING.md

**Layers:** Nginx (edge) + Redis (application) per endpoint  
**Purpose:** Prevent brute force, checkout abuse, webhook flooding

---

## 1. Two-layer architecture

```
Request
  → nginx limit_req zones (IP-based, first line)
  → FastAPI RateLimitMiddleware (IP + user-based, granular)
  → Redis sliding window counters
  → Handler
```

nginx catches floods before they reach application. Redis enables per-user limits and distributed counting across 2 API instances.

---

## 2. Nginx rate limits

See NGINX_ARCHITECTURE.md for full config.

| Zone | Rate | Burst | Routes |
|------|------|-------|--------|
| `api_general` | 30/s | 50 | Default /v1/* |
| `api_auth` | 5/min | 10 | /v1/auth/* |
| `api_checkout` | 10/min | 5 | /v1/checkout/*, /v1/wallet/* |
| `webhooks` | 100/s | 200 | /v1/webhooks/* (IP allowlist) |

Exceeded → HTTP 429 with JSON body (nginx custom error page).

---

## 3. Redis application limits

```python
# server/middleware/rate_limit.py
LIMITS = {
    "auth.login":           RateLimit(requests=5,  window=300,  key="ip"),      # 5/5min per IP
    "auth.otp.send":        RateLimit(requests=3,  window=3600, key="phone"),   # 3/hour per phone
    "auth.otp.verify":      RateLimit(requests=5,  window=600,  key="phone"),   # 5/10min per phone
    "auth.register":        RateLimit(requests=3,  window=3600, key="ip"),
    "wallet.deposit":       RateLimit(requests=10, window=3600, key="user"),
    "wallet.withdraw":      RateLimit(requests=5,  window=3600, key="user"),
    "checkout.confirm":     RateLimit(requests=5,  window=3600, key="user"),
    "escrow.release":       RateLimit(requests=20, window=3600, key="user"),
    "files.presign":        RateLimit(requests=30, window=3600, key="user"),
    "applications.submit":  RateLimit(requests=20, window=3600, key="user"),
    "admin.actions":        RateLimit(requests=100, window=3600, key="user"),
}
```

### Redis key format

```
ratelimit:{endpoint}:{key_type}:{key_value}
# e.g. ratelimit:auth.login:ip:192.168.1.1
```

Sliding window via Redis sorted sets or `INCR` with TTL.

---

## 4. RateLimitMiddleware implementation

```python
class RateLimitMiddleware:
    async def __call__(self, request, call_next):
        endpoint = match_endpoint(request.path, request.method)
        limit = LIMITS.get(endpoint)
        if not limit:
            return await call_next(request)

        key_value = get_key(request, limit.key)  # IP, user_id, or phone
        redis_key = f"ratelimit:{endpoint}:{limit.key}:{key_value}"

        current = await redis.incr(redis_key)
        if current == 1:
            await redis.expire(redis_key, limit.window)

        if current > limit.requests:
            logger.warning("rate_limit_exceeded", endpoint=endpoint, key=key_value)
            return JSONResponse(
                status_code=429,
                content={
                    "error": "RATE_LIMIT_EXCEEDED",
                    "message": "Juda ko'p so'rov. Biroz kutib turing.",
                    "retry_after": limit.window,
                },
                headers={"Retry-After": str(limit.window)},
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit.requests - current))
        return response
```

---

## 5. Endpoint-specific rules

### Authentication (highest priority)

| Endpoint | Limit | Lockout |
|----------|-------|---------|
| POST /auth/login | 5/5min IP | 15 min lockout after 10 failures |
| POST /auth/otp/send | 3/hour phone | — |
| POST /auth/otp/verify | 5/code | Code invalidated after 5 fails |
| POST /auth/register | 3/hour IP | — |
| POST /auth/forgot-password | 3/hour email | — |

Account lockout stored in Redis: `lockout:{user_id}`, TTL 900s.

### Financial endpoints

| Endpoint | Limit | Rationale |
|----------|-------|-----------|
| POST /checkout/confirm | 5/hour user | Prevent wallet drain attacks |
| POST /wallet/deposit | 10/hour user | Gateway cost control |
| POST /wallet/withdraw | 5/hour user | Fraud prevention |
| POST /escrow/*/release | 20/hour user | Normal usage headroom |

Financial limits cannot be bypassed by admin without audit log.

### Webhooks

Webhooks excluded from user rate limits — protected by:

- Provider IP allowlist (nginx)
- Signature verification
- Idempotency (duplicate webhooks are no-ops, not errors)

Flood from valid IP → alert P0, temporary IP block.

---

## 6. Response headers

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1718878800
Retry-After: 300          # on 429 only
```

Frontend shows Uzbek cooldown message on 429.

---

## 7. Bypass rules

| Caller | Bypass |
|--------|--------|
| Health checks | /health, /health/ready — no limit |
| Internal Celery | Direct service calls — no HTTP |
| Admin on admin routes | Same limits apply — no bypass |
| Load test | Staging only with `X-Load-Test-Secret` header |

Never disable rate limits in production.

---

## 8. Monitoring

| Metric | Alert |
|--------|-------|
| `rate_limit_exceeded_total{endpoint}` | Spike on auth.login → possible brute force |
| 429 rate >5% on checkout | P1 — investigate attack or UX issue |
| Redis rate limit key count | Memory usage |

Prometheus scrape from FastAPI `/metrics` endpoint (internal only).

---

## 9. Related documents

- [../infrastructure/NGINX_ARCHITECTURE.md](../infrastructure/NGINX_ARCHITECTURE.md)
- [API_SECURITY.md](./API_SECURITY.md)
- [../infrastructure/SMS_ARCHITECTURE.md](../infrastructure/SMS_ARCHITECTURE.md)

---

*Rate limiting is enforced at nginx (IP flood) and Redis (per-user granularity). Auth and checkout endpoints have the strictest limits.*
