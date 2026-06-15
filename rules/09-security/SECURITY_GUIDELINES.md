# SECURITY_GUIDELINES.md

Wallet, Escrow, Auth borligi sababli xavfsizlik qoidalari.  
[PLAN.md](../01-product/PLAN.md) to'g'ridan-to'g'ri security priority bermagan — demo MVP cheklovlari bilan.

---

## 1. Auth

### 1.1 Defense in depth

| Layer | Implementatsiya |
|-------|-----------------|
| Route | `beforeLoad`: `requireAuth`, `requireRole`, `requireAdmin` |
| UI | `AuthGate`, `ProtectedGate`, `RoleGate`, `AgencyGate`, `AdminOnlyGate` |
| Entity | `$id` loader participant check |

### 1.2 Session

| Parametr | Hozirgi (demo) | Production talab |
|----------|----------------|------------------|
| Storage | `ishbor-session` localStorage | HttpOnly cookie |
| SSR | Flash risk before hydration | Cookie session |
| Password reset | Demo only | Real flow |
| OAuth | Yo'q | Production blocker |

**Qoida:** Protected content fail-closed. Shubha → deny.

---

## 2. Role va permission

- Client route — freelancer redirect ([ROLE_CONSISTENCY.md](../02-integration/ROLE_CONSISTENCY.md))
- Admin — `AdminOnlyGate`, RBAC `canAccessSection`
- Agency — `hasAgencyPermission()`
- Order/escrow — participant only

**Known gap:** SSR flash — cookie session kerak (production).

---

## 3. Wallet xavfsizligi

| Qoida | Tafsilot |
|-------|----------|
| Balans | Faqat owner ko'radi / mutate |
| Checkout | Balans tekshiruvi server-side (production) |
| Transaction log | Append-only UI, cap policy |
| Export | Real download, sensitive data user-only |

**Demo:** Client-side wallet — production'da server authoritative balance.

---

## 4. Escrow xavfsizligi

| Qoida | Tafsilot |
|-------|----------|
| Release | Faqat client (yoki admin dispute resolution) |
| Access | Participant fail-closed |
| Amount | Checkout'da lock, milestone release |
| Dispute | Admin queue, funds hold |

---

## 5. Entity `$id` guards

```tsx
// Fail-closed pattern
if (!isParticipant(order, user)) throw notFound();
```

| Route | Guard |
|-------|-------|
| `/orders/$id` | Participant |
| `/escrow/$id` | Participant |
| `/admin/*` | Admin RBAC |

---

## 6. Data validation

- Form input sanitize (XSS — React default escape)
- File upload — type/size check (agar mavjud)
- localStorage parse — try/catch, empty fallback

---

## 7. Secrets va client bundle

**Taqiqlanadi:**

- API keys client bundle'da
- `.env` secrets commit
- Admin credentials hardcode (demo accounts documented only)

---

## 8. Production blockers (checklist)

- [ ] Cookie/SSR session
- [ ] Real OAuth / password reset
- [ ] Payment gateway server-side
- [ ] Rate limiting / CSRF (backend)
- [ ] Secrets not in client bundle
- [ ] Wallet authoritative server-side
- [ ] Audit log immutable (backend)

**Hozirgi tier:** Demo/soft launch — localStorage MVP. Production ≥95% kerak.

---

## 9. Security audit checklist (demo scope)

- [ ] Guest → protected redirect
- [ ] Wrong role → deny/redirect
- [ ] Non-participant → order/escrow 404/deny
- [ ] Non-admin → `/admin` deny
- [ ] Entity loader fail-closed
- [ ] No secrets in `src/` grep

---

*Role matrix: [ROLE_MATRIX.md](../02-integration/ROLE_MATRIX.md). Marketplace: [MARKETPLACE_RULES.md](../08-marketplace/MARKETPLACE_RULES.md).*
