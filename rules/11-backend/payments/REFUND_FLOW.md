# REFUND_FLOW.md

**Scope:** Client-initiated refunds, automatic paths, and admin override  
**Authority:** RefundService + LedgerService — maps `refundEscrowToClient()` in escrow-store  
**Sources:** admin.disputes, ESCROW_SYSTEM.md, WALLET_SYSTEM.md

---

## 1. Refund types

| Type | Trigger | Actor | Funds destination |
|------|---------|-------|-------------------|
| Full escrow refund | Order cancelled before work starts | Client or system | Client available |
| Partial milestone refund | Admin dispute split | Admin | Client + Freelancer per split |
| Gateway refund | Deposit reversal | Admin | Original card via Humo/Uzcard |
| Admin override refund | Policy exception | `finance_admin` | Client available or gateway |

All refunds produce append-only `wallet_transactions` with `category='refund'`.

---

## 2. Client-initiated refund paths

### 2.1 Pre-work cancellation

**Condition:** Escrow status = `funded`, no milestone delivered, order cancelled within 48h.

```
POST /orders/{id}/cancel
  → Guard: escrow.status IN ('funded', 'accepted')
  → Guard: no milestone.status = 'released'
  → Full refund TX (see §4)
```

User message: "Buyurtma bekor qilindi. Mablag' hamyoningizga qaytarildi."

### 2.2 Milestone rejection (revision cycle)

Not a refund — funds stay in escrow until release or dispute. Client cannot unilaterally withdraw funded escrow mid-project.

If client wants money back during active work → must open dispute (see DISPUTE_FLOW.md).

---

## 3. Admin override refund

Maps admin `admin.disputes.tsx` resolution actions and `refundEscrowToClient()`.

| Admin action | Permission | Effect |
|--------------|------------|--------|
| Full refund to client | `finance_admin` | All funded milestones → client available |
| Partial refund | `finance_admin` | Split per resolution JSON |
| Gateway chargeback | `finance_admin` | Reverse original deposit via Payme/Humo API |
| Deny refund | `finance_admin` | Close dispute, release to freelancer |

All admin refunds require:

```json
{
  "reason": "string — required",
  "ticket_id": "support ticket optional",
  "resolution_code": "full_refund | partial | deny"
}
```

Logged in `audit_logs` with actor, IP, before/after escrow state.

---

## 4. Full escrow refund — atomic transaction

Maps `refundEscrowToClient()`.

```sql
BEGIN;

SELECT * FROM escrow_workflows WHERE id = :escrow_id FOR UPDATE;
-- Guard: frozen or admin actor

-- Sum all funded/disputed milestone amounts
SELECT COALESCE(SUM(amount), 0) AS refund_total
FROM escrow_milestones
WHERE escrow_id = :escrow_id AND status IN ('funded', 'disputed');

SELECT * FROM wallets WHERE user_id = :client_id FOR UPDATE;

-- Ledger
INSERT INTO ledger_entries ...
  -- debit platform:escrow_pool (refund_total)
  -- credit client:available (refund_total)
  -- debit client:escrow (refund_total)

UPDATE wallets SET
  available = available + :refund_total,
  escrow_held = escrow_held - :refund_total
WHERE user_id = :client_id;

UPDATE escrow_milestones SET status = 'released'
WHERE escrow_id = :escrow_id AND status IN ('funded', 'disputed');

UPDATE escrow_workflows SET status = 'completed';
UPDATE orders SET status = 'cancelled';

INSERT INTO wallet_transactions (client, kind='in', category='refund', amount=:refund_total, ...);
INSERT INTO escrow_timeline_events (step='Mijozga qaytarildi', done=true);

-- Close open dispute if any
UPDATE disputes SET status = 'closed', resolution = :resolution_json, closed_at = now()
WHERE escrow_id = :escrow_id AND status = 'open';

COMMIT;
-- Emit EscrowRefunded, OrderCancelled
```

**Note:** Platform fee (5%) is NOT refunded on client cancellation after work started — policy configurable in `system_config.refund_fee_policy`.

Default policy:

| Cancel timing | Platform fee |
|---------------|--------------|
| Before milestone work | Refunded |
| After work started | Not refunded |

---

## 5. Partial refund (dispute split)

Admin sets resolution JSON:

```json
{
  "client_percent": 60,
  "freelancer_percent": 40,
  "notes": "Partial delivery accepted"
}
```

```sql
BEGIN;
-- refund_amount = escrow_total * client_percent / 100
-- release_amount = escrow_total * freelancer_percent / 100

-- Client portion → post_refund()
-- Freelancer portion → post_milestone_release()

UPDATE disputes SET status = 'closed', resolution = :json, closed_at = now();
UPDATE escrow_workflows SET status = 'completed', frozen_by_admin = false;
COMMIT;
```

---

## 6. Gateway refund (deposit reversal)

For erroneous deposits or chargebacks:

```
1. Admin POST /admin/payments/{id}/refund
2. Verify payment_records.type = 'deposit', status = 'completed'
3. Call Payme/Humo refund API with gateway_ref + amount_uzs
4. ON webhook refund.completed:
   BEGIN TX
   Debit user:available (amount)
   Credit external:gateway
   INSERT wallet_transactions (category='refund')
   UPDATE payment_records status
   COMMIT
```

If user already spent refunded amount → wallet goes negative blocked → admin collection workflow.

---

## 7. Refund invariants

| Rule | Enforcement |
|------|-------------|
| Cannot refund more than escrow held | SUM check before TX |
| Cannot refund released milestones | status guard |
| Idempotency | `X-Idempotency-Key` on admin refund POST |
| Audit | Every refund → audit_logs + wallet_transactions |
| Notification | Client + freelancer notified on all refunds |

---

## 8. API endpoints

| Method | Path | Actor |
|--------|------|-------|
| POST | `/orders/{id}/cancel` | Client (pre-work) |
| POST | `/admin/escrow/{id}/refund` | Admin full refund |
| POST | `/admin/disputes/{id}/resolve` | Admin with split |
| POST | `/admin/payments/{id}/refund` | Admin gateway reversal |

---

## 9. Frontend migration

| Store function | Replacement |
|----------------|-------------|
| `refundEscrowToClient(escrowId)` | Admin API only — remove client-side |
| Cancel order button | POST `/orders/{id}/cancel` with server guards |

Client UI shows refund status from `GET /wallet/transactions?category=refund`.

---

## 10. Error codes

| Code | Condition |
|------|-----------|
| `REFUND_NOT_ALLOWED` | Work already delivered |
| `REFUND_EXCEEDS_HELD` | Amount > escrow held |
| `ESCROW_FROZEN` | Pending dispute without admin |
| `GATEWAY_REFUND_FAILED` | Provider rejected reversal |

---

## 11. Related documents

- [DISPUTE_FLOW.md](./DISPUTE_FLOW.md)
- [ESCROW_SYSTEM.md](./ESCROW_SYSTEM.md)
- [TRANSACTION_FLOW.md](./TRANSACTION_FLOW.md)
- [HUMO_INTEGRATION.md](./HUMO_INTEGRATION.md)

---

*Refunds are admin-gated except pre-work cancellation. All paths use atomic SQL transactions with full audit trail.*
