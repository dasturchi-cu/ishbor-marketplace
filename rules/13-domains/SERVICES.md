# SERVICES — Domain Specification

## Purpose & business value

Freelancer productized offerings (gigs) with fixed packages — alternative to custom project postings.

## Entity: StoredService

**Status:** `draft` | `published` | `paused`  
**Storage:** `ishbor-user-services`

## Key functions

publishService, saveServiceDraft, updateServiceStatus, duplicateService, setServiceFeatured, getServiceBySlug, isServiceOwner

## User journey

1. `/services/create` → package tiers, delivery time, price
2. `/my-services` manage listings
3. Public `/services/$slug` → Buy → `/checkout?service=slug`
4. `/promotions` → feature listing (credits-store)

## Permissions

- CRUD: freelancer role
- Purchase: client role at checkout

## Subscription limits

`canCreateService` in subscription-store by plan tier

## Database requirements

Tables: `services`, `service_packages`, `service_faqs`  
Link seller_id → users.id

## API requirements

```
GET/POST/PATCH /api/v1/services
POST /api/v1/services/:slug/publish
GET  /api/v1/services/:slug
```

## Analytics

`service_view`, featured-listings performance

## Admin

`/admin/services` — adminStatus sync via updateServiceStatus

Routes: `/services`, `/services/category/$slug`, `/services/$slug`, `/services/create`, `/my-services`
