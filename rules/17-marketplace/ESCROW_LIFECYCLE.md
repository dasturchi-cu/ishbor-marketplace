# ESCROW_LIFECYCLE.md

**Domain:** Fund holding and milestone release — core trust mechanism  
**Frontend authority:** `src/lib/escrow-store.ts`  
**Backend authority:** `EscrowService` + ESCROW_SYSTEM.md  
**Platform fee:** 5% on milestone release  
**Related:** [ORDER_LIFECYCLE.md](./ORDER_LIFECYCLE.md), [ORDERS_ESCROW.md](../../13-domains/ORDERS_ESCROW.md)

---

## 1. Business purpose

Escrow holds client funds until work milestones are approved. One escrow workflow exists per order (`order_id` UNIQUE). Timeline steps display in Uzbek on `/escrow/$id`.

**Storage key:** `ishbor-user-escrow`  
**Routes:** `/escrow`, `/escrow/$id`, `/checkout`, `/admin/escrow/$id`

---

## 2. Entity model

### 2.1 EscrowWorkflow

| Store field | DB table.column | Notes |
|-------------|-----------------|-------|
| `id` | `escrow_workflows.id` | e.g. `ew-{ts}` |
| `orderId` | `order_id` | UNIQUE FK |
| `project` | denormalized title | |
| `client`, `freelancer` | denormalized names | |
| `amount` | `amount` | Order subtotal |
| `status` | `status` | State machine |
| `milestones[]` | `escrow_milestones` | label, amount, status |
| `timeline[]` | `escrow_timeline_events` | Append-only steps |

### 2.2 Escrow status enum

Store + PostgreSQL `escrow_status`:

`proposal` (legacy) | `accepted` | `funded` | `in_progress` | `delivered` | `review` | `released` | `completed` | `disputed`

### 2.3 Milestone status enum

`pending` | `funded` | `released` | `disputed`

---

## 3. Escrow state machine

```
createEscrowFromOrder()
        │
   ┌────▼─────┐
   │ accepted │  escrowFunded=false
   └────┬─────┘
        │ fundEscrow() / checkout confirm
   ┌────▼─────┐
   │  funded  │  milestone[0] → funded
   └────┬─────┘
        │ auto
   ┌────▼─────────┐
   │ in_progress  │
   └────┬─────────┘
        │ deliver
   ┌────▼─────────┐
   │  delivered   │
   └────┬─────────┘
        │
   ┌────▼─────────┐
   │   review     │
   └────┬─────────┘
        │ releaseEscrowMilestone()
   ┌────▼─────────┐
   │  released    │  (partial — some milestones released)
   └────┬─────────┘
        │ all milestones released
   ┌────▼─────────┐
   │  completed   │
   └──────────────┘

        openEscrowDispute() from most active states
   ┌──────────────┐
   │   disputed   │ ──admin resolve──▶ completed
   └──────────────┘
        refundEscrowToClient() ──▶ completed (client refund path)
```

---

## 4. Timeline steps (Uzbek UI)

Maps `createEscrowFromOrder` timeline array:

| Step | Store trigger |
|------|---------------|
| Taklif yuborildi | Order/application created |
| Taklif qabul qilindi | Escrow created |
| Eskrou to'ldirildi | fundEscrow |
| Ish boshlandi | in_progress transition |
| Bosqich topshirildi | delivered |
| Mijoz ko'rib chiqishi | review |
| Mablag' chiqarildi | releaseEscrowMilestone |
| Yakunlandi | all released / completed |
| Nizo ochildi | openEscrowDispute (appended) |
| Mijozga qaytarildi | refundEscrowToClient (appended) |

Timeline is **append-only** in PostgreSQL — never mutate historical steps.

---

## 5. Store functions → API

| Function | Effect | API |
|----------|--------|-----|
| `createEscrowFromOrder(order)` | status=accepted/funded | Auto on order create |
| `getEscrowByOrderId` | lookup | GET `/api/v1/escrow?orderId=` |
| `getEscrowWorkflowById` | detail | GET `/api/v1/escrow/:id` |
| `fundEscrow(orderId)` | status=funded, m0 funded | POST `/api/v1/escrow/:id/fund` |
| `releaseEscrowMilestone(id, label)` | milestone released | POST `/api/v1/escrow/:id/milestones/:label/release` |
| `openEscrowDispute(id)` | status=disputed | POST `/api/v1/escrow/:id/dispute` |
| `refundEscrowToClient(id)` | refund path | POST `/api/v1/admin/escrow/:id/refund` |
| `adminReleaseEscrow` | admin release | POST `/api/v1/admin/escrow/:id/release` |
| `adminFreezeEscrow` | freeze | POST `/api/v1/admin/escrow/:id/freeze` |

**Idempotency:** Required on fund, release, refund — `X-Idempotency-Key`

---

## 6. fundEscrow flow

Maps escrow-store.ts:

```typescript
status: "funded"
timeline: "Eskrou to'ldirildi" → done
milestones[0].status: "funded"
```

Server atomic transaction:

1. `SELECT wallet FOR UPDATE` — client
2. Verify `available >= amount`
3. Debit client available, credit escrow_held
4. INSERT wallet_transactions (escrow_hold)
5. UPDATE escrow_workflows status=funded
6. UPDATE order escrow_funded=true
7. Fund first milestone (or all per policy)
8. Emit `EscrowFunded`

Also calls `fundOrderEscrow(orderId)` in orders-store.

---

## 7. releaseEscrowMilestone flow

```typescript
// Only if milestone.status === 'funded'
milestone.status → 'released'
if all released → escrow.status = 'completed'
timeline: "Mablag' chiqarildi", "Yakunlandi"
```

Server:

1. Guard: not disputed/frozen unless admin
2. Debit platform escrow pool
3. Credit freelancer available (minus 5% platform fee → revenue_ledger)
4. INSERT wallet_transactions (escrow_release, fee)
5. UPDATE milestone status
6. If all released → escrow status=completed
7. Emit `EscrowMilestoneReleased`

`approveOrderDelivery` in orders-store loops all funded milestones and calls release.

---

## 8. Milestone state machine

```
pending ──(escrow fund)──▶ funded ──(client release)──▶ released
                              │
                              └──(dispute)──▶ disputed ──(admin)──▶ released
```

Cannot release `pending` milestone — `422 MILESTONE_NOT_FUNDED`.

---

## 9. Permissions

| Action | Actor |
|--------|-------|
| Fund | Client (order owner) |
| Release milestone | Client |
| Open dispute | Client OR freelancer |
| Admin release/refund/freeze | finance_admin / moderation_admin |
| View | Order participants + admin |

---

## 10. Admin operations

From admin-data-store:

| Function | Maps |
|----------|------|
| `adminReleaseEscrow(escrowId, milestoneLabel)` | releaseEscrowMilestone |
| `adminFreezeEscrow(escrowId)` | openEscrowDispute (mock — production uses freeze flag) |
| `adminRefundEscrow(escrowId)` | refundEscrowToClient |
| `adminRefundEscrowByOrder(orderId)` | lookup + refund |
| `adminReleaseEscrowByOrder(orderId, label?)` | release first funded milestone |

Production freeze should set `frozen_by_admin=true` **without** necessarily creating dispute — see DISPUTE_LIFECYCLE.md.

---

## 11. WebSocket events

| Event | Payload |
|-------|---------|
| `escrow.funded` | `{ escrowId, orderId, amount }` |
| `escrow.released` | `{ escrowId, milestoneLabel, amount }` |
| `escrow.disputed` | `{ escrowId, orderId }` |
| `escrow.completed` | `{ escrowId }` |

---

## 12. API reference

```
GET    /api/v1/escrow/:id
GET    /api/v1/escrow?orderId=:orderId
POST   /api/v1/escrow/:id/fund
POST   /api/v1/escrow/:id/milestones/:label/release
POST   /api/v1/escrow/:id/dispute
POST   /api/v1/admin/escrow/:id/release
POST   /api/v1/admin/escrow/:id/refund
POST   /api/v1/admin/escrow/:id/freeze
POST   /api/v1/admin/escrow/:id/unfreeze
```

---

## 13. Error codes

| Code | When |
|------|------|
| `ESCROW_INVALID_TRANSITION` | Bad status change |
| `ESCROW_NOT_FUNDED` | Release before fund |
| `ESCROW_FROZEN` | Dispute or admin freeze |
| `MILESTONE_NOT_FUNDED` | Release pending milestone |
| `MILESTONE_ALREADY_RELEASED` | Duplicate release |
| `INSUFFICIENT_BALANCE` | Fund without wallet balance |

---

## 14. Edge cases

| Case | Handling |
|------|----------|
| Partial release | escrow stays `released` until all milestones done |
| All milestones released | auto `completed` |
| Order cancelled after fund | refundEscrowToClient |
| Duplicate fund | Idempotency returns original response |
| Mock escrow merge | getAllEscrowWorkflows merges mock — API DB only |

---

## 15. Financial invariants

| Rule | Enforcement |
|------|-------------|
| SUM(milestone amounts) = escrow.amount | DB constraint |
| Cannot release more than held | Wallet TX guards |
| Platform fee on release only | Not on fund |
| Single escrow per order | UNIQUE order_id |

---

## 16. Related documents

- [ORDER_LIFECYCLE.md](./ORDER_LIFECYCLE.md)
- [DISPUTE_LIFECYCLE.md](./DISPUTE_LIFECYCLE.md)
- [REFUND_LIFECYCLE.md](./REFUND_LIFECYCLE.md)
- [ESCROW_SYSTEM.md](../11-backend/payments/ESCROW_SYSTEM.md)
- [TRANSACTION_FLOW.md](../11-backend/payments/TRANSACTION_FLOW.md)

---

*Escrow lifecycle: accepted → funded → in_progress → … → completed. Milestones track pending/funded/released/disputed. All fund movement requires idempotent server transactions with wallet ledger entries.*
