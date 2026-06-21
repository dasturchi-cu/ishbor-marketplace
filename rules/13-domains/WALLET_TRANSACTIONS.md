# WALLET_TRANSACTIONS — Domain Specification

## Purpose & business value

User wallet tracks available balance, escrow holds, and pending withdrawals. Platform revenue (5% PLATFORM_FEE) recorded in revenue-store on releases.

## Entity: UserWallet

```typescript
{
  available: number      // USD
  escrow: number         // held for active orders
  pending: number        // withdrawal in flight
  lifetimeEarned: number
  transactions: WalletTransaction[]
}
```

**Storage:** `ishbor-wallet` → `Record<userId, UserWallet>`

## Transaction kinds

| kind | category | direction |
|------|----------|-----------|
| in | deposit | +available |
| out | withdrawal | -available, +pending |
| escrow_hold | order | -available, +escrow |
| escrow_release | milestone | +available (freelancer), lifetimeEarned |
| fee | platform | deducted on deposit (1%) and release (5% via revenue) |

**Status:** `Yakunlangan` | `Kutilmoqda` | `Muvaffaqiyatsiz`

## Key functions

| Function | Effect |
|----------|--------|
| depositFunds | +available, 1% fee tx |
| withdrawFunds | -available, +pending |
| holdEscrowFunds | client pay into escrow |
| releaseEscrowToFreelancer | freelancer payout |
| deductEscrowHeld | client escrow reduction |
| processEscrowMilestoneRelease | orchestrates release pair |
| getWalletForSession | scoped to current user |

## User journey

1. `/wallet` → view balance + transaction list + filters
2. Deposit → depositFunds (demo — no Payme yet)
3. Checkout → holdEscrowFunds linked to order
4. Milestone release → automatic wallet update
5. Withdraw → pending state (demo)

## Payment methods

`payment-methods-store` — `ishbor-payment-methods`  
Types: card, bank, payme (UI)  
Functions: addPaymentMethod, setDefaultPaymentMethod

## Database requirements (target)

**Immutable ledger pattern** — never update balances without ledger row:

Tables: `wallet_accounts`, `ledger_entries`, `payment_methods`, `withdrawal_requests`, `revenue_ledger`

Double-entry: every escrow hold has matching debit/credit rows.

## API requirements

```
GET  /api/v1/wallet
POST /api/v1/wallet/deposit
POST /api/v1/wallet/withdraw
GET  /api/v1/wallet/transactions?page=
POST /api/v1/payment-methods
```

Payme webhook confirms deposit (PAYMENT_ARCHITECTURE).

## Security

- **Highest risk domain** — client-side balance is forgeable today
- Production: all mutations server-side, client read-only via Query
- Withdrawal: KYC verified + 2FA for amounts > threshold

## Admin

`/admin/payments` — PaymentRecord[] from admin-data-store

## Scalability

- Ledger append-only, partition by month
- Balance = SUM(ledger) materialized view refreshed async
- 100k users × avg 50 tx = 5M rows — index user_id + created_at

## Edge cases

| Case | Recovery |
|------|----------|
| Insufficient available for escrow | Block checkout server-side |
| Duplicate release | Idempotency key on release API |
| Negative balance | DB constraint CHECK (available >= 0) |
| Currency mix UZS/USD | Separate wallet_accounts per currency (future) |

Related: [ORDERS_ESCROW.md](./ORDERS_ESCROW.md), revenue-store PLATFORM_FEE = 0.05
