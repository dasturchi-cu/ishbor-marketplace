# ACCOUNT_PROTECTION.md

**Purpose:** Protect Ishbor user accounts — 2FA, session limits, login rate limiting, device management  
**Stack:** FastAPI + PostgreSQL sessions + Redis + HttpOnly cookies  
**Replaces:** Client-only `rate-limit.ts` and localStorage session patterns

---

## 1. Protection layers overview

```
Login attempt
    │
    ├─► Client UX throttle (rate-limit.ts) — early feedback only
    │
    ├─► Nginx api_auth zone — 5/min per IP
    │
    ├─► Redis auth.login — 5/5min per IP
    │
    ├─► Account lockout — 15 min after 10 failures
    │
    ├─► 2FA challenge (if enabled) — TOTP P1
    │
    └─► Session creation — max 5 concurrent devices
```

Account protection fails closed — ambiguous auth state always denies access.

---

## 2. Login rate limiting

### 2.1 Server limits (authoritative)

From [RATE_LIMITING.md](./RATE_LIMITING.md):

| Endpoint | Limit | Lockout |
|----------|-------|---------|
| POST `/v1/auth/login` | 5 / 5 min per IP | 15 min after 10 failures per user |
| POST `/v1/auth/register` | 3 / hour per IP | — |
| POST `/v1/auth/forgot-password` | 3 / hour per email | — |
| POST `/v1/auth/otp/send` | 3 / hour per phone | — |
| POST `/v1/auth/otp/verify` | 5 attempts per code | Code invalidated after 5 fails |

Account lockout stored in Redis:

```
lockout:{user_id} → TTL 900 seconds (15 minutes)
```

Failed attempts counter:

```
login_failures:{user_id} → INCR, EXPIRE 3600
```

On successful login: clear failure counters and lockout key.

### 2.2 Client limits (UX mirror — `src/lib/rate-limit.ts`)

The frontend module provides immediate feedback before server round-trip:

| Constant | Value |
|----------|-------|
| `MAX_ATTEMPTS` | 5 |
| `WINDOW_MS` | 15 × 60 × 1000 (15 minutes) |
| Storage key (per email) | `ishbor-login-attempts` |
| Storage key (per browser) | `ishbor-client-login-attempts` |

**Functions:**

| Function | Purpose |
|----------|---------|
| `recordFailedLogin(email)` | Increment per-email failure bucket |
| `isRateLimited(email)` | Returns true if ≥5 failures within window |
| `clearLoginAttempts(email?)` | Clear on successful login |
| `rateLimitMessage()` | Uzbek: "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring." |
| `checkClientLoginRateLimit()` | Per-browser throttle — 5 attempts / 15 min |
| `recordLoginAttempt()` | Bump browser-level counter |

**Important:** Client limits are bypassable — production security depends entirely on server Redis + nginx limits. Client code exists to reduce server load and improve UX.

### 2.3 Login flow with rate limits

```
POST /v1/auth/login { email, password, remember? }
  → nginx limit_req api_auth
  → Redis: check lockout:{user_id} — if exists → 429 ACCOUNT_LOCKED
  → Redis: auth.login IP limit — if exceeded → 429
  → Client isRateLimited equivalent on server: check login_failures
  → Verify password (bcrypt)
  → On failure: INCR login_failures, audit log failed_login
  → On 10 failures: SET lockout:{user_id} TTL 900
  → On success: clear failures, proceed to 2FA or session
```

Response headers on 429: `Retry-After`, `X-RateLimit-Remaining: 0`.

---

## 3. Two-factor authentication (2FA)

**Status:** P1 roadmap — UI exists (`TwoFactorModal`), backend TOTP required for production admin accounts.

### 3.1 TOTP specification

| Property | Value |
|----------|-------|
| Algorithm | TOTP RFC 6238, SHA-1 |
| Digits | 6 |
| Period | 30 seconds |
| Issuer | Ishbor |
| Secret storage | AES-256 encrypted column `users.totp_secret_enc` |
| Backup codes | 10 single-use codes, bcrypt hashed |

### 3.2 Enrollment flow

```
POST /v1/auth/2fa/setup (authenticated)
  → Generate TOTP secret
  → Return otpauth:// URI + QR code data URL
  → Store encrypted secret (pending until verified)

POST /v1/auth/2fa/verify-setup { code }
  → Validate TOTP code
  → SET users.totp_enabled = true
  → Return backup codes (shown once)
  → Audit: 2fa_enabled
```

### 3.3 Login with 2FA

When `users.totp_enabled = true`:

```
POST /v1/auth/login → password valid
  → Response: { requires2fa: true, tempToken }
  → tempToken: short-lived JWT (5 min), single use, bound to login attempt

POST /v1/auth/2fa/verify { tempToken, code }
  → Validate TOTP or backup code
  → CREATE session + Set-Cookie ishbor_sid
  → DELETE tempToken
```

OAuth login: if 2FA enabled, same challenge after OAuth callback before session issued.

### 3.4 2FA policy

| Account type | 2FA requirement |
|--------------|-----------------|
| Regular client/freelancer | Optional — encouraged in Settings |
| Admin (any role) | **Required** before production launch |
| Finance admin | Required + re-auth for sensitive actions |
| Super admin | Required + hardware key (P2) |

### 3.5 Recovery

| Method | Flow |
|--------|------|
| Backup code | Single use — invalidate after success |
| Admin reset | super_admin can disable 2FA — audit logged |
| Email recovery | Disabled if 2FA enabled — backup codes only |

---

## 4. Session limits and device management

From [../auth/SESSION_MANAGEMENT.md](../auth/SESSION_MANAGEMENT.md):

### 4.1 Concurrent session limit

**Maximum:** 5 active sessions per user (web + mobile combined)

```
On INSERT new session:
  COUNT sessions WHERE user_id AND expires_at > now()
  IF count >= 5:
    DELETE oldest by created_at
    Audit: session_evicted
    Evicted session: Redis DEL, WS close code 4001
```

Admin accounts: same 5-session limit — no unlimited exception.

### 4.2 Session TTL

| Mode | TTL | Cookie Max-Age |
|------|-----|----------------|
| Default | 7 days (168 hours) | 604800 |
| Remember me | 30 days | 2592000 |
| Non-remember idle cap | 24 hours base, extend on activity | — |
| 2FA temp token | 5 minutes | — |

Sliding window: if `< 50%` TTL remaining and active, extend `expires_at` (cap at absolute max).

### 4.3 Session storage

| Store | Purpose |
|-------|---------|
| PostgreSQL `sessions` | Authoritative — token_hash, expires_at, user_agent, ip |
| Redis `ishbor:session:{token_hash}` | Cache SessionContext — TTL matches expiry |
| Cookie `ishbor_sid` | Opaque token — HttpOnly, Secure, SameSite=Lax |

Token: 32-byte random → base64url → SHA-256 hash in DB.

### 4.4 Device listing UI

`GET /v1/auth/sessions` returns active devices:

| Field | Display |
|-------|---------|
| deviceLabel | Parsed from User-Agent |
| ipAddress | Masked (last octet hidden) |
| lastActiveAt | Relative time in Uzbek |
| current | Highlight current session |
| remember | Badge if long-lived |

`DELETE /v1/auth/sessions/{id}` — revoke remote device (not current session).

Maps Settings → Security → "Faol qurilmalar" tab.

### 4.5 Session revocation triggers

| Event | Sessions affected |
|-------|-------------------|
| Logout | Current only |
| Logout all devices | All for user |
| Password change | All — new session for current device |
| Password reset | All — user must re-login |
| Admin suspend | All — immediate on next validation |
| Admin revoke | All for target user |
| Detected token reuse | All for user — possible theft |
| Concurrent limit eviction | Oldest session |

---

## 5. Account status protection

| Status | Login | API access |
|--------|-------|------------|
| `active` | Allowed | Full per role |
| `pending` | Allowed — limited until email verified | Restricted routes |
| `suspended` | 403 ACCOUNT_SUSPENDED | Denied |
| `banned` | 403 ACCOUNT_BANNED | Denied |

Suspension triggers: admin action, payment fraud flag, repeated moderation violations.

All status changes audit-logged with actor and reason.

---

## 6. Password security

| Rule | Value |
|------|-------|
| Hashing | bcrypt cost factor 12 |
| Min length | 8 characters |
| Complexity | At least one letter + one number (P1: special char) |
| Breach check | HaveIBeenPwned API on register/change (P2) |
| History | Prevent reuse of last 5 passwords (P2) |

Password change flow revokes all sessions — see SESSION_MANAGEMENT.md §5.

---

## 7. OAuth account protection

| Control | Detail |
|---------|--------|
| CSRF state parameter | Required on Google/Apple OAuth |
| PKCE S256 | Code verifier stored in Redis 5 min TTL |
| Account linking | Verified email match required |
| OAuth-only accounts | No password — must use OAuth or set password via verified email |

Prevents OAuth CSRF and wrong-account linking attacks.

---

## 8. Phone OTP account protection

| Control | Value |
|---------|-------|
| Phone format | Normalized `998XXXXXXXXX` |
| OTP TTL | 10 minutes |
| Max verify attempts | 5 per code |
| OTP storage | SHA-256 hash only |
| Dev bypass | `123456` only when `APP_ENV=development` |

Production: Eskiz SMS — see [../infrastructure/SMS_ARCHITECTURE.md](../infrastructure/SMS_ARCHITECTURE.md).

---

## 9. Suspicious activity detection

| Signal | Automated response |
|--------|-------------------|
| Login from new country | Email notification to user |
| 5+ failed logins | Lockout + email alert |
| Session created from 3+ IPs in 1 hour | Require 2FA re-verify (P1) |
| Password change + immediate withdrawal | Hold withdrawal 24h |
| Admin impersonation attempt | Alert super_admin |

---

## 10. Settings UI mapping

| Settings section | Backend endpoint |
|------------------|------------------|
| Change password | PATCH `/v1/auth/password` |
| Enable 2FA | POST `/v1/auth/2fa/setup` |
| Active devices | GET `/v1/auth/sessions` |
| Revoke device | DELETE `/v1/auth/sessions/{id}` |
| Logout all | POST `/v1/auth/logout-all` |

All mutations require CSRF token + active session.

---

## 11. Production checklist

- [ ] Server login rate limits active — not client-only
- [ ] Account lockout after 10 failures tested
- [ ] Max 5 sessions enforced — 6th login evicts oldest
- [ ] Password change revokes all other sessions
- [ ] 2FA required for all admin accounts
- [ ] `ALLOW_DEMO_AUTH=false`
- [ ] Session cookie flags verified in browser DevTools
- [ ] Failed login audit events in `/admin/audit`
- [ ] Client `rateLimitMessage()` displays on 429 from server

---

## 12. Related documents

- [RATE_LIMITING.md](./RATE_LIMITING.md)
- [ABUSE_PREVENTION.md](./ABUSE_PREVENTION.md)
- [../auth/SESSION_MANAGEMENT.md](../auth/SESSION_MANAGEMENT.md)
- [../auth/AUTH_FLOW.md](../auth/AUTH_FLOW.md)
- [../auth/COOKIE_STRATEGY.md](../auth/COOKIE_STRATEGY.md)
- [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)

---

*Login: 5 attempts / 15 min (client UX), 5 / 5 min per IP (server), 15 min lockout after 10 failures. Sessions: max 5 concurrent devices. 2FA required for admin accounts at launch.*
