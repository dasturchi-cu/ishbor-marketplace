# SMS_NOTIFICATION_MATRIX.md

**Provider:** Eskiz.uz — Uzbekistan SMS gateway  
**Stack:** FastAPI `SmsService` + Redis token cache + Celery queue `notifications`  
**Policy:** SMS is **never** used for marketing on Ishbor — OTP and critical financial/security alerts only  
**Architecture:** [11-backend/infrastructure/SMS_ARCHITECTURE.md](../11-backend/infrastructure/SMS_ARCHITECTURE.md)

---

## 1. Design principles

| Rule | Rationale |
|------|-----------|
| Uzbek Latin message body | Local user expectation |
| Max 160 chars single segment | Cost control on Eskiz |
| Phone format `998XXXXXXXXX` | Eskiz API requirement |
| Rate limit 3 OTP/hour/phone | Abuse prevention |
| No OTP in logs | Security |
| User can disable non-OTP SMS | `notification_preferences.sms.critical_only` default true |

Sender ID: `Ishbor` (Eskiz registered alphanumeric sender).

---

## 2. Matrix convention

| Column | Meaning |
|--------|---------|
| Event | Domain trigger |
| Template key | `app/templates/sms/{key}.txt` |
| Recipient | Phone on file |
| Required | Cannot opt out if true |

---

## 3. OTP & authentication (required)

| Event | Template key | Message pattern (Uzbek) | Required |
|-------|--------------|---------------------------|----------|
| OtpLoginSend | `otp.login` | `Ishbor tasdiqlash kodi: {code}. Kod 10 daqiqa amal qiladi.` | ✅ |
| OtpRegisterSend | `otp.register` | `Ishbor ro'yxatdan o'tish kodi: {code}. Hech kimga bermang.` | ✅ |
| OtpPhoneChangeSend | `otp.phone_change` | `Ishbor telefon o'zgartirish kodi: {code}.` | ✅ |
| OtpWithdrawStepUp | `otp.withdraw` | `Ishbor yechib olish tasdiqlash kodi: {code}. Summa: ${amount}.` | ✅ |
| OtpAdminMfa | `otp.admin_mfa` | `Ishbor admin kirish kodi: {code}.` | ✅ |

**API flow:** `POST /auth/otp/send` → hash stored in `otp_verifications` → Eskiz send.

**Verify:** `POST /auth/otp/verify` — max 5 attempts; lock 15 min after exhaustion.

---

## 4. Critical financial alerts

| Event | Template key | Recipient | Required | Threshold |
|-------|--------------|-----------|----------|-----------|
| WithdrawalCompleted | `alert.withdraw_ok` | User phone | opt-out allowed | > $500 USD |
| WithdrawalFailed | `alert.withdraw_fail` | User phone | opt-out allowed | any |
| WithdrawalRejectedAdmin | `alert.withdraw_reject` | User phone | ✅ | any |
| LargeDepositConfirmed | `alert.deposit_large` | User phone | opt-out allowed | > $5,000 USD |
| EscrowDisputeOpened | `alert.dispute_opened` | Both parties | opt-out allowed | any |
| EscrowDisputeResolved | `alert.dispute_resolved` | Both parties | opt-out allowed | any |
| AccountSuspended | `alert.account_suspended` | User phone | ✅ | any |

**Withdraw OK example:**  
`Ishbor: $500 yechib olindi. Balans: $X. Savol: support@ishbor.uz`

**Dispute example:**  
`Ishbor: "{orderTitle}" buyurtmada nizo ochildi. 24 soat ichida javob bering.`

---

## 5. Security alerts

| Event | Template key | Required |
|-------|--------------|----------|
| NewDeviceLogin | `alert.new_device` | opt-out (default on) |
| PasswordChanged | `alert.password_changed` | ✅ |
| PaymentMethodAdded | `alert.new_payment_method` | opt-out |
| FraudWithdrawalBlocked | `alert.fraud_block` | ✅ |

**Password changed:**  
`Ishbor: Parolingiz o'zgartirildi. Siz emasmisiz? support@ishbor.uz`

---

## 6. Events explicitly NOT sent via SMS

| Event | Channel instead |
|-------|-----------------|
| Proposal received | In-app + email |
| New message | In-app + email digest |
| Review received | In-app |
| Job alert match | In-app + email digest |
| Subscription renewed | Email only |
| Featured listing active | In-app |
| AI profile nudge | In-app only |
| Marketing / promotions | **Never SMS** |

This list is enforced in `SmsService.should_send(event, prefs)` — hardcoded deny list.

---

## 7. Eskiz integration (FastAPI)

```python
class SmsService:
    async def send_otp(self, phone: str, code: str, purpose: str):
        template = TEMPLATES[f"otp.{purpose}"]
        message = template.format(code=code)
        await self.eskiz.send_sms(normalize_uz_phone(phone), message)
        await audit.log_sms_sent(phone_hash=hash_phone(phone), purpose=purpose)

    async def send_alert(self, user_id: UUID, template_key: str, **ctx):
        user = await users.get(user_id)
        if not user.phone_verified:
            return
        prefs = await prefs.get(user_id)
        if not prefs.sms_critical and template_key not in REQUIRED_TEMPLATES:
            return
        message = render_sms(template_key, ctx)
        if len(message) > 160:
            message = message[:157] + "..."
        await self.eskiz.send_sms(user.phone, message)
```

Token refresh: Redis `eskiz:token`, TTL 29 days — see SMS_ARCHITECTURE.md.

---

## 8. Rate limits

| Scope | Limit | Window |
|-------|-------|--------|
| OTP per phone | 3 | 1 hour |
| OTP per IP | 10 | 1 hour |
| Alert SMS per user | 10 | 24 hours |
| Global Eskiz budget | configurable | daily — alert at 80% |

Exceeded → queue for manual review; never drop OTP silently — return 429 to user.

---

## 9. Delivery tracking

Table `sms_delivery_log`:

| Column | Notes |
|--------|-------|
| id | uuid |
| user_id | nullable for pre-auth OTP |
| phone_hash | SHA-256 — not raw phone in log |
| template_key | |
| eskiz_message_id | |
| status | queued / sent / delivered / failed |
| created_at | |

Eskiz callback webhook updates status (P1 integration).

---

## 10. Error handling

| Eskiz error | Action |
|-------------|--------|
| Invalid phone | 400 to user — "Telefon raqam noto'g'ri" |
| Insufficient balance | P1 alert ops; queue messages |
| Token expired | Auto re-auth + retry once |
| Network timeout | Celery retry 3× |

Fallback: critical withdrawal failure also sends email — SMS is additive not sole channel.

---

## 11. Compliance

- Store user SMS consent timestamp at registration
- Uzbekistan advertising law: no promotional SMS without explicit opt-in — Ishbor default opt-in **false** for marketing (marketing SMS disabled entirely)
- OTP messages exempt from marketing consent rules
- Retain delivery log 90 days; phone_hash only

---

## 12. Testing (staging)

Staging uses Eskiz test mode or phone whitelist:

```
ESKIZ_TEST_PHONES=998901234567,998907654321
```

Never send real OTP to production users from staging environment.

---

## 13. Cross-reference to email

Every **Required ✅** SMS row has parallel email in [EMAIL_NOTIFICATION_MATRIX.md](./EMAIL_NOTIFICATION_MATRIX.md). User without phone still gets email.

Dual channel for `WithdrawalRejectedAdmin` and `AccountSuspended` — legal notice delivery.

---

*Eskiz SMS on Ishbor is a narrow pipe: OTP for auth, step-up for withdrawals, and critical alerts when money or account status changes.*
