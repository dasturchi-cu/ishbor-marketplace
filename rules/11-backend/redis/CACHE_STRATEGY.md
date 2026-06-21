# CACHE_STRATEGY.md

**Project:** Ishbor Marketplace  
**Pattern:** Cache-aside with write-through invalidation  
**Primary store:** PostgreSQL 16 · **Cache store:** Redis 7 (`ishbor:cache:*`)

---

## 1. Purpose

Marketplace browse pages (projects, services, freelancers, agencies) currently load from client-side stores and `mock-data.ts`. The backend cache layer serves public read endpoints at <50ms p95 while PostgreSQL handles authoritative writes.

**Principles:**
- Cache only denormalized read DTOs — never wallet, escrow, or session payloads.
- Every cache key has an explicit TTL.
- Every write path publishes invalidation for affected keys (sync in request, async for fan-out).
- Stale cache is acceptable for public listings (max TTL 5 min); never for auth or money.

---

## 2. Key catalog

### 2.1 Entity detail caches

| Key pattern | Value | TTL | Source endpoint |
|-------------|-------|-----|-----------------|
| `ishbor:cache:project:{slug}` | `ProjectPublicDTO` JSON | 300s | `GET /api/v1/projects/:slug` |
| `ishbor:cache:service:{slug}` | `ServicePublicDTO` JSON | 300s | `GET /api/v1/services/:slug` |
| `ishbor:cache:freelancer:{username}` | `FreelancerPublicDTO` JSON | 300s | `GET /api/v1/freelancers/:username` |
| `ishbor:cache:client:{slug}` | `ClientPublicDTO` JSON | 300s | `GET /api/v1/clients/:slug` |
| `ishbor:cache:agency:{slug}` | `AgencyPublicDTO` JSON | 300s | `GET /api/v1/agencies/:slug` |
| `ishbor:cache:portfolio:{slug}` | `PortfolioPublicDTO` JSON | 600s | `GET /api/v1/portfolio/:slug` |

**Serialization:** JSON via `orjson.dumps()` with `default=str` for datetimes. Include `cachedAt` and source `etag` in wrapper:

```json
{
  "data": { "...": "ProjectPublicDTO fields" },
  "cachedAt": "2026-06-20T10:00:00Z",
  "etag": "proj_abc_v3"
}
```

### 2.2 List and search caches

| Key pattern | Value | TTL | Notes |
|-------------|-------|-----|-------|
| `ishbor:cache:projects:list:{hash}` | Paginated list JSON | 120s | Hash of query params |
| `ishbor:cache:services:list:{hash}` | Paginated list JSON | 120s | category, sort, page, limit |
| `ishbor:cache:freelancers:list:{hash}` | Paginated list JSON | 120s | skills, rate filters |
| `ishbor:cache:agencies:list:{hash}` | Paginated list JSON | 120s | marketplace filters |
| `ishbor:cache:search:{hash}` | Search results JSON | 60s | Full-text + filters |
| `ishbor:cache:search:suggest:{q}` | Suggestion array | 30s | Autocomplete prefix |
| `ishbor:cache:featured:listings` | Featured entities JSON | 300s | Homepage carousel |

**Query hash:** SHA-256 of sorted, normalized query string (lowercase keys, stable ordering).

### 2.3 Aggregated / computed caches

| Key pattern | Value | TTL | Refreshed by |
|-------------|-------|-----|--------------|
| `ishbor:cache:ranking:freelancer:{username}` | Score + badges | 900s | `refresh_rankings` cron |
| `ishbor:cache:ranking:agency:{slug}` | Agency score | 900s | `refresh_rankings` cron |
| `ishbor:cache:stats:freelancer:{username}` | Response rate, completion | 600s | OrderCompleted events |
| `ishbor:cache:subscription:plans` | Public plan list | 3600s | Admin plan change |
| `ishbor:cache:categories:tree` | Category hierarchy | 3600s | Rarely changes |

### 2.4 User-scoped read caches (auth required)

| Key pattern | Value | TTL | Notes |
|-------------|-------|-----|-------|
| `ishbor:cache:user:{user_id}:notifications:unread_count` | Integer | 30s | Invalidated on WS event |
| `ishbor:cache:user:{user_id}:subscription` | Plan + usage | 120s | Invalidated on upgrade |
| `ishbor:cache:user:{user_id}:crm:summary` | CRM counts | 180s | Invalidated on order/message |

**Rule:** User-scoped keys include `user_id` UUID — never cache by email or username alone for private data.

---

## 3. Cache-aside read flow

```
GET /api/v1/projects/:slug
  1. key = f"ishbor:cache:project:{slug}"
  2. cached = await redis.get(key)
  3. if cached:
       return JSON + ETag header from wrapper.etag
  4. row = await project_repo.get_public_by_slug(slug)
  5. if not row: raise 404
  6. dto = ProjectPublicDTO.from_orm(row)
  7. wrapper = { data: dto, cachedAt: now(), etag: row.version_tag }
  8. await redis.setex(key, 300, orjson.dumps(wrapper))
  9. return dto + ETag
```

**Thundering herd:** On cache miss for hot keys, acquire `ishbor:lock:cache:project:{slug}` (TTL 5s) before DB query. Second waiter polls cache or waits for lock release.

---

## 4. Invalidation on write events

Invalidation runs in the **same request** after PostgreSQL commit for entity detail keys. List/search keys are invalidated asynchronously via Celery task `cache.invalidate_pattern`.

### 4.1 Project writes

| Write operation | Keys invalidated (sync) | Keys invalidated (async) |
|-----------------|-------------------------|--------------------------|
| `POST /projects` | — | `ishbor:cache:projects:list:*` |
| `PATCH /projects/:slug` | `ishbor:cache:project:{slug}` | `ishbor:cache:projects:list:*`, `ishbor:cache:search:*` |
| `POST /projects/:slug/publish` | same as PATCH | + job alert matching cache |
| `POST /projects/:slug/pause` | same as PATCH | — |
| `POST /projects/:slug/close` | same as PATCH | — |
| `DELETE /projects/:slug` | same as PATCH | — |
| Admin status change | same as PATCH | — |

**Domain event:** `ProjectPublished`, `ProjectClosed` → SearchIndexer also upserts `search_documents`.

### 4.2 Service writes

| Write operation | Keys invalidated |
|-----------------|------------------|
| `PATCH /services/:slug` | `ishbor:cache:service:{slug}`, owner freelancer cache |
| `POST /services/:slug/publish` | + list/search patterns, featured if applicable |
| Featured purchase | `ishbor:cache:featured:listings` |

### 4.3 Profile writes

| Write operation | Keys invalidated |
|-----------------|------------------|
| `PATCH /users/me/profile` | `ishbor:cache:freelancer:{username}` OR `ishbor:cache:client:{slug}` |
| Verification approved | Same + ranking cache |
| Portfolio publish | `ishbor:cache:portfolio:{slug}`, freelancer cache |

### 4.4 Agency writes

| Write operation | Keys invalidated |
|-----------------|------------------|
| `PATCH /agencies/:slug` | `ishbor:cache:agency:{slug}`, `ishbor:cache:agencies:list:*` |
| Member join/leave | Agency cache + member public profiles |

### 4.5 Commerce writes (minimal caching)

Orders, escrow, and wallet endpoints are **never cached** in Redis. Only invalidate related public profile stats:

| Event | Invalidated keys |
|-------|------------------|
| `OrderCompleted` | `ishbor:cache:stats:freelancer:{username}` |
| `ReviewSubmitted` | Same + ranking caches |
| `SubscriptionUpgraded` | `ishbor:cache:user:{user_id}:subscription` |

---

## 5. Invalidation implementation

### 5.1 Single-key delete (sync)

```python
async def invalidate_project(slug: str, redis: Redis) -> None:
    await redis.delete(f"ishbor:cache:project:{slug}")
```

### 5.2 Pattern invalidation (async Celery task)

```python
@celery_app.task(name="ishbor.cache.invalidate_pattern", max_retries=3)
def invalidate_pattern(pattern: str) -> int:
    """SCAN + DELETE — never KEYS in production."""
    deleted = 0
    for key in scan_iter(match=pattern, count=100):
        redis.delete(key)
        deleted += 1
    return deleted
```

**Registered patterns:**

| Trigger | Pattern |
|---------|---------|
| Any marketplace list change | `ishbor:cache:projects:list:*` |
| Search index update | `ishbor:cache:search:*` |
| Ranking cron | `ishbor:cache:ranking:*` |

### 5.3 Version-tag alternative (phase 2)

For high-churn list pages, store `ishbor:cache:version:projects` counter. List keys embed version: `ishbor:cache:projects:list:v{version}:{hash}`. Increment version on any project write — old keys expire via TTL without SCAN.

**Action item:** Implement version-tag when `evicted_keys` metric rises due to pattern SCAN load.

---

## 6. HTTP cache headers (CDN layer)

Redis cache is origin-side. Cloudflare/nginx adds:

| Endpoint type | `Cache-Control` | `ETag` |
|---------------|-----------------|--------|
| Public entity detail | `public, max-age=60, stale-while-revalidate=120` | From wrapper.etag |
| Public lists | `public, max-age=30, stale-while-revalidate=60` | List hash |
| Auth endpoints | `private, no-store` | — |
| Admin | `private, no-store` | — |

---

## 7. TTL summary table

| Category | Default TTL | Max TTL | Rationale |
|----------|-------------|---------|-----------|
| Entity detail | 300s | 600s | Balance freshness vs DB load |
| Lists | 120s | 120s | Filters change frequently |
| Search | 60s | 60s | User expects fresh results |
| Suggest | 30s | 30s | Typing latency sensitive |
| Rankings | 900s | 900s | Cron refreshes every 15 min |
| Static config | 3600s | 86400s | Plans, categories |
| User private | 30–180s | 180s | Short — WS invalidates |

---

## 8. Monitoring and debugging

| Metric | Target |
|--------|--------|
| Cache hit ratio (entity detail) | > 85% |
| Cache hit ratio (lists) | > 70% |
| p95 origin response (cache hit) | < 15ms |
| p95 origin response (cache miss) | < 150ms |
| Invalidation lag (event → key gone) | < 2s sync, < 10s async |

**Debug commands (staging only):**
```bash
redis-cli -a $REDIS_PASSWORD GET "ishbor:cache:project:webflow-marketing-site"
redis-cli -a $REDIS_PASSWORD TTL "ishbor:cache:project:webflow-marketing-site"
redis-cli -a $REDIS_PASSWORD SCAN 0 MATCH "ishbor:cache:projects:list:*" COUNT 20
```

---

## 9. Anti-patterns (prohibited)

| Anti-pattern | Why |
|--------------|-----|
| Cache wallet balance | Money must come from PostgreSQL ledger |
| Cache escrow state | Optimistic UI forbidden for release |
| Infinite TTL on any key | Memory leak; violates allkeys-lru intent |
| Cache admin responses | RBAC-sensitive |
| Write-through cache for mutations | Use PostgreSQL transactions + invalidate |

---

*Maps to: BACKEND_ARCHITECTURE §5 data authority, API_SPECIFICATION §5–6 marketplace endpoints, EVENT_ARCHITECTURE SearchIndexer consumer.*
