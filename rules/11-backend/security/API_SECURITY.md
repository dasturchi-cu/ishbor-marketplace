# API_SECURITY.md

**Stack:** FastAPI + Pydantic v2 validation + PostgreSQL  
**Frontend:** TanStack Start — API calls with credentials include

---

## 1. CORS configuration

```python
# server/main.py
from fastapi.middleware.cors import CORSMiddleware

ALLOWED_ORIGINS = {
    "local": ["http://localhost:5173", "http://localhost:3000"],
    "staging": ["https://staging.ishbor.uz"],
    "production": ["https://ishbor.uz", "https://www.ishbor.uz"],
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS[settings.APP_ENV],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Idempotency-Key", "X-CSRF-Token", "X-Request-Id"],
    max_age=600,
)
```

**Rules:**

- Never use `allow_origins=["*"]` with credentials
- api.ishbor.uz does not need CORS for same-origin — CORS is for frontend origin → API cross-origin if split
- Webhook routes exclude CORS middleware — server-to-server only

---

## 2. CSRF protection

| Request type | CSRF required |
|--------------|---------------|
| GET, HEAD, OPTIONS | No |
| POST, PUT, PATCH, DELETE (session auth) | Yes |
| Webhook endpoints | No — signature auth instead |
| Bearer token API (P2) | No — token in header |

### Double-submit cookie pattern

```python
# On login: set csrf_token cookie (NOT HttpOnly — JS must read)
# Client sends X-CSRF-Token header matching cookie value

@app.middleware("http")
async def csrf_middleware(request, call_next):
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        if request.url.path.startswith("/v1/webhooks"):
            return await call_next(request)
        cookie_token = request.cookies.get("csrf_token")
        header_token = request.headers.get("X-CSRF-Token")
        if not cookie_token or cookie_token != header_token:
            return JSONResponse({"error": "csrf_invalid"}, status_code=403)
    return await call_next(request)
```

SameSite=Lax on session cookie provides additional CSRF protection for cross-site POST.

---

## 3. Input validation — Pydantic

All request bodies validated via Pydantic models — never raw dict access.

```python
class DepositRequest(BaseModel):
    amount_usd: Decimal = Field(gt=0, le=10000, decimal_places=2)
    method_id: UUID
    idempotency_key: str = Field(min_length=16, max_length=64)

    @field_validator("amount_usd")
    @classmethod
    def round_amount(cls, v):
        return v.quantize(Decimal("0.01"))
```

### Validation rules

| Field type | Validation |
|------------|------------|
| UUID path params | Pydantic UUID type — 404 if malformed |
| Email | EmailStr |
| Phone | UZ regex `^998\d{9}$` after normalization |
| Text fields | max_length enforced — no unbounded strings |
| Arrays | max_length on list fields |
| Enums | Strict enum — reject unknown values |
| File metadata | MIME whitelist per purpose |

Reject unknown fields: `model_config = ConfigDict(extra="forbid")`.

---

## 4. Request size limits

| Content type | Limit | Enforced by |
|--------------|-------|-------------|
| JSON API body | 1 MB | nginx + FastAPI |
| Multipart (non-presign) | Disabled — use presign | — |
| Webhook body | 256 KB | nginx location block |
| WebSocket message | 64 KB | Application |

Large uploads go direct to MinIO via presigned URL — see UPLOAD_FLOW.md.

---

## 5. Output security

| Rule | Detail |
|------|--------|
| JSON only | No HTML in API responses |
| Error messages | Generic in production — details in logs |
| PII minimization | Don't return password_hash, token_hash, full phone |
| Pagination | Max limit=100 per page |
| Internal IDs | UUID only — no sequential IDs |

```python
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: str          # only for owner endpoint
    full_name: str
    # password_hash: NEVER included
```

---

## 6. SQL injection prevention

- SQLAlchemy ORM for all queries — no raw string interpolation
- Raw SQL only in migrations with static strings
- Parameterized queries if raw SQL required: `text("SELECT ... WHERE id = :id")`

```python
# FORBIDDEN
db.execute(f"SELECT * FROM users WHERE email = '{email}'")

# REQUIRED
db.execute(select(User).where(User.email == email))
```

---

## 7. Authentication on API routes

```python
# Dependency injection
async def get_current_user(session: Session = Depends(get_session)) -> User:
    if not session:
        raise HTTPException(401, detail={"code": "UNAUTHENTICATED"})
    if session.user.account_status != "active":
        raise HTTPException(403, detail={"code": "ACCOUNT_SUSPENDED"})
    return session.user

# Usage
@router.post("/checkout/confirm")
async def checkout_confirm(
    body: CheckoutRequest,
    user: User = Depends(require_role("client")),
):
    ...
```

Webhook routes use signature verification dependency — not session auth.

---

## 8. Security headers (API responses)

FastAPI adds baseline headers — nginx adds full set for frontend:

```python
@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-store"  # API responses
    return response
```

Full header set for frontend via nginx — see SECURITY_HEADERS.md.

---

## 9. Error response format

```json
{
  "error": "INSUFFICIENT_BALANCE",
  "message": "Hamyoningizda yetarli mablag' yo'q",
  "request_id": "abc-123"
}
```

Never expose stack traces in production. Sentry captures full exception with request_id.

---

## 10. API versioning

```
/v1/... — current stable
/v2/... — future breaking changes
```

Deprecation: `Sunset` header + 6-month notice. Admin and webhook routes versioned separately if needed.

---

## 11. Related documents

- [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md)
- [RATE_LIMITING.md](./RATE_LIMITING.md)
- [CSP_CONFIGURATION.md](./CSP_CONFIGURATION.md)
- [../AUTH_ARCHITECTURE.md](../AUTH_ARCHITECTURE.md)

---

*All input is validated at the boundary via Pydantic. CSRF protects session-authenticated mutations. CORS restricts browser origins to ishbor.uz domains.*
