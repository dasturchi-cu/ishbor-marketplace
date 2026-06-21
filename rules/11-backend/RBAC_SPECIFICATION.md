# RBAC_SPECIFICATION.md

**Sources:** `ROLE_MATRIX.md`, `admin-roles.ts`, `guards.ts`, `agency-types.ts`, [PERMISSION_MATRIX.md](./auth/PERMISSION_MATRIX.md)  
**Stack:** FastAPI dependency injection (`Depends`), PostgreSQL RLS, Redis session cache  
**Explicitly excluded:** Supabase RLS policies, client-only guards as authoritative enforcement

---

## 1. Permission layers (defense in depth)

```
Layer 1: Authentication       — valid ishbor_sid session or Bearer JWT
Layer 2: Account status       — active (not pending-blocked, suspended, banned)
Layer 3: Platform active role — client | freelancer | agency
Layer 4: Agency permission    — has_agency_permission() per agency action
Layer 5: Admin RBAC           — can_access_section() per admin panel route
Layer 6: Entity ownership     — participant / owner checks on :id routes
Layer 7: PostgreSQL RLS       — row-level backup when service layer omits filter
```

All layers must pass — **fail-closed**. First failure returns 401 or 403 with machine code + Uzbek message.

---

## 2. Platform roles

### Account type (`users.user_type`)
Permanent at registration: `client` | `freelancer`

### Active role (`active_role_preferences.active_role`)
Switchable via `PATCH /auth/active-role`: `client` | `freelancer` | `agency`

| Active role | Dashboard | API namespace bias |
|-------------|-----------|-------------------|
| client | `/dashboard` | projects, checkout, crm/freelancers |
| freelancer | `/dashboard/freelancer` | services, applications, portfolio |
| agency | `/dashboard/agency` | agency/* with member permission |

**Dual accounts:** User with client projects AND freelancer services switches via RoleSwitcher — server stores preference in PostgreSQL, cached in session.

**Admin users:** May have any active role for marketplace UI; admin API checks `is_admin` independently of active role.

---

## 3. FastAPI Depends guard architecture

### 3.1 Dependency chain

| Dependency | Returns | On failure |
|------------|---------|------------|
| `get_session` | Raw session from cookie/JWT | 401 |
| `get_current_user` | `SessionContext` | 401 |
| `require_active_account` | `SessionContext` | 403 ACCOUNT_* |
| `require_role(role)` | `SessionContext` | 403 ROLE_MISMATCH |
| `require_admin_section(section)` | `SessionContext` | 403 ADMIN_FORBIDDEN |
| `require_agency_permission(perm)` | Agency member context | 403 AGENCY_FORBIDDEN |
| `require_participant(entity_getter)` | Entity + user | 403 or 404 |

Dependencies compose — route declares minimum chain via router-level defaults.

### 3.2 Router-level defaults

| Router prefix | Default dependencies |
|---------------|---------------------|
| `/v1/auth/*` (protected) | get_current_user |
| `/v1/projects` POST | require_active_account, require_role(client) |
| `/v1/services` POST | require_active_account, require_role(freelancer) |
| `/v1/admin/*` | require_active_account, require_admin |
| `/v1/agencies/{slug}/*` | require_active_account, require_agency_member |

Public routes (`GET /projects`, `/search`) omit auth dependencies.

### 3.3 SessionContext (request.state.auth)

Attached by `get_current_user` — same shape for cookie and JWT:

| Field | Type | Use |
|-------|------|-----|
| session_id | UUID | Audit, revoke |
| user_id | UUID | Ownership checks |
| email | string | Logging (masked) |
| user_type | client \| freelancer | Registration permanent type |
| active_role | client \| freelancer \| agency | Route role guards |
| is_admin | bool | Admin router entry |
| admin_role | enum \| null | Section matrix |
| account_status | enum | Status guard |

Loaded from Redis cache with PostgreSQL fallback — see [SESSION_MANAGEMENT.md](./auth/SESSION_MANAGEMENT.md).

### 3.4 Error responses

| HTTP | code | When |
|------|------|------|
| 401 | NO_SESSION | Missing cookie/token |
| 401 | SESSION_EXPIRED | Expired session |
| 403 | ACCOUNT_SUSPENDED | account_status suspended |
| 403 | ACCOUNT_BANNED | account_status banned |
| 403 | EMAIL_NOT_VERIFIED | POST blocked for pending users |
| 403 | ROLE_MISMATCH | Wrong active_role |
| 403 | ADMIN_FORBIDDEN | Missing admin section |
| 403 | AGENCY_FORBIDDEN | Missing agency permission |
| 403 | NOT_PARTICIPANT | Entity guard failed |

---

## 4. Route permission matrix (API enforcement)

Mirrors [PERMISSION_MATRIX.md](./auth/PERMISSION_MATRIX.md) — summary below. Frontend gates are UX only.

| Resource | Guest | Client | Freelancer | Agency* | Admin |
|----------|-------|--------|------------|---------|-------|
| GET /projects | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /projects | ❌ | ✅ | ❌ | ❌ | ✅ |
| POST /checkout | ❌ | ✅ | ❌ | ❌ | ✅ |
| POST /services | ❌ | ❌ | ✅ | ❌ | ✅ |
| POST /applications | ❌ | ❌ | ✅ | ❌ | ✅ |
| GET /analytics/client | ❌ | ✅ | ❌ | ❌ | ✅ |
| GET /analytics/freelancer | ❌ | ❌ | ✅ | ❌ | ✅ |
| GET /promotions | ❌ | ❌ | ✅ | ❌ | ✅ |
| GET /agency/clients | ❌ | ❌** | ❌** | view_crm | ✅ |
| GET /admin/* | ❌ | ❌ | ❌ | ❌ | ✅ |

*Agency member with appropriate permission  
**No agency membership → 403 AGENCY_MEMBERSHIP_REQUIRED

Full matrix: 20 resource sections in PERMISSION_MATRIX.md.

---

## 5. Agency permissions

Enum: `AgencyPermission`

| Permission | owner | manager | recruiter | member |
|------------|:-----:|:-------:|:---------:|:------:|
| view_dashboard | ✅ | ✅ | ✅ | ✅ |
| edit_agency | ✅ | ✅ | ❌ | ❌ |
| invite_members | ✅ | ✅ | ❌ | ❌ |
| manage_roles | ✅ | ❌ | ❌ | ❌ |
| view_crm | ✅ | ✅ | ✅ | ❌ |
| publish_agency | ✅ | ❌ | ❌ | ❌ |
| request_verification | ✅ | ❌ | ❌ | ❌ |

### FastAPI Depends: `require_agency_permission(permission)`

| Step | Action |
|------|--------|
| 1 | Resolve agency_id from path slug |
| 2 | Query `agency_members` WHERE user_id AND agency_id AND status=active |
| 3 | Map member.role → permission set |
| 4 | Pass if permission granted; else 403 AGENCY_FORBIDDEN |

**Active role gate:** User must have `active_role=agency` OR valid membership when hitting agency routes — both checked.

**Implementation location:** `AgencyService.has_permission(user_id, agency_id, permission)` — single source called by Depends.

---

## 6. Admin RBAC

### Roles (`admin_role_assignments.admin_role`)

| Role | Label (UZ) |
|------|------------|
| super_admin | Super admin |
| finance_admin | Moliya admini |
| support_admin | Qo'llab-quvvatlash admini |
| moderator | Moderator |

### Section access (`can_access_section`)

| Section | super | finance | support | moderator |
|---------|:-----:|:-------:|:-------:|:---------:|
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

*Founder/AI: super_admin only via nav + API guard

### FastAPI Depends: `require_admin_section(section)`

| Step | Action |
|------|--------|
| 1 | Verify `session.is_admin == true` |
| 2 | Load `admin_role` from session (cached at login) |
| 3 | Call `can_access_section(admin_role, section)` |
| 4 | Pass or 403 ADMIN_FORBIDDEN |

Admin router applies `require_admin` at prefix; each route adds section-specific dependency.

### Admin action permissions

| Action | Required role |
|--------|---------------|
| Suspend/ban user | super_admin, support_admin |
| Verify user KYC | super_admin, support_admin |
| Release escrow (admin) | super_admin, finance_admin |
| Refund escrow | super_admin, finance_admin |
| Resolve dispute | super_admin, finance_admin, support_admin |
| Moderate content | super_admin, moderator |
| System config read/write | super_admin |

All admin mutations → `audit_logs` INSERT (immutable).

---

## 7. Entity-level guards

Applied as FastAPI dependencies or service-layer checks after entity load.

### Orders (`/orders/{id}`)
Participant if: `order.client_user_id == user.id` OR `order.freelancer_user_id == user.id` OR admin with orders section.

### Escrow (`/escrow/{id}`)
Participant via linked order participant check.

### Portfolio edit (`/portfolio/{slug}`)
Owner: `portfolio.owner_user_id == user.id` AND `active_role == freelancer`.

### Application accept
Project owner: `project.owner_user_id == user.id` AND `active_role == client`.

### Messages / conversations
Participant via `conversation_participants` join — same rule for REST and WS subscribe ACL.

### Wallet / payment methods
Owner: `resource.user_id == user.id` — no admin read except payments section audit.

### Files
Owner or attached to public entity (published project/service).

**404 vs 403:** Non-existent entity → 404 ENTITY_NOT_FOUND. Exists but no access → 403 NOT_PARTICIPANT (avoid IDOR enumeration).

---

## 8. PostgreSQL RLS mapping

Application sets session variables per transaction via SQLAlchemy event:

| Variable | Value |
|----------|-------|
| `app.current_user_id` | session.user_id |
| `app.is_admin` | `'true'` \| `'false'` |
| `app.active_role` | session.active_role |

| Policy name | Table | Rule |
|-------------|-------|------|
| users_self_read | users | id = current_user_id OR public profile view |
| projects_public_read | projects | status=published OR owner = current_user |
| orders_participant | orders | client or freelancer = current_user |
| wallet_owner | wallets | user_id = current_user |
| messages_participant | messages | via conversation_participants join |
| admin_bypass | all | app.is_admin = true |

Service role (backend workers) bypasses RLS for checkout/escrow ledger operations — worker identity only, not user sessions.

---

## 9. WebSocket ACL alignment

REST entity guards mirror WS channel ACL — see [WEBSOCKET_SECURITY.md](./websockets/WEBSOCKET_SECURITY.md).

| REST guard | WS equivalent |
|------------|---------------|
| Conversation participant | subscribe conversation:{id} |
| Self only | user:{self}:notifications, user:{self}:messages |
| Admin dashboard | admin:activity |

Same `SessionContext` loaded at WS handshake — no separate permission model.

---

## 10. Account status overrides

| Status | Depends behavior |
|--------|------------------|
| pending (unverified) | GET allowed; POST projects/services/checkout blocked at require_active_account |
| active | Full matrix |
| suspended | All authenticated routes → 403 ACCOUNT_SUSPENDED except logout |
| banned | All → 403 ACCOUNT_BANNED |

Status refreshed from PostgreSQL on session validation cache miss — admin suspend propagates within Redis TTL max 5 min unless force invalidate on admin action.

---

## 11. Testing requirements

| Test | Expect |
|------|--------|
| Guest POST /projects | 401 |
| Freelancer POST /projects | 403 ROLE_MISMATCH |
| Client POST /checkout | 200 |
| Agency recruiter GET /agency/clients | 200 with view_crm |
| Agency member GET /agency/clients | 403 |
| Moderator GET /admin/payments | 403 ADMIN_FORBIDDEN |
| finance_admin POST admin escrow release | 200 |
| User A GET /orders/{user_B_order} | 403 NOT_PARTICIPANT |
| WS subscribe foreign notifications | FORBIDDEN |

---

## 12. Frontend migration

| Current | Target |
|---------|--------|
| `requireRole()` in guards.ts | API returns 403 + redirect hint in body |
| `AuthGate` / `RoleGate` | Handle 401/403 from API |
| `AgencyGate` | 403 AGENCY_FORBIDDEN → /agencies/create |
| `AdminOnlyGate` | 403 ADMIN_FORBIDDEN → /dashboard |
| `auth-bootstrap.js` | Server cookie session |
| Client-only admin check | Server admin RBAC on every `/admin/*` |

Frontend gates remain for UX prefetch — never sole enforcement.

---

## 13. Related documents

| Document | Topic |
|----------|-------|
| [PERMISSION_MATRIX.md](./auth/PERMISSION_MATRIX.md) | Full role × resource matrix |
| [AUTH_ARCHITECTURE.md](./auth/AUTH_ARCHITECTURE.md) | Session model |
| [ROLE_MATRIX.md](../02-integration/ROLE_MATRIX.md) | Frontend routes |
| [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md) | Threat model |
| [WEBSOCKET_SECURITY.md](./websockets/WEBSOCKET_SECURITY.md) | WS ACL |

---

*Enforces PROJECT_BIBLE §13 — FastAPI Depends guards, agency roles, admin RBAC, entity ownership, PostgreSQL RLS.*
