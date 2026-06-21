# SSL_SETUP.md

**Purpose:** TLS certificate setup for ishbor.uz with Certbot and Nginx on VPS  
**Provider:** Let's Encrypt (free, automated renewal)  
**Domains:** ishbor.uz · www.ishbor.uz · api.ishbor.uz · cdn.ishbor.uz

---

## 1. Prerequisites

Before requesting certificates:

1. VPS provisioned per [VPS_SETUP.md](./VPS_SETUP.md)
2. DNS A records pointing to VPS IP — see [DOMAIN_SETUP.md](./DOMAIN_SETUP.md)
3. Nginx installed (Docker container or native) listening on port 80
4. UFW allows ports 80 and 443
5. Domain registrar DNS propagated (verify with `dig ishbor.uz +short`)

Let's Encrypt validates domain ownership via HTTP-01 challenge on port 80.

---

## 2. Certbot installation

On Ubuntu 22.04 host (outside or inside nginx container approach):

```bash
apt install -y certbot python3-certbot-nginx
certbot --version
```

For Docker-only workflow, use certbot standalone or webroot plugin with shared volume:

```
/opt/ishbor/certbot/
├── conf/          # /etc/letsencrypt equivalent
└── www/           # ACME challenge webroot
```

Mount in nginx container:

```yaml
# compose.yml excerpt
nginx:
  volumes:
    - /opt/ishbor/certbot/conf:/etc/letsencrypt:ro
    - /opt/ishbor/certbot/www:/var/www/certbot:ro
```

---

## 3. Initial certificate issuance

### Option A — certbot nginx plugin (native nginx)

If nginx runs on host:

```bash
certbot certonly --nginx \
  -d ishbor.uz \
  -d www.ishbor.uz \
  -d api.ishbor.uz \
  -d cdn.ishbor.uz \
  --email admin@ishbor.uz \
  --agree-tos \
  --no-eff-email
```

### Option B — webroot (Docker nginx)

Ensure nginx serves ACME challenges:

```nginx
# Temporary or permanent in ishbor.uz.conf
location /.well-known/acme-challenge/ {
    root /var/www/certbot;
}
```

Request certificates:

```bash
certbot certonly --webroot \
  -w /opt/ishbor/certbot/www \
  -d ishbor.uz \
  -d www.ishbor.uz \
  -d api.ishbor.uz \
  -d cdn.ishbor.uz \
  --email admin@ishbor.uz \
  --agree-tos
```

Certificates stored at:

```
/opt/ishbor/certbot/conf/live/ishbor.uz/fullchain.pem
/opt/ishbor/certbot/conf/live/ishbor.uz/privkey.pem
```

Let's Encrypt uses first `-d` as certificate directory name.

---

## 4. Nginx SSL configuration

### Primary frontend — ishbor.uz

```nginx
server {
    listen 443 ssl http2;
    server_name ishbor.uz www.ishbor.uz;

    ssl_certificate     /etc/letsencrypt/live/ishbor.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ishbor.uz/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # HSTS — enable only after confirming HTTPS works
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    include /etc/nginx/snippets/security-headers.conf;

    location / {
        proxy_pass http://frontend:3000;
        # ... proxy headers
    }
}

server {
    listen 80;
    server_name ishbor.uz www.ishbor.uz;
    return 301 https://ishbor.uz$request_uri;
}
```

### API — api.ishbor.uz

Same certificate covers SAN `api.ishbor.uz` if included in initial request.

```nginx
server {
    listen 443 ssl http2;
    server_name api.ishbor.uz;

    ssl_certificate     /etc/letsencrypt/live/ishbor.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ishbor.uz/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;

    client_max_body_size 1m;

    location / {
        proxy_pass http://api_backend;
        include /etc/nginx/snippets/proxy-api.conf;
    }
}
```

See [NGINX_ARCHITECTURE.md](./NGINX_ARCHITECTURE.md) for full server blocks.

---

## 5. TLS security settings

Use Mozilla Intermediate profile via certbot's `options-ssl-nginx.conf`:

| Setting | Value |
|---------|-------|
| Protocols | TLSv1.2 TLSv1.3 |
| Ciphers | Modern ECDHE suites |
| OCSP stapling | Enabled via certbot options |
| Session tickets | Off (forward secrecy) |

Generate DH params (once):

```bash
certbot certonly --nginx -d ishbor.uz  # creates ssl-dhparams.pem
# Or manually:
openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
```

Test configuration:

```bash
nginx -t
docker exec nginx nginx -t
```

External test: [SSL Labs](https://www.ssllabs.com/ssltest/) — target grade A.

---

## 6. Auto-renewal

Let's Encrypt certificates expire every 90 days. Renew at 60 days via cron or systemd timer.

### Cron (recommended for Docker)

```bash
crontab -e -u deploy
```

```
0 3 * * * certbot renew --quiet --deploy-hook "docker exec nginx nginx -s reload"
```

The deploy hook reloads nginx after successful renewal — zero downtime.

### Systemd timer (alternative)

```bash
systemctl enable certbot.timer
systemctl start certbot.timer
systemctl status certbot.timer
```

### Dry run test

Run monthly and after any nginx config change:

```bash
certbot renew --dry-run
```

Expected output: "Congratulations, all renewals succeeded."

---

## 7. Staging environment

Staging uses separate certificates:

```bash
certbot certonly --webroot \
  -w /opt/ishbor-staging/certbot/www \
  -d staging.ishbor.uz \
  -d staging-api.ishbor.uz \
  --email admin@ishbor.uz \
  --agree-tos
```

Never share production and staging private keys.

---

## 8. Cloudflare proxy (optional P2)

If using Cloudflare in front of VPS:

| Mode | Certificate on origin |
|------|---------------------|
| Full (strict) | Let's Encrypt or Cloudflare origin cert |
| Full | Any valid cert |

Cloudflare handles edge TLS; origin still needs valid cert for strict mode.

Use Cloudflare origin certificate (15-year) on nginx if preferred — store in `/opt/ishbor/certbot/conf/cloudflare/`.

---

## 9. Certificate monitoring

| Check | Method | Alert |
|-------|--------|-------|
| Expiry <30 days | certbot certificates | Email from certbot |
| Expiry <14 days | Prometheus blackbox SSL probe | P1 Telegram |
| Renewal failure | cron stderr → syslog | P1 if 2 consecutive failures |

Prometheus probe example:

```yaml
# blackbox SSL module
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_status_codes: [200]
      fail_if_not_ssl: true
```

Alert: `ssl_cert_expiry_days < 14`.

---

## 10. Troubleshooting

| Problem | Solution |
|---------|----------|
| HTTP-01 challenge fails | Verify port 80 open, DNS correct, nginx serves webroot |
| Rate limit exceeded | Let's Encrypt: 5 certs/week/domain — use staging API for tests |
| nginx reload fails after renew | Check cert paths match server_name blocks |
| Mixed content warnings | Ensure all assets use `https://cdn.ishbor.uz` |
| HSTS lockout during setup | Remove HSTS header until HTTPS confirmed working |

Certbot staging (testing):

```bash
certbot certonly --staging --webroot -w /opt/ishbor/certbot/www -d test.ishbor.uz
```

---

## 11. Security checklist

- [ ] All four domains covered by single or valid SAN certificate
- [ ] HTTP redirects to HTTPS on all hosts
- [ ] HSTS enabled with max-age ≥ 31536000
- [ ] Auto-renewal cron active and dry-run passes
- [ ] Private key permissions: `chmod 600`, not in git
- [ ] TLS 1.0/1.1 disabled
- [ ] SSL Labs grade A verified

---

## 12. Related documents

- [DOMAIN_SETUP.md](./DOMAIN_SETUP.md)
- [NGINX_ARCHITECTURE.md](./NGINX_ARCHITECTURE.md)
- [VPS_SETUP.md](./VPS_SETUP.md)
- [../security/SECURITY_HEADERS.md](../security/SECURITY_HEADERS.md)
- [../../21-observability/UPTIME_MONITORING.md](../../21-observability/UPTIME_MONITORING.md)

---

*Certbot on Ubuntu 22.04 with nginx webroot plugin. Auto-renew via cron at 03:00 UZT with nginx reload deploy hook.*
