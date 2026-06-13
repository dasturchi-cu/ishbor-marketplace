# TRUST_SYSTEM.md

All trust formulas, tiers, and verification rules.

**Source files:** `src/lib/growth-metrics.ts`, `src/lib/reputation-store.ts`, `src/lib/trust-utils.ts`, `src/lib/response-metrics-store.ts`, `src/lib/agency-store.ts`

---

## Freelancer trust score (0–100)

```
trustScore =
  profileCompletion × 0.25
  + verificationProgress × 0.20
  + portfolioStrength × 0.15
  + successScore × 0.25
  + responseRate × 0.10
  + min(5, avgRating) × 5 × 0.05
```

| Input | Calculation |
|-------|-------------|
| profileCompletion | From profile-store % |
| verificationProgress | +60 if verified, +10 if admin; cap 100 |
| portfolioStrength | min(100, publishedPortfolios×25 + 15 if featured + 10 if published services) |
| successScore | See below |
| responseRate | See below |
| avgRating | From reviews-store |

**Labels:** ≥90 Eng yuqori baho · ≥75 Ishonchli · ≥55 Barqaror · else Yangi

---

## Client trust score (0–100)

```
trustScore = profileCompletion × 0.50 + verificationProgress × 0.50
verificationProgress = verified ? 100 : 40
```

---

## Success score (0–100)

```
successScore =
  completionRate × 0.40
  + onTimeRate × 0.25
  + repeatClientRate × 0.15
  + avgRating × 4
  − (disputePenalty ? 10 : 0)
```

| Metric | Formula |
|--------|---------|
| completionRate | completedOrders / totalOrders |
| onTimeRate | completedBeforeDue / completedOrders |
| repeatClientRate | clientsWith2PlusOrders / uniqueClients |
| No orders | min(20, avgRating×4) if reviews exist, else 0 |

**Client success score:**
```
min(100, completionRate×0.5 + repeatRate×0.3 + reviewCount×5)
```

---

## Response rate (0–100)

```
responseRate = respondedWithin24h / totalIncoming × 100
```

- **24h threshold:** `(respondedAt − receivedAt) ≤ 1440 minutes`
- Stored in `ishbor-response-metrics` per username
- **medianMinutes:** median of response times

---

## Reputation tiers

| Tier | Requirements |
|------|--------------|
| **Elite** | trust≥90, success≥85, reviews≥5, completed≥5 |
| **Platinum** | trust≥80, success≥75, reviews≥3, completed≥3 |
| **Gold** | trust≥70, success≥60, reviews≥2, completed≥2 |
| **Silver** | trust≥55 OR success≥50 OR reviews≥1 OR completed≥1 |
| **Bronze** | default |

**Fallback (no AuthUser):**
- Freelancer: `success×0.6 + response×0.2 + avgRating×8`
- Client: `min(100, completionRate×0.4 + reviewCount×10 + (orders>0?20:0))`

---

## Freelancer levels

| Level | Criteria |
|-------|----------|
| Top Rated | success≥90, reviews≥5 |
| Expert | success≥75, completed≥3 |
| Rising | jobs≥1 OR reviews≥1 |
| Verified | default |

---

## Verification

### User verification
- `user.verified` boolean on AuthUser
- Settings → Shaxsni tasdiqlash tab
- Admin queue: `/admin/verifications` approve/reject
- Affects verificationProgress in trust formula

### Agency verification
| Level | Label |
|-------|-------|
| none | Tasdiqlanmagan |
| verified | Tasdiqlangan |
| premium | Premium |
| enterprise | Korporativ |

Request from agency dashboard → admin approval.

---

## Featured boost

| Parameter | Value |
|-----------|-------|
| Base cost | 100,000 UZS (credits) |
| Duration | 7 days |
| Discount | Plan-based: free 0%, pro 10%, elite 20% |
| Targets | service, project, profile, portfolio |
| Storage | `ishbor-featured-profile-{userId}`, featured-listings store |

**Effect:** Visibility funnel metrics, analytics featuredPerformance, ranking boost from subscription plan.

---

## Escrow trust signals

- All checkout flows show `EscrowShield`
- Escrow funded badge on orders
- Milestone release requires client action
- Dispute opens admin queue

---

## Review trust

- Reviews tied to `orderId` via reviews-store
- One review per order per user (`hasUserReviewedOrder`)
- Displayed on profiles and service detail

---

## Rules for engineers

1. Never hardcode trust numbers in UI — compute from stores
2. Never show Elite badge without tier check
3. Trust changes must follow real events (order complete, review, verify)
4. Featured status must check `isFeaturedActive()` not static flags

---

*See reputation-store.ts for tier resolution API.*
