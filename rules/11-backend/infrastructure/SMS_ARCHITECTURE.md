# SMS_ARCHITECTURE.md

**Provider:** Eskiz.uz — Uzbekistan SMS gateway  
**Primary use:** OTP verification for phone login and registration  
**Secondary use:** High-priority escrow/dispute alerts (P1)

---

## 1. Overview

Uzbekistan users expect phone OTP authentication. Eskiz is the standard local SMS provider with competitive pricing and local network delivery.

| Channel | Provider | Phase |
|---------|----------|-------|
| OTP login/register | Eskiz | P0 |
| Password reset SMS backup | Eskiz | P1 |
| Escrow dispute alert | Eskiz | P1 |
| Marketing SMS | Disabled | Never P0 |

---

## 2. Eskiz integration

### Authentication

Eskiz uses token-based API auth — token refreshed every 30 days.

```python
# server/services/sms_service.py
class EskizClient:
    async def authenticate(self):
        response = await httpx.post(
            "https://notify.eskiz.uz/api/auth/login",
            json={"email": settings.ESKIZ_EMAIL, "password": settings.ESKIZ_PASSWORD},
        )
        self.token = response.json()["data"]["token"]

    async def send_sms(self, phone: str, message: str):
        await self.ensure_token()
        response = await httpx.post(
            "https://notify.eskiz.uz/api/message/sms/send",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "mobile_phone": normalize_uz_phone(phone),  # 998XXXXXXXXX
                "message": message,
                "from": settings.ESKIZ_SENDER,
            },
        )
        return response.json()
```

Token cached in Redis: `eskiz:token`, TTL 29 days.

---

## 3. OTP flow

Maps `otp_verifications` table and AUTH_ARCHITECTURE.md.

```
1. POST /auth/otp/send { phone }
   → Rate limit: 3 sends/hour per phone, 10/hour per IP
   → Generate 6-digit OTP
   → Hash with SHA-256 + pepper → store in otp_verifications
   → SMS: "Ishbor tasdiqlash kodi: 123456. Kod 10 daqiqa amal qiladi."
   → Return { expires_in: 600 }

2. POST /auth/otp/verify { phone, code }
   → Lookup otp_verifications, check attempts < 5
   → Constant-time hash compare
   → Mark verified_at, create session
   → Return session cookie
```

**Never log OTP codes.** Store hash only.

---

## 4. Phone number normalization

```python
def normalize_uz_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("998"):
        return digits
    if digits.startswith("9") and len(digits) == 9:
        return "998" + digits
    raise ValueError("Invalid UZ phone")
```

Display format: `+998 XX XXX XX XX`

---

## 5. Message templates (Uzbek)

| Template | Message |
|----------|---------|
| `otp.login` | Ishbor tasdiqlash kodi: {code}. Kod {minutes} daqiqa amal qiladi. |
| `otp.register` | Ishbor ro'yxatdan o'tish kodi: {code}. Hech kimga bermang. |
| `escrow.dispute` | Ishbor: "{project}" buyurtmasi bo'yicha nizo ochildi. Ilova orqali ko'ring. |
| `withdrawal.pending` | Ishbor: {amount} yechib olish so'rovingiz qabul qilindi. |

SMS length: keep under 160 chars for single segment — Uzbek Cyrillic counts carefully.

---

## 6. Rate limiting

| Limit | Value | Layer |
|-------|-------|-------|
| OTP send per phone | 3/hour | Redis |
| OTP send per IP | 10/hour | Redis + nginx |
| OTP verify attempts | 5 per code | PostgreSQL |
| OTP code TTL | 10 minutes | PostgreSQL |
| Daily SMS budget | 1000/day staging, unlimited prod | Eskiz dashboard |

Lockout after 5 failed verify attempts — 30 min cooldown.

---

## 7. Environment variables

```bash
ESKIZ_EMAIL=                  # Eskiz account email
ESKIZ_PASSWORD=               # Eskiz account password
ESKIZ_SENDER=4546             # Registered alphanumeric sender ID
SMS_ENABLED=true              # false in local — log OTP to stdout
SMS_PROVIDER=eskiz
```

Local development:

```python
if not settings.SMS_ENABLED:
    logger.info("sms_dev_mode", phone=phone, code=code)
    return DevSmsResult(success=True)
```

---

## 8. Error handling

| Error | Action |
|-------|--------|
| Eskiz 401 | Refresh token, retry once |
| Invalid phone | 400 to client — "Telefon raqami noto'g'ri" |
| Eskiz quota exceeded | P1 alert, queue SMS for retry |
| Delivery failure | Log, allow OTP resend after 60s |

---

## 9. Cost and monitoring

| Metric | Typical |
|--------|---------|
| Cost per SMS | ~80-120 UZS |
| OTP per registration | 1-2 SMS |
| Monthly estimate (1k users) | ~$10-15 USD |

Prometheus metrics:

- `ishbor_sms_sent_total{template}`
- `ishbor_sms_failed_total{reason}`
- `ishbor_otp_verify_success_rate`

---

## 10. Compliance

| Requirement | Implementation |
|-------------|----------------|
| User consent | Phone verification implies SMS consent for OTP |
| Marketing opt-out | No marketing SMS in P0 |
| Data retention | OTP records deleted after 24h |
| Sender registration | ESKIZ_SENDER registered with Eskiz + UZ regulator |

---

## 11. Related documents

- [../AUTH_ARCHITECTURE.md](../AUTH_ARCHITECTURE.md)
- [EMAIL_ARCHITECTURE.md](./EMAIL_ARCHITECTURE.md)
- [../NOTIFICATION_ARCHITECTURE.md](../NOTIFICATION_ARCHITECTURE.md)
- [../security/RATE_LIMITING.md](../security/RATE_LIMITING.md)

---

*Eskiz SMS for OTP is P0 for Uzbekistan auth. OTP codes are hashed, rate-limited, and never logged in plaintext.*
