# ORDERS_ESCROW — Domain Specification

## Purpose & business value

Orders represent active work contracts; escrow holds client funds until milestone delivery. Core trust mechanism for real-money marketplace (5% platform fee on release).

## User journey

1. Application accepted OR direct hire → order created automatically
2. Client funds escrow via checkout/wallet
3. Freelancer delivers → order moves to review
4. Client approves → milestones released → freelancer paid
5. Dispute path → admin intervention

## Entities

**Order** (`mock-data.ts`, orders-store):
- id, slug, title, clientId, freelancerId, status, progress, budget, escrowFunded, milestones[]

**EscrowWorkflow** (escrow-store):
- id, orderId, status, milestones[], timeline[], amount

## Lifecycle

### Order statuses
`in_progress` → `review` → `completed` | `revision` | `disputed` | `cancelled`

### Escrow statuses
`accepted` → `funded` → `in_progress` → `delivered` → `review` → `released` → `completed` | `disputed`

### Milestone statuses
`pending` → `funded` → `released` | `disputed`

## Key store functions

| Function | Store | Effect |
|----------|-------|--------|
| createOrder | orders | status=in_progress, 2 default milestones |
| acceptApplication | applications | triggers createOrder + createEscrowFromOrder |
| fundOrderEscrow | orders | escrowFunded=true |
| fundEscrow | escrow | status=funded, milestone[0] funded |
| markOrderInReview | orders | status=review |
| approveOrderDelivery | orders | status=completed, release milestones |
| releaseEscrowMilestone | escrow | milestone released, maybe completed |
| openEscrowDispute | escrow | status=disputed |
| refundEscrowToClient | escrow | refund path |

## Permissions

- Order view: clientId OR freelancerId match session user
- Fund escrow: client only
- Approve delivery: client only
- Dispute: either participant
- Admin release/refund: isAdmin

## Validations

- Checkout validates service/project params, wallet balance (client UI)
- Cannot release unfunded milestone
- approveOrderDelivery requires escrow funded

## Database requirements (target)

Tables: `orders`, `order_milestones`, `escrow_workflows`, `escrow_milestones`, `escrow_timeline_events`, `disputes`

State machine must be server-enforced with optimistic locking (`version` column).

## API requirements

```
POST   /api/v1/orders
GET    /api/v1/orders/:id
PATCH  /api/v1/orders/:id/status
POST   /api/v1/escrow/:id/fund
POST   /api/v1/escrow/:id/release
POST   /api/v1/escrow/:id/dispute
POST   /api/v1/escrow/:id/refund
```

Idempotency-Key required on fund/release (PAYMENT_ARCHITECTURE).

## WebSocket events

`escrow.funded`, `escrow.released`, `escrow.disputed`, `order.status_changed`

## Notifications

Client: escrow funded confirmation, delivery submitted  
Freelancer: payment released, dispute opened

## Analytics

`order_created`, `order_completed`, `escrow_funded`, `escrow_released`

## Security

- **Critical:** Client ledger tampering — must move to server wallet integration
- Admin escrow actions need MFA + audit (target)

## Admin

`adminReleaseEscrow`, `adminFreezeEscrow`, `adminRefundEscrow`, `/admin/escrow/$id`

## Scalability

- 10k+ active orders: index (client_id, status), (freelancer_id, status)
- Escrow fund: single DB transaction with wallet debit + escrow credit
- Event outbox for downstream notifications

## Edge cases

| Case | Handling |
|------|----------|
| Partial milestone release | releaseEscrowMilestone by label |
| All milestones released | auto complete workflow |
| Order cancelled after fund | refundEscrowToClient |
| Admin refund during dispute | adminRefundEscrowByOrder |

Storage: `ishbor-user-orders`, `ishbor-user-escrow`

Routes: `/orders`, `/orders/$id`, `/escrow`, `/escrow/$id`, `/checkout`
