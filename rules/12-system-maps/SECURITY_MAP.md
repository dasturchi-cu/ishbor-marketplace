# SECURITY_MAP.md — Threats, Controls, Requirements

Cross-reference: [SECURITY_ARCHITECTURE.md](../11-backend/SECURITY_ARCHITECTURE.md), [AUTH_ARCHITECTURE.md](../11-backend/AUTH_ARCHITECTURE.md), [RBAC_SPECIFICATION.md](../11-backend/RBAC_SPECIFICATION.md)

---

## 1. Security architecture layers

```
┌─────────────────────────────────────────┐
│ L1 Edge: HTTPS, CSP, CORS, rate limit   │
├─────────────────────────────────────────┤
│ L2 Auth: HttpOnly cookie, session hash  │
├─────────────────────────────────────────┤
│ L3 RBAC: role + permission middleware    │
├─────────────────────────────────────────┤
│ L4 Data: RLS, tenant isolation           │
├─────────────────────────────────────────┤
│ L5 Audit: admin actions, PII access log  │
└─────────────────────────────────────────┘
```

**Current maturity:** L2 partial, L3 client-only guards, L4–L5 demo

---

## 2. Authentication controls

| Control | Implementation | Status |
|---------|----------------|--------|
| Password hashing | bcrypt cost 12 (server) | SERVER |
| Session token | 32-byte random → SHA-256 in DB | SERVER |
| HttpOnly cookie | `ishbor_sid` | SERVER |
| Remember me TTL | 30d vs 24h | SERVER |
| Login rate limit | client `rate-limit.ts` (5/15min) | PARTIAL — needs Redis |
| Account suspend | `user-status-store` + server DB check | PARTIAL |
| Auto-account creation | **REMOVED** (2026-06-20) | FIXED |
| Demo OTP | Hardcoded 123456 | DEV ONLY — remove prod |
| SSR auth gap | guards skip on server | OPEN — needs beforeLoad session |
| localStorage session mirror | auth-bootstrap.js | LEGACY — remove |

---

## 3. Authorization matrix (simplified)

| Resource | Guest | Client | Freelancer | Agency | Admin |
|----------|-------|--------|------------|--------|-------|
| Browse marketplace | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create project | ❌ | ✅ | ❌ | ❌ | ✅ |
| Create service | ❌ | ❌ | ✅ | ❌ | ✅ |
| Apply to project | ❌ | ❌ | ✅ | ❌ | ❌ |
| Checkout/pay | ❌ | ✅ | ❌ | ❌ | ❌ |
| Admin panel | ❌ | ❌ | ❌ | ❌ | ✅ |
| Release escrow (admin) | ❌ | ❌ | ❌ | ❌ | ✅ |

Full matrix: [ROLE_MATRIX.md](../02-integration/ROLE_MATRIX.md)

**Critical gap:** Server functions except session are not RBAC-protected yet.

---

## 4. Threat model (STRIDE)

| Threat | Vector | Current risk | Mitigation |
|--------|--------|--------------|------------|
| **S** Spoofing | Fake session in localStorage | Medium | HttpOnly cookie authority |
| **T** Tampering | Client wallet balance edit | **High** | Server ledger |
| **R** Repudiation | No audit on escrow release | High | Audit log + outbox |
| **I** Info disclosure | SSRF, IDOR on orders | Medium | Entity participant guards |
| **D** Denial of service | Login brute force | Medium | Redis rate limit |
| **E** Elevation | Any admin flag in localStorage | **High** | Server isAdmin from DB only |

---

## 5. Entity access guards (client)

| Route | Guard | Check |
|-------|-------|-------|
| `/orders/$id` | participant | clientId or freelancerId match session |
| `/escrow/$id` | participant | linked order participants |
| `/applications/$id` | owner | freelancer owns application |
| `/portfolio/edit/$slug` | owner | isPortfolioOwner |
| `/admin/*` | requireAdmin | isAdminUser |

**Gap:** Checks run client-side only — API must re-verify.

---

## 6. Input validation

| Surface | Validation | Location |
|---------|------------|----------|
| Login form | email format, password ≥6 | loginSession zod |
| Registration | password ≥8, OTP length 6 | completeRegistrationSession |
| Project create | form validation | projects.create.tsx |
| Checkout amounts | numeric bounds | checkout.tsx |
| Search params | normalizeSearch | marketplace.ts |
| Server functions | `.inputValidator(zod)` | all api/*.functions.ts |

**Missing:** CSRF middleware on POST server functions (target: Origin check per TanStack auth skill)

---

## 7. Data protection

| Data class | Storage | Encryption | Retention |
|------------|---------|------------|-----------|
| Passwords | password_hash column | bcrypt | until deleted |
| Session tokens | token_hash | SHA-256 | TTL expiry |
| PII (email, name) | users table / localStorage | at-rest Neon encryption | account lifetime |
| KYC documents | verification-settings (local) | — | SPEC: R2 + encrypted |
| Payment methods | payment-methods-store | masked display | user-managed |
| Messages | localStorage | — | SPEC: encrypted at rest |

---

## 8. Compliance & legal (Uzbekistan marketplace)

| Requirement | Doc | Implementation |
|-------------|-----|----------------|
| Terms of service | `/terms` | LIVE Uzbek copy |
| Privacy policy | `/privacy` | LIVE Uzbek copy |
| Escrow disclosure | EscrowShield component | LIVE all payment UI |
| Dispute process | TRUST_SYSTEM.md | 24h admin SLA target |
| Transaction records | revenue-store, wallet tx | SPEC: immutable ledger |
| User data export | — | NOT IMPLEMENTED |
| Account deletion | — | NOT IMPLEMENTED |

---

## 9. Security testing checklist

- [ ] Direct POST to protected server fn without cookie → 401
- [ ] Wallet deposit with tampered amount → rejected server-side
- [ ] Access other user's order by ID → 403
- [ ] Admin actions without isAdmin → 403
- [ ] Rate limit login 6th attempt → 429
- [ ] XSS: session not in document.cookie (HttpOnly)
- [ ] CSRF: cross-origin POST blocked

---

## 10. Production security roadmap

| Phase | Item | Doc |
|-------|------|-----|
| 1 | Remove localStorage auth mirror | AUTH_ARCHITECTURE |
| 1 | Server-side RBAC middleware | RBAC_SPECIFICATION |
| 2 | Postgres RLS policies | DATABASE_SCHEMA |
| 2 | Idempotency keys on payments | PAYMENT_ARCHITECTURE |
| 3 | WAF + CSP headers | SECURITY_ARCHITECTURE |
| 4 | SOC2-style audit export | ADMIN_OS domain |
| 5 | Pen test before launch | LAUNCH_CHECKLIST |
