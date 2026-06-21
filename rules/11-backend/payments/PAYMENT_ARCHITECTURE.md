# PAYMENT_ARCHITECTURE.md

**Scope:** Server-authoritative payment and ledger system for Ishbor marketplace  
**Market:** Uzbekistan — UZS settlement via Humo/Uzcard; USD display and accounting  
**Stack:** FastAPI + PostgreSQL 16 + Redis + Celery on self-hosted VPS (no Supabase)  
**Sources:** `wallet-store.ts`, `escrow-store.ts`, `checkout.tsx`, `payment-methods-store.ts`, `subscription-store.ts`, DATABASE_SCHEMA §6, PROJECT_BIBLE §10

---

## 1. Design principles

| Principle | Rule |
|-----------|------|
| Server authority | All balance mutations occur in PostgreSQL transactions; frontend is read-only |
| Double-entry ledger | Every money movement produces balanced ledger entries |
| Idempotency | All POST money endpoints require `X-Idempotency-Key` |
| Gateway isolation | Humo/Uzcard/Payme adapters behind `PaymentGateway` interface |
| PCI minimization | Never store PAN — gateway token_ref only |
| Audit trail | Append-only `wallet_transactions`, `payment_records`, `ledger_entries` |
| Currency model | USD primary ledger; UZS charged at live rate with immutable FX snapshot |

---

## 2. Money flow overview

```
Client wallet (USD ledger)
    │
    ├── Deposit ──▶ Humo/Uzcard/Payme ──▶ webhook confirms ──▶ available +
    │
    ├── Checkout ──▶ Escrow hold ──▶ platform:escrow_pool
    │                      │
    │                      ├── Milestone release ──▶ Freelancer available +
    │                      ├── Platform fee (5%) ──▶ revenue_ledger
    │                      └── Dispute freeze ──▶ Admin resolution
    │
    └── Withdrawal ──▶ pending ──▶ gateway payout ──▶ UZS to card
```

**Display:** Frontend shows USD via `formatUsd()`. Checkout may show UZS equivalent for local cards using `fx_rate_snapshots` at transaction time.

---

## 3. Currency strategy

| Layer | Currency | Notes |
|-------|----------|-------|
| Ledger accounts | USD | `wallets.currency = 'USD'` |
| Gateway charge | UZS | Humo/Uzcard charge in so'm |
| FX snapshot | Stored per payment | `payment_records.fx_rate`, `amount_uzs`, `amount_usd` |
| Subscription plans | UZS list price | 99,000 / 249,000 UZS per `subscription-store.ts` |
| Admin reporting | USD + UZS columns | Founder panel aggregates both |

FX source: Central Bank UZ daily rate cached in Redis (`fx:usd_uzs`, TTL 1h). Payment captures rate at webhook time — never retroactive adjustment.

---

## 4. Platform fees

| Event | Fee | Destination |
|-------|-----|-------------|
| Checkout (escrow fund) | 5% of order subtotal | `revenue_ledger` |
| Wallet deposit | 1% of deposit amount | `revenue_ledger` |
| Withdrawal | Gateway fee passed through | External — not platform revenue |

```python
# Checkout fee calculation (server-side only)
subtotal_usd = order.amount
platform_fee_usd = round(subtotal_usd * Decimal("0.05"), 2)
total_hold_usd = subtotal_usd + platform_fee_usd
```

Fee is collected at escrow fund time: client `available` decreases by `total_hold_usd`; freelancer receives milestone amounts from `subtotal_usd` only.

---

## 5. Core services (FastAPI)

| Service | Responsibility |
|---------|----------------|
| `PaymentService` | Gateway orchestration, webhook dispatch |
| `WalletService` | Balance queries, deposit/withdraw initiation |
| `EscrowService` | State machine, milestone release |
| `LedgerService` | Double-entry posting, reconciliation |
| `SubscriptionService` | Plan billing, usage enforcement |
| `CreditsService` | Promotional credits purchase/spend |
| `ReconciliationJob` | Daily gateway ↔ ledger match |

All services run inside the same FastAPI process (×2 behind Nginx) with shared PostgreSQL connection pool.

---

## 6. Payment gateway adapters

### Adapter interface

```python
class PaymentGateway(Protocol):
    async def create_payment(self, params: CreatePaymentParams) -> PaymentIntent: ...
    async def handle_webhook(self, body: bytes, headers: dict) -> WebhookResult: ...
    async def refund(self, gateway_ref: str, amount_uzs: int) -> RefundResult: ...
    async def tokenize_card(self, params: TokenizeParams) -> TokenRef: ...
```

### Phase rollout

| Phase | Provider | Methods |
|-------|----------|---------|
| P0 | Payme Merchant API | Humo, Uzcard (aggregated) |
| P1 | Humo direct API | Humo tokenization |
| P1 | Uzcard direct API | Uzcard tokenization |
| P2 | Stripe | Visa/Mastercard international |

See [HUMO_INTEGRATION.md](./HUMO_INTEGRATION.md) and [UZCARD_INTEGRATION.md](./UZCARD_INTEGRATION.md).

---

## 7. API surface (v1)

| Method | Path | Actor | Purpose |
|--------|------|-------|---------|
| GET | `/wallet` | Owner | Balance + recent transactions |
| POST | `/wallet/deposit` | Owner | Initiate gateway deposit |
| POST | `/wallet/withdraw` | Owner | Request payout to saved method |
| GET | `/payment-methods` | Owner | List tokenized methods |
| POST | `/payment-methods` | Owner | Tokenize Humo/Uzcard |
| DELETE | `/payment-methods/{id}` | Owner | Remove method |
| POST | `/checkout/confirm` | Client | Fund escrow from wallet |
| POST | `/escrow/{id}/milestones/{mid}/release` | Client | Release milestone |
| POST | `/escrow/{id}/dispute` | Participant | Open dispute |
| POST | `/webhooks/payme` | Gateway | Payment confirmation |
| POST | `/webhooks/humo` | Gateway | Humo events |
| POST | `/webhooks/uzcard` | Gateway | Uzcard events |
| POST | `/subscription/upgrade` | Freelancer | Plan change + charge |
| POST | `/credits/purchase` | Owner | Buy promotional credits |

All POST endpoints: session auth + idempotency key + rate limit.

---

## 8. Database tables (financial)

| Table | Role |
|-------|------|
| `wallets` | Materialized balance per user (updated by trigger) |
| `wallet_transactions` | User-facing transaction log |
| `wallet_accounts` | Double-entry account heads |
| `ledger_entries` | Debit/credit pairs per mutation |
| `payment_records` | Gateway audit trail |
| `payment_methods` | Token references (Humo/Uzcard/Visa) |
| `escrow_workflows` | Escrow state machine |
| `escrow_milestones` | Per-milestone fund/release |
| `disputes` | Dispute lifecycle |
| `revenue_ledger` | Platform fee aggregation |
| `subscriptions` | Recurring billing state |
| `fx_rate_snapshots` | Immutable rate at payment time |

See [WALLET_SYSTEM.md](./WALLET_SYSTEM.md), [ESCROW_SYSTEM.md](./ESCROW_SYSTEM.md), [TRANSACTION_FLOW.md](./TRANSACTION_FLOW.md).

---

## 9. Webhook security

```
1. Gateway POST /webhooks/{provider}
2. Verify signature (HMAC-SHA256 or provider-specific Authorization header)
3. Lookup payment_records by gateway_ref — if status=completed, return 200 (idempotent)
4. BEGIN TX
5. Post ledger entries
6. UPDATE payment_records.status
7. COMMIT
8. Emit domain event (WalletDeposited, EscrowFunded, etc.)
9. Enqueue notification job
```

Failed signature → 401 + alert P0. Processing error → 500 (gateway retries).

---

## 10. Subscriptions and credits

### Subscription plans (UZS billing, USD ledger equivalent)

| Plan | UZS/mo | Proposals | Max services |
|------|--------|-----------|--------------|
| free | 0 | 10 | 3 |
| pro | 99,000 | unlimited | 20 |
| elite | 249,000 | unlimited | unlimited |

Recurring charge via Celery cron `subscription_renewal` — Humo/Uzcard default method or wallet balance fallback.

### Credits

Promotional credits (featured listings) purchased via gateway or deducted from `credits_wallets`. Separate from main wallet — no double-spend across systems.

Referral credit: 50,000 UZS equivalent on referred user's first completed order.

---

## 11. Reconciliation jobs (Celery)

| Job | Schedule | Action |
|-----|----------|--------|
| `reconcile_gateways` | Daily 03:00 UZT | Match `payment_records` ↔ Payme/Humo/Uzcard API |
| `escrow_balance_check` | Daily 03:30 UZT | SUM escrow milestones funded = SUM wallet escrow_held |
| `revenue_report` | Daily 04:00 UZT | Aggregate `revenue_ledger` → admin founder metrics |
| `stale_pending_withdrawals` | Hourly | Alert on withdrawals pending >24h |

Discrepancy → P1 alert, auto-freeze affected wallet pending manual review.

---

## 12. Frontend migration

| Client store (remove writes) | API replacement |
|------------------------------|-----------------|
| `depositFunds()` | POST `/wallet/deposit` |
| `withdrawFunds()` | POST `/wallet/withdraw` |
| `holdEscrowFunds()` | POST `/checkout/confirm` |
| `releaseEscrowMilestone()` | POST `/escrow/.../release` |
| `processEscrowMilestoneRelease()` | Server-side on milestone release |
| `purchaseCredits()` | POST `/credits/purchase` |
| `upgradePlan()` | POST `/subscription/upgrade` |

Remove all localStorage wallet persistence. Frontend displays server balances via `GET /wallet`.

---

## 13. Error handling and user messaging

All payment errors return Uzbek user-facing messages with stable error codes:

| Code | HTTP | User message (UZ) |
|------|------|-------------------|
| `INSUFFICIENT_BALANCE` | 402 | Hamyoningizda yetarli mablag' yo'q |
| `GATEWAY_DECLINED` | 402 | To'lov rad etildi. Boshqa kartani sinab ko'ring |
| `IDEMPOTENCY_CONFLICT` | 409 | So'rov allaqachon bajarilgan |
| `ESCROW_FROZEN` | 423 | Eskrou muzlatilgan — nizo ochilgan |
| `WITHDRAWAL_LIMIT` | 429 | Kunlik yechib olish limiti oshib ketdi |

Internal details logged with `requestId` — never exposed to client.

---

## 14. Related documents

- [WALLET_SYSTEM.md](./WALLET_SYSTEM.md) — double-entry ledger
- [ESCROW_SYSTEM.md](./ESCROW_SYSTEM.md) — state machine
- [TRANSACTION_FLOW.md](./TRANSACTION_FLOW.md) — SQL transaction boundaries
- [REFUND_FLOW.md](./REFUND_FLOW.md) — refund paths
- [DISPUTE_FLOW.md](./DISPUTE_FLOW.md) — dispute resolution
- [HUMO_INTEGRATION.md](./HUMO_INTEGRATION.md) — Humo gateway
- [UZCARD_INTEGRATION.md](./UZCARD_INTEGRATION.md) — Uzcard gateway
- [../security/SECURITY_ARCHITECTURE.md](../security/SECURITY_ARCHITECTURE.md) — PCI and auth
- [../infrastructure/INFRASTRUCTURE_ARCHITECTURE.md](../infrastructure/INFRASTRUCTURE_ARCHITECTURE.md) — VPS deployment

---

*Production blocker per FUTURE_ROADMAP P0 #2. Ledger authority moves from client localStorage to PostgreSQL on VPS.*
