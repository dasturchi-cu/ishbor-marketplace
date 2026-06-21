# API_SPECIFICATION.md

**Runtime:** FastAPI · uvicorn · Python 3.12  
**Reverse proxy:** nginx (TLS termination, gzip, `limit_req`)  
**Base URL:** `https://api.ishbor.uz/api/v1` (production)  
**Local:** `http://localhost:8000/api/v1`  
**Format:** JSON · UTF-8 · Uzbek error messages  
**Auth:** HttpOnly cookie `ishbor_sid` OR `Authorization: Bearer <token>` (mobile future)  
**Versioning:** URL prefix `/api/v1` — breaking changes → `/api/v2`  
**OpenAPI:** `/api/openapi.json` (staging/local only) · Swagger UI at `/api/docs`

---

## 1. FastAPI stack

```
Client → Cloudflare → nginx :443 → uvicorn :8000 (FastAPI)
                                      ├── Middleware: CORS, RequestId, Session, RateLimit
                                      ├── Router prefix: /api/v1
                                      └── Dependencies: get_db, get_redis, get_current_user
```

| Component | Implementation |
|-----------|----------------|
| App factory | `app/main.py:create_app()` |
| Routers | `app/routers/*.py` — one module per domain |
| Validation | Pydantic v2 request/response models (`app/schemas/`) |
| Auth dependency | `Depends(get_current_user)` — see §2 |
| RBAC | `Depends(require_role("client"))`, `Depends(require_admin("users"))` |
| DB session | `Depends(get_db)` → `AsyncSession` |
| Redis | `Depends(get_redis)` → rate limit + session cache |
| Errors | `IshborHTTPException` → `{ error: { code, message, field?, requestId } }` |

**Webhooks:** Mounted at `/webhooks/*` (no `/api/v1` prefix).  
**WebSocket:** `/ws/v1` — see WEBSOCKET_SPECIFICATION.md.

---

## 2. Authentication dependencies

FastAPI injects auth via dependencies — routers never parse cookies directly.

```python
# Optional — public routes that personalize when logged in
auth: SessionContext | None = Depends(get_optional_user)

# Required — returns 401 AUTH_REQUIRED if missing
auth: SessionContext = Depends(get_current_user)

# Role gate — returns 403 ROLE_FORBIDDEN
auth: SessionContext = Depends(require_role("client", "freelancer"))

# Admin gate — returns 403 ADMIN_FORBIDDEN
auth: SessionContext = Depends(require_admin("escrow"))
```

**Session resolution order:**
1. `SessionMiddleware` reads `ishbor_sid` cookie or `Authorization: Bearer`
2. Redis `ishbor:session:{token_hash}` fast lookup
3. PostgreSQL `sessions` table fallback (SESSION_STORAGE.md)
4. Attach `SessionContext` to `request.state.auth`

**SessionResponse fields:** `{ user: AuthUserDTO, activeRole, expiresAt }`

---

## 3. OpenAPI tags

Tags group endpoints in Swagger UI and generated client SDKs.

| Tag | Router module | Prefix |
|-----|---------------|--------|
| `Authentication` | `auth.py` | `/api/v1/auth` |
| `Users & Profiles` | `users.py` | `/api/v1/users`, `/freelancers`, `/clients` |
| `Onboarding` | `users.py` | `/api/v1/onboarding` |
| `Marketplace — Projects` | `projects.py` | `/api/v1/projects` |
| `Marketplace — Services` | `services.py` | `/api/v1/services` |
| `Applications` | `applications.py` | `/api/v1/applications` |
| `Orders & Checkout` | `orders.py` | `/api/v1/orders`, `/checkout` |
| `Escrow` | `escrow.py` | `/api/v1/escrow` |
| `Wallet & Payments` | `wallet.py` | `/api/v1/wallet`, `/payment-methods` |
| `Subscriptions & Credits` | `wallet.py` | `/api/v1/subscription`, `/credits`, `/promotions` |
| `Portfolio` | `portfolio.py` | `/api/v1/portfolio` |
| `Agencies` | `agencies.py` | `/api/v1/agencies` |
| `Messaging` | `messaging.py` | `/api/v1/conversations` |
| `Notifications` | `notifications.py` | `/api/v1/notifications` |
| `Saved & Reviews` | `reviews.py` | `/api/v1/saved`, `/reviews`, `/referrals` |
| `CRM` | `crm.py` | `/api/v1/crm` |
| `Analytics` | `analytics.py` | `/api/v1/analytics` |
| `AI Hub` | `ai.py` | `/api/v1/ai` |
| `Search` | `search.py` | `/api/v1/search` |
| `Files` | `files.py` | `/api/v1/files` |
| `Admin — Dashboard` | `admin/dashboard.py` | `/api/v1/admin/dashboard` |
| `Admin — Users` | `admin/users.py` | `/api/v1/admin/users` |
| `Admin — Marketplace` | `admin/marketplace.py` | `/api/v1/admin/projects`, etc. |
| `Admin — Commerce` | `admin/commerce.py` | `/api/v1/admin/orders`, `/escrow`, `/disputes` |
| `Admin — Operations` | `admin/ops.py` | `/api/v1/admin/moderation`, `/support`, `/audit` |
| `Admin — System` | `admin/system.py` | `/api/v1/admin/system`, `/founder`, `/ai`, `/revenue` |
| `Webhooks` | `webhooks.py` | `/webhooks` |

---

## 4. Conventions

### Request headers
```
Content-Type: application/json
Accept: application/json
X-Request-Id: <uuid>          (optional, echoed in response)
X-Idempotency-Key: <uuid>     (required for money mutations)
Cookie: ishbor_sid=<token>    (browser sessions)
Authorization: Bearer <token> (mobile/API clients)
```

### Pagination
```
GET /api/v1/resources?page=1&limit=20&sort=-created_at
```
```json
{
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 142, "hasMore": true }
}
```

### Error response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email noto'g'ri formatda",
    "field": "email",
    "requestId": "req_abc123"
  }
}
```

**Validation:** Pydantic models mirror frontend Zod schemas (`auth.ts`, `project-validation.ts`, `sanitize.ts`).

---

## 5. Authentication

**Tag:** `Authentication`  
**Router:** `app/routers/auth.py`  
**Dependency:** Public except where noted; `get_current_user` for logout/session/password/active-role

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | — | Register client/freelancer |
| POST | `/api/v1/auth/login` | — | Email/password login |
| POST | `/api/v1/auth/logout` | ✅ `get_current_user` | Invalidate session |
| GET | `/api/v1/auth/session` | ✅ `get_current_user` | Current user + active role |
| POST | `/api/v1/auth/oauth/google` | — | OAuth callback handler |
| POST | `/api/v1/auth/verify-email` | — | Email token verify |
| POST | `/api/v1/auth/verify-otp` | — | Phone OTP verify |
| POST | `/api/v1/auth/forgot-password` | — | Send reset email |
| POST | `/api/v1/auth/reset-password` | — | Reset with token |
| PATCH | `/api/v1/auth/password` | ✅ `get_current_user` | Change password |
| PATCH | `/api/v1/auth/active-role` | ✅ `get_current_user` | Switch client/freelancer/agency |

### DTOs

**RegisterRequest**
```typescript
{
  email: string;          // email, max 255
  password: string;       // min 8, max 128
  fullName: string;       // min 2, max 120
  userType: "client" | "freelancer";
  referralCode?: string;
}
```

**LoginRequest:** `{ email, password, remember?: boolean }`  
**SessionResponse:** `{ user: AuthUserDTO, activeRole, expiresAt }`

---

## 6. Users & profiles

**Tag:** `Users & Profiles`

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/users/me` | `get_current_user` |
| PATCH | `/api/v1/users/me` | `get_current_user` |
| GET | `/api/v1/users/me/profile` | `get_current_user` |
| PATCH | `/api/v1/users/me/profile` | `get_current_user` |
| GET | `/api/v1/users/me/settings` | `get_current_user` |
| PATCH | `/api/v1/users/me/settings` | `get_current_user` |
| GET | `/api/v1/users/me/security` | `get_current_user` |
| PATCH | `/api/v1/users/me/security` | `get_current_user` |
| POST | `/api/v1/users/me/verification` | `get_current_user` |
| GET | `/api/v1/freelancers` | Public |
| GET | `/api/v1/freelancers/:username` | Public |
| GET | `/api/v1/clients/:slug` | Public |

**ProfileUpdateDTO:** skills[], categories[], languages[], availability, rate, industry, teamSize, hiringGoals

---

## 7. Onboarding

**Tag:** `Onboarding`

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/onboarding/state` | `get_current_user` |
| PATCH | `/api/v1/onboarding/state` | `get_current_user` |
| POST | `/api/v1/onboarding/complete` | `get_current_user` |

Steps map to routes: company, industry, team-size, hiring-goals, skills, categories, portfolio, languages, availability.

---

## 8. Marketplace — projects

**Tag:** `Marketplace — Projects`

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/projects` | Public |
| GET | `/api/v1/projects/:slug` | Public |
| POST | `/api/v1/projects` | `require_role("client")` |
| PATCH | `/api/v1/projects/:slug` | Owner |
| POST | `/api/v1/projects/:slug/publish` | Owner |
| POST | `/api/v1/projects/:slug/pause` | Owner |
| POST | `/api/v1/projects/:slug/close` | Owner |
| DELETE | `/api/v1/projects/:slug` | Owner (draft only) |
| POST | `/api/v1/projects/:slug/attachments` | Owner |

**CreateProjectDTO:** title, description, budget, budgetType, category, skills[], duration, experienceLevel, scope[]  
**Validation:** `project-validation.ts` rules (min title 10, budget > 0)

---

## 9. Marketplace — services

**Tag:** `Marketplace — Services`

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/services` | Public |
| GET | `/api/v1/services/:slug` | Public |
| GET | `/api/v1/services/category/:slug` | Public |
| POST | `/api/v1/services` | `require_role("freelancer")` |
| PATCH | `/api/v1/services/:slug` | Owner |
| POST | `/api/v1/services/:slug/publish` | Owner |
| DELETE | `/api/v1/services/:slug` | Owner |

**CreateServiceDTO:** title, category, description, packages[], gallery[], faqs[]  
**Enforcement:** `canCreateService()` subscription limit on POST

---

## 10. Applications (proposals)

**Tag:** `Applications`

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/applications` | `require_role("freelancer")` |
| GET | `/api/v1/applications/:id` | Freelancer owner |
| POST | `/api/v1/projects/:slug/applications` | `require_role("freelancer")` |
| PATCH | `/api/v1/applications/:id` | Freelancer (withdraw) |
| POST | `/api/v1/applications/:id/accept` | Client (project owner) |
| POST | `/api/v1/applications/:id/reject` | Client |
| POST | `/api/v1/applications/:id/shortlist` | Client |

**CreateApplicationDTO:** coverNote, proposalAmount, deliveryTime  
**Enforcement:** `canSubmitProposal()` — free plan 10/month

---

## 11. Orders & checkout

**Tag:** `Orders & Checkout`  
**Dependency:** `X-Idempotency-Key` header required on confirm

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/orders` | `get_current_user` (participant filter) |
| GET | `/api/v1/orders/:id` | Participant |
| POST | `/api/v1/checkout/preview` | `require_role("client")` |
| POST | `/api/v1/checkout/confirm` | `require_role("client")` |
| POST | `/api/v1/orders/:id/confirm-delivery` | Client |
| POST | `/api/v1/orders/:id/request-revision` | Client |
| POST | `/api/v1/orders/:id/cancel` | Participant |

**CheckoutConfirmDTO**
```typescript
{
  type: "service" | "hire" | "order";
  serviceSlug?: string;
  packageTier?: "essential" | "premium" | "enterprise";
  freelancerUsername?: string;
  projectSlug?: string;
  orderId?: string;
  paymentMethodId: string;
  idempotencyKey: string;
}
```

**Side effects:** create/update order, create escrow, hold wallet funds, 5% platform fee, analytics events, notifications.

---

## 12. Escrow

**Tag:** `Escrow`  
**Dependency:** `X-Idempotency-Key` on fund/release

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/escrow` | `get_current_user` |
| GET | `/api/v1/escrow/:id` | Participant |
| POST | `/api/v1/escrow/:id/fund` | Client |
| POST | `/api/v1/escrow/:id/milestones/:mid/release` | Client |
| POST | `/api/v1/escrow/:id/dispute` | Participant |

---

## 13. Wallet & payments

**Tag:** `Wallet & Payments`

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/wallet` | `get_current_user` |
| GET | `/api/v1/wallet/transactions` | `get_current_user` |
| POST | `/api/v1/wallet/deposit` | `get_current_user` + idempotency |
| POST | `/api/v1/wallet/withdraw` | `get_current_user` + idempotency |
| GET | `/api/v1/wallet/export.csv` | `get_current_user` |
| GET | `/api/v1/payment-methods` | `get_current_user` |
| POST | `/api/v1/payment-methods` | `get_current_user` |
| PATCH | `/api/v1/payment-methods/:id` | Owner |
| DELETE | `/api/v1/payment-methods/:id` | Owner |

**DepositDTO:** `{ amount: number, methodId: string, idempotencyKey }` — min 10, max 50000 USD

---

## 14. Subscriptions & credits

**Tag:** `Subscriptions & Credits`

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/subscription` | `get_current_user` |
| GET | `/api/v1/subscription/plans` | Public |
| POST | `/api/v1/subscription/upgrade` | `get_current_user` + idempotency |
| POST | `/api/v1/subscription/cancel` | `get_current_user` |
| GET | `/api/v1/credits` | `get_current_user` |
| POST | `/api/v1/credits/purchase` | `get_current_user` + idempotency |
| GET | `/api/v1/promotions/featured` | `require_role("freelancer")` |
| POST | `/api/v1/promotions/featured` | `require_role("freelancer")` + idempotency |

---

## 15. Portfolio

**Tag:** `Portfolio`

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/portfolio` | `get_current_user` (owner list) |
| GET | `/api/v1/portfolio/:slug` | Public if published |
| POST | `/api/v1/portfolio` | `require_role("freelancer")` |
| PATCH | `/api/v1/portfolio/:slug` | Owner |
| POST | `/api/v1/portfolio/:slug/publish` | Owner |
| DELETE | `/api/v1/portfolio/:slug` | Owner |

---

## 16. Agencies

**Tag:** `Agencies`

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/agencies` | Public |
| GET | `/api/v1/agencies/:slug` | Public/member |
| POST | `/api/v1/agencies` | `get_current_user` |
| PATCH | `/api/v1/agencies/:slug` | `edit_agency` perm |
| POST | `/api/v1/agencies/:slug/publish` | owner |
| POST | `/api/v1/agencies/:slug/members/invite` | `invite_members` |
| PATCH | `/api/v1/agencies/:slug/members/:userId/role` | `manage_roles` |
| DELETE | `/api/v1/agencies/:slug/members/:userId` | owner/manager |
| GET | `/api/v1/agencies/:slug/clients` | `view_crm` |
| POST | `/api/v1/agencies/:slug/case-studies` | `edit_agency` |
| POST | `/api/v1/agencies/:slug/verification-request` | owner |

---

## 17. Messaging

**Tag:** `Messaging`

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/conversations` | `get_current_user` |
| GET | `/api/v1/conversations/:id/messages` | Participant |
| POST | `/api/v1/conversations` | `get_current_user` |
| POST | `/api/v1/conversations/:id/messages` | Participant |
| POST | `/api/v1/conversations/:id/messages/offer` | `require_role("freelancer")` |
| POST | `/api/v1/conversations/:id/messages/:msgId/accept-offer` | Client |
| PATCH | `/api/v1/conversations/:id/read` | Participant |
| PATCH | `/api/v1/conversations/:id/archive` | Participant |

**SendMessageDTO:** `{ type, body?, fileId?, offer? }`

---

## 18. Notifications

**Tag:** `Notifications`

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/notifications` | `get_current_user` |
| PATCH | `/api/v1/notifications/:id/read` | Owner |
| POST | `/api/v1/notifications/read-all` | `get_current_user` |
| GET | `/api/v1/notifications/preferences` | `get_current_user` |
| PATCH | `/api/v1/notifications/preferences` | `get_current_user` |
| GET | `/api/v1/notifications/unread-count` | `get_current_user` |

---

## 19. Saved, reviews, referrals

**Tag:** `Saved & Reviews`

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/saved` | `get_current_user` |
| POST | `/api/v1/saved` | `get_current_user` |
| DELETE | `/api/v1/saved/:type/:id` | `get_current_user` |
| POST | `/api/v1/orders/:id/reviews` | Client (completed order) |
| GET | `/api/v1/reviews` | Public (by username) |
| GET | `/api/v1/referrals` | `get_current_user` |
| POST | `/api/v1/referrals/apply` | `get_current_user` (on register) |

---

## 20. CRM

**Tag:** `CRM`

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/crm/clients` | `require_role("freelancer")` |
| GET | `/api/v1/crm/freelancers` | `require_role("client")` |
| GET | `/api/v1/crm/leads` | `require_role("client")` |
| PATCH | `/api/v1/crm/leads/:id/stage` | `require_role("client")` |

Computed from orders + messages + saved — no separate CRM tables in v1 beyond materialized view.

---

## 21. Analytics

**Tag:** `Analytics`

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/analytics/client` | `require_role("client")` |
| GET | `/api/v1/analytics/freelancer` | `require_role("freelancer")` |
| POST | `/api/v1/analytics/events` | `get_current_user` (batch ingest) |

**EventIngestDTO:** `{ type: AnalyticsEventType, entityId?, value?, meta? }[]`

---

## 22. AI hub

**Tag:** `AI Hub`  
**Rate limit:** Redis `ishbor:rl:ai:{user_id}` — see §26

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/ai/tools` | `get_current_user` |
| POST | `/api/v1/ai/proposal-assistant` | `require_role("freelancer")` |
| POST | `/api/v1/ai/project-generator` | `require_role("client")` |
| POST | `/api/v1/ai/portfolio-optimizer` | `require_role("freelancer")` |
| POST | `/api/v1/ai/trust-coach` | `get_current_user` |
| POST | `/api/v1/ai/onboarding` | `get_current_user` |

All proxy to LLM with rate limits + `ai_usage_logs` insert.

---

## 23. Search

**Tag:** `Search`

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/search` | Public |
| GET | `/api/v1/search/suggest` | Public |

**Query params:** `q`, `type=services|freelancers|projects|agencies`, `sort`, `category`, `filter`  
Maps `marketplace.ts` + `agency-marketplace.ts` server-side.

---

## 24. Files

**Tag:** `Files`

| Method | Path | Access |
|--------|------|--------|
| POST | `/api/v1/files/presign` | `get_current_user` |
| POST | `/api/v1/files/confirm` | `get_current_user` |
| GET | `/api/v1/files/:id` | Owner or public entity |

**PresignDTO:** `{ filename, mimeType, sizeBytes, purpose }`  
Returns `{ uploadUrl, fileId, expiresAt }`

---

## 25. Admin API

**Tags:** `Admin — *`  
**Dependency:** `require_admin(section)` on all routes — `is_admin` + `canAccessSection()`

| Method | Path | Section |
|--------|------|---------|
| GET | `/api/v1/admin/dashboard` | dashboard |
| GET/PATCH | `/api/v1/admin/users` | users |
| GET | `/api/v1/admin/users/:id` | users |
| POST | `/api/v1/admin/users/:id/suspend` | users |
| POST | `/api/v1/admin/users/:id/verify` | users |
| GET | `/api/v1/admin/verifications` | verifications |
| POST | `/api/v1/admin/verifications/:id/approve` | verifications |
| GET | `/api/v1/admin/projects` | projects |
| PATCH | `/api/v1/admin/projects/:slug/status` | projects |
| GET | `/api/v1/admin/services` | services |
| GET | `/api/v1/admin/portfolios` | portfolios |
| GET | `/api/v1/admin/orders` | orders |
| GET | `/api/v1/admin/applications` | applications |
| GET | `/api/v1/admin/escrow` | escrow |
| POST | `/api/v1/admin/escrow/:id/release` | escrow |
| POST | `/api/v1/admin/escrow/:id/freeze` | escrow |
| POST | `/api/v1/admin/escrow/:id/refund` | escrow |
| GET | `/api/v1/admin/disputes` | disputes |
| POST | `/api/v1/admin/disputes/:id/resolve` | disputes |
| GET | `/api/v1/admin/payments` | payments |
| GET | `/api/v1/admin/moderation` | moderation |
| PATCH | `/api/v1/admin/moderation/:id` | moderation |
| GET | `/api/v1/admin/support` | support |
| POST | `/api/v1/admin/support/:id/reply` | support |
| GET | `/api/v1/admin/analytics` | analytics |
| GET | `/api/v1/admin/audit` | audit |
| GET | `/api/v1/admin/system/health` | system |
| GET | `/api/v1/admin/founder/metrics` | founder |
| GET | `/api/v1/admin/ai/insights` | ai |
| GET | `/api/v1/admin/revenue` | revenue |

---

## 26. Webhooks (inbound)

**Tag:** `Webhooks`  
**Mount:** `/webhooks` (outside `/api/v1`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/webhooks/payme` | HMAC |
| POST | `/webhooks/click` | HMAC |
| POST | `/webhooks/stripe` | Stripe sig |

---

## 27. Rate limits

Enforced by `RateLimitMiddleware` + route-specific checks. Redis keys: RATE_LIMIT_STORAGE.md.

| Tier | Limit | Redis key |
|------|-------|-----------|
| Public read | 120 req/min/IP | `ishbor:rl:api:public:{ip}` |
| Auth read | 300 req/min/user | `ishbor:rl:api:{user_id}:read` |
| Auth write | 60 req/min/user | `ishbor:rl:api:{user_id}:write` |
| Checkout | 10 req/min/user | `ishbor:rl:checkout:{user_id}` |
| AI tools | 20 req/hour/user (free), 100 (pro) | `ishbor:rl:ai:{user_id}` |
| Login | 5 attempts/15min/email | `ishbor:rl:login:{email}` |

Login message (Uzbek): `"Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring."` — mirrors `rate-limit.ts`.

---

## 28. nginx routing reference

```nginx
location /api/ {
    proxy_pass http://ishbor_api;  # uvicorn FastAPI
}
location /webhooks/ {
    proxy_pass http://ishbor_api;
}
location /ws/ {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_pass http://ishbor_api;
}
```

---

*Total endpoints: 120+. Maps every route in ROUTE_REGISTRY.md to a server contract.*  
*Implementation guide: [fastapi/FASTAPI_ARCHITECTURE.md](./fastapi/FASTAPI_ARCHITECTURE.md)*
