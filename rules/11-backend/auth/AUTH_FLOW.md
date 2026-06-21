# AUTH_FLOW.md

**Scope:** End-to-end authentication sequences for Ishbor Marketplace  
**Stack:** FastAPI, PostgreSQL `sessions`, Redis cache, Eskiz SMS  
**Audience:** Backend implementers, frontend integrators, QA

---

## 1. Conventions

| Symbol | Meaning |
|--------|---------|
| FE | TanStack Start web client (`ishbor.uz`) |
| API | FastAPI auth service (`api.ishbor.uz/v1`) |
| PG | PostgreSQL |
| RD | Redis |
| Q | BullMQ job queue |

All successful auth flows end with `Set-Cookie: ishbor_sid=...` unless `requiresVerification` or `requires2fa` intermediate state applies.

---

## 2. Registration (email + password)

```mermaid
sequenceDiagram
    participant FE
    participant API
    participant PG
    participant Q
    participant Email

    FE->>API: POST /auth/register { email, password, fullName, userType }
    API->>API: Validate DTO, password strength
    API->>PG: SELECT users WHERE email (citext)
    alt email exists
        API-->>FE: 409 EMAIL_TAKEN
    end
    API->>PG: INSERT users (status=pending, password_hash=bcrypt)
    API->>PG: INSERT user_profiles (defaults)
    API->>PG: INSERT email_verification_tokens
    API->>Q: Enqueue verification email
    Q->>Email: Send link https://ishbor.uz/verify-email?token=...
    API-->>FE: 201 { requiresVerification: true, email }
    Note over FE: Redirect /verify-email
    FE->>API: POST /auth/verify-email { token }
    API->>PG: Mark token used, SET email_verified_at
    API->>PG: UPDATE users.status = active
    API->>PG: INSERT sessions
    API->>RD: Cache session
    API-->>FE: 200 + Set-Cookie ishbor_sid
    Note over FE: Redirect /welcome or onboarding
```

**Business rules:**
- `userType` is permanent: `client` or `freelancer`
- Referral code validated synchronously; invalid code ignored (no error)
- Onboarding draft from guest session merged into `user_profiles` if present
- `UserRegistered` domain event emitted after email verified (not at INSERT)

**Frontend routes:** `/register` → `/verify-email` → `/welcome` → onboarding steps

---

## 3. Login (email + password)

```mermaid
sequenceDiagram
    participant FE
    participant API
    participant RD
    participant PG

    FE->>API: POST /auth/login { email, password, remember? }
    API->>RD: INCR rate:login:{ip}:{email_hash}
    alt rate exceeded
        API-->>FE: 429 TOO_MANY_ATTEMPTS
    end
    API->>PG: SELECT users + password_hash
    alt user not found or bad password
        API->>PG: INSERT audit_logs failed_login
        API-->>FE: 401 INVALID_CREDENTIALS
    end
    alt account_status suspended
        API-->>FE: 403 ACCOUNT_SUSPENDED
    end
    alt account_status banned
        API-->>FE: 403 ACCOUNT_BANNED
    end
    alt 2fa_enabled (P1)
        API-->>FE: 200 { requires2fa: true, tempToken }
    end
    API->>PG: INSERT sessions (new token_hash)
    API->>API: Enforce max 5 concurrent sessions
    API->>RD: SET ishbor:session:{hash}
    API->>PG: UPDATE last_active_at
    API-->>FE: 200 SessionResponse + Set-Cookie ishbor_sid
```

**Remember me:** `remember=true` → session TTL 30 days; cookie Max-Age matches.

**Demo accounts:** When `ALLOW_DEMO_AUTH=true`, seeded passwords accepted — same flow, flagged in audit log.

---

## 4. Logout

```mermaid
sequenceDiagram
    participant FE
    participant API
    participant PG
    participant RD

    FE->>API: POST /auth/logout (Cookie: ishbor_sid)
    API->>RD: GET session cache
    API->>PG: DELETE sessions WHERE token_hash
    API->>RD: DEL ishbor:session:{hash}
    API-->>FE: 204 + Set-Cookie ishbor_sid=; Max-Age=0
    Note over FE: Clear client UI state, redirect /
```

**Logout all devices:** `POST /auth/logout-all` — deletes all `sessions` for user_id, clears Redis keys by pattern.

---

## 5. Google OAuth 2.0 (PKCE)

See [OAUTH_ARCHITECTURE.md](./OAUTH_ARCHITECTURE.md) for endpoint detail. Summary sequence:

```mermaid
sequenceDiagram
    participant FE
    participant API
    participant Google
    participant PG

    FE->>API: GET /auth/oauth/google?redirect=/dashboard
    API->>API: Generate state, code_verifier, store in RD (5min TTL)
    API-->>FE: 302 Google authorize URL (PKCE S256)
    FE->>Google: User consents
    Google-->>FE: 302 /auth/oauth/google/callback?code&state
    FE->>API: GET callback (browser redirect)
    API->>RD: Validate state, retrieve code_verifier
    API->>Google: POST token exchange (code + verifier)
    Google-->>API: id_token, access_token
    API->>API: Verify id_token aud, iss, exp
    API->>PG: UPSERT oauth_accounts / link users
    API->>PG: INSERT sessions
    API-->>FE: 302 redirect + Set-Cookie ishbor_sid
```

**Account linking:** If Google email matches existing verified user → link `oauth_accounts`. If email unverified → require email verification before link.

**Replaces:** Hardcoded `nargiza@ishbor.uz` GoogleButton bypass.

---

## 6. Phone OTP (Eskiz SMS — Uzbekistan)

### 6.1 Send OTP

```mermaid
sequenceDiagram
    participant FE
    participant API
    participant RD
    participant PG
    participant Q
    participant Eskiz

    FE->>API: POST /auth/otp/send { phone, purpose }
    Note over purpose: register | login | verify_phone | reset
    API->>API: Normalize +998XXXXXXXXX
    API->>RD: Rate limit phone (3/hour, 10/day)
    API->>PG: INSERT otp_verifications (code_hash, expires_at)
    alt APP_ENV=development
        API-->>FE: 200 { sent: true, devHint: true }
    else production
        API->>Q: Enqueue SMS job
        Q->>Eskiz: POST /message/sms/send
        API-->>FE: 200 { sent: true }
    end
```

### 6.2 Verify OTP

```mermaid
sequenceDiagram
    participant FE
    participant API
    participant PG

    FE->>API: POST /auth/verify-otp { phone, code, purpose }
    API->>PG: SELECT otp_verifications (latest, not expired)
    API->>API: Increment attempts (max 5)
    alt attempts exceeded
        API-->>FE: 429 OTP_LOCKED
    end
    API->>API: Constant-time compare code_hash
    alt invalid code
        API-->>FE: 401 INVALID_OTP
    end
    API->>PG: SET verified_at, phone_verified_at on users
    alt purpose=login and user exists
        API->>PG: INSERT sessions
        API-->>FE: 200 + Set-Cookie
    else purpose=register
        API-->>FE: 200 { verified: true }
    end
```

**Dev code:** `123456` accepted only when `APP_ENV=development` — CI must assert this flag is false in production deploy config.

**Production SMS copy (Uzbek):** `Ishbor tasdiqlash kodi: {code}. 10 daqiqa amal qiladi.`

---

## 7. Session refresh (implicit)

Ishbor web auth does not use refresh tokens. Session validity is extended on activity:

| Event | Action |
|-------|--------|
| Authenticated API call | Sliding window: if `< 50%` TTL remaining, extend `expires_at` in PG + Redis |
| Active role switch | Session context updated in Redis; no new cookie unless rotation policy triggers |
| Privilege elevation (admin grant) | Force rotation — new `ishbor_sid` |

See [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md).

---

## 8. Password change (authenticated)

```mermaid
sequenceDiagram
    participant FE
    participant API
    participant PG
    participant RD

    FE->>API: PATCH /auth/password { currentPassword, newPassword }
    API->>PG: Verify current password
    API->>PG: UPDATE password_hash
    API->>PG: DELETE ALL sessions for user
    API->>RD: Invalidate all session cache keys
    API->>PG: INSERT new session (current device)
    API-->>FE: 200 + new Set-Cookie ishbor_sid
```

All other devices receive 401 on next request.

---

## 9. Active role switch

```mermaid
sequenceDiagram
    participant FE
    participant API
    participant PG
    participant RD

    FE->>API: PATCH /auth/active-role { role: client|freelancer|agency }
    API->>PG: Validate agency membership if role=agency
    API->>PG: UPSERT active_role_preferences
    API->>RD: UPDATE cached session.activeRole
    API-->>FE: 200 { activeRole, redirectHint: /dashboard/freelancer }
```

**Agency gate:** No active `agency_members` row → 403 `AGENCY_MEMBERSHIP_REQUIRED`.

---

## 10. Error response envelope

All auth errors follow API standard:

| Field | Example |
|-------|---------|
| `code` | `INVALID_CREDENTIALS` |
| `message` | Uzbek user-facing text |
| `details` | Optional field-level validation |

HTTP status maps: 400 validation, 401 auth, 403 forbidden status/role, 409 conflict, 429 rate limit.

---

## 11. Frontend integration checklist

- [ ] Remove all reads/writes to `ishbor-session` localStorage
- [ ] `credentials: 'include'` on all API fetch calls to `api.ishbor.uz`
- [ ] Login/register forms POST directly or via BFF — never store password in state after submit
- [ ] OAuth redirect URIs whitelisted in Google Console for `ishbor.uz` and staging
- [ ] OTP input masks +998; validate 9 digits after country code
- [ ] Handle `requiresVerification` and `requires2fa` without treating as errors

---

## 12. Related documents

- [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) — overview
- [OAUTH_ARCHITECTURE.md](./OAUTH_ARCHITECTURE.md) — Google PKCE detail
- [EMAIL_VERIFICATION_FLOW.md](./EMAIL_VERIFICATION_FLOW.md)
- [PASSWORD_RESET_FLOW.md](./PASSWORD_RESET_FLOW.md)
- [COOKIE_STRATEGY.md](./COOKIE_STRATEGY.md)

---

*Sequences align with API_SPECIFICATION.md §2 and MESSAGES/NOTIFICATIONS domain triggers post-auth.*
