# SENTRY_GUIDE.md

**Purpose:** Error tracking and performance monitoring for Ishbor FastAPI + React stack  
**Deployment:** Sentry SaaS (sentry.io) — no self-hosted Sentry on VPS  
**Stack:** Ubuntu VPS · Docker · Nginx · FastAPI · TanStack Start

---

## 1. Why Sentry

Ishbor handles financial transactions, escrow, and authentication — silent errors are unacceptable.

| Capability | Benefit |
|------------|---------|
| Exception grouping | Dedupe noise, focus on regressions |
| Release tracking | Tie errors to git SHA / Docker tag |
| Performance traces | Find slow checkout and auth paths |
| Breadcrumbs | Reconstruct user actions before crash |
| Alerts | P0/P1 routing to Telegram via integration |

Sentry complements Prometheus (metrics) and structured logs (audit trail).

---

## 2. Project structure

Create two Sentry projects under organization `ishbor`:

| Project | Platform | DSN env var |
|---------|----------|-------------|
| `ishbor-api` | Python / FastAPI | `SENTRY_DSN` |
| `ishbor-web` | JavaScript / React | `VITE_SENTRY_DSN` |

Separate projects isolate frontend noise from backend financial errors.

Environments: `local`, `staging`, `production` — set via `SENTRY_ENVIRONMENT` / `VITE_SENTRY_ENVIRONMENT`.

---

## 3. FastAPI integration

### 3.1 Dependencies

```txt
sentry-sdk[fastapi]>=2.0.0
```

### 3.2 Initialization (server startup)

Configure before FastAPI app mounts routes:

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

def init_sentry(settings):
    if not settings.SENTRY_DSN:
        return

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.APP_ENV,
        release=settings.IMAGE_TAG,          # git SHA from CI
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            StarletteIntegration(),
            RedisIntegration(),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=0.1 if settings.APP_ENV == "production" else 1.0,
        profiles_sample_rate=0.1 if settings.APP_ENV == "production" else 0.0,
        send_default_pii=False,              # Critical — see PII section
        before_send=scrub_event,
        before_send_transaction=scrub_transaction,
    )
```

### 3.3 Request context middleware

Attach correlation IDs to every Sentry event:

```python
@app.middleware("http")
async def sentry_context(request, call_next):
    request_id = request.headers.get("X-Request-Id", str(uuid4()))
    sentry_sdk.set_tag("request_id", request_id)
    sentry_sdk.set_tag("path", request.url.path)

    with sentry_sdk.configure_scope() as scope:
        scope.set_tag("request_id", request_id)
        if session := request.state.auth:
            scope.set_user({"id": str(session.user_id)})  # UUID only — no email

    return await call_next(request)
```

### 3.4 Critical flow tags

Tag transactions for high-value paths:

| Tag value | Routes |
|-----------|--------|
| `checkout` | `/v1/checkout/*` |
| `escrow` | `/v1/escrow/*` |
| `auth` | `/v1/auth/*` |
| `payment_webhook` | `/v1/webhooks/*` |
| `wallet` | `/v1/wallet/*` |

Enables Sentry alert rules filtered by tag.

---

## 4. React / TanStack Start integration

### 4.1 Dependencies

```json
"@sentry/react": "^8.0.0"
```

### 4.2 Client initialization

In app entry (replaces legacy error capture utilities):

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? "development",
  release: import.meta.env.VITE_IMAGE_TAG,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: false,
  beforeSend(event) {
    return scrubClientEvent(event);
  },
});
```

### 4.3 Error boundary

Wrap root route with Sentry error boundary — maps to existing `__root.tsx` pattern:

```typescript
const SentryRouter = Sentry.withSentryRouting(RouterProvider);
```

### 4.4 API error interceptor

On 5xx responses from `api-client.ts`:

```typescript
if (response.status >= 500) {
  Sentry.captureException(new ApiError(response), {
    tags: { request_id: response.headers.get("x-request-id") },
    extra: { url, method, status: response.status },
  });
}
```

---

## 5. PII scrubbing (mandatory)

**Rule:** Never send passwords, session tokens, OTP codes, full phone numbers, card data, or KYC content to Sentry.

### 5.1 Server scrub function

```python
SENSITIVE_KEYS = {
    "password", "token", "secret", "authorization",
    "cookie", "otp", "code", "csrf_token",
    "card", "pan", "cvv", "totp",
}

def scrub_event(event, hint):
    # Remove request cookies and auth headers
    if request := event.get("request"):
        request.pop("cookies", None)
        headers = request.get("headers", {})
        for h in ("Authorization", "Cookie", "X-CSRF-Token"):
            headers.pop(h, None)

    # Scrub exception local variables
    # Hash email if present in extra data
    if extra := event.get("extra"):
        if email := extra.get("email"):
            extra["email"] = hash_email(email)

    return event
```

### 5.2 Email hashing

Store only SHA-256 prefix for correlation:

```python
def hash_email(email: str) -> str:
    return "email:" + hashlib.sha256(email.lower().encode()).hexdigest()[:16]
```

### 5.3 Sentry server-side data scrubbing

Enable in Sentry project settings → Security & Privacy:

| Rule | Action |
|------|--------|
| `$password`, `$secret`, `$token` | Remove |
| `$email` | Hash (additional layer) |
| `$ip_address` | Remove for GDPR-style compliance |
| Credit card patterns | Scrub |

### 5.4 Client scrubbing

```typescript
function scrubClientEvent(event: Sentry.Event): Sentry.Event | null {
  // Strip localStorage keys from breadcrumbs
  // Never attach session cookie values
  // Mask form fields: password, card, otp
  return event;
}
```

Session Replay: `maskAllText: true`, `blockAllMedia: true` — KYC uploads never recorded.

---

## 6. Release and deploy tracking

CI sets `IMAGE_TAG` to git SHA on deploy:

```bash
export IMAGE_TAG=$(git rev-parse --short HEAD)
docker compose up -d --build
```

Sentry release creation (CI step):

```bash
sentry-cli releases new "$IMAGE_TAG"
sentry-cli releases set-commits "$IMAGE_TAG" --auto
sentry-cli releases finalize "$IMAGE_TAG"
sentry-cli releases deploys "$IMAGE_TAG" new -e production
```

Enables regression detection: "this error first appeared in release abc123".

---

## 7. Sampling strategy

| Environment | Error sample | Performance sample | Replay |
|-------------|--------------|-------------------|--------|
| local | 100% (if DSN set) | 100% | Off |
| staging | 100% | 100% | 10% |
| production | 100% | 10% | 1% session, 100% on error |

Increase production trace sample temporarily during checkout debugging — revert after.

---

## 8. Alert configuration

Create Sentry alerts (supplement Prometheus — see ALERTING_RULES.md):

| Alert | Condition | Action |
|-------|-----------|--------|
| Checkout errors | `tag:checkout`, new issue | Telegram P0 |
| Webhook failures | `tag:payment_webhook`, >5 events/5min | Telegram P0 |
| Auth spike | `tag:auth`, >50 events/5min | Telegram P1 |
| New release regression | Issue first seen in latest release | Slack |
| Unhandled 5xx | Level error, env production | Telegram P1 |

Integrate Sentry → Telegram via webhook or official integration.

---

## 9. What to capture vs log

| Event | Sentry | Structured log |
|-------|--------|----------------|
| Unhandled exception | Yes | Yes with stack |
| Expected 4xx (validation) | No | Debug level |
| Failed login | No (unless bug) | Warning + audit |
| Escrow mutation failure | Yes | Yes + audit_logs |
| Rate limit 429 | No | Debug |
| Payment webhook signature fail | Yes | Yes P0 |

---

## 10. Local development

Leave `SENTRY_DSN` empty locally — errors go to console only.

Optional: use Sentry dev DSN with `environment=local` for integration testing.

Never use production DSN in local `.env` — pollutes production error stream.

---

## 11. Verification checklist

- [ ] FastAPI test exception appears in `ishbor-api` project
- [ ] React error boundary test appears in `ishbor-web` project
- [ ] Cookie header not visible in Sentry event request data
- [ ] User ID in Sentry is UUID — not email
- [ ] Release tag matches Docker `IMAGE_TAG`
- [ ] Checkout path tagged correctly
- [ ] Session Replay masks all text
- [ ] Staging and production are separate environments in Sentry

---

## 12. Related documents

- [ALERTING_RULES.md](./ALERTING_RULES.md)
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
- [../11-backend/MONITORING_ARCHITECTURE.md](../11-backend/MONITORING_ARCHITECTURE.md)
- [../11-backend/infrastructure/ENVIRONMENT_SETUP.md](../11-backend/infrastructure/ENVIRONMENT_SETUP.md)
- [../11-backend/infrastructure/LOGGING_ARCHITECTURE.md](../11-backend/infrastructure/LOGGING_ARCHITECTURE.md)

---

*Sentry for FastAPI + React with PII scrubbing, release tracking via IMAGE_TAG, and separate api/web projects. sendDefaultPii=false always.*
