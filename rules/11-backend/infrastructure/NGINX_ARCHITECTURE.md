# NGINX_ARCHITECTURE.md

**Role:** TLS termination, reverse proxy, WebSocket upgrade, rate limiting, security headers  
**Deployment:** nginx container or native on VPS fronting all public traffic

---

## 1. Server blocks

### ishbor.uz — frontend

```nginx
# /opt/ishbor/nginx/conf.d/ishbor.uz.conf
server {
    listen 443 ssl http2;
    server_name ishbor.uz www.ishbor.uz;

    ssl_certificate     /etc/letsencrypt/live/ishbor.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ishbor.uz/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;

    # Security headers — see ../security/SECURITY_HEADERS.md
    include /etc/nginx/snippets/security-headers.conf;

    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /assets/ {
        proxy_pass http://frontend:3000;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}

server {
    listen 80;
    server_name ishbor.uz www.ishbor.uz;
    return 301 https://ishbor.uz$request_uri;
}
```

### api.ishbor.uz — FastAPI

```nginx
# /opt/ishbor/nginx/conf.d/api.ishbor.uz.conf
upstream api_backend {
    least_conn;
    server api:8000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.ishbor.uz;

    ssl_certificate     /etc/letsencrypt/live/api.ishbor.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.ishbor.uz/privkey.pem;

    include /etc/nginx/snippets/security-headers.conf;

    client_max_body_size 1m;  # JSON API — uploads via presign

    # Rate limit zones
    limit_req_zone $binary_remote_addr zone=api_general:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=api_auth:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api_checkout:10m rate=10r/m;

    location /v1/auth/ {
        limit_req zone=api_auth burst=10 nodelay;
        proxy_pass http://api_backend;
        include /etc/nginx/snippets/proxy-api.conf;
    }

    location /v1/checkout/ {
        limit_req zone=api_checkout burst=5 nodelay;
        proxy_pass http://api_backend;
        include /etc/nginx/snippets/proxy-api.conf;
    }

    location /v1/wallet/ {
        limit_req zone=api_checkout burst=5 nodelay;
        proxy_pass http://api_backend;
        include /etc/nginx/snippets/proxy-api.conf;
    }

    location /ws {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location / {
        limit_req zone=api_general burst=50 nodelay;
        proxy_pass http://api_backend;
        include /etc/nginx/snippets/proxy-api.conf;
    }
}
```

### cdn.ishbor.uz — MinIO public bucket

```nginx
server {
    listen 443 ssl http2;
    server_name cdn.ishbor.uz;

    location / {
        proxy_pass http://minio:9000/ishbor-public/;
        proxy_set_header Host $host;
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

---

## 2. Proxy snippet

```nginx
# /etc/nginx/snippets/proxy-api.conf
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Request-Id $request_id;

# Generate request ID if not present
set $request_id $http_x_request_id;
if ($request_id = "") {
    set $request_id "${remote_addr}-${msec}-${pid}";
}
```

FastAPI reads `X-Request-Id` for correlation — see LOGGING_ARCHITECTURE.md.

---

## 3. SSL — Certbot

Initial issuance:

```bash
certbot certonly --nginx \
  -d ishbor.uz -d www.ishbor.uz \
  -d api.ishbor.uz \
  -d cdn.ishbor.uz \
  --email admin@ishbor.uz --agree-tos
```

Auto-renew: systemd timer or cron — reload nginx on success.

TLS settings: Mozilla Intermediate — `options-ssl-nginx.conf` from certbot.

---

## 4. Rate limit zones

| Zone | Rate | Applies to |
|------|------|------------|
| `api_general` | 30 req/s | Default API |
| `api_auth` | 5 req/min | Login, register, OTP |
| `api_checkout` | 10 req/min | Checkout, wallet, deposit |
| `webhooks` | 100 req/s | Gateway webhooks (IP allowlist) |

Webhook location — restrict by provider IP:

```nginx
location /v1/webhooks/payme {
    allow PAYME_IP_RANGE;
    deny all;
    proxy_pass http://api_backend;
}
```

Redis-backed application rate limits supplement nginx — see ../security/RATE_LIMITING.md.

---

## 5. WebSocket upgrade

Requirements for TanStack realtime:

- `proxy_http_version 1.1`
- `Upgrade` and `Connection` headers
- Long `proxy_read_timeout` (24h)
- Sticky sessions optional — stateless WS auth via session cookie

Health check: WS ping/pong in application layer.

---

## 6. Gzip and compression

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types application/json application/javascript text/css text/plain;
```

Brotli optional via ngx_brotli module (P2).

---

## 7. Logging

```nginx
log_format ishbor_json escape=json '{'
  '"time":"$time_iso8601",'
  '"remote_addr":"$remote_addr",'
  '"request_id":"$request_id",'
  '"method":"$request_method",'
  '"uri":"$request_uri",'
  '"status":$status,'
  '"body_bytes_sent":$body_bytes_sent,'
  '"request_time":$request_time,'
  '"upstream_response_time":"$upstream_response_time"'
'}';

access_log /var/log/nginx/access.json ishbor_json;
error_log  /var/log/nginx/error.log warn;
```

Logs rotated via logrotate — shipped to Loki or file aggregation.

---

## 8. Health check routing

```nginx
location /health {
    proxy_pass http://api_backend/health;
    access_log off;
}

location /ready {
    proxy_pass http://api_backend/health/ready;
    access_log off;
}
```

External uptime monitors hit `https://api.ishbor.uz/health/ready`.

---

## 9. Error pages

API returns JSON errors — nginx custom pages for 502/503 only:

```nginx
error_page 502 503 /503.json;
location = /503.json {
    default_type application/json;
    return 503 '{"error":"service_unavailable","message":"Vaqtincha mavjud emas"}';
}
```

Frontend 502 → static maintenance page from `/var/www/maintenance.html`.

---

## 10. Related documents

- [../security/SECURITY_HEADERS.md](../security/SECURITY_HEADERS.md)
- [../security/CSP_CONFIGURATION.md](../security/CSP_CONFIGURATION.md)
- [../security/RATE_LIMITING.md](../security/RATE_LIMITING.md)
- [INFRASTRUCTURE_ARCHITECTURE.md](./INFRASTRUCTURE_ARCHITECTURE.md)

---

*Nginx is the single public entry point. All backend services are unreachable except through defined upstream blocks.*
