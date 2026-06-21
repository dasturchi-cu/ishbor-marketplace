# ROUTE_REGISTRY.md

Complete route registry. Generated from `src/routeTree.gen.ts` + route files.

---

## Public & auth

| URL | Access | Purpose | Stores | Flows |
|-----|--------|---------|--------|-------|
| `/` | Public | Landing, search | mock-data, conversion | Guest browse |
| `/login` | Guest | Sign in | auth (ishbor-session) | Auth |
| `/register` | Guest | Sign up | auth | Auth → verify |
| `/forgot-password` | Guest | Reset request | — | Auth recovery |
| `/reset-password` | Guest | Reset form | — | Auth recovery |
| `/verify-email` | Guest | Email confirm | — | Auth |
| `/verify-otp` | Guest | OTP confirm | — | Auth |
| `/welcome` | Auth | Post-signup | ftue-store | FTUE |
| `/terms` | Public | Legal | — | — |
| `/privacy` | Public | Legal | — | — |
| `/help` | Public | Help center FAQ | — | Support |
| `/status` | Public | System health | health.functions | Ops |
| `/search` | Public | Unified marketplace search | marketplace.ts, stores | Discovery |
| `/pricing` | Public | Plans | subscription-store | Monetization |

---

## Marketplace

| URL | Access | Purpose | Stores | Flows |
|-----|--------|---------|--------|-------|
| `/services` | Public | Service list | services-store | Discovery |
| `/services/$slug` | Public | Service detail | services-store, saved | Hire/buy |
| `/services/create` | Freelancer | Create service | services-store | Supply |
| `/projects` | Public | Project list | projects-store | Discovery |
| `/projects/$slug` | Public | Project detail | projects-store, applications | Apply/hire |
| `/projects/create` | Client | Create project | projects-store | Supply |
| `/freelancers` | Public | Talent list | mock-data | Discovery |
| `/freelancers/$username` | Public | Profile | reviews, portfolio | Hire |
| `/freelancers/manage` | Freelancer | CRM | crm-store | Retention |
| `/agencies` | Public | Agency list | agency-store | Discovery |
| `/agencies/$slug` | Public* | Agency profile | agency-store | Contact |
| `/agencies/create` | Auth | Create agency | agency-store | Agency setup |
| `/clients/$company` | Public | Company profile | mock-data | Trust |
| `/portfolio/$slug` | Public | Portfolio view | portfolio-store | Trust |
| `/portfolio/create` | Freelancer | Create | portfolio-store | Supply |
| `/portfolio/edit/$slug` | Owner | Edit | portfolio-store | Supply |

*Published or member only.

---

## Workspace

| URL | Access | Purpose | Stores | Flows |
|-----|--------|---------|--------|-------|
| `/dashboard` | Client | Client home | orders, projects, ftue | Dashboard |
| `/dashboard/freelancer` | Freelancer | Freelancer home | applications, orders | Dashboard |
| `/dashboard/agency` | Agency | Agency home | agency-metrics | Agency ops |
| `/profile` | Auth | Unified profile | multiple | Identity |
| `/settings` | Auth | Account settings | settings, security, etc. | Settings |
| `/saved` | Auth | Bookmarks | saved-store | Discovery |
| `/notifications` | Auth | Activity feed | notifications-store | Engagement |
| `/messages` | Auth | Chat | messages-store | Deal close |
| `/my-projects` | Client | Project CRUD | projects-store | Client ops |
| `/my-services` | Freelancer | Service CRUD | services-store | Freelancer ops |
| `/applications` | Freelancer | Proposal inbox | applications-store | Win work |
| `/applications/$id` | Freelancer | Proposal detail | applications-store | Win work |
| `/orders` | Auth | Order list | orders-store | Transaction |
| `/orders/$id` | Participant | Order detail | orders, reviews | Transaction |
| `/escrow` | Auth | Escrow list | escrow-store | Trust |
| `/escrow/$id` | Participant | Escrow detail | escrow-store | Release/dispute |
| `/wallet` | Auth | Balance | wallet-store, payment-methods | Money |
| `/checkout` | Client | Payment | orders, escrow, wallet | Convert |
| `/subscription` | Auth | Plans | subscription-store, credits | Monetization |
| `/promotions` | Freelancer | Boost | featured, credits | Growth |
| `/revenue` | Admin | Revenue dash | monetization, revenue | Admin ops |
| `/clients/manage` | Client | Client CRM | crm-store | Retention |
| `/agency/clients` | Agency CRM | Agency CRM | agency-metrics | Retention |

---

## Analytics & AI

| URL | Access | Purpose | Stores | Flows |
|-----|--------|---------|--------|-------|
| `/analytics` | Auth | Redirect hub | active-role-store | — |
| `/analytics/client` | Client | Client metrics | analytics-events | Insight |
| `/analytics/freelancer` | Freelancer | Freelancer metrics | analytics-events, revenue | Insight |
| `/ai` | Auth | AI hub | ai-hub-config | AI |
| `/ai/onboarding` | Auth | AI wizard | ai-onboarding | Activation |
| `/ai/proposal-assistant` | Auth | Proposals | ai-proposal-assistant | Win rate |
| `/ai/project-generator` | Auth | Projects | ai-project-generator | Supply |
| `/ai/portfolio-optimizer` | Auth | Portfolio tips | ai-portfolio-optimizer | Trust |
| `/ai/trust-coach` | Auth | Trust tips | ai-trust-coach | Trust |

---

## Onboarding

| URL | Access | Purpose |
|-----|--------|---------|
| `/onboarding` | Auth | Start |
| `/onboarding/company` | Client path | Company info |
| `/onboarding/industry` | Client | Industry |
| `/onboarding/team-size` | Client | Team size |
| `/onboarding/hiring-goals` | Client | Goals |
| `/onboarding/skills` | Freelancer | Skills |
| `/onboarding/categories` | Freelancer | Categories |
| `/onboarding/portfolio` | Freelancer | Portfolio seed |
| `/onboarding/languages` | Freelancer | Languages |
| `/onboarding/availability` | Freelancer | Availability |

---

## Admin (`/admin/*`)

| URL | Purpose | Stores |
|-----|---------|--------|
| `/admin` | Dashboard | admin-data-store |
| `/admin/users`, `/admin/users/$id` | Users | admin-store |
| `/admin/verifications` | KYC queue | admin-store |
| `/admin/projects` | Projects mod | admin-data-store |
| `/admin/services` | Services mod | admin-data-store |
| `/admin/portfolios` | Portfolios mod | admin-data-store |
| `/admin/orders` | Orders | admin-data-store |
| `/admin/escrow`, `/admin/escrow/$id` | Escrow | admin-data-store |
| `/admin/disputes` | Disputes | admin-store |
| `/admin/payments` | Payments | admin-data-store |
| `/admin/applications` | Applications | admin-data-store |
| `/admin/moderation` | Content mod | admin-store |
| `/admin/support` | Support | admin-store |
| `/admin/analytics` | Platform analytics | admin-data-store |
| `/admin/audit` | Audit log | admin-store |
| `/admin/system` | Health | — |
| `/admin/founder` | Founder KPIs | growth-metrics |
| `/admin/ai` | AI admin | ai-insights |

**Total routes documented:** 95+

---

*Guards: see ROLE_MATRIX.md. Layout routes use `<Outlet />` + AuthGate.*
