# SECURITY_HEADERS.md

**Delivery:** nginx `snippets/security-headers.conf` for all public responses  
**Scope:** Frontend (ishbor.uz) and API (api.ishbor.uz)

---

## 1. Complete header set

```nginx
# /opt/ishbor/nginx/snippets/security-headers.conf

# Strict Transport Security — 1 year, include subdomains
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Prevent clickjacking
add_header X-Frame-Options "DENY" always;

# Prevent MIME sniffing
add_header X-Content-Type-Options "nosniff" always;

# XSS filter (legacy browsers)
add_header X-XSS-Protection "1; mode=block" always;

# Referrer policy — send origin only on cross-origin
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Permissions policy — disable unnecessary browser features
add_header Permissions-Policy "
  accelerometer=(),
  camera=(),
  geolocation=(),
  gyroscope=(),
  magnetometer=(),
  microphone=(),
  payment=(),
  usb=()
" always;

# Cross-origin isolation (API only — less restrictive for frontend)
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;

# CSP — frontend only (see CSP_CONFIGURATION.md)
# included separately in ishbor.uz server block
```

---

## 2. Header reference

### Strict-Transport-Security (HSTS)

| Parameter | Value | Notes |
|-----------|-------|-------|
| max-age | 31536000 (1 year) | Browser remembers HTTPS only |
| includeSubDomains | yes | api, cdn, staging subdomains |
| preload | yes | Submit to hstspreload.org after stable |

**Requirement:** All HTTP → HTTPS redirect before enabling preload.

### X-Frame-Options

`DENY` — page cannot be embedded in any iframe. Prevents clickjacking on checkout and admin panels.

Exception (P2): YouTube embeds use CSP `frame-src` instead — X-Frame-Options remains DENY on parent page.

### X-Content-Type-Options

`nosniff` — browser must not MIME-sniff responses. Prevents `.jpg` served as HTML execution.

### Referrer-Policy

`strict-origin-when-cross-origin` — full URL for same-origin, origin only for cross-origin, nothing on downgrade.

Protects query params in referrer (e.g. reset tokens) from leaking to third parties.

### Permissions-Policy

Disables browser APIs not used by Ishbor. Re-enable `payment=(self)` if Stripe Elements added (P2).

---

## 3. API-specific headers

```nginx
# api.ishbor.uz server block additions
add_header Cache-Control "no-store, no-cache, must-revalidate" always;
add_header Pragma "no-cache" always;
```

API responses must not be cached by browsers or CDNs — financial data sensitivity.

CORS headers handled by FastAPI — nginx does not duplicate.

---

## 4. Frontend-specific headers

```nginx
# ishbor.uz — static assets can be cached
location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    # Security headers still apply from server block
}

# HTML pages — no cache (SSR)
location / {
    add_header Cache-Control "no-cache";
    include /etc/nginx/snippets/csp.conf;
}
```

---

## 5. Cookie security flags

Set by FastAPI — not nginx:

```python
response.set_cookie(
    key="session",
    value=session_token,
    httponly=True,
    secure=True,          # HTTPS only
    samesite="lax",
    path="/",
    max_age=604800,       # 7 days
)

response.set_cookie(
    key="csrf_token",
    value=csrf_token,
    httponly=False,       # JS must read for X-CSRF-Token header
    secure=True,
    samesite="lax",
    path="/",
)
```

---

## 6. SSL/TLS configuration

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
ssl_stapling on;
ssl_stapling_verify on;
```

From certbot `options-ssl-nginx.conf` — Mozilla Intermediate profile.

---

## 7. Verification

```bash
# securityheaders.com scan
curl -sI https://ishbor.uz
curl -sI https://api.ishbor.uz/health

# Expected grades: A or A+ on securityheaders.com
# Verify HSTS preload eligibility
```

| Check | Expected |
|-------|----------|
| HSTS present | max-age ≥ 31536000 |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| CSP present (frontend) | default-src 'self' |
| Server header | Hidden — `server_tokens off` |

```nginx
# nginx.conf
server_tokens off;
more_clear_headers Server;  # headers-more module optional
```

---

## 8. Related documents

- [CSP_CONFIGURATION.md](./CSP_CONFIGURATION.md)
- [API_SECURITY.md](./API_SECURITY.md)
- [../infrastructure/NGINX_ARCHITECTURE.md](../infrastructure/NGINX_ARCHITECTURE.md)

---

*All public responses include HSTS, X-Frame-Options DENY, nosniff, and Referrer-Policy. CSP is additional on frontend responses.*
