# VPS_SETUP.md

**Purpose:** Initial Ubuntu 22.04 VPS setup for Ishbor production and staging  
**Stack:** Docker Compose · Nginx · FastAPI · PostgreSQL · Redis · MinIO  
**Providers:** Selectel Tashkent (primary) · Hetzner (staging/backups)

---

## 1. VPS sizing

### Production (beta — up to 2,000 concurrent users)

| Resource | Specification |
|----------|---------------|
| vCPU | 8 cores |
| RAM | 16 GB |
| Storage | 160 GB NVMe SSD |
| Bandwidth | 20 TB/month |
| IPv4 | 1 public address |
| OS | Ubuntu 22.04 LTS |

### Staging

| Resource | Specification |
|----------|---------------|
| vCPU | 4 cores |
| RAM | 8 GB |
| Storage | 80 GB SSD |

Separate VPS per environment — no shared PostgreSQL, Redis, or MinIO between staging and production.

---

## 2. First boot — base system

SSH in as root (provider console or initial password), then:

```bash
apt update && apt upgrade -y
timedatectl set-timezone Asia/Tashkent
locale-gen en_US.UTF-8
update-locale LANG=en_US.UTF-8
hostnamectl set-hostname ishbor-prod-01
```

Install essential packages:

```bash
apt install -y \
  curl wget git ufw fail2ban \
  apt-transport-https ca-certificates gnupg lsb-release \
  htop iotop ncdu unzip jq \
  unattended-upgrades
```

Enable automatic security updates:

```bash
dpkg-reconfigure -plow unattended-upgrades
```

---

## 3. User accounts

Create operational users — never deploy daily as root.

```bash
# Deploy user — runs Docker Compose
adduser deploy
usermod -aG sudo deploy

# Admin user — manual maintenance
adduser admin
usermod -aG sudo admin
```

Copy SSH public keys for both users:

```bash
mkdir -p /home/deploy/.ssh /home/admin/.ssh
chmod 700 /home/deploy/.ssh /home/admin/.ssh

# Paste your public key:
echo "ssh-ed25519 AAAA... your-key" >> /home/deploy/.ssh/authorized_keys
echo "ssh-ed25519 AAAA... admin-key" >> /home/admin/.ssh/authorized_keys

chmod 600 /home/deploy/.ssh/authorized_keys
chmod 600 /home/admin/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chown -R admin:admin /home/admin/.ssh
```

GitHub Actions deploy key: add separate `deploy` key with read-only repo access — see CI_CD_PIPELINE.md.

---

## 4. SSH hardening

Edit `/etc/ssh/sshd_config`:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers deploy admin
ClientAliveInterval 300
ClientAliveCountMax 2
```

Restart SSH:

```bash
systemctl restart sshd
```

**Before closing root session:** verify `deploy` can SSH in from your machine.

---

## 5. UFW firewall

Replace `ADMIN_IP` with your office/home static IP or VPN egress:

```bash
ufw default deny incoming
ufw default allow outgoing

# SSH — admin IP only
ufw allow from ADMIN_IP to any port 22 proto tcp

# Public web
ufw allow 80/tcp
ufw allow 443/tcp

# DO NOT open:
# 5432  — PostgreSQL
# 6379  — Redis
# 9000  — MinIO
# 9090  — Prometheus
# 3000  — Grafana

ufw enable
ufw status verbose
```

For multiple admin IPs, repeat the `ufw allow from` rule for each.

Grafana/Prometheus access: SSH tunnel only — `ssh -L 3000:localhost:3000 deploy@VPS_IP`.

---

## 6. fail2ban

Create `/etc/fail2ban/jail.local`:

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
```

```bash
systemctl enable fail2ban
systemctl restart fail2ban
fail2ban-client status sshd
```

---

## 7. Docker installation

```bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy
systemctl enable docker
```

Docker Compose v2 is included with Docker CE. Verify:

```bash
docker --version
docker compose version
```

### Docker daemon tuning

Create `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  },
  "live-restore": true
}
```

```bash
systemctl restart docker
```

---

## 8. Directory layout

Create Ishbor deployment root:

```bash
mkdir -p /opt/ishbor/{nginx/conf.d,certbot/conf,data/{postgres,redis,minio,prometheus},backups/{postgres,minio,redis},logs/nginx,monitoring}
chown -R deploy:deploy /opt/ishbor
chmod 700 /opt/ishbor
```

Expected structure:

```
/opt/ishbor/
├── compose.yml              # Docker Compose production stack
├── .env                     # Secrets — chmod 600
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       ├── ishbor.uz.conf
│       └── api.ishbor.uz.conf
├── certbot/conf/            # Let's Encrypt certificates
├── data/                    # Persistent volumes
├── backups/                 # Local backup staging
├── logs/nginx/
└── monitoring/              # Prometheus, Grafana configs
```

Clone deployment repo (or CI deploys artifacts):

```bash
su - deploy
cd /opt/ishbor
git clone git@github.com:ishbor/ishbor-marketplace.git .
# Or: CI rsync/scp on deploy
```

Protect secrets:

```bash
chmod 600 /opt/ishbor/.env
```

---

## 9. System tuning

### Kernel parameters

Add to `/etc/sysctl.conf`:

```
vm.swappiness = 10
vm.overcommit_memory = 1
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
```

Apply:

```bash
sysctl -p
```

### File descriptor limits

Add to `/etc/security/limits.conf`:

```
deploy soft nofile 65535
deploy hard nofile 65535
```

---

## 10. Monitoring agents (optional at setup)

Install via Docker sidecars in compose.yml:

| Exporter | Port | Metrics |
|----------|------|---------|
| node_exporter | 9100 | CPU, RAM, disk, network |
| cadvisor | 8080 | Container stats |
| postgres_exporter | 9187 | DB connections, queries |
| redis_exporter | 9121 | Memory, commands |

Not published to public internet — Prometheus scrapes on Docker internal network.

---

## 11. Initial deploy smoke test

After compose up:

```bash
cd /opt/ishbor
docker compose pull
docker compose up -d
docker compose ps
curl -s http://localhost/health
curl -s http://localhost/health/ready
```

From external machine (after DNS + SSL):

```bash
curl -s https://api.ishbor.uz/health/ready
curl -sI https://ishbor.uz
```

---

## 12. Weekly maintenance checklist

- [ ] Disk usage <80% (`df -h`)
- [ ] Memory pressure acceptable (`free -h`)
- [ ] All containers healthy (`docker compose ps`)
- [ ] UFW rules unchanged (`ufw status`)
- [ ] fail2ban ban list reviewed
- [ ] Backup restore tested to staging (monthly)
- [ ] Security patches applied

Automated: Prometheus alerts on disk >85%, memory >90%.

---

## 13. Provider notes

### Selectel Tashkent

- Low latency to UZ mobile networks (<50ms API TTFB target)
- Local payment gateway whitelisting may require UZ IP
- Support in Russian/Uzbek

### Hetzner (Helsinki / Falkenstein)

- Cost-effective for staging and offsite backups
- ~80–100ms latency to Tashkent — acceptable for staging only
- Use for CI runner or backup storage

---

## 14. Related documents

- [SSL_SETUP.md](./SSL_SETUP.md)
- [DOMAIN_SETUP.md](./DOMAIN_SETUP.md)
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- [DOCKER_COMPOSE_STRUCTURE.md](./DOCKER_COMPOSE_STRUCTURE.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [SERVER_ARCHITECTURE.md](./SERVER_ARCHITECTURE.md)
- [../security/SECURITY_CHECKLIST.md](../security/SECURITY_CHECKLIST.md)

---

*Ubuntu 22.04 LTS on Selectel Tashkent VPS. UFW allows 22 (admin IP), 80, 443 only. Deploy user runs Docker Compose — data services never exposed to internet.*
