# MULTI_SERVER_ARCHITECTURE.md

**Ishbor marketplace — horizontal scaling, WebSocket stickiness, read replicas**  
**Target:** Stateless FastAPI tier behind Nginx load balancer

---

## 1. Architecture overview

```text
                    ┌─────────────────────────────────────┐
                    │  Cloudflare (optional CDN + WAF)  │
                    └──────────────────┬──────────────────┘
                                       │
                    ┌──────────────────▼──────────────────┐
                    │  Nginx Load Balancer (ishbor.uz)    │
                    │  SSL termination, rate limit, WS    │
                    └──────────┬─────────────┬────────────┘
                               │             │
              ┌────────────────▼──┐    ┌───────▼────────────────┐
              │  API Instance 1   │    │  API Instance 2..N     │
              │  FastAPI + Uvicorn│    │  FastAPI + Uvicorn     │
              └────────┬──────────┘    └───────────┬────────────┘
                       │                           │
                       └───────────┬───────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  PostgreSQL     │    │  Redis          │    │  MinIO          │
│  Primary        │    │  Sessions       │    │  Object storage │
│  + Read Replica │    │  Cache + PubSub │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Celery Workers │
│  (async jobs)   │
└─────────────────┘
```

---

## 2. Stateless FastAPI tier

### Design rules

| Rule | Implementation |
|------|----------------|
| No in-memory session | Session in PostgreSQL + Redis cache |
| No local file state | MinIO for all uploads |
| No in-process cache only | Redis for shared cache |
| Idempotent writes | Payment confirm, proposal submit |
| Health checks | `/health` (liveness), `/ready` (DB+Redis) |

### Uvicorn deployment

```text
# Per API instance
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

| Phase | Instances | Workers each | Total workers |
|-------|-----------|--------------|---------------|
| Beta | 1 | 4 | 4 |
| Launch | 2 | 2 | 4 |
| Growth | 4–10 | 2 | 8–20 |

**Formula:** `workers = (2 × CPU cores) + 1` per instance — tune by load test.

### Docker Compose scaling

```text
docker compose up -d --scale api=3
```

Nginx upstream block lists all `api` container IPs via Docker DNS.

---

## 3. Nginx load balancing

### HTTP upstream

```nginx
upstream ishbor_api {
    least_conn;
    server api_1:8000 max_fails=3 fail_timeout=30s;
    server api_2:8000 max_fails=3 fail_timeout=30s;
    server api_3:8000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

| Algorithm | Use case |
|-----------|----------|
| `least_conn` | Default — API requests vary in duration |
| `ip_hash` | WebSocket sticky (see §4) |
| `round_robin` | Even load when requests uniform |

### Health-aware routing

```nginx
# Passive health: max_fails removes unhealthy upstream
# Active health (optional): nginx plus or custom health checker
```

Unhealthy instance: auto-remove from pool, alert on-call.

---

## 4. WebSocket scaling

### Challenge

WebSocket connections are **stateful** — a chat message sent to instance A must reach user connected to instance B.

### Solution: Redis pub/sub fan-out

```text
User A (WS on Instance 1) sends message
  → Instance 1 persists to PostgreSQL
  → Instance 1 PUBLISH redis channel "chat:{conversation_id}"
  → All instances SUBSCRIBE — Instance 2 pushes to User B's WS
```

Per [WEBSOCKET_ARCHITECTURE.md](../11-backend/websockets/WEBSOCKET_ARCHITECTURE.md):

| Component | Detail |
|-----------|--------|
| Channel naming | `chat:{conversation_id}`, `notify:{user_id}` |
| Max subscriptions/conn | 50 |
| Heartbeat | 30s ping/pong |
| Reconnect | Client exponential backoff |

### Sticky sessions (complementary)

For connection stability (not message routing — pub/sub handles that):

```nginx
upstream ishbor_ws {
    ip_hash;
    server api_1:8000;
    server api_2:8000;
}
```

| Approach | Pros | Cons |
|----------|------|------|
| Redis pub/sub only | True horizontal scale | Slightly higher latency |
| ip_hash + pub/sub | Stable connection to one node | Uneven load behind NAT |
| Dedicated WS tier | Clean separation | More infra |

**Ishbor recommendation:** Redis pub/sub (required) + `ip_hash` for WS location (optional, Phase 2).

### WS connection limits

| Metric | Per instance | Action |
|--------|--------------|--------|
| Connections | 5,000 | Scale WS-capable instances |
| Memory per conn | ~10 KB | Monitor |
| Message rate | 100/sec/instance | Backpressure |

---

## 5. PostgreSQL read replicas

### Write vs read split

| Operation | Target |
|-----------|--------|
| INSERT/UPDATE/DELETE orders, escrow, wallet | **Primary only** |
| INSERT messages | Primary |
| SELECT public projects, services, freelancers | Read replica OK |
| SELECT user dashboard (own data) | Primary or replica with caution* |
| Search queries | Replica preferred |
| Admin analytics | Replica |

*User's own orders/wallet: use primary or short TTL cache with invalidation — stale dashboard acceptable for <30s on lists, **never** on wallet balance display.

### SQLAlchemy routing (target)

```text
@router.get("/projects")
async def list_projects(db: AsyncSession = Depends(get_read_db)):
    ...

@router.post("/checkout")
async def checkout(db: AsyncSession = Depends(get_write_db)):
    ...
```

### Replication lag monitoring

| Lag | Action |
|-----|--------|
| <1s | Normal |
| 1–5s | Monitor |
| >5s | Route critical reads to primary, alert |
| >30s | Incident — replica broken |

```sql
SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()));
```

### Connection pooling

**PgBouncer** between API and Postgres:

| Setting | Value |
|---------|-------|
| Pool mode | transaction |
| Default pool size | 20 per API instance |
| Max client connections | 200 |

---

## 6. Redis cluster layout

### Single node (Phase 1)

All Redis uses: sessions, cache, rate limits, Celery broker, WS pub/sub.

**Risk:** Single point of failure — accept for beta with persistence (AOF).

### Sentinel / Cluster (Phase 2+)

| Use | Phase 2 | Phase 3 |
|-----|---------|---------|
| Sessions + cache | Sentinel 3-node | Cluster |
| Celery broker | Dedicated Redis instance | Dedicated |
| WS pub/sub | Shared or dedicated | Dedicated 2-node |

**Memory planning:**

| Key type | Estimate at 10k users |
|----------|----------------------|
| Sessions | 10k × 2 KB = 20 MB |
| Cache | 500 MB |
| Rate limits | 50 MB |
| Pub/sub buffers | 100 MB |
| **Total** | ~1 GB + headroom → 4 GB instance |

---

## 7. Celery worker tier

Separate from API instances — CPU-bound jobs don't block HTTP.

| Queue | Workers (Phase 2) | Tasks |
|-------|-------------------|-------|
| `default` | 2 | General |
| `notifications` | 2 | Push, in-app |
| `email` | 2 | Transactional |
| `sms` | 1 | Eskiz OTP |
| `media` | 2 | Thumbnails |
| `analytics` | 2 | Event processing |
| `ai` | 2 | LLM async jobs |

Scale workers independently of API count.

---

## 8. MinIO scaling

| Phase | Topology |
|-------|----------|
| 1 | Single MinIO docker volume |
| 2 | MinIO erasure coding 4 drives |
| 3 | External S3-compatible (Wasabi/Backblaze) + CDN |

Public bucket (`ishbor-public`) — CDN origin.  
Private buckets (KYC) — API presigned URLs only, no CDN.

---

## 9. Nitro frontend (static)

TanStack Start/Nitro build is **static + SSR**:

| Deployment | Scale method |
|------------|--------------|
| Static assets | CDN (see CDN_STRATEGY.md) |
| SSR server | 2+ Nitro instances if SSR-heavy |

Current Ishbor: mostly SPA — CDN for `.output/public` suffices.

---

## 10. Network topology (VPS)

### Single VPS (Phase 1)

```text
[VPS]
  nginx:443
  api:8000
  worker
  postgres:5432 (internal)
  redis:6379 (internal)
  minio:9000 (internal)
```

### Multi-VPS (Phase 2)

```text
[LB VPS] nginx
[App VPS 1] api, worker
[App VPS 2] api, worker
[DB VPS] postgres primary + replica on same or separate
[Cache VPS] redis
```

Private network between VPS (Hetzner vSwitch).

---

## 11. Deployment flow (zero-downtime target)

```text
1. Build new API image :new-sha
2. Rolling update: start new container, health check, drain old
3. Nginx upstream auto-updates via Docker DNS
4. Run migrations BEFORE traffic shift (backward compatible)
5. Frontend symlink swap (CDN purge)
6. Monitor 15 min
```

Incompatible migration: maintenance window per ROLLBACK_PLAN.md.

---

## 12. Failure modes

| Failure | Behavior |
|---------|------------|
| API instance dies | Nginx removes from pool, users retry |
| Primary DB dies | Failover to standby (manual Phase 2, automated Phase 3) |
| Replica dies | Reads route to primary, degraded performance |
| Redis dies | Sessions from PG (slower), cache miss storm — restart Redis ASAP |
| Split brain | Prevent with single primary + quorum sentinel |

---

## 13. References

- [NGINX_ARCHITECTURE.md](../11-backend/infrastructure/NGINX_ARCHITECTURE.md)
- [WEBSOCKET_ARCHITECTURE.md](../11-backend/websockets/WEBSOCKET_ARCHITECTURE.md)
- [POSTGRESQL_ARCHITECTURE.md](../11-backend/postgresql/POSTGRESQL_ARCHITECTURE.md)
- [REDIS_ARCHITECTURE.md](../11-backend/redis/REDIS_ARCHITECTURE.md)
- [SCALING_STRATEGY.md](./SCALING_STRATEGY.md)

---

*Last updated: 2026-06-20*
