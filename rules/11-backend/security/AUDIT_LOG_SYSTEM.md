# AUDIT_LOG_SYSTEM.md

**Table:** `audit_logs` — append-only, immutable  
**Scope:** Admin actions, security events, financial overrides  
**Retention:** 7 years

---

## 1. Purpose

Audit logs provide non-repudiation for:

- Admin mutations (suspend user, resolve dispute, refund escrow)
- Security events (failed admin access, role changes)
- Financial overrides (admin refund, wallet freeze)
- Moderation actions (content removal, verification approve/reject)

Distinct from application logs (stdout) and financial ledger (`wallet_transactions`).

---

## 2. Schema

Maps DATABASE_SCHEMA.md `audit_logs`:

```sql
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID REFERENCES users(id),  -- NULL for system actions
  actor_type    VARCHAR(20) NOT NULL,       -- user | admin | system
  category      VARCHAR(50) NOT NULL,       -- user | admin | escrow | payment | moderation | system
  action        VARCHAR(100) NOT NULL,      -- e.g. dispute_resolved, user_suspended
  entity_type   VARCHAR(50),               -- order | escrow | user | dispute
  entity_id     UUID,
  before_state  JSONB,
  after_state   JSONB,
  metadata      JSONB,                     -- IP, user_agent, reason, ticket_id
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_category ON audit_logs(category, created_at DESC);
```

**No UPDATE or DELETE** — enforced by application code and DB trigger:

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

---

## 3. Audited actions catalog

### Admin — users

| Action | category | before/after |
|--------|----------|--------------|
| `user_suspended` | user | account_status |
| `user_banned` | user | account_status |
| `user_reactivated` | user | account_status |
| `admin_role_granted` | admin | admin_role_assignments |
| `admin_role_revoked` | admin | admin_role_assignments |

### Admin — financial

| Action | category | before/after |
|--------|----------|--------------|
| `escrow_frozen` | escrow | frozen_by_admin |
| `escrow_unfrozen` | escrow | frozen_by_admin |
| `dispute_resolved` | escrow | dispute.resolution, escrow.status |
| `escrow_refund` | payment | wallet balances, milestone statuses |
| `gateway_refund` | payment | payment_records.status |
| `withdrawal_approved` | payment | withdrawal status |

### Admin — moderation

| Action | category | before/after |
|--------|----------|--------------|
| `verification_approved` | moderation | verification_documents.status |
| `verification_rejected` | moderation | verification_documents.status |
| `content_removed` | moderation | entity status |
| `moderation_warning` | moderation | moderation_items |

### System

| Action | category |
|--------|----------|
| `reconciliation_discrepancy` | system |
| `backup_failed` | system |
| `rate_limit_lockout` | system |

---

## 4. AuditService implementation

```python
class AuditService:
    async def log(
        self,
        actor: User | None,
        category: str,
        action: str,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        before: dict | None = None,
        after: dict | None = None,
        request: Request | None = None,
        reason: str | None = None,
    ):
        await db.execute(
            insert(AuditLog).values(
                actor_id=actor.id if actor else None,
                actor_type="admin" if actor and actor.is_admin else "user" if actor else "system",
                category=category,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                before_state=before,
                after_state=after,
                metadata={"reason": reason} if reason else {},
                ip_address=request.client.host if request else None,
            )
        )
        # NOT stdout — DB only for audit
```

Called synchronously within the same SQL transaction as the audited mutation when possible.

---

## 5. Admin audit viewer

Maps `/admin/audit` — query interface:

```
GET /admin/audit?category=escrow&from=2026-06-01&to=2026-06-20&page=1
  → Permission: super_admin, founder
  → Returns paginated audit_logs with actor name
  → Export CSV for compliance
```

Filters: category, action, actor_id, entity_type, entity_id, date range.

---

## 6. Security events logging

Security events that MUST be audited:

- Failed admin panel access (wrong role)
- Admin role assignment changes
- Large withdrawal approval (>5000 USD)
- Manual wallet adjustment (if ever allowed)
- Webhook signature verification failures (aggregated hourly)
- Account deletion requests

---

## 7. Distinction from wallet_transactions

| audit_logs | wallet_transactions |
|------------|---------------------|
| Who did what (actor) | What money moved |
| Admin intent + reason | Amount + balance |
| All admin categories | Financial categories only |
| JSON before/after state | Running balance |

Both are append-only. Financial disputes require both records.

---

## 8. Compliance and retention

| Requirement | Implementation |
|-------------|----------------|
| Retention | 7 years — no auto-delete |
| Export | Admin CSV export + GDPR user data export |
| Integrity | Append-only trigger |
| Access | super_admin + founder read only |
| Backup | Included in PostgreSQL pg_dump |

Archival (P2): move records >2 years to `audit_logs_archive` cold storage — never delete.

---

## 9. Related documents

- [RBAC_POLICIES.md](./RBAC_POLICIES.md)
- [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md)
- [../payments/DISPUTE_FLOW.md](../payments/DISPUTE_FLOW.md)
- [../infrastructure/LOGGING_ARCHITECTURE.md](../infrastructure/LOGGING_ARCHITECTURE.md)

---

*audit_logs is append-only with DB-level immutability. Every admin financial action requires an audit entry with actor, reason, and before/after state.*
