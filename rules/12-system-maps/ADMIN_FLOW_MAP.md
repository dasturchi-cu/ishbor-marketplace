# ADMIN_FLOW_MAP.md — Admin OS Workflows

**Routes:** 22 under `/admin/*`  
**Stores:** `admin-data-store` (entity snapshots), `admin-store` (audit log)  
**Access:** `requireAdmin` in guards.ts + `isAdminUser` check

---

## 1. Admin entry

```
/login (admin@ishbor.uz / demo1234)
  → postLoginPath → /admin
  OR role switcher unavailable for non-admin

/admin (dashboard)
  → KPI cards from admin-data-store aggregates
  → Quick links to queues
```

---

## 2. User lifecycle management

```
/admin/users → list AdminUser[]
/admin/users/$id → detail + actions

Actions (admin-data-store):
  suspendAdminUser(id)
    → updateAdminUser status=suspended
    → syncAccountStatusFromAdmin(email, suspended)
    → blockDemoAccountServer (stub)
    → if logged in: auth.logout()

  activateAdminUser(id) → reverse suspend
  banAdminUser(id) → permanent block
  verifyAdminUser(id) → setUserVerified + verified=true
```

**Audit:** `admin-store.addAuditEntry` on sensitive actions

---

## 3. Content moderation

```
/admin/moderation → ModerationItem[]
  → updateModerationItem(id, { status: approved|rejected })

/admin/projects → AdminProject[]
  → updateAdminProject(slug, { adminStatus })
    → approved: updateProjectStatus(slug, published)
    → suspended/rejected: updateProjectStatus(slug, closed)

/admin/services → same pattern → updateServiceStatus

/admin/portfolios → portfolio admin actions via portfolio-store helpers
```

---

## 4. Trust & verification

```
/admin/verifications → VerificationRequest[]
  → updateVerification(id, { status, reviewedAt })
  → on approve: verifyAdminUser

/admin/disputes → Dispute[]
  → updateDispute(id, { status, resolution })
  → may trigger adminReleaseEscrow / adminRefundEscrow
```

---

## 5. Financial operations

```
/admin/orders → read-only order snapshots
/admin/payments → PaymentRecord[] → updatePayment
/admin/escrow → getAdminEscrowList()
/admin/escrow/$id → detail + actions:

  adminReleaseEscrow(escrowId, milestoneLabel)
    → releaseEscrowMilestone in escrow-store

  adminFreezeEscrow(escrowId)
    → openEscrowDispute

  adminRefundEscrow(escrowId)
    → refundEscrowToClient

  adminReleaseEscrowByOrder(orderId)
  adminRefundEscrowByOrder(orderId)
```

**Critical:** Admin escrow actions mutate client `escrow-store` + `wallet-store` — must become server-only in production.

---

## 6. Support & applications

```
/admin/support → SupportTicket[] → updateSupportTicket
/admin/applications → Application[] → updateApplication
```

---

## 7. Platform intelligence

```
/admin/analytics → marketplace aggregates
/admin/founder → computeFounderAiInsights, monetization overview
/admin/ai → ai-insights-store categories
/admin/audit → getAuditLog() chronological
/admin/system → health.functions (partial)
```

---

## 8. Admin permission model (current vs target)

| Action | Current check | Target (RBAC_SPECIFICATION) |
|--------|---------------|----------------------------|
| View admin | isAdmin flag | admin.role + permission |
| Suspend user | any admin | users.suspend |
| Release escrow | any admin | escrow.release + MFA |
| Refund | any admin | escrow.refund + dual approval |
| View payments | any admin | payments.read |

---

## 9. Admin sync guarantees

| Admin action | Marketplace effect | Store function |
|--------------|-------------------|----------------|
| Suspend user | Login blocked | user-status-store |
| Ban user | Logout + block | syncAccountStatusFromAdmin |
| Approve project | Visible in /projects | updateProjectStatus |
| Reject service | Hidden/paused | updateServiceStatus |
| Verify user | Badge on profile | verified-users-store |

**Known gap:** Admin sees `admin-data-store` snapshot which may diverge from user-created localStorage on another browser.

---

## 10. Production admin requirements (100k users)

- All mutations via Admin API with audit trail in Postgres
- Dual control for refunds > threshold
- SLA timers on disputes (24h per TRUST_SYSTEM)
- Real-time queue counts via WebSocket or polling
- PII access logging for GDPR-style compliance
- No direct client store mutation from admin UI

See [ADMIN_ARCHITECTURE.md](../10-admin/ADMIN_ARCHITECTURE.md) and [13-domains/ADMIN_OS.md](../13-domains/ADMIN_OS.md).
