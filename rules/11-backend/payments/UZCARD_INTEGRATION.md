# UZCARD_INTEGRATION.md

**Provider:** Uzcard (Uzcard Processing Center)  
**Use case:** Secondary local card rail — same flows as Humo for deposits, subscriptions, withdrawals  
**Integration path:** Payme Merchant API (P0) → Uzcard Direct API (P1)  
**Sources:** `payment-methods-store.ts` Uzcard seed, PAYMENT_ARCHITECTURE.md

---

## 1. Overview

Uzcard is the second major card network in Uzbekistan. Ishbor treats Uzcard identically to Humo at the application layer — both map to `payment_methods.type = 'uzcard'` with provider-specific adapter implementations.

**User experience:** User selects "Uzcard" at payment method setup; sees UZS amounts; ledger credits USD equivalent.

Many users hold both Humo and Uzcard cards — Ishbor supports multiple saved methods with one default.

---

## 2. Uzcard vs Humo at Ishbor layer

| Aspect | Humo | Uzcard |
|--------|------|--------|
| `payment_methods.type` | `humo` | `uzcard` |
| Token field | `token_ref` | `token_ref` |
| Gateway adapter | `HumoGateway` / Payme | `UzcardGateway` / Payme |
| Webhook route | `/webhooks/humo` | `/webhooks/uzcard` |
| Ledger posting | Identical | Identical |
| FX snapshot | Identical | Identical |

Application services (`WalletService`, `LedgerService`) are provider-agnostic — only `PaymentService` dispatches to the correct adapter.

---

## 3. Integration phases

| Phase | Provider | Notes |
|-------|----------|-------|
| P0 | Payme with Uzcard routing | Single merchant account covers Humo + Uzcard |
| P1 | Uzcard Direct API | Separate merchant registration with Uzcard PC |
| P2 | Unified checkout widget | Provider selection UI, same backend |

P0 requires only Payme merchant certification — Uzcard transactions route automatically based on BIN detection.

---

## 4. Card tokenization flow

```
1. POST /payment-methods { type: "uzcard" }
2. Server creates tokenization session via Payme/Uzcard
3. User enters card on provider-hosted page
4. Callback → server stores token_ref + last4
5. INSERT payment_methods
```

### BIN detection

Payme returns card network in webhook metadata:

```json
{
  "account": { "card": "8600********1234" },
  "card_type": "uzcard"
}
```

Server validates `card_type` matches saved method type — mismatch triggers method re-verification.

---

## 5. Payment flow

### One-time charge (deposit)

```
POST /wallet/deposit
  → amount_uzs calculated from amount_usd × fx_rate
  → UzcardGateway.charge(token_ref, amount_uzs, idempotency_key)
  → User completes OTP on bank app (Uzcard 3DS equivalent)
  → Webhook confirms
  → LedgerService.post_deposit()
```

### Recurring charge (subscription)

```
Celery subscription_renewal job
  → Load default payment_method for user
  → If type=uzcard: UzcardGateway.charge_recurring(token_ref, plan_price_uzs)
  → On failure: mark subscription past_due, notify user, retry in 3 days
```

Uzcard recurring requires explicit user consent stored in `payment_methods.recurring_consent_at`.

---

## 6. PCI scope

| Data | Stored | PCI impact |
|------|--------|------------|
| Full PAN | Never | Out of scope |
| CVV | Never (not even transient) | Out of scope |
| Expiry | Optional last4 only | Minimal |
| token_ref | Yes — encrypted at rest | SAQ A |
| 3DS session tokens | Redis TTL 15 min | Ephemeral |

**Ishbor PCI posture:** SAQ A — all card entry on provider iframe/redirect.

### Scope boundaries

```
┌─────────────────────────────────────────┐
│  IN PCI SCOPE (Provider)                │
│  Payme/Uzcard hosted payment page       │
│  Card vault, 3DS, OTP                   │
└─────────────────────────────────────────┘
          │ token_ref only
          ▼
┌─────────────────────────────────────────┐
│  OUT OF PCI SCOPE (Ishbor VPS)          │
│  FastAPI, PostgreSQL, Redis, MinIO      │
│  Stores token_ref — not card data         │
└─────────────────────────────────────────┘
```

Never log webhook bodies containing masked PAN beyond last4.

---

## 7. Webhook handling

### Payme (P0 — Uzcard via Payme)

Same handler as Humo — `/webhooks/payme` — Payme JSON-RPC protocol. Card network identified in transaction metadata.

### Uzcard Direct (P1)

```
POST /webhooks/uzcard
Headers:
  X-Uzcard-Signature: RSA-SHA256 signature
  Content-Type: application/json

Events:
  - transaction.success
  - transaction.failed
  - refund.success

Processing:
1. Verify RSA signature with Uzcard public key (rotated via config)
2. Idempotency by transaction_id
3. Post ledger or mark failed
4. Return 200 within 5s (provider timeout)
```

---

## 8. Sandbox vs production

| Config | Sandbox | Production |
|--------|---------|------------|
| Payme test mode | `PAYME_TEST=true` | `PAYME_TEST=false` |
| Uzcard API | `https://sandbox.uzcard.uz` | `https://api.uzcard.uz` |
| Test BINs | 8600 0000 ... (provider list) | Live cards only |
| Webhook URL | staging-api.ishbor.uz | api.ishbor.uz |

**Certification checklist before prod:**

- [ ] Successful deposit end-to-end in sandbox
- [ ] Failed payment (insufficient funds) handled
- [ ] Duplicate webhook idempotency verified
- [ ] Withdrawal to Uzcard test card
- [ ] Subscription renewal sandbox cycle
- [ ] PCI SAQ A attestation filed

---

## 9. Withdrawal flow

Identical to Humo withdrawal — see [HUMO_INTEGRATION.md](./HUMO_INTEGRATION.md) §7.

Uzcard payout API may have different settlement windows:

| Type | Typical settlement |
|------|-------------------|
| Humo instant payout | Minutes |
| Uzcard standard payout | 1–24 hours |

`wallet_transactions.status` remains `pending` until webhook confirms payout.

---

## 10. Failure handling

| Failure | Server behavior |
|---------|-----------------|
| Card expired | Return error, prompt re-tokenization |
| OTP timeout | Mark payment pending, allow retry with same idempotency key |
| Provider downtime | Queue retry job, show maintenance message |
| FX rate stale | Reject deposit if rate >2h old — refresh from CBU |

User-facing errors always in Uzbek — see PAYMENT_ARCHITECTURE §13.

---

## 11. Reconciliation

Daily job compares:

```
SELECT gateway_ref, amount_uzs, status FROM payment_records
WHERE method LIKE 'uzcard%' AND created_at > yesterday
```

Against Uzcard merchant portal export or API. Mismatch → finance_admin alert + wallet freeze for affected user.

---

## 12. Environment variables

```bash
# Shared with Payme (P0)
PAYME_MERCHANT_ID=
PAYME_KEY=

# Uzcard Direct (P1)
UZCARD_MERCHANT_ID=
UZCARD_API_KEY=
UZCARD_WEBHOOK_PUBLIC_KEY=  # PEM for signature verify
UZCARD_API_URL=https://api.uzcard.uz/v1
```

---

## 13. Related documents

- [HUMO_INTEGRATION.md](./HUMO_INTEGRATION.md)
- [PAYMENT_ARCHITECTURE.md](./PAYMENT_ARCHITECTURE.md)
- [TRANSACTION_FLOW.md](./TRANSACTION_FLOW.md)
- [../security/SECURITY_ARCHITECTURE.md](../security/SECURITY_ARCHITECTURE.md)

---

*Uzcard and Humo share 95% of application code — only gateway adapters differ. Payme P0 covers both networks without separate Uzcard merchant registration.*
