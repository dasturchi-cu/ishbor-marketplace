# SECURITY_ARCHITECTURE.md

**Model:** Defense in depth — no single control is sufficient  
**Stack:** FastAPI + PostgreSQL RLS + Nginx + Redis on self-hosted VPS  
**Sources:** PROJECT_BIBLE §13, AUTH_ARCHITECTURE.md, payment/wallet flows

---

## 1. Defense in depth layers

```
Layer 7: Application logic     — entity ownership, business rules
Layer 6: API middleware        — RBAC, rate limits, input validation
Layer 5: Service layer         — authorization guards per operation
Layer 4: PostgreSQL RLS        — row-level policies on user data
Layer 3: Network               — UFW, Docker internal network, nginx
Layer 2: Transport             — TLS 1.2+, HSTS, secure cookies
Layer 1: Infrastructure        — VPS hardening, fail2ban, non-root containers
```

Every request passes Layers 1–6 before reaching Layer 7. Failure at any layer → deny (fail-closed).

---

## 2. Threat summary

| Threat | Layer(s) | Primary mitigation |
|--------|----------|-------------------|
| Session hijack | 2, 6 | HttpOnly Secure cookies, rotation |
| XSS → wallet theft | 6, 7 | Server-authoritative ledger, CSP |
| IDOR on orders/escrow | 5, 6, 7 | Participant guards + RLS |
| Admin panel bypass | 6, 7 | Server RBAC every admin route |
| Payment webhook forgery | 6, 7 | HMAC verification, IP allowlist |
| Brute force auth | 3, 6 | nginx + Redis rate limits, lockout |
| File upload malware | 7 | ClamAV, MIME validation |
| SQL injection | 5 | Parameterized queries / SQLAlchemy |
| CSRF | 2, 6 | SameSite=Lax + CSRF token on mutations |
| Secrets in client bundle | 7 | No VITE_* secrets |
| DDoS | 3 | nginx rate limits, UFW |

Full STRIDE analysis: [THREAT_MODEL.md](./THREAT_MODEL.md).

---

## 3. Authentication security

| Control | Implementation |
|---------|----------------|
| Password storage | bcrypt cost factor 12 |
| Session token | 256-bit random, SHA-256 hash stored |
| Cookie flags | HttpOnly, Secure, SameSite=Lax, Path=/ |
| Session TTL | 7 days default, 30 days with remember |
| OAuth | Google/Apple with CSRF state parameter |
| OTP | 6 digits, SHA-256 hashed, 5 attempts, 10 min TTL |
| Phone OTP | Eskiz SMS — see SMS_ARCHITECTURE.md |
| 2FA TOTP | P1 roadmap |
| Demo accounts | `ALLOW_DEMO_AUTH=false` in production |

See [../AUTH_ARCHITECTURE.md](../AUTH_ARCHITECTURE.md).

---

## 4. Authorization

Four enforcement points — all must pass:

1. **API middleware:** Route-level RBAC (`require_role`, `require_admin`)
2. **Service layer:** Entity participant check (`order.client_user_id == current_user.id`)
3. **PostgreSQL RLS:** Row policies on user-owned tables
4. **Audit:** Admin mutations logged immutably

See [RBAC_POLICIES.md](./RBAC_POLICIES.md), [../RBAC_SPECIFICATION.md](../RBAC_SPECIFICATION.md).

---

## 5. Wallet and escrow security

| Rule | Enforcement |
|------|-------------|
| Balance authority | Server ledger only — DB trigger updates wallets |
| No client balance API | No PATCH /wallet endpoint |
| Escrow release | Client participant OR admin dispute resolution |
| Idempotency | Required on all money POSTs |
| Audit trail | Append-only wallet_transactions + ledger_entries |
| Admin override | audit_logs with actor + reason |
| Withdrawal limits | Daily cap in system_config |

Maps PAYMENT_ARCHITECTURE.md security requirements.

---

## 6. Secrets management

| Secret | Storage | Never in |
|--------|---------|----------|
| DATABASE_URL | VPS .env | git, client |
| SESSION_SECRET | VPS .env | git, client |
| Payment keys (Payme/Humo) | VPS .env | git, client |
| S3/MinIO keys | VPS .env | git, client |
| OAuth secrets | VPS .env | git, client |
| OPENAI_API_KEY | VPS .env | git, client |
| ESKIZ_PASSWORD | VPS .env | git, client |

Rotation schedule: payment keys quarterly; SESSION_SECRET on suspected breach.

---

## 7. Data protection

| Data class | At rest | In transit | Access |
|------------|---------|------------|--------|
| Passwords | bcrypt hash | TLS | Never returned |
| PII (email, phone) | PostgreSQL on VPS | TLS | Owner + admin RBAC |
| KYC documents | MinIO private bucket | TLS + signed URL | Owner + admin verifications |
| Payment tokens | token_ref in DB | TLS | Owner only |
| Session tokens | SHA-256 hash | HttpOnly cookie | Server only |
| OAuth tokens | AES-256 encrypted column | TLS | Server only |

Data residency: PostgreSQL + MinIO on UZ VPS — document in privacy policy.

---

## 8. Network security

| Control | Detail |
|---------|--------|
| UFW | Allow 22 (admin IP), 80, 443 only |
| Docker network | Data services not published to host |
| nginx | Single public entry point |
| Webhook IP allowlist | Payme/Humo provider IPs |
| fail2ban | SSH + nginx auth failures |
| Admin Grafana | SSH tunnel or VPN only |

---

## 9. Dependency and supply chain

| Practice | Tool |
|----------|------|
| npm audit | CI gate — no high/critical |
| pip audit | CI gate |
| Container scan | Trivy in CI |
| Secret scan | gitleaks in CI |
| Pin base images | Digest-pinned in production compose |

---

## 10. Incident response severity

| Severity | Example | Response time | Actions |
|----------|---------|---------------|---------|
| P0 | Payment breach, auth bypass | Immediate | Freeze withdrawals, rotate keys, notify |
| P1 | Elevated 5xx, webhook failures | <30 min | Investigate, patch, deploy |
| P2 | Performance degradation | <4 hr | Scale, optimize |
| P3 | Non-critical bug | Next sprint | Track in backlog |

Runbooks: `rules/11-backend/runbooks/` (create during implementation).

---

## 11. Production security checklist

- [ ] HttpOnly cookie sessions
- [ ] Real OAuth (Google/Apple)
- [ ] Real password reset email (Resend)
- [ ] Payment gateway server-side only
- [ ] Rate limiting on auth + checkout (nginx + Redis)
- [ ] Secrets out of client bundle
- [ ] Server-authoritative wallet
- [ ] Immutable audit log
- [ ] RLS enabled on all user tables
- [ ] CSP headers configured (nginx)
- [ ] HSTS enabled
- [ ] ClamAV virus scanning on uploads
- [ ] Non-root Docker containers
- [ ] UFW + fail2ban active
- [ ] Backups tested monthly

---

## 12. Related documents

- [RBAC_POLICIES.md](./RBAC_POLICIES.md)
- [API_SECURITY.md](./API_SECURITY.md)
- [RATE_LIMITING.md](./RATE_LIMITING.md)
- [AUDIT_LOG_SYSTEM.md](./AUDIT_LOG_SYSTEM.md)
- [CSP_CONFIGURATION.md](./CSP_CONFIGURATION.md)
- [SECURITY_HEADERS.md](./SECURITY_HEADERS.md)
- [THREAT_MODEL.md](./THREAT_MODEL.md)

---

*Security is layered — no reliance on client-side guards. Server becomes sole authority replacing localStorage persistence.*
