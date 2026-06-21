# AUDIT_LOG_WORKFLOW.md

**Scope:** Admin audit trail — when entries are created, storage, retention, production Postgres  
**Maps:** `admin-store.ts` → `addAuditEntry`, `performAdminAction`, `/admin/audit`  
**Stack:** FastAPI append-only `audit_logs` table  
**Related:** [13-domains/ADMIN_OS.md](../13-domains/ADMIN_OS.md), [11-backend/admin/ADMIN_OS_BACKEND.md](../11-backend/admin/ADMIN_OS_BACKEND.md)

---

## 1. Purpose

Every sensitive Admin OS mutation leaves an immutable audit record answering:

- **Who** performed the action (admin identity)
- **What** was done (Uzbek description string)
- **When** it occurred
- **Category** for filtering
- **Target** entity id (user, escrow, payment, etc.)

Audit supports compliance, dispute investigation, and founder oversight — not user-facing except regulatory request.

---

## 2. AuditEntry shape (demo)

```typescript
type AuditCategory = "user" | "admin" | "escrow" | "payment" | "moderation" | "system";

type AuditEntry = {
  id: string;
  who: string;        // Admin display name
  what: string;       // Action description (Uzbek)
  when: string;       // Relative or ISO
  category: AuditCategory;
  target?: string;    // Entity id
};
```

**Storage demo:** `ishbor-audit-log` localStorage, max **200 entries** (FIFO trim).  
**Production:** PostgreSQL append-only — **no UPDATE/DELETE**; 7-year retention for financial categories.

---

## 3. Creation paths

### 3.1 performAdminAction (primary UI path)

All admin buttons using `AdminActionDialog`:

```typescript
performAdminAction({
  action: "Foydalanuvchi to'xtatildi: {name}",
  target: user.id,
  who: adminName,
  category: "user",
  onExecute: () => suspendAdminUser(user.id),
})
// → onExecute then addAuditEntry
```

**Rule:** Never call destructive `onExecute` without audit — DEAD_ACTION_POLICY for admin.

### 3.2 Direct addAuditEntry

Used when action spans multiple steps or system-generated:

```typescript
addAuditEntry({
  who: "Tizim",
  what: "Eskrou to'ldirildi — Fintech App Redesign uchun $6,000",
  category: "escrow",
  target: "ew1",
})
```

Production: system events from Celery workers (webhook confirm, auto job) use `actor_id = SYSTEM`.

### 3.3 FastAPI middleware (production)

Automatic audit for admin API mutations without explicit UI:

```python
@router.post("/admin/users/{id}/suspend")
async def suspend_user(id, body, admin=Depends(require_admin)):
    result = await admin_service.suspend(id, body.reason)
    await audit_repo.insert(
        actor_id=admin.id,
        action="user.suspend",
        description_uz=f"Foydalanuvchi to'xtatildi: {result.name}",
        category="user",
        target_id=id,
        metadata={"reason": body.reason},
    )
```

---

## 4. When to create audit entries

### Category: `user`

| Action | what pattern |
|--------|--------------|
| suspendAdminUser | Foydalanuvchi to'xtatildi: {name} |
| banAdminUser | Foydalanuvchi bloklandi: {name} |
| activateAdminUser | Foydalanuvchi faollashtirildi: {name} |
| verifyAdminUser (manual) | Foydalanuvchi tasdiqlandi: {name} |
| Bulk suspend | Ommaviy to'xtatildi {n} ta |

### Category: `admin`

| Action | what pattern |
|--------|--------------|
| Verification approved | Tasdiqlash tasdiqlandi: {userName} |
| Verification rejected | Tasdiqlash rad etildi: {userName} |
| Request more docs | {userName}dan qo'shimcha ma'lumot so'raldi |
| Role assignment | Admin roli berildi: {role} |

### Category: `escrow`

| Action | what pattern |
|--------|--------------|
| Milestone release (user) | Bosqich mablag'lari chiqarildi — {project} ${amount} |
| adminReleaseEscrow | Admin eskrou chiqardi — {escrowId} |
| adminFreezeEscrow | Eskrou muzlatildi — {escrowId} |
| adminRefundEscrow | Eskrou qaytarildi — {escrowId} |
| Dispute resolved | Nizo hal qilindi — {resolution} |

### Category: `payment`

| Action | what pattern |
|--------|--------------|
| Withdrawal approved | Yechib olish tasdiqlandi — ${amount} |
| Withdrawal rejected | Yechib olish so'rovi rad etildi — {method} ${amount} |
| Payment status update | To'lov holati yangilandi — {id} |

### Category: `moderation`

| Action | what pattern |
|--------|--------------|
| Project approved | Loyiha e'lon tasdiqlandi — {title} |
| Service rejected | Xizmat rad etildi — {slug} |
| Portfolio approved | Portfolio tasdiqlandi — {title} |
| Moderation item rejected | Moderatsiya rad etildi — {reasonCode} |
| User suspend (spam) | Foydalanuvchi hisobi to'xtatildi — spam arizalar |

### Category: `system`

| Action | what pattern |
|--------|--------------|
| New registration | Yangi ro'yxatdan o'tish — {name} ({role}) |
| Config change | Tizim sozlamasi o'zgartirildi — {key} |
| Feature flag | {flag} = {value} |
| Reconciliation alert | Rekonsiliatsiya ogohlantirishi — {detail} |

---

## 5. When NOT to audit

| Event | Reason |
|-------|--------|
| Admin page view | No mutation |
| Search/filter | Read-only |
| Export CSV | Log separately as `audit.export` if compliance requires |
| Failed confirmation (dialog cancelled) | No action taken |
| Health check ping | system noise |

Reads of PII (KYC document view) → separate **access log** table, not main audit feed.

---

## 6. UI — `/admin/audit`

**Component:** Chronological list from `getAuditLog()` via `subscribeAudit`.

| Feature | Demo | Production |
|---------|------|------------|
| Sort | Newest first | created_at DESC |
| Filter | category tabs | API query param |
| Search | Client filter | Full-text on what |
| Pagination | 200 cap | page/limit |
| Export | — | CSV superadmin |

Display `when` as relative Uzbek ("Hozirgina", "2 daqiqa oldin") — server returns ISO, client formats.

---

## 7. PostgreSQL schema (production)

```sql
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),  -- NULL for system
  actor_display_name varchar(200),
  action_code varchar(100) NOT NULL,    -- machine: user.suspend
  description_uz text NOT NULL,         -- human: Foydalanuvchi to'xtatildi...
  category varchar(50) NOT NULL,
  target_type varchar(50),              -- user, escrow, payment
  target_id varchar(100),
  metadata jsonb,                       -- before/after for financial
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Append-only: revoke UPDATE/DELETE from app role
CREATE INDEX audit_logs_created_at_idx ON audit_logs (created_at DESC);
CREATE INDEX audit_logs_category_idx ON audit_logs (category, created_at DESC);
CREATE INDEX audit_logs_target_idx ON audit_logs (target_id);
```

Financial actions (`escrow`, `payment`) require `metadata` with before/after wallet snapshots.

---

## 8. Retention policy

| Category | Retention |
|----------|-----------|
| payment | 7 years |
| escrow | 7 years |
| user | 5 years |
| moderation | 3 years |
| admin | 5 years |
| system | 1 year (aggregate archive) |

Archive job: move to cold storage S3 Parquet yearly; never delete payment/escrow before 7 years.

---

## 9. Integrity controls

| Control | Implementation |
|---------|----------------|
| Immutability | DB trigger deny UPDATE/DELETE |
| Clock sync | UTC timestamps only |
| Actor authenticity | JWT admin session — no spoofed `who` |
| Tamper detection | Optional hash chain P3 |
| Backup | Included in DATABASE_BACKUP_STRATEGY |

If audit insert fails, **rollback the admin mutation** — audit and action atomic in one TX.

---

## 10. Integration with notifications

Audit does not notify users by itself — paired actions call `notifyAdminAction`. Audit record is internal.

Exception: compliance export to user on legal request — manual process outside app.

---

## 11. Seed data reference

`admin-store.ts` SEED entries demonstrate expected format:

```
Sardor M. — Nargiza Akhmedova tasdiqlashini tasdiqladi (admin)
Tizim — Eskrou to'ldirildi — $6,000 (escrow)
Daniyar B. — Yechib olish so'rovi rad etildi — $3,000 (payment)
Laylo R. — Foydalanuvchi hisobi to'xtatildi — spam (moderation)
```

Use as copy examples for real audit strings.

---

## 12. Compliance queries

**Who suspended user X?**
```sql
SELECT * FROM audit_logs
WHERE target_id = :user_id AND action_code = 'user.suspend'
ORDER BY created_at DESC;
```

**All financial actions last 30 days:**
```sql
SELECT * FROM audit_logs
WHERE category IN ('payment', 'escrow')
  AND created_at > NOW() - INTERVAL '30 days';
```

---

## 13. Migration from demo

| Demo | Production |
|------|------------|
| localStorage 200 cap | Unlimited Postgres |
| Client addAuditEntry | Server-only insert |
| Relative when strings | ISO + client format |
| No IP/metadata | Full metadata jsonb |

Remove client ability to write audit — `/admin/audit` read-only API.

---

## 14. Testing checklist

- [ ] Every performAdminAction creates entry
- [ ] Failed execute does not create entry
- [ ] Category filter correct
- [ ] Financial action includes metadata
- [ ] Concurrent actions get unique ids
- [ ] Audit survives admin browser refresh (Postgres)

---

*Audit log is Ishbor's institutional memory — every ban, release, and rejection recorded with who, what, when, and enough context to reconstruct decisions years later.*
