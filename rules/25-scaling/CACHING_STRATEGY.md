# CACHING_STRATEGY.md

**Ishbor marketplace — Redis layers, CDN, browser cache headers**  
**Principle:** Cache reads aggressively, invalidate on publish events, never cache money

---

## 1. Cache hierarchy

```text
Browser cache (Cache-Control headers)
    ↓ miss
CDN edge (Cloudflare / nginx proxy_cache)
    ↓ miss
Application Redis cache (entity + list caches)
    ↓ miss
PostgreSQL read replica (Phase 2+)
    ↓ miss
PostgreSQL primary
```

**Never cached:** wallet balance, escrow status, checkout session, auth session validation (use Redis TTL only), private messages content.

---

## 2. Redis cache layers

Per [REDIS_ARCHITECTURE.md](../11-backend/redis/REDIS_ARCHITECTURE.md) and [CACHE_STRATEGY.md](../11-backend/redis/CACHE_STRATEGY.md).

### Layer 1 — Session cache

| Key | Pattern | TTL | Invalidation |
|-----|---------|-----|--------------|
| Session | `sess:{session_id}` | 24h–30d | Logout, password change |
| User context | `user:ctx:{user_id}` | 5 min | Profile update, role switch |

**Not optional** — required for multi-instance FastAPI.

### Layer 2 — Entity cache

| Entity | Key pattern | TTL | Invalidation event |
|--------|-------------|-----|-------------------|
| Project (public) | `proj:pub:{slug}` | 120s | ProjectUpdated, Published |
| Service (public) | `svc:pub:{slug}` | 120s | ServiceUpdated |
| Freelancer profile | `fl:pub:{username}` | 60s | ProfileUpdated |
| Agency | `agency:{slug}` | 120s | AgencyUpdated |
| Portfolio | `port:pub:{slug}` | 120s | PortfolioUpdated |
| Order (participant) | `order:{id}:{user_id}` | **30s** | OrderStatusChanged |
| User notifications count | `notify:count:{user_id}` | 30s | NotificationCreated |

### Layer 3 — List / search cache

| List | Key pattern | TTL | Invalidation |
|------|-------------|-----|--------------|
| Projects page 1 | `list:projects:p1:{filters_hash}` | 60s | Any project publish |
| Services category | `list:services:cat:{cat}:p1` | 60s | Service publish |
| Freelancers ranking | `list:fl:rank:p1` | 60s | Ranking cron refresh |
| Search results | `search:{query_hash}:p1` | 30s | Publish events |
| Featured listings | `list:featured` | 300s | Featured purchase |

**Filters hash:** MD5 of sorted query params — avoid cache key explosion.

### Layer 4 — Computed / expensive

| Computation | Key | TTL | Refresh |
|-------------|-----|-----|---------|
| Freelancer stats MV | `mv:fl_stats:{username}` | 900s | Cron 15 min |
| Marketplace rankings | `mv:rankings` | 900s | Cron 15 min |
| AI opportunity score | `ai:opp:{user_id}` | 300s | Profile change |
| Smart match results | `ai:match:{user_id}:{role}` | 300s | Profile/project change |

### Layer 5 — Rate limits & quotas

| Key | TTL | Purpose |
|-----|-----|---------|
| `rl:auth:{email}` | 15 min | Login throttle |
| `rl:api:{user_id}` | 1 min | General API |
| `ai:rl:{user_id}:{tool}` | 1 hour | AI limits |
| `sub:usage:{user_id}:{month}` | 35 days | Subscription counters |

Not application cache — do not evict with `allkeys-lru` without separating Redis DB index.

---

## 3. Redis configuration

### Memory

```text
maxmemory 2gb          # Phase 1
maxmemory-policy allkeys-lru
```

### Database index separation

| DB index | Use |
|----------|-----|
| 0 | Sessions + entity cache |
| 1 | Celery broker |
| 2 | Rate limits |
| 3 | WS pub/sub |

Prevents Celery queue flush affecting sessions.

### Serialization

| Format | Use |
|--------|-----|
| JSON | Entity caches (human debuggable) |
| MessagePack | High-volume list caches (optional) |

---

## 4. Cache invalidation strategy

### Event-driven (preferred)

Per [EVENT_ARCHITECTURE.md](../11-backend/EVENT_ARCHITECTURE.md):

```text
ProjectPublished event
  → DELETE proj:pub:{slug}
  → DELETE list:projects:p1:*
  → DELETE search:*  (or tag-based purge)
  → CDN purge OG image if changed
```

### Tag-based invalidation (Phase 2)

```text
SET list:projects:p1:abc123 {...} 
SADD tag:projects abc123
SADD tag:projects:published abc123

# On publish:
SMEMBERS tag:projects → DELETE each key
```

### TTL fallback

All caches have TTL — stale data self-heals. Maximum staleness = TTL.

| Data type | Max staleness acceptable |
|-----------|--------------------------|
| Public listings | 60s |
| Search | 30s |
| Profile | 60s |
| Notifications count | 30s |
| Rankings | 15 min |

---

## 5. CDN caching (summary)

Full detail: [CDN_STRATEGY.md](./CDN_STRATEGY.md).

| Asset | CDN TTL |
|-------|---------|
| Hashed JS/CSS | 1 year immutable |
| Public images | 24 hours |
| HTML | no-cache |

---

## 6. Browser cache headers

### Nginx / Nitro response headers

| Resource | Cache-Control |
|----------|---------------|
| `/assets/*.{js,css}` | `public, max-age=31536000, immutable` |
| `/assets/images/static/*` | `public, max-age=604800` |
| `/media/*` (avatars) | `public, max-age=3600` |
| `index.html` | `no-cache, must-revalidate` |
| `/api/*` | `private, no-store` |

### ETag

Enable ETag on HTML shell for efficient revalidation:

```nginx
etag on;
```

### Service worker (future)

Not in MVP — if added, cache only static assets, never API responses.

---

## 7. Client-side caching (demo → production)

### Current demo (localStorage)

| Store | Cache |
|-------|-------|
| All `*-store.ts` | localStorage persist |

**Production:** Replace with API fetch + React Query / TanStack Query:

| Pattern | TTL |
|---------|-----|
| Public lists | staleTime 60s |
| User dashboard | staleTime 30s |
| Wallet | staleTime 0 (always refetch) |
| Messages | Real-time WS invalidation |

### useSyncExternalStore

Store subscriptions are **in-memory client cache** — invalidate via `bumpStoreVersion` on mutations. Server cache is separate layer.

---

## 8. What NOT to cache

| Data | Reason |
|------|--------|
| `wallet.available` | Financial accuracy |
| `escrow.status` | Legal/trust |
| Checkout payment intent | PCI flow |
| Admin audit logs | Compliance |
| KYC documents | Privacy |
| Session auth check result | Security — short Redis TTL only |
| AI streaming responses | Ephemeral |

---

## 9. Cache warming

### On deploy

```text
1. Hit /health
2. Pre-warm: GET /api/projects?page=1
3. Pre-warm: GET /api/services?page=1
4. Pre-warm: GET /api/freelancers?page=1
```

### Cron (every 15 min)

Refresh materialized views → populate Redis `mv:*` keys.

---

## 10. Monitoring

| Metric | Target | Alert |
|--------|--------|-------|
| Redis hit rate | >70% | <50% |
| Redis memory | <70% | >85% |
| Cache stampede | — | Single key QPS spike |
| Origin QPS vs CDN | CDN absorbs 80% | Origin spike |
| pg cache hit ratio | >95% | <90% |

### Cache stampede prevention

```text
# Lock pattern
SET lock:proj:pub:slug NX EX 10
if acquired:
    fetch from DB, SET cache
else:
  wait 50ms, retry GET cache
```

---

## 11. Phase rollout

| Phase | Caching |
|-------|---------|
| Beta (1k) | Redis entity cache + nginx static headers |
| Launch (10k) | + CDN + read replica + list caches |
| Growth (100k) | + tag invalidation + Meilisearch cache + MV cron |

---

## 12. Testing cache behavior

| Test | Assert |
|------|--------|
| Publish project | List cache invalidated within 1s |
| Update avatar | Old CDN URL purged |
| Wallet deposit | Balance not served from cache |
| Redis restart | App recovers (cache miss storm acceptable) |
| TTL expiry | Stale data refreshes |

Integration: [INTEGRATION_TEST_PLAN.md](../22-testing/INTEGRATION_TEST_PLAN.md).

---

## 13. References

- [REDIS_ARCHITECTURE.md](../11-backend/redis/REDIS_ARCHITECTURE.md)
- [CACHE_STRATEGY.md](../11-backend/redis/CACHE_STRATEGY.md)
- [CDN_STRATEGY.md](./CDN_STRATEGY.md)
- [SCALING_STRATEGY.md](./SCALING_STRATEGY.md)
- [PERFORMANCE_STANDARDS.md](../06-quality/PERFORMANCE_STANDARDS.md)

---

*Last updated: 2026-06-20*
