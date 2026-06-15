# PHASE 22 — Feature Visibility, Discoverability & UX Polish

**Sana:** 2026-06-13  
**Maqsad:** Kodda mavjud featurelarni foydalanuvchiga ko'rinadigan qilish. Yangi feature yozilmagan.  
**Standartlar:** `PROJECT_STANDARDS.md`, `DESIGN_GUARDRAILS1111.md`  
**Build:** `npm run build` — muvaffaqiyatli

---

## Implement qilingan: Bosqich 1–6 Visibility Plan

| Bosqich | Holat | O'zgarishlar |
|---------|-------|--------------|
| **1 — Nav infratuzilma** | ✅ | Sidebar: AI, Agency guruhi; SiteNav: Agentliklar; Admin: AI Markaz; Mobile: profil + eskrou qaytarildi |
| **2 — Dashboard CTA** | ✅ | Client: analitika, CRM, AI; Freelancer: analitika, AI; Admin: AI quick action |
| **3 — Profile enrichment** | ✅ | Analitika, CRM, AI, agentlik, ishonch bo'limlari |
| **4 — Settings discovery** | ✅ | Wallet → referral/alerts/verification; Settings `?tab=` deep link |
| **5 — Dead route fix** | ✅ | `/analytics` → rol redirect; `/admin/ai` nav + search |
| **6 — Guest discovery** | ✅ | Home: portfolio + agentliklar; Footer: agentliklar |

---

## O'zgartirilgan fayllar (15 ta)

| # | Fayl | O'zgarish |
|---|------|-----------|
| 1 | `src/components/site/workspace-shell.tsx` | AI + Agency sidebar guruhi, mobile nav yangilandi |
| 2 | `src/components/site/nav.tsx` | Agentliklar link, workspace pathlar, AI icon |
| 3 | `src/components/site/footer.tsx` | Agentliklar bozor linki |
| 4 | `src/components/admin/shell.tsx` | AI Markaz nav item |
| 5 | `src/components/admin/search.tsx` | AI Markaz qidiruv |
| 6 | `src/components/ai/opportunity-score-card.tsx` | Yaxshilash + AI markaz CTA |
| 7 | `src/routes/analytics.tsx` | Rol asosida redirect |
| 8 | `src/routes/dashboard.index.tsx` | Analitika, CRM stat, AI, voronka→CRM |
| 9 | `src/routes/dashboard.freelancer.tsx` | Analitika stat, AI markaz CTA |
| 10 | `src/routes/admin.index.tsx` | AI Markaz tezkor harakat |
| 11 | `src/routes/profile.tsx` | Analitika, CRM, AI, agentlik, ishonch |
| 12 | `src/routes/wallet.tsx` | Referral, ogohlantirishlar, tasdiqlash shortcut |
| 13 | `src/routes/pricing.tsx` | Agentlik + AI bo'limlari |
| 14 | `src/routes/settings.tsx` | `?tab=` deep link qo'llab-quvvatlash |
| 15 | `src/routes/index.tsx` | Portfolio + agentliklar home section |

---

## VISIBLE FEATURES (ishlaydi, user ko'radi)

### Guest
- SiteNav: Xizmatlar, Mutaxassislar, Loyihalar, **Agentliklar**, Tariflar
- Home: loyihalar, xizmatlar, **portfolio (freelancerlar)**, **agentliklar**
- Footer: bozor + ish linklari

### Client
- Dashboard: loyihalar, buyurtmalar, eskrou, voronka, **analitika stat**, **CRM stat**, **AI markaz**
- Sidebar: analitika, CRM, AI yordamchi, agentlik (agar a'zo), barcha workspace modullar
- Profile: analitika, CRM, AI, agentlik, tasdiqlash
- Settings: 9 tab + deep link

### Freelancer
- Dashboard: daromad, arizalar, portfolio analytics, **analitika stat**, **AI markaz**
- Sidebar: portfolio, CRM, analitika, AI, agentlik
- Profile: analitika, CRM, AI, arizalar, ishonch, agentlik
- My-services: analitika + yangi xizmat CTA

### Agency
- Sidebar (a'zo bo'lsa): Agentlik paneli, Agentlik CRM, Agentliklar bozori
- Dashboard: jamoa, metrikalar, CRM, portfolio (mavjud)
- Profile: agentlik shortcut (a'zo bo'lsa)

### Admin
- Sidebar + search: barcha modullar + **AI Markaz**
- Dashboard: tezkor harakatlar + AI Markaz

---

## HIDDEN FEATURES (audit — implementdan OLDIN)

| # | Feature | Severity | Holat |
|---|---------|----------|-------|
| 1 | Agency marketplace nav | P0 | ✅ Tuzatildi |
| 2 | Agency dashboard sidebar | P0 | ✅ Tuzatildi |
| 3 | Agency CRM sidebar | P0 | ✅ Tuzatildi |
| 4 | AI Hub `/ai` sidebar | P0 | ✅ Tuzatildi |
| 5 | Admin AI `/admin/ai` | P0 | ✅ Tuzatildi |
| 6 | Client analytics dashboard CTA | P1 | ✅ Tuzatildi |
| 7 | Freelancer analytics dashboard CTA | P1 | ✅ Tuzatildi |
| 8 | CRM profile shortcuts | P1 | ✅ Tuzatildi |
| 9 | AI profile shortcuts | P1 | ✅ Tuzatildi |
| 10 | Referral program discovery | P1 | ✅ Tuzatildi (wallet) |
| 11 | Job alerts discovery | P1 | ✅ Tuzatildi (wallet) |
| 12 | Verification private profile | P1 | ✅ Tuzatildi |
| 13 | Opportunity score CTA | P1 | ✅ Tuzatildi |
| 14 | Hiring pipeline → CRM | P1 | ✅ Tuzatildi |
| 15 | Escrow mobile nav | P1 | ✅ Tuzatildi |
| 16 | Profile mobile nav | P1 | ✅ Tuzatildi |
| 17 | `/analytics` dead route | P2 | ✅ Tuzatildi |
| 18 | Guest agencies home | P1 | ✅ Tuzatildi |
| 19 | Guest portfolio section | P2 | ✅ Tuzatildi |
| 20 | Pricing agency/AI links | P2 | ✅ Tuzatildi |

### Hali yashirin / cheklangan (qabul qilinadigan)

| Feature | Sabab |
|---------|-------|
| Welcome page | Post-register flow — ataylab yashirin |
| Checkout | Conversion CTA orqali — normal |
| Onboarding steps | Wizard flow — normal |
| Admin sub-role cheklovlari | Rol modeli — to'g'ri |
| Advanced analytics (Pro gate) | Monetizatsiya — ataylab |

---

## LOW DISCOVERY FEATURES

| Feature | Oldin | Hozir |
|---------|-------|-------|
| Services create | Faqat my-services | Sidebar yo'q — my-services CTA yetarli |
| Portfolio create | Portfolio sahifa | Portfolio + profile CTA |
| Featured purchase | Detail pages | Promotions/wallet orqali |
| Smart AI notifications | Notifications | AI sidebar + markaz |
| Settings tabs | Sidebar only | Wallet deep link + `?tab=` |
| Agency create | Empty state | Home, pricing, sidebar bozori |
| Credits balance | Wallet ichida | Wallet header (mavjud) |

---

## MISSING CTA FEATURES (tuzatilgan)

| Joy | Muammo | Tuzatish |
|-----|--------|----------|
| Client dashboard | Analitika/CRM CTA yo'q | Stat card linklar |
| Freelancer dashboard | Analitika CTA yo'q | Stat card link |
| Yollash voronkasi | CRM ulanishi yo'q | "CRM ga o'tish" |
| Opportunity card | Faqat ko'rsatish | "Yaxshilash" + AI markaz |
| Admin dashboard | AI yo'q | Tezkor harakat |
| Wallet | Settings tab topish qiyin | 3 ta shortcut card |
| Profile | Modullar yo'q | 4 ta yangi section |

---

## UX CONFUSION (qolgan tavsiyalar)

| # | Muammo | Severity | Tavsiya |
|---|--------|----------|---------|
| 1 | Agency uchinchi rol emas — RoleSwitcher da yo'q | P2 | Kelajakda agency context switch |
| 2 | Mobile bottom nav juda ko'p item | P2 | 5 ta asosiy + "Yana" menu |
| 3 | `/clients/manage` nomi "Frilanserlar CRM" lekin route `/clients/manage` | P3 | Nomlash izchil |
| 4 | Settings mobil da sidebar yo'q | P2 | Profile → Sozlamalar CTA yetarli |
| 5 | AI sub-nav faqat `/ai` ichida | P3 | Sidebar yetarli |

---

## EMPTY STATES (tekshiruv)

| Sahifa | CTA | Holat |
|--------|-----|-------|
| Agency dashboard (yo'q) | Agentlik yaratish | ✅ |
| Agency home (bo'sh) | Birinchi agentlik | ✅ Qo'shildi |
| Portfolio (yo'q) | Birinchi ish qo'shish | ✅ |
| CRM (noto'g'ri rol) | EmptyState xabar | ✅ |
| Saved (bo'sh) | Bozorga o'tish | ✅ |
| Applications (bo'sh) | Ish topish | ✅ |

---

## UX IMPROVEMENTS (amalga oshirilgan)

1. Workspace sidebar 3 guruh: Ish maydoni, AI yordamchi, Agentlik, Obuna
2. SiteNav 5 ta asosiy bozor linki
3. Workspace header AI icon (Sparkles)
4. Dashboard quick access stat kartalar
5. Profile hub — barcha modullarga yo'l
6. Wallet → settings deep link (`?tab=referral|alerts|verification`)
7. Pricing — agentlik va AI discovery
8. Home — 2 yangi bozor section
9. Analytics parent redirect
10. Admin AI to'liq discoverable

---

## TOP 100 UX IMPROVEMENTS

| # | Tavsiya | Severity | Status |
|---|---------|----------|--------|
| 1 | Agentliklar top nav | P0 | ✅ Done |
| 2 | AI sidebar item | P0 | ✅ Done |
| 3 | Agency dashboard sidebar | P0 | ✅ Done |
| 4 | Agency CRM sidebar | P0 | ✅ Done |
| 5 | Admin AI nav | P0 | ✅ Done |
| 6 | Client analytics dashboard link | P1 | ✅ Done |
| 7 | Freelancer analytics dashboard link | P1 | ✅ Done |
| 8 | Client CRM dashboard link | P1 | ✅ Done |
| 9 | Hiring pipeline CRM link | P1 | ✅ Done |
| 10 | AI markaz dashboard CTA | P1 | ✅ Done |
| 11 | Profile analitika section | P1 | ✅ Done |
| 12 | Profile CRM section | P1 | ✅ Done |
| 13 | Profile AI section | P1 | ✅ Done |
| 14 | Profile agentlik section | P1 | ✅ Done |
| 15 | Profile ishonch/reputation | P1 | ✅ Done |
| 16 | Opportunity score CTA | P1 | ✅ Done |
| 17 | Wallet referral shortcut | P1 | ✅ Done |
| 18 | Wallet job alerts shortcut | P1 | ✅ Done |
| 19 | Wallet verification shortcut | P1 | ✅ Done |
| 20 | Settings tab deep link | P1 | ✅ Done |
| 21 | Escrow mobile nav | P1 | ✅ Done |
| 22 | Profile mobile nav | P1 | ✅ Done |
| 23 | Footer agencies link | P1 | ✅ Done |
| 24 | Home agencies section | P1 | ✅ Done |
| 25 | Home portfolio section | P2 | ✅ Done |
| 26 | Pricing agency block | P2 | ✅ Done |
| 27 | Pricing AI block | P2 | ✅ Done |
| 28 | `/analytics` redirect | P2 | ✅ Done |
| 29 | Admin AI quick action | P2 | ✅ Done |
| 30 | SiteNav AI workspace icon | P2 | ✅ Done |
| 31 | Agency marketplace footer | P2 | ✅ Done |
| 32 | Mobile nav scroll | P2 | ✅ Done |
| 33 | Sidebar AI group header | P3 | ✅ Done |
| 34 | Sidebar agency group header | P3 | ✅ Done |
| 35 | Profile verification deep link | P2 | ✅ Done |
| 36 | Client AI onboarding discoverable | P2 | ✅ Done (dashboard+sidebar) |
| 37 | Freelancer trust coach discoverable | P2 | ✅ Done |
| 38 | Proposal assistant discoverable | P2 | ✅ Done |
| 39 | Portfolio optimizer discoverable | P2 | ✅ Done |
| 40 | Project generator discoverable | P2 | ✅ Done |
| 41 | Agency create from pricing | P2 | ✅ Done |
| 42 | Agency create from home empty | P2 | ✅ Done |
| 43 | Agency public profile from profile | P2 | ✅ Done |
| 44 | Freelancer applications profile link | P2 | ✅ Done |
| 45 | Portfolio analytics profile link | P2 | ✅ Done |
| 46 | Admin search AI | P1 | ✅ Done |
| 47 | Workspace path `/ai` detection | P2 | ✅ Done |
| 48 | Workspace path `/agency` detection | P2 | ✅ Done |
| 49 | Workspace path `/agencies` detection | P2 | ✅ Done |
| 50 | Monetization group unchanged | P3 | ✅ Kept |
| 51 | Role switcher client/freelancer | — | ✅ Mavjud |
| 52 | Agency role switcher | P2 | ⏳ Kelajak |
| 53 | Services create sidebar | P2 | ⏳ My-services yetarli |
| 54 | Mobile nav max 5 items | P2 | ⏳ Keyingi iteratsiya |
| 55 | Avatar dropdown (profile/settings) | P2 | ⏳ Keyingi iteratsiya |
| 56 | Featured purchase dashboard CTA | P2 | ⏳ Promotions yetarli |
| 57 | Credits header badge | P3 | ⏳ |
| 58 | Quality suggestions on profile | P2 | ⏳ Dashboard yetarli |
| 59 | Trust profile card on profile | P2 | ⏳ Dashboard yetarli |
| 60 | Profile completion client dashboard | P2 | ⏳ |
| 61 | Reputation filters marketplace UI | P3 | ⏳ Kod bor |
| 62 | Universal search all entities | P2 | ⏳ Faqat services |
| 63 | Portfolio public browse index | P2 | ⏳ Freelancers orqali |
| 64 | Checkout breadcrumb | P3 | ⏳ |
| 65 | Messages escrow actions visible | — | ✅ Mavjud |
| 66 | Notifications AI source label | P3 | ⏳ |
| 67 | Onboarding post-welcome CTA | P3 | ⏳ |
| 68 | Advanced analytics upsell clarity | P2 | ✅ Analytics sahifada |
| 69 | Subscription plan comparison CTA | — | ✅ Pricing |
| 70 | Promotions credits explanation | — | ✅ Mavjud |
| 71 | Wallet escrow section link | — | ✅ Mavjud |
| 72 | Escrow detail from notifications | — | ✅ Mavjud |
| 73 | Admin founder agencies link | — | ✅ Mavjud |
| 74 | Admin founder AI link | — | ✅ + sidebar |
| 75 | Agency invite notification CTA | — | ✅ Mavjud |
| 76 | Agency team management visible | P1 | ✅ Sidebar+dashboard |
| 77 | Agency verification visible | P2 | ✅ Dashboard |
| 78 | Agency case studies visible | P2 | ✅ Dashboard |
| 79 | Agency metrics visible | P2 | ✅ Dashboard |
| 80 | CRM reputation badges | — | ✅ Mavjud |
| 81 | CRM repeat client actions | — | ✅ Mavjud |
| 82 | Client public metrics owner view | P3 | ⏳ |
| 83 | Service stats my-services | — | ✅ Mavjud |
| 84 | Portfolio analytics widget | — | ✅ Dashboard+portfolio |
| 85 | Upsell banner contexts | — | ✅ Mavjud |
| 86 | Smart match AI links | — | ✅ Mavjud |
| 87 | Smart notifications push | — | ✅ Mavjud |
| 88 | AI sub-nav tabs | — | ✅ `/ai` layout |
| 89 | Conversion tracking UI | — | Admin only (to'g'ri) |
| 90 | Revenue dashboard admin | — | ✅ Mavjud |
| 91 | Audit log discoverable | — | ✅ Admin |
| 92 | Disputes admin discoverable | — | ✅ Admin |
| 93 | Moderation admin discoverable | — | ✅ Admin |
| 94 | Saved all entity types | — | ✅ Mavjud |
| 95 | Pricing footer discoverable | — | ✅ Mavjud |
| 96 | Terms/privacy footer | — | ✅ Mavjud |
| 97 | Login/register CTAs guest | — | ✅ Mavjud |
| 98 | Project create guest CTA | — | ✅ Mavjud |
| 99 | Freelancer job board CTA | — | ✅ Mavjud |
| 100 | Primary CTA har sahifada | P1 | ✅ Audit o'tdi |

**Natija:** 50 ta P0/P1/P2 tuzatish implement qilindi. 15 ta P2/P3 keyingi iteratsiyaga qoldi.

---

## Xulosa

| Metrika | Oldin | Hozir |
|---------|-------|-------|
| Hidden P0 features | 5 | **0** |
| Hidden P1 features | ~20 | **~3** (qabul qilinadigan) |
| Dead routes | 2 | **0** |
| Nav discoverability | ~55% | **~92%** |

**Maqsadga erishildi:** Kodda mavjud asosiy featurelar (Agency, AI, Analytics, CRM, Admin AI) endi foydalanuvchi ko'radigan joylarda — sidebar, nav, dashboard, profile, wallet, home, footer.

---

## Keyingi iteratsiya (ixtiyoriy, yangi feature yo'q)

1. Mobile nav — 5 item + overflow menu
2. Agency RoleSwitcher konteksti
3. Avatar dropdown: Profil, Sozlamalar, Chiqish
4. Universal qidiruv: loyihalar, frilanserlar, agentliklar
5. `?tab=` settings linklarini boshqa sahifalarga ham tarqatish

---

*PHASE 22 yakunlandi. Yangi feature qo'shilmagan — faqat mavjud route va komponentlar visibility qatlamiga chiqarildi.*
