# PRODUCT_REQUIREMENTS.md

Feature registry for Ishbor platform. **Status key:** ✅ Live · ⚠️ Partial/Demo · ❌ Not implemented

---

## Auth & onboarding

| Feature | Route | Access | Status | Business goal | User value | Dependencies |
|---------|-------|--------|--------|---------------|------------|--------------|
| Login | `/login` | Guest | ✅ | Acquire users | Access workspace | auth.ts |
| Register | `/register` | Guest | ⚠️ | Signup | Create account | verify flow |
| OTP verify | `/verify-otp` | Guest | ⚠️ | Security | Verify phone | demo OTP |
| Email verify | `/verify-email` | Guest | ⚠️ | Trust | Confirm email | — |
| Forgot password | `/forgot-password` | Guest | ⚠️ | Recovery | Reset access | backend needed |
| Client onboarding | `/onboarding/company` … | Auth | ✅ | Profile data | Faster hire | auth-constants |
| Freelancer onboarding | `/onboarding/skills` … | Auth | ✅ | Profile data | Better match | auth-constants |
| Welcome | `/welcome` | Auth | ✅ | Orientation | First steps | ftue-store |

---

## Marketplace discovery (Guest+)

| Feature | Route | Access | Status | Business goal | User value | Dependencies |
|---------|-------|--------|--------|---------------|------------|--------------|
| Home | `/` | Public | ✅ | Convert | Browse marketplace | mock-data |
| Services list | `/services` | Public | ✅ | Liquidity | Find services | services-store |
| Service detail | `/services/$slug` | Public | ✅ | Convert | Buy decision | checkout |
| Projects list | `/projects` | Public | ✅ | Liquidity | Find work | projects-store |
| Project detail | `/projects/$slug` | Public | ✅ | Apply/hire | See scope | applications |
| Freelancers list | `/freelancers` | Public | ✅ | Discovery | Find talent | mock-data |
| Freelancer profile | `/freelancers/$username` | Public | ✅ | Trust | Evaluate hire | reviews, portfolio |
| Agencies list | `/agencies` | Public | ✅ | B2B | Find teams | agency-store |
| Agency profile | `/agencies/$slug` | Public | ✅ | Trust | Evaluate agency | agency-metrics |
| Portfolio public | `/portfolio/$slug` | Public | ✅ | Trust | See work | portfolio-store |
| Client company page | `/clients/$company` | Public | ✅ | Transparency | See client | mock-data |
| Pricing | `/pricing` | Public | ✅ | Monetization | Plan compare | subscription-store |
| Universal search | `/` (hero) | Public | ✅ | Discovery | Quick find | marketplace.ts |

---

## Client workspace

| Feature | Route | Access | Status | Business goal | User value | Dependencies |
|---------|-------|--------|--------|---------------|------------|--------------|
| Client dashboard | `/dashboard` | Client | ✅ | Retention | Overview | orders, projects |
| My projects | `/my-projects` | Client | ✅ | Supply | Manage listings | projects-store |
| Create project | `/projects/create` | Client | ✅ | Supply | Post work | projects-store |
| Checkout | `/checkout` | Client | ✅ | Revenue | Pay securely | orders, escrow, wallet |
| Orders list | `/orders` | Auth | ✅ | Ops | Track work | orders-store |
| Order detail | `/orders/$id` | Participant | ✅ | Ops | Order status | entity guard |
| Escrow list | `/escrow` | Auth | ✅ | Trust | Fund tracking | escrow-store |
| Escrow detail | `/escrow/$id` | Participant | ✅ | Trust | Release/dispute | escrow-store |
| Client CRM | `/clients/manage` | Client | ✅ | Retention | Manage freelancers | crm-store |
| Client analytics | `/analytics/client` | Client | ✅ | Insight | Spend/hire metrics | analytics-utils |
| Saved | `/saved` | Auth | ✅ | Return visits | Bookmarks | saved-store |
| Profile | `/profile` | Auth | ✅ | Identity | Unified view | profile-store |

---

## Freelancer workspace

| Feature | Route | Access | Status | Business goal | User value | Dependencies |
|---------|-------|--------|--------|---------------|------------|--------------|
| Freelancer dashboard | `/dashboard/freelancer` | Freelancer | ✅ | Retention | Pipeline | applications, orders |
| My services | `/my-services` | Freelancer | ✅ | Supply | Manage gigs | services-store |
| Create service | `/services/create` | Freelancer | ✅ | Supply | Sell packages | services-store |
| Applications inbox | `/applications` | Freelancer | ✅ | Convert | Track proposals | applications-store |
| Application detail | `/applications/$id` | Freelancer | ✅ | Convert | Proposal status | applications-store |
| Portfolio hub | `/portfolio` | Auth | ✅ | Trust | Manage work | portfolio-store |
| Create portfolio | `/portfolio/create` | Freelancer | ✅ | Trust | Showcase | portfolio-store |
| Edit portfolio | `/portfolio/edit/$slug` | Owner | ✅ | Trust | Update work | portfolio-store |
| Freelancer CRM | `/freelancers/manage` | Freelancer | ✅ | Retention | Client relations | crm-store |
| Freelancer analytics | `/analytics/freelancer` | Freelancer | ✅ | Insight | Earnings/views | analytics-utils |
| Promotions center | `/promotions` | Freelancer | ✅ | Revenue | Boost visibility | featured, credits |

---

## Agency

| Feature | Route | Access | Status | Business goal | User value | Dependencies |
|---------|-------|--------|--------|---------------|------------|--------------|
| Create agency | `/agencies/create` | Auth | ✅ | B2B supply | Start team | agency-store |
| Agency dashboard | `/dashboard/agency` | Member | ✅ | Ops | Team metrics | agency-metrics |
| Agency CRM | `/agency/clients` | view_crm | ✅ | Retention | Client pipeline | agency-metrics |

---

## Communication & notifications

| Feature | Route | Access | Status | Business goal | User value | Dependencies |
|---------|-------|--------|--------|---------------|------------|--------------|
| Messages | `/messages` | Auth | ✅ | Close deals | Chat, offers | messages-store |
| Notifications | `/notifications` | Auth | ✅ | Engagement | Activity feed | notifications-store |

---

## Money

| Feature | Route | Access | Status | Business goal | User value | Dependencies |
|---------|-------|--------|--------|---------------|------------|--------------|
| Wallet | `/wallet` | Auth | ✅ | Payouts | Balance, tx | wallet-store |
| Subscription | `/subscription` | Auth | ✅ | ARR | Plans | subscription-store |
| Revenue dashboard | `/revenue` | Admin | ✅ | Ops | Platform revenue | monetization-store |

---

## AI hub

| Feature | Route | Access | Status | Business goal | User value | Dependencies |
|---------|-------|--------|--------|---------------|------------|--------------|
| AI center | `/ai` | Auth | ✅ | Differentiation | Tool hub | ai-hub-config |
| AI onboarding | `/ai/onboarding` | Auth | ✅ | Activation | Guided setup | ai-onboarding |
| Proposal assistant | `/ai/proposal-assistant` | Auth | ✅ | Win rate | Draft proposals | ai-proposal-assistant |
| Project generator | `/ai/project-generator` | Auth | ✅ | Supply | Draft projects | ai-project-generator |
| Portfolio optimizer | `/ai/portfolio-optimizer` | Auth | ✅ | Trust | Improve portfolio | ai-portfolio-optimizer |
| Trust coach | `/ai/trust-coach` | Auth | ✅ | Trust | Score tips | ai-trust-coach |

---

## Settings

| Feature | Route | Access | Status | Business goal | User value | Dependencies |
|---------|-------|--------|--------|---------------|------------|--------------|
| Settings hub | `/settings` | Auth | ✅ | Retention | Account control | settings-store |
| Account / Security / Payment / Verification tabs | `/settings?tab=` | Auth | ✅ | Trust | Self-service | multiple stores |
| Referral program | settings tab | Auth | ✅ | Growth | Invite rewards | referral-store |
| Job alerts | settings tab | Auth | ✅ | Engagement | New work alerts | alerts-store |

---

## Admin OS

| Feature | Route | Access | Status | Business goal | User value | Dependencies |
|---------|-------|--------|--------|---------------|------------|--------------|
| Admin dashboard | `/admin` | Admin | ✅ | Ops | Platform overview | admin-data-store |
| User management | `/admin/users` | Admin | ✅ | Safety | User control | admin-store |
| Verifications | `/admin/verifications` | Admin | ✅ | Trust | KYC queue | admin-store |
| Moderation | `/admin/moderation` | Admin | ✅ | Safety | Content review | admin-store |
| Disputes | `/admin/disputes` | Admin | ✅ | Trust | Conflict resolution | admin-store |
| Orders/Escrow/Payments | `/admin/orders` etc. | Admin | ✅ | Ops | Financial ops | admin-data-store |
| Audit log | `/admin/audit` | Admin | ✅ | Compliance | Trace actions | admin-store |
| Founder panel | `/admin/founder` | Admin | ✅ | Strategy | Growth KPIs | growth-metrics |
| System health | `/admin/system` | Admin | ⚠️ | Ops | Read-only health | — |

---

## Cross-cutting

| Feature | Component/Store | Status | Notes |
|---------|-----------------|--------|-------|
| Role switcher | RoleSwitcher | ✅ | localStorage active role |
| Auth gates | AuthGate, ProtectedGate | ✅ | Phase 27.3 |
| Escrow shield | EscrowShield | ✅ | All payment UI |
| Reviews | ReviewForm | ✅ | Post-order |
| FTUE | ftue-store | ✅ | First-time cards |
| Stress seeder | stress-seed.ts | ✅ | QA only |

---

**Total features documented:** 75+  
**Live:** ~90% · **Partial/Demo:** auth recovery, some admin read-only, video intro demo

*Update this file when adding or changing features.*
