# INFRASTRUCTURE_ARCHITECTURE.md

**Region primary:** AWS eu-central-1 or Neon EU (latency to Central Asia via CDN)  
**CDN/WAF:** Cloudflare

---

## 1. Environment topology

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │  DNS + WAF + CDN│
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Web App  │  │ API/WS   │  │ Workers  │
        │ (Nitro)  │  │ (Nitro)  │  │ (BullMQ) │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │             │             │
             └─────────────┼─────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     ▼                     ▼                     ▼
┌─────────┐          ┌──────────┐          ┌──────────┐
│  Neon   │          │  Redis   │          │ R2 / S3  │
│ Postgres│          │ Upstash  │          │ Storage  │
└─────────┘          └──────────┘          └──────────┘
```

---

## 2. Environments

| Env | Purpose | URL |
|-----|---------|-----|
| local | Dev | localhost:5173 / localhost:3000 |
| staging | QA + demo | staging.ishbor.uz |
| production | Live | ishbor.uz / api.ishbor.uz |

**Data isolation:** Separate Neon branches/databases per environment.

---

## 3. Service inventory

| Service | Provider | Tier (beta) |
|---------|----------|-------------|
| PostgreSQL | Neon | Scale — autoscaling compute |
| Redis | Upstash | Pay-as-you-go |
| Object storage | Cloudflare R2 | Standard |
| Email | Resend | Free → Pro |
| Error tracking | Sentry | Team |
| Payments | Payme | Merchant sandbox → prod |
| AI | OpenAI API | Usage-based |
| CI/CD | GitHub Actions | Included |

---

## 4. Network

| Rule | Detail |
|------|--------|
| API | Public HTTPS only |
| Database | Private — Neon IP allowlist + SSL |
| Redis | TLS required |
| Workers | Same VPC/network as API (or serverless) |
| Admin | Same origin — no separate admin domain v1 |

---

## 5. DNS

| Record | Target |
|--------|--------|
| ishbor.uz | Cloudflare → Nitro frontend |
| api.ishbor.uz | Cloudflare → API load balancer |
| cdn.ishbor.uz | R2 public bucket |
| staging.ishbor.uz | Staging deployment |

---

## 6. Secrets (per environment)

```
DATABASE_URL
REDIS_URL
SESSION_SECRET
OAUTH_GOOGLE_CLIENT_ID
OAUTH_GOOGLE_CLIENT_SECRET
S3_ENDPOINT / S3_BUCKET / S3_ACCESS_KEY / S3_SECRET_KEY
RESEND_API_KEY
PAYME_MERCHANT_ID / PAYME_KEY
OPENAI_API_KEY
SENTRY_DSN
```

Managed via GitHub Secrets → injected at deploy. Production: AWS Secrets Manager or Doppler (P2).

---

## 7. Compute options

| Option | Pros | Choice |
|--------|------|--------|
| Fly.io | Global edge, WS support | **Recommended for API+WS** |
| Railway | Simple | Staging |
| Vercel/Nitro | Existing stack | Frontend SSR |
| AWS ECS | Full control | Scale phase |

**Decision:** TanStack Start frontend on existing Nitro deploy; API+Workers on Fly.io machines; Neon serverless Postgres.

---

## 8. Backup & DR

| Asset | Backup | RPO | RTO |
|-------|--------|-----|-----|
| PostgreSQL | Neon PITR + daily snapshot | 1 min | 1 hr |
| R2 | Cross-region replication (P2) | 24 hr | 4 hr |
| Redis | Ephemeral — rebuild from DB | N/A | 15 min |

---

## 9. Cost estimate (beta — 1000 users)

| Item | ~USD/mo |
|------|---------|
| Neon | $25 |
| Upstash Redis | $10 |
| Fly.io (2 instances) | $30 |
| R2 | $5 |
| Resend | $0-20 |
| Cloudflare | $0 (Pro optional) |
| Sentry | $0 |
| **Total** | **~$70-100/mo** |

---

*Infrastructure supports DEPLOYMENT_ARCHITECTURE.md pipelines.*
