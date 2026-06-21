# ADMIN_OPERATIONS.md

**Scope:** Daily operations runbook for Ishbor Admin OS — 22 routes  
**Audience:** Support, finance, moderation, founder ops  
**Shift language:** Uzbek UI labels preserved; runbook in English for operators  
**Stack:** FastAPI admin API + React routes under `/admin/*`

---

## 1. Daily rhythm (recommended)

| Time (Tashkent) | Task | Routes |
|-----------------|------|--------|
| 09:00 | Queue triage — verifications, disputes, support | `/admin/verifications`, `/admin/disputes`, `/admin/support` |
| 10:00 | Payment review — pending withdrawals | `/admin/payments` |
| 11:00 | Content moderation backlog | `/admin/moderation`, `/admin/projects`, `/admin/services` |
| 14:00 | Escrow/dispute SLA check (<24h) | `/admin/escrow`, `/admin/disputes` |
| 16:00 | User safety review — suspensions, fraud flags | `/admin/users` |
| 17:00 | Audit spot-check + system health | `/admin/audit`, `/admin/system` |
| Weekly Mon | Founder metrics review | `/admin/founder`, `/admin/analytics` |

SLA: disputes touched within 24h (TRUST_SYSTEM). Escalate >72h open to finance lead.

---

## 2. Route catalog (22 sections)

### 2.1 `/admin` — Boshqaruv paneli (Dashboard)

**Purpose:** KPI snapshot, quick links to hot queues.  
**Data:** `adminStats` — users, GMV, open disputes, pending verifications.  
**Daily actions:**
- Scan badge counts on sidebar
- Click through to oldest dispute/verification
- Note anomalies for founder standup

**Production API:** `GET /api/v1/admin/dashboard/stats` (Redis cache 60s).

---

### 2.2 `/admin/users` — Foydalanuvchilar

**Purpose:** User list — freelancers, clients, agencies.  
**Sub-routes:** `/admin/users` (index), `/admin/users/$id` (detail).

**Actions:**
| Button | Function | When |
|--------|----------|------|
| Tasdiqlash | `verifyAdminUser` | Manual trust boost (prefer verifications queue) |
| To'xtatish | `suspendAdminUser` | Spam, policy violation, investigation |
| Bloklash | `banAdminUser` | Fraud confirmed, permanent |
| Faollashtirish | `activateAdminUser` | Suspension lifted |

**Sync:** `syncAccountStatusFromAdmin` → `user-status-store`. Logged-in user force logout.

**Audit category:** `user`

---

### 2.3 `/admin/verifications` — Tasdiqlashlar

**Purpose:** KYC / identity queue. See [KYC_VERIFICATION.md](./KYC_VERIFICATION.md).

**Actions:** Tasdiqlash, Qo'shimcha ma'lumot, Rad etish  
**Badge:** `adminStats.verificationRequests`

---

### 2.4 `/admin/orders` — Buyurtmalar

**Purpose:** Read-only order snapshots for support/finance.  
**Actions:** View status, link to escrow, no direct mutation (order changes via marketplace flow).  
**Use case:** Customer support ticket references order ID.

---

### 2.5 `/admin/disputes` — Nizolar

**Purpose:** Dispute resolution queue.  
**Actions:**
- Update status, resolution notes
- May trigger `adminReleaseEscrow` or `adminRefundEscrow`
- Split payout 60/40 documented in audit

**SLA:** Respond within 24h; notify both parties via `notifyAdminAction`.

**Role:** Support read; finance write on money resolution.

---

### 2.6 `/admin/payments` — To'lovlar

**Purpose:** Deposits, withdrawals, escrow transfers (`PaymentRecord[]`).  
**Actions:**
- Approve/reject pending withdrawals
- Flag fraud → link to user suspend
- Update payment status

See [WITHDRAWAL_SYSTEM.md](../11-backend/payments/WITHDRAWAL_SYSTEM.md).

**Role:** Finance admin + MFA.

---

### 2.7 `/admin/projects` — Loyihalar

**Purpose:** Client project listings moderation.  
**Actions:**
| adminStatus | Marketplace effect |
|-------------|-------------------|
| approved | `updateProjectStatus(slug, published)` |
| suspended / rejected | `updateProjectStatus(slug, closed)` |

**Audit category:** `moderation`

---

### 2.8 `/admin/portfolios` — Portfoliolar

**Purpose:** Portfolio work samples review.  
**Actions:** Approve → `notifyPortfolioApproved`; reject with reason (MODERATION_GUIDELINES).  
**Sync:** `portfolio-store` helpers.

---

### 2.9 `/admin/services` — Xizmatlar

**Purpose:** Freelancer service listings.  
**Actions:** Same pattern as projects — approved → `published`, rejected → `paused`.

---

### 2.10 `/admin/applications` — Arizalar

**Purpose:** Proposal/application oversight — spam detection, duplicate bids.  
**Actions:** `updateApplication` status; may lead to user suspend if abuse.

---

### 2.11 `/admin/escrow` — Eskrou

**Purpose:** Escrow workflow list.  
**Sub-route:** `/admin/escrow/$id` detail.

**Actions:**
| Action | Function | Risk |
|--------|----------|------|
| Release milestone | `adminReleaseEscrow` | P0 — MFA required |
| Freeze | `adminFreezeEscrow` | Blocks releases |
| Refund client | `adminRefundEscrow` | Dual approval >$5k |

**Critical:** Must be server-only in production — mutates wallet + escrow.

---

### 2.12 `/admin/moderation` — Moderatsiya

**Purpose:** Unified moderation queue (`ModerationItem[]`).  
**Actions:** `updateModerationItem` approved/rejected.  
See [MODERATION_GUIDELINES.md](./MODERATION_GUIDELINES.md).

---

### 2.13 `/admin/support` — Qo'llab-quvvatlash

**Purpose:** Support ticket queue.  
**Actions:** `updateSupportTicket` — assign, resolve, escalate to dispute/finance.  
**Integration:** User emails support@ishbor.uz → ticket created (production).

---

### 2.14 `/admin/analytics` — Analitika

**Purpose:** Marketplace aggregates — GMV, orders, users.  
**Actions:** Read-only; export CSV (production).  
**Data:** `getMarketplaceOverview()` / revenue-store equivalents.

---

### 2.15 `/revenue` — Daromad paneli (linked from admin nav)

**Purpose:** Platform revenue breakdown — fees, subscriptions, featured.  
**Note:** Lives outside `/admin` path but finance role access via nav.  
See [COMMISSION_SYSTEM.md](../11-backend/payments/COMMISSION_SYSTEM.md).

---

### 2.16 `/admin/founder` — Asoschilar paneli

**Purpose:** Founder-level monetization, cohorts, AI insights summary.  
**Actions:** Read-only strategic metrics.  
**Data:** `computeFounderAiInsights`, top freelancers/clients.

---

### 2.17 `/admin/ai` — AI Markaz

**Purpose:** AI usage logs, trust coach categories.  
**Actions:** Monitor abuse, rate limits; read-only P0.

---

### 2.18 `/admin/audit` — Audit jurnallari

**Purpose:** Chronological `getAuditLog()`.  
See [AUDIT_LOG_WORKFLOW.md](./AUDIT_LOG_WORKFLOW.md).

---

### 2.19 `/admin/system` — Tizim holati

**Purpose:** Service health indicators (`systemHealth`).  
**Actions:** Monitor API, DB, Redis, Celery, Eskiz, Payme status.  
**Escalation:** P0 if payments or auth down.

---

## 3. performAdminAction pattern

All destructive UI actions use:

```
1. AdminActionDialog confirmation (Uzbek title/description)
2. onExecute callback (store or API)
3. addAuditEntry({ who, what, category, target })
4. toast.success / toast.error (Sonner)
```

Never skip confirmation modal — DEAD_ACTION_POLICY applies to admin too.

---

## 4. Role routing quick reference

| If you are… | Start here | Avoid |
|-------------|------------|-------|
| Support | users, support, orders | escrow release without finance |
| Moderator | moderation, projects, services | payments, ban |
| Finance | payments, escrow, disputes | content approve |
| Super Admin | all | — |

`canAccessSection(role, section)` filters sidebar.

---

## 5. Escalation matrix

| Situation | Escalate to | Action |
|-----------|-------------|--------|
| Withdrawal > $5,000 | Second finance approver | Dual control |
| Fraud ring suspected | Super admin + freeze withdrawals | FRAUD_PREVENTION |
| Dispute > 72h | Finance lead | Force resolution |
| KYC document unclear | Senior support | Request more docs |
| System health red | DevOps on-call | `/admin/system` |

---

## 6. Communication templates (Uzbek)

After admin action, user receives in-app `notifyAdminAction` + email:

**Suspend:**  
Title: `Hisob vaqtincha to'xtatildi`  
Body: `Sabab: {reason}. Savol: support@ishbor.uz`

**Verification approved:**  
Title: `Tasdiqlash tasdiqlandi`  
Body: `Endi yechib olish va to'liq imkoniyatlar ochiq.`

---

## 7. Production API mapping

| Route UI | FastAPI prefix |
|----------|----------------|
| All admin sections | `/api/v1/admin/{resource}` |
| User suspend | `POST .../users/{id}/suspend` |
| Escrow release | `POST .../escrow/{id}/release` |
| Verification approve | `POST .../verifications/{id}/approve` |

OpenAPI tag: `admin`. Auth: `Depends(require_admin)`.

---

## 8. End-of-shift checklist

- [ ] Zero disputes past SLA without note
- [ ] Pending withdrawals queue cleared or assigned
- [ ] Verification queue < 48h oldest
- [ ] Audit entries present for all actions taken
- [ ] No open moderation items flagged urgent
- [ ] System health green or incident logged

---

## 9. Known demo gaps

- Admin snapshot may diverge from user localStorage on another browser
- Escrow/wallet mutations client-side — **must not ship to production**
- Audit capped at 200 entries in localStorage
- Role switcher is demo-only — disable in production

---

*This runbook covers every Admin OS route — daily triage order, per-section actions, and escalation paths for Ishbor operators.*
