# Ishbor Testing Documentation

**Status:** Active — governs unit, integration, E2E, and load testing for Ishbor marketplace  
**Stack:** Vitest (unit) · FastAPI TestClient (integration) · Playwright (E2E) · k6 (load)  
**Quality gate:** Audit → Fix → Retest → Verify per [QA_CHECKLIST.md](../06-quality/QA_CHECKLIST.md)

---

## Purpose

Ishbor is a regional freelance marketplace (clients, freelancers, agencies, escrow, AI tools). Testing must prove:

1. **Hire → pay → deliver → review** loops work end-to-end
2. **Auth and RBAC** fail closed (no cross-user data leaks)
3. **Stores and API** stay consistent under stress (QA_CHECKLIST volumes)
4. **AI tools** respect usage limits and never expose provider keys
5. **Uzbek UX** renders correctly on mobile (320–768px)

This folder is the **single source of truth** for test strategy. Implementation lives in `src/**/*.test.ts`, `server/**/*.test.ts`, `e2e/`, and future `load/` scripts.

---

## Reading order

| # | Document | Audience | When to read |
|---|----------|----------|--------------|
| 1 | [UNIT_TEST_PLAN.md](./UNIT_TEST_PLAN.md) | Frontend + backend devs | Adding store logic, api-client, guards |
| 2 | [INTEGRATION_TEST_PLAN.md](./INTEGRATION_TEST_PLAN.md) | Backend devs | FastAPI endpoints, DB migrations |
| 3 | [E2E_TEST_PLAN.md](./E2E_TEST_PLAN.md) | QA, full-stack | Release candidate, critical journeys |
| 4 | [LOAD_TEST_PLAN.md](./LOAD_TEST_PLAN.md) | DevOps, backend | Pre-launch, capacity planning |

---

## Current test inventory (2026-06)

### Vitest (`npm test`)

| File | Domain |
|------|--------|
| `src/lib/auth.test.ts` | Session, demo accounts |
| `src/lib/api-client.test.ts` | HTTP client, error mapping |
| `src/lib/marketplace.test.ts` | Entity merge, slug rules |
| `src/lib/rate-limit.test.ts` | Client rate limiting |
| `src/lib/sanitize.test.ts` | XSS input sanitization |
| `src/lib/storage-safe.test.ts` | localStorage corruption guards |
| `src/lib/store-persist.test.ts` | Persist + hydrate |
| `src/lib/store-version.test.ts` | Cross-tab sync version bump |
| `src/lib/user-status-store.test.ts` | Suspended/banned gates |

**Config:** `vitest.config.ts` — jsdom, coverage on `src/lib/**` and `server/**`.

### Playwright (`npm run test:e2e`)

| Spec | Coverage |
|------|----------|
| `e2e/smoke.spec.ts` | Landing, help, search, login render |
| `e2e/auth.spec.ts` | Demo client login, invalid credentials |

**Config:** `playwright.config.ts` — base URL `http://127.0.0.1:8081`, `npm run dev` webServer, CI retries ×2.

### Not yet implemented

- FastAPI integration tests (`server/` — backend docs complete, code pending)
- k6 load scripts (`load/` directory — see LOAD_TEST_PLAN.md)
- AI tool E2E specs
- Escrow/checkout full journey E2E
- Admin moderation flows

---

## CI integration

Per `.github/workflows/ci.yml` (target state):

| Stage | Command | Gate |
|-------|---------|------|
| Lint | `npm run lint` | Must pass |
| Unit | `npm test` | Must pass |
| Build | `npm run build` | Must pass |
| E2E | `npx playwright test` | Smoke + auth on PR |
| Integration | `pytest server/tests` | When FastAPI exists |
| Load | k6 smoke (optional) | Nightly / pre-release |

---

## Test data conventions

| Environment | Data source | Rules |
|-------------|-------------|-------|
| Unit | In-memory mocks, `mock-data.ts` | No real network |
| Integration | PostgreSQL test DB + Alembic | Truncate between tests |
| E2E | Demo accounts (PROJECT_BIBLE §15) | `sardor@asaka.uz`, `nargiza@ishbor.uz`, `admin@ishbor.uz` |
| Load | Synthetic seed script | QA_CHECKLIST volumes ×10 for load |
| Staging | Anonymized snapshot | No production PII |

**Demo password:** `demo1234` · **OTP demo:** `123456`

---

## Coverage targets (summary)

| Layer | Target | Measured by |
|-------|--------|-------------|
| `src/lib/*-store.ts` | 70% lines | Vitest coverage |
| `src/lib/auth.ts`, guards | 85% | Vitest |
| `server/services/**` | 80% | pytest-cov |
| Critical E2E journeys | 100% pass | Playwright |
| Load SLO | p95 < 500ms browse, < 2s checkout | k6 |

Full per-module breakdown: [UNIT_TEST_PLAN.md](./UNIT_TEST_PLAN.md).

---

## Relationship to other docs

| Doc | Relationship |
|-----|--------------|
| [QA_CHECKLIST.md](../06-quality/QA_CHECKLIST.md) | Audit protocol + stress volumes |
| [LAUNCH_CHECKLIST.md](../06-quality/LAUNCH_CHECKLIST.md) | Manual pre-ship checks (E2E complements) |
| [PRODUCT_READY_CHECKLIST.md](../01-product/PRODUCT_READY_CHECKLIST.md) | Release gate |
| [11-backend/](../11-backend/README.md) | API contract for integration tests |
| [24-launch/](../24-launch/README.md) | Go-live verification uses E2E + load results |

---

## Reporting format

All test-related audits follow QA_CHECKLIST §5:

```
AUDIT → FIX → RETEST → VERIFY
```

Failed E2E in CI blocks merge. Load test regressions require incident review per [INCIDENT_PLAYBOOK.md](../24-launch/INCIDENT_PLAYBOOK.md).

---

## Ownership

| Area | Owner |
|------|-------|
| Vitest store tests | Frontend team |
| Playwright specs | QA / full-stack |
| FastAPI integration | Backend team |
| k6 scenarios | DevOps |
| Test data seeds | Shared — changes require PR review |

---

*Update this index when new test directories or CI stages are added.*
