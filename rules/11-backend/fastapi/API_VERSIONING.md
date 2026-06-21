# API_VERSIONING.md

**Project:** Ishbor Marketplace  
**Stack:** FastAPI · PostgreSQL · Redis · nginx  
**Authority:** URL-prefix versioning for all REST endpoints  
**Related:** [API_SPECIFICATION.md](../API_SPECIFICATION.md), [FASTAPI_ARCHITECTURE.md](./FASTAPI_ARCHITECTURE.md)

---

## 1. Purpose

Ishbor exposes a single authoritative REST API consumed by:

- TanStack Start web app (`ishbor.uz`)
- Future native mobile apps (iOS/Android)
- Admin panel (`/admin/*` routes call same API with admin RBAC)
- Partner integrations (future — scoped API keys)

Versioning guarantees that breaking schema or behavior changes do not silently break deployed clients. All production traffic uses `/api/v1` today; `/api/v2` is reserved for incompatible migrations.

---

## 2. Versioning strategy

### 2.1 URL prefix (canonical)

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.ishbor.uz/api/v1` |
| Staging | `https://api.staging.ishbor.uz/api/v1` |
| Local | `http://localhost:8000/api/v1` |

FastAPI mounts domain routers under a single prefix:

```
app.include_router(projects_router, prefix="/api/v1/projects", tags=["Marketplace — Projects"])
app.include_router(orders_router, prefix="/api/v1/orders", tags=["Orders & Checkout"])
```

**Not versioned under `/api/v1`:**

| Mount | Reason |
|-------|--------|
| `/webhooks/*` | Provider callbacks — stable URLs registered with Payme/Humo |
| `/ws/v1` | WebSocket uses separate version segment (see WEBSOCKET_SPECIFICATION.md) |
| `/health`, `/ready` | Infrastructure probes |
| `/api/openapi.json`, `/api/docs` | Staging/local only — disabled in production nginx |

### 2.2 What counts as a breaking change

Requires new major version (`/api/v2`):

- Removing or renaming response fields clients depend on
- Changing field types (string → object)
- Changing HTTP method or path for an existing operation
- Tightening validation that rejects previously accepted payloads
- Changing auth model (cookie-only → bearer-only without dual support)
- Changing pagination contract (`page/limit` → cursor-only)

Non-breaking (same `/api/v1`):

- Adding optional request fields
- Adding response fields (clients ignore unknown keys)
- Adding new endpoints
- Adding new enum values **if** clients treat unknown values gracefully
- Performance improvements with identical contracts

### 2.3 Header-based negotiation (supplementary)

Ishbor does **not** use `Accept-Version` as primary strategy. Optional header for diagnostics only:

```
X-Ishbor-API-Version: 1
```

If present and unsupported → `400 API_VERSION_UNSUPPORTED` with Uzbek message: *"API versiyasi qo'llab-quvvatlanmaydi"*.

---

## 3. Router and schema organization

```
app/
├── main.py                    # create_app(), mount /api/v1/*
├── routers/
│   ├── v1/                    # All v1 routers (recommended layout)
│   │   ├── projects.py
│   │   ├── services.py
│   │   ├── orders.py
│   │   └── admin/
│   └── v2/                    # Future — created only when v1 frozen
├── schemas/
│   ├── v1/                    # Pydantic models for v1 responses
│   └── v2/
└── services/                  # Domain logic — version-agnostic where possible
```

**Rule:** Service layer returns domain objects; router layer maps to version-specific DTOs. Never return SQLAlchemy models directly — enables v1/v2 parallel response shapes from one service.

---

## 4. Deprecation policy

### 4.1 Timeline

| Phase | Duration | Action |
|-------|----------|--------|
| Announce | T+0 | Changelog, `Deprecation` response header, admin notice |
| Dual-run | ≥ 90 days | v1 endpoint marked deprecated; v2 equivalent live |
| Sunset | T+90 to T+180 | v1 returns `410 GONE` with migration link |
| Remove | After T+180 | v1 router deleted from codebase |

### 4.2 Deprecation headers

Deprecated endpoints include:

```
Deprecation: true
Sunset: Sat, 20 Sep 2026 00:00:00 GMT
Link: </api/v2/projects>; rel="successor-version"
```

Response body may include optional `meta.deprecationNotice` (Uzbek) for admin-facing tools only — not shown to end users in mobile apps.

### 4.3 Changelog

Maintained at `rules/11-backend/API_CHANGELOG.md` (create on first breaking release). Each entry:

- Version affected
- Endpoint path
- Migration steps for frontend/mobile
- Store function mapping (e.g. `publishProject` → unchanged path)

---

## 5. Mobile compatibility

### 5.1 Auth model

| Client | Auth mechanism | Notes |
|--------|----------------|-------|
| Web (TanStack) | HttpOnly cookie `ishbor_sid` | CSRF double-submit on mutations |
| Mobile (future) | `Authorization: Bearer <token>` | Same session table; token from `POST /api/v1/auth/mobile/login` |
| Admin web | Cookie + MFA step-up for finance | Same API, `require_admin` dependency |

Mobile clients **must** send:

```
Accept: application/json
Accept-Language: uz
X-Client-Platform: ios | android
X-Client-Version: 1.2.0
X-Request-Id: <uuid>
```

Server logs platform/version for compatibility triage — never blocks requests on unknown version in v1 (warn only).

### 5.2 Minimum supported app versions

When mobile ships, enforce via middleware:

```
GET /api/v1/config/client
→ { minIosVersion, minAndroidVersion, forceUpdate: false }
```

Hard block (optional): `426 UPGRADE_REQUIRED` if `X-Client-Version` below minimum **and** `forceUpdate=true` in config.

### 5.3 Offline and sync

Mobile may cache:

- Published projects/services lists (ETag from `GET /api/v1/projects`)
- User's orders (`GET /api/v1/orders?mine=true`)

Cache invalidation via WebSocket `order.status_changed` or push notification. Version field on entities: `updatedAt` — client sends `If-None-Match` for conditional GET.

### 5.4 Idempotency (mobile-critical)

All money mutations require `X-Idempotency-Key` — mobile SDK generates UUID per user action, retries safe on flaky networks:

```
POST /api/v1/escrow/:id/fund
POST /api/v1/checkout/confirm
POST /api/v1/wallet/withdraw
```

Documented in PAYMENT_ARCHITECTURE.md — mobile must persist idempotency keys until 2xx response.

---

## 6. Response envelope stability

### 6.1 Success shapes (v1 locked)

**Single resource:**

```json
{
  "data": { "id": "...", "slug": "fintech-app-redesign", "status": "published" }
}
```

**List with pagination:**

```json
{
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 142, "hasMore": true }
}
```

**Error (see ERROR_HANDLING.md):**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Sarlavha majburiy",
    "field": "title",
    "requestId": "req_abc123"
  }
}
```

These envelopes are **frozen for v1**. New metadata goes in `data` or `meta`, not top-level siblings.

### 6.2 Enum serialization

PostgreSQL enums serialize as lowercase snake strings matching frontend stores:

| Domain | Example values |
|--------|----------------|
| `project_status` | `draft`, `published`, `paused`, `closed` |
| `order_status` | `in_progress`, `review`, `completed`, `disputed`, `cancelled` |
| `escrow_status` | `accepted`, `funded`, `in_progress`, `released`, `completed`, `disputed` |

Adding enum value = non-breaking if UI handles unknown. Removing = breaking.

---

## 7. OpenAPI and code generation

| Environment | OpenAPI | Swagger UI |
|-------------|---------|------------|
| Local | `/api/openapi.json` | `/api/docs` |
| Staging | Same | Same (auth-gated) |
| Production | Disabled | Disabled |

Mobile team generates Swift/Kotlin clients from staging OpenAPI. Tag names match API_SPECIFICATION §3 (e.g. `Marketplace — Projects`).

**Version in OpenAPI info:**

```yaml
info:
  title: Ishbor API
  version: 1.0.0
  description: REST API v1 — see rules/11-backend/fastapi/API_VERSIONING.md
```

`info.version` is documentation semver — URL `/api/v1` is the runtime contract.

---

## 8. nginx routing

```nginx
# v1 — default
location /api/v1/ {
    proxy_pass http://ishbor_api;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# v2 — future (comment until launch)
# location /api/v2/ {
#     proxy_pass http://ishbor_api;
# }

# Reject unversioned API calls
location /api/ {
    return 404;
}
```

Web and mobile must never call `/api/projects` without version segment.

---

## 9. Testing version contracts

| Test type | Scope |
|-----------|-------|
| Contract tests | Pydantic response models match OpenAPI snapshot |
| Frontend integration | MSW mocks use `/api/v1` prefix exclusively |
| Regression | Snapshot tests on critical paths: auth, checkout, escrow fund |
| Deprecation | Integration test asserts `Deprecation` header when flagged |

CI fails if any router mounts outside `/api/v1` without explicit exception list (webhooks, ws, health).

---

## 10. Migration checklist (v1 → v2)

When v2 is required:

1. Freeze v1 routers — bugfixes only
2. Implement v2 routers + schemas in parallel
3. Update TanStack Start API client base URL via env (`VITE_API_BASE`)
4. Ship mobile app with v2 support before v1 sunset
5. Run dual-write period if response shapes diverge (prefer single service layer)
6. Monitor `410` rate on v1 — zero for 30 days before code removal
7. Update rules/13-domains/* API sections and store migration notes

---

## 11. Related documents

- [ERROR_HANDLING.md](./ERROR_HANDLING.md) — stable error codes across versions
- [API_SPECIFICATION.md](../API_SPECIFICATION.md) — full endpoint catalog
- [FASTAPI_ARCHITECTURE.md](./FASTAPI_ARCHITECTURE.md) — app factory and middleware
- [AUTH_ARCHITECTURE.md](../auth/AUTH_ARCHITECTURE.md) — cookie vs bearer
- [WEBSOCKET_SPECIFICATION.md](../WEBSOCKET_SPECIFICATION.md) — `/ws/v1` versioning

---

*Ishbor uses URL-prefix versioning (`/api/v1`). Breaking changes require `/api/v2` with 90-day deprecation. Mobile clients use Bearer auth and must send platform/version headers for compatibility tracking.*
