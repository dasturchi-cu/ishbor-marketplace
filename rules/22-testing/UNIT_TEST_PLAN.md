# UNIT_TEST_PLAN.md

**Ishbor marketplace — Vitest unit test scope and coverage targets**  
**Runner:** Vitest 2.x · **Environment:** jsdom · **Config:** `vitest.config.ts`

---

## 1. Purpose

Unit tests validate **pure logic** in `src/lib/` and future `server/` modules without browser automation or database I/O. Ishbor's demo MVP stores marketplace state in localStorage; unit tests are the primary safety net until FastAPI becomes the source of truth.

Goals:

- Catch regressions in auth, escrow math, subscription limits, AI rule engines
- Enforce stable `useSyncExternalStore` snapshot contracts
- Validate api-client error mapping before backend integration
- Meet PRODUCT_READY_CHECKLIST coverage minimums before release

---

## 2. Scope

### In scope

| Path pattern | Rationale |
|--------------|-----------|
| `src/lib/**/*.ts` | Store logic, guards, formatters, AI rule engines |
| `src/lib/**/*.test.ts` | Co-located or mirrored test files |
| `server/**/*.ts` (future) | Nitro/FastAPI shared utilities |
| `server/**/*.test.ts` | Server unit tests |

### Out of scope (other layers)

| Concern | Layer |
|---------|-------|
| Route rendering, navigation | Playwright E2E |
| HTTP + DB round-trips | Integration tests |
| WebSocket message delivery | Integration + E2E |
| Visual regression | Manual / future Percy |
| LLM API calls | Mocked in unit; real calls in staging only |

---

## 3. Vitest configuration

From `vitest.config.ts`:

```text
environment: jsdom
include: ["src/**/*.test.ts", "server/**/*.test.ts"]
coverage.provider: v8
coverage.include: ["src/lib/**/*.ts", "server/**/*.ts"]
coverage.exclude: ["**/*.test.ts", "**/mock-data.ts"]
```

**Commands:**

| Command | Use |
|---------|-----|
| `npm test` | Run all unit tests once |
| `npm test -- --watch` | Local development |
| `npm test -- --coverage` | Coverage report (text + html) |

---

## 4. Test file conventions

1. **Naming:** `{module}.test.ts` adjacent to or under `src/lib/`
2. **Isolation:** Reset localStorage/sessionStorage in `beforeEach`
3. **No inline `[]` or `{}` in store snapshot tests** — use stable references per PROJECT_STANDARDS
4. **Mock time:** `vi.useFakeTimers()` for subscription renewal, escrow timers
5. **Uzbek error messages:** Assert user-facing strings match production copy

### localStorage hygiene

```text
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
```

Use `storage-safe.test.ts` patterns when testing corrupt JSON edge cases.

---

## 5. Module coverage targets

### Tier 1 — Critical (85% line coverage)

| Module | Test focus |
|--------|------------|
| `auth.ts` | Session create/destroy, demo accounts, password validation |
| `user-status-store.ts` | suspended/banned/pending gates |
| `api-client.ts` | 401/403/404/422 mapping, retry policy |
| `rate-limit.ts` | Login throttle, AI endpoint throttle |
| `sanitize.ts` | XSS, script tags in messages/proposals |
| `active-role-store.ts` | Role switch, persistence key `ishbor-active-role-{userId}` |

### Tier 2 — Marketplace core (70% line coverage)

| Module | Test focus |
|--------|------------|
| `projects-store.ts` | CRUD, slug uniqueness, status transitions |
| `applications-store.ts` | Proposal submit, subscription limit enforcement |
| `orders-store.ts` | Order creation from checkout |
| `escrow-store.ts` | State machine: funded → in_progress → released |
| `wallet-store.ts` | Balance mutations, ledger consistency |
| `subscription-store.ts` | Plan limits, monthly proposal counter |
| `credits-store.ts` | Featured purchase, balance deduction |
| `reviews-store.ts` | Only completed orders |
| `messages-store.ts` | Thread creation, unread counts |
| `notifications-store.ts` | Badge count, mark read |

### Tier 3 — AI rule engines (75% line coverage)

| Module | Test focus |
|--------|------------|
| `ai-matching-store.ts` | Score formula, top-N results |
| `ai-opportunity-store.ts` | Opportunity score components |
| `ai-proposal-assistant.ts` | Skill match rate, milestone split |
| `ai-project-generator.ts` | Keyword detection, budget suggestion |
| `ai-portfolio-optimizer.ts` | Weak areas, suggestion priority |
| `ai-trust-coach.ts` | Trust score breakdown, improvement links |
| `ai-onboarding-wizard.ts` | Step completion, progress % |
| `ai-hub-config.ts` | Role-filtered feature cards |
| `ai-smart-notifications.ts` | Notification sync rules |

### Tier 4 — Supporting stores (60% line coverage)

| Module | Test focus |
|--------|------------|
| `portfolio-store.ts` | Publish/unpublish |
| `services-store.ts` | Max services per plan |
| `agency-store.ts` | Member roles, permissions |
| `crm-store.ts` | Client/freelancer CRM lists |
| `saved-store.ts` | Add/remove saved items |
| `featured-store.ts` | Featured expiry |
| `referral-store.ts` | Code application |
| `analytics-events-store.ts` | Event recording |
| `conversion-store.ts` | Funnel events |
| `growth-metrics.ts` | Trust/success score formulas |

### Tier 5 — Infrastructure (80% line coverage)

| Module | Test focus |
|--------|------------|
| `store-persist.ts` | Serialize/deserialize, version migration |
| `store-version.ts` | bumpStoreVersion, cross-tab |
| `storage-safe.ts` | Corrupt data recovery |
| `marketplace.test.ts` | Slug rules, mock merge |

---

## 6. Store test patterns

### Read/write cycle

```text
1. Seed minimal user + entity via store API
2. Assert list/detail reflects seed
3. Mutate (update status, submit proposal)
4. Assert dependent stores updated (notifications, analytics)
5. Assert localStorage key written correctly
```

### Subscription gate example

For `applications-store.ts`:

- Free plan user at 10 proposals → `submitApplication` returns limit error
- Pro plan user → unlimited proposals
- Month rollover resets `proposals_used`

### Escrow state machine

Test illegal transitions fail:

- `released` → `funded` ❌
- `disputed` → `released` requires admin action mock

---

## 7. api-client tests

Current: `api-client.test.ts`

Expand when FastAPI ships:

| Scenario | Expected behavior |
|----------|-------------------|
| 401 Unauthorized | Clear session, redirect login path |
| 403 Forbidden | Uzbek toast, no data leak |
| 404 Not found | Entity-specific message (*"Buyurtma topilmadi"*) |
| 422 Validation | Field-level errors mapped to form |
| 429 Rate limit | Retry-After respected |
| Network offline | Graceful degradation message |

**Never test against production API** in unit tests.

---

## 8. Mocking strategy

| Dependency | Mock approach |
|------------|---------------|
| `fetch` | `vi.fn()` with Response objects |
| `localStorage` | jsdom built-in + corruption tests |
| `Date` | `vi.setSystemTime()` for billing cycles |
| LLM provider | Not called in unit — mock service layer |
| WebSocket | Stub `EventSource` / WS for client handlers |

---

## 9. CI gates

| Gate | Threshold |
|------|-----------|
| All unit tests pass | 100% |
| No skipped tests in CI | Unless tagged `@wip` with issue link |
| Coverage regression | Block if Tier 1 drops below 85% |
| New store without tests | PR blocked per CODEOWNERS |

---

## 10. Priority backlog (next tests to add)

| Priority | Module | Reason |
|----------|--------|--------|
| P0 | `escrow-store.test.ts` | Money flow correctness |
| P0 | `applications-store.test.ts` | Subscription limits |
| P0 | `subscription-store.test.ts` | Plan enforcement |
| P1 | `ai-matching-store.test.ts` | Dashboard recommendations |
| P1 | `orders-store.test.ts` | Checkout integration |
| P2 | `messages-store.test.ts` | Chat pagination logic |
| P2 | `agency-store.test.ts` | AgencyGate permissions |

---

## 11. Success criteria

- [ ] Tier 1 modules ≥85% line coverage
- [ ] Tier 2 modules ≥70% line coverage
- [ ] All AI rule engines have deterministic output tests (same input → same output)
- [ ] No flaky tests in CI (3 consecutive green runs)
- [ ] Coverage report archived per release in `rules/99-reports/`

---

## 12. References

- [QA_CHECKLIST.md](../06-quality/QA_CHECKLIST.md) — stress volumes
- [INTEGRATION_RULES.md](../02-integration/INTEGRATION_RULES.md) — single source of truth
- [STORE_REGISTRY.md](../02-integration/STORE_REGISTRY.md) — store inventory
- [AI_TOOLS.md](../13-domains/AI_TOOLS.md) — AI module list

---

*Last updated: 2026-06-20 — aligned with vitest.config.ts and existing 9 test files.*
