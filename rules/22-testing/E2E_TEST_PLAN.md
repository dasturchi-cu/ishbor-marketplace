# E2E_TEST_PLAN.md

**Ishbor marketplace — Playwright end-to-end test plan**  
**Runner:** Playwright · **Config:** `playwright.config.ts` · **Directory:** `e2e/`

---

## 1. Purpose

E2E tests simulate **real user journeys** in a browser against the running Ishbor app (`npm run dev` or staging). They validate routing, auth gates, Uzbek copy, mobile layout, and critical marketplace flows that unit tests cannot cover.

North star journey (PROJECT_BIBLE §1):

> First successful escrow transaction → repeat hire → platform liquidity

Every critical journey must have a Playwright spec before production launch.

---

## 2. Current state

### Existing specs

| File | Tests |
|------|-------|
| `e2e/smoke.spec.ts` | Landing CTA, help footer link, search page, login render |
| `e2e/auth.spec.ts` | Demo client quick login → dashboard, invalid credentials error |

### Configuration

| Setting | Value |
|---------|-------|
| `testDir` | `e2e` |
| `baseURL` | `http://127.0.0.1:8081` (override: `PLAYWRIGHT_BASE_URL`) |
| `webServer` | `npm run dev`, 120s timeout |
| `workers` | 1 (avoid localStorage race) |
| `retries` | 2 in CI, 0 local |
| `projects` | chromium desktop |

---

## 3. Test personas

From PROJECT_BIBLE §15:

| Persona | Email | Password | Active role | Primary dashboard |
|---------|-------|----------|-------------|-----------------|
| Client (Sardor) | sardor@asaka.uz | demo1234 | client | `/dashboard` |
| Freelancer (Nargiza) | nargiza@ishbor.uz | demo1234 | freelancer | `/dashboard/freelancer` |
| Admin | admin@ishbor.uz | demo1234 | admin | `/admin` |

**OTP demo:** `123456` for phone verification flows.

### Login helpers (target `e2e/helpers/auth.ts`)

```text
loginAsClient(page)   — click "mijoz" quick button or fill form
loginAsFreelancer(page)
loginAsAdmin(page)
logout(page)
```

---

## 4. Smoke suite (every PR)

Expand current `smoke.spec.ts`:

| # | Test | Route | Assert |
|---|------|-------|--------|
| S1 | Landing loads | `/` | Title contains "Ishbor", primary CTA visible |
| S2 | Help reachable | `/` → `/help` | H1 visible |
| S3 | Search works | `/search?q=figma` | Results heading |
| S4 | Login renders | `/login` | Email + password fields |
| S5 | Register renders | `/register` | Form fields, O'zbek labels |
| S6 | Public projects | `/projects` | List or empty state with CTA |
| S7 | Public services | `/services` | Cards render |
| S8 | Public freelancers | `/freelancers` | Profile cards |
| S9 | Terms page | `/terms` | Legal content |
| S10 | 404 page | `/nonexistent-route-xyz` | Friendly error |

---

## 5. Auth suite (every PR)

Expand `auth.spec.ts`:

| # | Test | Assert |
|---|------|--------|
| A1 | Demo client login | URL `/dashboard`, heading visible |
| A2 | Demo freelancer login | URL `/dashboard/freelancer` |
| A3 | Invalid credentials | Error toast/message in O'zbek |
| A4 | Guest blocked from dashboard | Redirect to `/login` |
| A5 | Guest blocked from `/ai` | Redirect to `/login` |
| A6 | Logout clears session | Cannot access `/dashboard` |
| A7 | Deep link preserved | `/projects/foo` → login → return |
| A8 | RoleGate client blocked from `/my-services` | Redirect or gate message |
| A9 | RoleGate freelancer blocked from `/checkout` | Gate enforced |
| A10 | Admin gate | Non-admin cannot access `/admin` |

---

## 6. Critical journeys (pre-release gate)

### J1 — Client posts project

| Step | Action | Assert |
|------|--------|--------|
| 1 | Login as client | Dashboard |
| 2 | Navigate `/projects/create` | Form loads |
| 3 | Fill title, budget, skills | Validation passes |
| 4 | Publish | Redirect to project detail or my-projects |
| 5 | Verify public listing | Visible on `/projects` |

### J2 — Freelancer applies to project

| Step | Action | Assert |
|------|--------|--------|
| 1 | Login as freelancer | Dashboard |
| 2 | Browse `/projects` | Select project |
| 3 | Open proposal form | Fields visible |
| 4 | Submit proposal | Success toast |
| 5 | Check `/applications` | Application listed |

### J3 — AI proposal assistant → submit

| Step | Action | Assert |
|------|--------|--------|
| 1 | Login as freelancer | — |
| 2 | `/ai/proposal-assistant` | Tool loads |
| 3 | Select project | Generated cover letter |
| 4 | Copy / proceed | Link to project with `?proposal=true` |
| 5 | Submit proposal | Application created |

### J4 — Client hires → checkout → escrow

| Step | Action | Assert |
|------|--------|--------|
| 1 | Login as client | — |
| 2 | Review proposals on project | Accept action |
| 3 | `/checkout` | Order summary, 5% platform fee |
| 4 | Complete payment (demo) | Order created |
| 5 | `/escrow` | Escrow status "funded" |
| 6 | Escrow badge visible | Trust UI |

### J5 — Service direct purchase

| Step | Action | Assert |
|------|--------|--------|
| 1 | Login as client | — |
| 2 | `/services/$slug` | Service detail |
| 3 | Buy / order CTA | Checkout |
| 4 | Complete | Order in `/orders` |

### J6 — Messaging

| Step | Action | Assert |
|------|--------|--------|
| 1 | Client messages freelancer | Thread opens |
| 2 | Send message | Appears in thread |
| 3 | Unread badge | Updates for recipient |

### J7 — Freelancer portfolio + trust

| Step | Action | Assert |
|------|--------|--------|
| 1 | Login as freelancer | — |
| 2 | `/ai/portfolio-optimizer` | Analysis + suggestions |
| 3 | `/ai/trust-coach` | Trust score + improvement links |
| 4 | Click improvement CTA | Navigates to real route |

### J8 — Client AI project generator

| Step | Action | Assert |
|------|--------|--------|
| 1 | Login as client | — |
| 2 | `/ai/project-generator` | Form |
| 3 | Generate from idea | Title, skills, budget |
| 4 | "Loyiha yaratish" | `/projects/create?ai=1` prefilled |

### J9 — Subscription upgrade

| Step | Action | Assert |
|------|--------|--------|
| 1 | Login as freelancer (free) | — |
| 2 | `/subscription` | Plan cards |
| 3 | Upgrade to Pro (demo) | Plan active |
| 4 | Proposal limit | Unlimited or higher limit |

### J10 — Admin moderation

| Step | Action | Assert |
|------|--------|--------|
| 1 | Login as admin | `/admin` |
| 2 | `/admin/moderation` | Queue loads |
| 3 | Approve/reject action | Status updates |

---

## 7. Mobile viewport tests

Per MOBILE_STANDARDS.md — run critical specs at **375×667**:

| Spec | Mobile check |
|------|--------------|
| Landing | CTA ≥44px touch target |
| Login | Form usable without horizontal scroll |
| Dashboard | Bottom nav / hamburger works |
| Checkout | Payment summary readable |
| Messages | Input not hidden by keyboard (best effort) |

```text
// playwright.config.ts — add project
{ name: "mobile-chrome", use: { ...devices["Pixel 5"] } }
```

---

## 8. UX policy assertions

Per DEAD_ACTION_POLICY.md — every page in journey specs must verify:

- [ ] Primary CTA navigates or mutates (not no-op)
- [ ] Empty states have actionable CTA
- [ ] No "coming soon" copy
- [ ] Destructive actions show confirm
- [ ] Toast is feedback only (action already completed)

---

## 9. File organization (target)

```text
e2e/
├── smoke.spec.ts
├── auth.spec.ts
├── journeys/
│   ├── client-post-project.spec.ts
│   ├── freelancer-apply.spec.ts
│   ├── checkout-escrow.spec.ts
│   ├── ai-tools.spec.ts
│   ├── messaging.spec.ts
│   └── admin-moderation.spec.ts
├── helpers/
│   ├── auth.ts
│   └── navigation.ts
└── fixtures/
    └── test-data.ts
```

---

## 10. CI integration

| Trigger | Specs | Timeout |
|---------|-------|---------|
| PR | smoke + auth | 10 min |
| Nightly | all journeys | 30 min |
| Pre-release | journeys + mobile | 45 min |

**Artifacts on failure:** trace (`on-first-retry`), screenshot, video (optional).

---

## 11. Staging E2E

| Setting | Production-like staging |
|---------|------------------------|
| `PLAYWRIGHT_BASE_URL` | `https://staging.ishbor.uz` |
| `webServer` | disabled — hits remote |
| Demo auth | `ALLOW_DEMO_AUTH=true` |
| Data | Reset nightly |

---

## 12. Success criteria

- [ ] Smoke + auth green on every PR
- [ ] J1–J6 (core marketplace loop) green before beta
- [ ] J7–J8 (AI tools) green before beta
- [ ] J9–J10 green before production
- [ ] Mobile viewport pass on J1, J4, J6
- [ ] Zero flaky tests over 5 consecutive CI runs

---

## 13. References

- [PROJECT_BIBLE.md](../00-constitution/PROJECT_BIBLE.md)
- [LAUNCH_CHECKLIST.md](../06-quality/LAUNCH_CHECKLIST.md)
- [QA_CHECKLIST.md](../06-quality/QA_CHECKLIST.md)
- [AI_TOOLS.md](../13-domains/AI_TOOLS.md)
- [ROUTE_REGISTRY.md](../02-integration/ROUTE_REGISTRY.md)

---

*Last updated: 2026-06-20*
