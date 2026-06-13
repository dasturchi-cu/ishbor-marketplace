# PERFORMANCE_GUIDE.md

Performance rules for Ishbor client-side MVP.

**Current readiness score:** 84/100 (Phase 28)

---

## Large dataset handling

| Data type | Threshold | Strategy |
|-----------|-----------|----------|
| Notifications | >50 | Pagination (+50 load more) — `/notifications` |
| Messages conversations | >50 | List limit (+50) — `/messages` |
| Analytics events | >5000 | Cap in store write — analytics-events-store |
| Credit transactions | >500 | Cap per wallet — credits-store |
| Revenue log | >2000 | Cap — revenue-store |
| Admin tables | >100 rows | Filter + paginate (admin DataTable) |

**Stress test:** `runStressSeed()` in browser — verify no hang after seed.

---

## Store optimization

1. **Cache merged lists** — orders-store, messages-store use in-memory cache
2. **Invalidate on write only** — `notify()` clears cache, not every read
3. **Stable snapshots** — see BUG_PREVENTION.md §3
4. **Avoid duplicate reads** — use subscribe pattern, not polling
5. **Batch localStorage writes** — one write per mutation, not per field

---

## Render optimization

```tsx
// Prefer primitive subscriptions
useSyncExternalStore(subscribeWallet, () => walletVersion, () => 0);

// Memoize filtered lists
const filtered = useMemo(() => items.filter(...), [items, filter]);

// Don't define components inside render
```

**Avoid:**
- Creating new objects in useSyncExternalStore snapshot function
- Filtering 1000+ items without pagination in render
- Multiple identical store subscriptions in one tree

---

## Mobile optimization

- Lazy render off-screen message thread content
- Use `mobile-scroll-x` not whole-page overflow
- Reduce shadow/blur on long lists
- Touch targets via `touch-target` (no tiny click areas)

---

## Analytics optimization

- Record events async-safe (sync localStorage is OK for MVP)
- Dashboard charts: use pre-aggregated utils (`analytics-utils.ts`) not raw event scan in render
- Subscribe to event count not full array when only count needed

---

## Route loading

- Code split by route (Vite default)
- Don't import heavy mock-data in leaf components unnecessarily
- Admin charts: load chart components only on admin analytics routes

---

## localStorage limits

- Browser ~5–10MB total
- Stress seed ~10 keys — monitor size in DevTools Application tab
- Production: migrate to API before 1000+ entities per user

---

## Monitoring (manual QA)

1. Run stress seed
2. Open `/notifications`, `/messages`, `/admin/orders`
3. DevTools Performance tab — record 5s interaction
4. Console — no "Maximum update depth" errors
5. Memory — snapshot before/after navigation (no unbounded growth)

---

## Phase 28 fixes reference

| Fix | File |
|-----|------|
| Notification pagination | notifications.tsx |
| Messages list limit | messages.tsx |
| EMPTY_ESCROWS stable ref | profile.tsx |
| Cross-tab auth cache | auth.ts |

---

*Target: interactive lists stay <100ms on mid-range mobile after pagination.*
