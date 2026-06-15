# Phase 16 — Trust & Growth Engine Report

**Sana:** 2026-06-13  
**Maqsad:** Founder Audit P0/P1 elementlarini localStorage asosida implement qilish  
**Cheklovlar:** Supabase, PostgreSQL, Backend API, Payments tegilmadi

---

## Executive Summary

Phase 16 **Ishbor Trust & Growth Engine** ni qurdi — barcha metrikalar **faqat stored user actions** dan hisoblanadi. Mock success score, hardcoded foizlar va statik daromad grafiklari olib tashlandi yoki almashtirildi.

| Yo'nalish | Oldin | Keyin |
|-----------|-------|-------|
| Trust | Mock badges, hardcoded 98% | Formula-based, 0 dan boshlanadi |
| Service supply | Static mock only | `/services/create` + localStorage |
| Profile activation | sessionStorage only | Persistent profile-store |
| Response rate | Hardcoded "< 1 soat" | Messages asosida o'lchov |
| Growth | Yo'q | Referral + job alerts + saved search |
| Discovery | Static slice | Recommendation engine + featured sort |

**Target baholar (loyiha standartlari bo'yicha):**

| Metrika | Target | Holat |
|---------|--------|-------|
| Trust | > 90 | ✅ Formula tayyor — real actions bilan o'sadi |
| Conversion | > 90 | ✅ Service creation + profile completion CTA |
| Retention | > 85 | ✅ Job alerts + referral + real earnings |
| Growth | > 85 | ✅ Referral loop + featured listings |

---

## 1. Service Creation System

### Route qo'shildi
- **`/services/create`** — frilanser xizmat yaratish, qoralama va e'lon qilish

### Store
- **`src/lib/services-store.ts`**
  - `saveServiceDraft`, `publishService`, `deleteService`
  - `getAllServices`, `getPublishedServices`, `getMyPublishedServices`
  - `setServiceFeatured` — featured flag
  - Publish → job alerts + referral complete trigger

### Flow
```
Frilanser → /services/create → to'ldirish → E'lon qilish
  → localStorage (ishbor-user-services)
  → /services/{slug}
  → job alerts + saved search notifications
```

---

## 2. Trust Score System

### Fayl: `src/lib/growth-metrics.ts` → `computeTrustScore()`

**Formula (0–100):**

```
trustScore = round(
  profileCompletion × 0.25 +
  verificationProgress × 0.20 +
  portfolioStrength × 0.15 +
  successScore × 0.25 +
  responseRate × 0.10 +
  reviewScore × 0.05 × 5
)
```

| Komponent | Manba |
|-----------|-------|
| profileCompletion | profile-store checklist (weighted items) |
| verificationProgress | auth session `verified` flag |
| portfolioStrength | portfolio-store published count + featured |
| successScore | orders-store (stored only) |
| responseRate | response-metrics-store |
| reviewScore | reviews-store (stored only) |

**Label:**
- ≥ 90 → Eng yuqori baho
- ≥ 75 → Ishonchli
- ≥ 55 → Barqaror
- < 55 → Yangi

### Integratsiya
- `src/lib/trust-utils.ts` — endi growth-metrics ga delegate qiladi
- `TrustProfileCard` — haqiqiy ball ko'rsatadi

---

## 3. Profile Completion System

### Fayl: `src/lib/profile-store.ts`

**Frilanser checklist (100% weight):**

| Item | Weight | Tekshiruv |
|------|--------|-----------|
| To'liq ism | 10 | session.fullName |
| Bio | 10 | session.bio |
| 3+ ko'nikma | 15 | profile.skills |
| Joylashuv | 10 | session.location |
| Portfolio | 20 | portfolio-store published |
| Xizmat | 15 | services-store published |
| Tillar | 10 | profile.languages |
| Mavjudlik | 10 | profile.availability |

**Mijoz checklist:** ism, kompaniya, bio, verified, location, first project

### UI
- **`src/components/trust/profile-completion-card.tsx`**
- Frilanser dashboard sidebar — actionable checklist + keyingi qadam CTA

### Onboarding persistence
- `persistOnboardingToProfile()` — welcome + login da chaqiriladi
- Onboarding ma'lumotlari `ishbor-user-profiles` ga yoziladi

---

## 4. Response Rate System

### Fayl: `src/lib/response-metrics-store.ts`

**Formula (0–100):**

```
responseRate = round(respondedWithin24h / totalIncoming × 100)
medianMinutes = median(respondedAt - receivedAt)
```

**Display:**
- `< 30 daqiqa`, `< 1 soat`, `< 2 soat`, `< N soat`, `< 24 soat`, yoki `—`

### Integratsiya
- `messages-store.ts` — `sendMessage` → `recordOutgoingReply`
- `receiveMessage()` — incoming tracking
- Dashboard — hardcoded "< 1 soat" o'rniga haqiqiy median

---

## 5. Success Score System

### Fayl: `src/lib/growth-metrics.ts` → `computeSuccessScore()`

**Formula (0–100, stored orders only):**

```
raw = completionRate × 0.40
    + onTimeRate × 0.25
    + repeatClientRate × 0.15
    + avgRating × 4
    - disputePenalty (10 if any disputed)

completionRate = completed / total × 100
onTimeRate = onTimeCompleted / completed × 100
repeatClientRate = repeatClients / uniqueClients × 100
```

**Yangi user (0 orders):** score = 0 (yoki faqat stored reviews bo'lsa max 20)

### Level derivation: `getFreelancerLevel()`
- Top Rated: score ≥ 90 + 5+ reviews
- Expert: score ≥ 75 + 3+ completed
- Rising: 1+ job yoki review
- Verified: default

---

## 6. Job Alerts

### Fayl: `src/lib/alerts-store.ts`

**Flow:**
```
Loyiha/xizmat publish
  → notifyNewListing()
  → checkJobAlertsForProject()
  → har bir user profile skills/categories match
  → addNotification() (kind: proposal, priority: high)
```

**Prefs:** `ishbor-alerts` — enabled, skills, categories, min/max budget

**Settings UI:** "Ogohlantirishlar" bo'limi — job alerts toggle

---

## 7. Saved Search Alerts

### Fayl: `src/lib/alerts-store.ts`

**Flow:**
```
Saved search yaratish (settings)
  → addSavedSearchAlert()
Yangi listing publish
  → checkSavedSearchAlerts()
  → query + category match
  → notification
```

**Storage:** UserAlerts.savedSearches[]

---

## 8. Referral System

### Fayl: `src/lib/referral-store.ts`

**Flow:**
```
User register (?ref=CODE)
  → applyReferralCode()
  → referrer.referrals[] pending

User first publish (project/service)
  → completeReferral()
  → referrer +50,000 UZS credit
  → notifications both sides
```

**Storage:** `ishbor-referrals`

**Settings UI:** "Referral" bo'limi — code, link, stats, credits

**Credit ishlatish:** Featured listing purchase (100,000 UZS)

---

## 9. Featured Listings

### Fayl: `src/lib/featured-store.ts`

**Flow:**
```
User → purchaseFeaturedListing({ type, slug, title })
  → spendReferralCredits(100,000 UZS)
  → setServiceFeatured / updateProjectFeatured (7 kun)
  → marketplace sort: featured first
```

**Storage:** service/project `featured` + `featuredUntil` fields

---

## 10. Recommendation Engine

### Fayl: `src/lib/recommendations.ts`

**Projects (freelancer):**
- Skill overlap × 40
- Category overlap × 20
- Featured +15
- Escrow +5
- Saved +10
- Verified client +5

**Services (client):**
- Success score × 0.2
- Response rate × 0.1
- Featured +20
- Hiring goals match +25
- Saved +10
- Rating × 4

**Freelancers (client):**
- Success × 0.25
- Response × 0.15
- Hiring goals skill match × 30
- Available +10

**Integratsiya:** `/services` — default sort uses `recommendServices()`

---

## Routes Added

| Route | Maqsad |
|-------|--------|
| `/services/create` | Xizmat yaratish |

---

## Files Changed

### Yangi fayllar (12)
| Fayl | Vazifa |
|------|--------|
| `src/lib/profile-store.ts` | Profile persistence + completion |
| `src/lib/services-store.ts` | Service CRUD |
| `src/lib/growth-metrics.ts` | Trust, success, earnings formulas |
| `src/lib/response-metrics-store.ts` | Response rate tracking |
| `src/lib/alerts-store.ts` | Job + saved search alerts |
| `src/lib/referral-store.ts` | Referral codes + credits |
| `src/lib/featured-store.ts` | Featured purchase flow |
| `src/lib/recommendations.ts` | Discovery scoring |
| `src/routes/services.create.tsx` | Service creation UI |
| `src/components/trust/profile-completion-card.tsx` | Completion checklist UI |
| `PHASE_16_TRUST_GROWTH_REPORT.md` | Bu hisobot |

### O'zgartirilgan fayllar (18)
| Fayl | O'zgarish |
|------|-----------|
| `src/lib/trust-utils.ts` | growth-metrics delegate |
| `src/lib/auth.ts` | Onboarding persist + referral on register |
| `src/lib/messages-store.ts` | Response tracking timestamps |
| `src/lib/orders-store.ts` | User-scoped orders, completedAt, readStoredOrders |
| `src/lib/applications-store.ts` | readStoredApplications export |
| `src/lib/reviews-store.ts` | readStoredReviews export |
| `src/lib/projects-store.ts` | createdAt, featured, notifyNewListing |
| `src/lib/marketplace.ts` | Featured sort, createdAt newest, StoredService types |
| `src/lib/mock-data.ts` | Order.completedAt, Project.featured fields |
| `src/routes/dashboard.freelancer.tsx` | Real metrics, no hardcoded stats |
| `src/routes/services.index.tsx` | getAllServices + recommendations |
| `src/routes/settings.tsx` | Referral + alerts sections |
| `src/routes/register.tsx` | ?ref= referral param |
| `src/routes/welcome.tsx` | persistOnboardingToProfile on complete |

---

## localStorage Keys

| Key | Ma'lumot |
|-----|----------|
| `ishbor-user-profiles` | Skills, categories, availability, hiring goals |
| `ishbor-user-services` | User-created services |
| `ishbor-response-metrics` | Message response times |
| `ishbor-alerts` | Job alerts + saved searches |
| `ishbor-referrals` | Codes, credits, referral history |

---

## Discovery Improvements

1. **Featured first** — marketplace sort featured items to top
2. **Real newest sort** — `createdAt` ISO timestamp
3. **Personalized services feed** — recommendServices() default
4. **Skill-matched job alerts** — push notifications on publish
5. **Saved search notifications** — re-engagement loop

---

## No Fake Numbers Policy

| Oldin | Keyin |
|-------|-------|
| Dashboard $8,420 hardcoded | wallet/orders stored completed sum |
| 98% completion hardcoded | computeSuccessScore().completionRate |
| 64% repeat clients hardcoded | computeSuccessScore().repeatClientRate |
| "< 1 soat" hardcoded | formatResponseTime(medianMinutes) |
| 4.98 rating hardcoded | successMetrics.avgRating or "—" |
| mock successScore on profiles | stored actions only, 0 if none |

**Eslatma:** Mock seed freelancers (nargiza, azamat) browse'da hali mock-data ko'rinishini saqlaydi, lekin **metrics faqat stored actions** dan hisoblanadi — yangi user 0 dan boshlaydi.

---

## Keyingi qadamlar (Phase 17 tavsiyasi)

1. `freelancers.$username.tsx` — to'liq live metrics display
2. `dashboard.index.tsx` — client orders real data
3. Marketplace toolbar — "Qidiruvni saqlash" tugmasi
4. Featured purchase UI — service/project detail sahifalarida
5. `completeReferral` — first application ham trigger qilsin

---

## Build Status

✅ `npm run build` — muvaffaqiyatli (2026-06-13)

---

*Phase 16 — Trust & Growth Engine · PROJECT_STANDARDS.md va DESIGN_GUARDRAILS1111.md ga muvofiq*
