# PRODUCT_VISION.md

**Ishbor — Markaziy Osiyo freelance marketplace**  
**Version:** 1.0 · **Status:** Demo/MVP → Production roadmap  
**Supersedes:** scattered phase summaries for strategic direction  
**Related:** [PROJECT_BIBLE.md](../00-constitution/PROJECT_BIBLE.md), [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md)

---

## 1. Mission

Ishbor **mijozlar**, **frilanserlar** va **agentliklarni** bir joyda uchrashiradi — **escrow himoyalangan to'lov**, **ishonch signallari** va **o'zbek tilidagi UX** bilan.

**Missiya jumlasi:** Markaziy Osiyoda ish topish va ish berishni xavfsiz, tushunarli va mahalliy qilib qilish.

**North star (doimiy):** Birinchi muvaffaqiyatli escrow tranzaksiya → qayta yollash → platforma likvidligi.

Ishbor Fiverr yoki Upwork nusxasi emas. Bu **mintaqaviy marketplace MVP** bo'lib, quyidagi tsiklni isbotlaydi:

**yollash → to'lash → yetkazish → baholash**

---

## 2. Vision statement (3 yil)

### Yil 1 — Isbot va likvidlik (2026–2027)

**Maqsad:** O'zbekiston bozorida ishlaydigan, haqiqiy escrow tsikli va ishonch mexanizmlari bilan product-ready platforma.

| Ko'rsatkich | Maqsad |
|-------------|--------|
| Production stack | FastAPI + PostgreSQL + Redis + MinIO |
| Asosiy shaharlar | Toshkent, Samarqand, Farg'ona, Namangan |
| Demo → real tranzaksiya | Birinchi 100 ta escrow-yakunlangan buyurtma |
| Til | 100% foydalanuvchi interfeysi o'zbekcha |
| Auth | Cookie session, OTP (Payme/Click/Uzcard integratsiya yo'li) |

**MVP holati (hozir):** ~87% tayyorlik, localStorage demo, 110+ route, 48 store. Demo hisoblar:

| Email | Rol | Parol |
|-------|-----|-------|
| sardor@asaka.uz | Mijoz | demo1234 |
| nargiza@ishbor.uz | Frilanser | demo1234 |
| admin@ishbor.uz | Admin | demo1234 |

OTP demo: `123456`

### Yil 2 — Mintaqaviy kengayish (2027–2028)

**Maqsad:** O'zbekiston ichida chuqurlashtirish + Qozog'iston va Qirg'iziston pilot.

| Yo'nalish | Tavsif |
|-----------|--------|
| Agentliklar | B2B jamoalar, `/agencies`, `/dashboard/agency`, CRM |
| To'lovlar | Uzcard, Humo, Payme, Click — mahalliy gatewaylar |
| AI yordam | `/ai/*` — taklif, loyiha, portfolio, ishonch murabbiyi |
| Obuna iqtisodiyoti | Pro (99 000 UZS/oy), Elite (249 000 UZS/oy) barqaror konversiya |

**Likvidlik signali:** Oylik GMV o'sishi, frilanser qayta yollanish darajasi ≥ 25%.

### Yil 3 — Mintaqaviy yetakchi (2028–2029)

**Maqsad:** Markaziy Osiyoda escrow-asosli freelance uchun birinchi tanlov.

| Ko'rsatkich | Maqsad |
|-------------|--------|
| Faol foydalanuvchilar | 50 000+ ro'yxatdan o'tgan, 5 000+ oylik faol |
| GMV | Yillik $10M+ ekvivalent (UZS asosida hisob) |
| Agentlik ulushi | Buyurtmalarning 20%+ agentlik orqali |
| Ishonch | Verification, dispute resolution SLA, audit trail |

---

## 3. Target users (Markaziy Osiyo)

### 3.1 Mijozlar (Client)

**Kim:** Kichik bizneslar, startaplar, marketing agentliklari, IT kompaniyalar, davlat tashkilotlari loyiha buyurtmachilari.

**Muammo:** Global platformalarda o'zbek tilida muloqot qiyin; to'lov va soliq mahalliy emas; ishonch past.

**Ishbor yechimi:**

- Loyiha e'lon qilish: `/projects/create`, `/my-projects`
- Takliflarni ko'rib chiqish: `/projects/$slug`, `applications-store`
- Escrow checkout: `/checkout` → `orders-store`, `escrow-store`
- CRM: `/clients/manage` — yollangan frilanserlar

**Asosiy dashboard:** `/dashboard`

**Onboarding:** `/onboarding/company` — kompaniya, soha, jamoa, maqsadlar

### 3.2 Frilansers

**Kim:** Dizaynerlar, dasturchilar, kontent yozuvchilar, SMM mutaxassislari, tarjimonlar, video montajchilar.

**Muammo:** Xalqaro raqobat, past narx bosimi, to'lov kechikishi, portfolio ko'rinmasligi.

**Ishbor yechimi:**

- Xizmat paketlari: `/services/create`, `/my-services`
- Portfolio: `/portfolio/create`, `/portfolio/edit/$slug`
- Takliflar: `/applications`, `/projects`
- Promotsiya: `/promotions` — kreditlar, ajratilgan ro'yxat (100 000 UZS, 7 kun)
- Obuna: `/subscription`, `/pricing`

**Asosiy dashboard:** `/dashboard/freelancer`

### 3.3 Agentliklar (Agency)

**Kim:** 3–20 kishilik dizayn, marketing, IT agentliklari.

**Muammo:** Jamoa boshqaruvi, bir nechta loyiha, mijoz pipeline, brend ishonchi.

**Ishbor yechimi:**

- Yaratish: `/agencies/create`
- Jamoa: `/dashboard/agency` — owner, manager, recruiter, freelancer rollari
- CRM: `/agency/clients` — `view_crm` ruxsati
- Case study va verification so'rov

**Rollar:** owner, manager, recruiter, freelancer (member)

### 3.4 Admin va platforma operatorlari

**Kim:** Ishbor ichki jamoasi — support, finance, moderation.

**Yo'l:** `/admin` — users, verifications, disputes, escrow, revenue (`/revenue`)

**Rollar:** super_admin, finance_admin, support_admin, moderator

---

## 4. Core value proposition

| Qatlam | Qiymat | Ishbor manifesti |
|--------|--------|------------------|
| Xavfsizlik | Escrow | Har to'lov oqimida EscrowShield; milestone release |
| Ishonch | Verification + reviews | Faqat yakunlangan buyurtmadan keyin baho; tasodifiy ball yo'q |
| Mahalliylik | O'zbek UX | Barcha CTA, xato, bo'sh holat — o'zbekcha |
| Aniqlik | "Keyin nima qilaman?" | Har sahifada Primary + Secondary + Empty State CTA |
| Shaffoflik | 5% platforma to'lovi | Checkoutda aniq ko'rsatiladi; yashirin komissiya yo'q |

**Transaction types (PRODUCT_BIBLE §2):**

1. **Project hire** — loyiha → taklif → qabul → checkout → escrow
2. **Direct service** — xizmat paketi → checkout → buyurtma
3. **Direct hire** — profildan yollash → checkout

**Pul oqimi:** Mijoz escrow fund qiladi → milestone release → frilanser hamyon → yechib olish (demo/production).

---

## 5. Differentiation vs global platforms

### 5.1 Upwork / Fiverr / Freelancer.com

| Global platform | Cheklovi | Ishbor afzalligi |
|-----------------|----------|------------------|
| Ingliz tilida majburiy | O'zbek/Rus bozorida barrier | To'liq o'zbek interfeys, mahalliy terminologiya |
| USD-centric to'lov | UZS, Uzcard, Humo qiyin | Payme, Click, mahalliy hamyon (`/wallet`) |
| Generic trust | Mintaqaga mos emas | Verification, Success Score, Trust Score — `growth-metrics` formulasi |
| Yuqori komissiya (10–20%) | Kichik biznes uchun og'ir | **5% platform fee** checkoutda |
| Global raqobat | Yangi frilanser ko'rinmaydi | Featured listings, Pro/Elite ranking boost, AI matching |

### 5.2 Mahalliy Telegram guruhlari / ijtimoiy tarmoq

| Kanal | Cheklovi | Ishbor afzalligi |
|-------|----------|------------------|
| Shartnoma yo'q | Nizolar hal qilinmaydi | Escrow + `/admin/disputes` |
| To'lov oldindan/risk | Firibgarlik | Milestone release, audit log |
| Portfolio tarqoq | Ishonch past | Birlashtirilgan profil, portfolio, xizmatlar |
| Qidiruv yo'q | Vaqt yo'qotish | `/services`, `/projects`, `/freelancers`, universal qidiruv |

### 5.3 Mintaqaviy raqobatchilar (kelajak)

Ishbor **escrow + agentlik + AI + o'zbek-first** kombinatsiyasi bilan pozitsiyalanadi — faqat "ish e'lonlari doskasi" emas, to'liq **hire → pay → deliver → review** tsikli.

---

## 6. Product principles (vision guardrails)

1. **No dead actions** — har tugma navigatsiya, mutatsiya yoki modal qiladi
2. **Complete visible features** — yashirish emas, tugatish
3. **No coming-soon copy** — bo'sh funksiya bo'lmasin
4. **Uzbek-first** — mahsulot tili o'zbek; ingliz faqat texnik hujjatlarda
5. **Trust by computation** — Success/Trust score tasodifiy emas, `growth-metrics.ts` formulasi
6. **Role clarity** — client vs freelancer vs agency vs admin — alohida dashboard va gate
7. **Defense in depth auth** — `beforeLoad` + AuthGate/RoleGate/AgencyGate/AdminOnlyGate
8. **Primary color #2563EB** — branding o'zgartirilmaydi (explicit approvalsiz)

---

## 7. Strategic milestones map

```
2026 Q2–Q3   Demo MVP barqaror (Phase 28, ~87%)
2026 Q4      FastAPI + PostgreSQL + Redis + MinIO production yo'li
2027 H1      Birinchi 1 000 escrow-yakunlangan buyurtma (O'zbekiston)
2027 H2      Agentlik va B2B CRM kuchaytirish
2028         Qozog'iston / Qirg'iziston pilot
2029         Mintaqaviy yetakchi pozitsiya — GMV va qayta yollash asosida
```

---

## 8. What Ishbor is NOT

- Fiverr kloni yoki generic SaaS shablon
- Faqat admin demo panel
- Global ingliz-only marketplace
- Supabase yoki boshqa BaaS ga bog'langan mahsulot (stack: **FastAPI, PostgreSQL, Redis, MinIO**)
- "Coming soon" ekranlar to'plami

---

## 9. Success definition by horizon

| Gorizont | Muvaffaqiyat |
|----------|--------------|
| 6 oy | Production auth + birinchi real escrow; dead action 0 |
| 12 oy | 500+ faol frilanser; oylik GMV barqaror o'sish |
| 24 oy | Agentliklar 15%+ buyurtma ulushi; Pro/Elite MRR |
| 36 oy | Markaziy Osiyoda escrow freelance uchun tan olingan brend |

---

## 10. Document relationships

| Hujjat | Bog'lanish |
|--------|------------|
| [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) | Daromad oqimlari |
| [MONETIZATION_STRATEGY.md](./MONETIZATION_STRATEGY.md) | Obuna, kredit, referral |
| [KPI_METRICS.md](./KPI_METRICS.md) | Vision KPI lar |
| [GROWTH_STRATEGY.md](./GROWTH_STRATEGY.md) | Supply/demand o'sish |
| [PLAN.md](./PLAN.md) | Product-ready roadmap (P1–P10) |
| [11-backend/README.md](../11-backend/README.md) | Production arxitektura |

---

*Vision o'zgarganda avval PROJECT_BIBLE, keyin bu hujjat yangilanadi.*
