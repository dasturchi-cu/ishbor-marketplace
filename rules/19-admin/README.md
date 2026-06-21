# Ishbor Admin OS — Documentation Index

**Scope:** Platform operations — moderation, finance, trust, compliance  
**Routes:** 22 under `/admin/*` (+ detail routes `/admin/users/$id`, `/admin/escrow/$id`)  
**Stack:** FastAPI `/api/v1/admin/*` + React Admin OS (TanStack Router)  
**Domain:** [13-domains/ADMIN_OS.md](../13-domains/ADMIN_OS.md)  
**Backend:** [11-backend/admin/ADMIN_OS_BACKEND.md](../11-backend/admin/ADMIN_OS_BACKEND.md)  
**Flow map:** [12-system-maps/ADMIN_FLOW_MAP.md](../12-system-maps/ADMIN_FLOW_MAP.md)

---

## Purpose

Admin OS is Ishbor's internal control plane for founders, finance, support, and moderators. It mirrors marketplace state, executes privileged mutations (suspend, escrow release, KYC approve), and maintains an immutable audit trail.

**Demo today:** `admin-data-store` + `admin-store` in localStorage.  
**Production:** All reads from PostgreSQL views; all writes via FastAPI with RBAC + MFA.

---

## Document map

| Document | Focus |
|----------|-------|
| [ADMIN_OPERATIONS.md](./ADMIN_OPERATIONS.md) | Daily ops runbook — all 22 admin routes |
| [MODERATION_GUIDELINES.md](./MODERATION_GUIDELINES.md) | Content policy, Uzbek reject reasons |
| [KYC_VERIFICATION.md](./KYC_VERIFICATION.md) | Verification queue, `/admin/verifications` |
| [USER_BAN_SYSTEM.md](./USER_BAN_SYSTEM.md) | Suspend/ban via user-status-store |
| [AUDIT_LOG_WORKFLOW.md](./AUDIT_LOG_WORKFLOW.md) | When audit entries created, retention |

---

## Admin roles (`admin-roles.ts`)

| Role | Sections | MFA |
|------|----------|-----|
| Super Admin | All | Yes (finance actions) |
| Finance Admin | Orders, escrow, disputes, payments, analytics, audit | Yes |
| Support Admin | Users, verifications, support, disputes read | No |
| Moderator | Projects, services, moderation, applications | No |

Production maps to `admin_role_assignments` in PostgreSQL — see RBAC_POLICIES.md.

---

## Core stores (demo → production)

| Demo store | Key | Production |
|------------|-----|------------|
| admin-data-store | `ishbor-admin-data` | PostgreSQL admin views |
| admin-store | `ishbor-audit-log` | `audit_logs` append-only |
| user-status-store | `ishbor-user-status` | `users.account_status` |
| verified-users-store | — | `users.kyc_status` |

---

## Critical action summary

| Action | Admin function | Marketplace sync |
|--------|----------------|------------------|
| Suspend user | `suspendAdminUser` | user-status + logout |
| Ban user | `banAdminUser` | permanent block |
| Approve KYC | `updateVerification` + `verifyAdminUser` | withdrawal unlock |
| Approve project | `updateAdminProject` | `published` |
| Reject service | `updateAdminService` | `paused` |
| Release escrow | `adminReleaseEscrow` | wallet payout |
| Refund escrow | `adminRefundEscrow` | client wallet credit |

Every sensitive action → `addAuditEntry` or production `audit_logs` INSERT.

---

## Security (production)

- `isAdmin` from DB only — never client flag alone
- MFA for finance: escrow release/refund, payment approve
- IP allowlist optional for `/admin`
- Rate limit destructive actions
- Dual approval refunds > threshold
- 7-year audit retention for financial actions

---

## Entry path

```
/login (admin role)
  → beforeLoad requireAdmin
  → /admin dashboard KPIs
  → queue badges (verifications, disputes)
```

Uzbek UI throughout. Primary color `#2563EB` — no redesign without explicit request.

---

## Cross-references

| Topic | Document |
|-------|----------|
| Escrow admin | [11-backend/payments/ESCROW_SYSTEM.md](../11-backend/payments/ESCROW_SYSTEM.md) |
| Withdrawals | [11-backend/payments/WITHDRAWAL_SYSTEM.md](../11-backend/payments/WITHDRAWAL_SYSTEM.md) |
| Fraud | [11-backend/payments/FRAUD_PREVENTION.md](../11-backend/payments/FRAUD_PREVENTION.md) |
| Admin notifications | [18-notifications/IN_APP_NOTIFICATION_MATRIX.md](../18-notifications/IN_APP_NOTIFICATION_MATRIX.md) |
| Trust SLA | [04-trust/TRUST_SYSTEM.md](../04-trust/TRUST_SYSTEM.md) |

---

## Migration checklist

- [ ] Replace admin-data-store reads with API
- [ ] Server-side RBAC on every admin route
- [ ] Persist audit to Postgres — remove 200-entry client cap
- [ ] Real-time queue counts (WS or 60s poll)
- [ ] PII access logging
- [ ] No direct wallet/escrow client mutation from admin UI

---

## Route index (22 sections)

| # | Route | Section doc |
|---|-------|-------------|
| 1 | `/admin` | ADMIN_OPERATIONS §2.1 |
| 2 | `/admin/users` (+ `$id`) | ADMIN_OPERATIONS §2.2, USER_BAN_SYSTEM |
| 3 | `/admin/verifications` | KYC_VERIFICATION |
| 4 | `/admin/orders` | ADMIN_OPERATIONS §2.4 |
| 5 | `/admin/disputes` | ADMIN_OPERATIONS §2.5 |
| 6 | `/admin/payments` | ADMIN_OPERATIONS §2.6, WITHDRAWAL_SYSTEM |
| 7 | `/admin/projects` | MODERATION_GUIDELINES |
| 8 | `/admin/portfolios` | MODERATION_GUIDELINES |
| 9 | `/admin/services` | MODERATION_GUIDELINES |
| 10 | `/admin/applications` | ADMIN_OPERATIONS §2.10 |
| 11 | `/admin/escrow` (+ `$id`) | ADMIN_OPERATIONS §2.11, PAYOUT_SYSTEM |
| 12 | `/admin/moderation` | MODERATION_GUIDELINES |
| 13 | `/admin/support` | ADMIN_OPERATIONS §2.13 |
| 14 | `/admin/analytics` | ADMIN_OPERATIONS §2.14 |
| 15 | `/revenue` | COMMISSION_SYSTEM |
| 16 | `/admin/founder` | ADMIN_OPERATIONS §2.16 |
| 17 | `/admin/ai` | ADMIN_OPERATIONS §2.17 |
| 18 | `/admin/audit` | AUDIT_LOG_WORKFLOW |
| 19 | `/admin/system` | ADMIN_OPERATIONS §2.19 |

Detail routes (`/admin/users/$id`, `/admin/escrow/$id`) inherit parent section policies.

---

## SLA summary

| Queue | Target response | Escalation |
|-------|-----------------|------------|
| Disputes | 24h first touch | Finance lead at 72h |
| KYC verifications | 48h decision | Support lead at 96h |
| Support tickets | 24h first reply | Tier 2 at 48h |
| Pending withdrawals | Same business day | Dual approval > $5k |

---

## Notification obligations

Admin actions that affect users must fire parallel notifications — see [18-notifications/IN_APP_NOTIFICATION_MATRIX.md](../18-notifications/IN_APP_NOTIFICATION_MATRIX.md) kind `admin` and EMAIL_NOTIFICATION_MATRIX §12. Never take enforcement action silently except where law requires sealed investigation.

---

*Admin OS is Ishbor's safety net — human operators with audited powers over users, content, and money.*
