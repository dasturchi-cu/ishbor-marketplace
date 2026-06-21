# TRANSACTION_FLOW.md

**Scope:** End-to-end money sequences with SQL transaction boundaries  
**Pattern:** deposit → hold → release → fee  
**Stack:** FastAPI + asyncpg + PostgreSQL 16 on VPS  
**Sources:** PAYMENT_ARCHITECTURE.md, WALLET_SYSTEM.md, ESCROW_SYSTEM.md, wallet-store.ts

---

## 1. Transaction boundary rules

| Rule | Detail |
|------|--------|
| One business operation = one SQL transaction | Never split hold+release across TXs |
| Row locks | `SELECT ... FOR UPDATE` on wallets and escrow before mutation |
| Idempotency inside TX | Check idempotency_key before any INSERT |
| Events after COMMIT | Domain events emitted only after successful commit |
| Webhook processing | Full ledger post inside single TX |
| Failure | ROLLBACK — no partial state; return error to caller |

Connection pool: min 5, max 20 per FastAPI instance (2 instances behind Nginx).

---

## 2. Sequence: Deposit (gateway → wallet)

```
Client                    FastAPI                  PostgreSQL              Gateway
  │                          │                         │                      │
  │ POST /wallet/deposit     │                         │                      │
  │─────────────────────────▶│                         │                      │
  │                          │ BEGIN                   │                      │
  │                          │ INSERT payment_records  │                      │
  │                          │   status=pending        │                      │
  │                          │ COMMIT                  │                      │
  │                          │────────────────────────▶│                      │
  │                          │ charge(amount_uzs)      │                      │
  │                          │─────────────────────────────────────────────────▶│
  │◀─ redirect/3DS ──────────│                         │                      │
  │                          │                         │     webhook          │
  │                          │◀────────────────────────────────────────────────│
  │                          │ BEGIN                   │                      │
  │                          │ FOR UPDATE payment_rec  │                      │
  │                          │ IF completed: COMMIT ret│                      │
  │                          │ INSERT ledger_entries   │                      │
  │                          │ INSERT wallet_tx        │                      │
  │                          │ UPDATE wallets          │                      │
  │                          │ UPDATE payment pending→done                     │
  │                          │ COMMIT                  │                      │
  │                          │ emit WalletDeposited    │                      │
```

### SQL inside webhook handler

```sql
BEGIN;

SELECT * FROM payment_records
WHERE gateway_ref = :ref AND status = 'pending'
FOR UPDATE;

-- Idempotent exit
IF NOT FOUND OR status = 'completed' THEN
  ROLLBACK; RETURN existing_result;
END IF;

-- Deposit: $100, fee 1% = $1
INSERT INTO ledger_entries (transaction_group_id, ...) VALUES
  (:gid, 'user:'||:uid||':available', 'credit', 99.00, ...),
  (:gid, 'platform:revenue',         'credit',  1.00, ...),
  (:gid, 'external:gateway',         'debit', 100.00, ...);

INSERT INTO wallet_transactions (user_id, kind, category, amount, idempotency_key, ...)
VALUES (:uid, 'in', 'deposit', 100.00, :key, ...),
       (:uid, 'fee', 'fee', -1.00, :key||'-fee', ...);

UPDATE wallets SET available = available + 99.00 WHERE user_id = :uid;

UPDATE payment_records SET status = 'completed' WHERE id = :payment_id;

COMMIT;
```

---

## 3. Sequence: Checkout fund escrow (hold + fee)

Maps `holdEscrowFunds()` + checkout confirm.

```
POST /checkout/confirm
  Body: { order_id, idempotency_key }
```

### Preconditions (outside TX — fast fail)

- Session user = order.client_user_id
- Order status allows funding
- No existing funded escrow for order

### SQL transaction

```sql
BEGIN;

-- Lock client wallet
SELECT available, escrow_held FROM wallets
WHERE user_id = :client_id FOR UPDATE;

-- Calculate
-- subtotal = order.amount (e.g. 1000.00)
-- platform_fee = subtotal * 0.05 (50.00)
-- total_hold = 1050.00

IF available < total_hold THEN
  ROLLBACK; RAISE 'INSUFFICIENT_BALANCE';
END IF;

-- Idempotency
INSERT INTO wallet_transactions (idempotency_key, ...) VALUES (:key, ...)
ON CONFLICT (idempotency_key) DO NOTHING RETURNING id;
IF NOT FOUND THEN ROLLBACK; RETURN cached_response; END IF;

-- Create escrow
INSERT INTO escrow_workflows (order_id, amount, status) VALUES (:oid, :subtotal, 'funded');
INSERT INTO escrow_milestones (...) VALUES (...);

-- Ledger
INSERT INTO ledger_entries ... -- 4 entries balanced

UPDATE wallets SET
  available = available - :total_hold,
  escrow_held = escrow_held + :subtotal
WHERE user_id = :client_id;

INSERT INTO payment_records (type='escrow_transfer', status='held', ...);
INSERT INTO revenue_ledger (amount=:platform_fee, source='checkout', ...);

UPDATE orders SET escrow_funded = true, status = 'in_progress';

COMMIT;
-- Emit CheckoutCompleted, EscrowFunded
```

**Boundary:** Order creation + wallet hold + escrow creation + fee collection = **one transaction**. Failure rolls back entirely — no orphan orders.

---

## 4. Sequence: Milestone release

Maps `releaseEscrowMilestone()` + `processEscrowMilestoneRelease()`.

```sql
BEGIN;

SELECT * FROM escrow_workflows WHERE id = :escrow_id FOR UPDATE;
-- Guard: frozen_by_admin = false, status != 'disputed'

SELECT * FROM escrow_milestones WHERE id = :mid FOR UPDATE;
-- Guard: status = 'funded'

SELECT available, escrow_held FROM wallets WHERE user_id = :client_id FOR UPDATE;
SELECT available FROM wallets WHERE user_id = :freelancer_id FOR UPDATE;

UPDATE escrow_milestones SET status = 'released' WHERE id = :mid;

-- Ledger: 4 entries
-- debit client:escrow, credit platform:escrow_pool (release from hold)
-- debit platform:escrow_pool, credit freelancer:available (payout)

UPDATE wallets SET escrow_held = escrow_held - :amount WHERE user_id = :client_id;
UPDATE wallets SET available = available + :amount,
                   lifetime_earned = lifetime_earned + :amount
WHERE user_id = :freelancer_id;

INSERT INTO wallet_transactions (client, kind='escrow_hold', amount=-:amount, ...);
INSERT INTO wallet_transactions (freelancer, kind='in', category='milestone', amount=:amount, ...);

-- Auto-complete if all milestones released
UPDATE escrow_workflows SET status = 'completed'
WHERE id = :escrow_id
  AND NOT EXISTS (
    SELECT 1 FROM escrow_milestones
    WHERE escrow_id = :escrow_id AND status NOT IN ('released')
  );

COMMIT;
-- Emit EscrowMilestoneReleased
```

**Boundary:** Milestone status + both wallet updates + both transaction logs = **one transaction**.

---

## 5. Sequence: Withdrawal

### Phase 1 — Hold (synchronous API)

```sql
BEGIN;
SELECT available FROM wallets WHERE user_id = :uid FOR UPDATE;
IF available < :amount THEN ROLLBACK; END IF;

UPDATE wallets SET available = available - :amount, pending = pending + :amount;
INSERT INTO wallet_transactions (kind='out', category='withdrawal', status='pending', ...);
INSERT INTO payment_records (type='withdrawal', status='pending', ...);
COMMIT;
```

### Phase 2 — Gateway payout (Celery async)

```sql
BEGIN;
-- On gateway success
UPDATE wallets SET pending = pending - :amount;
UPDATE wallet_transactions SET status = 'completed';
UPDATE payment_records SET status = 'completed';
INSERT INTO ledger_entries ... -- debit pending, credit external:gateway
COMMIT;
```

### Phase 2 — Failure reversal

```sql
BEGIN;
UPDATE wallets SET pending = pending - :amount, available = available + :amount;
UPDATE wallet_transactions SET status = 'failed';
UPDATE payment_records SET status = 'failed';
COMMIT;
```

**Boundary:** Phase 1 and Phase 2 are separate transactions (async gateway). Reversal is its own atomic TX.

---

## 6. Fee extraction summary

| Event | Fee % | When collected | Ledger account |
|-------|-------|----------------|----------------|
| Deposit | 1% | Webhook confirm | platform:revenue |
| Checkout | 5% | Escrow fund TX | platform:revenue |
| Milestone release | 0% | N/A | — |
| Withdrawal | Gateway pass-through | Payout | external:gateway |

Fees are never retroactive — captured at transaction time in `revenue_ledger`.

---

## 7. Isolation level

PostgreSQL default `READ COMMITTED` with explicit row locks — sufficient for wallet operations.

For reconciliation reports: `REPEATABLE READ` snapshot queries.

---

## 8. Deadlock prevention

Lock ordering convention (always acquire in this order):

1. `payment_records` (if involved)
2. `escrow_workflows`
3. `wallets` (sorted by user_id UUID)
4. `wallet_accounts`

Prevents circular wait when concurrent milestone releases on shared platform accounts.

---

## 9. Testing requirements

| Test | Assert |
|------|--------|
| Deposit idempotency | Duplicate webhook → single ledger group |
| Insufficient balance checkout | Zero rows changed |
| Concurrent milestone release | One succeeds, one 409 |
| Withdrawal failure reversal | available restored exactly |
| Ledger balance | SUM debits = SUM credits globally |

Integration tests run against PostgreSQL in CI Docker — see [../infrastructure/CI_CD_PIPELINE.md](../infrastructure/CI_CD_PIPELINE.md).

---

## 10. Related documents

- [WALLET_SYSTEM.md](./WALLET_SYSTEM.md)
- [ESCROW_SYSTEM.md](./ESCROW_SYSTEM.md)
- [REFUND_FLOW.md](./REFUND_FLOW.md)
- [PAYMENT_ARCHITECTURE.md](./PAYMENT_ARCHITECTURE.md)

---

*Every money mutation has an explicit SQL BEGIN/COMMIT boundary. Async gateway callbacks complete the ledger inside their own atomic transaction.*
