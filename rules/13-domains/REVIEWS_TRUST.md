# REVIEWS_TRUST — Domain Specification

## Purpose

Two-sided reputation after order completion — drives marketplace trust and ranking.

## Storage

`ishbor-reviews` — StoredReview[]  
`verified-users-store` — Set of verified user IDs (`ishbor-verified-user-ids`)  
`verification-settings-store` — KYC document workflow  
`reputation-store` — computed tiers from reviews + metrics

## Review lifecycle

1. Order status = completed
2. canReviewOrder checks participant + not already reviewed
3. submitReview → updates average rating on profiles
4. getReviewsForFreelancer / getReviewsForClient on public pages

## Reputation tiers

computeFreelancerReputation, computeClientReputation → trustScore, tier label, color

## Trust signals in UI

- EscrowShield on all payment surfaces
- Identity verified badge (identityVerified on mock freelancers)
- Response time from response-metrics-store
- Success score, completion rate on cards

## Admin

verifyAdminUser → setUserVerified  
/admin/verifications queue

## Database (target)

`reviews` — order_id UNIQUE (one review per direction per order), rating 1-5, text  
`verification_requests` — document URLs in R2

## API

POST /api/v1/orders/:id/reviews  
GET /api/v1/users/:id/reviews

## Security

Only order participants can review; only after completed; server validates orderId ownership

## Scalability

Materialized avg_rating on user_profiles updated by trigger

See [TRUST_SYSTEM.md](../04-trust/TRUST_SYSTEM.md)
