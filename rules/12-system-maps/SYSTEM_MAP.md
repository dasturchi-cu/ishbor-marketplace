# SYSTEM_MAP.md — Ishbor Platform Topology

**Generated:** 2026-06-20 from codebase scan  
**Stack:** TanStack Start (React 19) + Vite 8 + Nitro (node-server) + Tailwind 4 + Radix UI

---

## 1. Layer architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  PRESENTATION (110 routes, 200+ components)                      │
│  src/routes/*  src/components/{site,auth,admin,settings,agency} │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  APPLICATION STATE (48 *-store.ts, localStorage primary)         │
│  src/lib/*-store.ts  + mock-data.ts seed merge                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  SERVER FUNCTIONS (TanStack createServerFn)                      │
│  session.functions │ health.functions │ auth.functions           │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  SERVER LIB (Phase 0–1 implemented)                              │
│  server/db (Drizzle) │ session-service │ credentials           │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  TARGET PRODUCTION (rules/11-backend/ — SPEC, not fully built)   │
│  PostgreSQL 16 │ Redis │ R2 │ Payme │ WebSocket │ Workers        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Personas & workspace roles

| Persona | `userType` | `activeRole` | Primary dashboard | Route count (approx) |
|---------|------------|--------------|-------------------|---------------------|
| Guest | — | — | `/` | 25 public |
| Client | `client` | `client` | `/dashboard` | 18 client-only |
| Freelancer | `freelancer` | `freelancer` | `/dashboard/freelancer` | 22 freelancer-only |
| Agency member | either | `agency` | `/dashboard/agency` | 6 agency |
| Admin | any + `isAdmin` | any | `/admin` | 22 admin |

**Role switcher:** `active-role-store.ts` — key `ishbor-active-role-{userId}`  
**Guards:** `guards.ts` (beforeLoad) + `AuthGate` + `public/auth-bootstrap.js`

---

## 3. Domain modules (logical)

| Domain | Routes | Stores | Server status |
|--------|--------|--------|---------------|
| Auth & identity | 12 | auth, active-role, profile, settings, security, registration, user-status, locale, ftue | **SERVER** (sessions, users schema) |
| Marketplace discovery | 15 | projects, services, portfolio, agency, saved, ranking, reputation, featured | SPEC |
| Hiring & proposals | 8 | applications, projects | SPEC |
| Commerce | 10 | orders, escrow, wallet, payment-methods, checkout | SPEC |
| Communication | 4 | messages, notifications, call, response-metrics | SPEC (WS) |
| Trust & reviews | — | reviews, verified-users, verification-settings | SPEC |
| Monetization | 6 | subscription, credits, revenue, monetization, referral, featured-listings | SPEC |
| Analytics & AI | 12 | analytics-events, conversion, ai-*, portfolio-analytics, visibility | LIVE (client compute) |
| Admin OS | 22 | admin-data, admin | PARTIAL (localStorage sync) |
| Search | 1 | marketplace.ts filters | LIVE |
| Legal & support | 4 | — | LIVE |

---

## 4. Route tree summary (110 files)

| Segment | Count | Examples |
|---------|-------|----------|
| Public marketplace | 28 | `/`, `/services`, `/freelancers`, `/projects`, `/search` |
| Auth & onboarding | 18 | `/login`, `/register`, `/onboarding/*`, `/welcome` |
| Client workspace | 14 | `/dashboard`, `/my-projects`, `/checkout`, `/clients/manage` |
| Freelancer workspace | 16 | `/dashboard/freelancer`, `/applications`, `/promotions` |
| Agency | 5 | `/agencies`, `/dashboard/agency`, `/agency/clients` |
| Shared workspace | 12 | `/orders`, `/escrow`, `/wallet`, `/messages`, `/settings` |
| Analytics & AI | 10 | `/analytics/*`, `/ai/*` |
| Admin | 22 | `/admin/*` |
| Utility | 4 | `/help`, `/status`, `/terms`, `/privacy` |

Full registry: [ROUTE_REGISTRY.md](../02-integration/ROUTE_REGISTRY.md)

---

## 5. Persistence model (current vs target)

| Layer | Current | Target (`11-backend`) |
|-------|---------|----------------------|
| Session | HttpOnly `ishbor_sid` + localStorage mirror | DB `sessions` only |
| Users | Demo + dev registry + optional Postgres | `users`, `user_profiles` |
| Marketplace entities | localStorage + mock-data merge | Postgres + FTS search |
| Wallet/escrow | Client ledger (`ishbor-wallet`) | Server authoritative ledger |
| Messages | Per-user localStorage | Postgres + WebSocket |
| Admin | `ishbor-admin-data` snapshot | Admin API + audit trail DB |

---

## 6. North-star transaction flow

```
Guest browse → Register/Login → Role onboarding
  → Client: publish project OR hire from service/profile
  → Freelancer: apply OR receive direct hire
  → acceptApplication → createOrder → createEscrowFromOrder
  → fundEscrow (wallet hold) → work → markOrderInReview
  → approveOrderDelivery → releaseEscrowMilestone → wallet payout
  → submitReview
```

Stores involved: `applications-store` → `orders-store` → `escrow-store` → `wallet-store` → `reviews-store` → `revenue-store`

---

## 7. Demo accounts (code-defined)

| Email | Role | Password | ID |
|-------|------|----------|-----|
| sardor@asaka.uz | Client | demo1234 | u-client-1 |
| nargiza@ishbor.uz | Freelancer | demo1234 | u-freelancer-1 |
| admin@ishbor.uz | Admin | demo1234 | u-admin-1 |

Server mirror: `server/lib/credentials.ts` → `SERVER_DEMO_USERS`  
OTP (registration): `123456` (demo only)

---

## 8. Production scale assumptions (documentation target)

| Metric | Design target | Current capacity |
|--------|---------------|------------------|
| Users | 100,000+ | Demo/localStorage |
| Projects | 10,000+ active | ~6 seed + user-created local |
| Concurrent WS | 5,000 connections | Not implemented |
| Transactions/day | 1,000+ escrow events | Client-only ledger |
| Search QPS | 100+ | Client filter (must move to FTS) |

See [SCALABILITY_ARCHITECTURE.md](../11-backend/SCALABILITY_ARCHITECTURE.md) for target architecture.
