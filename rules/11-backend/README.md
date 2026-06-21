# Ishbor Backend Documentation

**Status:** Architecture documentation complete — **FastAPI implementation NOT started**  
**Stack:** FastAPI · PostgreSQL 16 · Redis 7 · MinIO · WebSockets · Celery · Docker · Nginx · VPS  
**Explicitly excluded:** Supabase (no tables, RLS, or auth flows)

**Frontend contract source:** `src/lib/*-store.ts`, `rules/13-domains/*`, `rules/02-integration/*`

---

## Reading order (new backend team)

| # | Document | Purpose |
|---|----------|---------|
| 1 | [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) | System overview, module map |
| 2 | [fastapi/FASTAPI_ARCHITECTURE.md](./fastapi/FASTAPI_ARCHITECTURE.md) | App structure, middleware, DI |
| 3 | [API_SPECIFICATION.md](./API_SPECIFICATION.md) | 120+ REST endpoints, DTOs |
| 4 | [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Canonical table list |
| 5 | [postgresql/POSTGRESQL_ARCHITECTURE.md](./postgresql/POSTGRESQL_ARCHITECTURE.md) | VPS Postgres, PgBouncer, Alembic |
| 6 | [auth/AUTH_ARCHITECTURE.md](./auth/AUTH_ARCHITECTURE.md) | Sessions, OAuth, OTP |
| 7 | [RBAC_SPECIFICATION.md](./RBAC_SPECIFICATION.md) | Platform + agency + admin guards |
| 8 | [payments/PAYMENT_ARCHITECTURE.md](./payments/PAYMENT_ARCHITECTURE.md) | Wallet, escrow, Humo/Uzcard |
| 9 | [websockets/WEBSOCKET_ARCHITECTURE.md](./websockets/WEBSOCKET_ARCHITECTURE.md) | Realtime chat + notifications |
| 10 | [infrastructure/DEPLOYMENT_GUIDE.md](./infrastructure/DEPLOYMENT_GUIDE.md) | VPS deploy for ishbor.uz |
| 11 | [BACKEND_IMPLEMENTATION_MASTER_PLAN.md](./BACKEND_IMPLEMENTATION_MASTER_PLAN.md) | 8-phase roadmap |
| 12 | [DOCUMENTATION_COMPLETENESS_REPORT.md](./DOCUMENTATION_COMPLETENESS_REPORT.md) | Coverage audit |

---

## Documentation index by system

### PostgreSQL (`postgresql/`)

| Document | Description |
|----------|-------------|
| [POSTGRESQL_ARCHITECTURE.md](./postgresql/POSTGRESQL_ARCHITECTURE.md) | VPS topology, extensions, schemas |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | All tables (canonical) |
| [ERD.md](./postgresql/ERD.md) | Entity-relationship diagrams |
| [TABLE_SPECIFICATIONS.md](./postgresql/TABLE_SPECIFICATIONS.md) | Per-table columns, FKs, demo rows |
| [INDEXING_STRATEGY.md](./postgresql/INDEXING_STRATEGY.md) | Indexes with rationale |
| [DATABASE_PERFORMANCE.md](./postgresql/DATABASE_PERFORMANCE.md) | Vacuum, partitioning, MVs |
| [MIGRATION_STRATEGY.md](./postgresql/MIGRATION_STRATEGY.md) | Alembic workflow |
| [QUERY_OPTIMIZATION.md](./postgresql/QUERY_OPTIMIZATION.md) | Hot queries + EXPLAIN |
| [DATABASE_BACKUP_STRATEGY.md](./postgresql/DATABASE_BACKUP_STRATEGY.md) | pg_dump, WAL, RPO/RTO |

### Redis (`redis/`)

| Document | Description |
|----------|-------------|
| [REDIS_ARCHITECTURE.md](./redis/REDIS_ARCHITECTURE.md) | Single-node VPS, eviction |
| [CACHE_STRATEGY.md](./redis/CACHE_STRATEGY.md) | Cache keys, invalidation |
| [SESSION_STORAGE.md](./redis/SESSION_STORAGE.md) | PG + Redis hybrid sessions |
| [QUEUE_ARCHITECTURE.md](./redis/QUEUE_ARCHITECTURE.md) | Celery queues |
| [RATE_LIMIT_STORAGE.md](./redis/RATE_LIMIT_STORAGE.md) | Sliding window keys |

### FastAPI (`fastapi/`)

| Document | Description |
|----------|-------------|
| [FASTAPI_ARCHITECTURE.md](./fastapi/FASTAPI_ARCHITECTURE.md) | Project layout, middleware |
| [API_SPECIFICATION.md](./API_SPECIFICATION.md) | REST contract (root) |
| [SERVICE_LAYER.md](./fastapi/SERVICE_LAYER.md) | 32 service classes |
| [REPOSITORY_LAYER.md](./fastapi/REPOSITORY_LAYER.md) | SQLAlchemy async repos |
| [DOMAIN_LAYER.md](./fastapi/DOMAIN_LAYER.md) | Pydantic, state machines |
| [BACKGROUND_JOBS.md](./fastapi/BACKGROUND_JOBS.md) | Celery tasks |

### MinIO (`minio/`)

| Document | Description |
|----------|-------------|
| [MINIO_ARCHITECTURE.md](./minio/MINIO_ARCHITECTURE.md) | Self-hosted buckets |
| [FILE_STORAGE_ARCHITECTURE.md](./minio/FILE_STORAGE_ARCHITECTURE.md) | Storage policy |
| [UPLOAD_FLOW.md](./minio/UPLOAD_FLOW.md) | Presigned PUT |
| [MEDIA_PROCESSING.md](./minio/MEDIA_PROCESSING.md) | Thumbnails, resize |
| [FILE_SECURITY.md](./minio/FILE_SECURITY.md) | ClamAV, KYC ACL |

### Authentication (`auth/`)

| Document | Description |
|----------|-------------|
| [AUTH_ARCHITECTURE.md](./auth/AUTH_ARCHITECTURE.md) | Overview |
| [AUTH_FLOW.md](./auth/AUTH_FLOW.md) | Sequence diagrams |
| [JWT_STRATEGY.md](./auth/JWT_STRATEGY.md) | Mobile tokens (optional) |
| [COOKIE_STRATEGY.md](./auth/COOKIE_STRATEGY.md) | `ishbor_sid` cookie |
| [SESSION_MANAGEMENT.md](./auth/SESSION_MANAGEMENT.md) | Rotation, limits |
| [OAUTH_ARCHITECTURE.md](./auth/OAUTH_ARCHITECTURE.md) | Google PKCE |
| [PASSWORD_RESET_FLOW.md](./auth/PASSWORD_RESET_FLOW.md) | Reset tokens |
| [EMAIL_VERIFICATION_FLOW.md](./auth/EMAIL_VERIFICATION_FLOW.md) | Email + OTP |
| [PERMISSION_MATRIX.md](./auth/PERMISSION_MATRIX.md) | Role × resource matrix |
| [RBAC_SPECIFICATION.md](./RBAC_SPECIFICATION.md) | FastAPI Depends guards |

### WebSockets (`websockets/`)

| Document | Description |
|----------|-------------|
| [WEBSOCKET_ARCHITECTURE.md](./websockets/WEBSOCKET_ARCHITECTURE.md) | FastAPI WS + Redis |
| [REALTIME_EVENTS.md](./websockets/REALTIME_EVENTS.md) | Envelope format |
| [CHAT_EVENTS.md](./websockets/CHAT_EVENTS.md) | Messages, offers |
| [NOTIFICATION_EVENTS.md](./websockets/NOTIFICATION_EVENTS.md) | Unread counts |
| [PRESENCE_SYSTEM.md](./websockets/PRESENCE_SYSTEM.md) | Online status |
| [WEBSOCKET_SECURITY.md](./websockets/WEBSOCKET_SECURITY.md) | WS auth, ACL |

### Payments (`payments/`)

| Document | Description |
|----------|-------------|
| [PAYMENT_ARCHITECTURE.md](./payments/PAYMENT_ARCHITECTURE.md) | Ledger overview |
| [HUMO_INTEGRATION.md](./payments/HUMO_INTEGRATION.md) | Humo cards |
| [UZCARD_INTEGRATION.md](./payments/UZCARD_INTEGRATION.md) | Uzcard / Payme |
| [ESCROW_SYSTEM.md](./payments/ESCROW_SYSTEM.md) | Escrow state machine |
| [WALLET_SYSTEM.md](./payments/WALLET_SYSTEM.md) | Double-entry ledger |
| [TRANSACTION_FLOW.md](./payments/TRANSACTION_FLOW.md) | Atomic TX boundaries |
| [REFUND_FLOW.md](./payments/REFUND_FLOW.md) | Refund paths |
| [DISPUTE_FLOW.md](./payments/DISPUTE_FLOW.md) | Dispute resolution |

### Infrastructure (`infrastructure/`)

| Document | Description |
|----------|-------------|
| [INFRASTRUCTURE_ARCHITECTURE.md](./infrastructure/INFRASTRUCTURE_ARCHITECTURE.md) | VPS topology |
| [SERVER_ARCHITECTURE.md](./infrastructure/SERVER_ARCHITECTURE.md) | VPS sizing |
| [NGINX_ARCHITECTURE.md](./infrastructure/NGINX_ARCHITECTURE.md) | Reverse proxy, SSL |
| [DOCKER_ARCHITECTURE.md](./infrastructure/DOCKER_ARCHITECTURE.md) | Container images |
| [DOCKER_COMPOSE_STRUCTURE.md](./infrastructure/DOCKER_COMPOSE_STRUCTURE.md) | Full compose |
| [DEPLOYMENT_GUIDE.md](./infrastructure/DEPLOYMENT_GUIDE.md) | Step-by-step deploy |
| [CI_CD_PIPELINE.md](./infrastructure/CI_CD_PIPELINE.md) | GitHub Actions |
| [ENVIRONMENT_STRATEGY.md](./infrastructure/ENVIRONMENT_STRATEGY.md) | dev/staging/prod |
| [MONITORING_ARCHITECTURE.md](./MONITORING_ARCHITECTURE.md) | Prometheus/Grafana |
| [LOGGING_ARCHITECTURE.md](./infrastructure/LOGGING_ARCHITECTURE.md) | structlog JSON |
| [DISASTER_RECOVERY.md](./infrastructure/DISASTER_RECOVERY.md) | Failover |
| [BACKUP_STRATEGY.md](./infrastructure/BACKUP_STRATEGY.md) | Postgres + MinIO |
| [EMAIL_ARCHITECTURE.md](./infrastructure/EMAIL_ARCHITECTURE.md) | SMTP / Resend |
| [SMS_ARCHITECTURE.md](./infrastructure/SMS_ARCHITECTURE.md) | Eskiz OTP |

### Security (`security/`)

| Document | Description |
|----------|-------------|
| [SECURITY_ARCHITECTURE.md](./security/SECURITY_ARCHITECTURE.md) | Defense in depth |
| [RBAC_POLICIES.md](./security/RBAC_POLICIES.md) | Policy pseudocode |
| [API_SECURITY.md](./security/API_SECURITY.md) | CORS, CSRF, validation |
| [RATE_LIMITING.md](./security/RATE_LIMITING.md) | nginx + Redis |
| [AUDIT_LOG_SYSTEM.md](./security/AUDIT_LOG_SYSTEM.md) | Append-only audit |
| [CSP_CONFIGURATION.md](./security/CSP_CONFIGURATION.md) | Content-Security-Policy |
| [SECURITY_HEADERS.md](./security/SECURITY_HEADERS.md) | HSTS, X-Frame-Options |
| [THREAT_MODEL.md](./security/THREAT_MODEL.md) | STRIDE analysis |

### Cross-cutting (root)

| Document | Description |
|----------|-------------|
| [EVENT_ARCHITECTURE.md](./EVENT_ARCHITECTURE.md) | Domain events, outbox |
| [NOTIFICATION_ARCHITECTURE.md](./NOTIFICATION_ARCHITECTURE.md) | In-app, email, SMS |
| [SCALABILITY_ARCHITECTURE.md](./SCALABILITY_ARCHITECTURE.md) | 100k users target |
| [admin/ADMIN_OS_BACKEND.md](./admin/ADMIN_OS_BACKEND.md) | Admin API module |

### Legacy pointers (superseded by subfolders)

Root copies of `PAYMENT_ARCHITECTURE.md`, `FILE_STORAGE_ARCHITECTURE.md`, `INFRASTRUCTURE_ARCHITECTURE.md`, `DEPLOYMENT_ARCHITECTURE.md`, `SECURITY_ARCHITECTURE.md` remain for backward links — **canonical versions are in subfolders above**.

---

## Technology decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| API | **FastAPI** (Python 3.12) | Async, OpenAPI, Pydantic, team velocity |
| Database | **PostgreSQL 16** on VPS | Relational marketplace, FTS, JSONB |
| ORM | SQLAlchemy 2.0 async + Alembic | Migrations, type safety |
| Cache / queue | **Redis 7** | Sessions cache, Celery broker, rate limits |
| Workers | **Celery** | Email, SMS, notifications, media |
| Storage | **MinIO** (S3-compatible) | Self-hosted on VPS, KYC docs |
| Realtime | FastAPI WebSocket + Redis pub/sub | Chat, notifications, presence |
| Auth | HttpOnly cookie `ishbor_sid` + optional JWT mobile | Replaces localStorage |
| Proxy | **Nginx** | SSL, rate limit, WS upgrade |
| Deploy | **Docker Compose** on VPS | ishbor.uz production |
| SMS | **Eskiz.uz** | Uzbekistan OTP |
| Email | Resend / Postmark | Transactional email |
