# AUDIT_PLAYBOOK.md

Mandatory procedure for every Ishbor audit. **Read before any QA phase.**

---

## Pre-audit setup

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4181
```

**Demo accounts:**
- Client: `sardor@asaka.uz` / `demo1234`
- Freelancer: `nargiza@ishbor.uz` / `demo1234`
- Admin: `admin@ishbor.uz` / `demo1234`

**Clear state:** DevTools → Application → Clear localStorage (or incognito)

---

## Audit order (always)

1. Guest audit
2. Client audit
3. Freelancer audit
4. Agency audit
5. Admin audit
6. Stress test
7. Mobile audit
8. Conversion audit
9. Trust audit
10. Performance audit
11. Accessibility spot-check

Document in `PHASE_XX_REPORT.md` or update `/docs` if law changes.

---

## 1. Guest audit

**Goal:** Public marketplace works; protected routes blocked.

| Step | Action | Pass criteria |
|------|--------|---------------|
| G1 | Visit `/` | Loads, CTAs visible, no console errors |
| G2 | Search | Returns results or empty state |
| G3 | Browse services, projects, freelancers, agencies | Detail pages load |
| G4 | Invalid slugs | EntityNotFound, no crash |
| G5 | `/dashboard`, `/wallet`, `/messages` | Redirect to login |
| G6 | `/login` → register link | Navigates |
| G7 | Legal pages | Load |

---

## 2. Client audit

**Login:** sardor@asaka.uz

| Step | Action | Pass criteria |
|------|--------|---------------|
| C1 | Dashboard | Shows client metrics, no mock-only dead pipeline |
| C2 | Create project | Saves to my-projects |
| C3 | Checkout flow | Order + escrow created |
| C4 | Orders/escrow detail | Participant access only |
| C5 | `/my-services` | Redirect to dashboard (role gate) |
| C6 | CRM, analytics, wallet | Load without crash |
| C7 | Messages, notifications | Send/read works |
| C8 | Settings save | Persists |

---

## 3. Freelancer audit

**Login:** nargiza@ishbor.uz

| Step | Action | Pass criteria |
|------|--------|---------------|
| F1 | Dashboard freelancer | Applications, services visible |
| F2 | Create service | Appears in my-services |
| F3 | Apply to project | Application in inbox |
| F4 | Portfolio create/edit | Saves |
| F5 | `/checkout` | Blocked (role gate) |
| F6 | Promotions, analytics | Load |
| F7 | Order assigned | Can view `/orders/$id` |

---

## 4. Agency audit

| Step | Action | Pass criteria |
|------|--------|---------------|
| A1 | Create agency | `/agencies/create` |
| A2 | Dashboard agency | AgencyGate passes |
| A3 | Invite member | UI + store update |
| A4 | Agency CRM | Permission check |
| A5 | Public profile | Published agency visible |

---

## 5. Admin audit

**Login:** admin@ishbor.uz

| Step | Action | Pass criteria |
|------|--------|---------------|
| AD1 | All admin nav sections | Load without crash |
| AD2 | Moderation approve/reject | confirm + store mutation |
| AD3 | Verifications | approve/reject works |
| AD4 | Disputes | resolve works |
| AD5 | Users `$id` | Detail + fake id 404 |
| AD6 | Escrow `$id` | Detail + fake id 404 |
| AD7 | `/revenue` | Loads with AdminProvider |
| AD8 | Non-admin blocked | AdminOnlyGate |

---

## 6. Stress test

```js
import('/src/lib/stress-seed.ts').then(m => m.runStressSeed())
```

| Step | Pass criteria |
|------|---------------|
| S1 | `/notifications` — pagination, no hang |
| S2 | `/messages` — list limit, search works |
| S3 | `/admin/orders` — table renders |
| S4 | No infinite render errors |
| S5 | `clearStressSeed()` restores |

---

## 7. Mobile audit

**Viewport:** 375×812

| Step | Pass criteria |
|------|---------------|
| M1 | Home hero readable |
| M2 | Nav menu accessible |
| M3 | Messages list/chat split |
| M4 | Wallet filters scroll horizontally |
| M5 | Admin tables scroll |
| M6 | No horizontal page overflow |

---

## 8. Conversion audit

| Funnel | Steps to verify |
|--------|-----------------|
| Guest → Register | CTA → register → verify |
| Client hire | project → proposal → checkout → escrow |
| Service buy | service detail → checkout |
| Freelancer win | apply → accept → order |

**Check:** Each step has clear next CTA (UX_STANDARDS.md)

---

## 9. Trust audit

- Escrow badge on checkout
- Trust scores match formulas (TRUST_SYSTEM.md)
- Reviews only post-order
- Verification badges accurate
- No fake statistics presented as live (note demo stats on landing)

---

## 10. Performance audit

- Stress seed + navigate key routes
- No React #185 errors
- Pagination active on large lists
- Build size acceptable (`npm run build`)

---

## 11. Accessibility audit

- Tab through main form on login
- Focus visible on buttons
- aria-label on icon buttons
- Touch targets ≥44px

---

## Audit output template

```markdown
# Phase XX — [Name] Audit
**Date:** YYYY-MM-DD
**Build:** pass/fail
**Verdict:** X% ready

## Bugs found
| ID | Severity | Route | Fix status |

## Flows tested
[persona checklist results]

## Remaining risks
```

---

## Zero-trust rules

1. Don't trust prior phase scores
2. Test in browser, not code review alone
3. Report honestly — 87% not 99%
4. Fix critical bugs in same phase

---

*Use LAUNCH_CHECKLIST.md for exhaustive item-by-item verification.*
