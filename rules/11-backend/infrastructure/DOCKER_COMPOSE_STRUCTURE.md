# DOCKER_COMPOSE_STRUCTURE.md

**File:** `/opt/ishbor/compose.yml` on production VPS  
**Purpose:** Full service definition with volumes, networks, health checks

---

## 1. Complete compose.yml

```yaml
# /opt/ishbor/compose.yml
name: ishbor

networks:
  ishbor-internal:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  minio_data:
  prometheus_data:
  grafana_data:

services:

  # ─── Reverse proxy ───
  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/snippets:/etc/nginx/snippets:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      frontend:
        condition: service_started
      api:
        condition: service_healthy
    networks:
      - ishbor-internal
    restart: unless-stopped

  # ─── Frontend ───
  frontend:
    image: ghcr.io/ishbor/ishbor-frontend:${IMAGE_TAG:-latest}
    environment:
      NODE_ENV: production
      API_URL: https://api.ishbor.uz
    networks:
      - ishbor-internal
    restart: unless-stopped

  # ─── API (×2 instances) ───
  api:
    image: ghcr.io/ishbor/ishbor-api:${IMAGE_TAG:-latest}
    env_file: .env
    deploy:
      replicas: 2
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health/ready"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s
    networks:
      - ishbor-internal
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # ─── PostgreSQL ───
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ishbor
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ishbor
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups/postgres:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ishbor -d ishbor"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ishbor-internal
    restart: unless-stopped
    # NOT published to host

  # ─── Redis ───
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - ishbor-internal
    restart: unless-stopped

  # ─── MinIO ───
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - ishbor-internal
    restart: unless-stopped

  # ─── Celery worker ───
  celery-worker:
    image: ghcr.io/ishbor/ishbor-api:${IMAGE_TAG:-latest}
    command: celery -A server.workers.celery_app worker -Q default,payments,media -c 4 --loglevel=info
    env_file: .env
    depends_on:
      redis:
        condition: service_healthy
      postgres:
        condition: service_healthy
    networks:
      - ishbor-internal
    restart: unless-stopped
    deploy:
      replicas: 2

  # ─── Celery beat ───
  celery-beat:
    image: ghcr.io/ishbor/ishbor-api:${IMAGE_TAG:-latest}
    command: celery -A server.workers.celery_app beat --loglevel=info
    env_file: .env
    depends_on:
      - redis
    networks:
      - ishbor-internal
    restart: unless-stopped

  # ─── ClamAV virus scanner ───
  clamav:
    image: clamav/clamav:latest
    networks:
      - ishbor-internal
    restart: unless-stopped

  # ─── Prometheus ───
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    networks:
      - ishbor-internal
    restart: unless-stopped

  # ─── Grafana ───
  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards:ro
    networks:
      - ishbor-internal
    restart: unless-stopped
```

---

## 2. Celery beat schedule

```python
# server/workers/celery_app.py
beat_schedule = {
    "subscription-renewal": {
        "task": "payments.subscription_renewal",
        "schedule": crontab(hour=6, minute=0),  # 06:00 UZT
    },
    "gateway-reconciliation": {
        "task": "payments.reconcile_gateways",
        "schedule": crontab(hour=3, minute=0),
    },
    "escrow-balance-check": {
        "task": "payments.escrow_balance_check",
        "schedule": crontab(hour=3, minute=30),
    },
    "postgres-backup": {
        "task": "maintenance.backup_postgres",
        "schedule": crontab(hour=2, minute=0),
    },
    "minio-backup": {
        "task": "maintenance.backup_minio",
        "schedule": crontab(hour=2, minute=30),
    },
    "redis-rdb-backup": {
        "task": "maintenance.backup_redis",
        "schedule": crontab(hour=2, minute=45),
    },
}
```

---

## 3. Local dev override

```yaml
# docker-compose.dev.yml
services:
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    ports:
      - "8001:8000"
    volumes:
      - ./server:/app/server:ro
    command: uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    ports:
      - "5173:3000"

  postgres:
    ports:
      - "5432:5432"

  redis:
    ports:
      - "6379:6379"

  minio:
    ports:
      - "9000:9000"
      - "9001:9001"
```

```bash
docker compose -f compose.yml -f docker-compose.dev.yml up
```

---

## 4. Environment file reference

See [ENVIRONMENT_STRATEGY.md](./ENVIRONMENT_STRATEGY.md) for full variable list.

Minimum `.env`:

```bash
POSTGRES_PASSWORD=
DATABASE_URL=postgresql://ishbor:${POSTGRES_PASSWORD}@postgres:5432/ishbor
REDIS_URL=redis://redis:6379/0
SESSION_SECRET=
MINIO_ROOT_USER=
MINIO_ROOT_PASSWORD=
S3_ENDPOINT=http://minio:9000
S3_BUCKET=ishbor-uploads
S3_ACCESS_KEY=
S3_SECRET_KEY=
IMAGE_TAG=latest
GRAFANA_PASSWORD=
```

---

## 5. Startup order

```
postgres, redis, minio (parallel)
    ↓ healthy
api (×2)
    ↓ healthy
nginx, frontend, celery-worker, celery-beat
```

ClamAV and monitoring start independently.

---

## 6. Operations commands

```bash
# Start all
docker compose up -d

# Rolling api update
docker compose pull api
docker compose up -d --no-deps api

# View logs
docker compose logs -f api celery-worker

# Run migration
docker compose exec api alembic upgrade head

# Postgres shell
docker compose exec postgres psql -U ishbor -d ishbor
```

---

## 7. Volume backup paths

| Volume | Host path | Backup target |
|--------|-----------|---------------|
| postgres_data | Docker volume | `./backups/postgres/` |
| minio_data | Docker volume | `./backups/minio/` |
| redis_data | Docker volume | `./backups/redis/` |

See [BACKUP_STRATEGY.md](./BACKUP_STRATEGY.md).

---

## 8. Related documents

- [DOCKER_ARCHITECTURE.md](./DOCKER_ARCHITECTURE.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [INFRASTRUCTURE_ARCHITECTURE.md](./INFRASTRUCTURE_ARCHITECTURE.md)

---

*compose.yml is the single source of truth for production topology. All services communicate on `ishbor-internal` network.*
