# ROLE_MATRIX.md

Complete permission matrix for Ishbor.

**Enforcement:** `src/lib/guards.ts` + `AuthGate`, `ProtectedGate`, `RoleGate`, `AgencyGate`, `AdminOnlyGate`

**User types:** `client` | `freelancer` (account type)  
**Active role:** switchable via RoleSwitcher (`ishbor-active-role-{userId}`)

---

## Platform roles overview

| Role | Auth | Active role | Agency member | Admin flag |
|------|------|-------------|---------------|------------|
| Guest | ❌ | — | — | — |
| Client | ✅ | client | optional | — |
| Freelancer | ✅ | freelancer | optional | — |
| Dual account | ✅ | switchable | optional | — |
| Agency Owner | ✅ | either | owner | — |
| Agency Manager | ✅ | either | manager | — |
| Agency Recruiter | ✅ | either | recruiter | — |
| Agency Member | ✅ | either | freelancer | — |
| Admin | ✅ | client* | — | isAdmin |
| Super Admin | ✅ | client* | — | isAdmin + role |

*Admin demo account uses client userType.

---

## Route access matrix

| Route pattern | Guest | Client | Freelancer | Agency member | Admin |
|---------------|-------|--------|------------|---------------|-------|
| `/`, marketplace public | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/login`, `/register` | ✅ | redirect | redirect | redirect | redirect |
| `/dashboard` | →login | ✅ | →freelancer dash | ✅ | ✅ |
| `/dashboard/freelancer` | →login | →dashboard | ✅ | ✅ | ✅ |
| `/dashboard/agency` | →login | →create** | →create** | ✅ | ✅ |
| `/my-projects`, `/projects/create` | →login | ✅ | →dashboard | →dashboard | ✅ |
| `/checkout` | →login | ✅ | →dashboard | →dashboard | ✅ |
| `/my-services`, `/services/create` | →login | →dashboard | ✅ | →dashboard | ✅ |
| `/applications/*` | →login | →dashboard | ✅ | →dashboard | ✅ |
| `/analytics/client` | →login | ✅ | →dashboard | →dashboard | ✅ |
| `/analytics/freelancer` | →login | →dashboard | ✅ | →dashboard | ✅ |
| `/promotions` | →login | →dashboard | ✅ | →dashboard | ✅ |
| `/clients/manage` | →login | ✅ | →dashboard | →dashboard | ✅ |
| `/freelancers/manage` | →login | →dashboard | ✅ | →dashboard | ✅ |
| `/agency/clients` | →login | →create** | →create** | CRM perm | ✅ |
| `/portfolio/create` | →login | →gate | ✅ | →gate | ✅ |
| `/messages`, `/wallet`, `/settings` | →login | ✅ | ✅ | ✅ | ✅ |
| `/orders/$id`, `/escrow/$id` | →login | participant | participant | participant | ✅ |
| `/admin/*`, `/revenue` | →login/deny | deny | deny | deny | ✅ |

** No agency → redirect `/agencies/create`

---

## Agency permissions (hasAgencyPermission)

| Permission | owner | manager | recruiter | freelancer |
|------------|-------|---------|-----------|------------|
| view_dashboard | ✅ | ✅ | ✅ | ✅ |
| edit_agency | ✅ | ✅ | ❌ | ❌ |
| invite_members | ✅ | ✅ | ❌ | ❌ |
| manage_roles | ✅ | ❌ | ❌ | ❌ |
| view_crm | ✅ | ✅ | ✅ | ❌ |
| publish_agency | ✅ | ❌ | ❌ | ❌ |
| request_verification | ✅ | ❌ | ❌ | ❌ |

---

## Admin RBAC (canAccessSection)

| Section | super_admin | finance_admin | support_admin | moderator |
|---------|:-----------:|:-------------:|:-------------:|:---------:|
| dashboard | ✅ | ✅ | ✅ | ✅ |
| users | ✅ | ❌ | ✅ | ❌ |
| verifications | ✅ | ❌ | ✅ | ❌ |
| projects | ✅ | ❌ | ❌ | ✅ |
| portfolios | ✅ | ❌ | ❌ | ✅ |
| services | ✅ | ❌ | ❌ | ✅ |
| orders | ✅ | ✅ | ✅ | ✅ |
| applications | ✅ | ❌ | ❌ | ✅ |
| escrow | ✅ | ✅ | ✅ | ❌ |
| disputes | ✅ | ✅ | ✅ | ❌ |
| payments | ✅ | ✅ | ❌ | ❌ |
| moderation | ✅ | ❌ | ❌ | ✅ |
| support | ✅ | ❌ | ✅ | ❌ |
| analytics | ✅ | ✅ | ❌ | ❌ |
| audit | ✅ | ✅ | ✅ | ✅ |
| system | ✅ | ❌ | ❌ | ❌ |
| founder | ✅* | ❌ | ❌ | ❌ |
| ai | ✅* | ❌ | ❌ | ❌ |
| revenue | ✅ | partial | ❌ | ❌ |

*Founder/AI routes exist; section gating via nav visibility.

---

## Entity-level access

| Entity | Rule |
|--------|------|
| Order `$id` | ownerUserId OR freelancerUsername OR clientSlug match |
| Escrow `$id` | Via linked order participant check |
| Portfolio edit | ownerUserId + freelancer role |
| Admin user `$id` | Admin only; fake id → EntityNotFound |

---

## Implementation checklist

- [ ] `beforeLoad` guard on route
- [ ] Client gate component where standalone page
- [ ] Layout AuthGate for nested routes
- [ ] Loader fail-closed for sensitive `$id` routes
- [ ] No sensitive data in SSR HTML for guests

---

*Phase 27.3 completed permission hardening. SSR flash remains until cookie auth.*
