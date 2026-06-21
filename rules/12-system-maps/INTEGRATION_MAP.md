# INTEGRATION_MAP.md — External Systems & API Boundaries

---

## 1. Integration status matrix

| System | Purpose | Code reference | Status |
|--------|---------|----------------|--------|
| **PostgreSQL (Neon)** | Primary DB | `server/db/`, `DATABASE_URL` | PARTIAL (auth tables) |
| **HttpOnly cookies** | Session | `ishbor_sid`, session-service | SERVER |
| **Google OAuth** | Social login | `GoogleButton` | PARTIAL (demo only) |
| **Payme** | UZS payments | PAYMENT_ARCHITECTURE.md | SPEC |
| **Stripe** | USD cards (optional) | config.server STRIPE_SECRET_KEY | SPEC |
| **Resend** | Transactional email | — | SPEC |
| **SMS (Eskiz/Playmobile)** | OTP | verify-otp demo | SPEC |
| **Redis** | WS pub/sub, rate limit | INFRASTRUCTURE_ARCHITECTURE | SPEC |
| **Cloudflare R2** | File storage | FILE_STORAGE_ARCHITECTURE | SPEC |
| **WebSocket** | Realtime | WEBSOCKET_SPECIFICATION | SPEC |
| **Sentry** | Error tracking | lovable-error-reporting | PARTIAL |
| **Google Fonts** | Typography | __root.tsx preconnect | LIVE |

---

## 2. Server function API boundary (implemented)

| Function | Method | Input | Output | Auth |
|----------|--------|-------|--------|------|
| `getServerSession` | GET | cookie | `{ authenticated, session? }` | cookie |
| `loginSession` | POST | email, password, remember | `{ ok, session?, error? }` + Set-Cookie | public |
| `logoutSession` | POST | cookie | `{ ok }` + Clear-Cookie | cookie |
| `completeRegistrationSession` | POST | email, password, otp, profile | `{ ok, session?, error? }` | public |
| `getHealth` | GET | — | status, database, version | public |
| `getReady` | GET | — | ready, mode | public |
| `validateLogin` | POST | email, password | validation result | public (legacy) |
| `blockDemoAccountServer` | POST | email, blocked | stub | admin hook |

**Pattern:** TanStack `createServerFn` — not REST `/api/v1` yet.

---

## 3. Target REST API surface

Full spec: [API_SPECIFICATION.md](../11-backend/API_SPECIFICATION.md) — 120+ endpoints

| Module | Base path | Priority |
|--------|-----------|----------|
| Auth | `/api/v1/auth/*` | P0 ✅ partial |
| Users | `/api/v1/users/*` | P0 |
| Marketplace | `/api/v1/projects`, `/services`, `/freelancers` | P1 |
| Commerce | `/api/v1/orders`, `/escrow`, `/checkout` | P2 |
| Wallet | `/api/v1/wallet/*` | P2 |
| Messages | `/api/v1/conversations/*` | P3 |
| Notifications | `/api/v1/notifications/*` | P3 |
| Admin | `/api/v1/admin/*` | P4 |
| Search | `/api/v1/search` | P1 |
| Files | `/api/v1/files/*` | P2 |
| Webhooks | `/api/v1/webhooks/payme` | P2 |

---

## 4. Client ↔ server mode switch

```typescript
// src/lib/api-mode.ts
VITE_API_MODE=local   // current default — stores only
VITE_API_MODE=remote  // TanStack Query → API (future)
```

Migration per domain documented in BACKEND_IMPLEMENTATION_MASTER_PLAN Phases 1–8.

---

## 5. Third-party data flows

### Payme (target)
```
Client checkout → POST /checkout/preview
  → POST /checkout/confirm (idempotency key)
  → Redirect Payme widget
  → Webhook /webhooks/payme → verify signature
  → Update escrow + wallet ledger
```

### Email (target)
```
Registration → UserRegistered event → Resend verification template
Password reset → opaque token, 1h TTL, same response shape (anti-enumeration)
Order milestones → localized Uzbek templates
```

### File upload (target)
```
Client → POST /files/presign → R2 PUT → POST /files/confirm
Portfolio, KYC docs, message attachments
Max size: per FILE_STORAGE_ARCHITECTURE
```

---

## 6. Internal integration points

| From | To | Mechanism |
|------|-----|-----------|
| Frontend stores | Server API | fetch via Query (target) |
| Server API | Postgres | Drizzle ORM |
| Server API | Redis | ioredis pub/sub |
| Workers | Outbox | POLL outbox_events |
| Admin panel | Admin API | separate RBAC middleware |
| SSR | Session | cookie in beforeLoad (target) |

---

## 7. Environment variables

| Variable | Layer | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | server | Postgres connection |
| `SESSION_SECRET` | server | Token signing (future) |
| `VITE_API_MODE` | client | local/remote |
| `STRIPE_SECRET_KEY` | server | USD payments |
| `OAUTH_GOOGLE_*` | server | Google OAuth |
| `RESEND_API_KEY` | server | Email |
| `R2_*` | server | Object storage |
| `REDIS_URL` | server | Cache + pub/sub |

See `.env.example` in repo root.

---

## 8. Webhook & external callbacks

| Endpoint | Source | Verification |
|----------|--------|--------------|
| `/webhooks/payme` | Payme | HMAC signature |
| `/webhooks/stripe` | Stripe | stripe-signature header |
| OAuth callback | Google | state + PKCE cookie |

---

## 9. Deployment integrations

| Platform | Config | Notes |
|----------|--------|-------|
| Railway/Node | `nitro: preset node-server` | vite.config.ts |
| Neon | DATABASE_URL branch | staging + prod |
| Cloudflare | Future edge | TanStack Start compatible |
| Docker local | docker-compose.yml | postgres:16 |

See [DEPLOYMENT_ARCHITECTURE.md](../11-backend/DEPLOYMENT_ARCHITECTURE.md).
