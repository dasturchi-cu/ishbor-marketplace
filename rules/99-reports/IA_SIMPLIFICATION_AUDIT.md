# IA Simplification Audit & Fixes

**Date:** 2026-06-21  
**Scope:** Information architecture — reduce cognitive load, 1 primary action per screen  
**Simplicity score:** 58/100 → **78/100** (post-fix estimate)

---

## Audit Summary

IshBor had high feature power (~90/100) but violated `UX_STANDARDS.md` rule: **1 Primary + 2 Secondary actions** on many screens. Users faced split CTAs, duplicate checkout paths, siloed search, and a 17-section landing page.

### Key findings (pre-fix)

| Area | Problem |
|------|---------|
| Nav | Guest "Loyiha joylash" → `/login?redirect=/projects/create`; landing → `/projects/preview` |
| Search | 5 parallel search systems; hero search routed to siloed list pages |
| Service detail | Up to 6 checkout buttons (hero, sidebar, comparison, mobile bar) |
| Freelancer profile | Duplicate hire/message blocks in hero + sidebar |
| Landing | 17 sections; duplicate trust, portfolio, referral, final CTA bands |
| Messages | Contact links opened generic inbox, not the seller |
| Orders | "Faol" tab excluded `review`/`revision` while dashboard counted them as active |
| Search page | Sort in URL but no UI control |

---

## Fixes Applied

### P0 — Navigation & discovery

1. **Unified "Loyiha joylash"** — guest nav (desktop + mobile) → `/projects/preview` (`nav.tsx`)
2. **Unified search** — `UniversalSearch` routes to `/search?q=&type=all&sort=ranking_score` (`search.tsx`)
3. **Service detail — one checkout anchor** — sidebar `#order-packages` owns checkout; hero/mobile scroll to packages; comparison table buttons removed (`services.$slug.tsx`, `package-card.tsx`)
4. **Freelancer profile — dedupe hire** — hero checkout/message removed; sidebar card is single hire surface (`freelancers.$username.tsx`)

### P1 — Flow & landing

5. **Landing cut to ~8 focused sections** — removed: Nega Ishbor comparison, dark trust band, duplicate portfolio grid, agencies block, LiveActivityFeed, MarketplacePulse, referral band, redundant final CTA links (`index.tsx`)
6. **Messages deep link** — `/messages?with=username` + `ensureConversationForUsername()` (`messages-routing.ts`, `messages-store.ts`, `messages.tsx`); wired on service/freelancer cards and detail pages
7. **Orders active definition** — "Faol" tab includes `in_progress`, `review`, `revision`; removed duplicate review tab (`orders.index.tsx`)
8. **Search sort UI** — dropdown using `sortLabels` from `marketplace.ts` (`search.tsx`)

---

## Remaining (P2 — not in this pass)

- Merge `/profile` hub into dashboard + settings
- Collapse advanced settings tabs
- Single shared `ReviewList` component
- Workspace "Yana" progressive disclosure

---

## Verification

- `npm run build` — required after changes
- `npm test` — required after changes
- Manual: guest nav → preview; hero search → `/search`; service page single checkout path; `/messages?with=username` opens thread

---

## References

- `rules/03-ux/UX_STANDARDS.md`
- `rules/99-reports/FINAL_PRODUCT_EVOLUTION_REPORT.md`
- `rules/99-reports/GROWTH_SEO_BUSINESS_READINESS_REPORT.md`
