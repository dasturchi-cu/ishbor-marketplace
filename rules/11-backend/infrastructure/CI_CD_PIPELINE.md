# CI_CD_PIPELINE.md

**Platform:** GitHub Actions  
**Flow:** lint → test → build image → deploy via SSH to VPS  
**Registry:** GitHub Container Registry (ghcr.io)

---

## 1. Pipeline overview

```
PR / push to main
    │
    ├── job: lint (eslint, ruff)
    ├── job: typecheck (tsc, mypy)
    ├── job: test (pytest, vitest)
    ├── job: security (npm audit, trivy)
    │
    └── on main only:
        ├── job: build-push (Docker images → ghcr.io)
        ├── job: deploy-staging (SSH → staging VPS)
        └── on tag v* or manual:
            └── job: deploy-production (SSH → prod VPS)
```

---

## 2. ci.yml

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: npm }
      - run: npm ci
      - run: npm run lint
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install ruff && ruff check server/

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: npm }
      - run: npm ci && npx tsc --noEmit
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r server/requirements.txt && mypy server/

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: ishbor_test
        ports: ["5432:5432"]
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: npm }
      - run: npm ci && npm run test
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: |
          pip install -r server/requirements.txt
          pytest server/tests/ -v
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/ishbor_test
          REDIS_URL: redis://localhost:6379/0

  migrate-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          pip install alembic psycopg2-binary
          alembic check

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          severity: CRITICAL,HIGH
```

**Gate:** All jobs pass before merge to main.

---

## 3. build-push.yml

```yaml
# .github/workflows/build-push.yml
name: Build and Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile.api
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/ishbor-api:${{ github.sha }}
            ghcr.io/${{ github.repository }}/ishbor-api:latest

      - uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile.frontend
          push: true
          build-args: |
            VITE_API_URL=https://api.ishbor.uz
          tags: |
            ghcr.io/${{ github.repository }}/ishbor-frontend:${{ github.sha }}
            ghcr.io/${{ github.repository }}/ishbor-frontend:latest
```

---

## 4. deploy-staging.yml

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging

on:
  workflow_run:
    workflows: [Build and Push]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: deploy
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/ishbor
            export IMAGE_TAG=${{ github.sha }}
            docker compose pull api frontend
            docker compose run --rm api alembic upgrade head
            docker compose up -d --no-deps api frontend celery-worker
            sleep 10
            curl -f https://staging-api.ishbor.uz/health/ready

      - name: Smoke test
        run: |
          curl -f https://staging-api.ishbor.uz/health/ready
          curl -f -o /dev/null -w "%{http_code}" https://staging.ishbor.uz
```

---

## 5. deploy-production.yml

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production

on:
  push:
    tags: ["v*"]
  workflow_dispatch:
    inputs:
      confirm:
        description: "Type 'deploy' to confirm"
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # requires manual approval
    steps:
      - name: Verify confirmation
        if: github.event_name == 'workflow_dispatch'
        run: |
          [ "${{ github.event.inputs.confirm }}" = "deploy" ] || exit 1

      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROD_HOST }}
          username: deploy
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/ishbor
            export IMAGE_TAG=${{ github.sha }}
            docker compose pull api frontend
            docker compose run --rm api alembic upgrade head
            docker compose up -d --no-deps api frontend celery-worker
            sleep 15
            curl -f https://api.ishbor.uz/health/ready

      - name: Monitor error rate
        run: sleep 900  # 15 min soak — manual rollback if alerts fire
```

---

## 6. GitHub secrets

| Secret | Purpose |
|--------|---------|
| `STAGING_HOST` | Staging VPS IP |
| `STAGING_SSH_KEY` | Deploy private key |
| `PROD_HOST` | Production VPS IP |
| `PROD_SSH_KEY` | Deploy private key |

Application secrets live on VPS `.env` — NOT in GitHub (except CI test DB).

---

## 7. Branch protection

| Rule | Setting |
|------|---------|
| main | Require PR, 1 approval |
| Required checks | lint, typecheck, test, migrate-check, security |
| Force push | Disabled |
| Tag protection | `v*` — maintainers only |

---

## 8. Migration strategy in CI/CD

| Rule | Detail |
|------|--------|
| Expand-contract | Add nullable columns first |
| Deploy order | migrate → deploy api → deploy workers |
| Rollback | Forward-only — compensating migration |
| Drift check | `alembic check` in CI |

Never run destructive migrations without backup — see BACKUP_STRATEGY.md.

---

## 9. Notifications

Post-deploy Slack/Telegram webhook (optional):

```yaml
- name: Notify
  if: success()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
      -d '{"text":"Deployed ${{ github.sha }} to staging"}'
```

---

## 10. Related documents

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [ENVIRONMENT_STRATEGY.md](./ENVIRONMENT_STRATEGY.md)
- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)

---

*CI gates every merge. Staging auto-deploys on main. Production requires tag or manual approval with 15-minute soak period.*
