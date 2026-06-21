# BACKEND_ARCHITECTURE.md

**Project:** Ishbor Marketplace  
**Version:** 1.0 (architecture phase)  
**Replaces:** Client-side localStorage stores + `mock-data.ts` seed merge pattern

---

## 1. Purpose

Design a production backend that powers every feature currently simulated in the frontend:

- 95+ routes ([ROUTE_REGISTRY.md](../02-integration/ROUTE_REGISTRY.md))
- 46 client stores (`src/lib/*-store.ts`)
- 4 personas: Guest, Client, Freelancer, Agency, Admin
- 3 transaction types: project hire, direct service, direct hire ([PROJECT_BIBLE.md](../00-constitution/PROJECT_BIBLE.md))

**North star:** Server-authoritative money, auth, and permissions. Frontend becomes a thin client over REST + WebSocket.

---

## 2. High-level architecture

**Stack:** FastAPI · PostgreSQL 16 · Redis 7 · MinIO · Celery · Nginx · VPS (Uzbekistan)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Clients                                   │
│  TanStack Start SPA/SSR  │  Admin Panel  │  Future Mobile       │
└────────────┬────────────────────────────┬───────────────────────┘
             │ HTTPS (Nginx)              │ WSS
             ▼                             ▼
┌────────────────────────────┐   ┌─────────────────────────────┐
│     Nginx reverse proxy     │   │   Nginx WS upgrade           │
│  SSL · rate limit · CSP     │   │   → FastAPI WebSocket        │
└────────────┬───────────────┘   └──────────────┬──────────────┘
             │                                   │
             ▼                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│              FastAPI Application (uvicorn × 2+)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Auth     │ │ Marketplace│ │ Commerce │ │ Admin    │           │
│  │ Router   │ │ Router     │ │ Router   │ │ Router   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Messaging│ │ Notify   │ │ Analytics│ │ AI Proxy │           │
│  │ + WS     │ │ Router   │ │ Router   │ │ Router   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
    ┌────────┴────────┐            ┌─────────┴─────────┐
    ▼                 ▼            ▼                   ▼
┌─────────┐    ┌──────────┐  ┌─────────┐      ┌──────────────┐
│PostgreSQL│    │  Redis   │  │ Celery  │      │ MinIO        │
│ VPS 16  │    │ cache+   │  │ Workers │      │ Object Store │
│ PgBouncer│    │ broker   │  │         │      │              │
└─────────┘    └──────────┘  └─────────┘      └──────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              Email (Resend)   SMS (Eskiz)   Humo/Uzcard/Payme
```

**Detailed docs:** [fastapi/FASTAPI_ARCHITECTURE.md](./fastapi/FASTAPI_ARCHITECTURE.md), [infrastructure/INFRASTRUCTURE_ARCHITECTURE.md](./infrastructure/INFRASTRUCTURE_ARCHITECTURE.md)

---

## 3. Module map (backend services)

Each module is a bounded context with its own service class, repository layer, and event publishers.

| Module | Frontend stores replaced | Core responsibility |
|--------|-------------------------|---------------------|
| **AuthService** | `auth.ts`, `security-store`, `active-role-store` | Registration, login, OAuth, sessions, 2FA, password reset |
| **UserService** | `profile-store`, `settings-store`, `verified-users-store` | Profiles, onboarding, settings, verification state |
| **ClientService** | `profile-store` (client fields), CRM views | Company profiles, hiring CRM |
| **FreelancerService** | `profile-store`, `response-metrics-store`, `reputation-store` | Public profiles, stats, availability |
| **AgencyService** | `agency-store`, `agency-portfolio-store`, `agency-metrics-store` | Agencies, members, invites, case studies |
| **ProjectService** | `projects-store`, `guest-project-draft` | Project CRUD, publish/pause/close, attachments |
| **ServiceCatalogService** | `services-store`, `featured-listings-store` | Gig packages, gallery, featured |
| **ApplicationService** | `applications-store` | Proposals, limits via subscription |
| **OrderService** | `orders-store` | Order lifecycle, milestones |
| **EscrowService** | `escrow-store` | Fund, release, dispute, refund |
| **WalletService** | `wallet-store`, `payment-methods-store` | Balances, deposits, withdrawals (server ledger) |
| **PaymentService** | `payment-methods-store`, gateway adapters | Card tokenization, gateway webhooks |
| **SubscriptionService** | `subscription-store`, usage keys | Plans, proposal/service limits |
| **CreditsService** | `credits-store`, `referral-store` | Promotional credits, referral rewards |
| **ReviewService** | `reviews-store` | Post-order reviews |
| **PortfolioService** | `portfolio-store`, `portfolio-analytics-store` | Portfolio CRUD, moderation status |
| **SavedService** | `saved-store` | Bookmarks |
| **MessagingService** | `messages-store`, `call-store` | Conversations, offers, files |
| **NotificationService** | `notifications-store`, `notification-events.ts` | In-app + outbound delivery |
| **SearchService** | `marketplace.ts`, `agency-marketplace.ts` | Full-text search, filters, ranking |
| **AnalyticsService** | `analytics-events-store`, `conversion-store` | Event ingestion, aggregations |
| **RankingService** | `ranking-store`, `agency-ranking-store` | Computed scores (materialized/cron) |
| **RecommendationService** | `recommendations.ts`, `ai-matching-store` | Personalization engine |
| **AdminService** | `admin-data-store`, `admin-store` | Moderation, user ops, audit |
| **DisputeService** | admin disputes | Conflict resolution |
| **SupportService** | admin support tickets | Ticket workflow |
| **ModerationService** | admin moderation queue | Content reports |
| **RevenueService** | `revenue-store`, `monetization-store` | Platform revenue ledger |
| **AIService** | `ai-*` modules | LLM proxy, usage logging, rate limits |
| **FileService** | `mock-upload.ts` | Presigned uploads, metadata |
| **AuditService** | `admin-store` audit log | Immutable audit trail |

---

## 4. API surface

| Surface | Protocol | Auth | Consumers |
|---------|----------|------|-----------|
| Public API | REST `/api/v1/public/*` | None | Landing, marketplace browse |
| User API | REST `/api/v1/*` | Session cookie / Bearer | Workspace routes |
| Admin API | REST `/api/v1/admin/*` | Session + admin RBAC | Admin panel |
| WebSocket | WS `/ws/v1` | Session cookie on handshake | Messages, notifications, presence |
| Webhooks | POST `/webhooks/*` | HMAC signature | Payment gateways |

Full endpoint list: [API_SPECIFICATION.md](./API_SPECIFICATION.md)

---

## 5. Data authority rules

| Domain | Server authoritative | Client may cache |
|--------|---------------------|------------------|
| Auth session | ✅ | Session snapshot only |
| Wallet balance | ✅ | Display cache, invalidate on WS event |
| Escrow state | ✅ | Optimistic UI forbidden for release |
| Orders | ✅ | List cache with ETag |
| Messages | ✅ | Local draft text only |
| Notifications | ✅ | Unread count via WS |
| Marketplace listings | ✅ | CDN + stale-while-revalidate |
| Active role preference | ✅ (stored server-side) | Mirror in cookie for SSR |
| UI theme/appearance | User preference | ✅ local until synced |

---

## 6. Request lifecycle

```
1. CDN / WAF → rate limit by IP
2. Nitro middleware → parse session cookie → attach AuthContext
3. Route handler → RBAC guard → validate DTO (Zod)
4. Service layer → transaction (if money/state) → emit domain event
5. Outbox worker → fan-out notifications, analytics, search index
6. Response → JSON + Set-Cookie (if session rotated) + ETag
```

---

## 7. Transaction boundaries (ACID required)

These operations MUST run in a single PostgreSQL transaction:

| Operation | Tables touched |
|-----------|----------------|
| Checkout fund escrow | `orders`, `escrow_workflows`, `wallet_transactions`, `wallets` |
| Milestone release | `escrow_milestones`, `wallet_transactions`, `orders` |
| Proposal accept → order | `applications`, `orders`, `escrow_workflows` |
| Subscription purchase | `subscriptions`, `payment_records`, `wallet_transactions` |
| Referral credit grant | `referrals`, `credit_transactions`, `credits_wallets` |
| Admin dispute resolve | `disputes`, `escrow_workflows`, `wallet_transactions` |

---

## 8. Integration with existing frontend

### Phase A — Parallel run
- Feature flag `VITE_API_MODE=local|remote`
- Remote mode: TanStack Query hooks call `/api/v1/*` instead of stores
- Stores become adapters delegating to API

### Phase B — Cutover per domain
1. Auth + sessions (unblocks SSR)
2. Marketplace read (projects, services, freelancers)
3. Orders + escrow + wallet
4. Messages + notifications (WebSocket)
5. Admin panel
6. AI proxy

### Phase C — Remove localStorage persistence
- Delete `ishbor-*` write paths
- Keep `ishbor-theme` and ephemeral UI state only

---

## 9. Error model

```typescript
type ApiError = {
  code: string;           // e.g. "ESCROW_INSUFFICIENT_BALANCE"
  message: string;        // Uzbek user-facing
  field?: string;         // validation field
  status: number;         // HTTP status
  requestId: string;
};
```

Standard codes mapped from frontend toast messages in `action-feedback.ts`.

---

## 10. Environment configuration

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection |
| `REDIS_URL` | Sessions, pub/sub, queues |
| `SESSION_SECRET` | Cookie signing |
| `OAUTH_GOOGLE_*` | Google OAuth |
| `S3_*` | Object storage |
| `PAYME_*` / `CLICK_*` | Payment gateways |
| `RESEND_API_KEY` | Transactional email |
| `OPENAI_API_KEY` | AI tools proxy |
| `SENTRY_DSN` | Error tracking |

See [INFRASTRUCTURE_ARCHITECTURE.md](./INFRASTRUCTURE_ARCHITECTURE.md).

---

## 11. Non-goals (phase 1 backend)

- Native mobile apps
- Multi-region active-active
- Crypto payments
- Hourly time tracking
- Video transcoding pipeline (store URLs only; transcode phase 2)

---

*Maps to: PROJECT_BIBLE §13, SECURITY_GUIDELINES, FUTURE_ROADMAP P0.*
