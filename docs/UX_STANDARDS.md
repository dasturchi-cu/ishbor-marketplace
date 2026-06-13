# UX_STANDARDS.md

Platform-wide UX requirements. Every page must comply.

---

## Core principle

> **"Keyin nima qilaman?"** — answered on every screen without leaving.

---

## Required page anatomy

| Element | Requirement |
|---------|-------------|
| Primary CTA | One obvious main action (button or link) |
| Secondary CTA | Alternative path (browse, skip, learn more) |
| Empty state | Icon + title + description + action when no data |
| Context | Eyebrow + title via WorkspaceShell or equivalent |
| Back / exit | Never trap user — nav or back link always available |

---

## State matrix (mandatory per page type)

### Empty state
- **When:** Zero items in list, no search results, new user
- **Components:** `EmptyState` from `@/components/site/feedback`
- **Must include:** Icon, title, description, **action button/link**
- **Example routes:** `/my-services`, `/applications`, `/saved`, `/notifications`

### Loading state
- **When:** Async tab switch, initial fetch simulation, route transition
- **Components:** `LoadingSpinner`, `CardSkeleton`
- **Must include:** `aria-busy="true"`, accessible label
- **Example:** `/notifications` tab load, settings tab switch
- **Max duration:** Show skeleton if >200ms; avoid infinite loading

### Error state
- **When:** Validation fail, not found, permission denied, crash
- **Components:** `EntityNotFound`, `InlineBanner`, error boundary
- **Must include:** What failed + recovery action (back link, retry, login)
- **Language:** O'zbek, specific (not "Xato yuz berdi" alone)

### Success state
- **When:** Save, submit, payment, mutation complete
- **Components:** `toast.success` **plus** visible UI update
- **Rule:** Toast alone is NOT sufficient for primary actions

### Confirmation state
- **When:** Delete, archive, release funds, admin reject
- **Components:** `confirmDestructive()`, `confirm()`, modal with onConfirm
- **Must include:** Irreversible action warning

### Mobile state
- **Breakpoints:** 320, 360, 375, 390, 414, 430, 768px
- **Patterns:** `mobile-scroll-x` for filter tabs, stacked CTAs, touch-target class
- **Forbidden:** Horizontal overflow, clipped text, overlapping modals

### Validation state
- **Forms:** Inline error below field, label + placeholder, focus on first error
- **Required fields:** Marked visually or validated on submit
- **Success:** Green check or saved indicator on settings save bar

---

## Page-type requirements

### Landing / marketing (`/`)
- Hero CTA + secondary browse path
- Trust section visible above fold on desktop
- Search accessible

### List pages (`/projects`, `/services`, etc.)
- Filters + sort + empty search state
- Card actions navigate to detail

### Detail pages (`/$slug`)
- Sticky or prominent hire/buy CTA
- Trust row (escrow, verified, reviews)
- Related items section when data exists

### Workspace pages (dashboard, wallet, settings)
- WorkspaceShell with actions slot
- Sidebar/tabs for sub-sections
- Role-appropriate content only

### Checkout (`/checkout`)
- Step clarity: review → pay → confirm
- Escrow explanation visible
- Error on insufficient balance

### Admin tables
- Filters, row actions, confirm on mutate
- Empty table message with filter reset

---

## Navigation UX

| Rule | Implementation |
|------|----------------|
| Login redirect | Preserve `?redirect=` deep link |
| Role mismatch | Redirect to role dashboard, not 404 |
| Guest on protected | `/login?redirect=pathname` |
| 404 entity | EntityNotFound with backTo link |
| Breadcrumbs | Eyebrow links on workspace pages |

---

## Messaging UX

- Inbox tabs: Active / Archived
- Search filters conversations
- Offer cards: accept/decline for client
- File attachments: download action (not toast-only)
- Pagination at 50+ conversations

---

## Accessibility UX

- Touch targets ≥ 44px (`touch-target` class)
- Focus rings on interactive elements (`focus-ring`)
- Form labels on all inputs
- `aria-label` on icon-only buttons
- Color not sole indicator of state

---

## Copy standards

- Language: **O'zbek** (professional, not machine-translated)
- Buttons: verb-first ("Loyiha joylash", not "Submit")
- Empty states: explain why empty + what to do
- Errors: actionable ("Email kiriting", not "Invalid input")

---

## Anti-patterns (forbidden)

| Anti-pattern | Fix |
|--------------|-----|
| Toast-only button | Wire mutation or remove button |
| Dead-end page | Add CTA or redirect |
| Placeholder "Coming soon" button | Remove or disable with explanation |
| Generic "Nimadir buzildi" without recovery | EntityNotFound or retry |
| English UI strings | Translate to O'zbek |

---

*See also: PROJECT_BIBLE.md §7, PROJECT_STANDARDS.md §2–3*
