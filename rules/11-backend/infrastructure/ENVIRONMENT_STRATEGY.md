# ENVIRONMENT_STRATEGY.md

**Principle:** Secrets in `.env` on VPS — never in git  
**Environments:** local, staging, production  
**No Supabase** — all config points to self-hosted services

---

## 1. Environment matrix

| Variable | local | staging | production |
|----------|-------|---------|------------|
| `APP_ENV` | local | staging | production |
| `DEBUG` | true | false | false |
| `DATABASE_URL` | localhost:5432 | staging postgres | prod postgres |
| `REDIS_URL` | localhost:6379 | staging redis | prod redis |
| `S3_ENDPOINT` | http://localhost:9000 | http://minio:9000 | http://minio:9000 |
| `PAYME_TEST` | true | true | false |
| `ALLOW_DEMO_AUTH` | true | true | false |
| `SENTRY_DSN` | empty | staging DSN | prod DSN |
| `LOG_LEVEL` | debug | info | info |

---

## 2. Secret management rules

| Rule | Detail |
|------|--------|
| Never commit `.env` | Listed in `.gitignore` |
| Provide `.env.example` | Placeholder values only — no real secrets |
| VPS `.env` permissions | `chmod 600`, owned by `deploy` |
| Rotation | Payment keys quarterly; SESSION_SECRET on breach |
| CI secrets | SSH keys and host IPs only — not app secrets |
| Frontend public vars | `VITE_*` prefix — public values only |

---

## 3. Complete environment variable reference

### Application core

```bash
APP_ENV=production          # local | staging | production
DEBUG=false
LOG_LEVEL=info              # debug | info | warning | error
APP_URL=https://ishbor.uz
API_URL=https://api.ishbor.uz
CDN_BASE_URL=https://cdn.ishbor.uz
```

### Database

```bash
POSTGRES_PASSWORD=          # strong random — docker compose
DATABASE_URL=postgresql://ishbor:${POSTGRES_PASSWORD}@postgres:5432/ishbor
DATABASE_POOL_SIZE=20
DATABASE_POOL_OVERFLOW=10
```

### Redis

```bash
REDIS_URL=redis://redis:6379/0       # sessions, cache
REDIS_CELERY_URL=redis://redis:6379/1 # Celery broker
REDIS_RATELIMIT_URL=redis://redis:6379/2
```

### Auth

```bash
SESSION_SECRET=             # openssl rand -hex 32
SESSION_TTL_HOURS=168       # 7 days
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=
OAUTH_APPLE_CLIENT_ID=
OAUTH_APPLE_TEAM_ID=
OAUTH_APPLE_KEY_ID=
OAUTH_APPLE_PRIVATE_KEY=    # PEM — multiline in .env
```

### MinIO / S3

```bash
MINIO_ROOT_USER=
MINIO_ROOT_PASSWORD=
S3_ENDPOINT=http://minio:9000
S3_BUCKET=ishbor-uploads
S3_PUBLIC_BUCKET=ishbor-public
S3_PRIVATE_BUCKET=ishbor-private
S3_ACCESS_KEY=              # MinIO service account
S3_SECRET_KEY=
S3_REGION=us-east-1         # MinIO default
```

### Payments

```bash
PAYME_MERCHANT_ID=
PAYME_KEY=
PAYME_TEST=false
HUMO_MERCHANT_ID=
HUMO_API_KEY=
HUMO_WEBHOOK_SECRET=
UZCARD_MERCHANT_ID=
UZCARD_API_KEY=
FX_USD_UZS_SOURCE=cbu
```

### Email (Resend / Postmark)

```bash
EMAIL_PROVIDER=resend         # resend | postmark
RESEND_API_KEY=
POSTMARK_SERVER_TOKEN=
EMAIL_FROM=noreply@ishbor.uz
EMAIL_FROM_NAME=Ishbor
```

### SMS (Eskiz)

```bash
ESKIZ_EMAIL=
ESKIZ_PASSWORD=
ESKIZ_SENDER=4546             # Registered sender ID
SMS_ENABLED=true
```

### Monitoring

```bash
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
GRAFANA_PASSWORD=
PROMETHEUS_ENABLED=true
```

### Feature flags

```bash
API_MODE=remote               # remote | local (emergency fallback)
ENABLE_WEBSOCKET=true
ENABLE_PAYME=true
ENABLE_HUMO_DIRECT=false
ALLOW_DEMO_AUTH=false
```

### AI (server-only)

```bash
OPENAI_API_KEY=               # Never in VITE_*
OPENAI_MODEL=gpt-4o-mini
```

---

## 4. .env.example (committed)

```bash
# Copy to .env and fill values — NEVER commit .env
APP_ENV=local
DEBUG=true
DATABASE_URL=postgresql://ishbor:changeme@localhost:5432/ishbor
REDIS_URL=redis://localhost:6379/0
SESSION_SECRET=change-me-in-production
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=ishbor-uploads
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
EMAIL_PROVIDER=resend
RESEND_API_KEY=
ESKIZ_EMAIL=
ESKIZ_PASSWORD=
PAYME_MERCHANT_ID=
PAYME_KEY=
PAYME_TEST=true
```

---

## 5. Environment promotion flow

```
Developer local (.env.local)
    → PR merge to main
    → CI deploy staging (staging .env on VPS)
    → Manual QA + smoke tests
    → Tag v* or manual deploy
    → Production (.env on prod VPS)
```

Config diff reviewed in deploy PR checklist. New variables added to all three `.env` files simultaneously.

---

## 6. Frontend environment

Only public values in build:

| Variable | Example | Secret? |
|----------|---------|---------|
| `VITE_API_URL` | https://api.ishbor.uz | No |
| `VITE_CDN_URL` | https://cdn.ishbor.uz | No |
| `VITE_SENTRY_DSN` | https://... | Public DSN OK |
| `VITE_APP_ENV` | production | No |

**Never:** `VITE_DATABASE_URL`, `VITE_PAYME_KEY`, `VITE_SESSION_SECRET`.

---

## 7. Runtime config table (optional P2)

For toggles without redeploy:

```sql
CREATE TABLE system_config (
  key varchar(100) PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);
```

Admin `/admin/system` reads/writes non-secret toggles. Secrets remain in `.env` only.

---

## 8. Validation on startup

FastAPI startup checks:

```python
REQUIRED_ENV = ["DATABASE_URL", "REDIS_URL", "SESSION_SECRET", "S3_ENDPOINT"]
# Fail fast if missing in production
# Warn if PAYME_KEY missing when ENABLE_PAYME=true
```

Prevents silent misconfiguration deploys.

---

## 9. Related documents

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [CI_CD_PIPELINE.md](./CI_CD_PIPELINE.md)
- [../security/SECURITY_ARCHITECTURE.md](../security/SECURITY_ARCHITECTURE.md)

---

*Three isolated environments with separate databases and secrets. `.env` on VPS is the sole source of application secrets — not git, not client bundle.*
