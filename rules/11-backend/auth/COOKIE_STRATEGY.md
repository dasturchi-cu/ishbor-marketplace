# COOKIE_STRATEGY.md

**Scope:** Exact HTTP cookie specification for Ishbor web authentication  
**Cookie name:** `ishbor_sid`  
**Stack:** FastAPI Set-Cookie, Nginx proxy, TanStack Start on `ishbor.uz`

---

## 1. Cookie identity

| Property | Value |
|----------|-------|
| Name | `ishbor_sid` |
| Value | Opaque base64url token (~43 chars from 32 random bytes) |
| Purpose | Session identifier — maps to hashed row in PostgreSQL `sessions` |
| Not a JWT | Cookie value carries no claims; server resolves identity |

Legacy `ishbor-session` localStorage key is deleted on first authenticated response after migration.

---

## 2. Set-Cookie attributes (production)

```http
Set-Cookie: ishbor_sid=<token>; Path=/; Domain=.ishbor.uz; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

| Attribute | Production | Staging (`staging.ishbor.uz`) | Local dev |
|-----------|------------|-------------------------------|-----------|
| `HttpOnly` | Required | Required | Required |
| `Secure` | Required | Required | Optional (HTTP localhost) |
| `SameSite` | `Lax` | `Lax` | `Lax` |
| `Domain` | `.ishbor.uz` | `.ishbor.uz` or host-only | Omit (host-only) |
| `Path` | `/` | `/` | `/` |
| `Max-Age` | See TTL table | Same | Same |

**Domain `.ishbor.uz` rationale:** Subdomain sharing — `ishbor.uz`, `www.ishbor.uz`, and `api.ishbor.uz` (if same-site cookie forwarding configured) receive the cookie for BFF patterns. API subdomain may use separate host-only cookie if cross-origin — see §6.

---

## 3. Session TTL and Max-Age

| Login mode | PostgreSQL `expires_at` | Cookie Max-Age |
|------------|-------------------------|----------------|
| Default (remember=false) | now + 24 hours | 86400 |
| Remember me (remember=true) | now + 30 days | 2592000 |
| OAuth login | Same as default unless user checked remember | 86400 |
| Post password reset | New session 24 hours | 86400 |

**Sliding expiration:** Activity extension updates PG + Redis but does **not** re-Set-Cookie on every request — only when `< 25%` TTL remains or on explicit rotation.

---

## 4. Cookie lifecycle events

| Event | Set-Cookie behavior |
|-------|---------------------|
| Login success | New `ishbor_sid` with full attributes |
| Registration + verify | Set after email/OTP verification completes |
| OAuth callback | Set on redirect response |
| Logout | `ishbor_sid=; Max-Age=0; Path=/; Domain=.ishbor.uz; HttpOnly; Secure; SameSite=Lax` |
| Password change | New cookie (rotation) — old invalidated |
| Session rotation (security) | New value, same session row updated or new row |
| Concurrent session eviction | Evicted device keeps stale cookie → 401 on next request (no clear cookie from server) |

---

## 5. SameSite=Lax implications

| Scenario | Behavior |
|----------|----------|
| Top-level navigation GET from Google OAuth | Cookie sent on redirect back to `ishbor.uz` ✅ |
| Cross-site POST form (CSRF) | Cookie **not** sent on cross-site POST ✅ |
| `<img src="api.ishbor.uz">` | Cookie not sent ✅ |
| Fetch from `ishbor.uz` to `api.ishbor.uz` | Same-site if eTLD+1 matches — see §6 |
| WebSocket upgrade from `ishbor.uz` | Cookie sent (same-site) ✅ |

**Why not Strict:** OAuth and email magic links require cookie on top-level cross-site redirect. Strict would break Google login return.

**Why not None:** Would require Secure + opens CSRF surface; Lax is sufficient for Ishbor flows.

---

## 6. Cross-origin API layout

Ishbor production topology:

| Host | Role |
|------|------|
| `ishbor.uz` | Frontend SSR/static |
| `api.ishbor.uz` | FastAPI REST + WebSocket |

**Option A (recommended):** BFF on Nitro proxies `/api/*` to FastAPI — browser only talks to `ishbor.uz`; cookie is host-only on `ishbor.uz`, no cross-origin credentialed fetch.

**Option B:** Direct `fetch('https://api.ishbor.uz', { credentials: 'include' })` requires:
- CORS `Access-Control-Allow-Origin: https://ishbor.uz` (not `*`)
- `Access-Control-Allow-Credentials: true`
- Cookie `Domain=.ishbor.uz` so both hosts share cookie jar

Document chosen option in DEPLOYMENT_ARCHITECTURE — cookie attributes must match.

---

## 7. Clearing and invalid cookies

| Case | Server response |
|------|-----------------|
| Malformed cookie value | 401; optional clear cookie if parse fails repeatedly |
| Expired session | 401 `SESSION_EXPIRED`; FE redirects login |
| Revoked session | 401 `SESSION_REVOKED` |
| Logout | 204 + explicit clear Set-Cookie |

Clear cookie must repeat `Domain` and `Path` used at set time or browser ignores deletion.

---

## 8. Security attributes detail

### HttpOnly
JavaScript cannot read `document.cookie` for `ishbor_sid`. Prevents XSS session theft. Frontend auth state comes from `GET /auth/session` JSON body.

### Secure
Cookie transmitted only over HTTPS. Enforced in production and staging. Local dev may disable for `http://localhost:3000` only.

### No Partitioned (CHIPS)
Not required v1 — Ishbor uses first-party cookie on primary domain. Revisit if embedded iframe auth needed.

---

## 9. CSRF complement

SameSite=Lax covers most CSRF. Additional optional controls:

| Control | When |
|---------|------|
| Double-submit CSRF token | State-changing form POST from SSR pages |
| `Origin` header validation | FastAPI middleware on POST/PATCH/DELETE |
| OAuth `state` parameter | Google OAuth — mandatory |

Cookie alone is insufficient for OAuth — state param is separate CSRF defense.

---

## 10. Proxy and CDN behavior

| Layer | Requirement |
|-------|---------------|
| Nginx | Forward `Cookie` header upstream unchanged |
| Cloudflare | Do not cache Set-Cookie responses |
| Load balancer | Sticky sessions optional for WS — cookie auth is stateless across API pods |
| CDN static | Never serve API responses from cache |

**Cache-Control on auth responses:** `private, no-store`

---

## 11. WebSocket cookie forwarding

Browser WebSocket API sends cookies automatically for same-site upgrade requests.

Nginx location block for `/ws/` must include:
- `proxy_set_header Cookie $http_cookie;`
- `proxy_http_version 1.1;`
- `Upgrade` and `Connection` headers

See [WEBSOCKET_ARCHITECTURE.md](../websockets/WEBSOCKET_ARCHITECTURE.md).

---

## 12. Testing checklist

- [ ] Login sets cookie with all required attributes (browser devtools → Application → Cookies)
- [ ] Logout clears cookie on `.ishbor.uz`
- [ ] Remember me extends Max-Age to 30 days
- [ ] Cookie not visible to `document.cookie` in console
- [ ] OAuth return includes cookie on redirect response
- [ ] Cross-tab: logout in one tab → other tab gets 401 on next API call
- [ ] Staging uses Secure even with test data

---

## 13. Related documents

- [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md)
- [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md)
- [JWT_STRATEGY.md](./JWT_STRATEGY.md) — mobile does not use this cookie
- [WEBSOCKET_SECURITY.md](../websockets/WEBSOCKET_SECURITY.md)

---

*Exact Set-Cookie contract for Ishbor — implementers must not deviate on HttpOnly, Secure (prod), SameSite=Lax, Domain=.ishbor.uz.*
