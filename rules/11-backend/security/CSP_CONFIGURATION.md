# CSP_CONFIGURATION.md

**Delivery:** nginx response headers for TanStack Start frontend  
**Goal:** Mitigate XSS, data injection, and unauthorized resource loading

---

## 1. CSP strategy for TanStack / Vite frontend

TanStack Start with Vite requires careful CSP balance:

- `'unsafe-inline'` for styles may be needed for CSS-in-JS (minimize scope)
- Vite dev server needs relaxed CSP — production is strict
- API calls go to `api.ishbor.uz` — must be in `connect-src`
- CDN images from `cdn.ishbor.uz` — must be in `img-src`
- WebSocket to `wss://api.ishbor.uz` — must be in `connect-src`

---

## 2. Production CSP header

```nginx
# /opt/ishbor/nginx/snippets/csp.conf
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://cdn.ishbor.uz data: blob:;
  font-src 'self' data:;
  connect-src 'self' https://api.ishbor.uz wss://api.ishbor.uz;
  media-src 'self' https://cdn.ishbor.uz;
  object-src 'none';
  frame-src 'none';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
" always;
```

Applied to `ishbor.uz` frontend server block — NOT api.ishbor.uz (JSON API doesn't need CSP).

---

## 3. Directive breakdown

| Directive | Value | Rationale |
|-----------|-------|-----------|
| `default-src` | `'self'` | Deny by default |
| `script-src` | `'self'` | No external scripts — no Google Analytics inline (use nonce P2) |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind/CSS modules inject inline styles |
| `img-src` | `'self' cdn.ishbor.uz data: blob:` | Avatar uploads, CDN portfolio images |
| `connect-src` | `'self' api.ishbor.uz wss:` | API + WebSocket |
| `object-src` | `'none'` | Block Flash/plugins |
| `frame-src` | `'none'` | No iframes P0 — YouTube embed P2 adds exception |
| `frame-ancestors` | `'none'` | Clickjacking protection (also X-Frame-Options) |
| `base-uri` | `'self'` | Prevent base tag injection |
| `form-action` | `'self'` | Forms submit to ishbor.uz only |
| `upgrade-insecure-requests` | — | Force HTTPS sub-resources |

---

## 4. Development CSP override

```nginx
# docker-compose.dev.yml nginx override
# Relaxed for Vite HMR
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  connect-src 'self' ws://localhost:* http://localhost:*;
  ...
" always;
```

Never deploy dev CSP to production.

---

## 5. Nonce-based script CSP (P2 roadmap)

Replace `'unsafe-inline'` in script-src with nonces:

```python
# SSR middleware generates nonce per request
nonce = secrets.token_urlsafe(16)
response.headers["Content-Security-Policy"] = f"script-src 'self' 'nonce-{nonce}'"
# Pass nonce to TanStack SSR template
```

Requires Vite build configuration for nonce injection.

---

## 6. Third-party exceptions (when added)

| Service | CSP change |
|---------|------------|
| Sentry browser | `script-src https://browser.sentry-cdn.com` |
| Google OAuth button | `script-src https://accounts.google.com; frame-src https://accounts.google.com` |
| YouTube video intro | `frame-src https://www.youtube.com` |
| Stripe (P2) | `script-src https://js.stripe.com; frame-src https://js.stripe.com` |

Each addition requires security review and THREAT_MODEL update.

---

## 7. CSP reporting (optional)

```nginx
add_header Content-Security-Policy-Report-Only "...; report-uri /csp-report" always;
```

Collect violations in FastAPI endpoint → log for tuning before enforcing.

Production: enforce mode only — no Report-Only after tuning complete.

---

## 8. Testing CSP

```bash
# Verify header present
curl -sI https://ishbor.uz | grep -i content-security

# Browser devtools → Console → CSP violations
# Must be zero on: landing, dashboard, checkout, admin
```

CI (P2): Playwright test asserts no CSP violations on critical paths.

---

## 9. Related documents

- [SECURITY_HEADERS.md](./SECURITY_HEADERS.md)
- [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md)
- [../infrastructure/NGINX_ARCHITECTURE.md](../infrastructure/NGINX_ARCHITECTURE.md)
- [THREAT_MODEL.md](./THREAT_MODEL.md)

---

*CSP is set at nginx for the TanStack frontend. Production policy blocks inline scripts; styles allow unsafe-inline for Tailwind compatibility.*
