# DEPENDENCY_MAP.md — Module & Store Dependencies

Derived from import analysis across `src/lib/*-store.ts` and route files.

---

## 1. Core dependency tiers

```
Tier 0 (no store deps)
  mock-data.ts, auth-constants.ts, sanitize.ts, rate-limit.ts, marketplace.ts

Tier 1 (identity)
  auth.ts ← user-status-store, active-role-store, profile-store, verified-users-store
  active-role-store ← auth.ts

Tier 2 (listings)
  projects-store, services-store, portfolio-store, agency-store
  ← mock-data merge pattern

Tier 3 (commerce chain)
  applications-store → orders-store → escrow-store → wallet-store → revenue-store
  applications-store → notifications-store, subscription-store

Tier 4 (trust & engagement)
  reviews-store → orders-store
  messages-store → response-metrics-store, orders-store (offers)
  notifications-store ← applications, orders, messages triggers

Tier 5 (computed / read-only)
  ranking-store, reputation-store, crm-store, ai-matching-store
  ← read from Tier 2–4 + mock-data

Tier 6 (admin overlay)
  admin-data-store → auth, projects-store, services-store, escrow-store
  admin-store → audit log only
```

---

## 2. Commerce dependency chain (critical path)

| Step | Module | Depends on | Triggers |
|------|--------|------------|----------|
| 1 | `applications-store` | projects-store, subscription-store, notifications | createApplication |
| 2 | `orders-store` | applications-store (accept), mock-data | createOrder |
| 3 | `escrow-store` | orders-store | createEscrowFromOrder |
| 4 | `wallet-store` | escrow-store, orders-store | holdEscrowFunds, releaseEscrowToFreelancer |
| 5 | `revenue-store` | orders-store, wallet-store | recordRevenueEntry (5% fee) |
| 6 | `reviews-store` | orders-store | submitReview (completed orders) |
| 7 | `analytics-events-store` | all above | recordAnalyticsEvent |

**Breaking any link breaks the north-star hire→pay→deliver flow.**

---

## 3. Auth dependency graph

```
session.functions (server)
  → credentials.ts → db/schema (optional)
  → session-service.ts → session-cookie.ts

useAuth (hook)
  → auth.ts (localStorage mirror)
  → session.functions

guards.ts → auth.ts, active-role-store
AuthGate → useAuth
auth-bootstrap.js → localStorage ishbor-session (legacy, to remove)

admin-data-store.suspendAdminUser
  → syncAccountStatusFromAdmin (auth.ts)
  → user-status-store
  → blockDemoAccountServer (stub)
```

---

## 4. Route → store matrix (top dependencies)

| Route | Primary stores | Secondary |
|-------|----------------|-----------|
| `/checkout` | orders, escrow, wallet, payment-methods | subscription, auth |
| `/messages` | messages-store | response-metrics, orders |
| `/wallet` | wallet, payment-methods | revenue |
| `/dashboard` | orders, projects, ftue, saved | analytics-events |
| `/dashboard/freelancer` | applications, orders | ai-opportunity |
| `/admin/*` | admin-data, admin-store | escrow-store (admin actions) |
| `/settings` | settings, security, verification, referral, alerts | profile |
| `/search` | marketplace.ts, services, projects | mock-data freelancers |

---

## 5. Server module dependencies

```
server/db/index.ts → postgres, drizzle-orm
server/db/schema.ts → drizzle pg-core
server/db/seed.ts → bcrypt, schema

server/lib/credentials.ts → bcrypt, db (optional)
server/lib/session-service.ts → session-cookie, db (optional)
server/lib/errors.ts → (standalone)

src/lib/api/session.functions.ts → server/lib/*
src/lib/api/health.functions.ts → server/db/index
src/lib/api/auth.functions.ts → server/db (optional)
```

**No server dependency yet:** orders, escrow, wallet, messages, marketplace entities.

---

## 6. Circular dependency risks

| Pair | Risk | Mitigation in code |
|------|------|-------------------|
| auth ↔ active-role | Login resets role cache | `invalidateActiveRoleCache` on login |
| orders ↔ escrow | Order fund triggers escrow | `fundOrderEscrow` calls escrow-store |
| admin ↔ marketplace | Admin suspend must logout user | `syncAccountStatusFromAdmin` |
| messages ↔ orders | Offer accept creates order | `updateOfferState` + order creation |

---

## 7. Target decoupling (production)

Per `BACKEND_IMPLEMENTATION_MASTER_PLAN.md`:

1. Replace store-to-store imports with **API client + TanStack Query**
2. Event bus (`EVENT_ARCHITECTURE.md`) replaces direct store notify chains
3. Admin writes go through **Admin API** not `admin-data-store` localStorage
4. Wallet becomes **single server ledger** — no client `wallet-store` mutations

See [DATA_FLOW_MAP.md](./DATA_FLOW_MAP.md) for migration path.
