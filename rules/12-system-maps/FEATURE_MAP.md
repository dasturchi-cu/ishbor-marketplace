# FEATURE_MAP.md — Complete Feature Registry (Code-Derived)

**Cross-reference:** [PRODUCT_REQUIREMENTS.md](../01-product/PRODUCT_REQUIREMENTS.md) · [ROUTE_REGISTRY.md](../02-integration/ROUTE_REGISTRY.md)

Status: **LIVE** = works in demo · **PARTIAL** = UI without server · **SERVER** = backend code exists · **SPEC** = docs only

---

## Auth & identity

| Feature | Route / entry | Store / API | Status | Backend gap |
|---------|---------------|-------------|--------|-------------|
| Email login | `/login` | `loginSession`, `session.functions` | SERVER | Rate limit server-side |
| Demo quick login | `/login` buttons | `SERVER_DEMO_USERS` | SERVER | — |
| Registration | `/register` → verify | `registration-store`, `completeRegistrationSession` | SERVER | Email send (Resend) |
| OTP verify | `/verify-otp` | OTP `123456` hardcoded | PARTIAL | SMS provider |
| Email verify | `/verify-email` | — | PARTIAL | Magic link API |
| Forgot/reset password | `/forgot-password`, `/reset-password` | — | PARTIAL | Reset token DB |
| HttpOnly session | all auth | `ishbor_sid` cookie | SERVER | Remove localStorage mirror |
| Role switcher | nav, settings | `active-role-store` | LIVE | Active role API |
| Onboarding wizard | `/onboarding/*` | `auth-constants`, `profile-store` | LIVE | Profile API |
| Welcome / FTUE | `/welcome` | `ftue-store` | LIVE | — |
| Account suspend/ban | admin | `user-status-store`, `syncAccountStatusFromAdmin` | LIVE | Server enforcement only |
| Locale preference | footer | `locale-store` | LIVE | i18n copy not translated |
| 2FA | settings security tab | `security-store` | PARTIAL | TOTP server |
| KYC self-service | settings verification | `verification-settings-store` | LIVE | File upload API |

---

## Marketplace discovery

| Feature | Route | Store | Status |
|---------|-------|-------|--------|
| Landing + hero search | `/` | `marketplace.ts`, mock-data | LIVE |
| Unified search | `/search` | filterServices/Freelancers/Projects | LIVE |
| Services catalog | `/services`, `/services/category/$slug` | `services-store` | LIVE |
| Service detail + hire | `/services/$slug` | `services-store`, `saved-store` | LIVE |
| Projects catalog | `/projects` | `projects-store` | LIVE |
| Project detail + apply | `/projects/$slug` | `projects-store`, `applications-store` | LIVE |
| Project preview (guest) | `/projects/preview` | — | LIVE |
| Freelancers catalog | `/freelancers` | mock-data, `ranking-store` | LIVE |
| Freelancer profile | `/freelancers/$username` | reviews, portfolio, reputation | LIVE |
| Agencies catalog | `/agencies` | `agency-store`, `agency-ranking-store` | LIVE |
| Agency profile | `/agencies/$slug` | `agency-store`, `agency-portfolio-store` | LIVE |
| Client company page | `/clients/$company` | mock-data | LIVE |
| Public portfolio | `/portfolio/$slug` | `portfolio-store`, `portfolio-analytics-store` | LIVE |
| Save/bookmark | SaveButton | `saved-store` | LIVE |
| Pricing page | `/pricing` | `subscription-store` PLANS | LIVE |
| Help center | `/help` | — | LIVE |
| System status | `/status` | `health.functions` | SERVER |

---

## Client workspace

| Feature | Route | Store | Status |
|---------|-------|-------|--------|
| Client dashboard | `/dashboard` | orders, projects, ftue, saved | LIVE |
| My projects CRUD | `/my-projects` | `projects-store` | LIVE |
| Create project | `/projects/create` | `projects-store` | LIVE |
| Client CRM | `/clients/manage` | `crm-store`, `saved-store` | LIVE |
| Client analytics | `/analytics/client` | `analytics-events-store` | LIVE |
| Checkout | `/checkout` | `client-checkout`, orders, escrow, wallet | LIVE |
| Direct hire | profile/service pages | `createDirectHireApplication` | LIVE |

---

## Freelancer workspace

| Feature | Route | Store | Status |
|---------|-------|-------|--------|
| Freelancer dashboard | `/dashboard/freelancer` | applications, orders | LIVE |
| My services CRUD | `/my-services` | `services-store` | LIVE |
| Create service | `/services/create` | `services-store` | LIVE |
| Applications inbox | `/applications`, `/applications/$id` | `applications-store` | LIVE |
| Portfolio hub | `/portfolio` | `portfolio-store` | LIVE |
| Create/edit portfolio | `/portfolio/create`, `/portfolio/edit/$slug` | `portfolio-store` | LIVE |
| Freelancer CRM | `/freelancers/manage` | `crm-store` | LIVE |
| Freelancer analytics | `/analytics/freelancer` | analytics, revenue | LIVE |
| Promotions / featured | `/promotions` | `featured-store`, `credits-store` | LIVE |

---

## Agency

| Feature | Route | Store | Status |
|---------|-------|-------|--------|
| Create agency | `/agencies/create` | `agency-store` | LIVE |
| Agency dashboard | `/dashboard/agency` | `agency-metrics-store` | LIVE |
| Agency CRM | `/agency/clients` | `agency-metrics-store` | LIVE |
| Member invites | agency settings | `inviteMember`, `acceptInvite` | LIVE |
| Case studies | agency profile | `agency-portfolio-store` | LIVE |

---

## Commerce (orders · escrow · wallet)

| Feature | Route | Store | Key functions | Status |
|---------|-------|-------|---------------|--------|
| Orders list/detail | `/orders`, `/orders/$id` | `orders-store` | createOrder, updateOrderStatus | LIVE (client ledger) |
| Escrow list/detail | `/escrow`, `/escrow/$id` | `escrow-store` | fundEscrow, releaseEscrowMilestone | LIVE |
| Dispute open | escrow detail | `openEscrowDispute` | — | LIVE |
| Wallet | `/wallet` | `wallet-store`, `payment-methods-store` | depositFunds, withdrawFunds | LIVE |
| Payment methods | wallet/settings | `payment-methods-store` | addPaymentMethod | LIVE |
| Platform fee | checkout | `PLATFORM_FEE` = 5% in revenue-store | — | LIVE |
| Subscription plans | `/subscription` | `subscription-store` | upgradePlan, canSubmitProposal | LIVE |
| Credits | promotions | `credits-store` | purchaseCredits, spendCredits | LIVE |
| Referrals | settings tab | `referral-store` | applyReferralCode | LIVE |

---

## Communication

| Feature | Route | Store | Status |
|---------|-------|-------|--------|
| Messages inbox | `/messages` | `messages-store` | LIVE (no WS) |
| Send text/file | messages UI | sendMessage, attachFile | LIVE |
| Send offer | messages | sendOffer, updateOfferState | LIVE |
| Typing indicator | messages | setTyping, isTyping | LIVE (client tick) |
| Online presence | messages | setOnlineStatus, getLastSeen | LIVE (local) |
| Call history | messages | `call-store` | PARTIAL |
| Notifications feed | `/notifications` | `notifications-store` | LIVE |
| Job alerts | settings | `alerts-store` | LIVE |

---

## AI tools

| Feature | Route | Module | Status |
|---------|-------|--------|--------|
| AI hub | `/ai` | `ai-hub-config` | LIVE (client LLM stubs) |
| AI onboarding | `/ai/onboarding` | `ai-onboarding` | LIVE |
| Proposal assistant | `/ai/proposal-assistant` | `ai-proposal-assistant` | LIVE |
| Project generator | `/ai/project-generator` | `ai-project-generator` | LIVE |
| Portfolio optimizer | `/ai/portfolio-optimizer` | `ai-portfolio-optimizer` | LIVE |
| Trust coach | `/ai/trust-coach` | `ai-trust-coach` | LIVE |
| Smart matching | dashboards | `ai-matching-store` | LIVE (computed) |
| Founder AI insights | `/admin/ai` | `ai-insights-store` | LIVE |

---

## Admin OS (22 routes)

| Feature | Route | Store | Sync to marketplace |
|---------|-------|-------|---------------------|
| Dashboard | `/admin` | admin-data | — |
| Users CRUD | `/admin/users`, `$id` | admin-data | syncAccountStatusFromAdmin |
| Verifications | `/admin/verifications` | admin-data | setUserVerified |
| Projects mod | `/admin/projects` | admin-data | updateProjectStatus |
| Services mod | `/admin/services` | admin-data | updateServiceStatus |
| Orders | `/admin/orders` | admin-data | — |
| Escrow ops | `/admin/escrow`, `$id` | admin-data | adminReleaseEscrow, adminRefundEscrow |
| Disputes | `/admin/disputes` | admin-data | — |
| Payments | `/admin/payments` | admin-data | — |
| Applications | `/admin/applications` | admin-data | — |
| Moderation | `/admin/moderation` | admin-data | — |
| Support tickets | `/admin/support` | admin-data | — |
| Analytics | `/admin/analytics` | admin-data | — |
| Audit log | `/admin/audit` | admin-store | addAuditEntry |
| Founder KPIs | `/admin/founder` | monetization, ai-insights | — |
| System health | `/admin/system` | health.functions | PARTIAL |

---

## Cross-cutting

| Feature | Location | Status |
|---------|----------|--------|
| Reviews post-order | ReviewForm, orders detail | LIVE |
| Reputation tiers | profiles | `reputation-store` LIVE |
| Ranking scores | marketplace sorts | `ranking-store` LIVE |
| Conversion tracking | funnels | `conversion-store` LIVE |
| Stress seed QA | `stress-seed.ts` | LIVE (dev) |
| EscrowShield UI | payment surfaces | LIVE |

**Total features mapped:** 95+  
**Server-implemented:** auth sessions, health, registration (Phase 0–1)  
**Requires backend Phases 2–8:** all commerce, messaging WS, payments, admin API
