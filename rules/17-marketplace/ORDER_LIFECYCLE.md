# ORDER_LIFECYCLE.md

**Domain:** Active work contracts between client and freelancer  
**Frontend authority:** `src/lib/orders-store.ts`  
**Companion:** `src/lib/escrow-store.ts`, `src/lib/applications-store.ts`  
**Related:** [ORDERS_ESCROW.md](../../13-domains/ORDERS_ESCROW.md), [ESCROW_LIFECYCLE.md](./ESCROW_LIFECYCLE.md)

---

## 1. Business purpose

An **order** represents an active contract — whether from accepted project application or direct service checkout. Orders track work progress, milestones, and link 1:1 to an escrow workflow holding client funds.

**Storage key:** `ishbor-user-orders`  
**Routes:** `/orders`, `/orders/$id`, `/checkout`, `/dashboard`, `/dashboard/freelancer`

---

## 2. Entity model

### 2.1 Order fields

| Store field | DB column | Notes |
|-------------|-----------|-------|
| `id` | `orders.id` | e.g. `o-{timestamp}` → UUID |
| `title` | `title` | Project/service name |
| `client`, `clientSlug` | `client_user_id` + denorm | |
| `freelancer`, `freelancerUsername` | `freelancer_user_id` + denorm | |
| `status` | `status` | State machine |
| `progress` | `progress` | 0–100 |
| `amount` | `amount` | Contract value USD |
| `dueDate` | `due_date` | |
| `escrowFunded` | `escrow_funded` | Boolean flag |
| `milestones` | `order_milestones` | Default 2 equal splits |
| `ownerUserId` | client_user_id typically | |
| `completedAt` | `completed_at` | Set on complete |

### 2.2 Status enum

From mock-data + orders-store:

`in_progress` | `review` | `revision` | `completed` | `disputed` | `cancelled`

PostgreSQL `order_status`: same set

---

## 3. State machine

```
                         ┌──────────────┐
    createOrder() ──────▶│ in_progress  │
                         └──────┬───────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
    fundOrderEscrow()    markOrderInReview()   openDispute()
    (escrow parallel)          │                 │
              │           ┌─────▼─────┐     ┌─────▼─────┐
              │           │   review  │     │ disputed  │
              │           └─────┬─────┘     └─────┬─────┘
              │                 │                 │
              │    approveOrderDelivery()    admin resolve
              │           ┌─────▼─────┐           │
              └──────────▶│ completed │◀──────────┘
                          └───────────┘

         cancel (pre-work) ──▶ cancelled
         revision loop: review ↔ in_progress (revision status)
```

### 3.1 Transition table

| From | To | Actor | Store function | API |
|------|-----|-------|----------------|-----|
| — | in_progress | System | `createOrder` | POST `/api/v1/orders` |
| in_progress | review | Freelancer/Client | `markOrderInReview` | PATCH `/api/v1/orders/:id/status` |
| in_progress | revision | Client | `updateOrderStatus` | PATCH |
| review | completed | Client | `approveOrderDelivery` | POST `/api/v1/orders/:id/approve` |
| review | revision | Client | `updateOrderStatus` | PATCH |
| * | disputed | Either | via escrow dispute | POST `/api/v1/escrow/:id/dispute` |
| in_progress | cancelled | Client | cancel (pre-work) | POST `/api/v1/orders/:id/cancel` |
| disputed | completed/cancelled | Admin | dispute resolve | POST `/api/v1/admin/disputes/:id/resolve` |

**Guard:** `approveOrderDelivery` requires `escrowFunded === true` and status not already `completed` or `cancelled`.

---

## 4. Order creation paths

### 4.1 Application accepted (project flow)

```
acceptApplication(applicationId)
  → createOrder({ title, client, freelancer, amount, ... })
  → createEscrowFromOrder(order)
  → application.status = accepted, application.order_id set
```

API:

```
POST /api/v1/applications/:id/accept
→ 201 { order, escrow }
```

### 4.2 Direct checkout (service flow)

```
POST /api/v1/checkout/confirm
{ serviceSlug, packageTier, idempotencyKey }
→ createOrder + createEscrowFromOrder
→ redirect /orders/:id
```

### 4.3 Default milestones

`createOrder` splits amount 50/50:

```typescript
milestones: [
  { label: "Kickoff & discovery", done: false, amount: amount/2 },
  { label: "Final delivery", done: false, amount: amount/2 },
]
```

Server mirrors in `order_milestones` + `escrow_milestones`.

---

## 5. Store functions → API

| Function | Effect | API |
|----------|--------|-----|
| `createOrder` | status=in_progress, 2 milestones | POST `/api/v1/orders` |
| `getOrderById` | fetch | GET `/api/v1/orders/:id` |
| `getOrdersForUser` | participant list | GET `/api/v1/orders?mine=true` |
| `getOrdersForFreelancer` | by username | GET `/api/v1/orders?role=freelancer` |
| `getOrdersForClient` | by slug | GET `/api/v1/orders?role=client` |
| `updateOrderStatus` | status/progress | PATCH `/api/v1/orders/:id/status` |
| `fundOrderEscrow` | escrowFunded=true | POST `/api/v1/checkout/confirm` or fund endpoint |
| `markOrderInReview` | status=review, progress≥80 | PATCH |
| `approveOrderDelivery` | completed + release escrow | POST `/api/v1/orders/:id/approve` |
| `subscribeOrders` | reactive UI | WebSocket `order.status_changed` |

---

## 6. approveOrderDelivery deep dive

Maps orders-store.ts — critical happy path:

```typescript
// 1. Mark all order milestones done
// 2. status = completed, progress = 100, completedAt = now
// 3. For each funded escrow milestone → releaseEscrowMilestone
// 4. recordConversionEvent + recordAnalyticsEvent
```

Server atomic transaction:

1. UPDATE order status → completed
2. UPDATE order_milestones done=true
3. For each escrow milestone with status=funded → release (wallet TX)
4. INSERT audit if admin
5. Emit `OrderCompleted`, `EscrowMilestoneReleased`

---

## 7. Permissions

| Action | Allowed |
|--------|---------|
| View order | client_user_id OR freelancer_user_id OR admin |
| Update progress | freelancer |
| Mark review | freelancer (delivery) or client (request review) |
| Approve delivery | client only |
| Cancel pre-work | client only |
| Dispute | either participant |

`403 ORDER_NOT_PARTICIPANT` if session user not client/freelancer on order.

---

## 8. Validations

| Rule | Code |
|------|------|
| Cannot complete unfunded order | `ESCROW_NOT_FUNDED` |
| Cannot cancel after milestone released | `ORDER_INVALID_TRANSITION` |
| Optimistic locking | `version` column — `409 CONFLICT` on stale PATCH |
| Amount > 0 | `VALIDATION_ERROR` |

---

## 9. WebSocket & notifications

| Event | Channel | Recipients |
|-------|---------|------------|
| `order.status_changed` | `/ws/v1` user channel | client + freelancer |
| `order.created` | notification | both parties |

`notifyOrderCreated` on createOrder when session present.

Templates (Uzbek):

- Client: "Buyurtmangiz yaratildi: {title}"
- Freelancer: "Yangi buyurtma: {title}"

---

## 10. Analytics

| Event | Trigger |
|-------|---------|
| `order_created` | createOrder |
| `order_completed` | approveOrderDelivery / updateOrderStatus(completed) |
| `order_completed` conversion | conversion-store |

`recordConversionEvent("order_completed", orderId, amount)` feeds funnel metrics.

---

## 11. Admin

**Routes:** `/admin/orders`, `/admin/escrow/$id`

| Action | Function |
|--------|----------|
| View all orders | GET `/api/v1/admin/orders` |
| Force status | PATCH (audit required) |
| Refund | adminRefundEscrowByOrder → REFUND_LIFECYCLE.md |

Admin cannot silently complete order without escrow resolution.

---

## 12. API reference

```
POST   /api/v1/orders
GET    /api/v1/orders/:id
GET    /api/v1/orders?mine=true&status=in_progress
PATCH  /api/v1/orders/:id/status
POST   /api/v1/orders/:id/approve
POST   /api/v1/orders/:id/cancel
GET    /api/v1/admin/orders
```

**Status PATCH body:**

```json
{ "status": "review", "progress": 85 }
```

---

## 13. Edge cases

| Case | Handling |
|------|----------|
| Partial milestone release | Client releases one milestone; order stays in_progress until all done |
| approveOrderDelivery without escrow | No-op release loop; order still completes (mock allows — server should guard) |
| Order disputed | status=disputed; blocks approve until admin resolves |
| Mock order merge | mockOrders merged in getAllOrders — API uses DB only |
| Multiple orders per project | One active order per accepted application |

---

## 14. Database indexes

```sql
CREATE INDEX idx_orders_client_status ON orders(client_user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_freelancer_status ON orders(freelancer_user_id, status) WHERE deleted_at IS NULL;
```

---

## 15. Related documents

- [ESCROW_LIFECYCLE.md](./ESCROW_LIFECYCLE.md)
- [DISPUTE_LIFECYCLE.md](./DISPUTE_LIFECYCLE.md)
- [REFUND_LIFECYCLE.md](./REFUND_LIFECYCLE.md)
- [ESCROW_SYSTEM.md](../11-backend/payments/ESCROW_SYSTEM.md)

---

*Order lifecycle: in_progress → review → completed, with revision and disputed branches. approveOrderDelivery completes order and releases funded escrow milestones atomically.*
