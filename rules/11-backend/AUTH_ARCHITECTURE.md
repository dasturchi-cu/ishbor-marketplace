# AUTH_ARCHITECTURE.md

> **Canonical auth docs:** [auth/](./auth/) — FastAPI, PostgreSQL sessions, Redis cache, Eskiz SMS (no Supabase).  
> Start with [auth/AUTH_ARCHITECTURE.md](./auth/AUTH_ARCHITECTURE.md).

**Replaces:** `src/lib/auth.ts`, `ishbor-session` localStorage, `auth-bootstrap.js`, demo password overrides  
**Goal:** SSR-safe, HttpOnly cookie sessions, real OAuth, production password flows
---

## 1. Authentication methods

| Method | Phase | Notes |
|--------|-------|-------|
| Email + password | P0 | bcrypt cost 12 |
| Google OAuth 2.0 | P0 | Primary social login |
| Phone OTP | P1 | SMS provider ( Eskiz / Playmobile ) |
| Apple Sign In | P2 | iOS future |
| Magic link | P3 | Optional |

---

## 2. Session model

### Cookie
```
Set-Cookie: ishbor_sid=<opaque_token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

| Property | Value |
|----------|-------|
| Token format | 32-byte random → base64url → stored as SHA-256 hash in `sessions` table |
| Rotation | On login, privilege change, password change |
| Remember me | 30 days vs 24 hours session TTL |
| SSR | Cookie readable by Nitro server — no hydration flash |

### Session payload (server-side only)
```typescript
type SessionContext = {
  sessionId: string;
  userId: string;
  email: string;
  userType: "client" | "freelancer";
  activeRole: "client" | "freelancer" | "agency";
  isAdmin: boolean;
  adminRole?: AdminRole;
  accountStatus: "active" | "suspended" | "banned" | "pending";
  expiresAt: Date;
};
```

Attached to every request via middleware → `event.context.auth`.

---

## 3. Registration flow

```
POST /auth/register
  → validate email unique (citext)
  → hash password (bcrypt)
  → INSERT users (status=pending until email verified)
  → INSERT user_profiles (from onboarding session if present)
  → apply referral code if valid
  → send verification email (async job)
  → create session OR return { requiresVerification: true }
  → emit UserRegistered event
```

**Frontend mapping:** `/register` → verify-email → verify-otp (optional) → `/welcome`

---

## 4. Login flow

```
POST /auth/login
  → rate limit by email (rate-limit.ts equivalent)
  → check account_status (user-status-store logic)
  → verify password OR demo account table (dev only)
  → clear failed attempts on success
  → INSERT sessions
  → SET cookie
  → UPDATE last_active_at
  → emit UserLoggedIn event
```

**Blocked accounts:** `suspended` → 403 `ACCOUNT_SUSPENDED`; `banned` → 403 `ACCOUNT_BANNED`

---

## 5. OAuth (Google)

```
GET  /auth/oauth/google          → redirect to Google
GET  /auth/oauth/google/callback → code exchange
  → fetch profile (email, name, sub)
  → find oauth_accounts OR link/create users row
  → create session + cookie
  → redirect to ?redirect= or dashboard
```

**Env:** `OAUTH_GOOGLE_CLIENT_ID`, `OAUTH_GOOGLE_CLIENT_SECRET`, `OAUTH_GOOGLE_CALLBACK_URL`

**Replaces:** `GoogleButton` hardcoded `nargiza@ishbor.uz` login.

---

## 6. Email verification

```
POST /auth/verify-email { token }
  → hash token, lookup password_reset_tokens or email_verification_tokens
  → SET email_verified_at
  → emit EmailVerified
```

Token: 32-byte, 24h expiry, single use.

---

## 7. OTP verification (phone)

```
POST /auth/verify-otp { phone, code, purpose }
  → lookup otp_verifications (max 5 attempts)
  → constant-time compare code_hash
  → SET phone_verified_at
```

Production: SMS via queue job. Dev: fixed code disabled in production.

---

## 8. Password reset

```
POST /auth/forgot-password { email }
  → always return 200 (no email enumeration)
  → if user exists: enqueue reset email

POST /auth/reset-password { token, newPassword }
  → validate token, update password_hash
  → invalidate ALL sessions for user
  → emit PasswordReset
```

**Replaces:** `forgot-password.tsx` setTimeout simulation.

---

## 9. Active role switching

```
PATCH /auth/active-role { role: "client" | "freelancer" | "agency" }
  → validate user can assume role (agency requires membership)
  → UPSERT active_role_preferences
  → update session context
  → return redirect hint (/dashboard vs /dashboard/freelancer)
```

**Agency role:** Derived from `agency_members` — user must have active membership.

**Replaces:** `active-role-store.ts` localStorage.

---

## 10. Two-factor authentication (P1)

Stored in `security_settings`:
- TOTP secret (encrypted)
- Backup codes (hashed)
- `2fa_enabled` boolean

Login with 2FA:
1. Password OK → return `{ requires2fa: true, tempToken }`
2. `POST /auth/2fa/verify { tempToken, code }` → full session

Maps `security-store.ts` settings tab.

---

## 11. SSR + client bootstrap migration

| Current | Target |
|---------|--------|
| `auth-bootstrap.js` inline script | Server reads cookie in `beforeLoad` |
| `AuthGate` client redirect | Server 401/redirect before HTML |
| `beforeLoad` skips SSR | Cookie session available on server |
| localStorage session | Removed |

Nitro middleware order:
1. Parse cookie → load session from Redis/DB
2. Attach `auth` to context
3. Route guards use server context
4. Client hydrates from `GET /auth/session`

---

## 12. Demo accounts (non-production)

Seed migration `016_seed_demo_data.sql`:
- `sardor@asaka.uz` / client
- `nargiza@ishbor.uz` / freelancer  
- `admin@ishbor.uz` / admin

Guard: `NODE_ENV !== 'production'` OR `ALLOW_DEMO_AUTH=true`

---

## 13. Security controls

| Control | Implementation |
|---------|----------------|
| Password policy | min 8, max 128, breach check (HIBP API optional) |
| Rate limiting | Redis sliding window per IP + email |
| Session fixation | New session ID on login |
| Concurrent sessions | Max 10 per user; oldest evicted |
| CSRF | SameSite=Lax + CSRF token on state-changing forms (optional double-submit) |
| Audit | Login/logout/failed attempts → `audit_logs` |

---

## 14. DTOs summary

| DTO | Validation |
|-----|------------|
| RegisterRequest | Zod: email, password strength, userType enum |
| LoginRequest | email format, password non-empty |
| ResetPasswordRequest | password min 8, token UUID format |
| ActiveRoleRequest | enum, agency membership check |
| OAuthCallback | state param CSRF check |

---

*See also: [RBAC_SPECIFICATION.md](./RBAC_SPECIFICATION.md), [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md)*
