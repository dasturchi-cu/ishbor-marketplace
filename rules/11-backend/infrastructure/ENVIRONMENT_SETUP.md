# ENVIRONMENT_SETUP.md

**Purpose:** Complete environment variable reference for Ishbor FastAPI stack on VPS  
**Principle:** Secrets in `/opt/ishbor/.env` on VPS — never in git, never in client bundle  
**Environments:** local · staging · production  
**No Supabase** — all services self-hosted (PostgreSQL, Redis, MinIO)

---

## 1. File locations

| Environment | Path | Permissions |
|-------------|------|-------------|
| Local dev | `.env` (project root) | gitignored |
| Staging VPS | `/opt/ishbor-staging/.env` | `chmod 600`, owner `deploy` |
| Production VPS | `/opt/ishbor/.env` | `chmod 600`, owner `deploy` |
| CI | GitHub Secrets — SSH keys, host IPs only | — |
| Template (committed) | `.env.example` | Placeholders only |

Copy template:

```bash
cp .env.example .env
# Edit all CHANGE_ME values
```

---

## 2. Application core

```bash
# Environment identifier
APP_ENV=production              # local | staging | production
DEBUG=false                     # true only for local
LOG_LEVEL=info                  # debug | info | warning | error
NODE_ENV=production             # Frontend build

# Public URLs — no trailing slash
APP_URL=https://ishbor.uz
API_URL=https://api.ishbor.uz
CDN_BASE_URL=https://cdn.ishbor.uz

# Docker image tag for Sentry release tracking
IMAGE_TAG=abc123def             # git SHA from CI deploy
```

### Environment matrix

| Variable | local | staging | production |
|----------|-------|---------|------------|
| `APP_ENV` | local | staging | production |
| `DEBUG` | true | false | false |
| `LOG_LEVEL` | debug | info | info |
| `ALLOW_DEMO_AUTH` | true | true | **false** |
| `PAYME_TEST` | true | true | **false** |

---

## 3. Database (PostgreSQL)

```bash
POSTGRES_USER=ishbor
POSTGRES_PASSWORD=              # openssl rand -base64 32
POSTGRES_DB=ishbor
DATABASE_URL=postgresql://ishbor:${POSTGRES_PASSWORD}@postgres:5432/ishbor
DATABASE_POOL_SIZE=20
DATABASE_POOL_OVERFLOW=10
DATABASE_POOL_TIMEOUT=30
DATABASE_ECHO=false             # true for SQL debug — local only
```

Docker Compose internal hostname: `postgres` — not `localhost` on VPS.

Local development:

```bash
DATABASE_URL=postgresql://ishbor:ishbor@localhost:5432/ishbor
```

---

## 4. Redis

```bash
REDIS_URL=redis://redis:6379/0           # Sessions, cache
REDIS_CELERY_URL=redis://redis:6379/1     # Celery broker
REDIS_RATELIMIT_URL=redis://redis:6379/2  # Rate limit counters
REDIS_MAX_CONNECTIONS=50
```

Optional Redis password (recommended production):

```bash
REDIS_PASSWORD=                 # openssl rand -base64 24
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
```

---

## 5. Authentication and sessions

```bash
SESSION_SECRET=                 # openssl rand -hex 32 — REQUIRED
SESSION_TTL_HOURS=168           # 7 days default
SESSION_REMEMBER_TTL_HOURS=720  # 30 days with remember me
SESSION_COOKIE_NAME=ishbor_sid
CSRF_COOKIE_NAME=csrf_token

# Google OAuth 2.0
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=
OAUTH_GOOGLE_CALLBACK_URL=https://api.ishbor.uz/v1/auth/oauth/google/callback

# Apple Sign In (P2)
OAUTH_APPLE_CLIENT_ID=
OAUTH_APPLE_TEAM_ID=
OAUTH_APPLE_KEY_ID=
OAUTH_APPLE_PRIVATE_KEY=        # PEM multiline — use \n escapes in .env

# Demo auth — MUST be false in production
ALLOW_DEMO_AUTH=false
```

---

## 6. MinIO / S3 object storage

```bash
MINIO_ROOT_USER=                # Admin console only — not app access
MINIO_ROOT_PASSWORD=            # Strong random

S3_ENDPOINT=http://minio:9000   # Internal Docker network
S3_ACCESS_KEY=                  # MinIO service account IAM user
S3_SECRET_KEY=
S3_BUCKET=ishbor-uploads
S3_PUBLIC_BUCKET=ishbor-public
S3_PRIVATE_BUCKET=ishbor-private
S3_REGION=us-east-1             # MinIO default — required by SDK
S3_PRESIGN_TTL_SECONDS=3600

# Public CDN URL (external)
CDN_BASE_URL=https://cdn.ishbor.uz
```

Local development:

```bash
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

---

## 7. Payments

```bash
# Payme
PAYME_MERCHANT_ID=
PAYME_KEY=
PAYME_TEST=false                # true on staging
PAYME_CALLBACK_URL=https://api.ishbor.uz/v1/webhooks/payme

# Humo direct (P2)
ENABLE_HUMO_DIRECT=false
HUMO_MERCHANT_ID=
HUMO_API_KEY=
HUMO_WEBHOOK_SECRET=

# Uzcard (P2)
UZCARD_MERCHANT_ID=
UZCARD_API_KEY=

# FX rate source for UZS display
FX_USD_UZS_SOURCE=cbu           # Central Bank of Uzbekistan
FX_USD_UZS_FALLBACK=12500000    # Integer tiyin per USD — emergency fallback
```

Webhook IP allowlists configured in nginx — not env vars.

---

## 8. Email (Resend / Postmark)

```bash
EMAIL_PROVIDER=resend           # resend | postmark
RESEND_API_KEY=
POSTMARK_SERVER_TOKEN=
EMAIL_FROM=noreply@ishbor.uz
EMAIL_FROM_NAME=Ishbor
EMAIL_REPLY_TO=support@ishbor.uz
```

Requires SPF/DKIM DNS — see DOMAIN_SETUP.md.

---

## 9. SMS (Eskiz — Uzbekistan)

```bash
ESKIZ_EMAIL=                    # Eskiz account email
ESKIZ_PASSWORD=
ESKIZ_SENDER=4546               # Registered sender ID
SMS_ENABLED=true
SMS_OTP_TTL_SECONDS=600         # 10 minutes
```

Development: OTP `123456` accepted only when `APP_ENV=local` or `development`.

---

## 10. Monitoring and observability

```bash
# Sentry
SENTRY_DSN=                     # FastAPI project DSN
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1   # 10% performance in prod

# Frontend Sentry (public — safe to expose DSN)
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=production

# Prometheus / Grafana
PROMETHEUS_ENABLED=true
GRAFANA_ADMIN_USER=admin
GRAFANA_PASSWORD=               # Strong random — change on first login
GRAFANA_ROOT_URL=https://grafana.internal.ishbor.uz  # VPN/tunnel only

# Alerting
ALERTMANAGER_TELEGRAM_BOT_TOKEN=
ALERTMANAGER_TELEGRAM_CHAT_ID=
```

---

## 11. Feature flags

```bash
API_MODE=remote                 # remote | local — emergency frontend fallback
ENABLE_WEBSOCKET=true
ENABLE_PAYME=true
ENABLE_SUBSCRIPTIONS=true
ENABLE_AI_FEATURES=true
ENABLE_CLAMAV=true              # Virus scan on uploads
MAINTENANCE_MODE=false          # nginx serves maintenance page if true
```

Runtime toggles (non-secret) may move to PostgreSQL `system_config` table — admin `/admin/system`.

---

## 12. AI (server-only — never VITE_*)

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=2048
OPENAI_TIMEOUT_SECONDS=30
```

Audit all AI requests — log token usage, never log prompts with PII.

---

## 13. Celery background jobs

```bash
CELERY_BROKER_URL=${REDIS_CELERY_URL}
CELERY_RESULT_BACKEND=${REDIS_CELERY_URL}
CELERY_TASK_ALWAYS_EAGER=false  # true for local sync testing only
CELERY_WORKER_CONCURRENCY=4
```

---

## 14. ClamAV virus scanning

```bash
CLAMAV_HOST=clamav
CLAMAV_PORT=3310
CLAMAV_TIMEOUT=30
UPLOAD_SCAN_ENABLED=true
```

---

## 15. Frontend public variables (build-time)

Only non-secret values — embedded in client bundle:

```bash
VITE_API_URL=https://api.ishbor.uz
VITE_CDN_URL=https://cdn.ishbor.uz
VITE_APP_ENV=production
VITE_API_MODE=remote
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Never in VITE_*:**

- `DATABASE_URL`
- `SESSION_SECRET`
- `PAYME_KEY`
- `OPENAI_API_KEY`
- `ESKIZ_PASSWORD`
- Any `*_SECRET` or `*_KEY` except public Sentry DSN

---

## 16. Complete .env.example (committed)

```bash
# === Ishbor Environment Template ===
# Copy to .env — NEVER commit .env

APP_ENV=local
DEBUG=true
LOG_LEVEL=debug
APP_URL=http://localhost:5173
API_URL=http://localhost:8000
CDN_BASE_URL=http://localhost:9000

DATABASE_URL=postgresql://ishbor:changeme@localhost:5432/ishbor
REDIS_URL=redis://localhost:6379/0
REDIS_CELERY_URL=redis://localhost:6379/1
REDIS_RATELIMIT_URL=redis://localhost:6379/2

SESSION_SECRET=change-me-in-production-min-32-chars

S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=ishbor-uploads
S3_PUBLIC_BUCKET=ishbor-public
S3_PRIVATE_BUCKET=ishbor-private

EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM=noreply@ishbor.uz

ESKIZ_EMAIL=
ESKIZ_PASSWORD=
SMS_ENABLED=false

OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=

PAYME_MERCHANT_ID=
PAYME_KEY=
PAYME_TEST=true

SENTRY_DSN=
ALLOW_DEMO_AUTH=true
ENABLE_PAYME=false
API_MODE=local

VITE_API_URL=http://localhost:8000
VITE_CDN_URL=http://localhost:9000
VITE_API_MODE=local
```

---

## 17. Startup validation

FastAPI validates on boot (production):

```python
REQUIRED_PRODUCTION = [
    "DATABASE_URL", "REDIS_URL", "SESSION_SECRET",
    "S3_ENDPOINT", "S3_ACCESS_KEY", "S3_SECRET_KEY",
]
# Warn if ENABLE_PAYME=true but PAYME_KEY missing
# Fail if ALLOW_DEMO_AUTH=true when APP_ENV=production
# Fail if SESSION_SECRET shorter than 32 chars
```

Prevents silent misconfiguration deploys.

---

## 18. Secret rotation schedule

| Secret | Rotation frequency | Trigger |
|--------|-------------------|---------|
| `SESSION_SECRET` | On suspected breach | Invalidate all sessions |
| Payment keys | Quarterly | Calendar reminder |
| `S3_SECRET_KEY` | Quarterly | Update MinIO IAM |
| OAuth secrets | On provider rotation | Google Cloud Console |
| `GRAFANA_PASSWORD` | Quarterly | Admin action |
| SSH deploy keys | Annually | GitHub Actions |

Document rotation in audit log.

---

## 19. Deployment checklist

- [ ] `.env` exists on VPS with all REQUIRED vars set
- [ ] `chmod 600` on `.env`
- [ ] `ALLOW_DEMO_AUTH=false` in production
- [ ] `PAYME_TEST=false` in production
- [ ] No secrets in `VITE_*` build output
- [ ] Staging and production use different `SESSION_SECRET` and DB
- [ ] FastAPI startup validation passes
- [ ] `.env.example` updated if new vars added

---

## 20. Related documents

- [ENVIRONMENT_STRATEGY.md](./ENVIRONMENT_STRATEGY.md)
- [DOCKER_COMPOSE_STRUCTURE.md](./DOCKER_COMPOSE_STRUCTURE.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [DOMAIN_SETUP.md](./DOMAIN_SETUP.md)
- [../security/SECURITY_ARCHITECTURE.md](../security/SECURITY_ARCHITECTURE.md)
- [../../21-observability/SENTRY_GUIDE.md](../../21-observability/SENTRY_GUIDE.md)

---

*All secrets in VPS `.env` only. Three isolated environments with separate databases, Redis, and session secrets. FastAPI startup fails fast on missing required vars in production.*
