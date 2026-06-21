# SECURITY_ARCHITECTURE.md

**Sources:** `SECURITY_GUIDELINES.md`, `SECURITY_ARCHITECTURE` requirements, auth/wallet/escrow flows

---

## 1. Threat model

| Threat | Impact | Mitigation |
|--------|--------|------------|
| Session hijack | Account takeover | HttpOnly cookies, Secure, rotation |
| XSS stealing wallet | Financial loss | No client balance authority, CSP |
| IDOR on orders/escrow | Data leak | Entity participant guards + RLS |
| Admin panel bypass | Platform compromise | Server RBAC every request |
| Payment webhook forgery | Free credits | HMAC verification, idempotency |
| Brute force login | Account takeover | Rate limit, lockout |
| File upload malware | System compromise | Virus scan, MIME validation |
| SSR data leak | PII exposure | No sensitive data in SSR for guests |
| localStorage tampering | Fake state | Remove client persistence (migration) |
| CSRF | Unauthorized actions | SameSite + token on mutations |

---

## 2. Authentication security

| Control | Implementation |
|---------|----------------|
| Password storage | bcrypt cost 12 |
| Session token | 256-bit random, SHA-256 stored |
| Cookie flags | HttpOnly, Secure, SameSite=Lax |
| OAuth state | CSRF state parameter |
| OTP | 6 digits, 5 attempts, 10 min expiry, hashed |
| 2FA | TOTP (P1) |
| Demo accounts | Disabled in production |

See [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md).

---

## 3. Authorization

Defense in depth (PROJECT_BIBLE §13):
1. API middleware RBAC
2. Service-layer entity checks
3. PostgreSQL RLS
4. Admin audit on all mutations

See [RBAC_SPECIFICATION.md](./RBAC_SPECIFICATION.md).

---

## 4. Wallet & escrow security

| Rule | Detail |
|------|--------|
| Balance authority | Server ledger only — triggers update wallets |
| Client cannot set balance | RLS + no API endpoint |
| Escrow release | Client participant OR admin dispute resolution |
| Idempotency | Required on all money POSTs |
| Audit trail | Append-only wallet_transactions |
| Admin override | Logged in audit_logs with actor |

---

## 5. API security

| Control | Value |
|---------|-------|
| Rate limiting | Redis — per IP and per user (see API_SPEC) |
| Request size | 1 MB JSON max (10 MB multipart via presign) |
| CORS | `ishbor.uz` origins only |
| Security headers | HSTS, X-Frame-Options DENY, CSP |
| Input validation | Zod on all DTOs |
| Output encoding | JSON — no HTML in API responses |
| SQL injection | Parameterized queries / Drizzle ORM |

### Content Security Policy (frontend)
```
default-src 'self';
script-src 'self' 'unsafe-inline' (vite dev only);
connect-src 'self' wss://api.ishbor.uz;
img-src 'self' https://cdn.ishbor.uz data:;
```

---

## 6. Secrets management

| Secret | Storage |
|--------|---------|
| DATABASE_URL | Env / Vault |
| SESSION_SECRET | Env / Vault |
| OAuth secrets | Env / Vault |
| Payment keys | Env / Vault — never client bundle |
| S3 keys | Server only |
| OPENAI_API_KEY | Server only — AI proxy |

**Rule:** Zero secrets in `VITE_*` except public analytics keys.

---

## 7. Data protection

| Data class | Encryption | Access |
|------------|------------|--------|
| Passwords | bcrypt hash | Never returned |
| PII (email, phone) | At rest: DB encryption (Neon) | Owner + admin RBAC |
| KYC documents | Private bucket + signed URLs | Admin verifications role |
| Payment tokens | gateway token_ref only | Owner |
| Session tokens | SHA-256 hash stored | Server only |
| OAuth tokens | AES-256 encrypted column | Server only |

---

## 8. Audit & compliance

| Requirement | Implementation |
|-------------|----------------|
| Admin actions | Immutable audit_logs |
| Financial transactions | Append-only wallet_transactions + payment_records |
| Data retention | Analytics 24mo, audit 7yr, messages configurable |
| Account deletion | GDPR-style export + purge job |
| Uzbekistan data | Neon region selection (EU/US — document choice) |

---

## 9. Dependency security

| Practice | Tool |
|----------|------|
| npm audit | CI gate — no high/critical |
| SAST | ESLint security plugins |
| Secret scan | gitleaks in CI |

---

## 10. Incident response

| Severity | Response |
|----------|----------|
| P0 — payment breach | Freeze withdrawals, rotate keys, notify users |
| P1 — auth bypass | Invalidate all sessions, patch, deploy |
| P2 — data leak | Scope assessment, notify affected users |

Runbook location: `rules/11-backend/runbooks/` (create during implementation phase).

---

## 11. Production checklist (from SECURITY_GUIDELINES)

- [ ] HttpOnly cookie sessions
- [ ] Real OAuth
- [ ] Real password reset email
- [ ] Payment gateway server-side
- [ ] Rate limiting on auth + checkout
- [ ] Secrets out of client bundle
- [ ] Server-authoritative wallet
- [ ] Immutable audit log
- [ ] RLS enabled on all user tables
- [ ] WAF enabled (Cloudflare)

---

*Supersedes client-side fail-closed pattern — server becomes authoritative.*
