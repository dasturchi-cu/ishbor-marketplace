# BUSINESS_MODEL.md

**Ishbor — Markaziy Osiyo freelance marketplace**  
**Version:** 1.0 · **Status:** Demo monetization live · Production billing planned  
**Related:** [PROJECT_BIBLE.md](../00-constitution/PROJECT_BIBLE.md) §10, [MONETIZATION_STRATEGY.md](./MONETIZATION_STRATEGY.md)

---

## 1. Executive summary

Ishbor **ikki tomonlama marketplace** iqtisodiyotiga ega: mijozlar ish uchun to'laydi, frilanserlar va agentliklar visibility va vositalar uchun to'laydi. Platforma **5% tranzaksiya to'lovi** atrofida markazlashgan; qo'shimcha daromad obuna, kreditlar, ajratilgan ro'yxatlar va agentlik B2B qatlamidan keladi.

**Stack (production):** FastAPI · PostgreSQL · Redis · MinIO — Supabase ishlatilmaydi.

**Hozirgi demo:** `revenue-store`, `subscription-store`, `credits-store`, `featured-store` — localStorage; admin `/revenue` va `/admin/founder` ko'rinishi.

---

## 2. Marketplace sides

| Tomon | Yaratadi | Istemol qiladi | To'laydi |
|-------|----------|----------------|----------|
| Mijoz (Client) | Loyihalar | Xizmatlar, talent | Escrow, kelajakda obuna |
| Frilanser | Xizmatlar, portfolio, takliflar | Loyiha e'lonlari | Kredit, featured, Pro/Elite |
| Agentlik | Jamoa, case study | CRM, mijozlar | Frilanser kabi + jamoa vositalari |
| Admin | Siyosatlar | Barcha entity | Platform fee undirish (5%) |

**North star revenue:** Escrow orqali o'tgan GMV × take rate + SaaS-like obuna MRR + kredit aylanmasi.

---

## 3. Revenue stream 1 — Platform fee (5%)

### 3.1 Mexanizm

Har **checkout** (`/checkout`) da platforma **5%** komissiya oladi. Bu `orders-store` va `escrow-store` orqali buyurtma yaratilganda hisoblanadi.

**Qamrov:**

- Project hire (loyiha → qabul → checkout)
- Direct service (`/services/$slug` → checkout)
- Direct hire (frilanser profili → checkout)

**Mijoz ko'rinishi:** EscrowShield va checkout breakdown — yashirin fee yo'q (TRUST_SYSTEM).

**Frilanser ko'rinishi:** Buyurtma summasidan 5% platforma ulushi ajratilgan; qolgan escrow release orqali hamyonga (`/wallet`).

### 3.2 Hisob-kitob

| Misol | Buyurtma | Platform 5% | Frilanser net (escrow) |
|-------|----------|-------------|------------------------|
| SMM paket | 2 000 000 UZS | 100 000 UZS | 1 900 000 UZS |
| Logo dizayn | 500 000 UZS | 25 000 UZS | 475 000 UZS |
| IT loyiha | 15 000 000 UZS | 750 000 UZS | 14 250 000 UZS |

### 3.3 Admin va founder

- **Revenue dashboard:** `/revenue` (admin only) — `monetization-store`, `revenue-store`
- **Founder panel:** `/admin/founder` — GMV, fee, obuna aralashmasi
- **Backend target:** `RevenueService.record_entry` — idempotency_key bilan ledger

### 3.4 Strategik ahamiyat

5% — global platformalardan past; O'zbekiston kichik biznesi uchun jalb qiluvchi. Take rate o'sishi obuna va featured orqali, asosiy fee esa likvidlik bilan o'sadi.

---

## 4. Revenue stream 2 — Subscriptions (Pro / Elite)

### 4.1 Rejalar (`subscription-store`, `/pricing`, `/subscription`)

| Reja | Narx (oy) | Taklif/oy | Max xizmat | Asosiy imtiyozlar |
|------|-----------|-----------|------------|-------------------|
| Bepul (free) | 0 UZS | 10 | 3 | Asosiy profil, marketplace kirish |
| Pro | 99 000 UZS | Cheksiz | 20 | Featured profil, ustuvor support, analitika, 10% featured chegirma |
| Elite | 249 000 UZS | Cheksiz | Cheksiz | Pro + ajratilgan ro'yxatlar, Elite nishoni, +25 ranking, 20% featured chegirma |

**Route oqimi:** `/pricing` → `/subscription` → `/dashboard/freelancer`

**Store:** `ishbor-subscriptions`, `ishbor-subscription-usage` (oylik taklif hisobi)

### 4.2 Biznes mantiq

- **Free tier** — onboarding va supply yig'ish; 10 taklif/oy yetarli yangi frilanser uchun
- **Pro** — faol frilanserlar; cheksiz taklif + analitika (`/analytics/freelancer`)
- **Elite** — top frilanser va agentlik a'zolari; ranking boost + featured chegirma

**MRR hisobi:** Faol Pro × 99 000 + Faol Elite × 249 000 UZS/oy

**Analytics:** `subscription_purchase` event — `analytics-events-store`

---

## 5. Revenue stream 3 — Credits (promotsiya hamyoni)

### 5.1 Mexanizm

Frilanserlar **kredit hamyoni** (`credits-store`, `/promotions`) orqali ajratilgan ko'rinish sotib oladi. Kreditlar UZS nominatsiyasida; featured xarajatlar shu balansdan yechiladi.

**Store key:** `ishbor-credits-wallet`

**Tranzaksiya turlari:** add, spend, refund — sabab va entityId bilan

### 5.2 Kredit manbalari

| Manba | Tavsif |
|-------|--------|
| Sotib olish | `purchaseCredits` — demo to'lov simulyatsiyasi |
| Referral | `referral-store` — 50 000 UZS mukofot (taklif qilingan faollashganda) |
| Migratsiya | Referral balans kredit hamyoniga bir martalik ko'chirish |

**Revenue:** `credit_purchase` — `revenue-store` ga real pul kirimi (kredit sotib olish narxi)

---

## 6. Revenue stream 4 — Featured listings

### 6.1 Narx va davomiylik (`featured-store`)

| Parametr | Qiymat |
|----------|--------|
| Asosiy narx | 100 000 UZS (kredit) |
| Davomiylik | 7 kun |
| Pro chegirma | 10% → 90 000 UZS |
| Elite chegirma | 20% → 80 000 UZS |

### 6.2 Target turlari

| Tur | Route / store |
|-----|---------------|
| Xizmat | `services-store`, `/my-services` |
| Loyiha | `projects-store`, `/my-projects` |
| Portfolio | `portfolio-store`, `/portfolio` |
| Profil | `ishbor-featured-profile-{userId}` localStorage |

**UI:** `/promotions`, FeaturedPurchaseCard, `featured-listings-store`

**Revenue accounting:** `featured_purchase` — to'liq kredit miqdori platform daromadiga (`revenue-store`)

**Shaffoflik:** Ajratilgan ro'yxatlar disclosure qoidasi — TRUST_SYSTEM

---

## 7. Revenue stream 5 — Agency (B2B)

### 7.1 Hozirgi model

Agentlik funksiyalari **to'g'ridan-to'g'ri alohida obuna emas** — jamoa a'zolari frilanser obunasidan foydalanadi. Daromad agentlik orqali **indirekt**:

- Ko'proq buyurtmalar → 5% platform fee
- Jamoa featured/kredit xarajatlari
- B2B mijozlar yuqori o'rtacha buyurtma summasi

### 7.2 Agentlik qiymati

| Funksiya | Route | Biznes ta'siri |
|----------|-------|----------------|
| Agentlik yaratish | `/agencies/create` | Supply tomoni kengayadi |
| Jamoa dashboard | `/dashboard/agency` | Retention |
| CRM | `/agency/clients` | B2B pipeline |
| Verification | dashboard.agency | Trust premium |
| Case study | dashboard.agency | Konversiya |

**Kelajak (FUTURE_ROADMAP):** Agentlik tier obunasi — jamoa o'lchami, CRM limit, white-label

### 7.3 Agentlik rollari va monetizatsiya

| Rol | To'lov mas'uliyati |
|-----|-------------------|
| owner | Obuna, kredit, featured |
| manager | Operatsion (owner billing) |
| recruiter | Taklif yuborish (free tier limit) |
| freelancer (member) | Shaxsiy limit yoki agentlik obunasi |

---

## 8. Transaction types and money flow

### 8.1 Uchta tranzaksiya turi

1. **Project hire** — `/projects/create` → `/applications` → accept → `/checkout`
2. **Direct service** — `/services/$slug` → `/checkout`
3. **Direct hire** — `/freelancers/$username` → checkout

### 8.2 Pul oqimi

```
Mijoz to'lov (/checkout, /wallet)
    → Escrow fund (/escrow, escrow-store)
    → Milestone release
    → Frilanser wallet (/wallet, wallet-store)
    → Yechib olish (Payme/Click/Uzcard — production)
    → Platform 5% fee (RevenueService ledger)
```

**Dispute:** `/escrow/$id` → `/admin/disputes` — admin freeze/refund/release

---

## 9. Cost structure (platform)

| Xarajat qatlami | Komponent |
|-----------------|-----------|
| Infra | PostgreSQL, Redis, MinIO, FastAPI hosting |
| To'lov gateway | Payme, Click, Uzcard/Humo komissiyasi (alohida) |
| SMS/OTP | OTP verify (`/verify-otp`, demo 123456) |
| AI | `/ai/*` — token xarajat (Elite/Pro limit kelajakda) |
| Support | `/admin/support` |
| Moderation | `/admin/moderation` |

---

## 10. Unit economics (namuna)

**O'rtacha buyurtma:** 3 000 000 UZS  
**Platform fee (5%):** 150 000 UZS  
**Frilanser Elite obuna:** 249 000 UZS/oy  
**Featured (oyda 1 marta):** 80 000 UZS (Elite chegirma bilan)

**Bir faol Elite frilanser oylik platform qiymati (fee + obuna + featured):** ~479 000 UZS + qo'shimcha buyurtmalar

---

## 11. Demo vs production

| Aspekt | Demo (hozir) | Production (maqsad) |
|--------|--------------|---------------------|
| To'lov | Simulyatsiya | Payme, Click, Uzcard, Humo |
| Escrow | localStorage | PostgreSQL + PaymentService |
| Obuna | localStorage activate | SubscriptionService + recurring billing |
| Revenue | revenue-store log | RevenueService ledger + `/revenue` |
| Session | ishbor-session localStorage | Redis session + cookie |

---

## 12. Revenue reporting map

| Ko'rsatkich | Manba | Route |
|-------------|-------|-------|
| Platform fee jami | revenue-store (order GMV × 5%) | `/revenue` |
| Featured purchases | featured_purchase events | `/revenue`, `/admin/founder` |
| Obuna xaridlar | subscription_purchase | `/admin/founder` |
| Kredit sotib olish | credit_purchase | `/revenue` |
| Referral spend | referral_credit_spent | analytics |

---

## 13. Business model guardrails

1. **5% fee o'zgartirish** — faqat PROJECT_BIBLE yangilanishi bilan
2. **Yashirin to'lov yo'q** — checkout breakdown majburiy
3. **Featured disclosure** — promoted content belgilanadi
4. **Reviews faqat completed order** — sun'iy trust yo'q
5. **Admin revenue** — faqat `/revenue`, AdminOnlyGate

---

## 14. Related documents

| Hujjat | Mavzu |
|--------|-------|
| [MONETIZATION_STRATEGY.md](./MONETIZATION_STRATEGY.md) | Pricing taktikasi |
| [KPI_METRICS.md](./KPI_METRICS.md) | GMV, take rate, MRR |
| [payments/ESCROW_SYSTEM.md](../11-backend/payments/ESCROW_SYSTEM.md) | Escrow arxitektura |
| [payments/PAYMENT_ARCHITECTURE.md](../11-backend/payments/PAYMENT_ARCHITECTURE.md) | Gateway |
| [PRODUCT_VISION.md](./PRODUCT_VISION.md) | Strategik yo'nalish |

---

*Monetization qoidalari o'zgarganda PROJECT_BIBLE §10 va bu hujjat bir vaqtda yangilanadi.*
