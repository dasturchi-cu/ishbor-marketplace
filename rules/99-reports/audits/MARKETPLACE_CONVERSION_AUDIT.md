# Marketplace Conversion & Hiring Flow Audit (Phase 10.5)

**Date:** June 13, 2026  
**Scope:** Services, Talent, Projects, checkout, applications — conversion actions and hiring path clarity  
**Design constraint:** No redesign. Preserved `#2563EB` primary, existing cards, existing layouts.

---

## Conversion Goals

| Question | How it's answered |
|----------|-------------------|
| What can I do? | Every marketplace card exposes explicit CTAs (view, contact/message, order/hire/propose) |
| What happens next? | `ConversionFlowBanner` on detail, checkout, and application pages with next-step hints |
| How do I hire? | Client path: Service → Checkout → Escrow → Order (visual timeline on each step) |
| How do I get hired? | Freelancer path: Project → Proposal → Application → Accepted → Order |

---

## Client Hiring Path

```
Service / Profile → Checkout → Escrow → Order
```

| Step | Page | Status | Actions |
|------|------|--------|---------|
| 1. Service | `/services`, `/services/$slug` | PASS | Order now, Contact freelancer, Save, Share |
| 2. Checkout | `/checkout` | PASS | Review → Payment → Confirmed with flow banner |
| 3. Escrow | `/escrow`, `/escrow/$id` | PASS | Linked from checkout confirmation |
| 4. Order | `/orders`, `/orders/$id` | PASS | Linked from checkout confirmation |

---

## Freelancer Hiring Path

```
Project → Proposal → Application → Accepted → Order
```

| Step | Page | Status | Actions |
|------|------|--------|---------|
| 1. Project | `/projects`, `/projects/$slug` | PASS | View project, Submit proposal |
| 2. Proposal | `/projects/$slug` form | PASS | Proposal amount, delivery time, cover letter |
| 3. Application | `/applications`, `/applications/$id` | PASS | Created on submit; redirects after success |
| 4. Accepted | Application detail timeline | PASS | Status timeline + next-step hint |
| 5. Order | `/orders` | PASS | Link when application accepted |

---

## Page-by-Page Audit

### Services (`/services`)

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Service card — View service | Navigate to detail | Hover/footer action | PASS |
| Service card — Contact freelancer | Open messages | Links to `/messages` | PASS |
| Service card — Order now | Start checkout | Links to `/checkout` | PASS |
| Service card — Save (hover) | Toggle saved state | Heart on image + toast | PASS |
| Hover quick actions | Reveal on hover | Slide-up action bar (always visible mobile) | PASS |

### Service Detail (`/services/$slug`)

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Order now (primary) | Checkout CTA | Hero + package card + mobile sticky bar | PASS |
| Contact freelancer | Messages | Hero CTA | PASS |
| Save service | Persist preference | Toggle + toast | PASS |
| Share service | Copy/share link | Native share or clipboard | PASS |
| Client flow banner | Show hiring path | `ConversionFlowBanner` at top | PASS |
| Mobile sticky actions | Always-visible CTAs | Fixed bottom bar | PASS |

### Talent (`/freelancers`)

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Freelancer card — View profile | Open profile | Hover action | PASS |
| Freelancer card — Message | Open messages | Hover action | PASS |
| Freelancer card — Hire now | Start hire checkout | Hover action → `/checkout?type=hire` | PASS |

### Freelancer Profile (`/freelancers/$username`)

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Sticky action panel | Hire, message, save, share | Enhanced sidebar panel | PASS |
| Hire freelancer | Checkout | Primary CTA | PASS |
| Send message | Messages | Secondary CTA | PASS |
| Save profile | Toggle saved | Heart toggle + toast | PASS |
| Share profile | Copy/share link | Share button + toast | PASS |
| Next step hint | Explain escrow path | Inline hint in panel | PASS |
| Client flow banner | Hiring context | Banner at top | PASS |

### Projects (`/projects`)

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Project card — View project | Open detail | Secondary CTA | PASS |
| Project card — Submit proposal | Open proposal flow | Primary CTA with `?proposal=true` | PASS |

### Project Detail (`/projects/$slug`)

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Proposal amount | Required field | Number input | PASS |
| Delivery time | Required field | Text input | PASS |
| Cover letter | Required field | Textarea | PASS |
| Submit proposal | Create application | `createApplication()` + localStorage | PASS |
| Success state | Confirm submission | Success card + toast | PASS |
| Redirect to Applications | Navigate after submit | Auto-redirect to `/applications/$id` | PASS |
| Freelancer flow banner | Show hiring path | `ConversionFlowBanner` | PASS |

### Checkout (`/checkout`)

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Client flow banner | Visual connection | Banner on review/payment steps | PASS |
| Order confirmed | Link to order + escrow | View order, View escrow, Dashboard | PASS |
| Post-checkout hint | Next milestone step | Banner on confirmation | PASS |

### Applications (`/applications`, `/applications/$id`)

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| List user submissions | Show created apps | Merges mock + localStorage | PASS |
| Freelancer flow banner | Hiring context | Banner on list + detail | PASS |
| Status timeline | Progress indicators | 5-step timeline | PASS |
| Next step hints | Guide freelancer | Sidebar hint card | PASS |
| Delivery time display | Show proposal terms | On application detail | PASS |

---

## Dead-End Screen Audit

| Screen | Dead end? | Resolution |
|--------|-----------|------------|
| Services list | No | Every card has 3 actions |
| Service detail | No | Hero CTAs + package checkout + mobile bar |
| Talent list | No | Every card has 3 actions |
| Freelancer profile | No | Sticky hire panel + header actions |
| Projects list | No | View + Submit proposal on every card |
| Project detail | No | Full proposal form → application redirect |
| Checkout confirm | No | Links to order, escrow, dashboard, messages |
| Applications empty | No | Browse projects CTA |
| Application detail | No | View project + orders link when accepted |

---

## New Components & Utilities

| File | Purpose |
|------|---------|
| `src/components/site/conversion-flow.tsx` | Reusable hiring path banner with step indicators |
| `src/lib/applications-store.ts` | Persist submitted proposals as applications |

---

## Build Verification

```
npm run build → PASS
```

---

## Summary

Phase 10.5 adds missing business actions across all marketplace surfaces without altering the Ishbor design system. Every service, talent, and project card now exposes conversion CTAs. Detail pages include sticky action panels, flow banners, and connected checkout/application paths. Users can always see what to do next and how hiring works on both client and freelancer sides.
