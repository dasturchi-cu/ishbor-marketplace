# DISPUTE_LIFECYCLE.md

**Domain:** Conflict resolution when client-freelancer negotiation fails  
**Frontend authority:** `src/lib/escrow-store.ts` (`openEscrowDispute`), `src/lib/admin-data-store.ts` (`updateDispute`)  
**Admin UI:** `/admin/disputes`  
**SLA:** 24h first response, 72h resolution (TRUST_SYSTEM.md)  
**Related:** [MODERATION_DISPUTES.md](../../13-domains/MODERATION_DISPUTES.md), [DISPUTE_FLOW.md](../11-backend/payments/DISPUTE_FLOW.md)

---

## 1. Business purpose

Disputes **freeze escrow fund movement** until admin resolves. Either order participant can open a dispute when delivery quality, scope, or timeline disagreements cannot be resolved via messaging.

Real-money marketplace requires documented escalation — referenced in `/terms` (Uzbek copy live).

---

## 2. Entity model

### 2.1 Dispute (admin-mock-data.ts → PostgreSQL)

| Field | Column | Notes |
|-------|--------|-------|
| `id` | `disputes.id` | UUID |
| `orderId` | `order_id` | FK |
| `project` | denormalized title | |
| `client`, `freelancer` | party names | |
| `amount` | escrow amount | |
| `status` | `status` | open → pending → closed |
| `reason` | `reason` | User text |
| `openedAt` | `opened_at` | |
| `assignedTo` | `assigned_admin_id` | |

Linked: `escrow_id`, `opened_by_user_id`, `resolution` jsonb, `closed_at`

### 2.2 Status enum

Store + PostgreSQL `dispute_status`:

`open` | `pending` | `closed`

MODERATION_DISPUTES also references: opened → under_review → resolved → closed — mapped to open/pending/closed in implementation.

---

## 3. State machine

```
Participant: POST /escrow/:id/dispute
        │
   ┌────▼────┐
   │  open   │  FIFO admin queue; escrow frozen
   └────┬────┘
        │ admin PATCH assign
   ┌────▼────────┐
   │   pending   │  investigating
   └────┬────────┘
        │ POST .../resolve
   ┌────▼────────┐
   │   closed    │  funds distributed per resolution
   └─────────────┘
```

Escrow parallel state: `status = disputed`, funded milestones → `disputed`.

---

## 4. Opening a dispute

### 4.1 Store behavior

`openEscrowDispute(escrowId)` in escrow-store:

```typescript
escrow.status = "disputed"
timeline += { step: "Nizo ochildi", done: true }
milestones: funded → disputed
```

Also triggers order `status = disputed` in production.

### 4.2 API

```
POST /api/v1/escrow/:escrow_id/dispute
Content-Type: application/json
X-Idempotency-Key: <uuid>

{
  "reason": "Ish talablariga mos kelmadi — dizayn mockuplar noto'g'ri"
}
```

**Actor:** order client OR freelancer  
**Permission:** must be order participant

### 4.3 Guards

| Guard | Error |
|-------|-------|
| Escrow status IN (funded, in_progress, delivered, review, released) | else `ESCROW_INVALID_TRANSITION` |
| No existing open dispute for escrow | `DISPUTE_ALREADY_OPEN` |
| Not already admin-frozen for fraud | `ESCROW_FROZEN` |
| reason min 20 chars | `VALIDATION_ERROR` |

### 4.4 Side effects

1. UPDATE escrow_workflows SET status=disputed, frozen_by_admin=true
2. UPDATE escrow_milestones SET status=disputed WHERE status=funded
3. UPDATE orders SET status=disputed
4. INSERT disputes row status=open
5. INSERT escrow_timeline_events "Nizo ochildi"
6. INSERT audit_logs action=dispute_opened
7. Notify both parties + admin queue
8. Emit WebSocket `escrow.disputed`

**Messaging remains open** — dispute does not block conversation (evidence exchange).

---

## 5. Admin queue

**Route:** `/admin/disputes`  
**Store:** `getAdminDisputes()`, `updateDispute(id, patch)`

### 5.1 List API

```
GET /api/v1/admin/disputes?status=open&page=1&limit=20
```

Sort: `opened_at ASC` (FIFO — oldest first)

Join: orders, escrow_workflows, users (client + freelancer avatars)

### 5.2 Assign admin

```
PATCH /api/v1/admin/disputes/:id
{ "assignedAdminId": "...", "status": "pending" }
```

Maps `updateDispute(id, { status: 'pending', assignedTo })`.

Audit: `dispute_assigned`

---

## 6. Resolution paths

Admin actions map admin-data-store + admin.disputes UI:

| Resolution | Admin function | Outcome |
|------------|----------------|---------|
| Full client refund | `adminRefundEscrow` | refundEscrowToClient |
| Full freelancer release | `adminReleaseEscrow` | release all funded milestones |
| Split % | resolve JSON | Partial refund + partial release |
| Dismiss frivolous | unfreeze + continue | escrow back to prior work state |
| Freeze only (fraud) | `adminFreezeEscrow` | investigate without immediate resolve |

### 6.1 Resolve API

```
POST /api/v1/admin/disputes/:id/resolve
X-Idempotency-Key: <uuid>

{
  "resolutionCode": "split",
  "clientPercent": 60,
  "freelancerPercent": 40,
  "notes": "Birinchi bosqich bajarilgan, ikkinchisi yo'q",
  "reason": "Admin hal qildi — qisman bajarilgan ish"
}
```

**resolutionCode values:** `full_refund` | `full_release` | `split` | `dismiss`

**Permission:** `finance_admin` for money movement; `moderation_admin` for dismiss

### 6.2 Split resolution SQL (conceptual)

1. Calculate total held in disputed/funded milestones
2. `client_amount = total * clientPercent / 100`
3. `freelancer_amount = total * freelancerPercent / 100`
4. post_refund(client) + post_milestone_release(freelancer)
5. UPDATE disputes SET status=closed, resolution=json, closed_at=now()
6. UPDATE escrow status=completed, frozen_by_admin=false
7. UPDATE order status=completed OR cancelled per outcome
8. audit_logs dispute_resolved with before/after

---

## 7. Escrow freeze semantics

| Condition | Blocks |
|-----------|--------|
| escrow.status = disputed | Client release, new fund |
| frozen_by_admin = true | All movement |
| open dispute exists | Duplicate dispute open |

Admin freeze without dispute:

```
POST /api/v1/admin/escrow/:id/freeze
{ "reason": "Fraud tekshiruvi" }
```

Unfreeze:

```
POST /api/v1/admin/escrow/:id/unfreeze
```

Only when dispute dismissed or resolved.

---

## 8. Participant experience

### 8.1 UI indicators

- Escrow page: disputed badge, release buttons disabled
- Order page: status chip "Nizo ochilgan"
- Notifications: in-app + email on open and close

### 8.2 Evidence

Participants attach files via project attachments or message files. Admin dispute detail shows:

- Order milestones history
- Message thread (read-only)
- Escrow timeline
- Wallet transaction summary

Future: `dispute_evidence` table + `dispute_messages` for admin thread.

---

## 9. SLA and cron

| Metric | Target | Enforcement |
|--------|--------|-------------|
| First admin response | < 24 hours | Support queue metrics |
| Resolution | < 72 hours | Celery `dispute_sla_check` hourly |
| Max freeze | 14 days | Auto-escalate to founder |

Open > 72h → P1 alert  
Open > 14 days → notify founder + audit `dispute_sla_breach`

---

## 10. Notifications

| Event | Recipients | Template key |
|-------|------------|--------------|
| DisputeOpened | both parties + admin | `escrow.dispute_opened` |
| DisputeAssigned | assigned admin | `admin.dispute_assigned` |
| DisputeResolved | both parties | `escrow.dispute_resolved` |

Uzbek copy per NOTIFICATION_ARCHITECTURE.md.

---

## 11. Trust implications

| Pattern | Action |
|---------|--------|
| Repeat disputants | Flag trust score (reputation-store) |
| Partial milestone already released | Split only on remaining held amount |
| Client opens dispute after release | Deny if no funded milestones remain |

---

## 12. API summary

| Method | Path | Actor |
|--------|------|-------|
| POST | `/api/v1/escrow/:id/dispute` | Participant |
| GET | `/api/v1/disputes/:id` | Participant (own) |
| GET | `/api/v1/admin/disputes` | Admin |
| GET | `/api/v1/admin/disputes/:id` | Admin |
| PATCH | `/api/v1/admin/disputes/:id` | Admin assign |
| POST | `/api/v1/admin/disputes/:id/resolve` | Admin |
| POST | `/api/v1/admin/disputes/:id/message` | Admin request info |
| POST | `/api/v1/admin/escrow/:id/freeze` | Admin |
| POST | `/api/v1/admin/escrow/:id/unfreeze` | Admin |

---

## 13. Frontend migration

| Store | Production |
|-------|------------|
| `openEscrowDispute(escrowId)` | POST dispute API |
| `getAdminDisputes()` mock | GET admin/disputes |
| `updateDispute(id, patch)` | PATCH admin/disputes |
| Admin split UI | POST resolve with JSON |

Remove client-side fund movement — all resolution server-side with MFA for finance_admin.

---

## 14. Audit requirements

Every state change → audit_logs (append-only):

| action | When |
|--------|------|
| `dispute_opened` | Participant POST |
| `dispute_assigned` | PATCH pending |
| `dispute_resolved` | POST resolve |
| `escrow_frozen` | Admin freeze |
| `escrow_unfrozen` | Admin unfreeze |

Include before/after escrow milestone snapshot — see AUDIT_TRAIL_STRATEGY.md.

---

## 15. Related documents

- [REFUND_LIFECYCLE.md](./REFUND_LIFECYCLE.md)
- [ESCROW_LIFECYCLE.md](./ESCROW_LIFECYCLE.md)
- [REFUND_FLOW.md](../11-backend/payments/REFUND_FLOW.md)
- [AUDIT_TRAIL_STRATEGY.md](../11-backend/postgresql/AUDIT_TRAIL_STRATEGY.md)
- [TRUST_SYSTEM.md](../../04-trust/TRUST_SYSTEM.md)

---

*Dispute lifecycle: open → pending → closed. Opening dispute freezes escrow and marks funded milestones disputed. Admin resolution distributes funds via refund, release, or split — all audited and idempotent.*
