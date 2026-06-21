# KYC_VERIFICATION.md

**Scope:** Identity and business verification flow — `/admin/verifications`  
**Maps:** `VerificationRequest[]` in admin-data-store, `verifyAdminUser()`, withdrawal KYC gates  
**Stack:** FastAPI + MinIO private docs + PostgreSQL `verification_requests`  
**Related:** [WITHDRAWAL_SYSTEM.md](../11-backend/payments/WITHDRAWAL_SYSTEM.md), [04-trust/TRUST_SYSTEM.md](../04-trust/TRUST_SYSTEM.md)

---

## 1. Purpose

KYC (Know Your Customer) on Ishbor unlocks:

| Capability | KYC required |
|------------|--------------|
| Browse, propose, order | Email verified only |
| Deposit, pay escrow | Email + phone OTP |
| **Withdraw to bank** | **Identity KYC approved** |
| High daily withdrawal (>$1,000) | Enhanced KYC tier |

Verification badge on profile increases Trust Score per TRUST_SYSTEM.md.

---

## 2. User submission flow

```
/settings/verification (or /wallet withdraw blocked redirect)
  → User selects type: shaxs (individual) | biznes (business)
  → Upload documents to MinIO presigned URL
  → Submit → VerificationRequest status=pending
  → In-app: "Tasdiqlash so'rovi yuborildi"
```

**Document types (individual):**
- Pasport yoki ID karta (old + new side)
- Selfie with ID (liveness P2)

**Document types (business):**
- Guvohnoma / STIR
- Director ID
- Bank details letter (optional)

Files stored: MinIO bucket `ishbor-kyc-private` — TLS, signed URL, 7-year retention.

---

## 3. Admin queue — `/admin/verifications`

**UI:** DataTable of `getAdminVerifications()` with badge count on sidebar.

| Column | Meaning |
|--------|---------|
| userName | Applicant |
| type | individual / business |
| status | pending / approved / rejected / needs_info |
| submittedAt | Queue ordering (FIFO) |
| history | Admin action trail |

**Daily ops:** Process oldest pending first; target <48h turnaround.

---

## 4. Admin actions

### 4.1 Tasdiqlash (Approve)

```typescript
updateVerification(v.id, { status: "approved" })
verifyAdminUser(v.userId)  // sets verified=true, status=active
```

**Effects:**
- `users.kyc_status = approved`
- `users.kyc_tier = basic` (or enhanced if docs support)
- Profile verification badge visible
- Withdrawal API unlocked (basic limits)
- `notifyAdminAction` + email `admin.verification_approved`
- `addAuditEntry` — category `admin`, target user id

**Audit example:** *"Nargiza Akhmedova tasdiqlashini tasdiqladi"* (from admin-store seed)

### 4.2 Rad etish (Reject)

```typescript
updateVerification(v.id, { status: "rejected", rejectionReason: reasonUz })
```

**Effects:**
- User notified with specific Uzbek reason
- Can resubmit after fixing issues
- Withdrawal remains blocked

**Common reject reasons (Uzbek):**
```
Hujjat rasmi aniq emas. Iltimos, qayta yuklang.
Pasport muddati tugagan.
Selfie ID bilan mos kelmaydi.
STIR ma'lumotlari mos emas.
```

### 4.3 Qo'shimcha ma'lumot (Request info)

```typescript
updateVerification(v.id, {
  history: [...v.history, { action: "Qo'shimcha hujjat so'raldi", by: "Admin", date: "..." }]
})
```

Status stays `pending` or moves to `needs_info`. User notification with list of required docs.

---

## 5. verifyAdminUser vs verification queue

| Path | When |
|------|------|
| `/admin/verifications` approve | Standard KYC — documents reviewed |
| `/admin/users/$id` → Tasdiqlash | Manual override — superadmin only; still requires audit note |

Manual verify without documents → fraud risk. Policy: use only for founder-known partners with offline verification.

---

## 6. KYC tiers

| Tier | Requirements | Withdrawal limit |
|------|--------------|------------------|
| none | Registered | Blocked |
| basic | ID approved | $1,000/day |
| enhanced | Business docs + video call | $25,000/day |

Stored: `users.kyc_tier`. Upgrade path: user submits enhanced docs → new queue item.

---

## 7. Integration with withdrawal

From WITHDRAWAL_SYSTEM:

```python
async def require_verified(self, user_id):
    if user.kyc_status != "approved":
        raise HTTPException(403, detail="Tasdiqlash talab qilinadi. /settings/verification")
```

Wallet UI: withdraw button disabled with link to verification when pending.

---

## 8. Trust system linkage

Verification components (TRUST_SYSTEM §3.3):
- Email tasdiqlangan — auth flow
- Telefon tasdiqlangan — Eskiz OTP
- Identity tasdiqlangan — this KYC flow
- Skill/Portfolio tasdiqlangan — separate portfolio moderation

Trust Score weights identity verification heavily — single source from `users.kyc_status`, not duplicate badges.

---

## 9. Security & privacy

| Control | Implementation |
|---------|----------------|
| Document access | Admin `verifications` role only |
| Download audit | Log admin user_id + document_id viewed |
| PII in audit log | Never store passport numbers in audit text |
| Encryption at rest | MinIO SSE |
| Retention | 7 years post account close |
| Delete on request | Anonymize after legal retention window |

Production: MFA for admin viewing KYC documents.

---

## 10. FastAPI endpoints

| Method | Path | Role |
|--------|------|------|
| GET | `/api/v1/admin/verifications?status=pending` | support+ |
| GET | `/api/v1/admin/verifications/{id}` | support+ |
| GET | `/api/v1/admin/verifications/{id}/document/{doc_id}` | support+ MFA |
| POST | `/api/v1/admin/verifications/{id}/approve` | support+ |
| POST | `/api/v1/admin/verifications/{id}/reject` | support+ |
| POST | `/api/v1/admin/verifications/{id}/request-info` | support+ |

User-facing:

| POST | `/api/v1/verification/submit` | authenticated |
| GET | `/api/v1/verification/status` | authenticated |

---

## 11. Notifications

| Event | In-app kind | Email | SMS |
|-------|-------------|-------|-----|
| Submitted | system | optional | no |
| Approved | admin | yes | optional |
| Rejected | admin | yes | no |
| Needs info | admin | yes | no |

Templates: IN_APP_NOTIFICATION_MATRIX §11, EMAIL_NOTIFICATION_MATRIX §12.

---

## 12. Edge cases

| Case | Handling |
|------|----------|
| User suspended with pending KYC | Review completes but withdraw still blocked until active |
| Duplicate submission | Reject newer; keep first pending |
| Minor (under 18) | Reject — marketplace 18+ |
| Foreign passport | Accept if legible; enhanced tier for large withdrawals |
| Name mismatch account vs ID | Request info or reject with reason |
| User banned during review | Reject queue item; close request |

---

## 13. Demo → production

| Demo | Production |
|------|------------|
| Mock verificationRequests | PostgreSQL + MinIO |
| Client-side verifyAdminUser | API + server session |
| No document viewer | Secure presigned URL in admin UI |

View `admin.verifications.tsx` for UI actions — wire to FastAPI not localStorage patch.

---

*KYC is the gate between earning on Ishbor and cashing out — admin.verifications is the human review queue that unlocks withdrawals and trust badges.*
