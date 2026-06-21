# PAYMENT_ARCHITECTURE.md

**Sources:** `wallet-store.ts`, `escrow-store.ts`, `checkout.tsx`, `client-checkout.ts`, `payment-methods-store.ts`, `subscription-store.ts`, `credits-store.ts`, PROJECT_BIBLE §10

---

## 1. Money model overview

```
Client funds ──▶ Escrow (held) ──▶ Milestone release ──▶ Freelancer wallet ──▶ Withdrawal
                      │
                      └──▶ Platform fee (5%) ──▶ revenue_ledger
                      └──▶ Dispute hold ──▶ Admin resolution
```

**Currency:** USD display (frontend) + UZS for local gateways (subscription plans: 99k/249k UZS)  
**Authority:** PostgreSQL ledger — no client-side balance mutation

---

## 2. Platform fee

| Rule | Value |
|------|-------|
| Checkout fee | 5% of order amount |
| Deposit fee | 1% (matches `depositFunds` in wallet-store) |
| Fee destination | `revenue_ledger` |

```typescript
// Checkout calculation
const subtotal = orderAmount;
const platformFee = round(subtotal * 0.05, 2);
const total = subtotal + platformFee;
```

---

## 3. Wallet ledger

### Accounts (double-entry conceptual)
| Account | Description |
|---------|-------------|
| user:{id}:available | Spendable balance |
| user:{id}:escrow | Held in active escrows |
| user:{id}:pending | Withdrawals in flight |
| platform:revenue | Fees collected |
| platform:escrow_pool | All funded escrow |

### Transaction flow: Deposit
```
1. Client POST /wallet/deposit { amount, methodId, idempotencyKey }
2. PaymentService.chargeGateway()
3. ON SUCCESS (webhook confirmed):
   INSERT wallet_transactions (kind=in, category=deposit)
   INSERT wallet_transactions (kind=fee, category=fee) if deposit fee
   UPDATE wallets.available (+ amount - fee)
4. Emit WalletDeposited
```

### Transaction flow: Checkout fund escrow
```
1. POST /checkout/confirm
2. BEGIN TX
3. Verify wallets.available >= total
4. INSERT orders, escrow_workflows
5. INSERT wallet_transactions (kind=escrow_hold, amount=-total)
6. UPDATE wallets (available -= total, escrow += orderAmount)
7. INSERT payment_records
8. COMMIT → CheckoutCompleted event
```

Maps `holdEscrowFunds()` + `createEscrowFromOrder()`.

### Transaction flow: Milestone release
```
1. POST /escrow/:id/milestones/:mid/release (client only)
2. BEGIN TX
3. UPDATE escrow_milestones.status = released
4. INSERT wallet_transactions (freelancer: kind=in, category=milestone)
5. UPDATE freelancer wallet.available += milestone.amount
6. UPDATE client wallet.escrow -= milestone.amount
7. COMMIT → EscrowMilestoneReleased
```

Maps `releaseEscrowMilestone()`.

### Transaction flow: Withdrawal
```
1. POST /wallet/withdraw { amount, methodId }
2. Verify available >= amount
3. available -= amount, pending += amount
4. INSERT wallet_transactions (kind=out, status=pending)
5. Background job → gateway payout
6. ON SUCCESS: pending -= amount, status=completed
7. ON FAIL: reverse hold
```

---

## 4. Payment methods

| Type | Gateway | Token storage |
|------|---------|---------------|
| humo | Payme/Click | gateway token_ref |
| uzcard | Payme/Click | gateway token_ref |
| visa | Stripe | Stripe payment method ID |
| swift | Manual | bank details encrypted |

**PCI:** Never store PAN — tokenization only.  
Maps `payment-methods-store.ts` Humo/Uzcard seed.

---

## 5. Payment gateway integration

### Phase 1: Payme (Uzbekistan)
```
POST /webhooks/payme
  → verify Authorization header (merchant key)
  → idempotent by transaction_id
  → update payment_records
  → complete pending wallet deposit OR subscription charge
```

### Phase 2: Click, Humo direct
Same webhook pattern with provider-specific adapters.

### Adapter interface
```typescript
interface PaymentGateway {
  createPayment(params: CreatePaymentParams): Promise<{ redirectUrl?, transactionId }>;
  handleWebhook(body: unknown, headers: Headers): Promise<WebhookResult>;
  refund(transactionId: string, amount: number): Promise<void>;
}
```

---

## 6. Escrow state machine

```
proposal → accepted → funded → in_progress → delivered → review → released → completed
                              ↘ disputed ↗
```

| Transition | Actor | Guard |
|------------|-------|-------|
| → funded | Client | wallet balance, checkout |
| → in_progress | System | auto on fund |
| → delivered | Freelancer | order progress 100% |
| → review | Client | confirm delivery |
| → released | Client | per milestone |
| → disputed | Either participant | open dispute |
| → completed | System | all milestones released |
| Admin freeze | Admin | finance_admin |
| Admin refund | Admin | dispute resolution |

Maps `escrow-store.ts` all functions.

---

## 7. Disputes & refunds

```
DisputeOpened
  → escrow frozen (frozen_by_admin=true)
  → Admin resolves: split % (e.g. 60/40 per admin mock)
  → INSERT wallet_transactions for each party
  → Emit DisputeResolved
```

Maps admin `admin.disputes.tsx` + `refundEscrowToClient()`.

---

## 8. Subscriptions

| Plan | Price (UZS/mo) | proposals/mo | max services |
|------|----------------|--------------|--------------|
| free | 0 | 10 | 3 |
| pro | 99,000 | unlimited | 20 |
| elite | 249,000 | unlimited | unlimited |

**Billing:** Recurring charge via Payme/Stripe on `subscription_renewal` cron.  
**Enforcement:** API middleware before POST /applications, POST /services.

Maps `PLANS` in `subscription-store.ts`.

---

## 9. Credits & promotions

| Action | Credits cost |
|--------|--------------|
| Featured listing (7 days) | 100,000 UZS equivalent in credits |
| Profile featured | plan-dependent discount |

**Purchase:** `POST /credits/purchase` → gateway → `credit_transactions`  
**Spend:** atomic decrement + `featured_listings` insert

Maps `credits-store.ts`, `featured-listings-store.ts`, `promotions.tsx`.

---

## 10. Referral credits

| Rule | Value |
|------|-------|
| Credit per referral | 50,000 UZS (CREDIT_PER_REFERRAL) |
| Trigger | referred user completes first order |
| Storage | credits_wallets.balance |

Maps `referral-store.ts`.

---

## 11. Idempotency

All money mutations require `X-Idempotency-Key`:
- Stored in `wallet_transactions.idempotency_key` UNIQUE
- Duplicate request returns original result (200)

---

## 12. Reconciliation

| Job | Frequency | Action |
|-----|-----------|--------|
| Gateway reconciliation | Daily | Match payment_records ↔ gateway API |
| Escrow balance check | Daily | SUM escrow = wallet escrow_held |
| Revenue report | Daily | Aggregate revenue_ledger → admin/founder |

---

## 13. Frontend migration

| Store function | API |
|----------------|-----|
| depositFunds() | POST /wallet/deposit |
| withdrawFunds() | POST /wallet/withdraw |
| holdEscrowFunds() | POST /checkout/confirm |
| releaseEscrowMilestone() | POST /escrow/.../release |
| purchaseCredits() | POST /credits/purchase |
| upgradePlan() | POST /subscription/upgrade |

**Remove:** Client-side balance writes entirely.

---

*Production blocker per FUTURE_ROADMAP P0 #2. See SECURITY_ARCHITECTURE for PCI controls.*
