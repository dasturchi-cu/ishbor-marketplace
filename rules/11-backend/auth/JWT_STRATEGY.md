# JWT_STRATEGY.md

**Scope:** JSON Web Token design for Ishbor mobile and third-party API clients  
**Primary web auth:** HttpOnly cookie `ishbor_sid` — JWT is **not** used by the TanStack Start web app  
**Stack:** FastAPI, PostgreSQL sessions, Redis revocation list

---

## 1. Why JWT is secondary

| Concern | Cookie session (web) | JWT (mobile/API) |
|---------|---------------------|------------------|
| XSS resistance | HttpOnly — JS cannot read | Stored in secure enclave / Keychain |
| CSRF | SameSite=Lax mitigates | Bearer header — no CSRF |
| Revocation | Immediate via PG + Redis | Requires denylist or short TTL |
| SSR compatibility | Native | N/A for native apps |
| Implementation priority | P0 — ship first | P1 — mobile app launch |

**Rule:** No JWT in query strings, localStorage, or sessionStorage on web. Mobile SDK may use Bearer tokens only.

---

## 2. Token types (future mobile)

| Token | Purpose | TTL | Storage (client) |
|-------|---------|-----|------------------|
| Access token | API authorization | 15 minutes | Memory only |
| Refresh token | Obtain new access token | 30 days | Secure device storage |

Both tokens are signed JWTs but **refresh tokens are also persisted** server-side in `mobile_refresh_tokens` table (hashed) for revocation — pure stateless refresh is not used.

---

## 3. Access token claims

| Claim | Required | Description |
|-------|----------|-------------|
| `sub` | yes | User UUID |
| `sid` | yes | Session/device binding ID |
| `email` | yes | Primary email |
| `user_type` | yes | `client` \| `freelancer` |
| `active_role` | yes | `client` \| `freelancer` \| `agency` |
| `is_admin` | yes | Boolean |
| `admin_role` | no | Present when admin |
| `account_status` | yes | Must be `active` for API access |
| `iat` | yes | Issued at |
| `exp` | yes | Expiry (15 min from iat) |
| `iss` | yes | `https://api.ishbor.uz` |
| `aud` | yes | `ishbor-mobile` |

**Excluded from JWT:** Wallet balance, permissions matrix, PII beyond email — load from API per request or cache.

---

## 4. Refresh token design

| Property | Value |
|----------|-------|
| Format | 32-byte opaque token (not JWT) OR JWT with `typ: refresh` |
| Storage server | SHA-256 hash in `mobile_refresh_tokens` |
| Rotation | Single-use — each refresh issues new refresh token |
| Family detection | Reuse of old refresh token revokes entire token family |
| Max devices | 5 concurrent refresh tokens per user (matches web session limit) |
| Binding | Optional `device_id` + `device_name` for settings UI |

Refresh endpoint: `POST /auth/mobile/refresh` — accepts refresh token body, returns new access + refresh pair.

---

## 5. Issuance flow (mobile login)

```mermaid
sequenceDiagram
    participant App
    participant API
    participant PG
    participant RD

    App->>API: POST /auth/mobile/login { email, password, deviceId }
    API->>API: Same validation as web login
    API->>PG: INSERT sessions (type=mobile)
    API->>PG: INSERT mobile_refresh_tokens
    API-->>App: { accessToken, refreshToken, expiresIn, user }
    Note over App: Store refresh in Keychain; access in memory
```

OAuth mobile: `POST /auth/mobile/oauth/google` with authorization code from native Google SDK — same token pair response.

OTP mobile: After `verify-otp`, optional token pair if `issueTokens=true` in request.

---

## 6. Validation (FastAPI Depends)

| Step | Action |
|------|--------|
| 1 | Extract Bearer token from Authorization header |
| 2 | Verify signature (RS256 with rotating keys) |
| 3 | Validate iss, aud, exp |
| 4 | Check `account_status == active` |
| 5 | Redis GET `ishbor:jwt:revoked:{jti}` — if exists, 401 |
| 6 | Optional: Redis GET session binding `sid` still valid |
| 7 | Attach same `SessionContext` as cookie auth to `request.state.auth` |

**Unified guard:** `get_current_user()` accepts either valid `ishbor_sid` cookie OR valid Bearer access token — downstream code is identical.

---

## 7. Signing keys

| Aspect | Policy |
|--------|--------|
| Algorithm | RS256 (asymmetric) |
| Key storage | Env `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` or Vault |
| Rotation | New key every 90 days; old key verifies for 7-day overlap |
| JWKS endpoint | `GET /.well-known/jwks.json` for mobile SDK pin rotation |
| kid header | Present on every JWT for key selection |

Never use HS256 with shared secret in mobile clients.

---

## 8. Revocation strategy

| Event | Web (cookie) | Mobile (JWT) |
|-------|--------------|--------------|
| Logout | Delete session row | Revoke refresh + add access jti to Redis denylist |
| Password change | Delete all sessions | Revoke all refresh tokens + denylist active jtis |
| Admin suspend | Delete sessions on next status check | Immediate denylist via `sub` prefix key |
| Token theft report | N/A | User triggers logout-all-devices |

Redis denylist key: `ishbor:jwt:revoked:{jti}` TTL = remaining access token lifetime.

Bulk revoke: `ishbor:jwt:revoked:user:{userId}` SET with TTL 15 min blocks all access tokens for user during propagation.

---

## 9. WebSocket and JWT

Mobile WebSocket (`wss://api.ishbor.uz/ws/v1`) may authenticate via:

1. **Preferred:** `Sec-WebSocket-Protocol: bearer, {accessToken}` during handshake
2. **Alternative:** `Authorization: Bearer` on HTTP upgrade request

Cookie-based WS auth remains primary for web — see [WEBSOCKET_SECURITY.md](../websockets/WEBSOCKET_SECURITY.md).

Access token must have `< 5 minutes` remaining at connect time; client should refresh before WS connect.

---

## 10. What JWT must NOT do

| Anti-pattern | Reason |
|--------------|--------|
| Long-lived access tokens (> 1 hour) | Cannot revoke quickly |
| JWT as web session | XSS exfiltration risk |
| Permissions embedded in JWT | Stale after role switch — use session/API |
| JWT in URL query params | Logged in proxies, browser history |
| Supabase JWT | Not used — Ishbor issues its own tokens |

---

## 11. Migration and feature flags

| Flag | Default | Purpose |
|------|---------|---------|
| `MOBILE_JWT_ENABLED` | false | Gate mobile endpoints until app ready |
| `JWT_ACCESS_TTL_SECONDS` | 900 | Tunable without deploy |
| `JWT_REFRESH_TTL_DAYS` | 30 | Match remember-me web TTL |

Web launch requires zero JWT surface area — flag stays false until mobile beta.

---

## 12. Observability

| Metric | Alert |
|--------|-------|
| `auth_jwt_validation_failures` | Spike → possible attack |
| `auth_refresh_reuse_detected` | Critical — token theft |
| `auth_mobile_active_devices` | Capacity planning |

Audit log: `mobile_login`, `mobile_refresh`, `mobile_logout`, `refresh_family_revoked`.

---

## 13. Related documents

- [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) — cookie-primary model
- [COOKIE_STRATEGY.md](./COOKIE_STRATEGY.md) — web cookie detail
- [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md) — concurrent limits shared with mobile
- [WEBSOCKET_SECURITY.md](../websockets/WEBSOCKET_SECURITY.md)

---

*JWT is optional and future-facing; production web auth ships with cookie sessions only.*
