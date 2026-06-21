# REFERRALS_MONETIZATION — Domain Specification

## Purpose

Growth (referrals) and revenue (subscriptions, credits, featured listings).

## Referral program

**Store:** referral-store (`ishbor-referrals`)  
**Functions:** getReferralLink, applyReferralCode, completeReferral, spendReferralCredits, getReferralStats  
**UI:** settings referral tab, ReferralQrCode component, `?ref=` on register

Flow: Register with ref → completeReferral after first order (target) → credits both parties

## Subscriptions

**Store:** subscription-store (`ishbor-subscriptions`, `ishbor-subscription-usage`)  
**Plans:** PLANS constant — free, pro, business tiers  
**Limits:** canSubmitProposal, canCreateService, hasAdvancedAnalytics  
**Functions:** upgradePlan, downgradePlan, cancelSubscription, recordProposalSubmitted

**Route:** `/subscription`, `/pricing`

## Credits

**Store:** credits-store (`ishbor-credits-wallet`)  
**Use:** featured listings, promotions  
**Route:** `/promotions`

## Featured listings

**Stores:** featured-store, featured-listings-store  
purchaseFeaturedListing — deducts credits, sets featured until date

## Revenue tracking

**Store:** revenue-store — PLATFORM_FEE = 5%  
recordRevenueEntry on order/escrow events  
**Admin:** `/revenue`, monetization-store MRR/ARPU

## Database (target)

`subscriptions`, `subscription_usage`, `referrals`, `referral_credits`, `featured_purchases`, `revenue_ledger`

## Payment integration

Payme for UZS subscription billing (target)  
Stripe optional USD

## Analytics

subscription_upgrade, featured_purchase events

## Edge cases

- Self-referral blocked
- Proposal usage resets monthly (YYYY-MM key)
- Downgrade at period end (graceful)
