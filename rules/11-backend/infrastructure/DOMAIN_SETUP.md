# DOMAIN_SETUP.md

**Purpose:** DNS configuration for Ishbor marketplace on self-hosted VPS  
**Registrar:** `.uz` domain via UZINFOCOM or authorized registrar  
**Stack:** Single VPS (beta) or split VPS (growth) — all records point to nginx entry point

---

## 1. Domain inventory

| Domain | Purpose | Environment |
|--------|---------|-------------|
| `ishbor.uz` | Primary frontend (TanStack Start / Nitro SSR) | Production |
| `www.ishbor.uz` | Redirect to apex | Production |
| `api.ishbor.uz` | FastAPI REST + WebSocket | Production |
| `cdn.ishbor.uz` | MinIO public bucket (avatars, portfolio) | Production |
| `staging.ishbor.uz` | Staging frontend | Staging |
| `staging-api.ishbor.uz` | Staging API | Staging |

Email sending domain: `ishbor.uz` — SPF/DKIM for Resend/Postmark (see EMAIL_ARCHITECTURE.md).

---

## 2. Production DNS records

Replace `203.0.113.10` with your VPS public IPv4 address.

### Required A records

| Name | Type | Value | TTL |
|------|------|-------|-----|
| `@` (ishbor.uz) | A | 203.0.113.10 | 300 |
| `api` | A | 203.0.113.10 | 300 |
| `cdn` | A | 203.0.113.10 | 300 |

### CNAME records

| Name | Type | Value | TTL |
|------|------|-------|-----|
| `www` | CNAME | `ishbor.uz` | 300 |

**Note:** Some `.uz` registrars require A record for `www` instead of CNAME — use A to same IP if CNAME unsupported at apex sibling.

### Optional AAAA (IPv6)

If VPS provider assigns IPv6:

| Name | Type | Value | TTL |
|------|------|-------|-----|
| `@` | AAAA | 2001:db8::1 | 300 |
| `api` | AAAA | 2001:db8::1 | 300 |
| `cdn` | AAAA | 2001:db8::1 | 300 |

Ensure nginx listens on `[::]:443` if using IPv6.

---

## 3. Staging DNS records

Separate VPS IP: `203.0.113.20`

| Name | Type | Value | TTL |
|------|------|-------|-----|
| `staging` | A | 203.0.113.20 | 300 |
| `staging-api` | A | 203.0.113.20 | 300 |

Never point staging DNS to production VPS — isolated databases required.

---

## 4. Email DNS records

For transactional email from `noreply@ishbor.uz`:

### SPF

```
TXT @ "v=spf1 include:_spf.resend.com ~all"
```

Adjust `include` for Postmark if using `EMAIL_PROVIDER=postmark`.

### DKIM

Resend/Postmark provides DKIM CNAME records — add exactly as provider instructs:

```
CNAME resend._domainkey → resend-domainkey.resend.com
```

### DMARC

```
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@ishbor.uz"
```

Start with `p=none` during setup, move to `quarantine` after verification.

---

## 5. Verification commands

After DNS changes, verify propagation:

```bash
# Apex domain
dig ishbor.uz A +short
dig ishbor.uz AAAA +short

# Subdomains
dig api.ishbor.uz A +short
dig cdn.ishbor.uz A +short
dig www.ishbor.uz CNAME +short

# Staging
dig staging.ishbor.uz A +short
dig staging-api.ishbor.uz A +short

# Email
dig ishbor.uz TXT +short
dig _dmarc.ishbor.uz TXT +short
```

Online tools: whatsmydns.net for global propagation check.

Expected: all A records return VPS IP within TTL window (5–30 minutes typical).

---

## 6. Nginx server_name mapping

Each DNS host maps to nginx server block:

| Host | nginx config file | Upstream |
|------|-------------------|----------|
| ishbor.uz, www.ishbor.uz | `ishbor.uz.conf` | frontend:3000 |
| api.ishbor.uz | `api.ishbor.uz.conf` | api:8000 (×2) |
| cdn.ishbor.uz | `cdn.ishbor.uz.conf` | minio:9000/ishbor-public |

www redirect: nginx returns `301 https://ishbor.uz$request_uri` — canonical URL is apex.

---

## 7. Request flow after DNS

```
User types ishbor.uz
  → DNS A → VPS IP
  → nginx :443 TLS (certbot cert for ishbor.uz)
  → proxy_pass frontend:3000

Frontend API call to api.ishbor.uz/v1/...
  → DNS A → same VPS IP
  → nginx api.ishbor.uz server block
  → proxy_pass api:8000

Static asset cdn.ishbor.uz/avatars/...
  → nginx → minio public bucket
```

WebSocket: `wss://api.ishbor.uz/ws` — same api server block with upgrade headers.

---

## 8. Cloudflare proxy (optional)

If enabling Cloudflare orange cloud:

| Record | Proxy status |
|--------|--------------|
| ishbor.uz | Proxied |
| www | Proxied |
| api.ishbor.uz | Proxied (or DNS-only for WebSocket debugging) |
| cdn.ishbor.uz | Proxied (cache enabled) |

Considerations:

- Origin certificate required (Let's Encrypt or Cloudflare origin cert)
- Real IP: configure `real_ip_header CF-Connecting-IP` in nginx
- WebSocket: enable in Cloudflare network settings
- Rate limits: Cloudflare adds edge protection — keep nginx limits as backup

---

## 9. Frontend environment variables

After DNS live, set build-time public vars:

| Variable | Production value |
|----------|------------------|
| `VITE_API_URL` | `https://api.ishbor.uz` |
| `VITE_CDN_URL` | `https://cdn.ishbor.uz` |
| `VITE_APP_ENV` | `production` |

Backend `.env`:

| Variable | Production value |
|----------|------------------|
| `APP_URL` | `https://ishbor.uz` |
| `API_URL` | `https://api.ishbor.uz` |
| `CDN_BASE_URL` | `https://cdn.ishbor.uz` |

CORS allowed origins: `https://ishbor.uz`, `https://www.ishbor.uz`.

---

## 10. SSL certificate SAN list

Certbot must include all public hostnames in one certificate request:

```
-d ishbor.uz
-d www.ishbor.uz
-d api.ishbor.uz
-d cdn.ishbor.uz
```

See [SSL_SETUP.md](./SSL_SETUP.md).

---

## 11. Common mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| api subdomain missing | API calls fail CORS/SSL | Add A record for `api` |
| www not configured | Certificate mismatch | Add CNAME or A + nginx redirect |
| TTL too high during migration | Slow cutover | Lower TTL to 300 before IP change |
| Staging on prod IP | Data leak between envs | Separate VPS and records |
| Missing cdn subdomain | Broken avatar URLs | Add cdn A record + nginx block |

---

## 12. DNS cutover checklist

- [ ] Lower TTL to 300 (24h before migration)
- [ ] Staging DNS verified on staging VPS
- [ ] Production A records updated to new IP
- [ ] `dig` confirms propagation from 3+ locations
- [ ] Certbot issued for all SANs
- [ ] HTTPS works on all four hosts
- [ ] `/health/ready` returns 200 externally
- [ ] Email SPF/DKIM/DMARC validated
- [ ] Restore TTL to 3600 after stable 48h

---

## 13. Related documents

- [SSL_SETUP.md](./SSL_SETUP.md)
- [VPS_SETUP.md](./VPS_SETUP.md)
- [NGINX_ARCHITECTURE.md](./NGINX_ARCHITECTURE.md)
- [INFRASTRUCTURE_ARCHITECTURE.md](./INFRASTRUCTURE_ARCHITECTURE.md)
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- [EMAIL_ARCHITECTURE.md](./EMAIL_ARCHITECTURE.md)

---

*Production: A records for @, api, cdn → VPS IP. CNAME www → ishbor.uz. Staging on separate VPS with staging.* subdomains.*
