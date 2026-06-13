# PROJECT_BIBLE.md

**Ishbor — Markaziy Osiyo freelance marketplace**  
**Version:** 1.0 · **Status:** Demo/MVP (localStorage) · **Readiness:** ~87% (Phase 28)

This document is the **supreme product law**. All code, UX, and audits must align with it.

---

## 1. Product purpose

Ishbor connects **clients** who need work done with **freelancers** and **agencies** who deliver it — with **escrow-protected payments**, **trust signals**, and **Uzbek-first UX**.

**Not:** A Fiverr clone, generic SaaS template, or admin-only demo.  
**Is:** A regional marketplace MVP proving hire → pay → deliver → review loops.

**North star:** First successful escrow transaction → repeat hire → platform liquidity.

---

## 2. Marketplace model

| Side | Creates | Consumes | Pays |
|------|---------|----------|------|
| Client | Projects | Services, talent | Escrow, subscriptions (future) |
| Freelancer | Services, portfolio, proposals | Project listings | Credits, featured, subscription |
| Agency | Team, case studies | CRM, clients | Same as freelancer + team tools |
| Admin | Policies | All entities | Platform fee (5% checkout) |

**Transaction types:**
1. **Project hire** — client posts → freelancer applies → accept → checkout → escrow
2. **Direct service** — client buys service package → checkout → order
3. **Direct hire** — client hires from profile → checkout

**Money flow:** Client funds escrow → milestone release → freelancer wallet → withdraw (demo).

---

## 3. Client capabilities

| Capability | Route(s) | Store(s) |
|------------|----------|----------|
| Onboard (company, industry, team, goals) | `/onboarding/*` | sessionStorage onboarding |
| Post / edit / pause / close projects | `/projects/create`, `/my-projects` | projects-store |
| Review proposals | `/projects/$slug` | applications-store |
| Hire & checkout | `/checkout` | orders-store, escrow-store |
| Manage orders & escrow | `/orders`, `/escrow` | orders-store, escrow-store |
| CRM (freelancers hired) | `/clients/manage` | crm-store |
| Analytics | `/analytics/client` | analytics-events-store |
| Wallet & payments | `/wallet`, `/settings` (payment tab) | wallet-store, payment-methods-store |
| Messages | `/messages` | messages-store |
| Saved items | `/saved` | saved-store |
| Reviews | order detail | reviews-store |
| Subscription | `/subscription` | subscription-store |

**Client active role dashboard:** `/dashboard`

---

## 4. Freelancer capabilities

| Capability | Route(s) | Store(s) |
|------------|----------|----------|
| Onboard (skills, categories, portfolio, languages, availability) | `/onboarding/*` | sessionStorage |
| Create / manage services | `/services/create`, `/my-services` | services-store |
| Create / edit portfolio | `/portfolio/create`, `/portfolio/edit/$slug` | portfolio-store |
| Apply to projects | `/projects`, `/applications` | applications-store |
| Manage applications | `/applications/` | applications-store |
| Orders & escrow | `/orders`, `/escrow` | orders-store, escrow-store |
| CRM (clients) | `/freelancers/manage` | crm-store |
| Analytics | `/analytics/freelancer` | analytics-events-store |
| Promotions & featured | `/promotions` | featured-store, credits-store |
| AI tools | `/ai/*` | ai-* stores |
| Wallet | `/wallet` | wallet-store |
| Messages | `/messages` | messages-store |

**Freelancer active role dashboard:** `/dashboard/freelancer`

---

## 5. Agency capabilities

| Capability | Route(s) | Permission |
|------------|----------|------------|
| Create agency | `/agencies/create` | Authenticated |
| Public profile | `/agencies/$slug` | Published or member |
| Agency dashboard | `/dashboard/agency` | Member (AgencyGate) |
| Team invite / roles | dashboard.agency | owner, manager |
| Agency CRM | `/agency/clients` | view_crm |
| Case studies | dashboard.agency | edit_agency |
| Verification request | dashboard.agency | owner |

**Agency roles:** owner, manager, recruiter, freelancer (member)

---

## 6. Admin capabilities

| Section | Route | Mutations |
|---------|-------|-----------|
| Dashboard | `/admin` | — |
| Users | `/admin/users`, `/admin/users/$id` | suspend, verify |
| Verifications | `/admin/verifications` | approve/reject |
| Projects / Services / Portfolios | `/admin/projects`, etc. | moderate |
| Orders / Escrow / Payments | `/admin/orders`, etc. | status updates |
| Disputes | `/admin/disputes` | resolve |
| Moderation | `/admin/moderation` | approve/reject content |
| Support | `/admin/support` | ticket actions |
| Analytics | `/admin/analytics` | read |
| Audit | `/admin/audit` | read |
| System | `/admin/system` | read-only health |
| Founder | `/admin/founder` | growth metrics |
| AI Center | `/admin/ai` | read |
| Revenue | `/revenue` | read (admin only) |

**Admin roles:** super_admin, finance_admin, support_admin, moderator

---

## 7. UX rules (non-negotiable)

1. Every page answers **"Keyin nima qilaman?"**
2. Every page has **Primary CTA + Secondary CTA + Empty State CTA**
3. **No dead-end pages**
4. **No dead actions** — buttons must navigate, mutate, modal, or meaningful download
5. Language: **O'zbek** for all user-facing copy
6. Confirm destructive actions with `confirm()` or modal
7. Toast is **feedback**, not the action itself

See `docs/UX_STANDARDS.md`.

---

## 8. UI rules

- Primary: `#2563EB`
- Do **not** redesign branding, nav structure, or dashboard layout without explicit approval
- Mobile-first: test 320–768px
- Touch targets ≥ 44px
- Use existing: WorkspaceShell, SiteNav, cards, trust badges, EmptyState

See `docs/UI_STANDARDS.md` and `DESIGN_GUARDRAILS1111.md`.

---

## 9. Trust rules

- Escrow badge on all payment flows
- Verification badges from real verification state (not hardcoded on authenticated users)
- Trust/success scores computed from `growth-metrics.ts` — never random
- Reviews tied to completed orders
- Featured/promoted listings disclosed

See `docs/TRUST_SYSTEM.md`.

---

## 10. Monetization rules

| Stream | Mechanism |
|--------|-----------|
| Platform fee | 5% on checkout |
| Subscriptions | free / pro (99k UZS) / elite (249k UZS) |
| Credits | UZS wallet for featured/promotions |
| Featured listings | 100k UZS credits, 7 days, plan discount applies |

Subscription limits: proposals/month, max services, ranking boost.

See `subscription-store.ts`, `credits-store.ts`, `featured-store.ts`.

---

## 11. Growth rules

- FTUE: GettingStartedCard, JourneyMap, TrustTip (`ftue-store`)
- Referral program in settings (`referral-store`)
- AI matching suggestions on dashboards (`ai-matching-store`)
- Conversion events tracked (`conversion-store`, `analytics-events-store`)
- Role switcher for dual client/freelancer accounts

**Future (not MVP):** viral loops, paid acquisition, SEO landing variants — see `FUTURE_ROADMAP.md`.

---

## 12. Marketplace rules

1. **Public discovery** — projects, services, freelancers, agencies, portfolios browsable without login
2. **Login wall** — create, hire, pay, message require auth
3. **Role enforcement** — client vs freelancer routes gated (Phase 27.3)
4. **Entity access** — order/escrow detail fail-closed to participants
5. **Admin override** — admin sees all via admin panel, not user routes
6. **Mock + stored data merge** — orders/projects merge mock seed with localStorage; new user actions must appear in UI

---

## 13. Auth & permission law

**Defense in depth:**
1. `beforeLoad` guard (`requireAuth`, `requireRole`, `requireAdmin`)
2. Client gate (`AuthGate`, `ProtectedGate`, `RoleGate`, `AgencyGate`, `AdminOnlyGate`)
3. Loader/entity guards for `$id` routes

**Known limitation:** SSR may flash protected shell until hydration — requires cookie session for production.

**Session key:** `ishbor-session` (localStorage or sessionStorage)

**Active role key:** `ishbor-active-role-{userId}`

---

## 14. Development priority

1. Functionality
2. UX
3. Mobile
4. Trust
5. Performance
6. Visual polish

**Quality gate:** No ship with dead buttons, broken mobile, or unclear next step.

---

## 15. Demo accounts

| Email | Role | Password |
|-------|------|----------|
| sardor@asaka.uz | Client | demo1234 |
| nargiza@ishbor.uz | Freelancer | demo1234 |
| admin@ishbor.uz | Admin | demo1234 |

OTP demo: `123456`

---

*This bible supersedes scattered phase report summaries. Update this file when product law changes.*
