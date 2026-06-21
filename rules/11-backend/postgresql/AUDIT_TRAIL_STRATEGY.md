# AUDIT_TRAIL_STRATEGY.md

**Project:** Ishbor Marketplace  
**Primary table:** `audit_logs` — append-only, immutable  
**Financial companion:** `wallet_transactions`, `escrow_timeline_events`, `revenue_ledger`  
**Related:** [AUDIT_LOG_SYSTEM.md](../security/AUDIT_LOG_SYSTEM.md), [ADMIN_OS_BACKEND.md](../admin/ADMIN_OS_BACKEND.md)

---

## 1. Purpose

Ishbor operates a real-money marketplace (escrow, wallet, subscriptions). Audit trail requirements:

- **Non-repudiation** — prove who changed what and when
- **Financial immutability** — ledger rows never UPDATE/DELETE
- **Admin accountability** — every override (refund, freeze, ban) logged with reason
- **Dispute evidence** — escrow state before/after resolution
- **Compliance** — 7-year retention for financial and admin actions (Uzbekistan + platform policy)

Distinct from:

| System | Purpose |
|--------|---------|
| Application logs (structlog → Loki) | Debug, latency, request tracing |
| `analytics_events` | Product metrics — not legal audit |
| `wallet_transactions` | Money movement — not intent/reason |

---

## 2. `audit_logs` schema

```sql
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID REFERENCES users(id),
  actor_type    VARCHAR(20) NOT NULL,       -- user | admin | system
  category      audit_category NOT NULL,    -- enum
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50),
  entity_id     UUID,
  before_state  JSONB,
  after_state   JSONB,
  metadata      JSONB DEFAULT '{}',
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:**

```sql
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_category ON audit_logs(category, created_at DESC);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

### 2.1 Immutability enforcement

```sql
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
```

Application code must never call UPDATE/DELETE on this table. Migrations that touch audit_logs require founder approval.

---

## 3. Actor types

| actor_type | When |
|------------|------|
| `user` | Self-serve actions requiring audit (delete account request, open dispute) |
| `admin` | Any `/api/v1/admin/*` mutation with side effects |
| `system` | Celery jobs (subscription renewal, reconciliation, auto-escalation) |

`actor_id` NULL only for system actions where no user context exists (e.g. nightly reconciliation).

---

## 4. Category and action catalog

### 4.1 Admin — users (`category = user`)

| action | entity_type | before/after |
|--------|-------------|--------------|
| `user_suspended` | user | `account_status` |
| `user_banned` | user | `account_status` |
| `user_reactivated` | user | `account_status` |
| `admin_role_granted` | user | `admin_role_assignments` |
| `admin_role_revoked` | user | `admin_role_assignments` |
| `user_data_exported` | user | metadata: `{ "format": "json" }` |
| `user_delete_requested` | user | metadata: `{ "scheduled_at": "..." }` |

Maps `/admin/users/$id` actions.

### 4.2 Admin — financial (`category = payment` | `escrow`)

| action | entity_type | before/after |
|--------|-------------|--------------|
| `escrow_frozen` | escrow | `frozen_by_admin`, `status` |
| `escrow_unfrozen` | escrow | `frozen_by_admin` |
| `escrow_milestone_released` | escrow | milestone statuses, wallet balances |
| `escrow_refund` | escrow | full refund — maps `adminRefundEscrow()` |
| `dispute_opened` | dispute | escrow status → disputed |
| `dispute_assigned` | dispute | `assigned_admin_id`, status → pending |
| `dispute_resolved` | dispute | `resolution` JSON, escrow final state |
| `gateway_refund` | payment | `payment_records.status` |
| `withdrawal_approved` | payment | withdrawal request status |
| `withdrawal_rejected` | payment | reason in metadata |
| `wallet_adjustment` | payment | **disabled in v1** — if ever enabled, MFA + founder only |

Maps `/admin/escrow/$id`, `/admin/disputes`, `/admin/payments`.

**MFA requirement:** `escrow_refund`, `gateway_refund`, `withdrawal_approved` > 5000 USD equivalent require step-up token in metadata:

```json
{ "mfa_verified_at": "2026-06-20T10:00:00Z", "reason": "Nizo hal qilindi — mijoz foydasiga" }
```

### 4.3 Admin — moderation (`category = moderation`)

| action | entity_type |
|--------|-------------|
| `verification_approved` | verification_request |
| `verification_rejected` | verification_request |
| `content_removed` | project \| service \| review |
| `content_restored` | project \| service |
| `moderation_warning` | user |
| `moderation_item_resolved` | moderation_item |

Maps `updateModerationItem` in admin-data-store → `PATCH /api/v1/admin/moderation/:id`.

### 4.4 Marketplace (`category = admin`)

| action | entity_type |
|--------|-------------|
| `project_admin_status_changed` | project |
| `service_admin_status_changed` | service |
| `featured_listing_granted` | service \| project |

Syncs admin project/service queues with `updateProjectStatus`, `updateServiceStatus`.

### 4.5 System (`category = system`)

| action | Notes |
|--------|-------|
| `reconciliation_discrepancy` | Wallet vs escrow pool mismatch |
| `subscription_renewal_failed` | Auto billing failure |
| `dispute_sla_breach` | Open > 72h — Celery alert |
| `backup_failed` | Infrastructure |
| `rate_limit_lockout` | Aggregated hourly |

---

## 5. Financial immutability layers

Ishbor uses three complementary immutable stores:

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  audit_logs     │     │ wallet_transactions  │     │ revenue_ledger  │
│  Who + why      │     │ Money in/out         │     │ Platform fee    │
│  before/after   │     │ running_balance      │     │ GMV snapshots   │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
         │                          │                          │
         └──────────────────────────┴──────────────────────────┘
                    Same SQL transaction on admin refund
```

### 5.1 `wallet_transactions`

- **Never UPDATE/DELETE** — archival to cold storage only after 7 years
- Every escrow fund/release/refund creates row with `related_escrow_id`, `idempotency_key`
- `category = 'refund'` on all refund paths (REFUND_LIFECYCLE.md)

### 5.2 `escrow_timeline_events`

Append-only UI timeline — maps escrow-store `timeline[]`:

| step (Uzbek) | Trigger |
|--------------|---------|
| Taklif qabul qilindi | Order created |
| Eskrou to'ldirildi | fundEscrow |
| Nizo ochildi | openEscrowDispute |
| Mablag' chiqarildi | releaseEscrowMilestone |
| Mijozga qaytarildi | refundEscrowToClient |

Not a substitute for audit_logs — no actor/reason field. Used for participant transparency.

### 5.3 `revenue_ledger`

Platform 5% fee on milestone release — append-only. Admin revenue dashboard (`/admin/revenue`) reads aggregates; source rows immutable.

---

## 6. AuditService integration

Called **inside the same SQL transaction** as the audited mutation:

```python
class AuditService:
    async def log(
        self,
        *,
        actor: User | None,
        category: AuditCategory,
        action: str,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        before: dict | None = None,
        after: dict | None = None,
        request: Request | None = None,
        reason: str | None = None,
        extra: dict | None = None,
    ) -> None:
        ...
```

**Async via Celery fallback:** If transaction commits but audit insert failed (rare), `ishbor.audit.log_event` retries with `event_id` idempotency — must eventually succeed. Money mutations **block commit** if audit insert fails in v1.

---

## 7. Admin audit viewer

**Route:** `/admin/audit`  
**API:**

```
GET /api/v1/admin/audit?category=escrow&from=2026-06-01&to=2026-06-20&page=1&limit=50
```

**Permissions:** `super_admin`, `founder` — read only. `finance_admin` sees `payment` + `escrow` categories only.

**Response:**

```json
{
  "data": [{
    "id": "...",
    "actor": { "id": "...", "fullName": "Admin User" },
    "category": "escrow",
    "action": "dispute_resolved",
    "entityType": "dispute",
    "entityId": "...",
    "beforeState": { "escrowStatus": "disputed" },
    "afterState": { "escrowStatus": "completed" },
    "metadata": { "reason": "..." },
    "ipAddress": "203.0.113.1",
    "createdAt": "2026-06-20T14:30:00Z"
  }],
  "meta": { "page": 1, "total": 842 }
}
```

**Export:** `GET /api/v1/admin/audit/export?format=csv` — async job for large ranges.

---

## 8. Dispute resolution audit example

Maps `updateDispute` + `adminRefundEscrow` / `adminReleaseEscrow`:

```json
{
  "category": "escrow",
  "action": "dispute_resolved",
  "entity_type": "dispute",
  "entity_id": "d-550e8400-...",
  "actor_id": "33333333-...-000003",
  "before_state": {
    "dispute_status": "pending",
    "escrow_status": "disputed",
    "milestones": [
      { "label": "Kickoff & discovery", "status": "disputed", "amount": 6000 },
      { "label": "Final delivery", "status": "funded", "amount": 6000 }
    ],
    "client_wallet_escrow_held": 12000
  },
  "after_state": {
    "dispute_status": "closed",
    "escrow_status": "completed",
    "resolution": {
      "code": "split",
      "client_percent": 60,
      "freelancer_percent": 40
    },
    "client_wallet_available_delta": 7200,
    "freelancer_wallet_available_delta": 4800
  },
  "metadata": {
    "reason": "Birinchi bosqich bajarilgan, ikkinchisi yo'q",
    "ticket_id": "SUP-1042",
    "mfa_verified_at": "2026-06-20T15:00:00Z"
  }
}
```

---

## 9. Security events (mandatory audit)

| Event | action |
|-------|--------|
| Failed admin panel access | `admin_access_denied` |
| Admin role change | `admin_role_granted` / `revoked` |
| Large withdrawal approval | `withdrawal_approved` |
| Webhook signature failure (hourly aggregate) | `webhook_auth_failure` |
| Account deletion completed | `user_purged` |
| PII export downloaded | `user_data_exported` |

---

## 10. Retention and archival

| Phase | Duration | Storage |
|-------|----------|---------|
| Hot | 0–24 months | Primary PostgreSQL |
| Warm | 24–84 months | `audit_logs_archive` read replica |
| Cold | 7 years total | Compressed S3 + pg_dump |

**Never delete** audit_logs before 7-year retention expires. See DATA_RETENTION_POLICY.md.

Legal hold flag on `entity_id` blocks archival for active litigation.

---

## 11. Distinction summary

| Question | Answer in |
|----------|-----------|
| Who clicked refund? | `audit_logs.actor_id`, `metadata.reason` |
| How much money moved? | `wallet_transactions.amount` |
| What did escrow status change from/to? | `audit_logs.before_state`, `after_state` |
| What does user see in escrow UI? | `escrow_timeline_events` |
| Platform fee collected? | `revenue_ledger` |

---

## 12. Testing checklist

| Test | Assert |
|------|--------|
| DB trigger | UPDATE audit_logs raises exception |
| Admin refund | audit + wallet_tx in same transaction |
| Dispute resolve | before_state captures milestone snapshot |
| Audit viewer RBAC | finance_admin cannot see user category |
| Celery retry | Failed audit eventually inserts without duplicate |

---

## 13. Related documents

- [DATA_RETENTION_POLICY.md](./DATA_RETENTION_POLICY.md)
- [SOFT_DELETE_STRATEGY.md](./SOFT_DELETE_STRATEGY.md)
- [REFUND_FLOW.md](../payments/REFUND_FLOW.md)
- [DISPUTE_FLOW.md](../payments/DISPUTE_FLOW.md)
- [WALLET_SYSTEM.md](../payments/WALLET_SYSTEM.md)
- [DISPUTE_LIFECYCLE.md](../../17-marketplace/DISPUTE_LIFECYCLE.md)

---

*audit_logs is append-only with DB-level immutability. Every admin financial action requires audit entry with actor, reason, and before/after state in the same transaction as wallet mutations.*
