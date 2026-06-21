# WALLET_SYSTEM.md

**Model:** Double-entry ledger with materialized wallet balances  
**Authority:** PostgreSQL triggers + LedgerService — never client-writable  
**Sources:** `wallet-store.ts`, DATABASE_SCHEMA §6, PAYMENT_ARCHITECTURE.md

---

## 1. Overview

The Ishbor wallet system tracks user funds across three buckets:

| Bucket | Column | Description |
|--------|--------|-------------|
| Available | `wallets.available` | Spendable balance |
| Escrow held | `wallets.escrow_held` | Locked in active escrows |
| Pending | `wallets.pending` | Withdrawals in flight |

**Currency:** USD in ledger (`wallets.currency = 'USD'`). UZS appears only at gateway boundary.

Frontend maps `UserWallet` type:

```typescript
type UserWallet = {
  userId: string;
  available: number;
  escrow: number;      // maps escrow_held
  pending: number;
  lifetimeEarned: number;
  transactions: WalletTransaction[];
};
```

---

## 2. Double-entry accounts

### `wallet_accounts` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| account_code | varchar(100) | UNIQUE — e.g. `user:{uuid}:available` |
| account_type | enum | user_available, user_escrow, user_pending, platform_revenue, platform_escrow_pool |
| user_id | uuid NULL | NULL for platform accounts |
| balance | numeric(14,2) | Materialized — updated by ledger trigger |
| currency | char(3) | USD |

### Account chart

| Account code | Type | Owner |
|--------------|------|-------|
| `user:{id}:available` | user_available | User spendable |
| `user:{id}:escrow` | user_escrow | User escrow allocation |
| `user:{id}:pending` | user_pending | Withdrawal in progress |
| `platform:revenue` | platform_revenue | Platform fees |
| `platform:escrow_pool` | platform_escrow_pool | Aggregate held escrow |

Every mutation creates balanced debit/credit pair in `ledger_entries`.

---

## 3. `ledger_entries` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| transaction_group_id | uuid | Groups debit+credit pair |
| account_id | uuid | FK → wallet_accounts |
| entry_type | enum | debit, credit |
| amount | numeric(14,2) | Always positive |
| description | varchar(300) | |
| related_user_id | uuid | For user account entries |
| related_order_id | uuid NULL | |
| related_escrow_id | uuid NULL | |
| idempotency_key | varchar(64) | UNIQUE per group |
| created_at | timestamptz | Immutable |

**Invariant:** For every `transaction_group_id`, SUM(debits) = SUM(credits).

---

## 4. `wallet_transactions` (user-facing log)

Append-only audit log shown in wallet UI. Maps `WalletTransaction` type.

| kind | category | Direction | Example |
|------|----------|-----------|---------|
| in | deposit | +available | Hamyon to'ldirish |
| out | withdrawal | -available | Yechib olish |
| fee | fee | -available | To'ldirish komissiyasi (1%) |
| escrow_hold | escrow | -available, +escrow | Eskrou to'ldirildi |
| escrow_release | milestone | +available (freelancer) | Bosqich mablag'i |

Trigger `update_wallet_on_transaction()` syncs `wallets.*` columns from ledger — see DATABASE_SCHEMA § triggers.

---

## 5. LedgerService operations

```python
class LedgerService:
    async def post_deposit(self, user_id, amount_usd, fee_usd, idempotency_key) -> LedgerResult:
        """
        Credit user:available (amount - fee)
        Credit platform:revenue (fee)
        Debit external:gateway (amount) — synthetic clearing account
        """

    async def post_escrow_hold(self, client_id, amount, fee, order_id, escrow_id, idempotency_key):
        """
        Debit client:available (amount + fee)
        Credit client:escrow (amount)
        Credit platform:revenue (fee)
        Credit platform:escrow_pool (amount)
        """

    async def post_milestone_release(self, client_id, freelancer_id, amount, escrow_id, milestone_id):
        """
        Debit client:escrow (amount)
        Debit platform:escrow_pool (amount)
        Credit freelancer:available (amount)
        """

    async def post_withdrawal_hold(self, user_id, amount, idempotency_key):
        """
        Debit user:available (amount)
        Credit user:pending (amount)
        """

    async def post_withdrawal_complete(self, user_id, amount):
        """
        Debit user:pending (amount)
        Credit external:gateway (amount)
        """

    async def post_refund(self, client_id, amount, escrow_id, reason):
        """
        Debit platform:escrow_pool (amount)
        Credit client:available (amount)
        Debit client:escrow (amount)
        """
```

All methods: single PostgreSQL transaction, row-level locks on affected accounts.

---

## 6. Mapping wallet-store functions

| Client function | Ledger operation |
|-----------------|------------------|
| `depositFunds(userId, amount, method)` | `post_deposit` — 1% fee |
| `withdrawFunds(userId, amount, method)` | `post_withdrawal_hold` |
| `holdEscrowFunds(userId, amount, project)` | `post_escrow_hold` |
| `releaseEscrowToFreelancer(userId, amount, project)` | `post_milestone_release` (freelancer side) |
| `processEscrowMilestoneRelease(client, freelancer, amount, project)` | Full milestone release TX |
| `deductAvailable(userId, amount, label)` | Generic debit with audit |

**Remove:** All `persistWrite()` / localStorage wallet mutations.

---

## 7. Balance constraints

PostgreSQL CHECK constraints:

```sql
ALTER TABLE wallets ADD CONSTRAINT wallets_available_nonneg CHECK (available >= 0);
ALTER TABLE wallets ADD CONSTRAINT wallets_escrow_nonneg CHECK (escrow_held >= 0);
ALTER TABLE wallets ADD CONSTRAINT wallets_pending_nonneg CHECK (pending >= 0);
```

LedgerService validates before INSERT — insufficient balance returns `402 INSUFFICIENT_BALANCE` without partial mutation.

---

## 8. Idempotency

Every POST wallet mutation requires header:

```
X-Idempotency-Key: {uuid-v4}
```

Stored in `ledger_entries.idempotency_key` UNIQUE and `wallet_transactions.idempotency_key` UNIQUE.

Duplicate request within 24h:
- Return original result with HTTP 200
- No duplicate ledger entries

Redis cache: `idempotency:{key}` → response JSON, TTL 24h for fast lookup.

---

## 9. Wallet creation

Lazy creation on first authenticated wallet access:

```sql
INSERT INTO wallets (user_id) VALUES (:user_id) ON CONFLICT DO NOTHING;
INSERT INTO wallet_accounts (account_code, account_type, user_id)
  VALUES
    ('user:' || :user_id || ':available', 'user_available', :user_id),
    ('user:' || :user_id || ':escrow', 'user_escrow', :user_id),
    ('user:' || :user_id || ':pending', 'user_pending', :user_id)
  ON CONFLICT DO NOTHING;
```

Platform accounts created once at migration seed.

---

## 10. Credits wallet (separate system)

`credits_wallets` + `credit_transactions` — promotional credits, NOT fungible with main wallet.

| Action | Table |
|--------|-------|
| Purchase credits | `credit_transactions` + gateway |
| Spend on featured listing | Atomic decrement + `featured_listings` insert |
| Referral bonus | `referral_entries` trigger |

Never mix credits balance with `wallets.available` — separate API endpoints.

---

## 11. RLS policies

```sql
-- wallets: owner read only
CREATE POLICY wallets_owner ON wallets FOR SELECT USING (user_id = current_user_id());

-- wallet_transactions: owner read only
CREATE POLICY wallet_tx_owner ON wallet_transactions FOR SELECT USING (user_id = current_user_id());

-- wallet_accounts, ledger_entries: service role only (no user access)
```

Balance mutation: service role via FastAPI — no user-facing UPDATE endpoint.

---

## 12. Reconciliation

Daily job:

```sql
-- Verify wallets.available matches ledger
SELECT w.user_id, w.available, wa.balance
FROM wallets w
JOIN wallet_accounts wa ON wa.account_code = 'user:' || w.user_id || ':available'
WHERE w.available != wa.balance;
```

Any mismatch → freeze wallet + P0 alert.

---

## 13. API

| Method | Path | Response |
|--------|------|----------|
| GET | `/wallet` | `{ available, escrow, pending, lifetimeEarned, currency }` |
| GET | `/wallet/transactions?limit=50&cursor=` | Paginated `WalletTransaction[]` |
| POST | `/wallet/deposit` | `{ payment_id, redirect_url? }` |
| POST | `/wallet/withdraw` | `{ withdrawal_id, status: pending }` |

Display formatting: server returns raw numbers; frontend uses `formatUsd()`.

---

## 14. Related documents

- [TRANSACTION_FLOW.md](./TRANSACTION_FLOW.md)
- [PAYMENT_ARCHITECTURE.md](./PAYMENT_ARCHITECTURE.md)
- [ESCROW_SYSTEM.md](./ESCROW_SYSTEM.md)
- [../security/SECURITY_ARCHITECTURE.md](../security/SECURITY_ARCHITECTURE.md)

---

*Wallet balances are derived from immutable ledger entries. The `wallets` table is a performance cache maintained by triggers — ledger is source of truth.*
