# PROJECT_WORKFLOW.md

**Domain:** Marketplace — client-posted work listings  
**Frontend authority:** `src/lib/projects-store.ts`  
**Backend target:** `ProjectService` + `projects` table  
**Related:** [PROJECTS.md](../../13-domains/PROJECTS.md), [APPLICATIONS.md](../../13-domains/APPLICATIONS.md)

---

## 1. Business purpose

Projects are the **supply-side job postings** on Ishbor — clients describe work, set budget, and receive freelancer applications. Successful applications flow into orders and escrow (north star: Applications → Orders → Escrow).

**Storage key (client):** `ishbor-user-projects`  
**Routes:** `/projects`, `/projects/$slug`, `/projects/create`, `/my-projects`, `/projects/preview`

---

## 2. Entity model

### 2.1 Project fields (store → PostgreSQL)

| Store field | DB column | Notes |
|-------------|-----------|-------|
| `id` | `projects.id` | UUID in production |
| `slug` | `projects.slug` | UNIQUE, slugify from title |
| `title` | `title` | Required on publish |
| `description` | `description` | Required on publish |
| `budget` | `budget` | numeric(12,2) |
| `budgetType` | `budget_type` | `fixed` \| `hourly` |
| `category` | `category` | |
| `skills` | `skills` | text[] |
| `duration` | `duration` | |
| `experienceLevel` | `experience_level` | entry/intermediate/expert |
| `status` | `status` | State machine |
| `ownerUserId` | `owner_user_id` | FK users |
| `client`, `clientSlug` | denormalized | From session at create |
| `proposals` | `proposals_count` | Incremented on application |
| `featured`, `featuredUntil` | same | Promotions / credits |
| `escrowProtected` | `escrow_protected` | Default true |
| `attachments` | `project_attachments` | file_id FKs |
| `adminStatus` | `admin_status` | Admin moderation queue |

### 2.2 Status enum

PostgreSQL: `project_status` = `draft` | `published` | `paused` | `closed`

---

## 3. State machine

```
                    ┌─────────┐
                    │  draft  │◀── saveProjectDraft()
                    └────┬────┘
                         │ publishProject() / POST .../publish
                    ┌────▼─────────┐
         ┌─────────│  published   │─────────┐
         │         └────┬─────────┘         │
         │ pause        │                   │ admin suspend
         │         ┌────▼─────┐       ┌─────▼─────┐
         └────────▶│  paused  │       │  closed   │
                   └────┬─────┘       └───────────┘
                        │ resume           ▲
                        └──────────────────┘
                              close (owner/admin)
```

### 3.1 Transition table

| From | To | Actor | Store function | API |
|------|-----|-------|----------------|-----|
| — | draft | Client | `saveProjectDraft` | POST/PATCH `/api/v1/projects` |
| draft | published | Client | `publishProject` | POST `/api/v1/projects/:slug/publish` |
| published | paused | Client/Admin | `updateProjectStatus` | PATCH `/api/v1/projects/:slug` `{ status }` |
| paused | published | Client/Admin | `updateProjectStatus` | PATCH |
| published | closed | Client/Admin | `updateProjectStatus` | PATCH |
| paused | closed | Client/Admin | `updateProjectStatus` | PATCH |
| any | deleted | Client | `deleteProject` | DELETE `/api/v1/projects/:slug` |

**Invalid transition:** `409 INVALID_PROJECT_TRANSITION`

### 3.2 Visibility rules

| Status | Public `/projects` | Search | Applications accepted |
|--------|-------------------|--------|----------------------|
| draft | Hidden | No | No |
| published | Yes (if `isMarketplaceReady`) | Yes | Yes |
| paused | Hidden | No | No (existing apps remain) |
| closed | Hidden | No | No |

`getPublishedProjects()` filters: `status === published` AND `isMarketplaceReady(p)` from project-validation.ts.

---

## 4. Client journey

### 4.1 Guest planning

1. `/projects/preview` — explore form without auth
2. Redirect to `/login?return=/projects/create` on publish attempt

### 4.2 Authenticated client create

1. `/projects/create` — `requireRole('client')`
2. Form: title, description, budget, category, skills, timeline, attachments
3. **Save draft** → `saveProjectDraft(input, ctx, existingSlug?)` → status `draft`
4. **Publish** → `publishProject(...)` → status `published`

### 4.3 Post-publish

1. Listing appears on `/projects` and `/search`
2. `notifyNewListing` → job alerts (alerts-store)
3. `completeReferral` if first publish
4. `recordAnalyticsEvent({ type: 'project_created' })`
5. Freelancers apply → applications-store
6. Client accepts application → order + escrow created

### 4.4 Manage

- `/my-projects` — `getMyProjects(ownerUserId)`
- Edit draft or published (PATCH)
- Pause when hiring fulfilled or temporarily unavailable
- Close when position filled outside platform or cancelled

---

## 5. Store functions → API mapping

| Function | Effect | Production endpoint |
|----------|--------|---------------------|
| `getAllProjects()` | Merge localStorage + mock | GET `/api/v1/projects` (admin/internal) |
| `getPublishedProjects()` | Public catalog | GET `/api/v1/projects?status=published` |
| `getProjectBySlug(slug)` | Detail | GET `/api/v1/projects/:slug` |
| `getMyProjects(userId)` | Owner list | GET `/api/v1/projects?mine=true` |
| `saveProjectDraft` | status=draft | POST/PATCH |
| `publishProject` | status=published | POST `.../publish` |
| `updateProjectStatus` | pause/close | PATCH |
| `updateProjectFeatured` | featured flag | POST `/api/v1/promotions/feature` |
| `deleteProject` | soft delete | DELETE |
| `isProjectOwner` | guard | Server RBAC |
| `subscribeProjects` | useSyncExternalStore | WebSocket/cache invalidation |

---

## 6. Validations

### 6.1 Publish guards (project-validation.ts)

Required on publish:

- `title` — min 10 chars
- `description` — min 50 chars
- `budget` — > 0
- `category` — non-empty
- At least one skill

API returns `422 PROJECT_NOT_READY` with field-specific Uzbek messages.

### 6.2 Slug uniqueness

`uniqueSlug(title, existing)` — server enforces partial unique index on active slugs:

```sql
CREATE UNIQUE INDEX uq_projects_slug_active ON projects(slug) WHERE deleted_at IS NULL;
```

Conflict → `409 SLUG_TAKEN`

### 6.3 Delete guards

Cannot delete if:

- Open applications pending
- Active order in progress
- Funded escrow on related order

---

## 7. Permissions (RBAC)

| Action | Role | Gate |
|--------|------|------|
| Create/edit own | client | `require_role('client')` |
| View published | public | — |
| View draft | owner | `isProjectOwner` |
| Admin mod | admin | `require_admin('marketplace')` |
| Force close/suspend | admin | `updateAdminProject` → sync store |

---

## 8. Admin integration

**Route:** `/admin/projects`  
**Mock:** admin-data-store projects queue

| Admin action | Effect on marketplace |
|--------------|----------------------|
| Approve | `admin_status = approved` |
| Suspend | `admin_status = suspended`, `updateProjectStatus(..., 'paused')` |
| Reject | `admin_status = rejected`, hidden from catalog |
| Feature | `updateProjectFeatured` |

API:

```
GET  /api/v1/admin/projects?admin_status=pending
PATCH /api/v1/admin/projects/:slug
```

Audit: `project_admin_status_changed`

---

## 9. Side effects on publish

| System | Event |
|--------|-------|
| Outbox | `ProjectPublished` |
| Celery | `ishbor.marketplace.index_project` |
| Celery | `ishbor.marketplace.notify_job_alerts` (via alerts) |
| Analytics | `project_created`, `project_view` on detail |
| Search | FTS document upsert |
| Cache | Invalidate `ishbor:cache:project:{slug}` |
| Referral | `completeReferral(userId)` |

---

## 10. API reference

```
GET    /api/v1/projects?q=&category=&sort=-published_at&page=1&limit=20
GET    /api/v1/projects/:slug
POST   /api/v1/projects
PATCH  /api/v1/projects/:slug
POST   /api/v1/projects/:slug/publish
POST   /api/v1/projects/:slug/restore
DELETE /api/v1/projects/:slug
GET    /api/v1/projects?mine=true
```

**List response:**

```json
{
  "data": [{
    "slug": "fintech-app-redesign",
    "title": "Fintech App Redesign",
    "status": "published",
    "budget": 15000,
    "budgetType": "fixed",
    "proposals": 12,
    "postedAgo": "Hozirgina"
  }],
  "meta": { "page": 1, "total": 1402, "hasMore": true }
}
```

---

## 11. Edge cases

| Case | Handling |
|------|----------|
| Publish with duplicate slug | Auto-append `-1`, `-2` (store) — server same |
| Edit published project | Allowed — re-index search; notify applicants if material change |
| Close with pending apps | Auto-reject pending applications with notification |
| Featured expires | Cron `expire_featured` clears flag |
| Client account deleted | Project soft-deleted; slug blocked |
| Admin suspend during active hire | Pause only — existing order continues |

---

## 12. Scalability

- 10k active projects: GIN FTS on title+description
- Redis cache popular categories
- Partial index `WHERE status='published' AND deleted_at IS NULL`
- `proposals_count` denormalized — increment via trigger on applications insert

---

## 13. Related documents

- [SERVICE_WORKFLOW.md](./SERVICE_WORKFLOW.md) — freelancer gigs alternative
- [ORDER_LIFECYCLE.md](./ORDER_LIFECYCLE.md) — post-acceptance flow
- [APPLICATIONS.md](../../13-domains/APPLICATIONS.md)
- [SOFT_DELETE_STRATEGY.md](../11-backend/postgresql/SOFT_DELETE_STRATEGY.md)

---

*Project lifecycle: draft → published ↔ paused → closed. Maps projects-store publish/update/delete to /api/v1/projects with server-enforced transitions and admin moderation sync.*
