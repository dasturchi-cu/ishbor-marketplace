# REFUND_LIFECYCLE.md

**Domain:** Returning client funds from escrow or gateway  
**Frontend authority:** `src/lib/escrow-store.ts` (`refundEscrowToClient`), `admin-data-store.ts` (`adminRefundEscrow`, `adminRefundEscrowByOrder`)  
**Backend authority:** RefundService + LedgerService  
**Related:** [REFUND_FLOW.md](../11-backend/payments/REFUND_FLOW.md), [WALLET_TRANSACTIONS.md](../../13-domains/WALLET_TRANSACTIONS.md)

---

## 1. Business purpose

Refunds return money to the client when:

- Order cancelled before meaningful work (pre-work cancel)
- Admin resolves dispute in client's favor (full or partial)
- Gateway deposit reversal (erroneous charge)
- Policy exception (finance_admin override)

All refunds create append-only `wallet_transactions` with `category='refund'` and audit_logs entries.

**Client UI:** refund status via `GET /api/v1/wallet/transactions?category=refund`

---

## 2. Refund types

| Type | Trigger | Actor | Destination |
|------|---------|-------|-------------|
| Full escrow refund | Pre-work cancel | Client or system | Client wallet available |
| Admin full refund | Dispute resolve | finance_admin | Client wallet available |
| Partial milestone refund | Dispute split | finance_admin | Client % + Freelancer % |
| Gateway refund | Deposit reversal | finance_admin | Original card via Humo/Uzcard |
| Admin override | Policy exception | finance_admin | Configurable |

Maps REFUND_FLOW.md §1.

---

## 3. Store function → server mapping

| Store function | Current (local) | Production |
|----------------|-----------------|------------|
| `refundEscrowToClient(escrowId)` | Mutates escrow-store | **Admin API only** — remove client-side |
| `adminRefundEscrow(escrowId)` | admin-data-store | POST `/api/v1/admin/escrow/:id/refund` |
| `adminRefundEscrowByOrder(orderId)` | lookup + refund | POST `/api/v1/admin/orders/:id/refund` |
| Cancel order button | N/A | POST `/api/v1/orders/:id/cancel` |

**Security:** Client ledger tampering via localStorage must not exist in production — wallet authority is PostgreSQL only.

---

## 4. Full escrow refund lifecycle

### 4.1 Store behavior (reference)

`refundEscrowToClient` in escrow-store:

```typescript
escrow.status = "completed"
milestones: funded|disputed → released (accounting closure)
timeline += "Mijozga qaytarildi", "Yakunlandi"
```

Note: milestone status `released` here means **closed out** — funds went to client, not freelancer. Server uses distinct closure statuses in ledger.

### 4.2 Client pre-work cancellation

**Condition:**

- Escrow status IN (`accepted`, `funded`)
- No milestone with status `released` to freelancer
- Within 48h of fund (configurable `system_config.refund_window_hours`)

```
POST /api/v1/orders/:order_id/cancel
X-Idempotency-Key: <uuid>
```

**User message:** *"Buyurtma bekor qilindi. Mablag' hamyoningizga qaytarildi."*

**Flow:**

1. Guard order + escrow state
2. SUM funded/disputed milestone amounts = refund_total
3. Atomic TX (see §6)
4. order.status = cancelled
5. escrow.status = completed
6. Emit `EscrowRefunded`, `OrderCancelled`

### 4.3 Admin full refund

```
POST /api/v1/admin/escrow/:escrow_id/refund
{
  "reason": "Nizo hal qilindi — mijoz foydasiga to'liq qaytarish",
  "ticketId": "SUP-1042",
  "idempotencyKey": "..."
}
```

Requires `finance_admin` + MFA step-up for amounts > 5000 USD equivalent.

Maps `adminRefundEscrow` / dispute resolution `full_refund`.

---

## 5. Partial refund (dispute split)

Admin resolution from `/admin/disputes`:

```json
{
  "resolutionCode": "split",
  "clientPercent": 60,
  "freelancerPercent": 40,
  "notes": "Qisman bajarilgan ish qabul qilindi"
}
```

**Calculation:**

```
total_held = SUM(milestone.amount WHERE status IN ('funded','disputed'))
client_refund = total_held * clientPercent / 100
freelancer_release = total_held * freelancerPercent / 100
```

**Wallet paths:**

- Client portion → `post_refund()` → available balance
- Freelancer portion → `post_milestone_release()` → minus 5% platform fee

Both in single SQL transaction with dispute close.

---

## 6. Atomic refund transaction

Conceptual SQL (maps REFUND_FLOW.md §4):

```sql
BEGIN;

SELECT * FROM escrow_workflows WHERE id = :escrow_id FOR UPDATE;
-- Guard: admin actor OR pre-work cancel eligible

SELECT COALESCE(SUM(amount), 0) AS refund_total
FROM escrow_milestones
WHERE escrow_id = :escrow_id AND status IN ('funded', 'disputed');

SELECT * FROM wallets WHERE user_id = :client_id FOR UPDATE;

-- Ledger entries:
-- debit platform:escrow_pool (refund_total)
-- credit client:available (refund_total)
-- debit client:escrow_held (refund_total)

UPDATE wallets SET
  available = available + :refund_total,
  escrow_held = escrow_held - :refund_total
WHERE user_id = :client_id;

UPDATE escrow_milestones SET status = 'released'  -- closure semantics
WHERE escrow_id = :escrow_id AND status IN ('funded', 'disputed');

UPDATE escrow_workflows SET status = 'completed', frozen_by_admin = false;
UPDATE orders SET status = 'cancelled';  -- or completed per policy

INSERT INTO wallet_transactions (
  user_id, kind='in', category='refund', amount=:refund_total, ...
);

INSERT INTO escrow_timeline_events (step='Mijozga qaytarildi', done=true);

UPDATE disputes SET status = 'closed', resolution = :json, closed_at = now()
WHERE escrow_id = :escrow_id AND status IN ('open', 'pending');

INSERT INTO audit_logs (action='escrow_refund', before_state=..., after_state=...);

COMMIT;
-- Emit EscrowRefunded
```

---

## 7. Platform fee on refund

Default policy (`system_config.refund_fee_policy`):

| Cancel timing | Platform fee (5%) |
|---------------|-------------------|
| Before milestone work started | Refunded to client |
| After work started | Not refunded |

Configurable per admin — changes require audit + founder approval.

---

## 8. Gateway refund path

For erroneous **deposits** (not escrow):

```
POST /api/v1/admin/payments/:payment_id/refund
{ "reason": "...", "idempotencyKey": "..." }
```

**Flow:**

1. Verify payment_records.type = deposit, status = completed
2. Call Humo/Uzcard refund API with gateway_ref
3. On webhook `refund.completed`:
   - Debit user available
   - INSERT wallet_transactions category=refund
   - UPDATE payment_records

If user already spent funds → wallet may go negative blocked → admin collection workflow.

**Error:** `GATEWAY_REFUND_FAILED`

---

## 9. Wallet credit semantics

Refunds credit **client available balance** — not original card automatically (escrow path).

| Source | Client receives |
|--------|-----------------|
| Escrow refund | Wallet available — withdraw or reuse |
| Gateway refund | Card reversal + wallet debit adjustment |
| Partial split | Percent to available |

Client notification:

*"${amount} miqdorida mablag' hamyoningizga qaytarildi"*

Freelancer notification on partial:

*"Nizo hal qilindi. Sizga ${amount} miqdorida to'lov amalga oshirildi"*

---

## 10. State diagram (refund entry points)

```
                    ┌─────────────────────┐
                    │  Escrow funded      │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
  POST orders/cancel    POST admin/refund     POST disputes/resolve
  (pre-work)            (full refund)         (split / full_refund)
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ wallet_tx refund    │
                    │ escrow completed    │
                    │ order cancelled     │
                    └─────────────────────┘
```

---

## 11. Invariants

| Rule | Error code |
|------|------------|
| Cannot refund > escrow held | `REFUND_EXCEEDS_HELD` |
| Cannot refund released-to-freelancer milestones | `REFUND_NOT_ALLOWED` |
| Escrow frozen — client cannot self-refund mid-dispute | `ESCROW_FROZEN` |
| Idempotency required | `IDEMPOTENCY_CONFLICT` if mismatch |
| Every refund audited | audit_logs + wallet_tx |

---

## 12. API reference

| Method | Path | Actor |
|--------|------|-------|
| POST | `/api/v1/orders/:id/cancel` | Client (pre-work) |
| POST | `/api/v1/admin/escrow/:id/refund` | finance_admin |
| POST | `/api/v1/admin/orders/:id/refund` | finance_admin |
| POST | `/api/v1/admin/disputes/:id/resolve` | finance_admin (split/full) |
| POST | `/api/v1/admin/payments/:id/refund` | finance_admin (gateway) |
| GET | `/api/v1/wallet/transactions?category=refund` | Owner |

---

## 13. Celery tasks

| Task | Trigger |
|------|---------|
| `ishbor.commerce.admin_escrow_refund` | Async admin refund (large batches) |
| `ishbor.notifications.create_in_app` | Refund confirmation |
| `ishbor.audit.log_event` | If audit insert deferred |

Money tasks: max 3 retries, PagerDuty on final failure.

---

## 14. Edge cases

| Case | Handling |
|------|----------|
| Partial milestone already released to freelancer | Refund/split only on remaining held |
| Order cancelled after fund | Full refund if no freelancer release |
| Admin refund during open dispute | Closes dispute with resolution JSON |
| Double refund click | Idempotency returns original 200 |
| Negative wallet after gateway refund | Block withdrawals until resolved |

---

## 15. Frontend migration checklist

- [ ] Remove `refundEscrowToClient` from client-accessible code paths
- [ ] Cancel button → POST `/orders/:id/cancel` with server guards
- [ ] Admin refund buttons → admin API with MFA
- [ ] Wallet page shows refund transactions from server
- [ ] Escrow UI disables client refund — link to dispute instead

---

## 16. Related documents

- [DISPUTE_LIFECYCLE.md](./DISPUTE_LIFECYCLE.md)
- [ESCROW_LIFECYCLE.md](./ESCROW_LIFECYCLE.md)
- [REFUND_FLOW.md](../11-backend/payments/REFUND_FLOW.md)
- [WALLET_SYSTEM.md](../11-backend/payments/WALLET_SYSTEM.md)
- [AUDIT_TRAIL_STRATEGY.md](../11-backend/postgresql/AUDIT_TRAIL_STRATEGY.md)

---

*Refunds are admin-gated except pre-work cancellation. All paths use atomic SQL with wallet_transactions category=refund, escrow completion, and immutable audit trail.*
