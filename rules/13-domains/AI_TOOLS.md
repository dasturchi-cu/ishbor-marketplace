# AI_TOOLS — Domain Specification

## Purpose

Differentiation via AI-assisted onboarding, proposals, projects, portfolio, trust coaching.

## Routes & modules

| Route | Module file | Function |
|-------|-------------|----------|
| `/ai` | ai-hub-config | Tool hub cards |
| `/ai/onboarding` | ai-onboarding | Guided setup wizard |
| `/ai/proposal-assistant` | ai-proposal-assistant | Draft proposal text |
| `/ai/project-generator` | ai-project-generator | Client project brief |
| `/ai/portfolio-optimizer` | ai-portfolio-optimizer | Portfolio tips |
| `/ai/trust-coach` | ai-trust-coach | Trust score recommendations |
| `/admin/ai` | ai-insights-store | Founder marketplace insights |

## Computed AI stores

- `ai-matching-store` — matchProjectsForFreelancer, matchFreelancersForClient (formula-based, not LLM API)
- `ai-opportunity-store` — computeOpportunityScore for dashboard
- `ai-insights-store` — computeFounderAiInsights for admin

## Current status

**LIVE UI** with client-side generation stubs — no external LLM API key wired in production code

## Target integration

- OpenAI/Anthropic via server proxy (API key server-only)
- Rate limit by subscription tier
- Prompt templates in server/ai/
- Log prompts/responses for moderation (PII redaction)

## Security

Never send secrets to client; stream responses via server SSE

## Analytics

Track ai_tool_used events per tool id

## Database

`ai_usage_log` — user_id, tool, tokens, created_at for billing
