# FASTAPI_ARCHITECTURE.md

**Project:** Ishbor Marketplace  
**Runtime:** FastAPI 0.115+ · uvicorn · Python 3.12  
**Deployment:** Docker on VPS behind nginx reverse proxy  
**Database:** PostgreSQL 16 (direct connection — no Supabase)

---

## 1. Purpose

FastAPI replaces the planned Nitro/Hono server layer as Ishbor's authoritative REST API. The frontend (TanStack Start) calls `/api/v1/*` over HTTPS; nginx terminates TLS and proxies to uvicorn workers.

**Design principles:**
- Thin routers — validation + auth + delegate to services
- Services own business logic and transaction boundaries
- Repositories isolate SQLAlchemy 2.0 async queries
- Domain models (Pydantic) decouple API DTOs from ORM entities
- Celery workers share the same service/repository layer via sync adapters

---

## 2. Request path

```
Client (TanStack Start)
  → Cloudflare CDN/WAF
  → nginx :443 (TLS, rate limit, gzip)
  → uvicorn :8000 (FastAPI app)
  → Middleware stack (§4)
  → Router (prefix /api/v1)
  → Depends(get_current_user) + RBAC
  → Service method
  → Repository → PostgreSQL
  → Response JSON + Set-Cookie + ETag
```

**WebSocket:** Separate uvicorn worker or same app at `/ws/v1` — see WEBSOCKET_SPECIFICATION.md.

---

## 3. Project structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app factory, lifespan, router mount
│   ├── config.py               # pydantic-settings (DATABASE_URL, REDIS_URL, ...)
│   ├── core/
│   │   ├── database.py         # AsyncEngine, async_sessionmaker
│   │   ├── redis.py            # Connection pool, get_redis dependency
│   │   ├── security.py         # bcrypt, token generation, SHA-256
│   │   ├── exceptions.py       # IshborHTTPException, error codes
│   │   └── logging.py          # structlog JSON
│   ├── middleware/
│   │   ├── request_id.py       # X-Request-Id propagation
│   │   ├── session.py          # Cookie/Bearer → SessionContext
│   │   ├── rate_limit.py       # Redis sliding window
│   │   └── cors.py             # Production origin allowlist
│   ├── dependencies/
│   │   ├── auth.py             # get_current_user, require_role, require_admin
│   │   ├── db.py               # get_db: AsyncSession
│   │   ├── redis.py            # get_redis
│   │   └── pagination.py       # PageParams, cursor helpers
│   ├── routers/
│   │   ├── __init__.py         # api_router aggregation
│   │   ├── auth.py             # /api/v1/auth/*
│   │   ├── users.py
│   │   ├── projects.py
│   │   ├── services.py
│   │   ├── applications.py
│   │   ├── orders.py
│   │   ├── escrow.py
│   │   ├── wallet.py
│   │   ├── messaging.py
│   │   ├── notifications.py
│   │   ├── agencies.py
│   │   ├── search.py
│   │   ├── ai.py
│   │   ├── files.py
│   │   ├── admin/              # /api/v1/admin/*
│   │   │   ├── dashboard.py
│   │   │   ├── users.py
│   │   │   └── ...
│   │   └── webhooks.py         # /webhooks/* (no /api/v1 prefix)
│   ├── services/               # Business logic (SERVICE_LAYER.md)
│   │   ├── auth_service.py
│   │   ├── project_service.py
│   │   └── ...
│   ├── repositories/           # Data access (REPOSITORY_LAYER.md)
│   │   ├── base.py
│   │   ├── user_repository.py
│   │   └── ...
│   ├── domain/                 # Pydantic models, state machines (DOMAIN_LAYER.md)
│   │   ├── auth.py
│   │   ├── orders.py
│   │   ├── events.py
│   │   └── enums.py
│   ├── schemas/                # API request/response DTOs (OpenAPI-facing)
│   │   ├── auth.py
│   │   ├── projects.py
│   │   └── ...
│   ├── workers/                # Celery app + task modules
│   │   ├── celery_app.py
│   │   ├── notifications.py
│   │   └── ...
│   └── websockets/
│       ├── gateway.py
│       └── handlers.py
├── alembic/                    # Database migrations
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
└── uvicorn.ini
```

---

## 4. Middleware stack (execution order)

| Order | Middleware | Responsibility |
|-------|------------|----------------|
| 1 | `CORSMiddleware` | Allow `ishbor.uz`, `staging.ishbor.uz` |
| 2 | `RequestIdMiddleware` | Generate/echo `X-Request-Id` |
| 3 | `SessionMiddleware` | Parse `ishbor_sid` cookie or Bearer → `request.state.auth` |
| 4 | `RateLimitMiddleware` | Redis limits (RATE_LIMIT_STORAGE.md) |
| 5 | `LoggingMiddleware` | structlog: method, path, status, duration, requestId |
| 6 | `GZipMiddleware` | Responses > 1KB |

**Exception handlers:** Map `IshborHTTPException` → JSON error model; unhandled → 500 + Sentry.

---

## 5. Dependency injection

FastAPI `Depends()` wires cross-cutting concerns. Services receive dependencies via constructor injection in router factories.

### 5.1 Core dependencies

```python
# app/dependencies/auth.py
async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> SessionContext | None:
    return request.state.auth  # set by SessionMiddleware

async def get_current_user(
    auth: SessionContext | None = Depends(get_optional_user),
) -> SessionContext:
    if not auth:
        raise IshborHTTPException(401, "AUTH_REQUIRED", "Tizimga kiring")
    if auth.account_status != "active":
        raise IshborHTTPException(403, "ACCOUNT_SUSPENDED", "Hisob bloklangan")
    return auth

def require_role(*roles: ActiveRole):
    async def _check(auth: SessionContext = Depends(get_current_user)) -> SessionContext:
        if auth.active_role not in roles:
            raise IshborHTTPException(403, "ROLE_FORBIDDEN", "Ruxsat yo'q")
        return auth
    return _check

def require_admin(section: AdminSection):
    async def _check(auth: SessionContext = Depends(get_current_user)) -> SessionContext:
        if not auth.is_admin or not can_access_section(auth.admin_role, section):
            raise IshborHTTPException(403, "ADMIN_FORBIDDEN", "Admin ruxsati yo'q")
        return auth
    return _check
```

### 5.2 Service factory pattern

```python
# app/dependencies/services.py
def get_project_service(
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> ProjectService:
    return ProjectService(
        project_repo=ProjectRepository(db),
        cache=CacheService(redis),
        outbox=OutboxRepository(db),
    )
```

Routers inject services — never instantiate repositories directly in route handlers.

### 5.3 Unit of Work

```python
async def get_uow(db: AsyncSession = Depends(get_db)) -> UnitOfWork:
    return UnitOfWork(db)
```

Money mutations use `async with uow:` to commit/rollback atomically (REPOSITORY_LAYER.md).

---

## 6. Application factory

```python
# app/main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis_pool()
    yield
    await close_redis_pool()
    await dispose_engine()

def create_app() -> FastAPI:
    app = FastAPI(
        title="Ishbor API",
        version="1.0.0",
        docs_url="/api/docs" if settings.ENV != "production" else None,
        openapi_url="/api/openapi.json" if settings.ENV != "production" else None,
        lifespan=lifespan,
    )
    register_middleware(app)
    register_exception_handlers(app)
    app.include_router(api_router, prefix="/api/v1")
    app.include_router(webhook_router, prefix="/webhooks")
    app.include_router(ws_router)  # /ws/v1
    return app
```

---

## 7. Router conventions

| Rule | Detail |
|------|--------|
| Prefix | All REST under `/api/v1` |
| Tags | One OpenAPI tag per router module |
| Response model | Pydantic `schemas/*` — never return ORM objects |
| Status codes | 201 for create, 204 for delete, 409 for conflict |
| Idempotency | `@require_idempotency_key` on checkout/wallet mutations |

```python
# app/routers/projects.py
router = APIRouter(prefix="/projects", tags=["Marketplace — Projects"])

@router.get("/{slug}", response_model=ProjectPublicResponse)
async def get_project(
    slug: str,
    service: ProjectService = Depends(get_project_service),
):
    return await service.get_public_by_slug(slug)
```

---

## 8. nginx reverse proxy

```nginx
upstream ishbor_api {
    server 127.0.0.1:8000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.ishbor.uz;

    location /api/ {
        proxy_pass http://ishbor_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location /ws/ {
        proxy_pass http://ishbor_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }
}
```

---

## 9. Docker deployment

```yaml
services:
  api:
    build: .
    command: uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000 --workers 4
    environment:
      DATABASE_URL: postgresql+asyncpg://...
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
    depends_on: [postgres, redis]
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports: ["443:443"]
    volumes: ["./nginx.conf:/etc/nginx/conf.d/default.conf"]
    depends_on: [api]
```

**Workers:** 4 uvicorn workers for beta (1 worker ≈ 100 concurrent requests with async I/O).

---

## 10. Configuration (pydantic-settings)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | `postgresql+asyncpg://user:pass@host:5432/ishbor` |
| `REDIS_URL` | ✅ | Application Redis DB 0 |
| `CELERY_BROKER_URL` | ✅ | Redis DB 1 |
| `SESSION_SECRET` | ✅ | Cookie signing |
| `ENV` | ✅ | `local` / `staging` / `production` |
| `CORS_ORIGINS` | ✅ | Comma-separated |
| `SENTRY_DSN` | Staging+ | Error tracking |

---

## 11. Testing strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | pytest | Services with mocked repos |
| Integration | pytest + testcontainers | PostgreSQL + Redis |
| API | httpx AsyncClient | Full request/response |
| Contract | OpenAPI schema diff | Frontend type generation |

Run: `pytest tests/ -v --cov=app --cov-report=term-missing`

---

## 12. OpenAPI and frontend integration

- OpenAPI spec at `/api/openapi.json` (non-production)
- Generate TypeScript types: `openapi-typescript http://localhost:8000/api/openapi.json -o src/lib/api-types.ts`
- TanStack Query hooks wrap generated fetchers

---

*See also: [SERVICE_LAYER.md](./SERVICE_LAYER.md), [API_SPECIFICATION.md](../API_SPECIFICATION.md), [BACKEND_ARCHITECTURE.md](../BACKEND_ARCHITECTURE.md)*
