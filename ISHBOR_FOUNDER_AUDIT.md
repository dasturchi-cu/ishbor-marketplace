# Ishbor Founder-Level Growth Audit

**Sana:** 2026-06-13  
**Metod:** Butun platforma bo‘yicha mahsulot, biznes va o‘sish nuqtai nazaridan audit  
**Manbalar:** `PROJECT_STANDARDS.md`, `DESIGN_GUARDRAILS1111.md`, barcha persona oqimlari, mavjud audit hisobotlari  
**Maqsad:** Markaziy Osiyodagi eng yirik freelance marketplace bo‘lish uchun nima yetishmayapti?

**Joriy holat (Launch Audit):** Demo tayyorligi **77/100** — konversiya **74**, ishonch **76**, admin **68**

---

## Executive Summary

Ishbor **birinchi tranzaksiya uchun yaxshi ishlaydigan demo-marketplace**. Eskrou, portfolio, loyiha joylash, taklif yuborish va checkout oqimlari mavjud. Lekin **o‘sish dvigateli** hali yo‘q: referral yo‘q, reyting algoritmi yo‘q, xizmatlar bozori statik, admin operatsiyalari ko‘p joyda faqat ko‘rinish, ishonch signallari mock.

**Asosiy xulosa:** Ishbor hozir **investor demo** darajasida. **Haqiqiy bozor** bo‘lishi uchun: (1) ishonchni haqiqiy qilish, (2) likvidlikni ikki tomondan yoqish, (3) o‘sish loop’larini qurish, (4) monetizatsiyani kengaytirish kerak.

**Eng katta farq:** Upwork/Fiverr **o‘lchangan ishonch + algoritmik discovery + monetizatsiya** bilan ishlaydi. Ishbor **chiroyli UX + eskrou pozitsiyasi** bilan ishlaydi, lekin ortidagi ma’lumotlar ko‘pincha statik.

---

# 1. Mehmon (Guest) Persona Audit

## Mehmon hozir nima ko‘radi?

| Element | Holat | Baholash |
|---------|-------|----------|
| Ishbor nima? | "Markaziy Osiyoning yetakchi freelance bozori" | ✅ Aniq |
| Nima uchun yaxshi? | Eskrou, tekshirilgan talent, 2 soat yollash | ⚠️ Da’vo bor, isbot zaif |
| Nima uchun ishonish? | $42M+, 12,400 talent, 3 ta testimonial, trust section | ⚠️ Statik/mock — tekshirib bo‘lmaydi |
| Keyin nima? | "Loyiha joylash" yoki "Loyihalarni ko'rish" | ⚠️ Loyiha joylash → login devori |

## Mavjud kuchli tomonlar

- O‘zbek tilidagi professional landing
- Dual-intent kartalar (yollamoqchiman / ishlashni xohlayman)
- UniversalSearch hero’da
- Kategoriya grid, top freelancerlar, ochiq loyihalar, xizmatlar preview
- Trust section: eskrou, Humo/Uzcard/Kaspi/SWIFT, 24 soat nizolar
- Geo badge: Toshkent · Olmaota · Bishkek · Dushanbe

## Yetishmayotgan ishonch va konversiya elementlari

1. **"Qanday ishlaydi" 3 qadamli tushuntirish yo‘q** — sovuq trafik darhol tushunmaydi
2. **Komissiya/fees shaffofligi yo‘q** — 5% checkout’da bor, landing’da yo‘q
3. **Hero’da Register CTA yo‘q** — faqat login orqali loyiha joylash
4. **Loyiha formasi preview yo‘q** — login devoridan oldin qiymat ko‘rinmaydi
5. **Haqiqiy ijtimoiy isbot yo‘q** — statistika va testimonial’lar hardcoded
6. **Live activity feed yo‘q** — "Azizbek hozir Dizayn loyihasini yolladi" kabi signal yo‘q
7. **Projects vs Services farqi tushuntirilmagan** — qachon loyiha, qachon xizmat?
8. **Referral / invite tizimi yo‘q**
9. **Pricing sahifasi yo‘q**
10. **Demo auth (OTP 123456)** — haqiqiy founder uchun ishonchni buzadi

## Mehmon konversiya xulosa

Landing **chiroyli va ishonchli ko‘rinadi**, lekin **konvert qilmaydi** chunki: (a) asosiy CTA login devori, (b) isbot tekshirib bo‘lmaydi, (c) keyingi qadam noaniq bo‘lishi mumkin.

---

# 2. Mijoz (Client) Persona Audit

## Mavjud oqim

```
Landing → Loyiha joylash → Mening loyihalarim → Takliflar (loyiha sahifasida)
  → Qabul qilish → Checkout (eskrou) → Buyurtma → Eskrou release → Sharh
```

**Ishlaydi:** Loyiha CRUD, taklif ko‘rish/saralash/shortlist, 3 xil checkout (order/hire/service), eskrou fund/release/nizo, sharh formasi, frilanserga taklif yuborish.

## Friktsiya va yetishmovchiliklar

### P0 — Ishonchni buzadigan bo‘shliqlar

| Muammo | Ta’sir |
|--------|--------|
| `/orders` ro‘yxati mock-data’dan | Yangi buyurtma ko‘rinmasligi mumkin |
| Dashboard "Faol buyurtmalar" mock | Mijoz o‘z tranzaksiyasini ko‘rmaydi |
| Hiring pipeline (Kanban) dekorativ | Haqiqiy takliflar bilan bog‘lanmagan |
| Buyurtma sahifasi read-only | "Yetkazib berishni tasdiqlash" yo‘q — faqat eskrou orqali |

### P1 — Yollash friktsiyasi

- **Birlashgan takliflar inbox’i yo‘q** — har loyiha alohida
- **Suhbat bosqichi fiktiv** — Calendlar/video yo‘q
- **Taklifdan xabar yo‘q** — messaging alohida
- **Loyihani ulashish tugmasi yo‘q** — matn bor, action yo‘q
- **Ilovalar mock** — loyiha yaratishda fayl biriktirish soxta
- **Tavsiya etilgan talent generic** — skill match yo‘q
- **Mijoz analytics yo‘q** — xarajat, yollash tezligi, ROI

### P2 — Upwork/Fiverr bilan taqqoslash

| Upwork’da bor | Ishbor’da |
|---------------|-----------|
| Connects / obuna | ❌ |
| Birlashgan taklif inbox | ❌ |
| Hourly time tracker | ❌ |
| Shartnoma / SOW | ❌ |
| Jamoa / enterprise | ❌ (faqat mock) |
| Saved search alerts | ❌ |
| Skills test | ❌ |
| Mijoz reputatsiyasi | ❌ |

## Mijoz xulosa

**Birinchi yollash ishlaydi.** **Ikkinchi yollash qiyin** — dashboard haqiqiy holatni ko‘rsatmaydi, pipeline aldamchi, analytics yo‘q. Mijoz retention uchun **post-hire OS** qurish shart.

---

# 3. Frilanser (Freelancer) Persona Audit

## Mavjud kuchli tomonlar

- 5 bosqichli onboarding (skills → categories → portfolio → languages → availability)
- Portfolio tizimi eng kuchli modul (~90/100): CRUD, case study, galereya, analytics
- Applications tracking: Pending/Accepted/Rejected/Archived
- Messaging: xabar, offer, eskrou fund
- Public profile: LevelBadge, SuccessScore, VerificationCenter, reviews
- Wallet UI: deposit/withdraw

## Kritik bo‘shliqlar

### Aktivatsiya muammosi (P0)

**Onboarding ma’lumotlari sessionStorage’da qoladi** — profile, portfolio-store va qidiruvga yozilmaydi. Frilanser onboarding tugatadi, lekin profil bo‘sh qoladi. Bu **supply-side o‘lim nuqtasi**.

### Retention va motivatsiya yo‘q

| Loop | Holat |
|------|-------|
| Job alerts (skill match) | ❌ |
| Proposal credits / Connects | ❌ |
| Boost / featured (pullik) | ❌ (faqat admin) |
| Seller level progression | ❌ (mock label) |
| Response rate o‘lchov | ❌ (hardcoded "< 1 soat") |
| Success score algoritm | ❌ (mock seed) |
| Profile completion checklist | ⚠️ UI bor, persistent emas |
| Post-rejection feedback | ❌ |
| Referral credits | ❌ |
| Availability toggle | ❌ (local state + toast) |

### Daromad ishonchi zaif

- Dashboard earnings chart **hardcoded** ($8,420, 6 oy)
- Stat kartalar (98% completion, 64% repeat) **statik**
- Active orders **global mock**, user-scoped emas
- Export/report → toast only

## Frilanser xulosa

**UX yo‘li to‘liq.** **Growth engine yo‘q.** Frilanser birinchi sessiyadan keyin "bu haqiqiy daromad manbaimi?" deb shubhalanadi. Upwork/Fiverr **o‘lchangan progress + job alerts + real earnings** bilan ushlab qoladi.

---

# 4. Admin Persona Audit

## Mavjud panel

Dashboard, users, verifications, projects, portfolios, services, orders, applications, escrow, disputes, payments, moderation, support, analytics, audit, system health.

## Haqiqat vs ko‘rinish

| Panel | UI | Haqiqiy state yangilanishi |
|-------|-----|---------------------------|
| Portfolios | ✅ | ✅ Approve/reject/hide/feature |
| Support | ✅ | ⚠️ Qisman (ticket assign/reply) |
| Audit log | ✅ | ✅ Live |
| **Qolgan hammasi** | ✅ | ⚠️ **Audit + toast only** |

## Yetishmayotgan admin vositalar

1. **Fraud detection** — velocity limits, duplicate identity, collusion patterns
2. **Risk dashboard** — yuqori xavfli hisoblar, shubhali tranzaktsiyalar
3. **Automated moderation** — profanity, tashqi kontakt, duplicate listing
4. **SLA alerting** — verification backlog, nizo spike, failed payout
5. **Haqiqiy analytics** — GMV, retention, funnel hozir 100% mock
6. **Dispute resolution → wallet/escrow** — admin hal qila olmaydi
7. **Verification approve → user flag** — profilda o‘zgarmaydi
8. **Withdrawal review queue** — approve/reject wallet’ga ta’sir qilmaydi
9. **CSAT, macro templates, ticket thread UI**
10. **Cohort retention, supply/demand ratio, geo splits**

## Admin xulosa

Admin panel **85/100 UI**, **30/100 operatsiya**. Haqiqiy pul aylanishidan oldin **state-changing ops** shart — aks holda fraud va nizolar scale qila olmaydi.

---

# 5. Marketplace Audit

## Uch parallel yuzey

| Yuzey | Model | Ma’lumot | Supply creation |
|-------|-------|----------|-----------------|
| **Xizmatlar** | Fiverr-style packages | Static mock | ❌ Yo‘q |
| **Loyihalar** | Upwork-style proposals | localStorage (live) | ✅ To‘liq |
| **Frilansers** | Talent discovery | Static mock | Onboarding orqali |

**Strategik nomutanosiblik:** Loyihalar o‘sadi, xizmatlar o‘smaydi. Dual marketplace **navigatsiyada bor**, **likvidlikda yo‘q**.

## Discovery bo‘shliqlari

- Qidiruv: client-side substring, fuzzy yo‘q, cross-entity unified search yo‘q
- Filterlar: loyihalarda budget/experience/verified client yo‘q
- Sort: "newest" ko‘p joyda ishlamaydi yoki hardcoded
- Ranking: relevance, personalization, promoted slots yo‘q
- Recommendations: static slice(0,N), collaborative filtering yo‘q
- Portfolio public browse yo‘q — Contra-style discovery yo‘q
- Pagination yo‘q — scale qila olmaydi

## Marketplace xulosa

**Konversiya yo‘li yaxshi.** **Discovery stack demo darajasida.** Fiverr yarmini brochure, Upwork yarmini live — bu founder uchun strategik xavf.

---

# 6. Growth Audit

## Mavjud

- Web Share API (xizmat/profil)
- Invite to project (mijoz → mavjud loyiha)
- Saved wishlist (4 tab)
- Portfolio share analytics (owner uchun)

## Yetishmayotgan viral loop’lar

| Mexanizm | Holat |
|----------|-------|
| Referral codes / affiliate | ❌ |
| Invite friends → credit | ❌ |
| Mijoz → mijoz referral | ❌ |
| Frilanser → frilanser referral | ❌ |
| Embed widget (profil/gig) | ❌ |
| Waitlist / landing capture | ❌ |
| Email re-engagement (saved items) | ❌ |
| Price drop alerts | ❌ |

## SEO imkoniyatlari (hozir foydalanilmagan)

- `og:image`, per-page OG cards yo‘q
- `sitemap.xml`, `robots.txt` yo‘q
- JSON-LD (Product, Person, JobPosting) yo‘q
- Category landing pages yo‘q (`/services/design`, `/freelancers/tashkent`)
- Programmatic SEO (location × skill × category) yo‘q
- hreflang yo‘q (UZ/RU/EN selector route’ga ta’sir qilmaydi)
- Mixed EN/UZ copy SEO’ga zarar

## Retention imkoniyatlari

- Onboarding goals → personalized feed (❌)
- Skills → job match alerts (❌)
- Post-hire review prompt (❌)
- Weekly digest (❌)
- "Similar projects because you applied" (❌)
- Milestone celebrations (⚠️ faqat welcome)

---

# 7. Revenue Audit

## Mavjud monetizatsiya

| Model | Holat |
|-------|-------|
| Platform fee 5% | ✅ Checkout |
| Deposit fee 1% | ✅ Wallet |
| Escrow | ✅ To‘liq UX |
| Package tiers (Essential/Premium/Enterprise) | ✅ Xizmat narxlash |

## Yetishmayotgan biznes modellari

| Model | Raqobatchi analog | Potensial |
|-------|-------------------|-----------|
| **Featured profiles** | Fiverr Promoted | Yuqori — supply tomon |
| **Featured projects** | Upwork Featured Job | Yuqori — demand tomon |
| **Frilanser obuna (Plus)** | Fiverr Seller Plus | O‘rta — retention + tools |
| **Mijoz obuna (Business)** | Upwork Client Plus | O‘rta — jamoa feature bilan |
| **Verification plan (pullik tez)** | LinkedIn Premium | O‘rta — trust premium |
| **Proposal Connects** | Upwork Connects | Yuqori — supply monetization |
| **Boost / Promoted listings** | Barcha major | Yuqori |
| **Agency plan** | Upwork Business | O‘rta — B2B segment |
| **Team plan** | Fiverr Teams | O‘rta |
| **Featured homepage slots** | Barcha | O‘rta |
| **Lead gen fee** | Thumbtack | Past — hozir erta |
| **FX spread** | CA marketplaces | O‘rta — UZS/USD |

**Xavf:** Settings’da "Pro ro'yxatlar va yuqori eskrou limitlar" va’da qilingan, lekin **implement qilinmagan** — trust risk.

---

# 8. Trust Audit

## Mavjud trust elementlari

- EscrowShield, VerifiedIdentityBadge, LevelBadge, TrustGuaranteeCard
- ConversionFlowBanner (Xizmat → To'lov → Eskrou → Buyurtma)
- Portfolio case studies + admin featuring
- Reviews (localStorage + mock seed)
- Verification center UI
- trust-utils.ts (completion, verification, portfolio strength)

## Yetishmayotgan trust mexanizmlari

| Signal | Upwork/Fiverr | Ishbor |
|--------|---------------|--------|
| Profile completion % (actionable) | ✅ | ⚠️ UI only |
| Response rate (measured) | ✅ Ranking factor | ❌ Hardcoded |
| Hire success rate | ✅ | ❌ |
| Job Success Score (algorithm) | ✅ | ❌ Mock display |
| On-time delivery % | ✅ | ❌ Mock |
| Verified portfolio (admin approved) | ✅ | ⚠️ Admin feature, discovery’da yo‘q |
| Verified purchase reviews | ✅ | ❌ |
| KYC flow (real) | ✅ | ❌ Mock badges |
| Client reputation (for freelancers) | ✅ | ❌ |
| Dispute history transparency | ✅ | ⚠️ Partial |
| Payment protection badge on listing | ✅ | ⚠️ Checkout only |
| "Last active" / "Online now" | ✅ | ❌ |
| Identity video verification | ⚠️ | ❌ |

## Trust xulosa

Ishbor **trust UI’da kuchli**, **trust data’da zaif**. Markaziy Osiyoda pul ishonchi kritik — mock metrics bilan scale qilish xavfli.

---

# 9. Raqobiy tahlil

## Upwork vs Ishbor

| Upwork kuchli | Ishbor holati |
|---------------|---------------|
| Connects + proposal economy | ❌ |
| Job Success Score | Mock |
| Time tracking | ❌ |
| Enterprise/agency | ❌ |
| Global brand | ⚠️ CA focus — bu **differentiator** |
| Mature dispute resolution | ⚠️ User-side OK, admin yo‘q |

**Ishbor afzalligi:** Eskrou-first, mahalliy to‘lov (Humo/Uzcard), o‘zbek tilida UX, CA geo focus.

## Fiverr vs Ishbor

| Fiverr kuchli | Ishbor holati |
|---------------|---------------|
| Gig creation + packages | UI bor, supply yo‘q |
| Seller levels | Mock |
| Promoted gigs | ❌ |
| Order requirements questionnaire | ❌ |
| Revision enforcement | ❌ |
| Fast transaction velocity | ❌ (xizmatlar static) |

**Ishbor afzalligi:** Loyiha + xizmat dual model (potensial), portfolio case studies chuqurroq.

## Contra vs Ishbor

| Contra kuchli | Ishbor holati |
|---------------|---------------|
| Portfolio-first discovery | Portfolio bor, public browse yo‘q |
| Commission-free positioning | 5% fee (shaffof, lekin Contra’dan qimmat) |
| Clean creator UX | ⚠️ Yaxshi, lekin cluttered dashboard |
| No connects friction | ✅ Ishbor ham connects yo‘q — ikkalasi ham monetize qilmaydi supply |

**Ishbor afzalligi:** Escrow + loyiha modeli + CA localization.

## Toptal vs Ishbor

| Toptal kuchli | Ishbor holati |
|---------------|---------------|
| Vetted talent only | Verification mock |
| Premium positioning | ⚠️ Copy bor, vetting yo‘q |
| High-ticket projects | Budget range bor, curation yo‘q |

**Ishbor imkoniyati:** "Toptal for Central Asia" — premium tier + manual vetting = yuqori ARPU.

## Killer feature bo‘shliqlari

1. **Pullik boost + featured** — daromad + discovery
2. **Measured trust score** — conversion
3. **Job alerts** — supply retention
4. **Service creation** — Fiverr half activation
5. **Referral loop** — CAC reduction
6. **Agency accounts** — B2B segment
7. **Category SEO pages** — organic acquisition
8. **Real admin ops** — scale trust

---

# 10. Top 50 Yaxshilanishlar — Priority Roadmap

Har bir element: **Impact** (1–5), **Difficulty** (1–5), **Priority** (P0/P1/P2)

---

## P0 — Must Have (1–15)

| # | Yaxshilanish | Impact | Difficulty | Nima uchun muhim |
|---|-------------|--------|------------|------------------|
| 1 | **Onboarding → profile/portfolio persistence** | 5 | 3 | Frilanser onboarding tugatadi, profil bo‘sh — supply o‘ladi |
| 2 | **Orders + dashboard → real user-scoped data** | 5 | 2 | Mijoz o‘z buyurtmasini ko‘rmaydi — ikkinchi yollash yo‘q |
| 3 | **Admin verification → user verified flag** | 5 | 2 | Verification theater — ishonch buziladi |
| 4 | **Admin dispute/refund → escrow + wallet state** | 5 | 4 | Pul aylanishi boshlanganda hal qilib bo‘lmaydi |
| 5 | **Measured success score (orders asosida)** | 5 | 4 | Mock metrics bilan marketing qilish xavfli |
| 6 | **Guest conversion layer** (how-it-works + fees + register CTA) | 5 | 2 | Sovuq trafik konvert bo‘lmaydi |
| 7 | **Loyiha formasi preview (login oldin)** | 4 | 2 | Login devori konversiyani 40%+ tushirishi mumkin |
| 8 | **Service creation flow** (`/services/create`) | 5 | 4 | Fiverr yarimi brochure — GMV yarimi yo‘q |
| 9 | **Buyurtma → approve delivery → eskrou release → review (bitta oqim)** | 5 | 3 | Mijoz mental model buzilgan |
| 10 | **Hiring pipeline → real applications sync yoki olib tashlash** | 4 | 2 | Aldamchi UI ishonchni buzadi |
| 11 | **Real auth (OAuth + OTP)** | 5 | 4 | Demo auth investor/mijoz ishonchini buzadi |
| 12 | **Client proposals inbox (dashboard)** | 4 | 3 | 12 ta taklifni har loyihada qidirish — friktsiya |
| 13 | **Profile completion checklist (actionable CTAs)** | 4 | 2 | Trust score va conversion o‘sadi |
| 14 | **Moderation queue ← user report actions** | 4 | 3 | Report toast-only — closed loop yo‘q |
| 15 | **Verifiable social proof yoki "demo" labeling** | 4 | 1 | $42M+ da’vo tekshirib bo‘lmaydi — legal/trust risk |

---

## P1 — High Impact (16–35)

| # | Yaxshilanish | Impact | Difficulty | Nima uchun muhim |
|---|-------------|--------|------------|------------------|
| 16 | **Job alerts (skill/category match)** | 5 | 3 | Supply retention #1 — frilanser qaytadi |
| 17 | **Response rate measurement (messages)** | 4 | 3 | Ranking factor + trust signal |
| 18 | **Referral program (mijoz + frilanser)** | 5 | 4 | CAC ↓, viral loop |
| 19 | **Featured/Boost listings (pullik)** | 5 | 3 | Daromad + discovery — settings va’dasini bajarish |
| 20 | **Proposal Connects yoki application limits** | 4 | 3 | Supply monetization + proposal quality |
| 21 | **Category landing pages + SEO meta** | 4 | 3 | Organic acquisition CA bozorida |
| 22 | **JSON-LD + sitemap.xml** | 4 | 2 | Google JobPosting/Product rich results |
| 23 | **Unified search (services + talent + projects)** | 4 | 3 | Discovery friction ↓ |
| 24 | **Project filters** (budget, experience, verified client) | 4 | 2 | Frilanser vaqt tejaydi — retention |
| 25 | **Public portfolio browse + featured rail** | 4 | 3 | Contra-style differentiation |
| 26 | **Personalized home feed** (onboarding goals/skills) | 4 | 4 | Relevance = conversion |
| 27 | **Client analytics dashboard** (spend, hire velocity, ROI) | 4 | 3 | Mijoz retention + upsell |
| 28 | **Freelancer earnings → real wallet/orders data** | 4 | 2 | Daromad ishonchi — supply retention |
| 29 | **Availability toggle → profile + search sync** | 3 | 2 | "Available now" filter ishonchsiz |
| 30 | **Agency/team accounts** | 4 | 5 | B2B segment — onboarding’da intent bor |
| 31 | **Verification paid fast-track plan** | 3 | 3 | Trust premium + revenue |
| 32 | **Live activity feed (landing)** | 3 | 3 | Social proof — conversion |
| 33 | **Pricing/fees sahifasi** | 4 | 1 | Shaffoflik = trust |
| 34 | **Post-rejection proposal feedback** | 3 | 2 | Frilanser quality loop |
| 35 | **Admin real analytics (event pipeline)** | 4 | 5 | Founder weekly growth review uchun shart |

---

## P2 — Nice To Have (36–50)

| # | Yaxshilanish | Impact | Difficulty | Nima uchun muhim |
|---|-------------|--------|------------|------------------|
| 36 | **Seller level progression** (Rising → Top Rated → Expert) | 4 | 4 | Fiverr-style motivation loop |
| 37 | **Mijoz subscription (Business Plus)** | 3 | 4 | Recurring revenue |
| 38 | **Freelancer subscription (Seller Plus)** | 3 | 4 | Tools + lower fee tier |
| 39 | **Saved search alerts** | 3 | 3 | Pull retention |
| 40 | **Embed profile/gig widget** | 3 | 3 | Viral distribution |
| 41 | **Hourly time tracking** | 3 | 5 | Upwork parity — hourly contracts |
| 42 | **Contract/SOW generation** | 3 | 4 | Enterprise trust |
| 43 | **Interview scheduling (Calendly integration)** | 3 | 3 | Hiring pipeline to‘ldirish |
| 44 | **Order requirements questionnaire** (xizmat) | 3 | 2 | Fiverr parity |
| 45 | **Revision count enforcement** | 3 | 2 | Xizmat buyurtma sifati |
| 46 | **Fraud heuristics dashboard** | 4 | 5 | Scale oldin risk management |
| 47 | **CSAT + support macro templates** | 2 | 2 | Ops efficiency |
| 48 | **Programmatic SEO** (location × skill pages) | 4 | 4 | Long-tail organic CA |
| 49 | **"Toptal Premium" curated tier** | 4 | 5 | Yuqori ARPU segment |
| 50 | **Email digest + re-engagement** (saved, new jobs) | 3 | 3 | Retention without paid ads |

---

# Strategik Yo‘l Xaritasi

## Phase 1 — Trust Foundation (0–3 oy)

**Maqsad:** Demo → ishonchli marketplace

- #1, #2, #3, #4, #5, #9, #10, #11, #15
- KPI: Birinchi tranzaksiyadan keyin foydalanuvchi o‘z ma’lumotini ko‘radi
- KPI: Admin harakatlari haqiqiy state o‘zgartiradi

## Phase 2 — Liquidity Engine (3–6 oy)

**Maqsad:** Ikki tomondan likvidlik

- #8, #12, #16, #17, #22, #23, #24, #25, #28
- KPI: Xizmatlar soni o‘sadi (supply)
- KPI: Frilanser 7 kun ichida qaytadi (job alerts)

## Phase 3 — Growth & Revenue (6–12 oy)

**Maqsad:** O‘sish loop + monetizatsiya

- #18, #19, #20, #21, #26, #27, #30, #31, #35
- KPI: Referral % of signups > 10%
- KPI: Boost/featured revenue > 15% of GMV

## Phase 4 — Market Leadership (12+ oy)

**Maqsad:** CA #1 marketplace

- #36, #41, #46, #48, #49, #50
- KPI: Organic traffic > 40% of acquisition
- KPI: Premium tier ARPU > 3x standard

---

# Founder Decision Matrix

```
                    YUQORI IMPACT
                         │
     P0: Trust + Data    │    P1: Growth Loops
     (#1-15)             │    (#16-35)
                         │
  PAST ──────────────────┼────────────────── KIYIN
                         │
     P2: Parity          │    P1: Revenue
     (#36-50 partial)    │    (#19-20, #30-31)
                         │
                    PAST IMPACT
```

**Eng muhim 5 ta qaror:**

1. **Mock’ni haqiqatga aylantirish** — metrics, orders, earnings, admin actions
2. **Dual marketplace paritetini tiklash** — xizmat yaratish = loyiha yaratish darajasida oson
3. **O‘lchangan ishonch** — success score, response rate, verified reviews
4. **Supply retention** — job alerts + profile completion + real earnings
5. **Monetizatsiya 2.0** — boost, connects, subscription — faqat trust foundation’dan keyin

---

# Yakuniy Baho

| Yo‘nalish | Hozir | 12 oy maqsad |
|-----------|-------|--------------|
| Guest conversion | 55/100 | 80/100 |
| Client retention | 50/100 | 75/100 |
| Freelancer retention | 35/100 | 70/100 |
| Marketplace liquidity | 45/100 | 75/100 |
| Trust credibility | 60/100 | 85/100 |
| Revenue diversification | 25/100 | 60/100 |
| Admin ops readiness | 30/100 | 80/100 |
| Growth mechanics | 15/100 | 65/100 |

**Ishbor bugun:** Markaziy Osiyo uchun eng yaxshi **freelance marketplace demo**si.  
**Ishbor ertaga bo‘lishi kerak:** Markaziy Osiyodagi eng **ishonchli va o‘sib boruvchi** talent bozori.

Buning uchun kod emas — **mahsulot haqiqati, o‘sish loop’lari va operatsion tayyorgarlik** kerak.

---

*Audit: Founder / CTO / Head of Product / Head of Growth nuqtai nazaridan*  
*Standartlar: PROJECT_STANDARDS.md, DESIGN_GUARDRAILS1111.md*
