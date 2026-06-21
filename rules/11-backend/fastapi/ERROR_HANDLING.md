# ERROR_HANDLING.md

**Project:** Ishbor Marketplace  
**Stack:** FastAPI · Pydantic v2 · structlog · Sentry  
**User language:** Uzbek (primary) — error `message` field always Uzbek for user-facing codes  
**Related:** [API_SPECIFICATION.md](../API_SPECIFICATION.md), [SERVICE_LAYER.md](./SERVICE_LAYER.md)

---

## 1. Purpose

Ishbor API errors must be:

- **Predictable** — stable `code` strings for frontend/mobile branching
- **Human-readable** — Uzbek `message` for toast and inline form errors
- **Safe** — no stack traces, SQL, or internal paths in responses
- **Traceable** — `requestId` links client error to server logs and Sentry

This document defines the error envelope, HTTP status mapping, exception handlers, and the complete error code registry aligned with frontend stores and validation schemas.

---

## 2. Error response envelope

All API errors (except nginx/rate-limit edge cases) return JSON:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email noto'g'ri formatda",
    "field": "email",
    "requestId": "req_7f3a2b1c",
    "details": {}
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `code` | Yes | Machine-readable UPPER_SNAKE string — never change meaning |
| `message` | Yes | Uzbek user-facing text |
| `field` | No | Form field name for inline validation |
| `requestId` | Yes | Echo of `X-Request-Id` or server-generated UUID |
| `details` | No | Structured extras — e.g. `{ "min": 10, "max": 5000 }` — never secrets |

**WebSocket errors** use same `code` in frame JSON — see WEBSOCKET_SPECIFICATION.md.

---

## 3. IshborHTTPException

Central exception type in `app/core/exceptions.py`:

```python
class IshborHTTPException(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        field: str | None = None,
        details: dict | None = None,
    ):
        self.code = code
        self.message = message
        self.field = field
        self.details = details or {}
        super().__init__(status_code=status_code, detail=message)
```

**Service layer rule:** Raise `IshborHTTPException` for expected business failures. Never catch and swallow — let handlers format response.

**Repository layer rule:** Raise domain exceptions (`InsufficientBalanceError`, `InvalidTransitionError`) — service maps to `IshborHTTPException`.

---

## 4. FastAPI exception handlers

Registration in `app/main.py:create_app()`:

| Exception | Handler | HTTP | Response code |
|-----------|---------|------|---------------|
| `IshborHTTPException` | `ishbor_http_exception_handler` | as raised | as raised |
| `RequestValidationError` | `validation_exception_handler` | 422 | `VALIDATION_ERROR` |
| `HTTPException` (Starlette) | `http_exception_handler` | as raised | mapped or `HTTP_ERROR` |
| `Exception` (unhandled) | `unhandled_exception_handler` | 500 | `INTERNAL_ERROR` |

### 4.1 IshborHTTPException handler

```python
async def ishbor_http_exception_handler(request: Request, exc: IshborHTTPException):
    request_id = request.state.request_id
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "field": exc.field,
                "requestId": request_id,
                **({"details": exc.details} if exc.details else {}),
            }
        },
    )
```

### 4.2 Pydantic validation handler

Maps Pydantic v2 errors to Uzbek messages using field path:

```python
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    first = exc.errors()[0]
    field = ".".join(str(loc) for loc in first["loc"] if loc != "body")
    message = uz_validation_message(first["type"], field, first.get("ctx"))
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": message,
                "field": field or None,
                "requestId": request.state.request_id,
            }
        },
    )
```

**Frontend alignment:** Pydantic models mirror Zod schemas in `src/lib/project-validation.ts`, `src/lib/auth.ts`, `src/lib/sanitize.ts`.

### 4.3 Unhandled handler

```python
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("unhandled_error", request_id=request.state.request_id)
    sentry_sdk.capture_exception(exc)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Kutilmagan xatolik. Keyinroq qayta urinib ko'ring.",
                "requestId": request.state.request_id,
            }
        },
    )
```

Never expose `str(exc)` to client.

---

## 5. HTTP status mapping

| HTTP | Usage | Example codes |
|------|-------|---------------|
| 400 | Malformed request, bad query | `BAD_REQUEST`, `INVALID_SLUG` |
| 401 | Missing or expired session | `AUTH_REQUIRED`, `SESSION_EXPIRED` |
| 402 | Payment required / insufficient funds | `INSUFFICIENT_BALANCE`, `GATEWAY_DECLINED` |
| 403 | Authenticated but forbidden | `ROLE_FORBIDDEN`, `ADMIN_FORBIDDEN`, `ACCOUNT_SUSPENDED` |
| 404 | Resource not found (or hidden) | `NOT_FOUND`, `PROJECT_NOT_FOUND` |
| 409 | Conflict, duplicate, idempotency | `IDEMPOTENCY_CONFLICT`, `SLUG_TAKEN`, `DUPLICATE_APPLICATION` |
| 410 | Deprecated endpoint sunset | `ENDPOINT_GONE` |
| 422 | Validation failed | `VALIDATION_ERROR` |
| 423 | Resource locked (escrow frozen) | `ESCROW_FROZEN` |
| 429 | Rate limit | `RATE_LIMIT_EXCEEDED` |
| 500 | Server error | `INTERNAL_ERROR` |
| 502 | Gateway/provider failure | `GATEWAY_UNAVAILABLE` |
| 503 | Maintenance | `SERVICE_UNAVAILABLE` |

**404 vs 403:** Non-owner accessing private draft project → `404 NOT_FOUND` (do not leak existence). Admin with permission → 200 or 403 if wrong section.

---

## 6. Error code registry

### 6.1 Authentication & session

| Code | HTTP | Uzbek message |
|------|------|---------------|
| `AUTH_REQUIRED` | 401 | Tizimga kiring |
| `SESSION_EXPIRED` | 401 | Sessiya muddati tugagan. Qayta kiring |
| `INVALID_CREDENTIALS` | 401 | Email yoki parol noto'g'ri |
| `ACCOUNT_SUSPENDED` | 403 | Hisob bloklangan |
| `ACCOUNT_BANNED` | 403 | Hisob butunlay yopilgan |
| `EMAIL_NOT_VERIFIED` | 403 | Email tasdiqlanmagan |
| `OTP_EXPIRED` | 400 | Tasdiqlash kodi muddati tugagan |
| `OTP_INVALID` | 400 | Tasdiqlash kodi noto'g'ri |
| `OTP_MAX_ATTEMPTS` | 429 | Juda ko'p urinish. Keyinroq qayta urinib ko'ring |
| `ROLE_FORBIDDEN` | 403 | Ruxsat yo'q |
| `ADMIN_FORBIDDEN` | 403 | Admin ruxsati yo'q |
| `CSRF_INVALID` | 403 | Xavfsizlik tekshiruvi muvaffaqiyatsiz |

### 6.2 Validation & resources

| Code | HTTP | Uzbek message |
|------|------|---------------|
| `VALIDATION_ERROR` | 422 | (field-specific) |
| `NOT_FOUND` | 404 | Topilmadi |
| `PROJECT_NOT_FOUND` | 404 | Loyiha topilmadi |
| `SERVICE_NOT_FOUND` | 404 | Xizmat topilmadi |
| `ORDER_NOT_FOUND` | 404 | Buyurtma topilmadi |
| `SLUG_TAKEN` | 409 | Bu slug band |
| `DUPLICATE_APPLICATION` | 409 | Siz allaqachon ariza yuborgansiz |

### 6.3 Marketplace — projects & services

| Code | HTTP | Uzbek message |
|------|------|---------------|
| `PROJECT_NOT_READY` | 422 | Nashr qilish uchun maydonlar to'ldirilmagan |
| `PROJECT_NOT_OWNER` | 403 | Bu loyihani tahrirlash huquqingiz yo'q |
| `INVALID_PROJECT_TRANSITION` | 409 | Loyiha holatini o'zgartirib bo'lmaydi |
| `SERVICE_LIMIT_REACHED` | 403 | Xizmat limiti tugadi. Pro yoki Elite rejaga o'ting |
| `SERVICE_NOT_OWNER` | 403 | Bu xizmat sizga tegishli emas |
| `SUBSCRIPTION_REQUIRED` | 403 | Bu funksiya uchun obuna kerak |

Maps `publishService` error in services-store: *"Xizmat limiti tugadi..."*

### 6.4 Orders & escrow

| Code | HTTP | Uzbek message |
|------|------|---------------|
| `ORDER_INVALID_TRANSITION` | 409 | Buyurtma holatini o'zgartirib bo'lmaydi |
| `ESCROW_INVALID_TRANSITION` | 409 | Eskrou holati noto'g'ri |
| `ESCROW_NOT_FUNDED` | 422 | Eskrou to'ldirilmagan |
| `ESCROW_FROZEN` | 423 | Eskrou muzlatilgan — nizo ochilgan |
| `MILESTONE_NOT_FUNDED` | 422 | Bosqich hali moliyalashtirilmagan |
| `MILESTONE_ALREADY_RELEASED` | 409 | Mablag' allaqachon chiqarilgan |
| `DISPUTE_ALREADY_OPEN` | 409 | Nizo allaqachon ochilgan |
| `REFUND_NOT_ALLOWED` | 422 | Qaytarish mumkin emas — ish boshlangan |
| `REFUND_EXCEEDS_HELD` | 422 | Qaytarish summasi eskroudan oshib ketdi |

### 6.5 Payments & wallet

| Code | HTTP | Uzbek message |
|------|------|---------------|
| `INSUFFICIENT_BALANCE` | 402 | Hamyoningizda yetarli mablag' yo'q |
| `GATEWAY_DECLINED` | 402 | To'lov rad etildi. Boshqa kartani sinab ko'ring |
| `GATEWAY_UNAVAILABLE` | 502 | To'lov tizimi vaqtincha ishlamayapti |
| `GATEWAY_REFUND_FAILED` | 502 | Qaytarish amalga oshmadi |
| `IDEMPOTENCY_CONFLICT` | 409 | So'rov allaqachon bajarilgan |
| `WITHDRAWAL_LIMIT` | 429 | Kunlik yechib olish limiti oshib ketdi |
| `PAYMENT_METHOD_INVALID` | 422 | To'lov usuli noto'g'ri |

From PAYMENT_ARCHITECTURE.md §13.

### 6.6 Rate limiting

| Code | HTTP | Uzbek message |
|------|------|---------------|
| `RATE_LIMIT_EXCEEDED` | 429 | Juda ko'p so'rov. Biroz kuting |
| `LOGIN_RATE_LIMIT` | 429 | Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring |

Mirrors frontend `rate-limit.ts` copy.

### 6.7 Admin & system

| Code | HTTP | Uzbek message |
|------|------|---------------|
| `MFA_REQUIRED` | 403 | Moliyaviy amal uchun qo'shimcha tasdiqlash kerak |
| `AUDIT_EXPORT_FORBIDDEN` | 403 | Audit jurnalini ko'rish huquqingiz yo'q |
| `INTERNAL_ERROR` | 500 | Kutilmagan xatolik. Keyinroq qayta urinib ko'ring |
| `SERVICE_UNAVAILABLE` | 503 | Xizmat vaqtincha mavjud emas |
| `ENDPOINT_GONE` | 410 | Bu API versiyasi o'chirilgan |

---

## 7. Frontend error handling contract

TanStack Start API client (`src/lib/api-client.ts` target):

```typescript
type ApiError = {
  error: {
    code: string;
    message: string;
    field?: string;
    requestId: string;
    details?: Record<string, unknown>;
  };
};
```

**UI rules:**

| Code pattern | UI behavior |
|--------------|-------------|
| `VALIDATION_ERROR` + `field` | Inline field error |
| `AUTH_REQUIRED` | Redirect `/login?return=...` |
| `ROLE_FORBIDDEN` | Toast + stay on page |
| `INSUFFICIENT_BALANCE` | Modal → `/wallet` |
| `ESCROW_FROZEN` | Disable release buttons, show dispute banner |
| `RATE_LIMIT_*` | Toast with retry hint |
| `INTERNAL_ERROR` | Generic toast + log `requestId` to support |

Store functions today return `{ error: string }` locally (e.g. services-store) — migrate to throw/propagate API errors with `code` for branching.

---

## 8. Logging and observability

Every error response logs at appropriate level:

| Level | When |
|-------|------|
| `info` | Expected 4xx (validation, not found) |
| `warning` | 403, 409, 429 |
| `error` | 5xx, escrow/wallet failures |
| `critical` | Unhandled exceptions, payment TX rollback |

Structured log fields:

```json
{
  "event": "api_error",
  "request_id": "req_7f3a2b1c",
  "code": "ESCROW_FROZEN",
  "status": 423,
  "path": "/api/v1/escrow/ew-123/release",
  "user_id": "11111111-...",
  "duration_ms": 45
}
```

Sentry tags: `error.code`, `http.status`, `user.id` (hashed in PII mode).

---

## 9. Idempotency errors

Money endpoints store idempotency key in `idempotency_keys` table (24h TTL):

| Scenario | Response |
|----------|----------|
| Same key, same body, prior success | 200 with cached response body |
| Same key, different body | 409 `IDEMPOTENCY_CONFLICT` |
| Missing key on required route | 400 `IDEMPOTENCY_KEY_REQUIRED` |

Required routes: `POST /api/v1/checkout/confirm`, `POST /api/v1/escrow/:id/fund`, `POST /api/v1/escrow/:id/release`, `POST /api/v1/admin/escrow/:id/refund`.

---

## 10. Localization notes

- Primary: Uzbek (`uz`) — all `message` fields
- Future: `Accept-Language: ru` may return Russian — v2 consideration; v1 Uzbek only
- Error `code` never translated — stable across locales
- Admin audit logs store reason in language admin typed — not auto-translated

---

## 11. Testing requirements

| Test | Assert |
|------|--------|
| Unit | Each service guard raises correct code |
| Integration | 422 returns field path matching Pydantic loc |
| Contract | OpenAPI documents top 50 error codes |
| Security | 500 response never contains traceback |
| Escrow | Invalid transition returns 409 + `ESCROW_INVALID_TRANSITION` |

---

## 12. Related documents

- [API_VERSIONING.md](./API_VERSIONING.md) — version-specific error stability
- [PAYMENT_ARCHITECTURE.md](../payments/PAYMENT_ARCHITECTURE.md) — payment error codes
- [API_SECURITY.md](../security/API_SECURITY.md) — CSRF and rate limit errors
- [SERVICE_LAYER.md](./SERVICE_LAYER.md) — raise patterns
- [AUTH_ARCHITECTURE.md](../auth/AUTH_ARCHITECTURE.md) — auth error flows

---

*All user-facing API errors use Uzbek `message` and stable `code`. FastAPI handlers normalize Pydantic, IshborHTTPException, and unhandled exceptions into one JSON envelope with requestId.*
