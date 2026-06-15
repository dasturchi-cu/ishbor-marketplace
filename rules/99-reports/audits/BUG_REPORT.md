# Bug Report — Phase 14

## Fixed (P0 / P1)

| ID | Priority | Issue | Status |
|----|----------|-------|--------|
| B-001 | P0 | Service checkout confirmed without creating order/escrow | **Fixed** |
| B-002 | P0 | Admin panel accessible without auth (SSR shell leak) | **Fixed** — AdminOnlyGate |
| B-003 | P1 | Messages send did not append to thread | **Fixed** |
| B-004 | P1 | Escrow release/dispute did not update state | **Fixed** |
| B-005 | P1 | Deposit/withdraw/offer modals ignored user input | **Fixed** |
| B-006 | P1 | Notification settings lost on reload | **Fixed** |
| B-007 | P1 | OTP accepted any 6-digit code | **Fixed** — demo code 123456 |
| B-008 | P1 | Footer About/Press/Careers linked to `/` | **Fixed** |
| B-009 | P1 | Admin link visible to non-admin users | **Fixed** |
| B-010 | P1 | Portfolio nav shown to clients | **Fixed** |

---

## Open — P1 (Serious, not launch-blocking for demo)

| ID | Priority | Issue | Location |
|----|----------|-------|----------|
| B-011 | P1 | Admin actions (users, orders, escrow, etc.) toast + audit only — no data mutation | `admin.*.tsx` |
| B-012 | P1 | Offer accept in messages does not create order/checkout | `messages.tsx` OfferCard |
| B-013 | P1 | Wallet balance static; deposits don't update displayed balance | `wallet.tsx` |
| B-014 | P1 | Google sign-in is demo stub (hardcoded freelancer) | `login.tsx`, `register.tsx` |

---

## Open — P2 (Important)

| ID | Priority | Issue | Location |
|----|----------|-------|----------|
| B-015 | P2 | Save/favorite hearts ephemeral (local state only) | `cards.tsx`, profiles |
| B-016 | P2 | Portfolio gallery upload generates gradient placeholders | `portfolio-form.tsx` |
| B-017 | P2 | Wallet "Filter" toggle shows no filter UI | `wallet.tsx` |
| B-018 | P2 | Video intro play is toast-only | `video-intro.tsx` |
| B-019 | P2 | Admin edit project/service opens toast, no editor | `admin.projects.tsx`, `admin.services.tsx` |
| B-020 | P2 | Support reply is toast-only | `admin.support.tsx` |
| B-021 | P2 | `beforeLoad` guards skip on SSR (`typeof window === undefined`) | `guards.ts` — mitigated by client gates |

---

## Open — P3 (Cosmetic)

| ID | Priority | Issue |
|----|----------|-------|
| B-022 | P3 | Favicon 404 |
| B-023 | P3 | Footer language labels (UZ·EN·RU) not interactive |
| B-024 | P3 | Typing indicator always visible in messages |
| B-025 | P3 | Voice/video call buttons toast-only (acceptable for demo) |

---

## Dead Action Scan Summary

- `href="#"`: **0 found**
- Empty onClick: **0** (except intentional admin audit stubs)
- TODO/FIXME in src: **0**
- "Coming soon": **0**
