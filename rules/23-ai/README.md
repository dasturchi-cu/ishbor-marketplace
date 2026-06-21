# Ishbor AI Documentation

**Status:** UI live (rule-based stubs) → Target: server-side LLM proxy  
**Routes:** `/ai/*` · **Domain spec:** [AI_TOOLS.md](../13-domains/AI_TOOLS.md)  
**Product law:** [PROJECT_BIBLE.md](../00-constitution/PROJECT_BIBLE.md) §4, §11

---

## Purpose

Ishbor AI differentiates the Central Asia freelance marketplace through **role-aware assistants** that help clients post better projects, freelancers win proposals, and both sides build trust. AI is a growth lever — not a gimmick — tied to escrow conversion and repeat hire.

Current state (2026-06):

- **LIVE UI** at `/ai` with client-side rule-based generation
- **No external LLM API** wired in production code
- Formula-based matching (`ai-matching-store`, `ai-opportunity-store`) runs without LLM

Target state:

- OpenAI or Anthropic via **server-only proxy**
- Rate limits by subscription tier
- Usage logged to `ai_usage_logs` for billing and moderation

---

## Reading order

| # | Document | Audience |
|---|----------|----------|
| 1 | [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md) | Full-stack, backend |
| 2 | [AI_TOOLS_SPEC.md](./AI_TOOLS_SPEC.md) | Product, frontend |
| 3 | [PROMPT_LIBRARY.md](./PROMPT_LIBRARY.md) | Backend, moderation |
| 4 | [AI_USAGE_LIMITS.md](./AI_USAGE_LIMITS.md) | Product, billing |

---

## Route map

| Route | Module | Auth | Roles |
|-------|--------|------|-------|
| `/ai` | `ai-hub-config` | requireAuth | client, freelancer |
| `/ai/onboarding` | `ai-onboarding-wizard` | requireAuth | all |
| `/ai/proposal-assistant` | `ai-proposal-assistant` | requireAuth | freelancer |
| `/ai/project-generator` | `ai-project-generator` | requireAuth | client |
| `/ai/portfolio-optimizer` | `ai-portfolio-optimizer` | requireAuth | freelancer |
| `/ai/trust-coach` | `ai-trust-coach` | requireAuth | freelancer |
| `/admin/ai` | `ai-insights-store` | requireAdmin | founder/admin |

Layout: `src/routes/ai.tsx` — `AuthGate`, sub-nav (Boshlash, Loyiha, Taklif, Portfel, Ishonch).

---

## Store inventory

### LLM tools (target proxy)

| Store | Function |
|-------|----------|
| `ai-proposal-assistant.ts` | `generateProposalForProject` |
| `ai-project-generator.ts` | `generateProjectFromIdea`, `saveAiProjectDraft` |
| `ai-portfolio-optimizer.ts` | `analyzePortfolio` |
| `ai-trust-coach.ts` | `getTrustCoachInsights` |
| `ai-onboarding-wizard.ts` | `enrichOnboardingPlan`, `markOnboardingStepDone` |
| `ai-hub-config.ts` | `getAiHubFeatures`, `getAiHubHeadline` |

### Formula-based (no LLM)

| Store | Function |
|-------|----------|
| `ai-matching-store.ts` | `matchProjectsForFreelancer`, `matchFreelancersForClient` |
| `ai-opportunity-store.ts` | `computeOpportunityScore` |
| `ai-insights-store.ts` | `computeFounderAiInsights` (admin) |
| `ai-smart-notifications.ts` | `syncSmartNotifications` |

---

## Security principles

1. **API keys server-only** — never in `VITE_*` or client bundles
2. **Stream via SSE** — `POST /api/ai/{tool}` → `text/event-stream`
3. **PII redaction** in `ai_usage_logs` before persistence
4. **Auth required** — all `/ai/*` routes use `beforeLoad: requireAuth`
5. **Rate limits** — Redis sliding window per user per tool

---

## Analytics

Track `ai_tool_used` events:

| Field | Value |
|-------|-------|
| `tool_id` | proposal_assistant, project_generator, etc. |
| `user_id` | Authenticated user |
| `role` | active_role at time of use |
| `outcome` | success, rate_limited, error |

Emitter: `analytics-events-store` → future server pipeline.

---

## UX rules

Per FEATURE_COMPLETION_POLICY.md:

- AI tools must produce **actionable output** with CTA to next step
- No "coming soon" — current rule-based output is real value
- Hub card shows status: `ready`, `progress`, `action` based on user state
- Copy: O'zbek, primary color `#2563EB`
- Disclaimer on hub: *"Qoidalar asosidagi AI — haqiqiy platforma ma'lumotlari"*

---

## Migration path

| Phase | Deliverable |
|-------|-------------|
| 1 (current) | Rule-based client generation |
| 2 | FastAPI proxy + feature flag `AI_LLM_ENABLED` |
| 3 | Per-tool LLM rollout (proposal → project → portfolio) |
| 4 | Usage billing via `ai_usage_logs` + subscription gates |
| 5 | Admin insights LLM summaries |

---

## Related docs

| Doc | Link |
|-----|------|
| Domain spec | [AI_TOOLS.md](../13-domains/AI_TOOLS.md) |
| Database | [DATABASE_SCHEMA.md](../11-backend/DATABASE_SCHEMA.md) §13.1 |
| Rate limits | [RATE_LIMITING.md](../11-backend/security/RATE_LIMITING.md) |
| Testing | [E2E_TEST_PLAN.md](../22-testing/E2E_TEST_PLAN.md) J7, J8 |

---

*Update when LLM proxy ships or tool inventory changes.*
