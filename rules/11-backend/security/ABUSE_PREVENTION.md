# ABUSE_PREVENTION.md

**Purpose:** Detect, limit, and respond to marketplace abuse patterns on Ishbor  
**Stack:** Nginx (edge) + FastAPI + Redis rate limits + PostgreSQL audit  
**Scope:** Auth brute force, checkout abuse, scraping, account farming, payment fraud

---

## 1. Abuse taxonomy

Ishbor faces abuse across four trust zones:

| Category | Examples | Primary impact |
|----------|----------|----------------|
| **Authentication** | Credential stuffing, OTP flooding, session hijack attempts | Account takeover |
| **Financial** | Checkout spam, wallet drain attempts, webhook replay | Revenue loss, gateway cost |
| **Marketplace** | Fake listings, proposal spam, review manipulation | Trust erosion, UX degradation |
| **Platform** | API scraping, DDoS, WebSocket flood | Availability, infra cost |

Each category maps to layered controls — nginx first, Redis granular limits second, business rules third.

---

## 2. Defense architecture

```
Internet request
    │
    ▼
┌─────────────────┐
│ UFW + fail2ban  │  SSH brute force, repeated nginx 401
└────────┬────────┘
         ▼
┌─────────────────┐
│ Nginx limit_req │  IP flood — auth 5/min, checkout 10/min, general 30/s
└────────┬────────┘
         ▼
┌─────────────────┐
│ FastAPI         │  Per-user/per-phone Redis sliding windows
│ RateLimitMiddleware
└────────┬────────┘
         ▼
┌─────────────────┐
│ Business rules  │  Subscription quotas, trust scores, admin moderation
└─────────────────┘
```

Never disable rate limits in production. Health endpoints (`/health`, `/health/ready`) are exempt.

---

## 3. Authentication abuse

### 3.1 Brute force login

| Layer | Control | Limit |
|-------|---------|-------|
| Nginx | `api_auth` zone | 5 req/min per IP, burst 10 |
| Redis | `auth.login` | 5 req / 5 min per IP |
| Redis | Account lockout | 15 min after 10 failures per user |
| Client UX | `rate-limit.ts` mirror | 5 attempts / 15 min per email (UX only — not security) |

**Server is authoritative.** Client-side `localStorage` throttling in `src/lib/rate-limit.ts` provides early feedback:

- `MAX_ATTEMPTS = 5`
- `WINDOW_MS = 15 * 60 * 1000` (15 minutes)
- Message: `"Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring."`
- Per-browser throttle via `checkClientLoginRateLimit()` — separate from per-email bucket

On lockout, return HTTP 429 with `Retry-After` header.

### 3.2 OTP abuse

| Endpoint | Limit | Key |
|----------|-------|-----|
| POST `/auth/otp/send` | 3 / hour | phone |
| POST `/auth/otp/send` | 10 / day | phone |
| POST `/auth/otp/verify` | 5 attempts / code | phone |
| POST `/auth/register` | 3 / hour | IP |

OTP codes: 6 digits, SHA-256 hashed, 10 min TTL, invalidated after 5 failed attempts.

Eskiz SMS cost control — alert if OTP send rate exceeds 500/hour platform-wide.

### 3.3 Password reset flooding

| Endpoint | Limit |
|----------|-------|
| POST `/auth/forgot-password` | 3 / hour per email |
| POST `/auth/forgot-password` | 10 / hour per IP |

Prevents email provider blocklisting and harassment via reset emails.

---

## 4. Financial abuse

### 4.1 Checkout and wallet

| Endpoint | Limit | Rationale |
|----------|-------|-----------|
| POST `/checkout/confirm` | 5 / hour per user | Prevent wallet drain attacks |
| POST `/wallet/deposit` | 10 / hour per user | Gateway cost control |
| POST `/wallet/withdraw` | 5 / hour per user | Fraud prevention |
| POST `/escrow/*/release` | 20 / hour per user | Normal usage headroom |

Financial limits cannot be bypassed by admin without immutable audit log entry.

### 4.2 Payment webhook abuse

Webhooks excluded from user rate limits — protected instead by:

1. Provider IP allowlist in nginx (`allow PAYME_IP; deny all`)
2. HMAC signature verification in FastAPI
3. Idempotency — duplicate webhooks are no-ops

**Flood from valid IP:** P0 alert, temporary IP block, contact gateway provider.

### 4.3 Withdrawal fraud signals

| Signal | Action |
|--------|--------|
| Withdrawal > daily cap | Reject with Uzbek error |
| Withdrawal > 5000 USD equivalent | P1 alert to finance_admin |
| New account + immediate withdrawal | Flag for manual review |
| Multiple failed withdrawal attempts | Rate limit + audit log |

---

## 5. Marketplace abuse patterns

### 5.1 Fake listings and account farming

| Pattern | Detection | Response |
|---------|-----------|----------|
| Bulk project/service creation | >10 creates / hour per user | Rate limit + moderation queue |
| Duplicate content across accounts | Content hash similarity | Auto-flag → `/admin/moderation` |
| Unverified email + high activity | Trust score < threshold | Require email/phone verification |
| Disposable email domains | Blocklist check on register | Reject registration |

### 5.2 Proposal and application spam

Enforced via subscription plan limits — see [SPAM_PREVENTION.md](./SPAM_PREVENTION.md).

Server-side enforcement required — client `subscription-store.ts` limits are UX hints only until FastAPI migration.

### 5.3 Review and trust manipulation

| Control | Detail |
|---------|--------|
| Reviews only after completed order | Entity guard |
| One review per order participant pair | DB unique constraint |
| Admin moderation queue | `/admin/moderation` for reported content |
| Trust score decay | Inactivity reduces ranking boost |

### 5.4 Message harassment

| Control | Limit |
|---------|-------|
| New conversation starts | 20 / hour per user |
| Messages per thread | 60 / hour per user |
| Identical message body repeat | Block after 3 in 5 min |
| Block user | Immediate — no messages either direction |

---

## 6. Platform-level abuse

### 6.1 API scraping

| Control | Detail |
|---------|-------|
| nginx general rate limit | 30 req/s per IP |
| Pagination max | 100 items per page |
| Aggressive crawler detection | User-Agent + request pattern heuristics |
| Authenticated scraping | Per-user limits stricter than guest |

Consider Cloudflare proxy (P2) for DDoS and bot management — origin cert on nginx.

### 6.2 DDoS and resource exhaustion

| Vector | Mitigation |
|--------|------------|
| HTTP flood | nginx rate limits + UFW |
| WebSocket connection flood | Max 5 connections per IP; app-level ping timeout |
| Large file upload | Presign size limits per purpose |
| PostgreSQL query bomb | Query timeouts, pagination enforced |
| Redis memory exhaustion | `maxmemory` + LRU eviction policy |

### 6.3 Admin panel abuse

| Control | Detail |
|---------|-------|
| Admin actions rate limit | 100 / hour per admin user |
| All mutations audit logged | Append-only `audit_logs` |
| Dual control for large refunds | P1 roadmap — finance_admin + super_admin |
| Session limit | Same 5 concurrent sessions as regular users |

---

## 7. Redis rate limit implementation

### Key format

```
ratelimit:{endpoint}:{key_type}:{key_value}
# Example: ratelimit:auth.login:ip:203.0.113.42
```

Sliding window via Redis `INCR` with TTL or sorted sets.

### Response on exceed

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Juda ko'p so'rov. Biroz kutib turing.",
  "retry_after": 300
}
```

Headers: `Retry-After`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

### Bypass rules

| Caller | Bypass |
|--------|--------|
| `/health`, `/health/ready` | Yes |
| Internal Celery tasks | Direct service calls — no HTTP |
| Admin routes | No bypass — same limits |
| Load test | Staging only with `X-Load-Test-Secret` header |

---

## 8. Trust score integration (P1)

Abuse signals feed trust score adjustments:

| Event | Score impact |
|-------|--------------|
| Rate limit exceeded (auth) | -5 |
| Moderation rejection | -20 |
| Completed order (positive) | +2 |
| Verified identity | +15 |
| Dispute lost | -30 |

Low trust score effects: reduced search ranking, stricter rate limits, manual review on withdrawals.

---

## 9. Monitoring and alerts

| Metric | Alert | Severity |
|--------|-------|----------|
| `rate_limit_exceeded_total{endpoint="auth.login"}` | Spike >100/5min | P1 — possible brute force |
| 429 rate on checkout | >5% for 5 min | P1 — attack or UX issue |
| OTP send rate | >500/hour platform | P2 — SMS cost |
| Webhook signature failures | >10/min | P0 |
| Failed login rate | >20% / 5 min | P1 |
| New registrations spike | >3× baseline / hour | P2 — bot farm |

Prometheus scrape from FastAPI `/metrics` — internal network only.

---

## 10. Response playbook

| Severity | Example | Immediate action |
|----------|---------|------------------|
| P0 | Webhook forgery attempt, payment anomaly | Freeze withdrawals, rotate keys, notify founder |
| P1 | Auth brute force spike | Enable stricter nginx zone, review fail2ban bans |
| P2 | Proposal spam wave | Tighten application limits, moderation sweep |
| P3 | Single abusive user | Suspend account via `/admin/users`, audit review |

Document incidents in `rules/99-reports/incidents/`. See [../../21-observability/INCIDENT_RESPONSE.md](../../21-observability/INCIDENT_RESPONSE.md).

---

## 11. Staging validation

Before production launch, verify on staging:

1. Login 6 times rapidly → 429 on 6th attempt
2. OTP send 4 times in 1 hour → 429 on 4th
3. Checkout confirm 6 times in 1 hour → 429 on 6th
4. Free plan proposal limit → error with link to `/pricing`
5. Webhook from non-allowlisted IP → 403 at nginx

---

## 12. Related documents

- [RATE_LIMITING.md](./RATE_LIMITING.md)
- [SPAM_PREVENTION.md](./SPAM_PREVENTION.md)
- [ACCOUNT_PROTECTION.md](./ACCOUNT_PROTECTION.md)
- [THREAT_MODEL.md](./THREAT_MODEL.md)
- [../infrastructure/NGINX_ARCHITECTURE.md](../infrastructure/NGINX_ARCHITECTURE.md)
- [../../21-observability/ALERTING_RULES.md](../../21-observability/ALERTING_RULES.md)

---

*Abuse prevention is enforced at nginx (IP flood), Redis (per-user granularity), and business rules (subscription quotas). Client-side limits are UX only — server is authoritative.*
