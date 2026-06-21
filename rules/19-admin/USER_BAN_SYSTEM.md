# USER_BAN_SYSTEM.md

**Scope:** Account suspension and permanent ban — admin actions → user-status-store sync  
**Routes:** `/admin/users`, `/admin/users/$id`  
**Maps:** `suspendAdminUser`, `banAdminUser`, `activateAdminUser`, `user-status-store`  
**Stack:** FastAPI `users.account_status` + session revocation + notifications

---

## 1. Account status model

```typescript
type AccountStatus = "active" | "suspended" | "banned" | "pending";
```

| Status | Login | Marketplace | Withdraw | Meaning |
|--------|-------|-------------|----------|---------|
| active | ✅ | ✅ | ✅ if KYC | Normal |
| pending | ✅ limited | partial | ❌ | Awaiting verification |
| suspended | ❌ | ❌ | ❌ | Temporary enforcement |
| banned | ❌ | ❌ | ❌ | Permanent removal |

**Storage demo:** `ishbor-user-status` → `Record<normalizedEmail, AccountStatus>`  
**Production:** `users.account_status` column + Redis session purge.

---

## 2. Login block enforcement

From `user-status-store.ts`:

```typescript
isLoginBlocked(email):
  if rateLimited(email) return true
  status = getUserAccountStatus(email)
  return status === "suspended" || status === "banned"

loginBlockedMessage(email):
  suspended → "Hisobingiz vaqtincha to'xtatilgan. Qo'llab-quvvatlash bilan bog'laning."
  banned → "Hisobingiz bloklangan. Savollar uchun support@ishbor.uz ga yozing."
```

Auth `beforeLoad` + login form must call server check in production — client localStorage bypass is demo-only gap.

---

## 3. Suspend flow (To'xtatish)

**Trigger:** Admin `/admin/users` or `/admin/users/$id` → To'xtatish → confirm dialog.

```typescript
suspendAdminUser(id):
  updateAdminUser(id, { status: "suspended" })
  syncAccountStatusFromAdmin(user.email, "suspended")
  blockDemoAccountServer({ email, blocked: true })  // prod: revoke sessions
```

**Effects:**
| Layer | Effect |
|-------|--------|
| admin-data-store | AdminUser.status = suspended |
| user-status-store | email → suspended |
| auth | Active sessions invalidated |
| marketplace | Cannot login; public profile hidden (production) |
| wallet | Withdrawals blocked; escrow in-flight frozen for admin review |
| notifications | `notifyAdminAction` — kind admin, high priority |

**Audit:**
```
addAuditEntry({
  who: adminName,
  what: "Foydalanuvchi to'xtatildi: {name}",
  category: "user",
  target: userId,
})
```

Seed example: *"Foydalanuvchi hisobi to'xtatildi — spam arizalar"* (category moderation in seed).

---

## 4. Ban flow (Bloklash)

**Trigger:** Destructive confirm — variant destructive, label "Bloklash".

```typescript
banAdminUser(id):
  updateAdminUser(id, { status: "banned" })
  syncAccountStatusFromAdmin(user.email, "banned")
  blockDemoAccountServer({ email, blocked: true })
```

**When to ban vs suspend:**

| Use suspend | Use ban |
|-------------|---------|
| First policy violation | Confirmed fraud |
| Investigation ongoing | Scam ring member |
| Spam (first offense) | Repeated suspend violations |
| Chargeback abuse suspect | Illegal content |
| User agrees to fix | Impersonation confirmed |

**Ban is permanent** — reversal requires superadmin + documented appeal approval.

---

## 5. Reactivate flow (Faollashtirish)

```typescript
activateAdminUser(id):
  updateAdminUser(id, { status: "active" })
  syncAccountStatusFromAdmin(user.email, "active")
  blockDemoAccountServer({ email, blocked: false })
```

Notify user: *"Hisobingiz qayta faollashtirildi"*

Does not auto-approve KYC — verification status independent.

---

## 6. Bulk suspend

`/admin/users.index.tsx` supports bulk suspend — use sparingly:

```
Ommaviy to'xtatish → rows.forEach(suspendAdminUser)
```

Requires superadmin in production. Single audit entry with target `"bulk"` + count.

Policy: bulk only for coordinated spam attack — not routine moderation.

---

## 7. syncAccountStatusFromAdmin

Bridges admin-data-store email to user-status-store key (normalized email):

```typescript
syncAccountStatusFromAdmin(email, status):
  setUserAccountStatus(email, status)
```

Production equivalent:

```python
async def set_account_status(user_id, status, actor_admin_id):
    await users_repo.update_status(user_id, status)
    await sessions_repo.revoke_all(user_id)
    await audit.log_user_status_change(...)
    await notifications.send_admin_action(user_id, ...)
```

---

## 8. Relationship to rate limiting

`isLoginBlocked` also checks `isRateLimited(email)` from rate-limit module — brute force lockout separate from admin suspend.

| Mechanism | Duration | Who clears |
|-----------|----------|------------|
| Rate limit | 15 min | Auto TTL |
| Suspend | Until admin activates | Support/superadmin |
| Ban | Permanent | Superadmin appeal only |

---

## 9. Marketplace side effects (production)

| Entity | On suspend/ban |
|--------|----------------|
| Public profile | Hidden |
| Active listings | Paused |
| Open proposals | Cancelled |
| Escrow in progress | Frozen — admin must resolve |
| Pending withdrawal | Rejected + funds to available |
| Messages | Read-only or blocked |

Demo does not fully enforce — document as production requirements.

---

## 10. User communication (Uzbek)

**Suspend notification:**
```
Title: Hisob vaqtincha to'xtatildi
Body: Sabab: {reason}. Qo'llab-quvvatlash: support@ishbor.uz
href: /support
```

**Ban notification:**
```
Title: Hisob bloklandi
Body: Ishbor qoidalarini buzganlik uchun hisob yopildi. Shikoyat: support@ishbor.uz
```

Email parallel — EMAIL_NOTIFICATION_MATRIX §12. SMS for ban optional critical.

---

## 11. Admin RBAC

| Action | Minimum role |
|--------|--------------|
| Suspend | support admin |
| Ban | superadmin (production) |
| Bulk suspend | superadmin |
| Activate | support admin |

Demo allows any admin — tighten in production RBAC.

---

## 12. FastAPI endpoints

```
POST /api/v1/admin/users/{id}/suspend   { reason_uz }
POST /api/v1/admin/users/{id}/ban       { reason_uz }
POST /api/v1/admin/users/{id}/activate  { note_uz }
```

All require audit reason text min 10 chars. Ban requires MFA step-up.

---

## 13. Fraud integration

FRAUD_PREVENTION triggers auto-flag — human confirms ban:

```
fraud_flag confirmed → recommend ban
finance admin reviews → banAdminUser
```

Auto-ban without human review: **only** duplicate payout card across accounts (withdrawal freeze immediate; ban after review).

---

## 14. Appeals

1. User emails support@ishbor.uz from registered email
2. Support ticket linked to user id
3. Superadmin reviews within 5 business days
4. Overturn suspend → activateAdminUser
5. Ban overturn rare — requires founder approval + audit

---

## 15. Testing checklist

- [ ] Suspended user cannot login — correct Uzbek message
- [ ] Banned user cannot re-register same email (production)
- [ ] Session revoked on suspend while logged in
- [ ] Audit entry created every action
- [ ] Notification delivered to user
- [ ] activateAdminUser restores login

---

*Suspend pauses access for correction; ban removes bad actors permanently — both sync through user-status-store and must revoke sessions server-side in production.*
