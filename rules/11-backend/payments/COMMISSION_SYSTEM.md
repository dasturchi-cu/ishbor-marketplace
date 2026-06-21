# COMMISSION_SYSTEM.md

**Scope:** All Ishbor platform revenue streams beyond the core 5% escrow fee  
**Authority:** `revenue-store.ts` → PostgreSQL `revenue_ledger` (FastAPI `RevenueService`)  
**Related:** [PLATFORM_FEE_SYSTEM.md](./PLATFORM_FEE_SYSTEM.md), [PAYMENT_ARCHITECTURE.md](./PAYMENT_ARCHITECTURE.md), [13-domains/WALLET_TRANSACTIONS.md](../../13-domains/WALLET_TRANSACTIONS.md)

---

## 1. Purpose

Ishbor earns from marketplace activity through multiple commission and monetization channels. The **5% platform fee on escrow fund** is the primary transaction commission (documented in PLATFORM_FEE_SYSTEM.md). This document catalogs **all other revenue types** recorded in `revenue-store` and their FastAPI backend equivalents.

**Business rule:** Every revenue event produces an immutable `revenue_ledger` row. Frontend `recordRevenueEntry()` is a demo stub — production writes occur only inside PostgreSQL transactions after payment confirmation.

---

## 2. Revenue entry types (`RevenueEntry.type`)

| Type | Source store | Trigger | Typical amount |
|------|--------------|---------|----------------|
| `platform_fee` | escrow checkout | Client funds escrow | 5% of order subtotal USD |
| `featured_purchase` | `featured-store.ts` | User boosts listing | Credits spent × USD equivalent |
| `subscription_purchase` | `subscription-store.ts` | Plan activation/renewal | 99,000 / 249,000 UZS (stored as USD) |
| `credit_purchase` | `credits-store.ts` | Promotional credits buy | Package price USD |
| `referral_credit_spent` | `referral-store.ts` | Referral bonus redeemed on platform | Analytics-only (not cash) |
| `order_gmv` | analytics | Completed order GMV tracking | Full order amount (metric, not revenue) |
| `escrow_volume` | analytics | Escrow funded events | Held amount (metric, not revenue) |

**Cash revenue** (recognized in `computePlatformRevenue()`): `platform_fee` + `featured_purchase` + `subscription_purchase` + `credit_purchase` + deposit fees (1%, separate ledger path).

---

## 3. Featured listing commission

**Flow:** Freelancer or agency spends promotional credits to feature a service, project, or portfolio for `FEATURED_DAYS` (7 days default).

```
User selects target → spendCredits() → recordFeaturedListing()
  → recordRevenueEntry({ type: "featured_purchase", amount: cost })
  → addNotification("Ajratilgan ro'yxat faollashdi")
```

**FastAPI implementation:**

```python
# POST /api/v1/featured/purchase
async def purchase_featured(...):
    async with db.begin():
        await credits_service.spend(user_id, cost, idempotency_key)
        await revenue_service.record(
            type="featured_purchase",
            amount_usd=cost,
            user_id=user_id,
            entity_id=slug,
            meta={"target_type": target_type},
        )
        await featured_service.activate_listing(...)
```

**Pricing:** Credits cost map in `featured-store.ts`. Revenue = credits debited (USD ledger equivalent). No additional platform fee on featured purchases — the credit price **is** the commission.

---

## 4. Subscription revenue

**Plans:** Free, Pro, Business (`subscription-store.ts` — `PLANS` constant).

| Plan | Monthly UZS | Features unlocked |
|------|-------------|-------------------|
| free | 0 | Base marketplace |
| pro | 99,000 | Priority proposals, analytics |
| business | 249,000 | Agency tools, team seats |

On `activatePlan()`:

```
recordRevenueEntry({ type: "subscription_purchase", amount: price, meta: { plan } })
```

**FastAPI:** `SubscriptionService.charge_renewal()` runs via Celery beat daily. Gateway charge in UZS; FX snapshot stored; USD amount posted to `revenue_ledger`. Failed renewal → grace period 3 days → downgrade to free.

**Commission model:** Flat subscription — not percentage of GMV. Complements transaction fees for power users.

---

## 5. Credits purchase revenue

Promotional credits (`credits-store.ts`) are **non-fungible** with main wallet balance. Users buy credit packs for featured listings and visibility boosts.

```
purchaseCredits(userId, amount, pricePaid)
  → addCredits()
  → recordRevenueEntry({ type: "credit_purchase", amount: pricePaid })
```

**FastAPI:** Separate `credits_wallets` table. Purchase via Humo/Uzcard/Payme webhook. Revenue recognized at webhook confirm — same pattern as wallet deposit but credits ledger, not `wallets.available`.

**Refund policy:** Credit refunds via admin only; revenue reversal posts negative `revenue_ledger` entry with linked `refund_id`.

---

## 6. Referral program (non-cash metric)

`referral_credit_spent` tracks when referral bonuses are consumed — **not direct cash revenue** but affects unit economics reporting in `/admin/founder`.

```
referral-store → recordAnalyticsEvent("referral_credit_spent")
getMarketplaceOverview().referralCreditsSpent
```

**Future commission:** Optional referral fee share (e.g., 1% of referred user's first order) — not implemented in demo; document as P2 in PRODUCT_REQUIREMENTS.

---

## 7. GMV and escrow volume (metrics, not revenue)

`computeGMV()` sums active + completed order amounts. `computeEscrowVolume()` sums `escrow_funded` analytics events.

These appear in:
- `/admin/analytics` dashboard
- `/admin/founder` monetization overview
- `getMarketplaceOverview()` for KPI cards

**Distinction:** GMV ≠ revenue. Platform take rate = `(platform_fees + subscriptions + featured + credits) / GMV`.

---

## 8. Revenue aggregation (FastAPI)

```python
class RevenueService:
    PLATFORM_FEE_RATE = Decimal("0.05")

    async def compute_platform_revenue(self, days: int = 30) -> Decimal:
        """Sum revenue_ledger where type IN cash-revenue types."""
        fees = await self.sum_ledger(["platform_fee", "deposit_fee"], days)
        featured = await self.sum_ledger(["featured_purchase"], days)
        subs = await self.sum_ledger(["subscription_purchase"], days)
        credits = await self.sum_ledger(["credit_purchase"], days)
        return fees + featured + subs + credits

    async def record(self, type: str, amount_usd: Decimal, **kwargs) -> RevenueEntry:
        """Append-only INSERT — never UPDATE."""
```

Admin `/admin/founder` reads from materialized view `mv_revenue_daily` refreshed hourly.

---

## 9. Double-entry mapping

| Revenue type | Debit account | Credit account |
|--------------|---------------|----------------|
| platform_fee (checkout) | client:available | platform:revenue |
| deposit_fee (1%) | client:available | platform:revenue |
| featured_purchase | credits:user (or gateway) | platform:revenue |
| subscription_purchase | external:gateway | platform:revenue |
| credit_purchase | external:gateway | platform:revenue |

Every `revenue_ledger` row links to `ledger_entries.transaction_group_id` for audit reconciliation.

---

## 10. Admin visibility

| Route | Data |
|-------|------|
| `/admin/payments` | Individual payment records including fee line items |
| `/admin/analytics` | GMV, revenue, escrow volume charts |
| `/admin/founder` | Top freelancers by revenue, subscription MRR |
| `/admin/audit` | Financial admin actions affecting revenue |

Finance admin role required for revenue export (CSV). 7-year retention on `revenue_ledger` per ADMIN_OS financial compliance.

---

## 11. Reporting invariants

Daily reconciliation job verifies:

```sql
SELECT SUM(amount) FROM revenue_ledger WHERE type = 'platform_fee'
  = SELECT SUM(platform_fee_usd) FROM payment_records WHERE type = 'escrow_transfer';
```

Mismatch → P1 alert, freeze new featured/subscription purchases until resolved.

---

## 12. Edge cases

| Case | Handling |
|------|----------|
| Order cancelled before fund | No platform_fee row — fee only at escrow fund |
| Partial refund | Pro-rata fee reversal via admin refund flow |
| Subscription mid-cycle upgrade | Charge delta only; new revenue row |
| Featured expires early (admin takedown) | No automatic refund; support discretion |
| Currency display UZS vs USD ledger | Admin reports show both; ledger always USD |

---

## 13. Migration from demo stores

| Demo function | Production replacement |
|---------------|------------------------|
| `recordRevenueEntry()` | `RevenueService.record()` in same TX as payment |
| `computePlatformRevenue()` | SQL aggregate on `revenue_ledger` |
| localStorage `ishbor-revenue-log` | PostgreSQL append-only table |

Remove all client-side revenue writes — `/revenue` route becomes read-only via API.

---

*Platform commission is multi-stream: transaction fees (5% + 1% deposit) plus subscriptions, featured listings, and credit packs. All streams converge in `revenue_ledger` for founder reporting and audit.*
