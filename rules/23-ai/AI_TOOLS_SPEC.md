# AI_TOOLS_SPEC.md

**Ishbor marketplace — AI tool specifications (6 user tools + hub + admin)**  
**Routes:** `src/routes/ai.*` · **Modules:** `src/lib/ai-*`

---

## 1. Tool inventory

| # | Tool ID | Route | Module | Primary role |
|---|---------|-------|--------|--------------|
| 0 | `hub` | `/ai` | `ai-hub-config` | All authenticated |
| 1 | `onboarding` | `/ai/onboarding` | `ai-onboarding-wizard` | Client, freelancer, agency |
| 2 | `project-generator` | `/ai/project-generator` | `ai-project-generator` | Client |
| 3 | `proposal-assistant` | `/ai/proposal-assistant` | `ai-proposal-assistant` | Freelancer |
| 4 | `portfolio-optimizer` | `/ai/portfolio-optimizer` | `ai-portfolio-optimizer` | Freelancer |
| 5 | `trust-coach` | `/ai/trust-coach` | `ai-trust-coach` | Freelancer |
| — | `founder-insights` | `/admin/ai` | `ai-insights-store` | Admin/founder |

---

## 2. Hub (`/ai`)

### Purpose

Central dashboard for AI features — personalized headline, opportunity score, tool cards, smart match panel.

### UI components

| Component | Source |
|-----------|--------|
| `OpportunityScoreCard` | `ai-opportunity-store` |
| `SmartMatchPanel` | `ai-matching-store` |
| Feature cards | `getAiHubFeatures(user)` |
| Founder card | `FOUNDER_AI_FEATURE` → `/admin/ai` |

### Headline logic

`getAiHubHeadline(user)` — varies by role and onboarding progress.

### Feature card status

| Status | Label example | Meaning |
|--------|---------------|---------|
| `ready` | Tayyor | Tool fully usable |
| `progress` | Jarayonda | Partial completion |
| `action` | Harakat kerak | User action unlocks value |

### Side effects

On mount: `syncSmartNotifications(user.id)` — AI-driven notification suggestions.

### Auth

- `beforeLoad: requireAuth`
- Hub layout: full `SiteNav` + footer
- Sub-tools: compact AI nav bar via `ai.tsx` layout

### Empty states

- Freelancer match: *"Profil va ko'nikmalarni to'ldiring..."*
- Client match: *"Loyiha e'lon qiling..."*

### Analytics

`ai_tool_used` with `tool_id: hub` on page view (optional).

---

## 3. Onboarding (`/ai/onboarding`)

### Purpose

Step-by-step guided setup wizard per user type (client, freelancer, agency) with progress tracking.

### Inputs

| Input | Source |
|-------|--------|
| User profile | `auth`, `profile-store` |
| Agency state | `agency-store`, `agency-portfolio-store` |
| Onboarding progress | localStorage per user |

### Outputs

| Output | Type |
|--------|------|
| `plan.steps[]` | Ordered checklist with title, description, CTA, href |
| `plan.progress` | 0–100% |
| `plan.userType` | client \| freelancer \| agency |
| Agency journey map | `JourneyMap` for agency owners |

### Key functions

- `enrichOnboardingPlan(user)` — compute steps from platform state
- `markOnboardingStepDone(userId, stepId)` — persist completion on CTA click

### UI

- `WorkspaceShell` wrapper
- Progress bar
- `OpportunityScoreCard`
- Per-step: done ✓ or CTA button linking to real route

### Business rules

1. Steps unlock sequentially — CTA marks step done on click
2. Agency users see additional `JourneyMap` (published, 2+ members, case studies)
3. Dashboard return link varies by role

### Target LLM enhancement

Personalize step descriptions based on industry and goals (onboarding prompt template).

### Success metric

% users reaching 100% onboarding progress within 7 days.

---

## 4. Project generator (`/ai/project-generator`)

### Purpose

Client converts a rough idea into a structured project brief ready for `/projects/create`.

### Inputs (form)

| Field | Type | Validation |
|-------|------|------------|
| `idea` | textarea | Required, min 10 chars |
| `budget` | number USD | ≥0, default 2000 |
| `weeks` | number | 1–52, default 4 |

### Outputs

| Field | Description |
|-------|-------------|
| `title` | Generated project title |
| `category` | Marketplace category |
| `description` | Multi-paragraph brief |
| `skills[]` | Up to 6 skills |
| `budget.suggested` | Recommended budget |
| `budget.note` | Explanation in O'zbek |
| `timeline.weeks` | Suggested duration |
| `timeline.note` | Phase explanation |

### Key functions

- `generateProjectFromIdea(idea, budget, weeks)`
- `saveAiProjectDraft(result)` → navigate `/projects/create?ai=1`

### Current logic

Keyword detection (`SKILL_MAP`, `CATEGORY_MAP`) — maps Uzbek/English terms to skills.

### UI flow

1. Fill form → "Generatsiya qilish"
2. Preview card with skills tags
3. "Loyiha yaratish" → prefilled create form

### Error states

- Empty idea: inline validation banner
- Generation error: toast

### Target LLM enhancement

Richer descriptions, scope sections, experience level suggestion.

### Success metric

Client projects created via `?ai=1` → published rate.

---

## 5. Proposal assistant (`/ai/proposal-assistant`)

### Purpose

Freelancer generates competitive proposal (cover letter, price, milestones) for a selected project.

### Inputs

| Input | Source |
|-------|--------|
| `selectedSlug` | Dropdown of published projects |
| Session user | Skills, stats from profile |

### Outputs

| Field | Description |
|-------|-------------|
| `coverLetter` | Formal O'zbek proposal letter |
| `proposedAmount` | USD — adjusted by skill match |
| `timeline` | From project duration |
| `milestones[]` | label, amount, days |
| `deliveryDays` | Numeric |

### Key functions

- `generateProposalForProject(project)`

### Logic (current)

- Skill match rate → price factor (0.95 if ≥50% match)
- `computeSuccessScore`, `computeResponseRate` from `growth-metrics`
- Milestone count by delivery days (2/3/4 milestones)
- Mentions Ishbor escrow protection in letter

### UI flow

1. Select project from dropdown
2. Generated preview with copy button
3. "Taklif yuborish" → `/projects/$slug?proposal=true`

### Empty states

- No projects: CTA to `/projects`
- No selection: prompt to select

### Subscription note

Actual proposal **submission** gated by `subscription-store` proposal limits — assistant is advisory.

### Target LLM enhancement

Tone options, competitive differentiation, custom milestone narratives.

### Success metric

Proposals submitted after assistant use → acceptance rate.

---

## 6. Portfolio optimizer (`/ai/portfolio-optimizer`)

### Purpose

Freelancer receives portfolio health score, weak areas, and prioritized improvement suggestions.

### Inputs

| Input | Source |
|-------|--------|
| User | `useAuth()` |
| Portfolios | `portfolio-store` |
| Case studies | agency portfolio if applicable |

### Outputs

| Field | Description |
|-------|-------------|
| `portfolioCount` | Published items |
| `caseStudyCount` | Case studies |
| `score` | 0–100 optimization score |
| `weakAreas[]` | Human-readable gaps |
| `suggestions[]` | id, title, description, impact, priority, href |

### Key functions

- `analyzePortfolio(user)`

### UI

- `OpportunityScoreCard`
- Stats grid (3 columns)
- Weak areas warning card
- Suggestions list with priority badges (high/medium/low) + action links

### Business rules

1. Every suggestion `href` must be a real route (DEAD_ACTION_POLICY)
2. Priority based on impact on opportunity score
3. Links to `/portfolio/create`, `/settings`, etc.

### Target LLM enhancement

Per-item portfolio copy suggestions, SEO keywords for titles.

### Success metric

Suggestion CTR → portfolio publish rate increase.

---

## 7. Trust coach (`/ai/trust-coach`)

### Purpose

Help freelancers understand and improve their Ishbor trust score.

### Inputs

| Input | Source |
|-------|--------|
| User profile completeness | `profile-store` |
| Trust metrics | `growth-metrics.ts` |
| Verification state | verification stores |

### Outputs

| Field | Description |
|-------|-------------|
| `currentTrustScore` | 0–100 |
| `trustLabel` | Human label |
| `estimatedGain` | Potential points |
| `whyLow[]` | Reasons if score < threshold |
| `missingProfileSections[]` | Unfilled sections |
| `howToImprove[]` | action, impact, href |

### Key functions

- `getTrustCoachInsights(user)`

### UI

- Large trust score display with Shield icon
- "Nima uchun past?" section
- Missing profile chips
- Improvement actions with primary CTA buttons

### Business rules

1. Trust score from `growth-metrics` — **never random** (PROJECT_BIBLE §9)
2. Improvement links go to verification, profile, orders, reviews
3. Aligns with TRUST_SYSTEM.md badges

### Target LLM enhancement

Personalized weekly trust coaching plan.

### Success metric

Trust score delta 30 days post first visit.

---

## 8. Admin founder insights (`/admin/ai`)

### Purpose

Marketplace-wide AI analytics for founders — not a user tool.

### Access

- Route: `/admin/ai`
- Gate: `AdminOnlyGate`, founder admin check
- Store: `computeFounderAiInsights`

### Outputs (computed, no LLM today)

- Growth trends
- Category demand signals
- Conversion funnel anomalies
- Top opportunity segments

### Target

LLM-generated weekly narrative summary emailed to founders.

---

## 9. Cross-tool requirements

| Requirement | All tools |
|-------------|-----------|
| Language | O'zbek UI copy |
| Auth | `requireAuth` + `AuthGate` |
| Primary CTA | Every tool has next-step action |
| No dead ends | Link to real marketplace routes |
| Mobile | 320px+ usable |
| Analytics | `ai_tool_used` event |
| Usage limits | Per AI_USAGE_LIMITS.md (target) |

---

## 10. API mapping (target)

| Tool | POST endpoint |
|------|---------------|
| proposal-assistant | `/api/ai/proposal-assistant` |
| project-generator | `/api/ai/project-generator` |
| portfolio-optimizer | `/api/ai/portfolio-optimizer` |
| trust-coach | `/api/ai/trust-coach` |
| onboarding | `/api/ai/onboarding/enrich` |

---

## 11. References

- [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md)
- [PROMPT_LIBRARY.md](./PROMPT_LIBRARY.md)
- [AI_USAGE_LIMITS.md](./AI_USAGE_LIMITS.md)
- [TRUST_SYSTEM.md](../04-trust/TRUST_SYSTEM.md)
- [src/routes/ai.*](../../../src/routes/)

---

*Last updated: 2026-06-20*
