# GROWTH_STRATEGY.md

**Ishbor — Markaziy Osiyo freelance marketplace**  
**Version:** 1.0 · **Status:** Demo growth loops live · Scaled acquisition planned  
**Related:** [PRODUCT_VISION.md](./PRODUCT_VISION.md), [KPI_METRICS.md](./KPI_METRICS.md), [MONETIZATION_STRATEGY.md](./MONETIZATION_STRATEGY.md)

---

## 1. Growth thesis

Ishbor o'sishi **likvidlik tsikli** atrofida aylanadi:

**Supply (frilanser/agentlik) + Demand (mijoz loyihalari) + Trust (escrow) → GMV → qayta yollash → viral referral**

Global paid acquisition hozir MVP emas (`FUTURE_ROADMAP`). Asosiy strategiya: **Uzbek-first product-led growth**, mahalliy ishonch, va ikki tomonlama marketplace balansi.

**North star:** Birinchi muvaffaqiyatli escrow → repeat hire → platform liquidity.

---

## 2. Two-sided marketplace balance

### 2.1 Supply-demand health

| Signal | Supply ortiqcha | Demand ortiqcha |
|--------|-----------------|-----------------|
| Ko'rsatkich | Ko'p taklif, kam qabul | Ko'p loyiha, kam taklif |
| Harakat | Mijoz acquisition | Frilanser recruitment |
| Product lever | `/projects/create` CTA kuchaytirish | `/projects` apply CTA, AI matching |
| Monetization | Client checkout osonlashtirish | Pro obuna, featured |

**Maqsad nisbati (Yil 1):** Har published loyihaga o'rtacha 3–8 taklif; frilanser win rate 10–20%.

### 2.2 Liquidity milestones

| Bosqich | Mijoz | Frilanser | GMV signal |
|---------|-------|-----------|------------|
| Seed | 50 faol | 200 ro'yxat | Demo + first real escrow |
| Local | 500 | 2 000 | Oylik GMV barqaror |
| Regional | 5 000 | 10 000 | Qo'shni mamlakat pilot |

---

## 3. Client supply strategy (demand side)

### 3.1 Target client segments (O'zbekiston)

| Segment | Ehtiyoj | Ishbor hook |
|---------|---------|-------------|
| Kichik biznes | SMM, dizayn, veb | `/services` direct buy |
| Startaplar | MVP, branding | `/projects/create` |
| IT kompaniyalar | Outsource dev | Agentlik `/agencies` |
| Marketing agentliklari | Subcontract | CRM `/clients/manage` |

**Geografiya:** Toshkent (birinchi) → Samarqand, Farg'ona, Namangan → viloyat markazlari

### 3.2 Client acquisition channels

| Kanal | MVP holat | Taktika |
|-------|-----------|---------|
| Product-led | ✅ Live | Public discovery — login wall faqat create/hire/pay |
| SEO | ⚠️ Planned | Category landing (Uzbek keywords) |
| Referral (client) | ⚠️ Partial | Referral hozir frilanser kredit; client bonus kelajak |
| Partnership | Future | IT parklar, kovorking, biznes assotsiatsiyalar |
| Content | Future | "Qanday xavfsiz frilanser yollash" o'zbek kontent |

### 3.3 Client activation funnel

**Route oqimi:**

```
/ (hero qidiruv)
  → /projects yoki /services (discovery)
  → /register (login wall — create/hire)
  → /onboarding/company
  → /dashboard (client)
  → /projects/create (supply!)
  → takliflarni ko'rish /projects/$slug
  → /checkout (GMV)
  → /escrow (trust)
  → /clients/manage (retention)
```

**FTUE:** `ftue-store` — GettingStartedCard, JourneyMap, TrustTip

**Keyin nima qilaman:** Har client dashboard sahifasida Primary CTA — loyiha yaratish yoki xizmat qidirish.

### 3.4 Client retention

| Lever | Route / store |
|-------|---------------|
| CRM | `/clients/manage`, crm-store |
| Saved | `/saved`, saved-store |
| Analytics | `/analytics/client` |
| Notifications | `/notifications` — yangi taklif, order status |
| Repeat hire | Order detail → frilanser profil → checkout |

**Maqsad:** 90 kun ichida 15%+ client repeat hire (Yil 1) → 30% (Yil 3)

---

## 4. Freelancer supply strategy (supply side)

### 4.1 Target freelancer segments

| Kategoriya | Misol | Route |
|------------|-------|-------|
| Dizayn | UI/UX, grafik | `/portfolio`, `/services` |
| Development | Web, mobile | `/projects` apply |
| Content | Copy, tarjima | `/services/create` |
| Marketing | SMM, SEO | `/promotions` featured |
| Video | Montaj, motion | portfolio showcase |

### 4.2 Freelancer acquisition

| Kanal | Taktika |
|-------|---------|
| Uzbek-first UX | Raqobatchidan farq — to'liq o'zbek interfeys |
| Free tier | 10 taklif/oy — kirish barrier past |
| AI tools | `/ai/*` — proposal assistant, portfolio optimizer |
| University / bootcamp | Rising talent pipeline (partnership future) |
| Telegram communities | Organic — portfolio link `/freelancers/$username` |

### 4.3 Freelancer activation funnel

```
/register
  → /onboarding/skills (kategoriya, portfolio, tillar)
  → /welcome, ftue-store
  → /dashboard/freelancer
  → /services/create YOKI /projects apply
  → /applications (pipeline)
  → birinchi qabul → order → review (trust score boshlanadi)
  → /pricing → Pro upgrade (limit hit)
```

**Demo account:** nargiza@ishbor.uz / demo1234 — frilanser journey test

### 4.4 Freelancer retention and monetization

| Lever | Maqsad |
|-------|--------|
| Win rate tracking | `getWinRate` — AI proposal assistant |
| Success score | `computeSuccessScore` — quality signal |
| Pro/Elite | Taklif limit → upgrade |
| Featured | `/promotions` — visibility |
| Wallet | `/wallet` — tez to'lov ishonchi |

**Ranking boost:** Pro +10, Elite +25 — `getPlanRankingBoost`

---

## 5. Referral program

### 5.1 Current mechanics (referral-store)

| Parametr | Qiymat |
|----------|--------|
| Mukofot | 50 000 UZS kredit |
| Trigger | Referred user meaningful activation |
| Link | `/register?ref={CODE}` |
| UI | `/settings` referral tab |
| Stats | total, completed, pending |

### 5.2 Referral growth loop

```
Mavjud frilanser → share link (settings)
    → yangi user register
    → onboarding + first proposal/service
    → completeReferral → referrer +50k kredit
    → kredit → featured purchase → visibility
    → ko'proq buyurtma → GMV
```

### 5.3 Referral optimization roadmap

| Phase | Yaxshilash |
|-------|------------|
| MVP (live) | Frilanser kredit mukofot |
| Phase 2 | Mijoz referral — checkout credit |
| Phase 3 | Two-sided bonus — ikkala tomonga |
| Phase 4 | Tiered rewards — 5+ referral → Elite discount |

**Anti-fraud:** Self-referral block; admin moderation; meaningful action gate

### 5.4 KPI (referral)

| Metrika | Yil 1 maqsad |
|---------|--------------|
| Referral signups / total signups | 10% |
| Pending → completed | 50%+ |
| Referral credit → featured spend | 60%+ |
| CAC equivalent | < 100 000 UZS |

---

## 6. SEO strategy (Uzbek-first)

### 6.1 MVP state

Hozir: universal qidiruv `/` hero, public routes indekslanishi mumkin. To'liq SEO kampaniya `FUTURE_ROADMAP` da.

### 6.2 Target keywords (O'zbek)

| Intent | Keyword cluster | Target route |
|--------|-----------------|--------------|
| Hire | "frilanser yollash", "masofadan ish buyurtma" | `/`, `/freelancers` |
| Work | "freelance ish topish", "masofadan ishlash" | `/projects` |
| Service | "smm xizmat narxi", "logo dizayn buyurtma" | `/services` |
| Trust | "xavfsiz to'lov frilanser", "escrow o'zbekiston" | `/pricing`, trust pages |
| Agency | "marketing agentlik o'zbekiston" | `/agencies` |

### 6.3 SEO implementation principles

| Qoida | Tavsif |
|-------|--------|
| Uzbek URL slugs | `/projects/$slug`, `/services/$slug` — readable |
| Meta titles | O'zbek — masalan "Narxlar — Ishbor" |
| Public discovery | Login wall SEO-friendly listing sahifalar |
| Structured data | Future — Service, Person schema |
| Performance | P7 PERFORMANCE_STANDARDS — Core Web Vitals |
| No duplicate | Single canonical per entity |

### 6.4 Content SEO (future)

- Kategoriya hub sahifalari: "Toshkent dizayn frilanserlari"
- Blog: ish yollash qo'llanmalari (o'zbek)
- Portfolio showcase — `/portfolio/$slug` backlink magnet

---

## 7. Uzbek-first as growth moat

### 7.1 Language strategy

| Qatlam | Til |
|--------|-----|
| UI copy | 100% o'zbek |
| Xato xabarlar | O'zbek (SERVICE_LAYER: IshborHTTPException) |
| Notifications | O'zbek |
| Admin | O'zbek (operator) |
| Hujjatlar (dev) | Ingliz + o'zbek aralash |

**Qoida:** COMING_SOON_ELIMINATION — bo'sh va'da emas, ishlaydigan copy.

### 7.2 Cultural localization

| Element | Mahalliylashtirish |
|---------|-------------------|
| Valyuta | UZS ko'rinish — toLocaleString("uz-UZ") |
| To'lov | Payme, Click, Uzcard, Humo yo'li |
| Business hours | UTC+5, mahalliy bayramlar (future) |
| Trust | Verification — mahalliy ID/business (future KYC) |
| Demo personas | sardor@asaka.uz, nargiza@ishbor.uz — mahalliy domain |

### 7.3 UX growth patterns

| Pattern | Store / component |
|---------|-------------------|
| Keyin nima qilaman | Har sahifa 3 CTA |
| Role switcher | Dual client/freelancer — bitta account, ikki tomondan liquidity |
| ConversionFlowBanner | `/pricing`, checkout flows |
| AI matching | ai-matching-store — dashboard suggestions |
| Job alerts | settings tab — alerts-store |

---

## 8. Agency growth (B2B wedge)

### 8.1 Why agencies

Agentliklar **yuqori GMV** va **multi-seat supply** olib keladi — bir agentlik = 5–20 frilanser ekvivalenti.

### 8.2 Agency GTM

| Qadam | Route |
|-------|-------|
| Create | `/agencies/create` |
| Publish profile | `/agencies/$slug` |
| Invite team | `/dashboard/agency` |
| Win B2B client | `/agency/clients` CRM |
| Case study | dashboard.agency — trust |

**Rollari:** owner, manager, recruiter, freelancer

### 8.3 Agency targets

| Metrika | Yil 1 | Yil 2 |
|---------|-------|-------|
| Registered agencies | 30 | 150 |
| Verified agencies | 10 | 50 |
| GMV via agency | 10% | 20%+ |

---

## 9. AI as differentiation (not primary acquisition)

**Route hub:** `/ai` — proposal assistant, project generator, portfolio optimizer, trust coach

| Tool | Growth role |
|------|-------------|
| Proposal assistant | Win rate ↑ → frilanser retention |
| Project generator | Client supply ↑ |
| Portfolio optimizer | Trust score ↑ |
| Trust coach | Activation ↑ |
| AI matching | Match rate ↑ |

AI — **retention va conversion** lever; paid ads emas.

---

## 10. Admin and founder growth ops

| Tool | Route | Maqsad |
|------|-------|--------|
| Founder panel | `/admin/founder` | Growth KPI dashboard |
| Analytics | `/admin/analytics` | Platform trends |
| Moderation | `/admin/moderation` | Supply quality |
| Verifications | `/admin/verifications` | Trust supply |
| Revenue | `/revenue` | Monetization health |

**Demo admin:** admin@ishbor.uz / demo1234

---

## 11. Growth phases timeline

| Phase | Fokus | Asosiy lever |
|-------|-------|--------------|
| 0 — Demo MVP | Product proof | Demo accounts, escrow loop |
| 1 — Production launch | Uzbek PLG | SEO basics, referral, FTUE |
| 2 — Liquidity | Balance supply/demand | AI matching, featured |
| 3 — Regional | KZ/KG pilot | Agency B2B, localized payments |
| 4 — Scale | Paid + partnerships | FUTURE_ROADMAP channels |

---

## 12. Anti-patterns

| Anti-pattern | O'rniga |
|--------------|---------|
| Global English ads | Uzbek SEO + community |
| Supply without demand | Mijoz loyiha kampaniyasi |
| Demand without supply | Frilanser onboarding + free tier |
| Fake growth (bot signup) | Meaningful action gates |
| Referral spam | completeReferral activation rule |
| Coming soon pages | FEATURE_COMPLETION_POLICY |

---

## 13. Measurement

Barcha growth taktikalar [KPI_METRICS.md](./KPI_METRICS.md) bilan o'lchanadi:

- Conversion funnel stages
- Referral completed rate
- DAU/MAU, repeat hire
- Pro/Elite conversion from `/pricing`
- SEO traffic (production analytics)

**Events:** `analytics-events-store`, `conversion-store`

---

## 14. Related documents

| Hujjat | Mavzu |
|--------|-------|
| [PRODUCT_VISION.md](./PRODUCT_VISION.md) | 3 yillik vision |
| [FUTURE_ROADMAP.md](./FUTURE_ROADMAP.md) | Viral loops, paid acquisition |
| [07-personalization/PERSONALIZATION_RULES.md](../07-personalization/PERSONALIZATION_RULES.md) | Onboarding data use |
| [USER_FLOW_MAP.md](../12-system-maps/USER_FLOW_MAP.md) | Journey maps |

---

*Growth strategiya o'zgarganda KPI maqsadlari va PRODUCT_VISION sinxron yangilanadi.*
