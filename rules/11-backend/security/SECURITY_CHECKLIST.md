# SECURITY_CHECKLIST.md

**Purpose:** Pre-launch security verification for Ishbor marketplace  
**Stack:** Ubuntu 22.04 VPS · Docker Compose · Nginx · FastAPI · PostgreSQL · Redis · MinIO  
**Audience:** Engineering lead, DevOps, security reviewer  
**When to run:** Before staging sign-off, before production launch, after major auth/payment changes

---

## 1. How to use this checklist

1. Complete every section in order — do not skip financial or auth items.
2. Mark each item `[x]` only with evidence (screenshot, curl output, CI log, or audit report link).
3. Store completed checklist in `rules/99-reports/audits/` with date and reviewer name.
4. Any unchecked **BLOCKER** item prevents production launch.
5. Cross-reference: [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md), [THREAT_MODEL.md](./THREAT_MODEL.md), [LAUNCH_CHECKLIST.md](../../06-quality/LAUNCH_CHECKLIST.md).

**Severity legend:**

| Tag | Meaning |
|-----|---------|
| **BLOCKER** | Must pass before launch |
| **HIGH** | Must pass within 7 days of launch |
| **MEDIUM** | Track in backlog; fix before scale phase |

---

## 2. Infrastructure and network (BLOCKER)

### 2.1 VPS hardening

- [ ] **BLOCKER** Ubuntu 22.04 LTS fully patched (`apt update && apt upgrade`)
- [ ] **BLOCKER** Timezone set to `Asia/Tashkent`
- [ ] **BLOCKER** SSH: `PermitRootLogin no`, `PasswordAuthentication no`, key-only auth
- [ ] **BLOCKER** SSH restricted to admin IP(s) via UFW — not open to `0.0.0.0/0`
- [ ] **BLOCKER** `deploy` user in `docker` group; no daily ops as root
- [ ] **HIGH** fail2ban enabled for `sshd` and nginx auth failures
- [ ] **HIGH** Automatic security updates configured (unattended-upgrades)

### 2.2 Firewall and exposure

- [ ] **BLOCKER** UFW default deny incoming; allow only 22 (admin IP), 80, 443
- [ ] **BLOCKER** PostgreSQL (5432), Redis (6379), MinIO (9000) NOT published to host
- [ ] **BLOCKER** Prometheus/Grafana NOT publicly accessible — VPN or SSH tunnel only
- [ ] **BLOCKER** All public traffic enters through Nginx only
- [ ] **HIGH** Webhook routes IP-allowlisted for Payme/Humo provider ranges

### 2.3 Docker security

- [ ] **BLOCKER** Production containers run as non-root user
- [ ] **BLOCKER** `.env` on VPS: `chmod 600`, owned by `deploy`
- [ ] **BLOCKER** No secrets in git — gitleaks CI gate passes
- [ ] **HIGH** Base images digest-pinned in production compose
- [ ] **HIGH** Trivy container scan in CI — no critical CVEs unmitigated
- [ ] **MEDIUM** Docker log rotation configured (`max-size: 50m`, `max-file: 5`)

---

## 3. TLS and transport (BLOCKER)

- [ ] **BLOCKER** Valid Let's Encrypt certificates for `ishbor.uz`, `www.ishbor.uz`, `api.ishbor.uz`, `cdn.ishbor.uz`
- [ ] **BLOCKER** HTTP → HTTPS redirect on all hosts
- [ ] **BLOCKER** TLS 1.2+ only; Mozilla Intermediate cipher suite
- [ ] **BLOCKER** HSTS enabled with `max-age` ≥ 31536000 on production
- [ ] **HIGH** Certbot auto-renewal tested (`certbot renew --dry-run`)
- [ ] **HIGH** Nginx reload hook after certificate renewal

See [../infrastructure/SSL_SETUP.md](../infrastructure/SSL_SETUP.md).

---

## 4. Authentication and sessions (BLOCKER)

- [ ] **BLOCKER** Sessions stored server-side (PostgreSQL `sessions` + Redis cache) — no localStorage session
- [ ] **BLOCKER** Cookie flags: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`
- [ ] **BLOCKER** Session token: 256-bit random, SHA-256 hash stored — raw token never in DB
- [ ] **BLOCKER** Session rotation on login, password change, admin privilege change
- [ ] **BLOCKER** Max 5 concurrent sessions per user enforced server-side
- [ ] **BLOCKER** Password hashing: bcrypt cost factor 12
- [ ] **BLOCKER** `ALLOW_DEMO_AUTH=false` in production `.env`
- [ ] **BLOCKER** Demo OTP (`123456`) rejected when `APP_ENV=production`
- [ ] **HIGH** Google OAuth with CSRF state parameter — no hardcoded demo login
- [ ] **HIGH** Account lockout after repeated failed logins (Redis `lockout:{user_id}`, 15 min TTL)
- [ ] **HIGH** Rate limits on `/v1/auth/*` — nginx 5/min + Redis 5/5min per IP
- [ ] **MEDIUM** 2FA TOTP available for admin accounts (P1 roadmap)

See [ACCOUNT_PROTECTION.md](./ACCOUNT_PROTECTION.md), [../auth/SESSION_MANAGEMENT.md](../auth/SESSION_MANAGEMENT.md).

---

## 5. Authorization and data access (BLOCKER)

- [ ] **BLOCKER** RBAC enforced on every API route — `require_role`, `require_admin`
- [ ] **BLOCKER** Entity ownership guards on orders, escrow, wallet, messages
- [ ] **BLOCKER** PostgreSQL RLS enabled on all user-owned tables
- [ ] **BLOCKER** Admin panel: server-side RBAC on every `/admin/*` route — no client-only gate
- [ ] **BLOCKER** IDOR test suite passes — fake UUID returns 404/403, not other user's data
- [ ] **HIGH** Agency permission checks (`hasAgencyPermission`) on agency CRM routes
- [ ] **HIGH** Freelancer cannot release own escrow milestone — client-only release guard

See [RBAC_POLICIES.md](./RBAC_POLICIES.md).

---

## 6. API security (BLOCKER)

- [ ] **BLOCKER** CORS: production origins only (`ishbor.uz`, `www.ishbor.uz`) — never `*` with credentials
- [ ] **BLOCKER** CSRF token on session-authenticated POST/PUT/PATCH/DELETE
- [ ] **BLOCKER** Pydantic validation on all request bodies — `extra="forbid"`
- [ ] **BLOCKER** SQLAlchemy ORM only — no string-interpolated SQL
- [ ] **BLOCKER** Generic error messages in production — no stack traces to client
- [ ] **BLOCKER** Request body size limit: 1 MB JSON via nginx + FastAPI
- [ ] **HIGH** Pagination max `limit=100`
- [ ] **HIGH** UUID path params — malformed UUID returns 404
- [ ] **HIGH** Security headers via nginx: CSP, X-Frame-Options, X-Content-Type-Options

See [API_SECURITY.md](./API_SECURITY.md), [CSP_CONFIGURATION.md](./CSP_CONFIGURATION.md), [SECURITY_HEADERS.md](./SECURITY_HEADERS.md).

---

## 7. Financial and escrow (BLOCKER)

- [ ] **BLOCKER** Wallet balance authority: server ledger only — DB trigger updates balances
- [ ] **BLOCKER** No client-side PATCH /wallet endpoint
- [ ] **BLOCKER** Idempotency key required on all money POSTs
- [ ] **BLOCKER** Payment webhooks: HMAC signature verification + provider IP allowlist
- [ ] **BLOCKER** Escrow release: client participant OR admin dispute resolution only
- [ ] **BLOCKER** Append-only `wallet_transactions` and `audit_logs` — no DELETE trigger
- [ ] **HIGH** Daily withdrawal cap in `system_config`
- [ ] **HIGH** Rate limits on checkout (5/hour user) and wallet operations
- [ ] **HIGH** Large withdrawal alert (>5000 USD) to finance_admin

---

## 8. File uploads and content (HIGH)

- [ ] **HIGH** Uploads via presigned MinIO URL — not through API body
- [ ] **HIGH** MIME whitelist per upload purpose
- [ ] **HIGH** ClamAV virus scan on uploaded files before serving
- [ ] **HIGH** KYC documents in private MinIO bucket — signed URLs only
- [ ] **MEDIUM** Max file size enforced per purpose (avatar, portfolio, KYC)

---

## 9. Secrets and configuration (BLOCKER)

- [ ] **BLOCKER** No `VITE_*` secrets in frontend bundle — audit build output
- [ ] **BLOCKER** `SESSION_SECRET`, `DATABASE_URL`, payment keys only in VPS `.env`
- [ ] **BLOCKER** `.env` not committed — `.env.example` has placeholders only
- [ ] **HIGH** FastAPI startup validation fails if required env vars missing in production
- [ ] **HIGH** Payment keys rotation schedule documented (quarterly)
- [ ] **MEDIUM** OAuth Apple private key stored securely — multiline PEM in `.env`

See [../infrastructure/ENVIRONMENT_SETUP.md](../infrastructure/ENVIRONMENT_SETUP.md).

---

## 10. Abuse prevention and rate limiting (HIGH)

- [ ] **HIGH** nginx rate limit zones active: general, auth, checkout
- [ ] **HIGH** Redis application rate limits on auth, wallet, checkout, applications
- [ ] **HIGH** Proposal spam limits enforced server-side (subscription plan quotas)
- [ ] **HIGH** Message spam limits per conversation and per user
- [ ] **HIGH** 429 responses include `Retry-After` header and Uzbek message
- [ ] **MEDIUM** Prometheus alert on `rate_limit_exceeded` spike for auth.login

See [ABUSE_PREVENTION.md](./ABUSE_PREVENTION.md), [SPAM_PREVENTION.md](./SPAM_PREVENTION.md), [RATE_LIMITING.md](./RATE_LIMITING.md).

---

## 11. Monitoring and incident readiness (HIGH)

- [ ] **HIGH** Sentry configured for FastAPI + React with PII scrubbing
- [ ] **HIGH** Prometheus scraping `/metrics` (internal only)
- [ ] **HIGH** Grafana dashboards: API golden signals, VPS infrastructure
- [ ] **HIGH** Alert rules: 5xx rate, p95 latency, disk usage
- [ ] **HIGH** Uptime probes: `https://api.ishbor.uz/health/ready`, `https://ishbor.uz`
- [ ] **HIGH** Public status page at `/status` shows degraded state correctly
- [ ] **MEDIUM** Incident response runbook reviewed by on-call engineer
- [ ] **MEDIUM** Post-incident template in `rules/99-reports/incidents/`

See [../../21-observability/](../../21-observability/).

---

## 12. Dependency and supply chain (HIGH)

- [ ] **HIGH** `npm audit` CI gate — no high/critical unmitigated
- [ ] **HIGH** `pip audit` CI gate — no high/critical unmitigated
- [ ] **HIGH** gitleaks secret scan in CI
- [ ] **MEDIUM** OWASP ZAP scan on staging — monthly cadence scheduled
- [ ] **MEDIUM** External penetration test scheduled pre-launch

See [../../06-quality/AUDIT_PLAYBOOK.md](../../06-quality/AUDIT_PLAYBOOK.md).

---

## 13. Backup and disaster recovery (BLOCKER)

- [ ] **BLOCKER** PostgreSQL daily pg_dump to offsite storage
- [ ] **BLOCKER** MinIO daily mirror to offsite bucket
- [ ] **BLOCKER** Backup restore tested to staging within last 30 days
- [ ] **HIGH** Redis RDB snapshot hourly
- [ ] **HIGH** RTO/RPO documented in disaster recovery plan
- [ ] **MEDIUM** Runbook for payment webhook replay after outage

See [../infrastructure/BACKUP_STRATEGY.md](../infrastructure/BACKUP_STRATEGY.md), [../infrastructure/DISASTER_RECOVERY.md](../infrastructure/DISASTER_RECOVERY.md).

---

## 14. Compliance and privacy (HIGH)

- [ ] **HIGH** Privacy policy reflects UZ VPS data residency (PostgreSQL + MinIO on UZ host)
- [ ] **HIGH** PII not logged — passwords, tokens, OTP, full card numbers redacted
- [ ] **HIGH** KYC access limited to owner + admin verifications role
- [ ] **HIGH** Audit log retention ≥ 7 years for financial actions
- [ ] **MEDIUM** User data export and deletion flows documented

See [AUDIT_LOG_SYSTEM.md](./AUDIT_LOG_SYSTEM.md).

---

## 15. Pre-launch sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering lead | | | |
| DevOps | | | |
| Product / Founder | | | |

**Launch decision:**

- [ ] All BLOCKER items passed
- [ ] HIGH items passed or accepted risk documented with mitigation date
- [ ] Staging smoke test completed (auth, checkout, escrow, admin)
- [ ] Rollback procedure tested (previous Docker image tag)

---

## 16. Related documents

- [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md)
- [THREAT_MODEL.md](./THREAT_MODEL.md)
- [ACCOUNT_PROTECTION.md](./ACCOUNT_PROTECTION.md)
- [ABUSE_PREVENTION.md](./ABUSE_PREVENTION.md)
- [SPAM_PREVENTION.md](./SPAM_PREVENTION.md)
- [../infrastructure/VPS_SETUP.md](../infrastructure/VPS_SETUP.md)
- [../../06-quality/LAUNCH_CHECKLIST.md](../../06-quality/LAUNCH_CHECKLIST.md)
- [../../06-quality/QA_CHECKLIST.md](../../06-quality/QA_CHECKLIST.md)

---

*Security is layered — no reliance on client-side guards. Server is sole authority for auth, wallet, and rate limits.*
