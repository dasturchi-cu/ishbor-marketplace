# MONETIZATION_STRATEGY.md

**Ishbor — Markaziy Osiyo freelance marketplace**  
**Version:** 1.0 · **Status:** Demo stores live · FastAPI billing planned  
**Sources:** `subscription-store.ts`, `credits-store.ts`, `referral-store.ts`, `featured-store.ts`, `/pricing`  
**Related:** [BUSINESS_MODEL.md](./BUSINESS_MODEL.md), [PROJECT_BIBLE.md](../00-constitution/PROJECT_BIBLE.md) §10

---

## 1. Strategy overview

Ishbor monetizatsiyasi **to'rtta qatlam**dan iborat:

1. **Tranzaksiya** — 5% platform fee har checkoutda
2. **Obuna (SaaS)** — frilanser Pro/Elite rejalar
3. **Kredit iqtisodiyoti** — featured va promotsiya xarajatlari

Qo'shimcha o'sish: **referral program** (kredit mukofot), **agentlik B2B** (indirekt GMV), **AI hub** (differentiation, kelajakda usage-based).

**Prinsip:** Bepul tier supply yig'adi; pul frilanser tomonda (visibility + limits); mijoz tomonda escrow ishonch sotadi.

---

## 2. Subscription plans (subscription-store)

### 2.1 Plan definitions

| ID | Nom | Narx/oy | Taklif/oy | Max xizmat | Featured profil | Analitika | Featured ro'yxat | Elite nishon | Ranking boost | Featured chegirma |
|----|-----|---------|-----------|------------|-----------------|-----------|------------------|--------------|---------------|-------------------|
| free | Bepul | 0 | 10 | 3 | Yo'q | Yo'q | Yo'q | Yo'q | 0 | 0% |
| pro | Pro | 99 000 UZS | ∞ | 20 | Ha | Ha | Yo'q | Yo'q | +10 ball | 10% |
| elite | Elite | 249 000 UZS | ∞ | ∞ | Ha | Ha | Ha | Ha | +25 ball | 20% |

**Storage:** `ishbor-subscriptions`, usage: `ishbor-subscription-usage` (format: `{userId}:{YYYY-MM}` → proposals count)

### 2.2 Limit enforcement points

| Limit | Tekshiruv | UX |
|-------|-----------|-----|
| Taklif/oy | `canSubmitProposal`, `recordProposalSubmitted` | `/applications`, loyiha taklif yuborish |
| Xizmat soni | `canCreateService` | `/services/create`, `/my-services` |
| Analitika | `hasAdvancedAnalytics` | `/analytics/freelancer` |
| Featured chegirma | `getFeaturedDiscount` | `/promotions` |
| Ranking | `getPlanRankingBoost` | qidiruv/ranking-store |

### 2.3 Subscription lifecycle

| Holat | Tavsif |
|-------|--------|
| active | Joriy reja faol |
| cancelled | Bekor qilingan; davr tugagach free ga o'tish |
| past_due | To'lov kechikishi (production) |

**Operatsiyalar:** `upgradePlan`, `downgradePlan`, `cancelSubscription`, `renewSubscription`

**Bildirishnomalar:** Obuna faollashganda `notifications-store` — href `/subscription`

---

## 3. Pricing page strategy (`/pricing`)

### 3.1 Page structure

| Element | Maqsad |
|---------|--------|
| ConversionFlowBanner | 3 qadam: Rejani tanlash → To'lov → Faollashtirish |
| Plan cards | free / pro / elite — Pro "Mashhur" badge |
| Joriy reja ring | Authenticated user uchun |
| Primary CTA | Auth holatiga qarab dinamik |
| Boshqa imkoniyatlar | `/promotions`, `/agencies`, `/ai` |

### 3.2 Conversion copy (nextStepCopy)

| User holati | Primary CTA | Maqsad |
|-------------|-------------|--------|
| Guest | Ro'yxatdan o'tish → `/register` | Acquisition |
| Free faol | Pro tanlash → `/subscription?plan=pro` | Upgrade |
| Pro faol | Elite ga o'tish → `/subscription?plan=elite` | ARPU oshirish |
| Elite faol | Obunani boshqarish → `/subscription` | Retention |

### 3.3 Plan feature bullets (pricing.tsx)

**Bepul:** 10 taklif/oy, 3 xizmat, asosiy profil, marketplace kirish

**Pro:** Cheksiz takliflar, 20 xizmat, ajratilgan profil, ustuvor qo'llab-quvvatlash, kengaytirilgan analitika, 10% featured chegirma

**Elite:** Pro + cheksiz xizmatlar, ajratilgan ro'yxatlar, Elite nishoni, ustuvor reyting (+25 ball), 20% featured chegirma

### 3.4 Pricing positioning

- **Pro** — "Mashhur" — o'rtacha faol frilanser uchun sweet spot (99 000 UZS ≈ bir kichik buyurtma fee ekvivalenti)
- **Elite** — power users, agentlik a'zolari, featured tez-tez ishlatadiganlar
- **Bepul** — hech qachon to'liq bloklanmaydi; supply quvurini saqlaydi

---

## 4. Subscription management (`/subscription`)

| Funksiya | Biznes maqsad |
|----------|---------------|
| Joriy reja ko'rinishi | Transparency |
| Upgrade/downgrade | Self-serve revenue |
| Bekor qilish | Churn tracking |
| Keyingi to'lov sanasi | Renewal reminder |

**Revenue event:** `subscription_purchase` — amount = plan.priceMonthly

**Admin:** `getSubscriptionMix`, `getActivePaidSubscriptions` — founder metrics

---

## 5. Credits economy (credits-store)

### 5.1 Wallet model

**Type:** `UserCreditsWallet` — balance, transactions (max 500), migratedReferral flag

**Balance manbalari:**

| Manba | Mexanizm |
|-------|----------|
| Referral mukofot | 50 000 UZS — `completeReferral` |
| Sotib olish | `purchaseCredits(userId, amount, pricePaid)` |
| Refund | Featured xato holatda `refundCredits` |

### 5.2 Spend points

| Xarajat | Summa | Route |
|---------|-------|-------|
| Featured listing | 100 000 UZS (chegirma bilan) | `/promotions` |
| Kelajak promotsiyalar | credits-store extend | `/promotions` |

**Spend validation:** Yetarli balans yo'q → o'zbek xato: "Yetarli kredit yo'q..."

### 5.3 Credit purchase strategy (demo)

Demo `purchaseCredits` — haqiqiy gateway yo'q; production da PaymentService orqali UZS to'lov → kredit balans.

**Tavsiya etilgan paketlar (production):**

| Paket | Kredit | Narx | Bonus |
|-------|--------|------|-------|
| Starter | 100 000 | 100 000 UZS | — |
| Growth | 250 000 | 230 000 UZS | 8% |
| Pro | 500 000 | 450 000 UZS | 10% |

*Demo da erkin miqdor; production paketlari MONETIZATION yangilanishida tasdiqlanadi.*

### 5.4 Analytics

| Event | Maqsad |
|-------|--------|
| credit_purchase | Revenue |
| credit_spent | Burn rate |
| credit_refund | Quality/fraud signal |
| referral_credit_spent | Referral ROI |

**Burn rate:** `getCreditBurnRate(days)` — founder panel

---

## 6. Featured listings strategy (featured-store)

### 6.1 Pricing formula

```
cost = round(100_000 × (1 - featuredDiscount))
featuredDiscount = 0 | 0.1 (Pro) | 0.2 (Elite)
duration = 7 days
```

| Reja | Featured narxi |
|------|----------------|
| Bepul | 100 000 UZS |
| Pro | 90 000 UZS |
| Elite | 80 000 UZS |

### 6.2 Target types

| type | Entity | Store mutation |
|------|--------|----------------|
| service | Xizmat slug | setServiceFeatured |
| project | Loyiha slug | updateProjectFeatured |
| portfolio | Portfolio slug | setPortfolioFeatured |
| profile | User profil | ishbor-featured-profile-{userId} |

### 6.3 Revenue recognition

Featured xarajat kreditdan yechiladi → `featured_purchase` revenue entry (to'liq cost)

**Platform revenue formula (revenue-store):** orderFees (5% GMV) + featured purchases

### 6.4 Disclosure

Featured/promoted listing TRUST_SYSTEM bo'yicha belgilanadi — konversiya va ishonch muvozanati.

---

## 7. Referral program (referral-store)

### 7.1 Mechanics

| Parametr | Qiymat |
|----------|--------|
| Mukofot | 50 000 UZS kredit har completed referral |
| Kod format | `{NAME6}{RANDOM4}` — masalan ASAKA7X2K |
| Link | `{origin}/register?ref={code}` |
| Settings UI | `/settings` referral tab |

### 7.2 Lifecycle

1. **Referrer** — `getReferralState` → unique code
2. **Register** — `applyReferralCode(newUserId, email, code)` → pending entry
3. **Activation** — `completeReferral(referredUserId)` — birinchi meaningful action (loyiha/xizmat/buyurtma)
4. **Reward** — referrer +50 000 kredit; `addCredits` + notification

### 7.3 Referral states

| Status | Ma'nosi |
|--------|---------|
| pending | Ro'yxatdan o'tdi, hali faollashmadi |
| completed | Faollashdi, kredit berildi |

### 7.4 Growth strategy link

Referral — past CAC kanal; settings tab orqali viral loop. Credits iqtisodiyotiga bog'langan — mukofot featured xarajatga yo'naltiriladi.

**Stats:** `getReferralStats` — total, completed, pending, credits

---

## 8. Platform fee (checkout monetization)

| Parametr | Qiymat |
|----------|--------|
| Rate | 5% |
| Nuqta | `/checkout` — checkout_preview, checkout_confirm |
| Ko'rinish | EscrowShield, breakdown |
| Backend | OrderService + RevenueService |

**Mijoz strategiyasi:** Fee past — global raqobatchilarga nisbatan; trust escrow bilan sotiladi.

---

## 9. Monetization funnel

```
Guest → /pricing (compare)
     → /register (guest CTA)
     → /onboarding/* (profile)
     → /dashboard/freelancer (free tier)
     → taklif limit (10/oy) → upgrade signal
     → /subscription?plan=pro (conversion)
     → /promotions (credits + featured)
     → referral (/settings) → yangi supply
```

**Mijoz funnel (alohida):**

```
Guest → /projects, /services (discovery)
     → /register
     → /projects/create (supply)
     → /checkout (GMV + 5% fee)
     → /escrow (retention)
     → qayta yollash (repeat GMV)
```

---

## 10. Role-specific monetization

| Rol | Asosiy to'lov | Route |
|-----|---------------|-------|
| Frilanser | Obuna, kredit, featured | `/subscription`, `/promotions`, `/pricing` |
| Mijoz | Escrow (5% fee ichida) | `/checkout` |
| Agentlik | Jamoa obunasi (indirekt) | `/dashboard/agency` |
| Admin | — (revenue ko'rish) | `/revenue`, `/admin/founder` |

**Dual account:** Role switcher — bir user client + freelancer; obuna faqat freelancer faol rolida relevant.

---

## 11. Demo accounts and testing

| Email | Rol | Monetization test |
|-------|-----|-------------------|
| nargiza@ishbor.uz | Frilanser | Obuna, kredit, featured, `/promotions` |
| sardor@asaka.uz | Mijoz | Checkout, escrow fee |
| admin@ishbor.uz | Admin | `/revenue`, founder metrics |

Parol: demo1234 · OTP: 123456

---

## 12. Production migration (FastAPI)

| Demo store | Backend service |
|------------|-----------------|
| subscription-store | SubscriptionService |
| credits-store | CreditsService |
| referral-store | CreditsService (referral methods) |
| featured-store | ServiceCatalogService.purchase_featured |
| revenue-store | RevenueService |

**Stack:** PostgreSQL (ledger), Redis (usage counters, session), MinIO (media) — Supabase yo'q.

**Idempotency:** Barcha pul operatsiyalarida `idempotency_key` majburiy (SERVICE_LAYER).

---

## 13. Anti-patterns

| Anti-pattern | Sabab |
|--------------|-------|
| Yashirin obuna | Trust buziladi |
| Taklif limitisiz free | Pro konversiya yo'qoladi |
| Featured without disclosure | TRUST_SYSTEM buziladi |
| Referral spam | Moderation kerak |
| Fee checkoutdan keyin | EscrowShield qoidasi |

---

## 14. KPI linkage

Monetization KPI lar [KPI_METRICS.md](./KPI_METRICS.md) da: take rate, MRR, credit burn, referral conversion, Pro/Elite mix.

---

*Plan narxlari o'zgarganda subscription-store PLANS, /pricing planFeatures va bu hujjat bir PR da yangilanadi.*
