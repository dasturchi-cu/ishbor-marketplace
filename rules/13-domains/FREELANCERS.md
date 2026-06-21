# FREELANCERS — Domain Specification

## Purpose

Independent professionals selling services and applying to projects — supply of labor.

## Workspace routes

`/dashboard/freelancer`, `/my-services`, `/services/create`, `/applications`, `/portfolio/*`, `/freelancers/manage`, `/analytics/freelancer`, `/promotions`

## Key stores

- `services-store`, `portfolio-store` — supply assets
- `applications-store` — win work
- `orders-store`, `wallet-store` — earn
- `reputation-store`, `reviews-store` — trust display
- `response-metrics-store` — response time badge
- `ai-opportunity-store` — dashboard opportunity score

## Public profile

`/freelancers/$username` — mock-data seed (8 freelancers) + dynamic fields  
SaveButton, ReviewForm, portfolio grid, hire CTA

## Permissions

Freelancer-only paths enforced in guards + auth-bootstrap

## Subscription limits

Free tier: proposal count/month via subscription-store  
Plan boosts: ranking-store boost from getPlanRankingBoost

## Database (target)

`users.user_type=freelancer`, username unique, skills array on user_profiles

## Demo identity

`nargiza@ishbor.uz` — username `nargiza`, Top Rated, $45/hr

## Scalability

Freelancer search: FTS on skills + title, materialized ranking scores nightly

See [FREELANCERS.md mock-data](../src/lib/mock-data.ts) for seed personas
