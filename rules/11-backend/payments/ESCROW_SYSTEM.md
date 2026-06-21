# ESCROW_SYSTEM.md

**Domain:** ORDERS_ESCROW — escrow workflows, milestones, timeline  
**Authority:** PostgreSQL + EscrowService — maps `escrow-store.ts`, `orders-store.ts`  
**Sources:** DATABASE_SCHEMA §5.3–5.6, PROJECT_BIBLE §10, admin.disputes

---

## 1. Purpose

Escrow protects both client and freelancer:

- Client funds are held until milestone delivery is approved
- Freelancer receives payment only after client releases milestone
- Platform mediates disputes with admin override
- All fund movements are atomic SQL transactions with ledger entries

Escrow is created automatically on checkout confirmation — not a separate user action.

---

## 2. Entity model

### `escrow_workflows`

| Column | Maps frontend | Notes |
|--------|---------------|-------|
| `id` | `EscrowWorkflow.id` | UUID |
| `order_id` | `orderId` | UNIQUE — one escrow per order |
| `amount` | `amount` | Order subtotal USD (excludes platform fee) |
| `status` | `status` | State machine enum |
| `frozen_by_admin` | admin freeze flag | Blocks all releases |
| `created_at` | — | |
| `updated_at` | — | |

### `escrow_milestones`

| Column | Maps frontend |
|--------|---------------|
| `escrow_id` | parent workflow |
| `label` | milestone label (Uzbek) |
| `amount` | USD portion |
| `status` | pending → funded → released / disputed |

### `escrow_timeline_events`

Maps `EscrowWorkflow.timeline[]` — append-only step history for UI progress bar.

### Related tables

- `orders` — parent order with `escrow_funded` flag
- `disputes` — linked by `escrow_id`
- `wallet_transactions` — `related_escrow_id` on hold/release entries

---

## 3. State machine

```
                    ┌──────────┐
                    │ proposal │  (legacy — merged into accepted)
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ accepted │  Order created, awaiting fund
                    └────┬─────┘
                         │ checkout confirm
                    ┌────▼─────┐
                    │  funded  │  Wallet hold successful
                    └────┬─────┘
                         │ auto
                    ┌────▼─────────┐
                    │ in_progress  │  Work started
                    └────┬─────────┘
                         │ freelancer marks delivered
                    ┌────▼─────────┐
                    │  delivered   │
                    └────┬─────────┘
                         │ client review
                    ┌────▼─────────┐
                    │   review     │
                    └────┬─────────┘
                         │ milestone release(s)
                    ┌────▼─────────┐
         ┌──────────│  released    │──────────┐
         │          └────┬─────────┘          │
         │ dispute       │ all milestones     │
         │          ┌────▼─────────┐          │
         └─────────▶│  disputed    │◀─────────┘
                    └────┬─────────┘
                         │ admin resolution
                    ┌────▼─────────┐
                    │  completed   │
                    └──────────────┘
```

### Transition table

| From | To | Actor | Guard |
|------|-----|-------|-------|
| accepted | funded | Client | `POST /checkout/confirm`, wallet balance ≥ total |
| funded | in_progress | System | Auto on fund success |
| in_progress | delivered | Freelancer | Order progress = 100% or manual deliver |
| delivered | review | Client | `POST /orders/{id}/review` |
| review | released | Client | `POST /escrow/{id}/milestones/{mid}/release` |
| * | disputed | Client or Freelancer | `POST /escrow/{id}/dispute`, not frozen |
| disputed | completed | Admin | Dispute resolution posted |
| released | completed | System | All milestones status = released |
| any | frozen | Admin | `frozen_by_admin = true` |

Invalid transitions return `409 ESCROW_INVALID_TRANSITION`.

---

## 4. Milestone lifecycle

Each order has 1–N milestones (default: 2 equal splits from `createEscrowFromOrder`).

```
pending ──(escrow fund)──▶ funded ──(client release)──▶ released
                              │
                              └──(dispute opened)──▶ disputed
```

| Milestone status | Funds location |
|------------------|----------------|
| pending | Not yet allocated from client wallet |
| funded | Client `escrow_held`, platform escrow pool |
| released | Freelancer `available` |
| disputed | Frozen — no movement until admin acts |

---

## 5. Milestone release — atomic transaction

Maps `releaseEscrowMilestone()` + `processEscrowMilestoneRelease()` in wallet-store.

```sql
BEGIN;

-- 1. Lock escrow row
SELECT * FROM escrow_workflows
WHERE id = :escrow_id FOR UPDATE;

-- Guards
-- status NOT IN ('disputed') OR frozen_by_admin = false
-- milestone.status = 'funded'
-- caller = order.client_user_id

-- 2. Update milestone
UPDATE escrow_milestones
SET status = 'released'
WHERE id = :milestone_id AND status = 'funded';

-- 3. Ledger: client escrow release
INSERT INTO ledger_entries (...) -- debit client:escrow, credit platform:escrow_pool
INSERT INTO wallet_transactions (client, kind='escrow_hold', amount=-milestone.amount)

-- 4. Ledger: freelancer credit
INSERT INTO ledger_entries (...) -- debit platform:escrow_pool, credit freelancer:available
INSERT INTO wallet_transactions (freelancer, kind='in', category='milestone', amount=+milestone.amount)

-- 5. Update wallet balances (via trigger or explicit)
UPDATE wallets SET escrow_held = escrow_held - :amount WHERE user_id = :client_id;
UPDATE wallets SET available = available + :amount, lifetime_earned = lifetime_earned + :amount
WHERE user_id = :freelancer_id;

-- 6. Timeline event
INSERT INTO escrow_timeline_events (step='Mablag\' chiqarildi', done=true)

-- 7. Check completion
UPDATE escrow_workflows SET status = 'completed'
WHERE id = :escrow_id
  AND NOT EXISTS (SELECT 1 FROM escrow_milestones WHERE escrow_id = :escrow_id AND status != 'released');

COMMIT;
```

**Platform fee:** Already collected at escrow fund — milestone release transfers full milestone amount to freelancer without additional fee.

---

## 6. Escrow fund (checkout)

Maps `holdEscrowFunds()` + `createEscrowFromOrder()` + `fundEscrow()`.

```sql
BEGIN;

-- Verify client wallet
SELECT available FROM wallets WHERE user_id = :client_id FOR UPDATE;
-- available >= order.amount + platform_fee

-- Create order + escrow if not exists
INSERT INTO orders (...) RETURNING id;
INSERT INTO escrow_workflows (status='funded') ...;
INSERT INTO escrow_milestones (status='funded' for first, 'pending' for rest) ...;

-- Hold funds
UPDATE wallets SET
  available = available - :total_hold,
  escrow_held = escrow_held + :order_amount
WHERE user_id = :client_id;

INSERT INTO wallet_transactions (kind='escrow_hold', ...);
INSERT INTO payment_records (type='escrow_transfer', status='held');

-- Platform fee to revenue
INSERT INTO ledger_entries (... platform:revenue ...);
INSERT INTO revenue_ledger (...);

UPDATE orders SET escrow_funded = true;

COMMIT;
```

Emit events: `CheckoutCompleted`, `EscrowFunded`.

---

## 7. Admin controls

| Action | Permission | Effect |
|--------|------------|--------|
| Freeze escrow | `finance_admin` | `frozen_by_admin=true`, block releases |
| Unfreeze | `finance_admin` | Resume normal flow |
| Force refund | `finance_admin` | See REFUND_FLOW.md |
| Split dispute | `finance_admin` | Partial release to both parties |

All admin escrow actions → `audit_logs` with before/after JSON.

Maps admin `admin.escrow.tsx`, `admin.disputes.tsx`.

---

## 8. Order delivery auto-release

Maps `approveOrderDelivery()` in orders-store — when client approves delivery:

```
FOR each milestone WHERE status = 'funded':
  CALL release_milestone(escrow_id, milestone_id)
```

Batch release runs in single SQL transaction — all or nothing.

---

## 9. Escrow invariants (daily check)

Reconciliation job verifies:

```sql
-- Client escrow held = sum of funded milestones
SELECT SUM(escrow_held) FROM wallets
  = SELECT SUM(amount) FROM escrow_milestones WHERE status IN ('funded','disputed');

-- Platform escrow pool balance
SELECT balance FROM wallet_accounts WHERE account_code = 'platform:escrow_pool'
  = SUM funded milestone amounts + disputed holds;
```

Violation → P0 alert, freeze all releases until resolved.

---

## 10. API endpoints

| Method | Path | Actor |
|--------|------|-------|
| GET | `/escrow/{id}` | Order participant |
| GET | `/escrow/order/{orderId}` | Order participant |
| POST | `/escrow/{id}/milestones/{mid}/release` | Client |
| POST | `/escrow/{id}/dispute` | Client or Freelancer |
| POST | `/admin/escrow/{id}/freeze` | Admin |
| POST | `/admin/escrow/{id}/unfreeze` | Admin |

---

## 11. Frontend migration

| Store function | API |
|----------------|-----|
| `createEscrowFromOrder()` | Server on checkout |
| `fundEscrow()` | Server on checkout |
| `releaseEscrowMilestone()` | POST release endpoint |
| `openEscrowDispute()` | POST dispute |
| `refundEscrowToClient()` | Admin refund endpoint |
| `getEscrowByOrderId()` | GET by order |

Remove localStorage escrow persistence — subscribe via API + WebSocket `escrow.updated`.

---

## 12. Related documents

- [TRANSACTION_FLOW.md](./TRANSACTION_FLOW.md)
- [DISPUTE_FLOW.md](./DISPUTE_FLOW.md)
- [REFUND_FLOW.md](./REFUND_FLOW.md)
- [WALLET_SYSTEM.md](./WALLET_SYSTEM.md)
- [PAYMENT_ARCHITECTURE.md](./PAYMENT_ARCHITECTURE.md)

---

*Escrow is the core trust mechanism for Ishbor. All state transitions are server-enforced with PostgreSQL row locks.*
