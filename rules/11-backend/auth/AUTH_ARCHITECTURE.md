# AUTH_ARCHITECTURE.md

**Scope:** Ishbor Marketplace authentication — FastAPI backend, PostgreSQL sessions, Redis cache  
**Replaces:** `src/lib/auth.ts`, `ishbor-session` localStorage, `auth-bootstrap.js`, demo password overrides  
**Explicitly excluded:** Supabase Auth, client-side session persistence, query-string tokens on web

---

## 1. Design principles

| Principle | Rationale |
|-----------|-----------|
| Server-authoritative sessions | Money, orders, and admin actions require trusted identity |
| HttpOnly cookie primary | Web SPA/SSR cannot tamper with or exfiltrate session token via XSS |
| PostgreSQL as source of truth | Durable audit trail, revocation, concurrent session limits |
| Redis as hot cache | Sub-millisecond session lookup on every API and WS handshake |
| Fail-closed | Missing, expired, or revoked session → 401; suspended/banned → 403 |
| Uzbek-first UX | Copy and error codes in Uzbek; phone OTP via Eskiz for +998 |

---

## 2. System components

```
┌──────────────┐     Cookie: ishbor_sid      ┌─────────────────────┐
│ TanStack     │ ──────────────────────────► │ FastAPI Auth Router │
│ Start (web)  │     Authorization: Bearer*    │ /auth/*             │
└──────────────┘                             └──────────┬──────────┘
                                                          │
                    ┌─────────────────────────────────────┼─────────────────────┐
                    ▼                                     ▼                     ▼
            ┌───────────────┐                   ┌───────────────┐       ┌───────────────┐
            │ PostgreSQL    │                   │ Redis         │       │ BullMQ        │
            │ users         │                   │ session cache │       │ email/SMS jobs│
            │ sessions      │                   │ rate limits   │       │               │
            │ oauth_accounts│                   │ OTP counters  │       │               │
            └───────────────┘                   └───────────────┘       └───────────────┘

* Bearer JWT only for future mobile/API clients — not used by web app
```

| Component | Responsibility |
|-----------|----------------|
| FastAPI Auth Router | Register, login, logout, OAuth, OTP, password flows |
| SessionService | Create, rotate, revoke, validate opaque tokens |
| AuthMiddleware / Depends | Attach `SessionContext` to every protected route |
| Redis | Cache `ishbor:session:{hash}` → session payload; TTL = session expiry |
| PostgreSQL | Persistent `sessions`, `users`, `oauth_accounts`, token tables |

---

## 3. Migration from localStorage

| Current (frontend) | Target (backend) |
|--------------------|------------------|
| `ishbor-session` JSON in localStorage | Removed — cookie only |
| `auth-bootstrap.js` inline hydration | Server reads cookie in SSR `beforeLoad` |
| `AuthGate` client redirect loop | API 401 before HTML; gate handles edge cases only |
| `active-role-store` localStorage | `active_role_preferences` table + session context |
| `GoogleButton` hardcoded demo login | Real Google OAuth 2.0 PKCE |
| `forgot-password.tsx` setTimeout | Email queue + `password_reset_tokens` |
| Demo password table in auth.ts | Seed migration; gated by `ALLOW_DEMO_AUTH` |

**Cutover rule:** No route may read auth state from localStorage after migration. Client calls `GET /auth/session` once after hydration for UI-only fields (avatar, display name).

---

## 4. Authentication methods

| Method | Priority | Provider / store |
|--------|----------|------------------|
| Email + password | P0 | bcrypt cost 12 → `users.password_hash` |
| Google OAuth 2.0 | P0 | PKCE → `oauth_accounts` |
| Phone OTP | P1 | Eskiz SMS (Uzbekistan +998) → `otp_verifications` |
| Apple Sign In | P2 | Future iOS |
| Magic link | P3 | Optional — not v1 |

Phone OTP is required for high-trust actions (withdrawal, 2FA backup) even when email login is primary.

---

## 5. Session model (summary)

**Cookie name:** `ishbor_sid`  
**Token:** 32-byte CSPRNG → base64url on wire; SHA-256 hash stored in `sessions.token_hash`  
**TTL:** 24 hours default; 30 days when `remember=true`  
**Payload:** Server-side only — never sent to client except derived DTO via `GET /auth/session`

```text
SessionContext (attached to request.state.auth):
  sessionId, userId, email, userType, activeRole,
  isAdmin, adminRole?, accountStatus, expiresAt
```

See [COOKIE_STRATEGY.md](./COOKIE_STRATEGY.md) and [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md).

---

## 6. Request lifecycle

1. **Ingress:** Nginx forwards `Cookie` header to FastAPI; strips external auth headers except validated Bearer JWT (mobile).
2. **Resolve:** Hash cookie value → Redis GET → on miss, PostgreSQL SELECT → repopulate Redis.
3. **Validate:** Check `expires_at`, `account_status`, session not revoked.
4. **Attach:** Populate `request.state.auth` for downstream Depends guards.
5. **Response:** On login/rotation, Set-Cookie with new `ishbor_sid`; on logout, clear cookie.

WebSocket handshake uses the same cookie — no separate WS token for web clients.

---

## 7. Database tables (auth domain)

| Table | Purpose |
|-------|---------|
| `users` | Identity, password_hash, email_verified_at, phone_verified_at, account_status |
| `sessions` | Opaque token hashes, IP, user_agent, remember flag, expires_at |
| `oauth_accounts` | provider + provider_user_id linkage |
| `active_role_preferences` | client / freelancer / agency switch |
| `password_reset_tokens` | Single-use reset links |
| `email_verification_tokens` | Single-use email confirm |
| `otp_verifications` | Phone codes (hashed), purpose, attempts |
| `security_settings` | 2FA TOTP (P1) |
| `admin_role_assignments` | Admin RBAC roles |

Full column definitions: [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md).

---

## 8. API surface (auth prefix)

| Endpoint group | Document |
|----------------|----------|
| Register, login, logout | [AUTH_FLOW.md](./AUTH_FLOW.md) |
| Google OAuth | [OAUTH_ARCHITECTURE.md](./OAUTH_ARCHITECTURE.md) |
| Email verify | [EMAIL_VERIFICATION_FLOW.md](./EMAIL_VERIFICATION_FLOW.md) |
| Phone OTP | [AUTH_FLOW.md](./AUTH_FLOW.md), Eskiz integration below |
| Password reset | [PASSWORD_RESET_FLOW.md](./PASSWORD_RESET_FLOW.md) |
| Active role switch | [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md) |
| Mobile JWT (future) | [JWT_STRATEGY.md](./JWT_STRATEGY.md) |

Base path: `https://api.ishbor.uz/v1/auth/*`  
Rate limits: Redis sliding window — see [SECURITY_ARCHITECTURE.md](../SECURITY_ARCHITECTURE.md).

---

## 9. Eskiz SMS integration (Uzbekistan)

| Setting | Value |
|---------|-------|
| Provider | Eskiz.uz REST API |
| Sender ID | Ishbor (registered alphanumeric) |
| Template language | Uzbek (Latin) |
| OTP format | 6 digits, 10-minute TTL |
| Dev override | Fixed code `123456` when `APP_ENV=development` only |
| Production | Real SMS; dev override disabled — deployment gate |

SMS jobs run via BullMQ worker — auth endpoint only enqueues; never blocks on Eskiz latency.

---

## 10. SSR and frontend contract

| Concern | Contract |
|---------|----------|
| Nitro/TanStack SSR | Proxy or BFF reads `ishbor_sid`, forwards to FastAPI `/auth/session` |
| `beforeLoad` | Server-side session available — no skip-SSR for auth routes |
| Client stores | `useSyncExternalStore` hydrates from session endpoint; stable empty snapshots |
| 401 handling | Redirect to `/login?redirect=` with encoded return path |
| 403 handling | Role mismatch → dashboard hint; banned → static blocked page |

Primary language: Uzbek. Error codes: English machine keys (`ACCOUNT_SUSPENDED`) + Uzbek user message.

---

## 11. Demo and non-production

Seed accounts (migration `016_seed_demo_data.sql`):

| Email | Role |
|-------|------|
| sardor@asaka.uz | client |
| nargiza@ishbor.uz | freelancer |
| admin@ishbor.uz | admin (super_admin) |

Guard: `APP_ENV != production` OR explicit `ALLOW_DEMO_AUTH=true`. Demo login must never ship enabled in production builds.

---

## 12. Security controls (cross-cutting)

| Control | Detail |
|---------|--------|
| Password policy | Min 8, max 128; optional HIBP k-anonymity check |
| Session fixation | New session ID on every successful login |
| Concurrent sessions | Max 5 per user — oldest evicted |
| Revocation | Password change → all sessions invalidated |
| CSRF | SameSite=Lax; optional double-submit token on form POST |
| Audit | login, logout, failed_login, password_reset → `audit_logs` |
| No Supabase | All auth logic in FastAPI — no third-party auth SDK in client |

---

## 13. Related documents

| Document | Topic |
|----------|-------|
| [AUTH_FLOW.md](./AUTH_FLOW.md) | Sequence diagrams |
| [JWT_STRATEGY.md](./JWT_STRATEGY.md) | Mobile/API tokens |
| [COOKIE_STRATEGY.md](./COOKIE_STRATEGY.md) | Set-Cookie attributes |
| [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md) | Rotation, limits |
| [PERMISSION_MATRIX.md](./PERMISSION_MATRIX.md) | RBAC by role |
| [RBAC_SPECIFICATION.md](../RBAC_SPECIFICATION.md) | FastAPI Depends guards |
| [WEBSOCKET_SECURITY.md](../websockets/WEBSOCKET_SECURITY.md) | WS auth handshake |

---

*Supersedes client-side `ishbor-session` as the authoritative identity source for Ishbor Marketplace.*
