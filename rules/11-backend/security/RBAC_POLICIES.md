# RBAC_POLICIES.md

**Format:** Policy rules as executable pseudocode  
**Enforcement:** FastAPI middleware + service guards + PostgreSQL RLS  
**Sources:** RBAC_SPECIFICATION.md, admin-roles.ts, guards.ts, ROLE_MATRIX.md

---

## 1. Policy evaluation order

```python
def authorize(request, resource, action) -> AuthResult:
    # Layer 1: Authentication
    if not request.session:
        return DENY("UNAUTHENTICATED")

    # Layer 2: Account status
    if request.user.account_status != "active":
        return DENY("ACCOUNT_SUSPENDED")

    # Layer 3: Route-level RBAC
    if not check_route_permission(request.path, request.method, request.user):
        return DENY("ROUTE_FORBIDDEN")

    # Layer 4: Admin RBAC (if admin route)
    if request.path.startswith("/admin"):
        if not check_admin_section(request.user, request.path):
            return DENY("ADMIN_FORBIDDEN")

    # Layer 5: Entity ownership
    if resource:
        if not check_entity_access(request.user, resource, action):
            return DENY("ENTITY_FORBIDDEN")

    # Layer 6: Agency permission (if agency context)
    if request.agency_id:
        if not has_agency_permission(request.user, request.agency_id, action):
            return DENY("AGENCY_FORBIDDEN")

    return ALLOW
```

All layers MUST pass. First DENY wins.

---

## 2. Platform role policies

```python
ROUTE_POLICIES = {
    ("POST", "/v1/projects"):          lambda u: u.active_role == "client",
    ("POST", "/v1/checkout/*"):        lambda u: u.active_role == "client",
    ("POST", "/v1/services"):          lambda u: u.active_role == "freelancer",
    ("POST", "/v1/applications"):      lambda u: u.active_role == "freelancer",
    ("GET",  "/v1/analytics/client"):   lambda u: u.active_role == "client",
    ("GET",  "/v1/analytics/freelancer"): lambda u: u.active_role == "freelancer",
    ("GET",  "/v1/promotions"):        lambda u: u.active_role == "freelancer",
    ("GET",  "/v1/agency/clients"):    lambda u: agency_perm(u, "view_crm"),
}
```

Guest (no session): only public GET routes (projects, services, portfolios, agencies).

---

## 3. Entity ownership policies

```python
def check_entity_access(user, resource, action) -> bool:
    match resource.type:
        case "order":
            return user.id in (resource.client_user_id, resource.freelancer_user_id)
        case "escrow":
            order = get_order(resource.order_id)
            return user.id in (order.client_user_id, order.freelancer_user_id)
        case "wallet":
            return user.id == resource.user_id
        case "conversation":
            return user.id in resource.participant_ids
        case "project":
            if action == "read": return resource.status == "open" or is_owner(user, resource)
            return resource.client_user_id == user.id
        case "service":
            if action == "read": return True
            return resource.freelancer_user_id == user.id
        case "portfolio":
            if action == "read" and resource.published: return True
            return resource.user_id == user.id
        case "file":
            return check_file_acl(user, resource)
    return False
```

---

## 4. Escrow action policies

```python
def can_release_milestone(user, escrow, milestone) -> bool:
    if escrow.frozen_by_admin:
        return False
    if escrow.status == "disputed":
        return False
    if milestone.status != "funded":
        return False
    order = get_order(escrow.order_id)
    return user.id == order.client_user_id  # Client only

def can_open_dispute(user, escrow) -> bool:
    if escrow.status in ("completed", "proposal"):
        return False
    if escrow.frozen_by_admin:
        return False
    order = get_order(escrow.order_id)
    return user.id in (order.client_user_id, order.freelancer_user_id)

def can_admin_freeze_escrow(user, escrow) -> bool:
    return has_admin_role(user, "finance_admin")
```

---

## 5. Admin RBAC policies

```python
ADMIN_SECTIONS = {
    "users":           ["super_admin", "user_admin"],
    "orders":          ["super_admin", "order_admin"],
    "escrow":          ["super_admin", "finance_admin"],
    "disputes":        ["super_admin", "finance_admin", "moderation_admin"],
    "payments":        ["super_admin", "finance_admin"],
    "verifications":   ["super_admin", "verification_admin"],
    "moderation":      ["super_admin", "moderation_admin"],
    "analytics":       ["super_admin", "founder"],
    "system":          ["super_admin"],
    "audit":           ["super_admin", "founder"],
}

def check_admin_section(user, path) -> bool:
    if not user.is_admin:
        return False
    section = extract_admin_section(path)  # e.g. /admin/disputes → "disputes"
    roles = get_admin_roles(user.id)  # from admin_role_assignments
    allowed = ADMIN_SECTIONS.get(section, [])
    return any(role in allowed for role in roles)
```

Maps `canAccessSection()` in admin-roles.ts.

---

## 6. Financial action policies

```python
def can_withdraw(user, amount) -> bool:
    if user.account_status != "active":
        return False
    if amount > user.wallet.available:
        return False
    if daily_withdrawal_total(user) + amount > DAILY_WITHDRAWAL_LIMIT:
        return False
    return True

def can_admin_refund(user, escrow) -> bool:
    return has_admin_role(user, "finance_admin")

def can_admin_override_wallet(user) -> bool:
    return has_admin_role(user, "finance_admin")  # logged in audit_logs
```

No API endpoint allows arbitrary balance set — admin refunds go through RefundService only.

---

## 7. Agency permission policies

```python
AGENCY_PERMISSIONS = {
    "owner":     ["view_dashboard","edit_agency","invite_members","manage_roles",
                  "view_crm","publish_agency","request_verification"],
    "manager":   ["view_dashboard","edit_agency","invite_members",
                  "view_crm"],
    "recruiter": ["view_dashboard","view_crm"],
    "freelancer": ["view_dashboard"],
}

def has_agency_permission(user, agency_id, permission) -> bool:
    member = get_agency_member(user.id, agency_id)
    if not member:
        return False
    return permission in AGENCY_PERMISSIONS.get(member.role, [])
```

---

## 8. PostgreSQL RLS policies (pseudocode)

```sql
-- wallets: owner read only
CREATE POLICY wallets_select ON wallets
  FOR SELECT USING (user_id = current_setting('app.user_id')::uuid);

-- orders: participant read
CREATE POLICY orders_select ON orders
  FOR SELECT USING (
    client_user_id = current_setting('app.user_id')::uuid OR
    freelancer_user_id = current_setting('app.user_id')::uuid OR
    current_setting('app.is_admin')::boolean = true
  );

-- escrow_workflows: via order participant
CREATE POLICY escrow_select ON escrow_workflows
  FOR SELECT USING (is_order_participant(order_id));

-- wallet_transactions: owner read
CREATE POLICY wallet_tx_select ON wallet_transactions
  FOR SELECT USING (user_id = current_setting('app.user_id')::uuid);

-- All INSERT/UPDATE/DELETE on financial tables: service role only
-- (no user-facing mutation policies)
```

FastAPI sets `app.user_id` and `app.is_admin` per connection via middleware.

---

## 9. Subscription enforcement policies

```python
def can_submit_proposal(user) -> bool:
    sub = get_subscription(user.id)
    if sub.plan == "free":
        usage = get_monthly_proposal_count(user.id)
        return usage < 10
    return sub.status == "active"

def can_create_service(user) -> bool:
    sub = get_subscription(user.id)
    limits = {"free": 3, "pro": 20, "elite": float("inf")}
    count = count_user_services(user.id)
    return count < limits[sub.plan]
```

Enforced in API before INSERT — not client-side.

---

## 10. Policy testing requirements

| Test | Assert |
|------|--------|
| Client cannot POST /services | 403 |
| Freelancer cannot POST /checkout | 403 |
| Non-participant cannot GET /orders/{id} | 403 |
| Guest cannot GET /wallet | 401 |
| moderation_admin cannot access /admin/payments | 403 |
| finance_admin can POST /admin/escrow/{id}/refund | 200 |
| RLS blocks direct SQL as wrong user | 0 rows |

---

## 11. Related documents

- [../RBAC_SPECIFICATION.md](../RBAC_SPECIFICATION.md)
- [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md)
- [AUDIT_LOG_SYSTEM.md](./AUDIT_LOG_SYSTEM.md)
- [../payments/ESCROW_SYSTEM.md](../payments/ESCROW_SYSTEM.md)

---

*Policies are code — not documentation-only. Every rule here maps to a FastAPI guard or PostgreSQL RLS policy enforced at runtime.*
