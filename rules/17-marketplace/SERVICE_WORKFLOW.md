# SERVICE_WORKFLOW.md

**Domain:** Marketplace — freelancer productized offerings (gigs)  
**Frontend authority:** `src/lib/services-store.ts`  
**Backend target:** `ServiceService` + `services` table  
**Related:** [SERVICES.md](../../13-domains/SERVICES.md), [REFERRALS_MONETIZATION.md](../../13-domains/REFERRALS_MONETIZATION.md)

---

## 1. Business purpose

Services are **fixed-price gigs** with package tiers — alternative to custom project postings. Clients browse `/services`, purchase via `/checkout?service=slug`, and enter the order/escrow flow directly without applications.

**Storage key:** `ishbor-user-services`  
**Routes:** `/services`, `/services/$slug`, `/services/create`, `/my-services`, `/services/category/$slug`, `/promotions`

---

## 2. Entity model

### 2.1 StoredService fields

| Store field | DB column | Notes |
|-------------|-----------|-------|
| `id` | `services.id` | UUID |
| `slug` | `slug` | UNIQUE |
| `title` | `title` | |
| `description` | `description` | |
| `descriptionExtended` | `description_extended` | |
| `category` | `category` | |
| `price` | `base_price` | Entry package price |
| `delivery` | `delivery_label` | e.g. "3 kun" |
| `packages` | `service_packages` | Essential/Premium/Enterprise tiers |
| `faqs` | `service_faqs` | |
| `included` | `service_included_items` | |
| `status` | `status` | State machine |
| `ownerUserId` | `owner_user_id` | Freelancer FK |
| `seller`, `sellerUsername` | denormalized | Public profile |
| `featured`, `featuredUntil` | same | credits-store promotions |
| `rating`, `reviews` | cached aggregates | From reviews table |
| `inProgress`, `queuePosition` | `in_progress_count`, `queue_position` | Workload signals |

### 2.2 Status enum

Store: `draft` | `published` | `paused` | `archived`  
PostgreSQL `service_status`: same values

---

## 3. State machine

```
                 ┌─────────┐
                 │  draft  │◀── saveServiceDraft(), duplicateService()
                 └────┬────┘
                      │ publishService()
                 ┌────▼─────────┐
      ┌──────────│  published   │──────────┐
      │          └────┬─────────┘          │
      │ pause         │                    │ archive
      │          ┌────▼─────┐        ┌─────▼─────┐
      └─────────▶│  paused  │        │ archived  │
                 └────┬─────┘        └───────────┘
                      │ unpause
                      └──────────▶ published
```

### 3.1 Transition table

| From | To | Actor | Store function | API |
|------|-----|-------|----------------|-----|
| — | draft | Freelancer | `saveServiceDraft` | POST `/api/v1/services` |
| draft | published | Freelancer | `publishService` | POST `/api/v1/services/:slug/publish` |
| published | paused | Freelancer/Admin | `updateServiceStatus` | PATCH |
| paused | published | Freelancer | `updateServiceStatus` | PATCH |
| published | archived | Freelancer | `updateServiceStatus` | PATCH |
| draft | draft | Freelancer | `duplicateService` | POST `.../duplicate` |

### 3.2 Subscription limit gate

`publishService` checks `canCreateService(userId, publishedCount)` from subscription-store:

```typescript
if (!canCreateService(session.user.id, publishedCount)) {
  return { error: `Xizmat limiti tugadi (${publishedCount}/${max}). Pro yoki Elite rejaga o'ting.` };
}
```

Server equivalent: `403 SERVICE_LIMIT_REACHED` before status transition to `published`.

| Plan | maxServices (typical) |
|------|----------------------|
| free | 1 |
| pro | 5 |
| elite | unlimited |

---

## 4. Freelancer journey

### 4.1 Create

1. `/services/create` — `requireRole('freelancer')`
2. Form: title, category, description, packages, delivery, FAQs
3. Save draft → localStorage via `saveServiceDraft`
4. Publish → validates subscription limit → `published`

### 4.2 Manage

- `/my-services` — `getMyServices(ownerUserId)`
- Pause when queue full or vacation
- Duplicate → new draft copy with "(nusxa)" suffix
- Delete → soft delete (no active orders)

### 4.3 Promote

- `/promotions` — spend credits for `setServiceFeatured(slug, true, days)`
- Featured services rank higher in search (ranking-store)
- Cron expires `featured_until`

---

## 5. Client purchase journey

1. `/services/$slug` — `getServiceBySlug`
2. Select package tier
3. `/checkout?service=slug&package=premium`
4. Checkout creates order + escrow (no application step)
5. Order lifecycle → ORDER_LIFECYCLE.md

---

## 6. Store functions → API

| Function | Effect | API |
|----------|--------|-----|
| `getPublishedServices()` | Catalog | GET `/api/v1/services` |
| `getServiceBySlug` | Detail | GET `/api/v1/services/:slug` |
| `getMyServices` | Owner list | GET `/api/v1/services?mine=true` |
| `saveServiceDraft` | draft | POST/PATCH |
| `publishService` | published | POST `.../publish` |
| `updateServiceStatus` | pause/archive | PATCH |
| `setServiceFeatured` | featured | POST `/api/v1/promotions/feature` |
| `duplicateService` | new draft | POST `.../duplicate` |
| `deleteService` | soft delete | DELETE |
| `isServiceOwner` | guard | server RBAC |

---

## 7. Featured workflow

```
create → publish → (optional) setServiceFeatured(true, 7 days)
                         │
                         ▼
              featured_until = now + 7d
                         │
                         ▼
         Cron expire_featured → featured = false
```

**Credits:** credits-store deducts on feature purchase  
**Analytics:** `service_view`, featured conversion in featured-listings-store

API:

```
POST /api/v1/promotions/feature
{ "entityType": "service", "slug": "mobile-app-design-fintech", "days": 7 }
```

---

## 8. Validations

| Rule | Error |
|------|-------|
| Title min 10 chars on publish | `VALIDATION_ERROR` |
| Base price > 0 | `VALIDATION_ERROR` |
| At least one package | `VALIDATION_ERROR` |
| Delivery label required | `VALIDATION_ERROR` |
| Subscription limit | `SERVICE_LIMIT_REACHED` |
| Slug unique | `SLUG_TAKEN` |

---

## 9. Permissions

| Action | Role |
|--------|------|
| CRUD own service | freelancer |
| Purchase | client (checkout) |
| View published | public |
| Admin mod | `require_admin('marketplace')` |

---

## 10. Admin integration

**Route:** `/admin/services`

| Action | Effect |
|--------|--------|
| Approve | `admin_status = approved` |
| Suspend | `updateServiceStatus(..., 'paused')` |
| Reject | hidden from catalog |

```
GET   /api/v1/admin/services
PATCH /api/v1/admin/services/:slug
```

Syncs `updateServiceStatus` when admin suspends — same as projects admin flow.

---

## 11. Side effects on publish

| System | Action |
|--------|--------|
| Outbox | `ServicePublished` |
| Celery | `ishbor.marketplace.index_service` |
| Celery | `ishbor.marketplace.notify_new_listing` |
| Referral | `completeReferral` on first publish |
| Search | FTS upsert |
| Cache | Invalidate category lists |

---

## 12. API reference

```
GET    /api/v1/services?category=&sort=-rating&page=1
GET    /api/v1/services/:slug
POST   /api/v1/services
PATCH  /api/v1/services/:slug
POST   /api/v1/services/:slug/publish
POST   /api/v1/services/:slug/duplicate
DELETE /api/v1/services/:slug
GET    /api/v1/services?mine=true
```

---

## 13. Edge cases

| Case | Handling |
|------|----------|
| Publish at limit | Return subscription upgrade CTA |
| Pause with active orders | Orders continue; new checkout blocked |
| Archive vs delete | Archive = reversible pause-like; delete = soft delete |
| Duplicate featured flags | Copy resets `featured=false` |
| Price change mid-order | Order locks price at checkout — service edit doesn't affect active orders |
| Mock + stored merge | `getAllServices()` merges mock-data — API returns DB only |

---

## 14. Scalability

- Index `(category, status)` WHERE published
- Cache popular services per category in Redis
- `in_progress_count` updated on order create/complete
- Package tiers normalized in `service_packages` — avoid JSON blob

---

## 15. Related documents

- [PROJECT_WORKFLOW.md](./PROJECT_WORKFLOW.md)
- [ORDER_LIFECYCLE.md](./ORDER_LIFECYCLE.md)
- [PROJECT_WORKFLOW.md](./PROJECT_WORKFLOW.md)
- [CRON_JOBS.md](../11-backend/fastapi/CRON_JOBS.md) — featured expiry

---

*Service lifecycle: draft → published ↔ paused → archived. publishService enforces subscription limits; featured listings via credits and cron expiry.*
