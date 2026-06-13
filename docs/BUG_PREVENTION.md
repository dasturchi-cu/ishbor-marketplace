# BUG_PREVENTION.md

Known bug classes from Phases 27–28. **Prevent recurrence.**

---

## 1. Dead button / toast-only action

**Symptom:** Button shows toast but no state change, navigation, or download.

**Prevention:**
- Every `onClick` must: navigate, open modal, mutate store, or trigger real download
- Code review: grep `toast.success` without preceding mutation
- Use `docs/LAUNCH_CHECKLIST.md` modal section

**Fixed examples:** wallet export, package-card save (Phase 28)

---

## 2. Permission leak

**Symptom:** Guest or wrong role sees protected content.

**Prevention:**
- Dual gate: `beforeLoad` + `AuthGate`/`ProtectedGate`/`RoleGate`
- Entity loaders: fail-closed for `$id` routes
- Test matrix in ROLE_MATRIX.md

**Known gap:** SSR flash before hydration — needs cookie session for production.

---

## 3. Infinite render (React #185)

**Symptom:** Page hangs, "Nimadir buzildi" error boundary.

**Prevention:**
```tsx
// ❌ BAD — new reference every call
useSyncExternalStore(sub, () => getItems(), () => []);

// ✅ GOOD — stable empty
const EMPTY: Item[] = [];
useSyncExternalStore(sub, () => getItems(), () => EMPTY);

// ✅ GOOD — primitive snapshot
useSyncExternalStore(sub, () => getItems().length, () => 0);
```

**Affected historically:** notifications, wallet, analytics, my-services, profile escrows

---

## 4. Route conflict / redirect loop

**Symptom:** Analytics or parent route infinite redirect.

**Prevention:**
- Parent layout redirects only on exact path match
- Child routes must not re-trigger parent redirect
- Test `/analytics/client` and `/analytics/freelancer` after layout changes

---

## 5. SSR / hydration mismatch

**Symptom:** Flash of wrong content, hydration warning.

**Prevention:**
- `useSyncExternalStore` with different server/client snapshot
- Server snapshot: `null` or stable empty for auth
- Don't read localStorage in render without sync external store

---

## 6. localStorage corruption

**Symptom:** Crash on load, empty broken state.

**Prevention:**
- Validate JSON shape before use (notifications: reject array root)
- try/catch on parse → return `{}` or `[]` default
- Stress test with `stress-seed.ts`

---

## 7. State sync bug (cross-tab)

**Symptom:** Tab A logout, Tab B still authenticated.

**Prevention:**
- `storage` event listener on auth subscribe (auth.ts)
- Invalidate in-memory cache on external storage change

---

## 8. Mobile overflow

**Symptom:** Horizontal scroll on page, clipped tables.

**Prevention:**
- `mobile-scroll-x` on filter rows only
- `overflow-x-auto` on tables with `min-w-*`
- Test 375px before merge

---

## 9. Data loss on merge

**Symptom:** User creates order but list shows only mock data.

**Prevention:**
- orders-store: stored items take precedence, mock fills gaps
- After create mutations, call `notify()` to invalidate cache

---

## 10. Broken navigation

**Symptom:** Link goes to 404 or wrong page.

**Prevention:**
- Use typed TanStack Router `Link to=` paths
- Admin parent routes must include `<Outlet />`
- `throw notFound()` not bare `notFound()`

---

## 11. Admin context missing

**Symptom:** `/revenue` crashes outside admin layout.

**Prevention:**
- Standalone admin pages wrap `AdminProvider` + `AdminSearchProvider` + `AdminOnlyGate`

---

## 12. Agency permission bypass

**Symptom:** Non-member sees agency dashboard shell.

**Prevention:**
- `AgencyGate` on agency routes
- Inner pages still check `hasAgencyPermission` for fine-grained actions

---

## Pre-merge checklist

- [ ] No new inline `() => []` in useSyncExternalStore
- [ ] New protected route has ProtectedGate
- [ ] New button has real action
- [ ] Build passes
- [ ] Guest + one authenticated role smoke tested

---

*Update this doc when new bug class discovered in audit.*
