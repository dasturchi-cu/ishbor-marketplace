# PHASE 33 — War Mode Full Audit Report

**Date:** 2026-06-15  
**Cycle:** Audit → Fix → Build verify

---

## Scope audited

| Area | Status |
|------|--------|
| Checkout flow | Fixed (validation, wallet, idempotency, CTAs) |
| Settings tabs | Fixed (account save, password, verification, appearance, language) |
| Orders recovery | Fixed (unfunded escrow CTA) |
| Mobile 375px | Partial (checkout title wrap, touch targets OK) |
| favicon | Fixed (`public/favicon.svg` + root head link) |
| Stress seed | Already wired (`window.__ishborStressSeed`) |

---

## Fixes applied

### Checkout (`checkout.tsx`, `orders-store.ts`)
- Invalid/missing params → `EntityNotFound` (no fake success)
- Wallet `holdEscrowFunds` failure blocks confirmation
- Mock orders persist funding on checkout
- Double-pay guard (`paying` state + already-funded check)
- Service slug fallback removed
- Payment method recorded in notification metadata
- Seller message links to freelancer profile

### Settings
- **Account:** save baseline sync via `saveVersion`
- **Password:** validates current + persists demo override (`auth.ts`)
- **Verification:** real file input, per-step modal, no auto-approve
- **Appearance:** theme/compact/animation/fontSize apply to DOM
- **Language:** non-Uzbek pickers hidden (i18n not ready)

### Orders (`orders.$id.tsx`)
- `ClientCheckoutLink` when client + unfunded escrow

### Root
- Favicon link, system theme bootstrap, appearance prefs on login

---

## Remaining (next loop)

- [ ] Playwright full route regression (870+ checklist)
- [ ] Mobile 320–768 viewport sweep all routes
- [ ] Stress test UI pagination under 100 messages/notifications
- [ ] 2FA enforce at login OR hide enable flow until backend
- [ ] Language date/currency formats app-wide (if product requires)
- [ ] `/favicon.ico` legacy request (optional duplicate asset)

---

## Verify

```bash
npm run build  # PASS
```

Stress test (browser console):
```js
window.__ishborStressSeed?.()
window.__ishborClearStressSeed?.()
```

Demo accounts: `sardor@asaka.uz`, `nargiza@ishbor.uz`, `admin@ishbor.uz` / `demo1234`
