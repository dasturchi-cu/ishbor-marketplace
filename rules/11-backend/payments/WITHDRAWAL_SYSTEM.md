# WITHDRAWAL_SYSTEM.md

**Scope:** Freelancer/client bank payout from Ishbor wallet — pending flow and KYC gates  
**Maps:** `withdrawFunds()`, wallet `pending` bucket, `/admin/payments` withdrawal queue  
**Stack:** FastAPI `WalletService` + Celery `wallet_pending_release` job + Humo/Uzcard payout API  
**Related:** [WALLET_SYSTEM.md](./WALLET_SYSTEM.md), [TRANSACTION_FLOW.md](./TRANSACTION_FLOW.md), [PAYMENT_ARCHITECTURE.md](./PAYMENT_ARCHITECTURE.md)

---

## 1. Overview

Withdrawal moves funds from **available** → **pending** → external bank card (UZS). Platform does not charge a percentage fee on withdrawal; gateway pass-through fees may apply and are disclosed at confirm.

```
available  ──request──▶  pending  ──gateway──▶  bank card (UZS)
                │                    │
                └── KYC + limits ────┘
```

Demo: `withdrawFunds()` sets status `Kutilmoqda` immediately. Production: Phase 1 sync hold + Phase 2 async Celery payout.

---

## 2. User journey

1. User opens `/wallet` → "Yechib olish"
2. Selects saved payment method (`payment-methods-store` — card/bank/payme)
3. Enters amount (≤ available, ≥ minimum $10 USD equivalent)
4. **KYC gate:** identity verified required for any withdrawal; enhanced verification for > $1,000/day
5. **2FA gate:** TOTP or SMS OTP for amounts > $500 USD equivalent
6. Confirm → API Phase 1 → balance shows pending
7. Celery processes payout (5–30 min business hours)
8. Success → tx status `Yakunlangan`; failure → funds return to available

Uzbek error messages from `user-status-store` patterns — never expose internal gateway codes.

---

## 3. Phase 1 — Hold (synchronous API)

Maps `withdrawFunds(userId, amount, method)`:

```typescript
if (amount <= 0 || amount > w.available) return null;
available -= amount;
pending += amount;
// tx: kind=out, category=withdrawal, status=Kutilmoqda, label="Yechib olish"
```

**FastAPI:**

```python
@router.post("/wallet/withdraw")
async def request_withdrawal(body: WithdrawRequest, user=Depends(current_user)):
    await kyc_service.require_verified(user.id)
    await fraud_service.check_velocity(user.id, body.amount_usd)
    if body.amount_usd > TWO_FA_THRESHOLD:
        await auth_service.require_step_up(user.id, body.mfa_token)

    async with db.begin():
        await ledger.post_withdrawal_hold(
            user_id=user.id,
            amount_usd=body.amount_usd,
            idempotency_key=body.idempotency_key,
        )
        withdrawal = await withdrawal_repo.create(
            user_id=user.id,
            amount_usd=body.amount_usd,
            payment_method_id=body.payment_method_id,
            status="pending",
        )
    await celery.send_task("process_withdrawal", withdrawal.id)
    return {"withdrawal_id": withdrawal.id, "status": "pending"}
```

---

## 4. Phase 2 — Gateway payout (async Celery)

Cron: `wallet_pending_release` every 30 minutes (EVENT_ARCHITECTURE.md).

```python
async def process_withdrawal(withdrawal_id: UUID):
    withdrawal = await repo.get(withdrawal_id)
    fx = await fx_service.get_rate()
    amount_uzs = round(withdrawal.amount_usd * fx, 0)

    try:
        result = await gateway.create_payout(
            token_ref=payment_method.token_ref,
            amount_uzs=amount_uzs,
            idempotency_key=f"wd-{withdrawal_id}",
        )
    except GatewayError as e:
        await reverse_withdrawal_hold(withdrawal_id, reason=str(e))
        await notify_user(withdrawal.user_id, "withdrawal.failed")
        return

    async with db.begin():
        await ledger.post_withdrawal_complete(
            user_id=withdrawal.user_id,
            amount_usd=withdrawal.amount_usd,
        )
        await repo.update(withdrawal_id, status="completed", gateway_ref=result.ref)
        await wallet_tx_repo.update_status(withdrawal_id, "Yakunlangan")
```

**Success ledger:**
- Debit `user:{id}:pending`
- Credit `external:gateway`

---

## 5. Failure reversal

If gateway rejects (invalid card, insufficient gateway balance, fraud block):

```sql
UPDATE wallets SET pending = pending - :amount, available = available + :amount;
UPDATE wallet_transactions SET status = 'Muvaffaqiyatsiz';
UPDATE withdrawal_requests SET status = 'failed', failure_reason = :reason;
```

User notification (in-app + email): *"Yechib olish so'rovi rad etildi"* — maps admin audit seed for $3,000 Uzcard rejection.

---

## 6. KYC gates

| Level | Requirement | Unlocks |
|-------|-------------|---------|
| None | Email verified only | Deposits, escrow pay |
| Basic KYC | ID document approved (`admin.verifications`) | Withdrawals ≤ $1,000/day |
| Enhanced KYC | Business license or video verification | Unlimited daily (subject to velocity) |

**FastAPI check:**

```python
class KYCService:
    DAILY_LIMIT_BASIC = Decimal("1000")

    async def require_verified(self, user_id: UUID):
        user = await self.users.get(user_id)
        if not user.kyc_status == "approved":
            raise HTTPException(403, detail="Tasdiqlash talab qilinadi. /settings/verification")

    async def check_daily_limit(self, user_id: UUID, amount: Decimal):
        total_today = await self.withdrawals.sum_today(user_id)
        limit = self.DAILY_LIMIT_BASIC if user.kyc_tier == "basic" else DAILY_LIMIT_ENHANCED
        if total_today + amount > limit:
            raise HTTPException(402, detail="Kunlik yechib olish limiti oshdi")
```

KYC documents stored MinIO private bucket — see SECURITY_ARCHITECTURE.md.

---

## 7. Payment methods

From `payment-methods-store` — types: `card`, `bank`, `payme`.

| Field | Storage |
|-------|---------|
| PAN | Never — gateway `token_ref` only |
| Last4 | Display only |
| is_default | One per user |

Withdrawal must use verified payment method — new card requires micro-deposit verify (P2) or admin manual link.

---

## 8. Admin withdrawal queue

`/admin/payments` — `PaymentRecord[]` from admin-data-store:

| Admin action | Effect |
|--------------|--------|
| Approve | Move to Celery queue (if manual review flag) |
| Reject | Reverse hold + notify user |
| Flag fraud | Suspend user + freeze wallet |

High-value withdrawals (>$5,000) require finance admin MFA + second approver (dual control).

Audit category: `payment` — *"Yechib olish so'rovi rad etildi — Uzcard $3,000"*.

---

## 9. Velocity and fraud limits

See [FRAUD_PREVENTION.md](./FRAUD_PREVENTION.md). Summary:

| Limit | Value |
|-------|-------|
| Max single withdrawal | $10,000 USD |
| Daily total (basic KYC) | $1,000 USD |
| Daily total (enhanced) | $25,000 USD |
| Max pending withdrawals | 1 active per user |
| Cooldown after password change | 24h block |

Redis counters: `withdrawal:daily:{user_id}:{date}` with TTL 48h.

---

## 10. Status mapping

| DB status | UI status (Uzbek) | User meaning |
|-----------|-------------------|--------------|
| pending | Kutilmoqda | Processing |
| processing | Kutilmoqda | Sent to bank |
| completed | Yakunlangan | Funds sent |
| failed | Muvaffaqiyatsiz | Returned to available |
| cancelled | Muvaffaqiyatsiz | User or admin cancelled |

Wallet filter "Outgoing" includes pending withdrawals.

---

## 11. PostgreSQL tables

### `withdrawal_requests`

| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK |
| amount_usd | numeric(14,2) |
| amount_uzs | numeric(14,0) |
| fx_rate | numeric(12,6) |
| payment_method_id | uuid FK |
| status | enum |
| gateway_ref | varchar nullable |
| idempotency_key | varchar UNIQUE |
| reviewed_by | uuid nullable (admin) |
| created_at | timestamptz |

Append-only status history in `withdrawal_status_events`.

---

## 12. Notifications

| Event | Channels |
|-------|----------|
| Withdrawal requested | In-app (payment kind) |
| Withdrawal completed | In-app + email |
| Withdrawal failed | In-app + email + SMS if > $500 |
| Admin rejection | In-app (admin kind) via `notifyAdminAction()` |

---

## 13. Security controls

- All withdrawals server-side — client cannot set `pending` directly
- P0 incident: freeze all withdrawals via `platform_config.withdrawals_frozen`
- Rate limit: 5 withdrawal requests/hour per user
- Suspended/banned users: `isLoginBlocked` + block withdrawal API
- IP velocity: max 3 distinct users same payout card/week → fraud flag

---

## 14. API endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/wallet/withdraw` | User + KYC |
| GET | `/api/v1/wallet/withdrawals` | User paginated |
| POST | `/api/v1/admin/withdrawals/{id}/approve` | Finance admin |
| POST | `/api/v1/admin/withdrawals/{id}/reject` | Finance admin |

---

## 15. Demo → production

| Demo | Production |
|------|------------|
| Instant pending in localStorage | Phase 1 + Celery Phase 2 |
| No KYC check | `KYCService` enforced |
| No admin queue | `/admin/payments` live queue |
| status stuck Kutilmoqda | Gateway webhook updates |

---

*Withdrawal is the exit ramp from Ishbor — available balance becomes UZS on Uzcard/Humo after KYC, velocity checks, and async gateway settlement.*
