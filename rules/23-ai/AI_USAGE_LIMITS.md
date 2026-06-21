# AI_USAGE_LIMITS.md

**Ishbor marketplace — AI subscription, credits, and usage gating**  
**Table:** `ai_usage_logs` · **Store (demo):** `subscription-store.ts`, `credits-store.ts`

---

## 1. Purpose

AI tools have real per-token cost. Ishbor gates usage by **subscription tier** and optional **AI credits** to:

- Protect unit economics (5% platform fee does not subsidize unlimited LLM)
- Prevent abuse and prompt injection spam
- Provide upgrade path (free → pro → elite)
- Audit consumption for billing and moderation

---

## 2. Database schema

From [DATABASE_SCHEMA.md](../11-backend/DATABASE_SCHEMA.md) §13.1:

### `ai_usage_logs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `tool` | enum | See §3 |
| `tokens_in` | integer | Prompt tokens |
| `tokens_out` | integer | Completion tokens |
| `created_at` | timestamptz | UTC |

### Tool enum values

| DB value | Route |
|----------|-------|
| `proposal_assistant` | `/ai/proposal-assistant` |
| `project_generator` | `/ai/project-generator` |
| `portfolio_optimizer` | `/ai/portfolio-optimizer` |
| `trust_coach` | `/ai/trust-coach` |
| `onboarding` | `/ai/onboarding` |

**Note:** Formula-based tools (matching, opportunity score) are **not** logged — no LLM cost.

### Future columns (migration)

| Column | Purpose |
|--------|---------|
| `prompt_version` | PROMPT_LIBRARY version |
| `provider` | openai \| anthropic \| rules_fallback |
| `latency_ms` | Observability |
| `flagged` | Moderation result |
| `credits_charged` | UZS credit deduction |

---

## 3. Subscription tier limits

Aligned with `subscription-store.ts` PLANS and PROJECT_BIBLE §10:

### Monthly AI request quotas

| Plan | Price (UZS/mo) | AI requests/month | Tokens/month (cap) | Notes |
|------|----------------|-------------------|---------------------|-------|
| **free** (Bepul) | 0 | 20 | 50,000 | Basic tools only |
| **pro** | 99,000 | 200 | 500,000 | All tools |
| **elite** | 249,000 | Unlimited* | 2,000,000 | Fair use policy |

*Unlimited = soft cap 1,000 requests/month, then throttle to 50/day.

### Per-tool daily limits (free tier)

| Tool | Free/day | Pro/day | Elite/day |
|------|----------|---------|-----------|
| proposal-assistant | 3 | 30 | 100 |
| project-generator | 3 | 30 | 100 |
| portfolio-optimizer | 2 | 20 | 50 |
| trust-coach | 2 | 20 | 50 |
| onboarding | 5 | 50 | 100 |

### Tool access by plan

| Tool | Free | Pro | Elite |
|------|------|-----|-------|
| onboarding | ✅ | ✅ | ✅ |
| trust-coach | ✅ (limited) | ✅ | ✅ |
| portfolio-optimizer | ✅ (limited) | ✅ | ✅ |
| proposal-assistant | ✅ (limited) | ✅ | ✅ |
| project-generator | ❌ | ✅ | ✅ |
| founder insights | ❌ | ❌ | Admin only |

**Rationale:** Project generator is a client-side client tool — gate to paid plans to drive client Pro subscriptions.

---

## 4. Credits system (optional overflow)

When monthly quota exhausted, user may spend **AI credits** (UZS wallet):

| Package | Credits (UZS) | Approx requests |
|---------|---------------|-----------------|
| AI Starter | 10,000 | ~10 proposal generations |
| AI Plus | 50,000 | ~50 |
| AI Pro pack | 200,000 | ~200 |

### Deduction logic

```text
1. Check subscription quota remaining
2. If exhausted, check credits balance
3. Deduct credits_per_tool[tool] on successful completion
4. Log credits_charged in ai_usage_logs
5. If insufficient: 402 with upgrade CTA
```

### Credits per tool (indicative)

| Tool | Credits per use |
|------|-----------------|
| proposal-assistant | 1,000 |
| project-generator | 1,200 |
| portfolio-optimizer | 800 |
| trust-coach | 500 |
| onboarding | 300 |

Adjust based on actual token costs quarterly.

---

## 5. Rate limiting (short-term)

Beyond monthly quotas — Redis sliding window per [RATE_LIMITING.md](../11-backend/security/RATE_LIMITING.md):

| Key pattern | Limit | Window |
|-------------|-------|--------|
| `ai:burst:{user_id}` | 5 requests | 10 seconds |
| `ai:hourly:{user_id}:{tool}` | 20 | 1 hour |
| `ai:ip:{ip}` | 60 | 1 minute |

Nginx additional: `limit_req_zone` on `/api/ai/*`.

---

## 6. Enforcement flow

```text
Request → Auth → Account active?
  → Rate limit OK?
    → Plan allows tool?
      → Monthly quota remaining OR credits sufficient?
        → Execute AI
        → INSERT ai_usage_logs
        → INCREMENT redis quota counter
        → Return response
      → else 402 Payment Required
    → else 403 Forbidden (tool not in plan)
  → else 429 Too Many Requests
```

### HTTP responses

**402 — Quota exhausted**

```json
{
  "detail": "Oylik AI limiti tugadi. Pro rejaga o'ting yoki AI kredit sotib oling.",
  "code": "AI_QUOTA_EXCEEDED",
  "upgrade_url": "/subscription",
  "credits_url": "/wallet"
}
```

**429 — Rate limited**

```json
{
  "detail": "Juda ko'p so'rov. Biroz kuting.",
  "code": "AI_RATE_LIMITED",
  "retry_after": 60
}
```

---

## 7. Usage dashboard (user-facing)

Route: `/settings` → AI usage tab (target)

| Display | Source |
|---------|--------|
| Requests used / limit | `COUNT(ai_usage_logs) WHERE month` |
| Tokens used | `SUM(tokens_in + tokens_out)` |
| Per-tool breakdown | `GROUP BY tool` |
| Reset date | Subscription `renews_at` |

---

## 8. Admin visibility

`/admin/ai` and `/admin/analytics`:

| Metric | Query |
|--------|-------|
| Total AI requests/day | `ai_usage_logs` aggregate |
| Cost estimate | tokens × price per model |
| Top users by usage | GROUP BY user_id LIMIT 20 |
| Flagged outputs | `flagged = true` |
| Tool popularity | GROUP BY tool |

Alert: single user >10,000 tokens/day → abuse review.

---

## 9. Formula-based tools (no gating)

These remain **unlimited** for all authenticated users:

| Feature | Store |
|---------|-------|
| Smart match panel | `ai-matching-store` |
| Opportunity score | `ai-opportunity-store` |
| Smart notifications | `ai-smart-notifications` |
| Hub feature cards | `ai-hub-config` |

Rationale: No external API cost; drives engagement.

---

## 10. Demo / staging overrides

| Environment | Override |
|-------------|----------|
| local | Unlimited (`AI_LIMITS_DISABLED=true`) |
| staging | 10× production limits |
| production | Enforced |

Demo accounts (PROJECT_BIBLE §15): Pro limits in staging only.

---

## 11. Migration from demo

Current demo uses client-side rule engines with **no usage tracking**. Migration steps:

1. Deploy `ai_usage_logs` table
2. Ship `/api/ai/usage` endpoint
3. Add usage widget to `/ai` hub
4. Enable limits with `AI_LIMITS_ENFORCED=false` (shadow mode)
5. Compare shadow denials vs actual for 1 week
6. Enable enforcement `AI_LIMITS_ENFORCED=true`
7. Enable LLM proxy per tool with limits active

---

## 12. Fair use policy (elite)

Elite "unlimited" subject to:

- No automated scraping or reselling outputs
- No shared account abuse
- Platform may throttle >1,000 requests/month to 50/day
- Terms of service violation → AI access suspended

---

## 13. Testing

| Test | Assert |
|------|--------|
| Free user at daily limit | 402/429 |
| Pro user project-generator | 200 |
| Free user project-generator | 403 |
| Credits deduction | Wallet balance decreased |
| Usage log row | tokens > 0 |
| Month rollover | Quota reset |

See [INTEGRATION_TEST_PLAN.md](../22-testing/INTEGRATION_TEST_PLAN.md) §8.

---

## 14. References

- [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md)
- [subscription-store.ts](../../src/lib/subscription-store.ts)
- [PROJECT_BIBLE.md](../00-constitution/PROJECT_BIBLE.md) §10
- [PAYMENT_ARCHITECTURE.md](../11-backend/payments/PAYMENT_ARCHITECTURE.md)

---

*Last updated: 2026-06-20*
