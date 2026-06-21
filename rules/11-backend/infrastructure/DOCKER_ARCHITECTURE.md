# DOCKER_ARCHITECTURE.md

**Images:** Multi-stage builds for FastAPI API and Nitro frontend  
**Security:** Non-root user, minimal base images, no secrets in layers

---

## 1. Image inventory

| Image | Dockerfile | Base | User |
|-------|------------|------|------|
| `ishbor-api` | `docker/Dockerfile.api` | python:3.12-slim | `ishbor:1000` |
| `ishbor-frontend` | `docker/Dockerfile.frontend` | node:20-alpine | `ishbor:1000` |
| `ishbor-worker` | Same as API, different CMD | python:3.12-slim | `ishbor:1000` |

Infrastructure images use upstream directly: postgres, redis, minio, nginx, clamav.

---

## 2. FastAPI multi-stage Dockerfile

```dockerfile
# docker/Dockerfile.api

# --- Stage 1: builder ---
FROM python:3.12-slim AS builder
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && rm -rf /var/lib/apt/lists/*
COPY server/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# --- Stage 2: runtime ---
FROM python:3.12-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 curl && rm -rf /var/lib/apt/lists/*

RUN groupadd -r ishbor -g 1000 && useradd -r -g ishbor -u 1000 ishbor
WORKDIR /app

COPY --from=builder /install /usr/local
COPY server/ ./server/
COPY packages/db/ ./packages/db/

RUN chown -R ishbor:ishbor /app
USER ishbor

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### Worker variant

```dockerfile
# Same image, different command in compose
CMD ["celery", "-A", "server.workers.celery_app", "worker", "-Q", "default,payments,media", "-c", "4"]
```

---

## 3. Frontend multi-stage Dockerfile

```dockerfile
# docker/Dockerfile.frontend

FROM node:20-alpine AS builder
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS runtime
RUN addgroup -g 1000 ishbor && adduser -u 1000 -G ishbor -D ishbor
WORKDIR /app
COPY --from=builder --chown=ishbor:ishbor /build/.output ./.output
USER ishbor
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

Build args for public env only:

```dockerfile
ARG VITE_API_URL=https://api.ishbor.uz
ENV VITE_API_URL=$VITE_API_URL
```

Never pass secrets as build args.

---

## 4. Security practices

| Practice | Implementation |
|----------|----------------|
| Non-root user | `USER ishbor` in all app images |
| Minimal base | slim/alpine variants |
| No secrets in image | Runtime env from `.env` / Docker secrets |
| .dockerignore | Exclude `.git`, `node_modules`, `.env`, tests |
| Pin versions | `python:3.12-slim`, `postgres:16-alpine` |
| Scan in CI | `trivy image ishbor-api:latest` |
| Read-only root | P2 — tmpfs for /tmp |

### .dockerignore

```
.git
.env
.env.*
node_modules
.output
__pycache__
*.pyc
.pytest_cache
tests/
docs/
rules/
```

---

## 5. Build commands

```bash
# API
docker build -f docker/Dockerfile.api -t ishbor-api:latest .

# Frontend
docker build -f docker/Dockerfile.frontend \
  --build-arg VITE_API_URL=https://api.ishbor.uz \
  -t ishbor-frontend:latest .

# Worker (same tag as API)
docker tag ishbor-api:latest ishbor-worker:latest
```

CI builds and pushes to GitHub Container Registry (`ghcr.io/org/ishbor-api`).

---

## 6. Runtime configuration

Environment injected at container start — not baked into image:

```yaml
api:
  image: ishbor-api:latest
  env_file: .env
  environment:
    - DATABASE_URL=postgresql://...
    - REDIS_URL=redis://redis:6379/0
```

Secrets rotation: update `.env`, `docker compose up -d api` — no rebuild needed.

---

## 7. Health checks

| Container | Check |
|-----------|-------|
| api | `GET /health` — process alive |
| api ready | `GET /health/ready` — DB + Redis |
| postgres | `pg_isready -U ishbor` |
| redis | `redis-cli ping` |
| minio | `curl /minio/health/live` |

Compose `depends_on` with `condition: service_healthy` for startup order.

---

## 8. Resource limits

```yaml
api:
  deploy:
    resources:
      limits:
        cpus: "2"
        memory: 2G
      reservations:
        cpus: "0.5"
        memory: 512M
```

Prevent runaway worker from OOM-killing postgres on shared VPS.

---

## 9. Volume mounts

| Service | Volume | Purpose |
|---------|--------|---------|
| postgres | `./data/postgres:/var/lib/postgresql/data` | Database persistence |
| redis | `./data/redis:/data` | RDB persistence |
| minio | `./data/minio:/data` | Object storage |
| nginx | `./nginx:/etc/nginx/conf.d:ro` | Config hot reload |
| certbot | `./certbot/conf:/etc/letsencrypt` | TLS certs |

Application containers are stateless — no app data volumes.

---

## 10. Local development

```bash
# Build and run full stack
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# API only with hot reload
docker compose up postgres redis -d
cd server && uvicorn server.main:app --reload --port 8001
```

Dev override mounts source code for live reload without rebuild.

---

## 11. Related documents

- [DOCKER_COMPOSE_STRUCTURE.md](./DOCKER_COMPOSE_STRUCTURE.md)
- [CI_CD_PIPELINE.md](./CI_CD_PIPELINE.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

*Multi-stage builds minimize image size and attack surface. All application containers run as non-root user `ishbor`.*
