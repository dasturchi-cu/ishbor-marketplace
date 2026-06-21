# KPI_METRICS.md

**Ishbor — Markaziy Osiyo freelance marketplace**  
**Version:** 1.0 · **Status:** Demo analytics live · Production BI planned  
**Sources:** `analytics-events-store`, `revenue-store`, `conversion-store`, `growth-metrics.ts`, `/admin/founder`  
**Related:** [PRODUCT_VISION.md](./PRODUCT_VISION.md), [BUSINESS_MODEL.md](./BUSINESS_MODEL.md)

---

## 1. Purpose

Bu hujjat Ishbor **platforma darajasidagi KPI** larini, o'lchov manbalarini va **maqsadli qiymatlarni** belgilaydi. Har bir metrika route/store/backend xizmatiga bog'langan — audit va founder panel uchun yagona til.

**North star KPI:** Escrow orqali yakunlangan buyurtmalar (completed orders with funded escrow).

**Hisobot yo'llari:**

- Foydalanuvchi: `/analytics/client`, `/analytics/freelancer`
- Admin: `/admin/analytics`, `/admin/founder`
- Revenue: `/revenue` (admin only)

---

## 2. KPI hierarchy

```
North Star: Completed Escrow Orders
    ├── GMV (Gross Merchandise Value)
    ├── Take Rate (platform revenue / GMV)
    ├── Liquidity (active projects, proposals, match rate)
    ├── Conversion Funnel (guest → hire → pay → complete)
    ├── Retention (repeat hire, subscription renewal)
    └── Trust (dispute rate, verification, trust score)
```

---

## 3. GMV (Gross Merchandise Value)

### 3.1 Definition

**GMV** — checkout orqali yaratilgan va escrow fund qilingan buyurtmalar jami summasi (UZS). Bekor qilingan va refund qilingan buyurtmalar GMV dan chiqariladi yoki alohida "net GMV" sifatida hisoblanadi.

### 3.2 Measurement

| Manba | Demo | Production |
|-------|------|------------|
| orders-store | completed + in_progress funded | OrderService |
| escrow-store | funded milestones | EscrowService |
| revenue-store | fee = GMV × 5% | RevenueService |

**Segmentatsiya:**

- Project hire vs direct service vs direct hire (`CheckoutType`)
- Client company (`/clients/$company`)
- Agentlik buyurtmalari (agency member seller)

### 3.3 Targets

| Davr | GMV (oylik, UZS) | Izoh |
|------|------------------|------|
| Demo/MVP | Simulyatsiya | Stress seeder QA |
| Yil 1 Q1 production | 500 000 000 | ~100 completed orders @ 5M avg |
| Yil 1 Q4 | 3 000 000 000 | Toshkent fokus |
| Yil 2 | 15 000 000 000 | Agentlik + B2B |
| Yil 3 | 50 000 000 000+ | Mintaqaviy |

---

## 4. Take Rate

### 4.1 Definition

**Take rate** = Platform revenue / GMV × 100%

**Platform revenue tarkibi:**

| Komponent | Formula / manba |
|-----------|-----------------|
| Transaction fee | GMV × 5% |
| Featured | `featured_purchase` sum |
| Subscriptions | `subscription_purchase` (MRR alohida) |
| Credit purchase | `credit_purchase` (kredit sotib olish, GMV emas) |

**Blended take rate (tranzaksiya fokus):** 5% + (featured revenue / GMV)

### 4.2 Targets

| Metrika | Maqsad |
|---------|--------|
| Base fee | 5% (doimiy — PROJECT_BIBLE) |
| Blended take rate | 5.5–7% (featured penetration bilan) |
| MRR (obuna) | GMV dan mustaqil ARR oqimi |

**Admin view:** `/revenue` — `getPlatformRevenue`, orderFees + featured

---

## 5. Active projects and supply metrics

### 5.1 Active projects

**Definition:** `ProjectStatus = published` va pause emas — `/projects`, `projects-store`

| Metrika | O'lchov | Maqsad (Yil 1) |
|---------|---------|----------------|
| Published projects | Count | 200+ oylik faol |
| New projects / week | Create rate `/projects/create` | 50+ |
| Projects with ≥1 proposal | Liquidity | 40%+ |
| Avg proposals per project | applications-store | 3–8 |
| Time to first proposal | Analytics | < 48 soat |

### 5.2 Active services

**Definition:** Published services — `/services`, `services-store`

| Metrika | Maqsad (Yil 1) |
|---------|----------------|
| Published services | 1 000+ |
| Featured services % | 5–10% |
| Avg service price | Segment tracking |

### 5.3 Freelancer supply

| Metrika | Manba | Maqsad |
|---------|-------|--------|
| Registered freelancers | auth, profile | 2 000+ Yil 1 |
| Onboarding completed | onboarding state | 70%+ completion |
| Published portfolio | portfolio-store | 50%+ freelancers |
| Pro+Elite mix | subscription-store | 10% paid Yil 1 |

---

## 6. Conversion funnel metrics

### 6.1 Funnel stages

Funnel `conversion-store` va `analytics-events-store` bilan kuzatiladi.

| Stage | Event / route | Definition |
|-------|---------------|------------|
| 1. Visit | page view `/` | Public discovery |
| 2. Register | `/register` complete | New account |
| 3. Onboard | `/onboarding/*` complete | Profile ready |
| 4. Supply/Demand action | project create OR proposal submit | Marketplace participation |
| 5. Hire intent | application accept OR service click buy | `/checkout` entry |
| 6. Checkout | checkout_confirm | Order created |
| 7. Escrow fund | escrow funded | Money in platform |
| 8. Complete | order completed | Deliverable accepted |
| 9. Review | ReviewForm submit | Trust loop closed |
| 10. Repeat | 2nd order same pair | Retention |

### 6.2 Conversion rates (targets)

| O'tish | Demo baseline | Yil 1 maqsad | Yil 3 maqsad |
|--------|---------------|--------------|--------------|
| Visit → Register | — | 3% | 5% |
| Register → Onboard complete | — | 60% | 75% |
| Onboard → First action | — | 40% | 55% |
| Proposal → Accept | applications-store | 15% | 20% |
| Checkout start → Fund | `/checkout` | 70% | 85% |
| Fund → Complete | orders/escrow | 85% | 92% |
| Complete → Review | reviews-store | 50% | 70% |
| Client repeat hire (90 kun) | crm-store | 15% | 30% |

### 6.3 Pricing funnel (freelancer monetization)

| Stage | Route | Maqsad |
|-------|-------|--------|
| /pricing view | `/pricing` | Track unique visitors |
| /subscription upgrade | plan=pro/elite | 5% free→paid Yil 1 |
| Featured purchase | `/promotions` | 20% paid users / month |

---

## 7. Retention and engagement

| Metrika | Definition | Maqsad |
|---------|------------|--------|
| DAU/MAU | Daily/monthly active | 25%+ stickiness |
| Messages per order | messages-store | ≥ 5 (deal closure) |
| Response rate | growth-metrics `computeResponseRate` | 80%+ within 24h |
| Win rate | `getWinRate` | Track, improve with AI |
| Subscription renewal | subscription-store renew | 70%+ Pro/Elite |
| Credit burn | `getCreditBurnRate` | Healthy spend, not hoarding |

---

## 8. Trust and quality KPIs

### 8.1 Trust scores (user-level)

**Manba:** `growth-metrics.ts` — hech qachon random emas

| Score | Formula summary | Platform use |
|-------|-----------------|--------------|
| Success Score | completion 40% + onTime 25% + repeat 15% + rating − dispute | Freelancer quality |
| Response Rate | 24h response / total incoming | Responsiveness |
| Trust Score | profile + verification + portfolio + success + response + reviews | Badge, ranking |

**Labels:** Yangi · Barqaror · Ishonchli · Eng yuqori baho

### 8.2 Platform trust targets

| Metrika | Maqsad | Admin route |
|---------|--------|-------------|
| Dispute rate | < 3% orders | `/admin/disputes` |
| Dispute resolution time | < 7 kun | admin SLA |
| Verification queue time | < 3 ish kuni | `/admin/verifications` |
| Avg review rating | ≥ 4.2 / 5 | reviews-store |
| Suspended users | Track fraud | `/admin/users` |

---

## 9. Revenue KPIs

| Metrika | Formula | Yil 1 maqsad |
|---------|---------|--------------|
| Platform fee revenue | GMV × 5% | GMV ga bog'liq |
| MRR | Pro×99k + Elite×249k | 50M UZS/oy |
| Featured revenue | Sum featured_purchase | 10M UZS/oy |
| Credit purchase revenue | Sum credit_purchase | 15M UZS/oy |
| ARPU (freelancer paid) | MRR / paid subs | Track |
| LTV/CAC | Referral + organic | CAC < 100k UZS |

**Founder panel:** `/admin/founder` — `getFounderMetrics` (growth-metrics integration)

---

## 10. Agency KPIs

| Metrika | Maqsad |
|---------|--------|
| Active agencies | 50+ Yil 1 |
| Avg team size | 3–8 members |
| Agency GMV share | 15%+ Yil 2 |
| Agency verification rate | 30%+ verified |

**Routes:** `/agencies`, `/dashboard/agency`, `/agency/clients`

---

## 11. Operational KPIs

| Metrika | Maqsad | Manba |
|---------|--------|-------|
| API p95 latency | < 300ms | `/admin/system` |
| Error rate | < 0.1% | monitoring |
| Uptime | 99.5% | infrastructure |
| Support ticket resolution | < 24h | `/admin/support` |
| Moderation queue | < 48h | `/admin/moderation` |

**Stack health:** FastAPI, PostgreSQL, Redis, MinIO — Supabase emas

---

## 12. Demo vs production measurement

| KPI | Demo (hozir) | Production |
|-----|----------------|------------|
| GMV | orders-store + mock merge | PostgreSQL orders |
| Events | analytics-events-store local | AnalyticsService.ingest |
| Revenue | revenue-store | RevenueService ledger |
| Founder | admin founder panel | AdminService.get_founder_metrics |
| Session | localStorage | Redis + cookie |

**Demo accounts for KPI QA:**

| Email | Rol |
|-------|-----|
| sardor@asaka.uz | Client — checkout/escrow |
| nargiza@ishbor.uz | Freelancer — proposals/earnings |
| admin@ishbor.uz | Admin — founder/revenue |

---

## 13. Reporting cadence

| Chastota | Audience | KPI set |
|----------|----------|---------|
| Daily | Ops | GMV, new orders, disputes open |
| Weekly | Product | Funnel, supply/demand balance |
| Monthly | Founder | MRR, take rate, retention, Pro mix |
| Quarterly | Strategy | Vision milestones vs actual |

---

## 14. KPI guardrails

1. **GMV** — faqat funded escrow; phantom checkout hisoblanmaydi
2. **Take rate** — 5% base o'zgarmas; blended alohida ko'rsatiladi
3. **Trust scores** — faqat stored actions; random/generator taqiqlangan
4. **Reviews** — faqat completed orders
5. **Referral completed** — meaningful action talab qilinadi (spam oldini olish)

---

## 15. Related documents

| Hujjat | Bog'lanish |
|--------|------------|
| [GROWTH_STRATEGY.md](./GROWTH_STRATEGY.md) | KPI oshirish taktikasi |
| [MONETIZATION_STRATEGY.md](./MONETIZATION_STRATEGY.md) | Revenue KPI tafsilot |
| [04-trust/TRUST_SYSTEM.md](../04-trust/TRUST_SYSTEM.md) | Trust metrics |
| [11-backend/MONITORING_ARCHITECTURE.md](../11-backend/MONITORING_ARCHITECTURE.md) | Ops metrics |

---

*Maqsadlar vision yiliga qarab yangilanadi — PRODUCT_VISION §2 bilan sinxron.*
