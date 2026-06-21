# DEPLOYMENT_GUIDE.md

**Target:** Production deployment of ishbor.uz on Ubuntu 22.04 VPS  
**Method:** Docker Compose + GitHub Actions CI/CD  
**Prerequisites:** Domain DNS pointed to VPS, SSH key access

---

## 1. Pre-deployment checklist

- [ ] VPS provisioned (8 vCPU / 16GB — see SERVER_ARCHITECTURE.md)
- [ ] DNS A records: ishbor.uz, api.ishbor.uz, cdn.ishbor.uz → VPS IP
- [ ] SSH key added for `deploy` user
- [ ] UFW configured (ports 22, 80, 443)
- [ ] GitHub repository secrets configured
- [ ] Payme/Humo sandbox credentials ready (staging)
- [ ] `.env.production` prepared locally (never commit)

---

## 2. Initial server setup

```bash
# SSH as admin
ssh admin@VPS_IP

# Create deploy user
sudo adduser deploy
sudo usermod -aG docker deploy
sudo mkdir -p /opt/ishbor
sudo chown deploy:deploy /opt/ishbor
```

Copy deploy SSH public key to `/home/deploy/.ssh/authorized_keys`.

Install Docker — see SERVER_ARCHITECTURE.md §2.

---

## 3. Clone and configure

```bash
su - deploy
cd /opt/ishbor

# Initial structure (CI will rsync compose files)
git clone git@github.com:ishbor/ishbor-marketplace.git repo
cp repo/docker/compose.yml .
cp -r repo/docker/nginx ./nginx
cp repo/.env.example .env

# Edit secrets
chmod 600 .env
nano .env
```

Required `.env` values — see ENVIRONMENT_STRATEGY.md.

Generate secrets:

```bash
openssl rand -hex 32  # SESSION_SECRET
openssl rand -hex 16  # POSTGRES_PASSWORD
```

---

## 4. SSL certificates

```bash
# Temporary nginx for certbot standalone
sudo apt install certbot

certbot certonly --standalone \
  -d ishbor.uz -d www.ishbor.uz \
  -d api.ishbor.uz \
  -d cdn.ishbor.uz \
  --email admin@ishbor.uz --agree-tos

# Copy certs to compose mount path
sudo cp -rL /etc/letsencrypt /opt/ishbor/certbot/conf
sudo chown -R deploy:deploy /opt/ishbor/certbot
```

---

## 5. First deploy

```bash
cd /opt/ishbor

# Pull images (after first CI build)
export IMAGE_TAG=latest
docker compose pull

# Start infrastructure first
docker compose up -d postgres redis minio
sleep 10

# Run migrations
docker compose run --rm api alembic upgrade head

# Seed staging data (staging only)
# docker compose run --rm api python -m server.scripts.seed

# Start all services
docker compose up -d

# Verify
docker compose ps
curl -s https://api.ishbor.uz/health/ready | jq .
curl -s -o /dev/null -w "%{http_code}" https://ishbor.uz
```

Expected: `/health/ready` returns `{"status":"ok","db":"ok","redis":"ok"}`.

---

## 6. MinIO bucket initialization

```bash
docker compose exec minio mc alias set local http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD
docker compose exec minio mc mb local/ishbor-uploads --ignore-existing
docker compose exec minio mc mb local/ishbor-public --ignore-existing
docker compose exec minio mc mb local/ishbor-private --ignore-existing
docker compose exec minio mc anonymous set download local/ishbor-public
```

See [../minio/MINIO_ARCHITECTURE.md](../minio/MINIO_ARCHITECTURE.md).

---

## 7. Post-deploy verification

| Check | Command | Expected |
|-------|---------|----------|
| API health | `curl api.ishbor.uz/health` | 200 |
| API ready | `curl api.ishbor.uz/health/ready` | 200 + db ok |
| Frontend | Browser → ishbor.uz | Landing loads |
| WebSocket | Browser devtools → WS connect | Connected |
| Postgres | `docker compose exec postgres pg_isready` | accepting |
| Redis | `docker compose exec redis redis-cli ping` | PONG |
| MinIO | `mc ls local/ishbor-uploads` | empty bucket |
| Celery | `docker compose logs celery-worker` | ready |
| SSL | ssllabs.com scan | A rating |

Run synthetic checkout on staging before production traffic.

---

## 8. Subsequent deploys

Automated via GitHub Actions — see CI_CD_PIPELINE.md.

Manual deploy:

```bash
cd /opt/ishbor
export IMAGE_TAG=$(git -C repo rev-parse --short HEAD)
docker compose pull api frontend
docker compose run --rm api alembic upgrade head
docker compose up -d --no-deps api frontend celery-worker
docker compose ps
```

Zero-downtime: nginx keeps serving while api containers restart sequentially.

---

## 9. Rollback

```bash
export IMAGE_TAG=previous-sha
docker compose pull api frontend
docker compose up -d --no-deps api frontend

# Migrations are forward-only — write compensating migration if needed
```

Feature flag emergency: set `API_MODE=local` in frontend env (last resort only).

---

## 10. Staging deploy

Same steps on staging VPS with:

- `staging.ishbor.uz` / `staging-api.ishbor.uz`
- Payme test credentials
- `ALLOW_DEMO_AUTH=true`
- Seed demo data enabled

Auto-deploy on push to `main` via CI.

---

## 11. Monitoring setup

```bash
# Access Grafana (via SSH tunnel initially)
ssh -L 3001:localhost:3000 deploy@VPS_IP
# Browser: localhost:3001

# Import dashboards from repo/monitoring/dashboards/
```

Configure Telegram/Slack alert webhook in Grafana.

---

## 12. Troubleshooting

| Symptom | Fix |
|---------|-----|
| 502 Bad Gateway | `docker compose logs api` — check startup errors |
| DB connection refused | Verify postgres healthy, DATABASE_URL host=`postgres` |
| Cert expired | `certbot renew && docker exec nginx nginx -s reload` |
| Out of disk | Clean Docker: `docker system prune -a` |
| Migration failed | Check alembic logs, restore from backup if needed |

---

## 13. Related documents

- [CI_CD_PIPELINE.md](./CI_CD_PIPELINE.md)
- [ENVIRONMENT_STRATEGY.md](./ENVIRONMENT_STRATEGY.md)
- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)
- [SERVER_ARCHITECTURE.md](./SERVER_ARCHITECTURE.md)

---

*Follow this guide sequentially for first production deploy. Subsequent deploys are automated via GitHub Actions SSH deploy.*
