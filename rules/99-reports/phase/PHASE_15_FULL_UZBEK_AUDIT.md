# Faza 15 — To'liq O'zbek Lokalizatsiya Auditi

**Sana:** 2026-06-13  
**Maqsad:** Oddiy foydalanuvchi ko'radigan inglizcha matn **0 ta** qolishi kerak  
**Qamrov:** Butun platforma — UI, toast, xato, modal, store, admin, SEO, aria-label, mock data

---

## Xulosa

| Ko'rsatkich | Qiymat |
|-------------|--------|
| **Lokalizatsiya balli** | **0%** |
| Taxminiy foydalanuvchiga ko'rinadigan matnlar | ~1 150 |
| O'zbekchaga tarjima qilingan | ~0 |
| i18n infratuzilmasi | Yo'q |
| `html lang` atributi | `en` (`__root.tsx`) |
| Tarjima kerak bo'lgan fayllar | ~115 / 172 `src/` fayl |
| Bu faza davomida tuzatilgan | 0 (faqat audit) |

Platforma de-fakto **100% inglizcha**. `settings.tsx` da "Uzbek" til tanlovi mavjud, lekin u faqat sozlamani saqlaydi — hech qanday UI matnini o'zgartirmaydi.

---

## Lokalizatsiya balli hisobi

```
Tarjima qilingan matnlar / Tarjima talab qilinadigan matnlar × 100
= ~0 / ~1 120 ≈ 0%
```

**Istisnolar (tarjima talab qilinmaydi):** brend nomi "Ishbor", shahar nomlari (Tashkent, Almaty), texnik atamalar (USD, Figma, Behance, PDF), foydalanuvchi ismlari mock data ichida.

---

## Tuzatilgan qismlar

Bu faza **faqat audit** — kod o'zgartirilmagan.

| Holat | Tafsilot |
|-------|----------|
| Tuzatilgan matnlar | 0 |
| O'zgartirilgan fayllar | 0 |
| Yangi i18n tizimi | Yo'q |

---

## O'zgargan fayllar

```
(ushbu faza davomida hech qanday manba fayl o'zgartirilmagan)
```

Yaratilgan yagona fayl: `PHASE_15_FULL_UZBEK_AUDIT.md`

---

## 1. Toast xabarlari (~72 ta chaqiruv, 25+ fayl)

| Fayl | Inglizcha matn | Kontekst |
|------|----------------|----------|
| `login.tsx` | `Welcome back!`, `Signed in with Google` | Auth muvaffaqiyat |
| `register.tsx` | `Account created with Google` | Ro'yxatdan o'tish |
| `settings.tsx` | `Settings saved`, `Language updated`, `Password reset email sent`, `2FA setup started`, `Payment method updated` | Sozlamalar |
| `messages.tsx` | `Offer accepted`, `Offer declined`, `Conversation archived`, `Report submitted`, `Escrow funded` (11 ta) | Chat |
| `wallet.tsx` | `Deposit of $X completed`, `Insufficient available balance`, `Statement downloaded` (6 ta) | Hamyon |
| `projects.$slug.tsx` | `Application created`, `Freelancer accepted`, `Proposal rejected`, `Proposal shortlisted` (7 ta) | Loyiha |
| `projects.create.tsx` | `Draft saved`, `Project published`, `Attachment added (mock)` (6 ta) | Loyiha yaratish |
| `portfolio.*.tsx` | `Draft saved`, `Portfolio published`, `Portfolio deleted` (12 ta) | Portfolio |
| `my-projects.tsx` | `Project paused`, `Project resumed`, `Project closed` | Mening loyihalarim |
| `escrow.$id.tsx` | `Funds released to freelancer`, `Dispute opened — Ishbor mediation will contact you` | Eskrou |
| `freelancers.$username.tsx` | `Profile link copied`, `Invitation sent` | Profil |
| `use-saved.ts` | `Sign in to save items`, `{type} saved`, `Removed from saved` | Saqlash |
| `review-form.tsx` | `Please write a review comment`, `Review submitted — thank you!` | Sharh |
| `admin-store.ts` | `{action} completed successfully`, `Failed to {action}` | Admin fallback |
| `admin.services.tsx` | `Edit service — opens editor` | Admin info |

---

## 2. Error va Success xabarlari

### Validatsiya xatolari
| Fayl | Matn |
|------|------|
| `portfolio-form.tsx` | `Maximum 10 gallery images allowed.`, `Failed to upload cover` |
| `portfolio.create.tsx` | `Project title is required to save a draft.`, `Please fill in all required fields before publishing.` |
| `portfolio.edit.$slug.tsx` | `Project title is required.`, `Please fill in all required fields.` |
| `projects.create.tsx` | `Project title is required to save a draft.`, `Please fill in all required fields before publishing.` |
| `review-form.tsx` | `Please write a review comment` |
| `wallet.tsx` | `Insufficient available balance` |

### Error boundary va 404
| Fayl | Matn |
|------|------|
| `__root.tsx` | `Lost on the Silk Road`, `This page has wandered off the trade route.`, `Return to Ishbor` |
| `__root.tsx` | `Something broke`, `Try again`, `Go home` |
| `error-page.ts` | `This page didn't load`, `Try again`, `Go home` |
| `freelancers.$username.tsx` | `Profile not found` |
| `services.$slug.tsx` | `Service not found` |
| `projects.$slug.tsx` | `Project not found` |
| `applications.$id.tsx` | `Application not found` |

---

## 3. Modal oynalar va Confirmation dialoglar

### `modals.tsx` — barcha modallar inglizcha
| Modal | Matnlar |
|-------|---------|
| Emoji | `Add emoji`, `Pick an emoji for your message.` |
| Fayl | `Attach file`, `Select a file to share…` |
| Taklif | `Custom engagement`, `Send custom offer`, `Cancel`, `Send offer`, `Title`, `Amount (USD)`, `Duration` |
| Eskrou | `Fund escrow`, `Release funds`, `Open dispute`, `Confirm` |
| Hamyon | `Deposit funds`, `Withdraw funds`, `Payment method`, `Destination` |

### Admin confirmation (`actions.tsx` + admin route'lar)
| Default | `Confirm`, `Cancel` |
|---------|---------------------|
| `admin.orders.tsx` | `Cancel order`, `Cancel "{title}"?`, `confirmLabel: "Cancel"` |
| `admin.projects.tsx` | `Delete project`, `Delete "{title}"?`, `confirmLabel: "Delete"` |
| `admin.services.tsx` | `Delete service`, `Edit service — opens editor` |
| `admin.escrow.tsx` | `Release`, `Freeze`, `Investigate` |
| `admin.payments.tsx` | `Approve`, `Reject`, `Hold` |
| `admin.verifications.tsx` | `Approve`, `Reject` |
| `admin.support.tsx` | `Reply`, `Close`, `Escalate` |

---

## 4. Empty states va Loading states

| Fayl | Matn | Kontekst |
|------|------|----------|
| `feedback.tsx` | `Loading`, `Loading content` | aria-label |
| `feedback.tsx` | `No {label} yet` | PipelineEmpty |
| `messages.tsx` | `No conversations yet` | Bo'sh inbox |
| `saved.tsx` | `No saved services`, `No saved freelancers`, `No saved projects` (6 ta) | Saqlangan |
| `dashboard.freelancer.tsx` | `No reviews yet` | Sharhlar |
| `notifications.tsx` | `All caught up` | Bo'sh bildirishnomalar |
| `orders.index.tsx` | Tab bo'sh holatlari | Buyurtmalar |
| `applications.index.tsx` | Bo'sh arizalar | Arizalar |
| `portfolio.index.tsx` | Portfolio bo'sh holatlari | Portfolio |
| `my-projects.tsx` | Loyiha bo'sh holatlari | Mening loyihalarim |

---

## 5. Skeleton placeholder va aria-label (~32 ta)

| Fayl | Matn |
|------|------|
| `save-button.tsx` | `Save` / `Unsave` |
| `modals.tsx` | `Close modal`, `Close` |
| `messages.tsx` | `Back to conversations`, `Call`, `Video call`, `Attach file`, `Add emoji` |
| `nav.tsx` | `Messages`, `Notifications`, `Wallet`, `Menu` |
| `gallery.tsx` | `Expand gallery`, `Close gallery` |
| `portfolio-form.tsx` | `Move up`, `Move down` |
| `data-table.tsx` | `Select all`, `Select {id}` |
| `login.tsx` / `register.tsx` | `Hide password` / `Show password` |
| `theme.tsx` | `Toggle theme` |
| `marketplace-toolbar.tsx` | `Clear search` |
| `workspace-shell.tsx` | `Workspace navigation` |

---

## 6. Form placeholderlari (~70 ta)

| Fayl | Placeholder |
|------|-------------|
| `nav.tsx` | `Search Ishbor…` |
| `projects.index.tsx` | `Search projects…` |
| `services.index.tsx` | `Search services…` |
| `freelancers.index.tsx` | `Search talent…` |
| `messages.tsx` | `Search conversations...`, `Write a message...` |
| `portfolio-form.tsx` | `e.g. Fintech App Redesign`, `Describe the project scope...`, `Metric label`, `Value` |
| `projects.create.tsx` | `e.g. Fintech App Redesign`, `Describe the project scope, goals...` |
| `projects.$slug.tsx` | `Describe your approach, relevant experience...` |
| `review-form.tsx` | `Share your experience working on this project...` |
| `login.tsx` / `register.tsx` | `you@company.com`, `Min. 8 characters` |
| `admin.search.tsx` | `Search sections, users, orders…` |
| `admin.*.tsx` | `Assign`, `Status`, `Role`, `Verification`, `Category` |

---

## 7. Status badge'lar (`trust.tsx` — markaziy hub)

### Freelancer darajalari
`Top Rated`, `Expert`, `Rising`, `Verified`

### Tasdiqlash
`Identity Verified`, `Business Verified`, `Escrow Protected`

### Buyurtma statuslari
`In Progress`, `In Review`, `Revision`, `Completed`, `Disputed`, `Cancelled`, `Funded`

### Ariza statuslari
`Pending`, `Shortlisted`, `Rejected`, `Accepted`

### Trust metrikalari
`Success score`, `Completion`, `On-time`, `Response`, `Repeat clients`, `Score`, `Done`, `Responds`, `repeat`, `earned`

---

## 8. Store va mock data statuslari

### `wallet-store.ts`
- Tranzaksiya: `Wallet deposit`, `Withdrawal`, `Escrow funded`, `Milestone release`, `Deposit processing fee`
- Status: `Completed`, `Pending`, `Failed`
- Filter: `All`, `Incoming`, `Outgoing`, `Fees`, `Escrow`

### `escrow-store.ts` / mock-data
- Timeline: `Completed`, `Milestone funded`, `Payment released`

### `notifications-store.ts` / `mock-data.ts`
- `Milestone funded`, `New proposal received`, `5-star review`, `Just now`

### `admin-mock-data.ts`
- `Approved`, `Rejected — incomplete docs`, dispute sabablari, support ticket mavzulari

### `admin-store.ts` — Audit log yozuvlari
```
Approved verification for Nargiza Akhmedova
Escrow funded — $6,000 for Fintech App Redesign
Released milestone funds — $400 Brand Identity
Rejected withdrawal request — $3,000 Uzcard
Suspended user account — spam applications
New registration — Dilnoza Kim (freelancer)
Resolved dispute — split payment 60/40
Approved project listing — Series A Pitch Deck
```

### `admin-roles.ts`
`Super Admin`, `Finance Admin`, `Support Admin`, `Moderator`

### `marketplace.ts` — Sort
`Newest`, `Highest rated`, `Most popular`, `Lowest price`, `Highest price`

---

## 9. Notification matnlari (`notifications.tsx`)

### Filterlar
`All`, `Payments`, `Proposals`, `Reviews`, `Messages`, `Escrow`, `System`

### Harakat tugmalari
`View escrow`, `Dismiss`, `Review proposal`, `Later`, `View review`, `Learn more`, `Reply`, `Mark all read`

---

## 10. Navigatsiya va menyu

### `workspace-shell.tsx` — Sidebar
`Client`, `My Projects`, `Post Project`, `Freelancer`, `My Applications`, `Find Work`, `Portfolio`, `Orders`, `Saved`, `Escrow`, `Messages`, `Notifications`, `Wallet`, `Profile`, `Settings`, `Admin`

### `nav.tsx` — Header
`Find work`, `Post project`, `My projects`, `My applications`, `Projects`, `Services`, `Talent`, `Dashboard`, `Menu`

### `admin/shell.tsx` — Admin sidebar
`Dashboard`, `Users`, `Verifications`, `Projects`, `Portfolios`, `Services`, `Orders`, `Applications`, `Escrow`, `Disputes`, `Payments`, `Moderation`, `Support`, `Analytics`, `Audit Logs`, `System Health`

### `footer.tsx`
`Marketplace`, `Browse services`, `Client dashboard`, `Company`, `Join Ishbor`, `Terms of trade`, `Privacy`, `All systems normal`, `UZ · EN · RU`

---

## 11. Qidiruv natijalari — majburiy kalit so'zlar

| Kalit so'z | Topilgan joylar | Holat |
|------------|-----------------|-------|
| **Loading** | `feedback.tsx` aria-label | ❌ Inglizcha |
| **Submit** | `cards.tsx` — `Submit proposal` | ❌ Inglizcha |
| **Save** | `save-button.tsx`, `portfolio.$slug.tsx`, `settings.tsx` | ❌ Inglizcha |
| **Cancel** | `modals.tsx`, `admin.orders.tsx`, `actions.tsx` | ❌ Inglizcha |
| **Delete** | `admin.projects.tsx`, `admin.services.tsx`, `admin.portfolios.tsx` | ❌ Inglizcha |
| **Edit** | `admin.projects.tsx`, `admin.services.tsx`, `settings.tsx`, `portfolio.edit.$slug.tsx` | ❌ Inglizcha |
| **View** | `cards.tsx`, `dashboard.index.tsx`, `notifications.tsx` | ❌ Inglizcha |
| **Continue** | `checkout.tsx` — `Continue to payment` | ❌ Inglizcha |
| **Dashboard** | `workspace-shell.tsx`, `admin/shell.tsx`, `checkout.tsx`, `nav.tsx` | ❌ Inglizcha |
| **Order** | `orders.*`, `workspace-shell.tsx`, `checkout.tsx` | ❌ Inglizcha |
| **Project** | `projects.*`, `my-projects.tsx`, `workspace-shell.tsx` | ❌ Inglizcha |
| **Service** | `services.*`, `cards.tsx` | ❌ Inglizcha |
| **Application** | `applications.*`, `dashboard.freelancer.tsx` | ❌ Inglizcha |
| **Review** | `review-form.tsx`, `trust.tsx`, `notifications.tsx` | ❌ Inglizcha |
| **Notification** | `notifications.tsx`, `workspace-shell.tsx` | ❌ Inglizcha |
| **Settings** | `workspace-shell.tsx`, `settings.tsx` | ❌ Inglizcha |
| **Profile** | `workspace-shell.tsx`, `profile.tsx`, `freelancers.$username.tsx` | ❌ Inglizcha |

---

## 12. SEO title va meta (~57 route)

Barcha `head()` funksiyalari inglizcha. Namunalar:

| Route | SEO title |
|-------|-----------|
| `index.tsx` | `Ishbor — The marketplace for Central Asia's best talent` |
| `dashboard.index.tsx` | `Client Dashboard — Ishbor` |
| `dashboard.freelancer.tsx` | `Freelancer Dashboard — Ishbor` |
| `notifications.tsx` | `Notifications — Ishbor` |
| `checkout.tsx` | `Checkout — Ishbor` |
| `admin.index.tsx` | `Admin Dashboard — Ishbor` |
| `admin.escrow.tsx` | `Escrow Command Center — Ishbor Admin` |
| `privacy.tsx` | `Privacy Policy — Ishbor` |
| `terms.tsx` | `Terms of Service — Ishbor` |

`__root.tsx`: `lang="en"`, default OG description inglizcha.

---

## 13. Auth va Onboarding (100% inglizcha)

| Fayl | Asosiy matnlar |
|------|----------------|
| `login.tsx` | `Welcome back`, `Sign in`, `Forgot password?` |
| `register.tsx` | `Create your account`, `Already have an account?` |
| `forgot-password.tsx` | `Reset your password`, `Check your email` |
| `reset-password.tsx` | `Set new password`, `Password updated` |
| `verify-otp.tsx` | `Enter verification code` |
| `verify-email.tsx` | `Verify your email` |
| `welcome.tsx` | Welcome flow |
| `onboarding.index.tsx` | `How will you use Ishbor?`, `I'm hiring`, `I'm freelancing` |
| `onboarding.skills.tsx` | `What are your skills?` |
| `onboarding.categories.tsx` | `Which categories do you work in?` |
| `onboarding.portfolio.tsx` | `Showcase your work` |
| `onboarding.languages.tsx` | `What languages do you speak?` |
| `onboarding.availability.tsx` | `Set your availability` |
| `onboarding.company.tsx` | `What's your company name?` |
| `onboarding.industry.tsx` | `What industry are you in?` |
| `onboarding.team-size.tsx` | `How large is your team?` |
| `onboarding.hiring-goals.tsx` | `What are your hiring goals?` |

`auth-constants.ts`: `Branding`, `Figma`, `Next.js`, `Native`, `Fluent`, `Fintech`, `E-commerce` va boshqa onboarding variantlari.

---

## 14. Admin panel (~220 matn, 20+ route)

Har bir admin route to'liq inglizcha: sarlavhalar, tab triggerlar, filterlar, KPI nomlari, chart nomlari, bulk action tugmalari.

| Route | Namuna matnlar |
|-------|----------------|
| `admin.index.tsx` | `Active Users`, `Pending withdrawals`, `Enterprise Admin OS` |
| `admin.users.tsx` | `User Management`, `Active`/`Pending` filterlar |
| `admin.analytics.tsx` | `Revenue Growth`, `Category GMV`, `Conversion Funnel` |
| `admin.audit.tsx` | `Audit Trail`, `Category` filter |
| `admin.system.tsx` | `System Status`, `System Health` |
| `admin.escrow.$id.tsx` | `Release Funds`, `Refund Client`, `Pay Freelancer` |
| `admin.disputes.tsx` | `Dispute Center`, `Pending` tab |
| `admin.moderation.tsx` | `Content Moderation`, `Approve content` |

---

## 15. Landing va marketing (`index.tsx`, `footer.tsx`)

- Hero: `I want to hire`, `Post a project`, `Live in Tashkent · Almaty…`
- Statistika: `Trade Volume`, `Verified Talent`, `Escrow Protected`, `Avg. Time to Hire`
- Testimonials: to'liq inglizcha iqtiboslar
- Footer marketing paragrafi inglizcha

---

## 16. Escrow timeline va Checkout

### `escrow.$id.tsx`
`Escrow workflow`, `Open dispute`, `View order`, `Payment released`, `Milestone payment received`

### `checkout.tsx`
`Checkout`, `Back`, `Continue to payment`, `Hiring complete`, `Review order`, `Payment`, `Package`, `Delivery`, `Revisions`, `Order confirmed`, `Escrow funded`

---

## 17. Dashboard KPI nomlari

### Client (`dashboard.index.tsx`)
`Client workspace`, `Total spent`, `In escrow`, `Available balance`, `Saved freelancers`, `Reviewing`, `Shortlisted`, `Interview`, `Offer`

### Freelancer (`dashboard.freelancer.tsx`)
`Freelancer workspace`, `Active orders`, `Applications`, `Available`/`Busy`/`Away`, `Submitted`, `Pending`, `Accepted`, `Win rate`

---

## 18. Analytics chart nomlari (`admin.analytics.tsx`, `charts.tsx`)

`Revenue Growth`, `Category GMV`, `User Growth`, `Conversion Funnel`, oylik label'lar (`Jan`–`Jun`)

---

## 19. Breadcrumb va eyebrow matnlari

`Client workspace`, `Freelancer workspace`, `Inbox`, `Activity`, `Escrow workflow`, `Order detail`, `Enterprise Admin OS` — barchasi inglizcha.

---

## 20. Mobile menu

`nav.tsx` ichidagi `Menu` aria-label, mobil drawer navigatsiyasi — sidebar bilan bir xil inglizcha label'lar.

---

## Qolgan tarjima qilinmagan matnlar (prioritet bo'yicha)

### 🔴 P0 — Foydalanuvchi birinchi ko'radi
1. Landing page (`index.tsx`, `nav.tsx`, `footer.tsx`)
2. Auth va onboarding (12 route)
3. `workspace-shell.tsx` sidebar
4. `trust.tsx` status badge'lar
5. Toast xabarlari (72 ta)

### 🟠 P1 — Asosiy ish jarayoni
6. `modals.tsx` — eskrou, hamyon, taklif modallari
7. `messages.tsx` — chat UI
8. `notifications.tsx` — filter va harakatlar
9. `checkout.tsx`, `wallet.tsx`, `escrow.$id.tsx`
10. `projects.*`, `applications.*`, `orders.*`

### 🟡 P2 — Kontent va ma'lumot
11. `mock-data.ts` (~200 matn) — bildirishnomalar, chat, tranzaksiyalar
12. `messages-store.ts` — chat xabarlari
13. `admin-mock-data.ts` — admin jadval ma'lumotlari
14. `wallet-store.ts`, `escrow-store.ts` — dinamik label'lar
15. SEO `head()` — 57 route

### 🟢 P3 — Admin va qonuniy
16. Barcha `/admin/*` route'lar (~20 fayl)
17. `privacy.tsx`, `terms.tsx` — to'liq qonuniy matn
18. `aria-label` atributlari (32 ta)
19. `error-page.ts`, `__root.tsx` 404/error

---

## Tavsiya etilgan yechim

### 1. i18n infratuzilmasi
```typescript
// Masalan: src/lib/i18n/uz.ts — default locale
export const uz = { ... }
// react-i18next yoki oddiy useT() hook
```

### 2. Markazlashtirish
| Fayl | Vazifa |
|------|--------|
| `trust.tsx` | Barcha status badge'lar |
| `marketplace.ts` | Sort/filter nomlari |
| `auth-constants.ts` | Onboarding variantlari |
| `wallet-store.ts` | Tranzaksiya label'lari |
| `admin-roles.ts` | Rol nomlari |

### 3. `html lang="uz"` va SEO
Barcha `head()` funksiyalarini o'zbekchaga o'tkazish.

### 4. Settings til tanlovini ulash
`settings.tsx` dagi `language` state ni haqiqiy locale switcher ga bog'lash.

### 5. Taxminiy ish hajmi
| Bosqich | Fayllar | Matnlar | Vaqt |
|---------|---------|---------|------|
| P0 | ~20 | ~250 | 2–3 kun |
| P1 | ~30 | ~350 | 3–4 kun |
| P2 | ~15 | ~350 | 2–3 kun |
| P3 | ~50 | ~200 | 3–4 kun |
| **Jami** | **~115** | **~1 150** | **10–14 kun** |

---

## Xulosa

Platforma hozirgi holatda **0% o'zbekchalashtirilgan**. Inglizcha matn deyarli har bir foydalanuvchi tegishli qatlamda mavjud: navigatsiya, statuslar, toast, modal, forma, admin, SEO, mock data. Maqsadga erishish uchun tizimli i18n joriy etish va ~1 150 matnni tarjima qilish zarur.

**Keyingi qadam:** Faza 16 — P0 (landing + auth + sidebar + trust badges + toast) ni o'zbekchaga o'tkazish.
