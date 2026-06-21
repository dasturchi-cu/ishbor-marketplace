# AI_ARCHITECTURE.md

**Ishbor marketplace — AI system architecture**  
**Current:** Client-side rule engines · **Target:** FastAPI LLM proxy with SSE streaming

---

## 1. Overview

Ishbor AI serves two categories:

| Category | Examples | LLM required |
|----------|----------|--------------|
| **Assistive tools** | Proposal assistant, project generator, portfolio optimizer, trust coach, onboarding | Target: yes |
| **Computed intelligence** | Smart match, opportunity score, founder insights, smart notifications | No — formula-based |

All user-facing AI routes live under `/ai/*` with `requireAuth` + `AuthGate`. Admin founder insights at `/admin/ai`.

---

## 2. High-level architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React / TanStack Router)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ /ai routes   │  │ ai-* stores  │  │ OpportunityScoreCard   │ │
│  │ (6 tools)    │→ │ (client)     │  │ SmartMatchPanel        │ │
│  └──────┬───────┘  └──────────────┘  └────────────────────────┘ │
│         │ POST /api/ai/{tool}  (target)                         │
└─────────┼───────────────────────────────────────────────────────┘
          │ SSE stream
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  FastAPI (server/ai/)                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ AI Router   │→ │ AIService    │→ │ Provider adapter        │ │
│  │ rate limit  │  │ prompt build │  │ OpenAI / Anthropic      │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
│         │                    │                                  │
│         ▼                    ▼                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ Redis       │    │ ai_usage_logs│    │ Moderation queue │   │
│  │ rate keys   │    │ (PostgreSQL) │    │ (Celery)         │   │
│  └─────────────┘    └──────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Proxy pattern (target)

### Why proxy

| Risk (client-side LLM) | Mitigation (server proxy) |
|------------------------|---------------------------|
| API key exposure | Key in server env only |
| Prompt injection to exfiltrate keys | Server sanitizes input |
| Unbounded token cost | Rate limits + usage logs |
| No audit trail | `ai_usage_logs` per request |
| PII leakage to provider | Redaction layer pre-send |

### Request flow

```text
1. Client: POST /api/ai/proposal-assistant
   Body: { project_slug, options?: { tone, language } }
   Cookie: ishbor_sid

2. Middleware: validate session, account_status=active

3. Rate limiter: Redis key ai:rl:{user_id}:{tool} — see AI_USAGE_LIMITS.md

4. Usage gate: check subscription/credits remaining

5. Context builder:
   - Load project, user profile, skills, trust metrics from DB
   - Never send password, payment details, KYC docs

6. Prompt assembler: PROMPT_LIBRARY.md template + context JSON

7. Provider call: streaming completion

8. SSE to client: event: chunk | event: done | event: error

9. Log: INSERT ai_usage_logs (tokens_in, tokens_out, tool, user_id)

10. Analytics: emit ai_tool_used event
```

### Endpoint contract

| Method | Path | Response |
|--------|------|----------|
| POST | `/api/ai/proposal-assistant` | `text/event-stream` |
| POST | `/api/ai/project-generator` | `text/event-stream` |
| POST | `/api/ai/portfolio-optimizer` | `application/json` (analysis is batch) |
| POST | `/api/ai/trust-coach` | `application/json` |
| POST | `/api/ai/onboarding` | `application/json` |
| GET | `/api/ai/usage` | Remaining quota |

---

## 4. LLM provider strategy

### Primary provider (recommended)

**OpenAI GPT-4o-mini** for cost/latency balance on Uzbek content.

| Tool | Model tier | Rationale |
|------|------------|-----------|
| proposal-assistant | gpt-4o-mini | Long-form text, cost-sensitive |
| project-generator | gpt-4o-mini | Structured JSON output |
| portfolio-optimizer | gpt-4o-mini | Analysis + bullet list |
| trust-coach | gpt-4o-mini | Short recommendations |
| onboarding | gpt-4o-mini | Step personalization |
| admin insights | gpt-4o | Higher quality summaries |

### Fallback provider

**Anthropic Claude 3.5 Haiku** — failover when OpenAI 5xx or rate limited.

```text
Provider chain: OpenAI → Anthropic → rule-based fallback (current client logic)
```

Feature flag: `AI_PROVIDER_PRIMARY`, `AI_PROVIDER_FALLBACK`, `AI_LLM_ENABLED`.

### Environment variables (server-only)

```text
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
AI_LLM_ENABLED=false
AI_MAX_TOKENS_DEFAULT=2048
AI_REQUEST_TIMEOUT_MS=30000
```

**Never** prefix with `VITE_`.

---

## 5. Rate limits

Per [RATE_LIMITING.md](../11-backend/security/RATE_LIMITING.md) + [AI_USAGE_LIMITS.md](./AI_USAGE_LIMITS.md):

| Layer | Mechanism |
|-------|-----------|
| Global | 100 AI requests/min per IP (Nginx) |
| Per user | Redis sliding window per tool |
| Per plan | Monthly token budget |
| Burst | 5 requests/10s per user (anti-abuse) |

Response when limited:

```json
{
  "detail": "AI so'rovlar limiti tugadi. Pro rejaga o'ting yoki ertaga qayta urinib ko'ring.",
  "code": "AI_RATE_LIMITED",
  "retry_after": 3600
}
```

HTTP 429 with `Retry-After` header.

---

## 6. ai-* stores

### Client stores (current implementation)

| Store | Persistence | Sync model |
|-------|-------------|------------|
| `ai-hub-config.ts` | None (computed) | On render |
| `ai-onboarding-wizard.ts` | localStorage step progress | Per user |
| `ai-proposal-assistant.ts` | None | Ephemeral generation |
| `ai-project-generator.ts` | session draft → projects create | `saveAiProjectDraft` |
| `ai-portfolio-optimizer.ts` | None | Computed from profile stores |
| `ai-trust-coach.ts` | None | Computed from growth-metrics |
| `ai-matching-store.ts` | None | Formula on dashboard |
| `ai-opportunity-store.ts` | None | Dashboard card |
| `ai-insights-store.ts` | None | Admin only |
| `ai-smart-notifications.ts` | notifications-store | Side effect on hub visit |

### Target: hybrid model

| Data | Source of truth |
|------|-----------------|
| User profile, projects, portfolio | PostgreSQL via API |
| AI generation output | Ephemeral — not stored unless user saves (proposal, project draft) |
| Usage quotas | PostgreSQL `ai_usage_logs` + Redis cache |
| Onboarding progress | PostgreSQL `user_onboarding_progress` (migrate from localStorage) |

### useSyncExternalStore contract

All AI stores exposing subscriptions must use **stable empty snapshots**:

```text
const EMPTY: readonly Item[] = [];  // module-level constant
// NOT: useSyncExternalStore(() => [], () => [])  ← inline []
```

---

## 7. Context assembly

Server builds context per tool from authorized data only:

### proposal-assistant

| Field | Source |
|-------|--------|
| project.title, description, skills, budget | `projects` table |
| freelancer.skills, completed_jobs, response_rate | `user_profiles`, stats MV |
| client.name | Public fields only |

### project-generator

| Field | Source |
|-------|--------|
| idea, budget, weeks | Request body (validated) |
| category taxonomy | Platform config |
| similar projects (optional) | FTS search, anonymized |

### portfolio-optimizer

| Field | Source |
|-------|--------|
| portfolio items, case studies | `portfolios`, `case_studies` |
| opportunity score components | `ai-opportunity-store` formula |

### trust-coach

| Field | Source |
|-------|--------|
| trust score breakdown | `growth-metrics.ts` server port |
| missing profile sections | Profile completeness check |
| verification status | `verifications` table |

---

## 8. Moderation pipeline

| Step | Action |
|------|--------|
| Input scan | Block prompt injection patterns, external URLs |
| Output scan | OpenAI moderation API or local keyword list |
| Log retention | 90 days, PII redacted |
| Flagged content | Celery job → admin moderation queue |
| User report | Link generation output to `ai_usage_logs.id` |

---

## 9. Feature flags

| Flag | Default | Description |
|------|---------|-------------|
| `AI_LLM_ENABLED` | false | Master switch |
| `AI_TOOL_PROPOSAL` | false | Per-tool rollout |
| `AI_TOOL_PROJECT` | false | |
| `AI_TOOL_PORTFOLIO` | false | |
| `AI_TOOL_TRUST` | false | |
| `AI_TOOL_ONBOARDING` | false | |
| `AI_FALLBACK_RULES` | true | Use rule-based when LLM off/fails |

Rollout: internal (admin) → beta users → 10% → 100%.

---

## 10. Error handling

| Error | Client UX |
|-------|-----------|
| Provider timeout | Toast: *"AI vaqtincha javob bermadi. Qayta urinib ko'ring."* + rule fallback |
| Rate limited | Inline banner with upgrade CTA |
| Invalid input | Field validation, O'zbek message |
| Account suspended | 403, redirect support |

---

## 11. Observability

| Metric | Alert |
|--------|-------|
| `ai_requests_total{tool, status}` | — |
| `ai_tokens_total{tool}` | Daily budget |
| `ai_latency_seconds{p95}` | >5s |
| `ai_provider_errors_total` | >10/min |
| `ai_fallback_total` | Spike = provider issue |

Dashboard: Grafana panel in MONITORING_ARCHITECTURE.md.

---

## 12. Current vs target summary

| Aspect | Current (demo) | Target (production) |
|--------|----------------|---------------------|
| Generation | Client rule-based | Server LLM proxy |
| API keys | N/A | Server env |
| Streaming | Instant (sync) | SSE |
| Usage tracking | None | `ai_usage_logs` |
| Rate limits | Client rate-limit.ts demo | Redis + subscription |
| Matching | Client formula | Server cron + cache |

---

## 13. References

- [AI_TOOLS_SPEC.md](./AI_TOOLS_SPEC.md)
- [PROMPT_LIBRARY.md](./PROMPT_LIBRARY.md)
- [AI_USAGE_LIMITS.md](./AI_USAGE_LIMITS.md)
- [AI_TOOLS.md](../13-domains/AI_TOOLS.md)
- [DATABASE_SCHEMA.md](../11-backend/DATABASE_SCHEMA.md) §13

---

*Last updated: 2026-06-20*
