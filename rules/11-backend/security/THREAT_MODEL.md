# THREAT_MODEL.md

**Method:** STRIDE analysis for Ishbor marketplace  
**Scope:** Client-freelancer platform with escrow payments on self-hosted VPS  
**Date:** 2026-06 — review quarterly

---

## 1. System overview (trust boundaries)

```
┌─────────────────────────────────────────────────────────┐
│ TRUST ZONE: User browser                                 │
│  TanStack frontend — UNTRUSTED input                    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│ TRUST ZONE: DMZ (nginx on VPS)                          │
│  TLS termination, rate limits, WAF rules                │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ TRUST ZONE: Application (FastAPI + Celery)              │
│  Auth, RBAC, business logic — TRUSTED if code correct   │
└──────┬─────────────────┬─────────────────┬──────────────┘
       │                 │                 │
┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│ PostgreSQL  │  │    Redis     │  │    MinIO     │
│ TRUSTED     │  │ SEMI-TRUSTED │  │ TRUSTED      │
└─────────────┘  └──────────────┘  └──────────────┘

EXTERNAL (untrusted): Payme/Humo/Uzcard webhooks, Eskiz SMS, Resend email
```

---

## 2. STRIDE analysis

### S — Spoofing

| Threat | Asset | Impact | Likelihood | Mitigation |
|--------|-------|--------|------------|------------|
| Session hijack | User session | Account takeover | Medium | HttpOnly Secure cookies, rotation |
| Webhook spoofing | Payment confirmation | Free credits | Medium | HMAC signature + IP allowlist |
| Admin impersonation | Admin panel | Platform compromise | Low | Server RBAC, audit logs |
| SMS OTP intercept | Phone auth | Account takeover | Low | Short TTL, 5 attempt limit |
| OAuth state CSRF | OAuth flow | Wrong account link | Low | State parameter validation |

**Residual risk:** Session fixation — mitigated by new session ID on login.

---

### T — Tampering

| Threat | Asset | Impact | Likelihood | Mitigation |
|--------|-------|--------|------------|------------|
| Client-side balance edit | Wallet | Financial loss | High (pre-migration) | Server ledger authority |
| Order amount manipulation | Checkout | Underpay escrow | Medium | Server calculates amounts |
| Milestone amount edit | Escrow release | Overpay freelancer | Low | DB-stored amounts, not client input |
| Audit log deletion | Compliance | Hide admin abuse | Low | Append-only DB trigger |
| File content swap | Uploads | Malware distribution | Medium | Presign + confirm + virus scan |

**Residual risk:** Insider admin abuse — mitigated by audit_logs + founder review.

---

### R — Repudiation

| Threat | Asset | Impact | Likelihood | Mitigation |
|--------|-------|--------|------------|------------|
| User denies checkout | Order | Dispute | Medium | audit_logs + wallet_transactions |
| Admin denies refund action | Escrow | Compliance | Low | audit_logs with before/after |
| Freelancer denies delivery | Milestone | Client dispute | Medium | Order timeline + messages |
| Gateway denies payment | Deposit | Reconciliation | Low | payment_records + gateway API |

**Control:** Immutable financial ledger + 7-year audit retention.

---

### I — Information disclosure

| Threat | Asset | Impact | Likelihood | Mitigation |
|--------|-------|--------|------------|------------|
| IDOR on orders/escrow | PII, business data | Privacy breach | Medium | Entity guards + RLS |
| KYC document leak | Identity docs | Severe PII | Low | Private MinIO bucket + signed URLs |
| Error stack traces | System info | Attack aid | Medium | Generic errors in prod |
| SSR data leak to guests | User data | Privacy | Low | AuthGate + no SSR secrets |
| Log PII exposure | Logs | Compliance | Medium | Structured redaction policy |
| Database breach | All data | Catastrophic | Low | VPS hardening, encrypted backups |

**Residual risk:** Freelancer sees client company info — by design (order participant).

---

### D — Denial of service

| Threat | Asset | Impact | Likelihood | Mitigation |
|--------|-------|--------|------------|------------|
| API flood | Availability | Platform down | Medium | nginx rate limits + UFW |
| Checkout spam | Wallet/gateway | Cost + UX | Medium | Per-user checkout limits |
| WebSocket connection flood | API memory | Service degradation | Medium | Connection limits per IP |
| Large file upload | MinIO disk | Storage exhaustion | Low | Size limits per purpose |
| PostgreSQL query bomb | DB CPU | Slow platform | Low | Query timeouts, pagination limits |
| Redis memory exhaustion | Cache/sessions | Degraded service | Low | maxmemory + LRU eviction |

**Residual risk:** VPS resource limits — monitor and scale vertically.

---

### E — Elevation of privilege

| Threat | Asset | Impact | Likelihood | Mitigation |
|--------|-------|--------|------------|------------|
| Client accesses admin panel | Admin functions | Platform compromise | Low | Admin RBAC on every route |
| Freelancer releases own milestone | Escrow funds | Theft | Medium | Client-only release guard |
| Guest POST checkout | Orders | Fraud | Medium | Auth + role middleware |
| Agency member exceeds role | Agency data | CRM leak | Low | hasAgencyPermission checks |
| RLS bypass via SQL injection | All user data | Total breach | Low | ORM parameterized queries |
| Celery task injection | Background jobs | Arbitrary code | Low | Redis auth, internal network only |

**Residual risk:** Admin role assignment — super_admin only can grant roles.

---

## 3. Critical asset ranking

| Rank | Asset | STRIDE priority |
|------|-------|-----------------|
| 1 | Wallet ledger + escrow funds | S, T, R, E |
| 2 | User credentials + sessions | S, E |
| 3 | KYC documents | I, T |
| 4 | Payment webhook integrity | S, T |
| 5 | Admin audit trail | T, R |
| 6 | Platform availability | D |

---

## 4. Attack trees (top 3)

### AT1: Steal escrow funds

```
Goal: Release milestone without client approval
├── Compromise client session → release milestone → Mitigated: session security
├── Exploit IDOR on release endpoint → Mitigated: participant guard
├── Tamper client-side to call release → Mitigated: server rejects non-client
├── Compromise admin → force release → Mitigated: audit + finance_admin only
└── SQL injection on escrow → Mitigated: ORM
```

### AT2: Free wallet credits

```
Goal: Credit wallet without payment
├── Forge webhook → Mitigated: HMAC + idempotency
├── Replay webhook → Mitigated: idempotency key on gateway_ref
├── Race condition double-credit → Mitigated: SELECT FOR UPDATE
└── Direct DB write → Mitigated: RLS + no user INSERT on wallets
```

### AT3: Account takeover

```
Goal: Access victim account
├── Brute force password → Mitigated: rate limit + lockout
├── Steal session cookie → Mitigated: HttpOnly + Secure
├── XSS steal cookie → Mitigated: HttpOnly (not accessible to JS)
├── OTP brute force → Mitigated: 5 attempts + hash storage
└── OAuth CSRF → Mitigated: state parameter
```

---

## 5. Risk matrix

| Risk | Severity | Mitigation status |
|------|----------|-------------------|
| Client-side wallet authority | Critical | Open — migration to server ledger P0 |
| Webhook forgery | Critical | Designed — HMAC verification |
| IDOR on financial endpoints | High | Designed — entity guards + RLS |
| XSS on checkout page | High | Designed — CSP + HttpOnly |
| Admin audit gap | High | Designed — append-only audit_logs |
| DDoS on launch | Medium | Partial — nginx limits, no CDN WAF P0 |
| KYC document leak | Medium | Designed — private bucket ACL |
| Insider admin threat | Medium | Partial — audit only, no dual control P1 |

---

## 6. Security testing plan

| Test | Frequency | Tool |
|------|-----------|------|
| OWASP ZAP scan | Monthly staging | ZAP automated |
| IDOR test suite | Every release | pytest integration |
| Webhook signature test | Every release | pytest |
| Dependency audit | Every PR | npm audit + pip audit |
| Penetration test | Pre-launch + annual | External firm |
| STRIDE review | Quarterly | Internal |

---

## 7. Related documents

- [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md)
- [RBAC_POLICIES.md](./RBAC_POLICIES.md)
- [RATE_LIMITING.md](./RATE_LIMITING.md)
- [../payments/PAYMENT_ARCHITECTURE.md](../payments/PAYMENT_ARCHITECTURE.md)

---

*STRIDE analysis identifies client-side wallet authority as the highest open risk — resolved by server ledger migration (P0). Review this model quarterly or after major feature additions.*
