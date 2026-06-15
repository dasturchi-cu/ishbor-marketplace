# FUTURE_ROADMAP.md

Prioritized roadmap from Phase 1–28 analysis and ISHBOR_FOUNDER_AUDIT.

**Not committed work** — guides product decisions. No implementation until prioritized sprint.

---

## P0 — Production blockers

| # | Initiative | Impact | Effort | Source |
|---|------------|--------|--------|--------|
| 1 | Real auth (SSR cookies, OAuth) | Security, SSR flash | High | Phase 27.3 |
| 2 | Payment gateway (Humo/Uzcard/Kaspi) | Revenue | High | Founder audit |
| 3 | Backend API + DB | Scale, sync | High | Phase 28 |
| 4 | Replace hardcoded landing stats | Trust | Medium | Founder audit |
| 5 | Dashboard real data (not mock pipeline) | Client retention | Medium | Founder audit |

---

## P1 — Revenue (highest ROI)

| # | Initiative | Impact | Notes |
|---|------------|--------|-------|
| 1 | Connects / proposal limits enforcement | Monetization | subscription-store exists |
| 2 | Featured listing analytics ROI dashboard | Upsell | promotions page partial |
| 3 | Client subscription for hiring | ARR | enterprise tier |
| 4 | Agency white-label / team billing | B2B ARR | agency system ready |
| 5 | Platform fee transparency on landing | Conversion | 5% exists in checkout only |

---

## P2 — Growth

| # | Initiative | Impact | Notes |
|---|------------|--------|-------|
| 1 | Referral loop activation | Viral | referral-store exists, needs UX push |
| 2 | "Qanday ishlaydi" 3-step on landing | Guest conversion | Founder audit P0 |
| 3 | Live activity feed (real events) | Trust | analytics-events source |
| 4 | SEO project/service pages | Organic | SSR needed |
| 5 | Saved search alerts | Retention | alerts-store partial |

---

## P3 — Retention

| # | Initiative | Impact | Notes |
|---|------------|--------|-------|
| 1 | Unified proposals inbox (all projects) | Client UX | per-project today |
| 2 | Post-hire dashboard (real orders) | Client retention | orders-store merge fix ongoing |
| 3 | Repeat hire suggestions | LTV | ai-matching-store |
| 4 | Email/push notifications | Re-engagement | backend needed |
| 5 | Freelancer earnings forecast | Retention | analytics partial |

---

## P4 — Trust & quality

| # | Initiative | Impact | Notes |
|---|------------|--------|-------|
| 1 | Skills tests / certifications | Differentiation | not started |
| 2 | Video intro (real upload) | Profiles | demo badge today |
| 3 | Client reputation visible | Two-sided trust | partial |
| 4 | Dispute evidence upload | Escrow trust | admin exists |
| 5 | Public review verification badge | Trust | reviews-store |

---

## P5 — Agency & enterprise

| # | Initiative | Impact | Notes |
|---|------------|--------|-------|
| 1 | Agency billing / revenue share | B2B | Phase 20 base |
| 2 | Team permissions granularity | Enterprise | ROLE_MATRIX extend |
| 3 | Case study SEO pages | Discovery | agency-portfolio-store |
| 4 | Agency ranking algorithm v2 | Discovery | agency-ranking-store |

---

## P6 — AI differentiation

| # | Initiative | Impact | Notes |
|---|------------|--------|-------|
| 1 | AI proposal → one-click apply | Conversion | proposal-assistant exists |
| 2 | AI project → one-click publish | Supply | project-generator exists |
| 3 | Smart match notifications (real) | Engagement | ai-smart-notifications |
| 4 | Trust coach actionable tasks | Trust | trust-coach exists |

---

## Explicitly deferred

- Hourly time tracker
- Native mobile apps
- International expansion beyond Central Asia focus
- Crypto payments
- Full Upwork feature parity

---

## Recommended next 3 sprints

1. **Sprint A:** Backend auth + session → fix SSR flash, enable production security
2. **Sprint B:** Dashboard real data + landing trust fixes → improve client retention story
3. **Sprint C:** Payment integration + fee transparency → unlock real revenue

---

*Revisit after each phase audit. Update priorities when metrics available.*
