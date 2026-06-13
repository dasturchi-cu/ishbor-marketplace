# PRODUCT_READY_CRITERIA.md

Minimum thresholds for Ishbor to be considered **Product Ready**.

**Current status (Phase 28):** ~87% overall — **Conditional soft launch** for demo MVP.

---

## Scoring dimensions

| Dimension | Min launch | Current | Gap |
|-----------|------------|---------|-----|
| UX | 80 | 79 | Onboarding clarity, dashboard mock pipeline |
| UI | 78 | 81 | ✅ |
| Trust | 75 | 74 | Hardcoded landing stats |
| Conversion | 75 | 76 | ✅ demo funnels work |
| Retention | 70 | 72 | CRM basic, no email re-engagement |
| Performance | 80 | 84 | ✅ |
| Mobile | 75 | 74 | Full regression pending |
| Security | 85 | 78 | SSR flash, demo auth, no OAuth |

---

## UX (minimum)

- [ ] Every workspace page has Primary + Empty state CTA
- [ ] No dead buttons in audited scope
- [ ] O'zbek copy on all user-facing strings
- [ ] Guest can browse marketplace without crash
- [ ] Authenticated user understands next step on dashboard
- [ ] Error states recoverable (404, login redirect)

**Blockers:** Auth recovery flows demo-only (acceptable for soft launch with disclaimer)

---

## UI (minimum)

- [ ] Primary `#2563EB` consistent
- [ ] No broken layout at 375px on top 20 routes
- [ ] WorkspaceShell on all workspace pages
- [ ] Cards/tables follow UI_STANDARDS.md

---

## Trust (minimum)

- [ ] Escrow on all payment flows
- [ ] Order/escrow access fail-closed
- [ ] Reviews tied to orders
- [ ] Trust scores computed not hardcoded (except landing marketing)
- [ ] Admin verification queue functional

**Blockers:** Landing social proof is static — label as demo or replace with real data for production

---

## Conversion (minimum)

- [ ] Client can complete: project → hire → checkout → escrow
- [ ] Freelancer can complete: apply → order → deliver path
- [ ] Service purchase checkout works
- [ ] Login redirect preserves deep link

---

## Retention (minimum)

- [ ] Messages functional
- [ ] Notifications functional with pagination
- [ ] Saved items persist
- [ ] Settings persist
- [ ] Role switcher for dual accounts

---

## Performance (minimum)

- [ ] Build passes
- [ ] No known infinite render routes
- [ ] 100 notifications / 100 messages without hang (with pagination)
- [ ] Stable useSyncExternalStore patterns

---

## Mobile (minimum)

- [ ] Home, login, dashboard usable at 375px
- [ ] Messages usable on mobile
- [ ] Checkout usable on mobile
- [ ] No page-level horizontal overflow on top routes

---

## Security (minimum)

- [ ] ProtectedGate on all auth routes (Phase 27.3)
- [ ] Role gates on role-specific routes
- [ ] Admin isolated behind AdminOnlyGate
- [ ] Entity `$id` guards

**Production blockers:**
- Cookie/SSR session
- Real OAuth / password reset
- Rate limiting / CSRF (backend)
- Secrets not in client bundle

---

## Launch tiers

| Tier | Score | Meaning |
|------|-------|---------|
| **Demo** | ≥80 | Investor/stakeholder demo OK |
| **Soft launch** | ≥85 | Limited real users, localStorage MVP |
| **Production** | ≥95 | Real auth, payments, backend, mobile certified |

**Current:** **Soft launch tier (87%)** for controlled demo — not production.

---

## Sign-off checklist

Before declaring Product Ready at any tier:

1. Complete AUDIT_PLAYBOOK.md all sections
2. Complete ≥80% of LAUNCH_CHECKLIST.md for target tier
3. `npm run build` PASS
4. DOCUMENTATION updated if behavior changed
5. Honest score in phase report

---

*Do not inflate scores. Phase 28 honest estimate: 87%.*
