# ADMIN_OS_BACKEND.md

**Stack:** FastAPI admin router · PostgreSQL views · Redis cache · Celery · audit_logs  
**Frontend:** 22 admin routes under `/admin/*` ([ADMIN_FLOW_MAP.md](../../12-system-maps/ADMIN_FLOW_MAP.md))  
**Replaces:** `admin-data-store`, `admin-store` localStorage snapshots

---

## 1. Purpose

Server-authoritative admin operations for Ishbor marketplace:

- User safety (suspend, ban, verify)
- Content moderation (projects, services, portfolios)
- Financial intervention (escrow release, refund, payment review)
- Support tickets and disputes
- Platform analytics and founder metrics
- Immutable audit trail

**Rule:** Admin reads never merge mock-data. All counts come from PostgreSQL views or Redis-cached aggregates refreshed every 60s.

---

## 2. FastAPI module layout

```
app/
├── routers/admin/
│   ├── dashboard.py      # GET /admin/dashboard/stats
│   ├── users.py          # CRUD + suspend/ban/verify
│   ├── verifications.py  # KYC queue
│   ├── projects.py
│   ├── services.py
│   ├── portfolios.py
│   ├── orders.py
│   ├── escrow.py         # release, refund, freeze
│   ├── disputes.py
│   ├── payments.py
│   ├── applications.py
│   ├── moderation.py
│   ├── support.py
│   ├── analytics.py
│   ├── audit.py
│   ├── system.py         # health, feature flags
│   ├── founder.py        # revenue, GMV, cohorts
│   └── ai.py             # AI usage logs
├── services/admin_service.py
├── repositories/admin_views.py
└── dependencies/admin_rbac.py
```

All routes prefixed: `/api/v1/admin/*`  
OpenAPI tag: `admin`  
Auth: `Depends(require_admin)` + optional `Depends(require_admin_role("finance"))`

---

## 3. Admin RBAC roles

| Role | Permissions | MFA required |
|------|-------------|--------------|
| `support` | users read, support tickets, moderation read | No |
| `moderator` | moderation write, content pause/reject | No |
| `finance` | escrow release/refund, payments, revenue read | **Yes** |
| `superadmin` | all + role assignment, system config | **Yes** |

Stored in `admin_role_assignments` table.  
See [PERMISSION_MATRIX.md](../auth/PERMISSION_MATRIX.md) and [RBAC_POLICIES.md](../security/RBAC_POLICIES.md).

---

## 4. Critical admin actions (API contract)

| Action | Method | Path | Side effects |
|--------|--------|------|--------------|
| Suspend user | POST | `/admin/users/{id}/suspend` | `account_status=suspended`, revoke all sessions, audit |
| Ban user | POST | `/admin/users/{id}/ban` | permanent block, audit |
| Approve verification | POST | `/admin/verifications/{id}/approve` | `users.verified=true`, notification |
| Reject service | POST | `/admin/services/{id}/reject` | `status=paused`, notify owner |
| Release escrow | POST | `/admin/escrow/{id}/release` | atomic wallet+escrow TX, revenue_ledger fee |
| Refund escrow | POST | `/admin/escrow/{id}/refund` | ledger credit client, audit finance |
| Resolve dispute | POST | `/admin/disputes/{id}/resolve` | split or full refund per decision |
| Add audit entry | automatic | — | every mutating admin action |

Idempotency-Key required on all financial admin mutations.

---

## 5. Database views (read models)

| View | Purpose | Refresh |
|------|---------|---------|
| `v_admin_dashboard_stats` | users, orders, GMV, open disputes | 60s MV |
| `v_admin_moderation_queue` | pending reports | realtime |
| `v_admin_verification_queue` | KYC pending | realtime |
| `v_admin_escrow_at_risk` | disputed + overdue milestones | 5 min |
| `v_admin_revenue_daily` | founder dashboard | nightly + on-demand |

Materialized views refreshed by Celery task `admin.refresh_dashboard_stats`.

---

## 6. Audit log integration

Every admin mutation writes to `audit_logs`:

```json
{
  "actor_user_id": "uuid",
  "actor_admin_role": "finance",
  "action": "escrow.admin_release",
  "target_type": "escrow_workflow",
  "target_id": "ew-123",
  "ip_address": "203.0.113.1",
  "request_id": "req_abc",
  "metadata": { "milestone_id": "m1", "amount_usd": 4000 },
  "result": "success"
}
```

Financial audit entries: **7-year retention**, no soft-delete.  
See [AUDIT_LOG_SYSTEM.md](../security/AUDIT_LOG_SYSTEM.md).

---

## 7. Security controls

| Control | Implementation |
|---------|----------------|
| Admin flag source | `users.is_admin` from DB only — never trust client |
| Session | Same `ishbor_sid` cookie + `is_admin` check |
| MFA | TOTP required for finance/superadmin (Phase 2) |
| IP allowlist | nginx `allow` directive for `/admin` in production (optional) |
| Rate limit | `ishbor:rl:admin:{user_id}` — 120 req/min |
| CSRF | Same-origin POST + double-submit token for admin forms |

---

## 8. WebSocket admin channel

Channel: `admin:events` (superadmin/moderator only)

Events:
- `moderation.new` — new report in queue
- `dispute.opened` — urgent badge in nav
- `system.alert` — health degradation

Published via Redis pub/sub. See [NOTIFICATION_EVENTS.md](../websockets/NOTIFICATION_EVENTS.md).

---

## 9. Frontend migration

| Current store | Target API |
|---------------|------------|
| `getAdminUsers()` | `GET /admin/users?page=` |
| `suspendAdminUser()` | `POST /admin/users/{id}/suspend` |
| `getAdminEscrowList()` | `GET /admin/escrow?status=` |
| `addAuditEntry()` | server-side automatic |
| `getAdminDisputes()` | `GET /admin/disputes` |

Remove `ishbor-admin-data` localStorage when `VITE_API_MODE=remote`.

---

## 10. Scalability

- Admin list endpoints: cursor pagination, max 100/page
- Heavy founder analytics: pre-aggregated `revenue_ledger` + nightly rollups
- Export CSV: async Celery job → MinIO presigned download
- Target: 10 concurrent admin users, 1000 open tickets without query > 200ms

See [SCALABILITY_ARCHITECTURE.md](../SCALABILITY_ARCHITECTURE.md).
