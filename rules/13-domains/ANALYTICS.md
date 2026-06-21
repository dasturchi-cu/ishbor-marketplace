# ANALYTICS — Domain Specification

## Purpose

User insight (client spend, freelancer earnings) and platform intelligence (founder/admin).

## Storage

`ishbor-analytics-events` — cap 5000 events, AnalyticsEventType enum  
`conversion-store` — funnel steps from analytics events  
`portfolio-analytics-store` — view/save/share/hire per portfolio slug  
`revenue-store` — GMV, platform fee, top earners  
`monetization-store` — MRR, ARPU, health scores

## Routes

- `/analytics` — role redirect hub
- `/analytics/client` — client metrics
- `/analytics/freelancer` — earnings, views
- `/admin/analytics`, `/admin/founder` — platform KPIs
- `/revenue` — admin revenue dashboard

## Event types (sample)

profile_view, project_view, service_view, application_sent, order_completed, escrow_funded, subscription_upgrade, search

## Functions

recordAnalyticsEvent, getDailyBuckets, recordConversionEvent, computeGMV, getMarketplaceOverview

## Target production

- Stream to analytics warehouse (ClickHouse/BigQuery)
- Client: PostHog or self-hosted Plausible for product analytics
- Server-side event ingestion API with batching
- GDPR: user opt-out in settings

## Scalability

5000 client cap unacceptable at scale — server-side unlimited with aggregation rollups

## Security

No PII in event payload labels — use entity IDs only
