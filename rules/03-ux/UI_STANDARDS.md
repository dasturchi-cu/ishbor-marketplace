# UI_STANDARDS.md

Ishbor visual design system. **Do not redesign** — extend consistently.

Reference: [DESIGN_GUARDRAILS.md](../00-constitution/DESIGN_GUARDRAILS.md), [PROJECT_STANDARDS.md](../00-constitution/PROJECT_STANDARDS.md) §1

---

## Brand

| Token | Value |
|-------|-------|
| Primary | `#2563EB` (oklch ~0.546 0.185 257) |
| Background | `bg-background` |
| Surface / Card | `bg-card`, `border-border` |
| Success | `text-success`, `bg-success/10` |
| Warning | `text-warning` |
| Destructive | `text-destructive` |

**Forbidden:** New color systems, logo changes, nav structure replacement.

---

## Typography

| Use | Class |
|-----|-------|
| Display headings | `font-display`, `font-bold`, `tracking-tight` |
| Section titles | `font-display text-base font-bold` to `text-3xl` |
| Eyebrow | `font-mono text-[10px] uppercase tracking-widest text-muted-foreground` |
| Body | `text-sm`, `text-muted-foreground` for secondary |
| Metrics | `font-mono text-[10px]` or `font-display text-2xl font-bold` |
| Buttons | `text-sm font-semibold` (primary), `text-xs font-medium` (secondary) |

**Hierarchy:** One H1 per page (WorkspaceShell title or hero). Don't skip levels.

---

## Spacing

| Context | Pattern |
|---------|---------|
| Page padding | `px-4 sm:px-6`, `py-8 sm:py-10` |
| Section gap | `space-y-6`, `mt-8` between major blocks |
| Card padding | `p-4` to `p-6` |
| Grid gap | `gap-4`, `gap-6` for cards |
| Inline groups | `gap-2`, `gap-3` |

Use existing spacing scale — no arbitrary one-off margins unless fixing mobile.

---

## Border radius

| Element | Radius |
|---------|--------|
| Cards | `rounded-xl`, `rounded-2xl` |
| Buttons | `rounded-lg`, `rounded-xl` (primary CTAs) |
| Badges / pills | `rounded-full` |
| Inputs | `rounded-lg` |
| Avatars | `rounded-full` or `rounded-2xl` (profile) |

---

## Shadows

| Use | Class |
|-----|-------|
| Primary CTA | `shadow-[0_4px_12px_-2px_oklch(0.546_0.185_257/0.25)]` |
| Elevated card | `shadow-[0_8px_32px_-20px_oklch(...)]` |
| Package card | `shadow-[0_20px_60px_-24px_oklch(...)]` |

Avoid heavy shadows on mobile lists.

---

## Cards

- Border: `border border-border bg-card`
- Hover (interactive): `hover:border-primary/20`, `transition-default`
- Stat tiles: icon + label + value pattern from dashboard
- Marketplace cards: use `@/components/site/cards` (ServiceCard, ProjectCard, etc.)

---

## Tables

- Admin: `DataTable` component with horizontal scroll on mobile
- Comparison tables: `min-w-[620px]` with `overflow-x-auto` wrapper
- Header: `font-mono text-[10px] uppercase tracking-widest`

---

## Forms

- Input: `rounded-lg border border-border bg-background px-3 py-2 text-sm`
- Focus: `focus-ring` utility
- Label: above input, `text-sm font-medium`
- Error: red text below field, border `border-destructive`
- Save bar: `SettingsSaveBar` sticky on settings pages

---

## Dialogs & drawers

- Use `@/components/ui/dialog` and `sheet`
- Modals in `@/components/site/modals.tsx` for domain actions
- Max width: `max-w-lg` for confirmations, larger for forms
- Mobile: full-width sheet acceptable for complex modals

---

## Mobile

| Pattern | Class / component |
|---------|-------------------|
| Horizontal filters | `mobile-scroll-x` |
| Stacked actions | `flex-col gap-2 sm:flex-row` |
| Full-width buttons | `w-full sm:w-auto` on mobile CTAs |
| Messages split | List/chat toggle on `<md` |
| Admin overflow | Table wrapper with scroll |

Test at **375px** minimum before ship.

---

## Trust UI

- `EscrowShield`, `LevelBadge`, `VerifiedIdentityBadge`, `OrderStatusBadge`
- Trust row on checkout and service detail
- Verification center on profiles

---

## Icons

- Library: `lucide-react`
- Size: `size-4` inline, `size-5` in buttons, `size-3.5` in compact UI
- Primary accent on meaningful icons only

---

## Motion

- Default: `transition-default` on hover/focus
- Active press: `active:scale-[0.98]` on primary buttons (optional)
- No gratuitous animation

---

*Modify only files related to the current task. Report all UI file changes.*
