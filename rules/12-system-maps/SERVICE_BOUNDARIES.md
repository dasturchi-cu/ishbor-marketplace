# SERVICE_BOUNDARIES.md

**Ishbor Marketplace — FastAPI bounded contexts**  
**Version:** 1.0 · **Status:** Architecture spec (implementation pending)  
**Canonical service map:** [../11-backend/fastapi/SERVICE_LAYER.md](../11-backend/fastapi/SERVICE_LAYER.md)  
**Stack:** FastAPI · PostgreSQL · Redis · MinIO — **Supabase ishlatilmaydi**

---

## 1. Purpose

Bu hujjat Ishbor backend **bounded context** chegaralarini belgilaydi: har bir FastAPI service nima egalik qiladi, nima bilan bog'lanadi, va qaysi **anti-pattern** lar taqiqlangan.

**Qoida:** Router va Celery task lar faqat **Application Service** chaqiradi — repository ga to'g'ridan-to'g'ri murojaat qilmaydi (UnitOfWork ichidan tashqari).

**Frontend mapping:** Har service hozirgi `*-store.ts` modulini almashtiradi (SERVICE_LAYER "Replaces" ustuni).

---

## 2. Architecture overview

```
┌─────────────────────────────────────────────────────────────┐
│  API Routers (FastAPI) / WebSocket / Webhooks              │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Application Services (33 bounded contexts)                   │
│  AuthService │ OrderService │ EscrowService │ ...             │
└───────┬─────────────────┬─────────────────┬───────────────────┘
        │                 │                 │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│ Repositories │  │ CacheService │  │ OutboxService │
│ (PostgreSQL) │  │   (Redis)    │  │  (events)     │
└──────────────┘  └──────────────┘  └───────────────┘
        │
┌───────▼──────┐  ┌──────────────┐
│ FileService  │  │ PaymentService│
│   (MinIO)    │  │  (gateways)   │
└──────────────┘  └──────────────┘
```

**Cross-cutting:** AuditService, CacheService, OutboxService — hech bir domain data egalik qilmaydi, faqat infratuzilma.

---

## 3. Identity & access boundary

### 3.1 AuthService

**Owns:** Session, login/register, OTP, password reset, OAuth callback, active role switch, 2FA

**Replaces:** `auth.ts`, `security-store`, `active-role-store`

**Routes:** `/login`, `/register`, `/verify-otp`, `/verify-email`, `/forgot-password`

**Storage:** Redis session (`ishbor-session` production cookie); PostgreSQL users credentials

**Must NOT own:** Profile fields, wallet balance, subscription plan

**Collaborates with:** UserService (post-register profile bootstrap), NotificationService (verify emails)

### 3.2 UserService

**Owns:** Profile, settings, security prefs, verification submit, onboarding state

**Replaces:** `profile-store`, `settings-store`, `verified-users-store`

**Routes:** `/profile`, `/settings`, `/onboarding/*`

**Must NOT own:** Auth tokens, order history, CRM pipelines

---

## 4. Marketplace catalog boundary

### 4.1 ProjectService

**Owns:** Client projects — CRUD, publish/pause/close, attachments

**Replaces:** `projects-store`, guest project draft

**Routes:** `/projects`, `/projects/create`, `/my-projects`, `/projects/$slug`

**Must NOT own:** Applications, orders, escrow

**Events emitted:** `ProjectPublished`, `ProjectClosed` → SearchService index, NotificationService

### 4.2 ServiceCatalogService

**Owns:** Freelancer service packages, featured purchase on services

**Replaces:** `services-store`, `featured-listings-store` (service side)

**Routes:** `/services`, `/services/create`, `/my-services`, `/services/$slug`

**Must NOT own:** Order checkout logic (delegates OrderService)

**Featured:** `purchase_featured` — CreditsService bilan spend, ranking invalidate

### 4.3 PortfolioService

**Owns:** Portfolio items, publish state, featured flag on portfolio

**Replaces:** `portfolio-store`, `portfolio-analytics-store`

**Routes:** `/portfolio`, `/portfolio/create`, `/portfolio/edit/$slug`, `/portfolio/$slug`

### 4.4 SearchService

**Owns:** Full-text/suggest index, document CRUD in search index

**Replaces:** `marketplace.ts`, `agency-marketplace.ts`

**Must NOT own:** Source entity data — faqat index nusxasi

**Cache:** Redis — hot queries, suggest autocomplete

### 4.5 RankingService / RecommendationService

**Owns:** Computed scores, refresh jobs, AI matching output

**Replaces:** `ranking-store`, `agency-ranking-store`, `ai-matching-store`, `recommendations.ts`

**Must NOT own:** Raw reviews/orders — o'qiydi, yozmaydi (read-only cross-context)

---

## 5. Hiring & proposals boundary

### 5.1 ApplicationService

**Owns:** Proposals — submit, withdraw, accept, reject, shortlist

**Replaces:** `applications-store`

**Routes:** `/applications`, `/applications/$id`, project detail apply

**Collaborates with:**

- SubscriptionService.check_proposal_limit (free tier 10/oy)
- OrderService (accept → checkout preview)
- NotificationService (client/freelancer alerts)

**Must NOT own:** Project content edits, payment

---

## 6. Commerce boundary (critical)

### 6.1 OrderService

**Owns:** Orders, checkout preview/confirm, delivery confirm, revision, cancel, status machine

**Replaces:** `orders-store`

**Routes:** `/checkout`, `/orders`, `/orders/$id`

**Invariants:** CheckoutType (service | hire | order); participant-only access

**Money:** checkout_confirm → EscrowService fund + 5% platform fee via RevenueService

**Must NOT own:** Escrow milestone release, wallet withdraw

### 6.2 EscrowService

**Owns:** Escrow accounts, fund, milestone release, freeze, admin release/refund

**Replaces:** `escrow-store`

**Routes:** `/escrow`, `/escrow/$id`

**Collaborates with:** WalletService (credit freelancer), DisputeService, PaymentService

**Idempotency:** fund, release_milestone, admin_release, admin_refund — majburiy key

**Must NOT own:** Order scope/deliverable content

### 6.3 WalletService

**Owns:** User wallet balance, transactions, deposit, withdraw, payment methods

**Replaces:** `wallet-store`, `payment-methods-store`

**Routes:** `/wallet`, `/settings?tab=payment`

**Must NOT own:** Escrow state, credits promo wallet (CreditsService)

### 6.4 PaymentService

**Owns:** Gateway initiate, webhooks (Payme, Click, Stripe), card tokenization

**Replaces:** frontend payment mocks

**Must NOT own:** Business order status — webhook → OrderService/EscrowService

**External:** Uzcard, Humo, Payme, Click adapters

### 6.5 DisputeService

**Owns:** Dispute lifecycle, admin resolution

**Routes:** `/admin/disputes`

**Collaborates with:** EscrowService (freeze/refund/release), AuditService

---

## 7. Monetization boundary

### 7.1 SubscriptionService

**Owns:** Plans (free/pro/elite), upgrade/cancel, usage counters (proposals/month)

**Replaces:** `subscription-store`

**Routes:** `/subscription`, `/pricing` (read plans)

**Plans:** Bepul 0, Pro 99 000, Elite 249 000 UZS/oy

**Must NOT own:** Credits balance, order fees

### 7.2 CreditsService

**Owns:** Promo credits wallet, purchase, referral apply/reward

**Replaces:** `credits-store`, `referral-store`

**Routes:** `/promotions`, `/settings` referral tab

**Referral:** 50 000 UZS per completed referral

**Must NOT own:** Escrow money, subscription billing

### 7.3 RevenueService

**Owns:** Platform revenue ledger — fee, featured, subscription, credit purchase entries

**Replaces:** `revenue-store`, `monetization-store`

**Routes:** `/revenue` (admin)

**Must NOT own:** User wallet — faqat platform accounting

---

## 8. Trust & social boundary

### 8.1 ReviewService

**Owns:** Post-order reviews, aggregates

**Replaces:** `reviews-store`

**Invariant:** Faqat completed order → review

### 8.2 UserService (verification slice)

Verification submit → AdminService approve — trust queue

**Routes:** `/admin/verifications`, settings verification tab

---

## 9. Communication boundary

### 9.1 MessagingService

**Owns:** Conversations, messages, offers, accept offer

**Replaces:** `messages-store`, `call-store`

**Routes:** `/messages`

**Realtime:** WebSocket events — [WEBSOCKET_SPECIFICATION.md](../11-backend/WEBSOCKET_SPECIFICATION.md)

**Must NOT own:** Order creation — accept_offer → OrderService

### 9.2 NotificationService

**Owns:** In-app notifications, preferences, unread count, event dispatch

**Replaces:** `notifications-store`

**Routes:** `/notifications`

**Trigger:** Domain events via OutboxService → dispatch_from_event

---

## 10. Persona-specific boundaries

### 10.1 ClientService

**Owns:** Public client company page, CRM freelancers/leads

**Replaces:** client CRM slice of `crm-store`

**Routes:** `/clients/$company`, `/clients/manage`

### 10.2 FreelancerService

**Owns:** Public freelancer profile, stats, CRM clients, availability

**Replaces:** freelancer CRM slice, `response-metrics-store`, `reputation-store`

**Routes:** `/freelancers`, `/freelancers/$username`, `/freelancers/manage`

### 10.3 AgencyService

**Owns:** Agency CRUD, members, roles, case studies, agency CRM clients

**Replaces:** `agency-store`, `agency-portfolio-store`, `agency-metrics-store`

**Routes:** `/agencies/*`, `/dashboard/agency`, `/agency/clients`

**Roles:** owner, manager, recruiter, freelancer — AgencyGate permissions

---

## 11. Platform operations boundary

### 11.1 AdminService

**Owns:** Admin dashboard, user suspend/verify, content lists, founder metrics, revenue summary read

**Replaces:** `admin-data-store`, `admin-store`

**Routes:** `/admin/*`, `/revenue` read paths

**Must NOT bypass:** Service boundaries — admin ham OrderService/EscrowService orqali mutatsiya

### 11.2 ModerationService / SupportService

**Owns:** Content moderation queue, support tickets

**Routes:** `/admin/moderation`, `/admin/support`

### 11.3 AuditService

**Owns:** Immutable audit log

**Routes:** `/admin/audit`

**Rule:** Har admin mutatsiya AuditService.log_admin_action

### 11.4 AIService

**Owns:** AI tool completions, usage logging

**Replaces:** `ai-*` modules

**Routes:** `/ai/*`

**Must NOT own:** User profile data writes — faqat read + suggest

---

## 12. Infrastructure boundary

### 12.1 FileService

**Owns:** Presigned upload, confirm, download URL

**Storage:** MinIO buckets — [FILE_STORAGE_ARCHITECTURE.md](../11-backend/FILE_STORAGE_ARCHITECTURE.md)

**Replaces:** `mock-upload.ts`

### 12.2 AnalyticsService

**Owns:** Client/freelancer dashboards, event ingest

**Replaces:** `analytics-events-store`, `conversion-store`

**Routes:** `/analytics/client`, `/analytics/freelancer`

---

## 13. Anti-patterns (taqiqlangan)

| # | Anti-pattern | To'g'ri yondashuv |
|---|--------------|-------------------|
| 1 | Router → Repository to'g'ridan | Router → Service → Repository |
| 2 | OrderService escrow release | EscrowService.release_milestone |
| 3 | CreditsService escrow fund | PaymentService → EscrowService |
| 4 | AuthService profile update | UserService.update_profile |
| 5 | SearchService project CRUD | ProjectService + SearchService.index |
| 6 | AdminService direct SQL mutatsiya | Target domain Service |
| 7 | Float money hisob | Decimal Money value object |
| 8 | Idempotency keysiz pul operatsiyasi | idempotency_key majburiy |
| 9 | Bir service boshqa context jadvalini yozish | Event + target service |
| 10 | Supabase/BaaS coupling | PostgreSQL + Redis + MinIO stack |
| 11 | Frontend store logic backend da takrorlash | Domain layer state machines |
| 12 | Cross-context JOIN in router | Service orchestration + DTO compose |

---

## 14. Context interaction map (commerce happy path)

```
Client → OrderService.checkout_confirm
           → PaymentService.initiate (if gateway)
           → EscrowService.fund
           → RevenueService.record_entry (5% fee)
           → WalletService (pending freelancer credit on release)
           → NotificationService.create_in_app
           → OutboxService.publish(OrderFunded)
           → SearchService (no op)
           → AnalyticsService.record_domain_event

Freelancer delivers → OrderService.confirm_delivery (client)
           → EscrowService.release_milestone
           → WalletService.deposit (freelancer)
           → ReviewService.create_for_order (optional)
           → Referral CreditsService.completeReferral (if first action)
```

---

## 15. Frontend store → service map (summary)

| Store | Service |
|-------|---------|
| auth, active-role | AuthService |
| profile, settings | UserService |
| projects-store | ProjectService |
| services-store | ServiceCatalogService |
| applications-store | ApplicationService |
| orders-store | OrderService |
| escrow-store | EscrowService |
| wallet-store | WalletService |
| subscription-store | SubscriptionService |
| credits-store, referral-store | CreditsService |
| revenue-store | RevenueService |
| messages-store | MessagingService |
| notifications-store | NotificationService |
| agency-store | AgencyService |
| crm-store | ClientService + FreelancerService + AgencyService |
| admin-* | AdminService, ModerationService, DisputeService |

To'liq ro'yxat: [SERVICE_LAYER.md](../11-backend/fastapi/SERVICE_LAYER.md)

---

## 16. Related documents

| Hujjat | Mavzu |
|--------|-------|
| [DOMAIN_MODEL.md](./DOMAIN_MODEL.md) | Aggregates va invariantlar |
| [INTEGRATION_MAP.md](./INTEGRATION_MAP.md) | Tashqi tizimlar |
| [EVENT_FLOW_MAP.md](./EVENT_FLOW_MAP.md) | Domain events |
| [DATA_FLOW_MAP.md](./DATA_FLOW_MAP.md) | Persistence paths |
| [REPOSITORY_LAYER.md](../11-backend/fastapi/REPOSITORY_LAYER.md) | Data access |
| [DOMAIN_LAYER.md](../11-backend/fastapi/DOMAIN_LAYER.md) | State machines |

---

*Yangi service qo'shilganda SERVICE_LAYER.md va bu hujjat bir vaqtda yangilanadi.*
