# FRAUD_PREVENTION.md

**Scope:** Payment fraud controls — velocity limits, duplicate accounts, escrow abuse  
**Stack:** FastAPI middleware + Redis counters + PostgreSQL fraud_flags + Celery risk jobs  
**Risk domain:** WALLET_TRANSACTIONS — highest risk per domain spec  
**Related:** [WITHDRAWAL_SYSTEM.md](./WITHDRAWAL_SYSTEM.md), [ESCROW_SYSTEM.md](./ESCROW_SYSTEM.md), [SECURITY_ARCHITECTURE.md](../SECURITY_ARCHITECTURE.md)

---

## 1. Threat model

Ishbor money flows attract:

| Threat | Vector | Impact |
|--------|--------|--------|
| Balance forgery | Client-side wallet mutation (demo today) | Fake spendable funds |
| Escrow abuse | Fake delivery + colluding accounts | Platform fee theft, chargebacks |
| Withdrawal fraud | Stolen account → rapid cash-out | Direct loss |
| Multi-accounting | Same person, many freelancers | Review fraud, referral abuse |
| Velocity attacks | Automated deposit/withdraw cycles | AML flags, gateway suspension |
| Dispute manipulation | Open dispute to freeze legitimate payout | Freelancer cash-flow attack |

**Production principle:** All financial mutations server-side; fraud checks run **before** ledger commit, not after.

---

## 2. Architecture overview

```
HTTP Request
  → AuthMiddleware (session valid, not suspended)
  → FraudMiddleware (Redis velocity)
  → DomainService (business rules)
  → LedgerService (PostgreSQL TX)
  → FraudAuditWorker (async scoring, flag creation)
```

Redis: hot counters (TTL-bound). PostgreSQL `fraud_flags`, `device_fingerprints`, `linked_accounts` — durable investigation data.

---

## 3. Velocity limits

### 3.1 Withdrawal velocity

| Rule | Limit | Window | Action |
|------|-------|--------|--------|
| Single withdrawal max | $10,000 USD | per request | 400 reject |
| Daily withdrawal sum (basic KYC) | $1,000 USD | rolling 24h | 402 reject |
| Daily withdrawal sum (enhanced KYC) | $25,000 USD | rolling 24h | 402 reject |
| Withdrawal requests | 5 | per hour | 429 rate limit |
| Pending withdrawals | 1 | concurrent | block second request |
| Post-password-change | 0 | 24h | 403 block all withdrawals |

Implementation (Redis):

```python
key = f"withdraw:daily:{user_id}:{date_utc}"
current = await redis.incrbyfloat(key, amount)
await redis.expire(key, 86400 * 2)
if current > limit:
    raise FraudLimitExceeded("Kunlik yechib olish limiti oshdi")
```

### 3.2 Deposit velocity

| Rule | Limit | Action |
|------|-------|--------|
| Deposits per day | 10 | 429 |
| Deposit sum per day | $50,000 USD | manual review queue |
| Failed deposit attempts | 5 | 1h lock |

Prevents card testing attacks on Payme/Humo integration.

### 3.3 Escrow / checkout velocity

| Rule | Limit | Action |
|------|-------|--------|
| New escrow funds per client | 5 orders | rolling 24h — flag if exceeded |
| Same client-freelancer pair orders | 3 | rolling 7d — collusion flag |
| Milestone releases per hour | 10 | per user — bot detection |

---

## 4. Duplicate account detection

### 4.1 Signals

| Signal | Weight | Source |
|--------|--------|--------|
| Same normalized phone | High | auth.users.phone |
| Same device fingerprint | High | `device_fingerprints` table |
| Same payout card token | Critical | payment_methods.token_ref |
| IP /24 subnet cluster | Medium | request logs |
| Similar name + DOB on KYC | High | verification documents |
| Referral self-referral loop | Medium | referral graph |

### 4.2 Linking workflow

```python
async def on_user_register(user: User, device_fp: str):
    links = await fraud_repo.find_links(user, device_fp)
    if links.score >= AUTO_FLAG_THRESHOLD:
        await fraud_repo.create_flag(
            user_id=user.id,
            type="duplicate_account_suspected",
            linked_user_ids=links.ids,
            score=links.score,
        )
        await notify_admin_fraud_queue(user.id)
```

Admin `/admin/users/$id` shows linked accounts panel (production). Auto-suspend **never** without human review except payout card collision (immediate withdrawal freeze).

### 4.3 Demo gap

Today `user-status-store` is email-keyed localStorage — trivially bypassed. Production: server `account_status` + device binding at login.

---

## 5. Escrow abuse patterns

### 5.1 Collusion ring

**Pattern:** Client A creates order with Freelancer B (same operator). Client funds escrow → immediate release → withdraw → chargeback on deposit card.

**Controls:**
- Hold first withdrawal 72h after first milestone release for accounts < 30 days old
- Flag client-freelancer pairs with shared device/IP
- Limit first-time freelancer withdrawal to $500 until 3 completed orders

### 5.2 Fake delivery scam

**Pattern:** Freelancer marks delivered with empty work; pressures client to release.

**Controls:**
- Dispute window: client can dispute within 7 days of delivery mark
- Trust score weight on dispute rate — high dispute freelancers auto-review
- Admin freeze on 3+ open disputes

### 5.3 Dispute freezing abuse

**Pattern:** Client opens dispute to block freelancer payout indefinitely.

**Controls:**
- SLA: admin must act within 24h (TRUST_SYSTEM / LAUNCH_CHECKLIST)
- Auto-escalate disputes open > 72h to senior finance admin
- Repeat frivolous disputers → account warning → suspend

### 5.4 Admin escrow override audit

Every `adminReleaseEscrow`, `adminRefundEscrow`, `adminFreezeEscrow`:
- MFA required (finance role)
- Immutable audit_logs with before/after JSON
- Amounts > $5,000 require dual approval

---

## 6. Payment method fraud

| Check | When |
|-------|------|
| Card BIN country vs user KYC country mismatch | Deposit |
| Same token_ref on 2+ users | Immediate flag — likely stolen card |
| Rapid add/remove payment methods | >3 in 24h → cooldown |
| Payme webhook signature invalid | Reject — log security event |

Never store PAN — PCI minimization per PAYMENT_ARCHITECTURE.

---

## 7. Login and account takeover

Maps `user-status-store.isLoginBlocked()` + rate-limit:

| Control | Implementation |
|---------|----------------|
| Login rate limit | 5 failures / 15 min per email |
| Suspended/banned block | `account_status IN (suspended, banned)` |
| Session revoke on suspend | `admin.users suspend` → delete all sessions |
| Step-up auth for withdrawal | TOTP/SMS OTP > $500 |
| New device login alert | Email + optional SMS |

On suspend from admin:

```
suspendAdminUser(id)
  → syncAccountStatusFromAdmin(email, "suspended")
  → blockDemoAccountServer (production: revoke sessions)
  → notifyAdminAction(userId, "Hisob vaqtincha to'xtatildi", ...)
```

---

## 8. Fraud flag lifecycle

### `fraud_flags` table

| status | Meaning |
|--------|---------|
| open | Under review |
| cleared | False positive |
| confirmed | Fraud confirmed — action taken |
| escalated | Legal/compliance review |

Admin workflow (future `/admin/fraud` or `/admin/users` tab):

1. Review linked signals
2. Suspend or ban via USER_BAN_SYSTEM
3. Freeze wallet (`wallets.withdrawals_frozen = true`)
4. Reverse pending withdrawals
5. Audit entry category `system`

---

## 9. Automated jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `fraud_velocity_scan` | */15 * * * * | Redis → flag anomalies |
| `escrow_collusion_detector` | daily | Graph analysis client-freelancer pairs |
| `withdrawal_review_queue` | */30 * * * * | High-value pending manual review |
| `reconciliation_mismatch` | daily | Ledger drift → freeze withdrawals |

Celery queue: `payments` (INFRASTRUCTURE_ARCHITECTURE).

---

## 10. Incident response

Per SECURITY_ARCHITECTURE P0 playbook:

| Step | Action |
|------|--------|
| 1 | Set `platform_config.withdrawals_frozen = true` |
| 2 | Alert founder + finance on-call |
| 3 | Preserve audit_logs + ledger (no deletes) |
| 4 | Identify affected user_ids |
| 5 | Reverse fraudulent withdrawals if gateway allows |
| 6 | Post-mortem in `rules/99-reports/` |

Payment breach triggers immediate withdrawal freeze — documented in SECURITY_ARCHITECTURE § incident table.

---

## 11. ML scoring (P2 roadmap)

Phase 1: rule-based only (this document).  
Phase 2: logistic model on features:

- account_age_days
- completed_orders
- dispute_rate
- withdrawal_to_deposit_ratio
- device_link_score

Score stored on withdrawal request — manual review if score > 0.7.

---

## 12. Compliance notes (Uzbekistan)

- Large transactions logged for AML review (threshold configurable — default $10,000 USD equivalent/day)
- KYC document retention 7 years aligned with audit_log financial retention
- Eskiz SMS for critical withdrawal alerts only — not marketing

---

## 13. API error codes

| Code | HTTP | User message (Uzbek) |
|------|------|---------------------|
| FRAUD_VELOCITY | 429 | Juda ko'p so'rov. Keyinroq urinib ko'ring. |
| FRAUD_KYC_REQUIRED | 403 | Tasdiqlash talab qilinadi. |
| FRAUD_ACCOUNT_LINKED | 403 | Hisob tekshiruvda. Qo'llab-quvvatlash bilan bog'laning. |
| FRAUD_WITHDRAWAL_FROZEN | 403 | Yechib olish vaqtincha to'xtatilgan. |
| INSUFFICIENT_BALANCE | 402 | Balans yetarli emas. |

Never expose internal fraud scores to client.

---

## 14. Testing requirements (QA_CHECKLIST)

- [ ] Velocity limit triggers at boundary
- [ ] Duplicate card token blocks second user withdrawal
- [ ] Suspended user cannot withdraw
- [ ] Collusion pair flagged after 3 orders in 7d
- [ ] Admin freeze stops all releases
- [ ] Idempotency prevents double withdrawal hold

---

*Fraud prevention wraps every money endpoint: velocity in Redis, identity links in PostgreSQL, human review for high-risk withdrawals, and instant platform freeze on P0 incidents.*
