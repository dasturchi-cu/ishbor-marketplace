# SERVER_ARCHITECTURE.md

**Target:** Production VPS for ishbor.uz — Uzbekistan market  
**OS:** Ubuntu 22.04 LTS  
**Providers:** Hetzner (EU fallback) / Selectel Tashkent (primary)

---

## 1. VPS sizing

### Production (beta — up to 2000 concurrent users)

| Resource | Specification |
|----------|---------------|
| vCPU | 8 cores |
| RAM | 16 GB |
| Storage | 160 GB NVMe SSD |
| Bandwidth | 20 TB/mo |
| IPv4 | 1 public |
| IPv6 | Optional |

### Staging

| Resource | Specification |
|----------|---------------|
| vCPU | 4 cores |
| RAM | 8 GB |
| Storage | 80 GB SSD |

### Growth phase (split architecture)

| Server | Role | Size |
|--------|------|------|
| app-01 | nginx + frontend + api ×2 | 8 vCPU / 16GB |
| db-01 | PostgreSQL primary | 4 vCPU / 16GB / 500GB |
| worker-01 | Celery + Redis + MinIO | 4 vCPU / 8GB / 500GB |

---

## 2. Operating system setup

```bash
# Base image: Ubuntu 22.04 LTS
sudo apt update && sudo apt upgrade -y
sudo timedatectl set-timezone Asia/Tashkent
sudo locale-gen en_US.UTF-8
```

### Required packages

```bash
sudo apt install -y \
  curl wget git ufw fail2ban \
  apt-transport-https ca-certificates gnupg lsb-release \
  htop iotop ncdu unzip
```

### Docker installation

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy
sudo systemctl enable docker
```

Docker Compose v2 included with Docker CE.

---

## 3. Firewall — UFW

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH — restrict to admin IPs
sudo ufw allow from ADMIN_IP to any port 22 proto tcp

# Public web
sudo ufw allow 80/tcp    # HTTP → certbot redirect
sudo ufw allow 443/tcp   # HTTPS

# Block direct access to services
# postgres 5432 — NOT exposed
# redis 6379 — NOT exposed
# minio 9000 — NOT exposed

sudo ufw enable
sudo ufw status verbose
```

### fail2ban

```ini
# /etc/fail2ban/jail.local
[sshd]
enabled = true
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
```

---

## 4. User and access model

| User | Purpose |
|------|---------|
| `root` | Disabled SSH login |
| `deploy` | Docker compose, deployments |
| `admin` | Manual maintenance (sudo) |

SSH hardening:

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers deploy admin
```

Deploy key: GitHub Actions SSH key for CI/CD — see CI_CD_PIPELINE.md.

---

## 5. Directory layout on VPS

```
/opt/ishbor/
├── compose.yml
├── .env                    # secrets — chmod 600
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       ├── ishbor.uz.conf
│       └── api.ishbor.uz.conf
├── certbot/
│   └── conf/               # Let's Encrypt certs
├── data/
│   ├── postgres/           # PG data volume
│   ├── redis/
│   ├── minio/
│   └── prometheus/
├── backups/
│   ├── postgres/
│   ├── minio/
│   └── redis/
└── logs/
    └── nginx/
```

Owned by `deploy:deploy`. Secrets never in git.

---

## 6. System tuning

### PostgreSQL host settings

```bash
# /etc/sysctl.conf
vm.swappiness = 10
vm.overcommit_memory = 1
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
```

### Docker log rotation

```json
// /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  }
}
```

### Limits

```bash
# /etc/security/limits.conf
deploy soft nofile 65535
deploy hard nofile 65535
```

---

## 7. Provider-specific notes

### Selectel (Tashkent)

- Low latency to UZ mobile networks
- Local payment gateway whitelisting may require UZ IP
- Support ticket in Russian/Uzbek

### Hetzner (Helsinki / Falkenstein)

- Better price/performance for staging
- ~80–100ms latency to Tashkent (acceptable for staging)
- Use for CI runner or offsite backups

---

## 8. Monitoring agents

| Agent | Purpose |
|-------|---------|
| node_exporter | Host CPU, RAM, disk — Prometheus scrape |
| cadvisor | Container metrics |
| postgres_exporter | DB metrics |
| redis_exporter | Redis metrics |

Installed via Docker sidecars or native packages — scraped by Prometheus on same VPS.

---

## 9. SSL certificates

Certbot with nginx plugin — auto-renew via cron:

```bash
0 3 * * * certbot renew --quiet --deploy-hook "docker exec nginx nginx -s reload"
```

Certificates stored in `/opt/ishbor/certbot/conf/`.

---

## 10. Maintenance windows

| Task | Schedule (UZT) | Downtime |
|------|----------------|----------|
| OS security patches | Sunday 04:00 | Rolling restart |
| PostgreSQL minor upgrade | Monthly | ~5 min |
| Docker image updates | Via CI/CD | Zero-downtime api |
| Certificate renewal | Auto | None |

Announce maintenance on status page (P2).

---

## 11. Hardware health checks

Weekly manual checklist:

- [ ] Disk usage <80% (`df -h`)
- [ ] Memory pressure (`free -h`)
- [ ] Docker container health (`docker ps`)
- [ ] Backup verification — restore test to staging
- [ ] UFW rules unchanged
- [ ] fail2ban ban list review

Automated: Prometheus alerts on disk >85%, memory >90%.

---

## 12. Related documents

- [INFRASTRUCTURE_ARCHITECTURE.md](./INFRASTRUCTURE_ARCHITECTURE.md)
- [NGINX_ARCHITECTURE.md](./NGINX_ARCHITECTURE.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)

---

*Ubuntu 22.04 LTS on Selectel Tashkent VPS is the recommended production host for Ishbor's Uzbekistan user base.*
