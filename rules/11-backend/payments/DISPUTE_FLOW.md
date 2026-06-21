# DISPUTE_FLOW.md

**Scope:** Dispute lifecycle, escrow freeze, admin resolution  
**Authority:** DisputeService + EscrowService — maps `openEscrowDispute()`, admin.disputes  
**Sources:** DATABASE_SCHEMA §5.6, escrow-store.ts, admin mock split resolution

---

## 1. Overview

A dispute pauses escrow fund movement until admin resolves. Either order participant can open a dispute when work quality, delivery, or scope disagreements arise.

**Principles:**

- Opening dispute immediately freezes escrow (`frozen_by_admin` semantics via status)
- No milestone releases while dispute is open
- Admin assigns resolution with optional split percentage
- All actions audited immutably

---

## 2. Data model — `disputes` table

| Column | Type | Maps |
|--------|------|------|
| id | uuid PK | Dispute.id |
| order_id | uuid FK | Parent order |
| escrow_id | uuid FK | Frozen escrow |
| opened_by_user_id | uuid FK | Client or freelancer |
| reason | text | User-provided explanation |
| status | enum | open → pending → closed |
| resolution | jsonb | Admin outcome |
| assigned_admin_id | uuid FK NULL | Moderator |
| opened_at | timestamptz | |
| closed_at | timestamptz NULL | |

### Status flow

```
open ──(admin picks up)──▶ pending ──(resolution posted)──▶ closed
```

| Status | Meaning |
|--------|---------|
| open | New dispute, awaiting admin |
| pending | Admin investigating |
| closed | Resolved — funds distributed |

---

## 3. Opening a dispute

Maps `openEscrowDispute()`.

```
POST /escrow/{escrow_id}/dispute
Body: { reason: string, idempotency_key }
Actor: order client OR freelancer
```

### Guards

- Escrow status IN (`funded`, `in_progress`, `delivered`, `review`, `released`)
- No existing open dispute for this escrow
- `frozen_by_admin = false` (not already admin-frozen)

### SQL transaction

```sql
BEGIN;

SELECT * FROM escrow_workflows WHERE id = :escrow_id FOR UPDATE;

UPDATE escrow_workflows SET
  status = 'disputed',
  frozen_by_admin = true,
  updated_at = now()
WHERE id = :escrow_id;

UPDATE escrow_milestones SET status = 'disputed'
WHERE escrow_id = :escrow_id AND status = 'funded';

INSERT INTO disputes (order_id, escrow_id, opened_by_user_id, reason, status, opened_at)
VALUES (:order_id, :escrow_id, :user_id, :reason, 'open', now());

INSERT INTO escrow_timeline_events (step='Nizo ochilgan', done=true);

COMMIT;
-- Emit DisputeOpened
-- Notify admin queue + both participants
```

**Effect:** All funded milestone funds locked. Client cannot release; freelancer cannot receive.

---

## 4. Escrow freeze semantics

| Flag / status | Blocks |
|---------------|--------|
| `escrow_workflows.status = 'disputed'` | Milestone release, checkout changes |
| `escrow_workflows.frozen_by_admin = true` | All fund movement |
| Open dispute exists | Duplicate dispute opening |

Admin can freeze without dispute (`POST /admin/escrow/{id}/freeze`) for fraud investigation — same movement blocks apply.

Unfreeze without resolution only if dispute withdrawn (rare — admin mediates).

---

## 5. Admin dispute queue

Maps `/admin/disputes` — replaces mock data with PostgreSQL queries.

```
GET /admin/disputes?status=open&page=1
  → JOIN orders, escrow_workflows, users (client + freelancer)
  → Sort by opened_at ASC (FIFO)
```

Admin actions:

| Action | Endpoint | Result |
|--------|----------|--------|
| Assign self | PATCH `/admin/disputes/{id}` | status → pending |
| Request info | POST `/admin/disputes/{id}/message` | Support thread |
| Resolve split | POST `/admin/disputes/{id}/resolve` | Partial distribution |
| Full client refund | POST `/admin/disputes/{id}/resolve` | See REFUND_FLOW.md |
| Full freelancer release | POST `/admin/disputes/{id}/resolve` | Release all milestones |
| Dismiss (frivolous) | POST `/admin/disputes/{id}/resolve` | Unfreeze, continue escrow |

Required permission: `moderation_admin` or `finance_admin` depending on action.

---

## 6. Resolution — split percentage

Maps admin mock: 60/40 client/freelancer split.

```json
POST /admin/disputes/{id}/resolve
{
  "resolution_code": "split",
  "client_percent": 60,
  "freelancer_percent": 40,
  "notes": "Birinchi bosqich bajarilgan, ikkinchisi yo'q",
  "idempotency_key": "uuid"
}
```

### SQL transaction

```sql
BEGIN;

SELECT * FROM disputes WHERE id = :dispute_id FOR UPDATE;
-- Guard: status IN ('open', 'pending')

SELECT * FROM escrow_workflows WHERE id = :escrow_id FOR UPDATE;

-- Calculate from SUM funded/disputed milestones
-- client_amount = total * client_percent / 100
-- freelancer_amount = total * freelancer_percent / 100

-- post_refund(client, client_amount)
-- post_milestone_release(freelancer, freelancer_amount)

UPDATE escrow_milestones SET status = 'released' WHERE ...;
UPDATE escrow_workflows SET status = 'completed', frozen_by_admin = false;
UPDATE disputes SET status = 'closed', resolution = :json, closed_at = now();
UPDATE orders SET status = 'completed' OR 'cancelled' per resolution;

INSERT INTO audit_logs (category='escrow', action='dispute_resolved', ...);

COMMIT;
-- Emit DisputeResolved
```

---

## 7. Notifications

| Event | Recipients | Channel |
|-------|------------|---------|
| DisputeOpened | Both parties + admin | in-app, email |
| DisputeAssigned | Assigned admin | in-app |
| DisputeResolved | Both parties | in-app, email, SMS (P1) |

Templates in Uzbek — see NOTIFICATION_ARCHITECTURE.md `escrow.dispute_*`.

---

## 8. Participant communication during dispute

Dispute does NOT block messaging — conversation remains open for evidence exchange.

Admin can view:

- Order milestones and delivery history
- Message thread (read-only unless admin joins)
- Escrow timeline events
- Attached project files

Evidence upload: participants attach files via existing project attachment flow — admin sees in dispute detail panel.

---

## 9. SLA targets

| Metric | Target |
|--------|--------|
| First admin response | <24 hours |
| Resolution | <72 hours |
| Escrow freeze max | 14 days — auto-escalate to senior admin |

Celery job: disputes open >72h → P1 alert. Open >14 days → auto-notify founder.

---

## 10. API summary

| Method | Path | Actor |
|--------|------|-------|
| POST | `/escrow/{id}/dispute` | Participant |
| GET | `/disputes/{id}` | Participant (own) |
| GET | `/admin/disputes` | Admin |
| GET | `/admin/disputes/{id}` | Admin |
| PATCH | `/admin/disputes/{id}` | Admin assign |
| POST | `/admin/disputes/{id}/resolve` | Admin |
| POST | `/admin/escrow/{id}/freeze` | Admin |
| POST | `/admin/escrow/{id}/unfreeze` | Admin |

---

## 11. Frontend migration

| Store function | API |
|----------------|-----|
| `openEscrowDispute(escrowId)` | POST dispute |
| Admin dispute list mock | GET `/admin/disputes` |
| Admin split UI | POST resolve with JSON |

Escrow UI shows disputed badge and disables release buttons when `status = 'disputed'`.

---

## 12. Audit requirements

Every dispute state change → `audit_logs`:

```json
{
  "category": "escrow",
  "action": "dispute_opened | dispute_resolved | escrow_frozen",
  "entity_type": "dispute",
  "entity_id": "uuid",
  "actor_id": "uuid",
  "before": { "escrow_status": "in_progress" },
  "after": { "escrow_status": "disputed" },
  "ip_address": "..."
}
```

Append-only — no UPDATE or DELETE on audit_logs.

---

## 13. Related documents

- [REFUND_FLOW.md](./REFUND_FLOW.md)
- [ESCROW_SYSTEM.md](./ESCROW_SYSTEM.md)
- [../security/AUDIT_LOG_SYSTEM.md](../security/AUDIT_LOG_SYSTEM.md)
- [../security/RBAC_POLICIES.md](../security/RBAC_POLICIES.md)

---

*Disputes are the escalation path when client-freelancer negotiation fails. Escrow freeze guarantees no fund movement until admin resolution.*
