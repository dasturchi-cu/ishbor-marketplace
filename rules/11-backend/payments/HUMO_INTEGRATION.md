# HUMO_INTEGRATION.md

**Provider:** Humo (National Bank of Uzbekistan payment system)  
**Use case:** Primary local card rail for UZS deposits, subscription billing, and withdrawals  
**Integration path:** Payme Merchant API (P0) → Humo Direct API (P1)  
**Sources:** `payment-methods-store.ts` Humo seed, PAYMENT_ARCHITECTURE.md

---

## 1. Overview

Humo is the dominant debit card network in Uzbekistan. Ishbor uses Humo for:

- Wallet top-up (client deposits UZS, credited as USD ledger equivalent)
- Subscription recurring charges (pro/elite plans)
- Freelancer withdrawals to Humo card
- Saved payment methods (tokenized — no PAN storage)

**Currency flow:** User sees UZS at checkout; server converts using FX snapshot; ledger posts USD.

---

## 2. Integration phases

| Phase | Method | Scope |
|-------|--------|-------|
| P0 — Sandbox | Payme Merchant API with Humo routing | Deposits, subscriptions |
| P0 — Production | Payme production merchant | Same flows after certification |
| P1 | Humo Direct Merchant API | Tokenization, lower fees, direct webhooks |
| P2 | Humo recurring billing API | Native subscription autopay |

Payme acts as aggregator in P0 — simplifies PCI scope and single webhook endpoint. Humo Direct reduces per-transaction cost at scale.

---

## 3. Card tokenization flow

```
1. Client POST /payment-methods { type: "humo", redirectUrl }
2. PaymentService.create_tokenization_session()
   → Payme/Humo returns checkout URL or embedded form token
3. User completes card entry on provider-hosted page (PCI SAQ A)
4. Provider redirects to ishbor.uz/payment-methods/callback?session=...
5. Server exchanges session for token_ref
6. INSERT payment_methods (type=humo, last4, token_ref, label)
7. Return 201 to client
```

**Never:** Accept raw card numbers on Ishbor servers or in frontend forms.

### Token storage

| Column | Value |
|--------|-------|
| `payment_methods.token_ref` | Provider opaque token |
| `payment_methods.last4` | Last 4 digits for display |
| `payment_methods.type` | `humo` |
| `payment_methods.label` | User-defined or "Humo •••• 1234" |

Tokens are revocable — DELETE `/payment-methods/{id}` calls provider revoke API.

---

## 4. Deposit flow (wallet top-up)

```
1. POST /wallet/deposit
   Body: { amount_usd, method_id, idempotency_key }
2. Server calculates amount_uzs = amount_usd × fx_rate
3. PaymentService.charge_token(token_ref, amount_uzs, idempotency_key)
4. Returns { status: "pending", payment_id, redirect_url? }
5. User completes 3DS/OTP if required on provider page
6. Webhook POST /webhooks/payme (or /webhooks/humo)
7. Server verifies signature, posts ledger (see TRANSACTION_FLOW.md)
8. WebSocket + notification: WalletDeposited
```

Pending deposits expire after 30 minutes — Celery job marks `payment_records.status=failed`.

---

## 5. Webhook handling

### Payme webhook (P0)

```
POST /webhooks/payme
Headers:
  Authorization: Basic base64(merchant_id:merchant_key)
Body: JSON-RPC 2.0 (Payme protocol)

Handler:
1. Parse method: CheckPerformTransaction, PerformTransaction, CancelTransaction
2. Verify Authorization header
3. Idempotency: payment_records.gateway_ref UNIQUE
4. On PerformTransaction success → LedgerService.post_deposit()
5. Return JSON-RPC result
```

### Humo Direct webhook (P1)

```
POST /webhooks/humo
Headers:
  X-Humo-Signature: HMAC-SHA256(body, webhook_secret)
  X-Humo-Timestamp: unix epoch

Handler:
1. Reject if timestamp >5 min old (replay protection)
2. Verify HMAC signature
3. Process event types: payment.completed, payment.failed, refund.completed
4. Idempotent by event_id stored in payment_records.metadata
```

All webhook handlers run in dedicated FastAPI route with no session auth — signature auth only.

---

## 6. Sandbox vs production

| Setting | Sandbox | Production |
|---------|---------|------------|
| `PAYME_MERCHANT_ID` | Test merchant ID | Live merchant ID |
| `PAYME_KEY` | Test key | Live key (Vault only) |
| `HUMO_API_URL` | `https://sandbox.humo.uz/...` | `https://api.humo.uz/...` |
| `HUMO_WEBHOOK_SECRET` | Test secret | Rotated quarterly |
| Test cards | Provider test PAN list | N/A |
| Webhook URL | `https://staging-api.ishbor.uz/webhooks/payme` | `https://api.ishbor.uz/webhooks/payme` |

**Environment isolation:** Separate merchant accounts, separate webhook secrets, separate `payment_records` databases (staging DB never shares prod credentials).

### Sandbox test scenarios

| Scenario | Expected |
|----------|----------|
| Successful payment | Webhook → ledger credit |
| Insufficient funds | Webhook failed → no ledger post |
| Duplicate webhook | Idempotent 200, single ledger entry |
| Invalid signature | 401, no state change |
| Timeout (no webhook) | Pending expires, user can retry |

---

## 7. Withdrawal to Humo

```
1. POST /wallet/withdraw { amount_usd, method_id }
2. Verify method.type = humo, available >= amount
3. Move available → pending (single TX)
4. Celery: WithdrawalProcessor
   → Convert USD to UZS at withdrawal FX rate
   → Call Humo payout API with token_ref
5. On success: pending -= amount, payment_records completed
6. On failure: reverse pending → available, notify user
```

Daily withdrawal limits: configurable in `system_config` (default 10,000 USD equivalent per user).

---

## 8. Error codes and retry policy

| Humo/Payme code | Ishbor action | User message |
|-----------------|---------------|--------------|
| `-31050` insufficient funds | Fail deposit | Kartada mablag' yetarli emas |
| `-31001` invalid card | Fail tokenization | Karta ma'lumotlari noto'g'ri |
| `-32400` system error | Retry 3× exponential | Vaqtincha xatolik — qayta urinib ko'ring |
| Timeout | Mark pending, reconcile job | To'lov kutilmoqda |

Gateway calls: 3 retries with 1s/2s/4s backoff. Idempotency key passed on every charge attempt.

---

## 9. PCI DSS scope

| Component | PCI scope |
|-----------|-----------|
| Ishbor frontend | SAQ A — redirect to provider hosted fields |
| FastAPI API | SAQ A-EP — no card data touches server |
| PostgreSQL | Out of scope — stores token_ref only |
| Logs | Must never log card numbers, CVV, or full tokens |

Annual PCI attestation required before production Humo Direct integration.

---

## 10. Monitoring and alerts

| Metric | Alert |
|--------|-------|
| Webhook signature failures | P0 — possible attack |
| Deposit success rate <90% (15 min) | P1 |
| Humo API latency p95 >5s | P2 |
| Pending deposits >100 | P2 — reconciliation backlog |

Admin system page pings Humo/Payme sandbox health endpoint every 5 minutes.

---

## 11. Configuration (environment variables)

```bash
# P0 — Payme (Humo routing)
PAYME_MERCHANT_ID=
PAYME_KEY=
PAYME_CALLBACK_URL=https://api.ishbor.uz/webhooks/payme

# P1 — Humo Direct
HUMO_MERCHANT_ID=
HUMO_API_KEY=
HUMO_WEBHOOK_SECRET=
HUMO_API_URL=https://api.humo.uz/v1

# FX
FX_USD_UZS_SOURCE=cbu  # Central Bank of Uzbekistan
```

Secrets stored in `.env` on VPS (not git) — see [../infrastructure/ENVIRONMENT_STRATEGY.md](../infrastructure/ENVIRONMENT_STRATEGY.md).

---

## 12. Related documents

- [PAYMENT_ARCHITECTURE.md](./PAYMENT_ARCHITECTURE.md)
- [UZCARD_INTEGRATION.md](./UZCARD_INTEGRATION.md)
- [TRANSACTION_FLOW.md](./TRANSACTION_FLOW.md)
- [../security/SECURITY_ARCHITECTURE.md](../security/SECURITY_ARCHITECTURE.md)

---

*Humo integration is P0 for Uzbekistan market launch. Payme sandbox available immediately; Humo Direct requires merchant certification.*
