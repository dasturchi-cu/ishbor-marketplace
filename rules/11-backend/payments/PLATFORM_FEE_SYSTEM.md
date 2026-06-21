# PLATFORM_FEE_SYSTEM.md

**Scope:** Ishbor platform fee rates, collection timing, and ledger posting  
**Rates:** 5% on escrow fund (release-side accounting) · 1% on wallet deposit  
**Authority:** `wallet-store.ts`, `revenue-store.ts` (`PLATFORM_FEE = 0.05`)  
**Stack:** FastAPI `LedgerService` + PostgreSQL double-entry  
**Related:** [WALLET_SYSTEM.md](./WALLET_SYSTEM.md), [ESCROW_SYSTEM.md](./ESCROW_SYSTEM.md), [COMMISSION_SYSTEM.md](./COMMISSION_SYSTEM.md)

---

## 1. Fee summary

| Event | Rate | When collected | User-visible label (Uzbek) |
|-------|------|----------------|----------------------------|
| Wallet deposit | **1%** | Payme/Humo webhook confirm | To'ldirish komissiyasi |
| Escrow fund (checkout) | **5%** | Checkout confirm | Platforma komissiyasi (checkout summary) |
| Milestone release | **0%** | N/A — fee already taken | — |
| Withdrawal | **0%** platform | Gateway pass-through only | Bank komissiyasi (external) |

**Constants (server-only):**

```python
DEPOSIT_FEE_RATE = Decimal("0.01")
PLATFORM_FEE_RATE = Decimal("0.05")  # matches revenue-store PLATFORM_FEE
```

Never expose adjustable rates to client — load from `platform_config` table with admin override + audit.

---

## 2. Deposit fee (1%) — wallet-store

Maps `depositFunds(userId, amount, method)`:

```typescript
const fee = Math.round(amount * 0.01);
// available += amount - fee
// tx: "Hamyon to'ldirish" (+amount)
// tx: "To'ldirish komissiyasi" (-fee)
```

**FastAPI `LedgerService.post_deposit`:**

```python
fee_usd = round(amount_usd * DEPOSIT_FEE_RATE, 2)
net_credit = amount_usd - fee_usd

# Ledger pairs (single transaction_group_id):
# Credit user:{id}:available  net_credit
# Credit platform:revenue     fee_usd
# Debit  external:gateway     amount_usd  (synthetic clearing)
```

**Revenue recording:**

```python
await revenue_service.record(
    type="deposit_fee",  # or platform_fee with meta.event=deposit
    amount_usd=fee_usd,
    user_id=user_id,
    meta={"method": gateway_name},
)
```

**User journey:** `/wallet` → deposit → Payme redirect → webhook → balance updates with fee line visible in transaction list filter "Fees".

---

## 3. Platform fee (5%) — escrow fund

Maps `addOrderPayment()` which calls `holdEscrowFunds(userId, amount + round(amount * 0.05), project)`.

**Checkout math:**

```
order_subtotal_usd = order.amount          # freelancer will receive from this pool
platform_fee_usd   = round(subtotal * 0.05, 2)
total_hold_usd     = subtotal + platform_fee
```

Client `available` decreases by `total_hold_usd`. Client `escrow_held` increases by `order_subtotal_usd` only — fee goes directly to platform revenue, not escrow pool.

**FastAPI `LedgerService.post_escrow_hold`:**

```python
# Debit  client:available     total_hold_usd
# Credit client:escrow        subtotal_usd
# Credit platform:revenue     platform_fee_usd
# Credit platform:escrow_pool subtotal_usd
```

**Important:** Freelancer milestone releases transfer **full milestone amount** from escrow pool — no second 5% deduction at release (see ESCROW_SYSTEM.md §5).

---

## 4. Fee at release — revenue-store linkage

`revenue-store.computePlatformRevenue()` calculates 5% of **completed order GMV**:

```typescript
orderFees = completedOrders.reduce((s, o) => s + o.amount * PLATFORM_FEE_RATE, 0)
```

This is an **aggregation view** — fee cash was already collected at fund time. `recordRevenueEntry({ type: "platform_fee" })` should fire at escrow fund, not at milestone release.

**Idempotency:** One `platform_fee` revenue row per order_id. Duplicate checkout webhooks must not double-charge — guard with `UNIQUE(order_id, type)` on `revenue_ledger`.

---

## 5. UI disclosure requirements

Per PROJECT_BIBLE and UX_STANDARDS — fees must be visible before confirm:

| Screen | Display |
|--------|---------|
| `/checkout` | Line item: "Platforma komissiyasi (5%): $X" |
| `/wallet` deposit modal | "1% to'ldirish komissiyasi qo'llaniladi" |
| Order receipt email | Fee breakdown (see EMAIL_NOTIFICATION_MATRIX) |
| `/orders/{id}` | Escrow funded amount vs fee in payment section |

No hidden fees. Uzbek copy only in user-facing strings.

---

## 6. Fee exemptions (admin-configurable)

Default: no exemptions. Future `platform_config.fee_exempt_user_ids` for:

- Founding freelancer program (0% first 3 orders)
- Enterprise agency contracts (negotiated rate)
- Internal test accounts (staging only)

Exemption requires:
1. Superadmin approval
2. `audit_logs` entry with reason
3. Modified fee rate stored on order row `fee_rate_override`

---

## 7. PostgreSQL schema

### `revenue_ledger`

| Column | Notes |
|--------|-------|
| id | uuid PK |
| type | platform_fee, deposit_fee, … |
| amount_usd | numeric(14,2) |
| user_id | payer |
| order_id | nullable — set for checkout fees |
| payment_id | nullable — set for deposit fees |
| meta | jsonb — method, fx_rate, etc. |
| created_at | timestamptz immutable |

### `orders` fee columns

| Column | Notes |
|--------|-------|
| amount | subtotal (freelancer pool) |
| platform_fee_usd | computed at checkout |
| total_charged_usd | amount + platform_fee_usd |

---

## 8. API endpoints affecting fees

| Method | Path | Fee behavior |
|--------|------|--------------|
| POST | `/api/v1/wallet/deposit` | 1% on confirm webhook |
| POST | `/api/v1/checkout/confirm` | 5% in same TX as escrow hold |
| GET | `/api/v1/wallet/transactions` | Returns fee rows with kind=fee |
| GET | `/api/v1/orders/{id}/payment-summary` | Subtotal + fee breakdown |

All POST endpoints require `X-Idempotency-Key`.

---

## 9. Reconciliation

Daily job (`ReconciliationJob` in PAYMENT_ARCHITECTURE):

```sql
-- Fee collected vs escrow holds
SELECT o.id, o.platform_fee_usd, r.amount
FROM orders o
JOIN revenue_ledger r ON r.order_id = o.id AND r.type = 'platform_fee'
WHERE o.escrow_funded = true
  AND ABS(o.platform_fee_usd - r.amount) > 0.01;
```

Also verify `platform:revenue` wallet account balance = SUM(revenue_ledger cash types).

---

## 10. Refund fee policy

| Refund type | Platform fee |
|-------------|--------------|
| Full admin refund before work starts | Fee returned to client available |
| Partial dispute split | Pro-rata fee retention |
| Client cancellation after work started | Fee retained (platform cost recovery) |

Admin refund flow (`adminRefundEscrow`) posts reversing ledger entries including fee credit to client when policy applies.

---

## 11. FX and UZS display

Gateway charges UZS; fee calculated on **USD ledger amount** at FX snapshot time:

```
amount_usd = amount_uzs / fx_rate_snapshot
platform_fee_usd = round(amount_usd * 0.05, 2)
```

Store `fx_rate`, `amount_uzs`, `amount_usd` on `payment_records` — fee never recalculated retroactively if FX moves.

---

## 12. Demo → production migration

| Demo (client) | Production (FastAPI) |
|---------------|---------------------|
| `depositFunds()` inline 1% | `WalletService.confirm_deposit()` webhook handler |
| `addOrderPayment()` 5% hold | `CheckoutService.confirm()` |
| `PLATFORM_FEE` export | `platform_config` + env default 0.05 |
| Fee txs in localStorage | `wallet_transactions` + `ledger_entries` |

**Security:** Client-side fee calculation is forgeable today — server recalculates all fees; reject request if client-sent fee differs by > $0.01.

---

## 13. Monitoring alerts

| Condition | Severity |
|-----------|----------|
| platform:revenue balance drift | P0 |
| Order funded without revenue row | P1 |
| Fee rate mismatch in config vs code | P2 |
| Deposit fee > 1% due to rounding bug | P1 |

Prometheus metric: `ishbor_platform_fee_usd_total{type="checkout|deposit"}`.

---

*Two fee touchpoints: 1% when money enters Ishbor wallet, 5% when money enters escrow for a order. Milestone releases are fee-free transfers from escrow pool to freelancer available balance.*
