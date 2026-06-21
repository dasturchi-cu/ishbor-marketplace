# REDIS_ARCHITECTURE.md

**Project:** Ishbor Marketplace  
**Version:** 1.0  
**Stack:** Redis 7.x on VPS (Docker), co-located with FastAPI + Celery workers  
**Replaces:** Client-side localStorage caches, in-memory rate limits, synchronous side effects

---

## 1. Purpose

Redis is the shared ephemeral data plane for the Ishbor backend. It serves four distinct roles on a **single Redis 7 instance** during phase 1:

| Role | Namespace prefix | Eviction |
|------|------------------|----------|
| Application cache | `ishbor:cache:*` | `allkeys-lru` |
| Session lookup cache | `ishbor:session:*` | `volatile-ttl` |
| Rate limiting | `ishbor:rl:*` | TTL-driven |
| Celery broker + results | `ishbor:celery:*` | Task TTL |
| WebSocket pub/sub | `ishbor:ws:*` | No persistence |
| Distributed locks | `ishbor:lock:*` | TTL 30s max |

PostgreSQL remains the source of truth for sessions, money, and domain state. Redis accelerates reads and coordinates async work.

---

## 2. Deployment topology (phase 1 — single VPS)

```
┌─────────────────────────────────────────────────────────────┐
│  VPS (Ubuntu 22.04, 4 vCPU / 8 GB RAM minimum)              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ nginx       │  │ FastAPI     │  │ Celery workers (×3) │  │
│  │ :443 → :8000│  │ uvicorn     │  │ notifications,email,│  │
│  └─────────────┘  └──────┬──────┘  │ escrow, ai, ...     │  │
│                          │         └──────────┬──────────┘  │
│                          └──────────┬─────────┘             │
│                                     ▼                       │
│                          ┌─────────────────────┐            │
│                          │ redis:7-alpine      │            │
│                          │ maxmemory 512mb     │            │
│                          │ bind 127.0.0.1      │            │
│                          └─────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│ PostgreSQL 16       │  (managed Neon OR self-hosted on separate VPS)
│ (not Supabase)      │
└─────────────────────┘
```

**Network rules:**
- Redis listens on `127.0.0.1:6379` only — never exposed to the public internet.
- All FastAPI and Celery containers connect via `REDIS_URL=redis://:PASSWORD@127.0.0.1:6379/0`.
- TLS is optional on localhost; required if Redis moves to a dedicated host.

---

## 3. Docker configuration

```yaml
# docker-compose.yml (excerpt)
services:
  redis:
    image: redis:7-alpine
    command: >
      redis-server
      --maxmemory 512mb
      --maxmemory-policy allkeys-lru
      --requirepass ${REDIS_PASSWORD}
      --appendonly yes
      --appendfsync everysec
      --save 900 1
      --save 300 10
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
```

**Database index allocation:**

| DB index | Consumer | Notes |
|----------|----------|-------|
| `0` | Application (cache, session, rate limit, locks) | Default `REDIS_URL` |
| `1` | Celery broker | `CELERY_BROKER_URL=.../1` |
| `2` | Celery result backend (optional) | Prefer PostgreSQL for durable results |

---

## 4. Memory limits and eviction

### 4.1 Global settings

| Setting | Value | Rationale |
|---------|-------|-----------|
| `maxmemory` | 512 MB (beta) → 2 GB (prod) | Fits VPS RAM alongside FastAPI + workers |
| `maxmemory-policy` | `allkeys-lru` | Cache namespace is safe to evict; see §4.2 |
| `maxmemory-samples` | 10 | LRU approximation quality |

### 4.2 Namespace-specific eviction behavior

| Namespace | Policy override | Safe to lose? |
|-----------|-----------------|---------------|
| `ishbor:cache:*` | Subject to `allkeys-lru` | ✅ — rebuild from PostgreSQL |
| `ishbor:session:*` | Always set `EX` TTL; evict only after expiry | ⚠️ — fallback to `sessions` table |
| `ishbor:rl:*` | Short TTL (15 min max) | ✅ — limits reset naturally |
| `ishbor:celery:*` | Celery manages task TTL | ❌ — monitor queue depth |
| `ishbor:lock:*` | TTL 30s auto-release | ✅ |

**Rule:** Never store wallet balances, escrow amounts, or order state solely in Redis.

### 4.3 Memory budget (512 MB beta)

| Namespace | Budget | Keys (est.) |
|-----------|--------|-------------|
| Cache | 300 MB | ~50k serialized JSON blobs |
| Sessions | 80 MB | ~40k active sessions |
| Rate limits | 20 MB | ~100k sliding windows |
| Celery | 80 MB | Queue backlog |
| Pub/sub + overhead | 32 MB | — |

**Action item:** Alert when `used_memory > 85%` of `maxmemory` (see MONITORING_ARCHITECTURE.md).

---

## 5. Key naming convention

All Ishbor keys use colon-separated hierarchy:

```
ishbor:{domain}:{entity}:{identifier}[:{sub-key}]
```

Examples:
- `ishbor:cache:project:webflow-marketing-site`
- `ishbor:session:a3f8c2d1e9b7...` (SHA-256 hex of cookie token)
- `ishbor:rl:login:sardor@asaka.uz`
- `ishbor:rl:api:usr_7f3a2b1c`
- `ishbor:lock:escrow:fund:esc_abc123`
- `ishbor:ws:channel:conversation:conv_xyz`

**Prohibited:** Unprefixed keys, keys without TTL on cache/session namespaces, storing PII in key names (use hashes).

---

## 6. Connection pooling (FastAPI + Celery)

Use `redis-py` async connection pool shared via FastAPI dependency injection:

```python
# app/core/redis.py
from redis.asyncio import ConnectionPool, Redis

pool = ConnectionPool.from_url(settings.REDIS_URL, max_connections=20, decode_responses=True)

async def get_redis() -> Redis:
    return Redis(connection_pool=pool)
```

| Parameter | FastAPI | Celery worker |
|-----------|---------|---------------|
| `max_connections` | 20 per uvicorn worker | 5 per worker process |
| `socket_timeout` | 5s | 5s |
| `socket_connect_timeout` | 2s | 2s |
| `retry_on_timeout` | True | True |
| `health_check_interval` | 30s | 30s |

**Rule:** Use pipelining for bulk cache invalidation (≥3 keys). Never run `KEYS *` in production — use `SCAN` with `ishbor:cache:*` pattern.

---

## 7. Persistence and durability

| Feature | Setting | Purpose |
|---------|---------|---------|
| AOF | `appendonly yes`, `appendfsync everysec` | Recover Celery broker state after crash |
| RDB snapshots | `save 900 1`, `save 300 10` | Point-in-time backup |
| Session cache | No persistence required | PostgreSQL `sessions` table is primary |
| Cache | No persistence required | Rebuilt on miss |

**Backup:** Daily `BGSAVE` to VPS backup volume; retain 7 days. Cache loss is acceptable; Celery unacked messages may need replay from outbox.

---

## 8. Security

| Control | Implementation |
|---------|----------------|
| Authentication | `requirepass` + Redis ACL user `ishbor_app` with `-@dangerous` |
| Network | Bind `127.0.0.1`; firewall deny 6379 inbound |
| TLS | Enable when Redis on separate host (`rediss://`) |
| Secrets | `REDIS_PASSWORD` in `.env`, never committed |
| Command blocking | Disable `FLUSHALL`, `CONFIG`, `DEBUG` for app ACL |

---

## 9. Future cluster migration (phase 2+)

When single-instance Redis exceeds 70% memory sustained or queue lag > 30s:

```
Phase 2a: Read replica
  - Primary: cache writes + Celery broker
  - Replica: cache reads (ishbor:cache:* only)

Phase 2b: Redis Cluster (3 primaries + 3 replicas)
  - Use hash tags for multi-key ops: ishbor:{cache}:project:{slug}
  - Celery broker stays on dedicated single instance (DB 1)
  - Session cache co-located with primary holding user shard
```

**Hash tag example for atomic invalidation:**
```
ishbor:{marketplace}:cache:project:{slug}
ishbor:{marketplace}:cache:service:{slug}
```

All keys sharing `{marketplace}` land on the same cluster slot, enabling `MULTI`/`EXEC` invalidation batches.

**Action items before cluster:**
1. Audit all Lua scripts for key locality.
2. Replace any `CROSSSLOT` multi-key transactions with hash-tagged keys.
3. Load-test Celery throughput on dedicated broker node.

---

## 10. Observability

| Metric | Source | Alert threshold |
|--------|--------|-----------------|
| `used_memory` | `INFO memory` | > 85% maxmemory |
| `evicted_keys` | `INFO stats` | > 1000/min sustained |
| `connected_clients` | `INFO clients` | > 80% pool capacity |
| Celery queue depth | `LLEN ishbor:celery:*` | > 500 per queue |
| Cache hit ratio | App metric `redis_cache_hits / (hits + misses)` | < 70% on marketplace reads |
| Slow commands | `SLOWLOG GET 10` | Any command > 10ms |

Export via Redis Exporter → Prometheus → Grafana dashboard `Ishbor/Redis`.

---

## 11. Environment variables

| Variable | Example | Required |
|----------|---------|----------|
| `REDIS_URL` | `redis://:secret@127.0.0.1:6379/0` | ✅ |
| `REDIS_PASSWORD` | strong random | ✅ |
| `CELERY_BROKER_URL` | `redis://:secret@127.0.0.1:6379/1` | ✅ |
| `REDIS_MAX_CONNECTIONS` | `20` | Optional |
| `REDIS_CACHE_DEFAULT_TTL` | `300` | Optional (seconds) |

---

*See also: [CACHE_STRATEGY.md](./CACHE_STRATEGY.md), [SESSION_STORAGE.md](./SESSION_STORAGE.md), [QUEUE_ARCHITECTURE.md](./QUEUE_ARCHITECTURE.md), [RATE_LIMIT_STORAGE.md](./RATE_LIMIT_STORAGE.md)*
