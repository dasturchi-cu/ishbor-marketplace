# DATA_RETENTION_POLICY.md

**Project:** Ishbor Marketplace  
**Authority:** SECURITY_ARCHITECTURE.md §8, ADMIN_OS §audit, GDPR-style user rights  
**Stack:** PostgreSQL · MinIO · Redis · Loki (logs)  
**Related:** [SOFT_DELETE_STRATEGY.md](./SOFT_DELETE_STRATEGY.md), [AUDIT_TRAIL_STRATEGY.md](./AUDIT_TRAIL_STRATEGY.md)

---

## 1. Purpose

Define how long Ishbor retains each data class, when data is archived vs purged, and how retention supports:

- Legal and tax obligations (financial records)
- Trust and dispute resolution (messages, escrow history)
- User privacy (GDPR-style export and erasure)
- Operational cost (analytics partitioning, log rotation)

**Not Supabase** — all policies implemented via PostgreSQL cron/Celery jobs on VPS.

---

## 2. Data classification

| Class | Examples | Default retention | Purge method |
|-------|----------|-------------------|--------------|
| **Financial immutable** | wallet_transactions, payment_records, revenue_ledger | 7 years | Archive to cold storage; never hard delete |
| **Audit compliance** | audit_logs | 7 years | Archive table + S3 |
| **KYC / identity** | verification_documents, KYC MinIO objects | 5 years after account close OR 1 year after rejection | Hard delete MinIO + DB row |
| **Commerce state** | orders, escrow_workflows, disputes | 7 years (anonymized after user purge) | Soft delete + anonymize PII |
| **Messages** | messages, conversation metadata | 3 years active; 1 year after account delete | Soft delete → hard purge |
| **Analytics** | analytics_events | 24 months hot; 36 months aggregate | Monthly partition drop |
| **Product logs** | structlog application logs | 90 days | Loki retention |
| **Security logs** | auth failures, rate limits | 12 months | Loki + audit sample |
| **Ephemeral** | sessions, otp_verifications, idempotency_keys | Hours to 24h | Hard delete cron |
| **Cache** | Redis session, ranking cache | TTL-based | Automatic expiry |

---

## 3. Messages retention

### 3.1 Active users

| Data | Retention | Notes |
|------|-----------|-------|
| Message body | Indefinite while account active | User may delete individual messages (soft) |
| Conversation list | Indefinite | `archived` flag per participant |
| File attachments in messages | Linked to `files` table lifecycle | MinIO 3-year default |
| Read receipts | 90 days granular; then aggregated | `last_read_at` kept |

### 3.2 Deleted messages

User deletes message → soft delete:

```sql
UPDATE messages SET
  body = NULL,
  deleted_at = now(),
  deleted_by = :user_id
WHERE id = :id AND sender_user_id = :user_id;
```

UI shows: *"Xabar o'chirildi"*. Metadata (timestamp, sender) retained 1 year for abuse investigations.

### 3.3 Account deletion impact

| Phase | Messages |
|-------|----------|
| Anonymize (day 0–30) | Body NULL; sender显示 "O'chirilgan foydalanuvchi" |
| Purge (day 30+) | Hard delete messages where both participants deleted OR 1 year idle |
| Legal hold | Dispute open → retain until dispute closed + 90 days |

### 3.4 Admin/support access

Support admins with `support_admin` role may read messages linked to open ticket — access logged in audit_logs (`category=moderation`, `action=support_message_view`).

---

## 4. Analytics retention

### 4.1 `analytics_events` table

Partitioned by month (DATABASE_PERFORMANCE.md):

```sql
CREATE TABLE analytics_events (
  id UUID,
  user_id UUID,
  event_type VARCHAR(80),
  entity_id VARCHAR(120),
  value NUMERIC,
  meta JSONB,
  created_at TIMESTAMPTZ
) PARTITION BY RANGE (created_at);
```

| Tier | Age | Action |
|------|-----|--------|
| Hot | 0–24 months | Full row queryable |
| Rollup | 24–36 months | Daily aggregates only — raw partition dropped |
| Deleted | > 36 months | Only monthly GMV/funnel summaries in `analytics_rollups` |

**Celery job:** `ishbor.analytics.archive_partition` — 1st of month 04:00 UTC (see CRON_JOBS.md).

### 4.2 Client-side store (current)

`ishbor-analytics-events` localStorage cap 5000 events — **not** production authority. Server ingestion unlimited with rollups.

### 4.3 GDPR opt-out

User setting: `analytics_opt_out = true` in `notification_preferences` or dedicated column:

- Stop writing new `analytics_events` for user_id
- Do not retroactively delete aggregated rollups (no PII in aggregates)
- Delete user's raw events in next monthly partition job

Maps ANALYTICS.md GDPR note.

### 4.4 PII in events

**Forbidden in `meta`:** email, phone, full message text. Use `entity_id` only (analytics-events-store pattern).

---

## 5. KYC and verification documents

### 5.1 Active verification

| Status | Retention |
|--------|-----------|
| `pending` | Until approved/rejected + 90 days |
| `approved` | Life of account + 5 years after close |
| `rejected` | 1 year then purge documents |

### 5.2 Storage

- MinIO bucket: `ishbor-kyc-private`
- Signed URLs — 15 minute TTL
- Virus scan required before admin review (virus_scan_status)

### 5.3 Purge job

`ishbor.compliance.purge_kyc_documents`:

```
Daily 05:00 UTC
→ SELECT verification_requests WHERE rejected AND created_at < now() - interval '1 year'
→ DELETE MinIO objects
→ UPDATE documents jsonb = '[]'
→ audit_logs: action=kyc_documents_purged
```

Account deletion → **immediate** KYC purge (no grace).

---

## 6. Audit and financial retention

### 6.1 `audit_logs`

| Period | Storage |
|--------|---------|
| 0–24 months | Primary table |
| 24–84 months | `audit_logs_archive` |
| 84–84 months (7 yr) | S3 Glacier + indexed metadata |

No auto-delete. Export available for regulators.

### 6.2 `wallet_transactions` / `payment_records`

| Rule | Detail |
|------|--------|
| Retention | 7 years minimum (Uzbekistan tax + platform policy) |
| Mutation | Append-only |
| User purge | Anonymize `user_id` to sentinel UUID; keep amounts |
| Archive | Yearly partition to cold storage after year 2 |

### 6.3 `disputes` + evidence

Retain 7 years — dispute resolution may be legally referenced. Evidence files follow KYC purge rules unless linked to open dispute.

---

## 7. Marketplace content retention

| Entity | Soft-deleted grace | Hard purge |
|--------|-------------------|------------|
| Draft projects/services | 30 days | After grace — hard delete if no orders |
| Published → deleted | 30 days restore window | Then archive slug blocklist |
| Closed projects | 2 years read-only | Then anonymize client reference |
| Reviews | Permanent | Moderation hide only — not delete (trust) |
| Applications (rejected) | 1 year | Hard delete |

---

## 8. Sessions and ephemeral data

| Table | Retention | Job |
|-------|-----------|-----|
| `sessions` | Until `expires_at` | `ishbor.auth.cleanup_sessions` daily 03:00 |
| `otp_verifications` | 24 hours | Same job |
| `idempotency_keys` | 24 hours | Daily purge |
| `password_reset_tokens` | 1 hour | Hourly |
| Redis `ishbor:session:*` | Matches DB expiry | TTL sync on login |

SMS_ARCHITECTURE.md: OTP records deleted after 24h.

---

## 9. Logs and observability

From LOGGING_ARCHITECTURE.md:

| Log type | Destination | Retention |
|----------|-------------|-----------|
| Access logs (nginx) | Loki | 30 days |
| Application (structlog) | Loki | 90 days |
| Error (Sentry) | Sentry cloud | 90 days |
| Payment debug | Never logged | PCI — metadata only |
| Audit | PostgreSQL audit_logs | 7 years |

Request IDs correlate Loki ↔ Sentry ↔ audit_logs metadata for incident response.

---

## 10. Backups vs retention

DATABASE_BACKUP_STRATEGY.md:

| Backup type | Retention |
|-------------|-----------|
| Daily pg_dump | 30 days |
| WAL archiving (PITR) | 7 days window |
| Monthly offsite | 12 months |

Backups contain full DB including not-yet-purged deleted data — encrypt at rest, restrict access.

---

## 11. User rights (GDPR-style)

### 11.1 Right to access

```
POST /api/v1/users/me/export
→ Async job generates ZIP within 72h
→ Contains: profile, orders, wallet tx, messages (last 3 years), applications
→ Notification when ready; link expires 7 days
```

### 11.2 Right to erasure

```
POST /api/v1/users/me/delete-request
→ 14-day cooling-off (email confirm)
→ ishbor.compliance.anonymize_user
→ 30-day soft phase
→ ishbor.compliance.purge_user (hard delete eligible rows)
```

**Exceptions (retain anonymized):**

- Financial records 7 years
- Disputes involving other party
- Reviews on completed orders (anonymized reviewer)

### 11.3 Right to restrict processing

`account_status = suspended` + `processing_restricted = true` — no marketing, no analytics, no job alerts.

---

## 12. Admin configuration

`system_config` table (future):

| Key | Default | Description |
|-----|---------|-------------|
| `retention.messages_years` | 3 | Message body retention |
| `retention.analytics_months` | 24 | Hot analytics |
| `retention.kyc_rejected_days` | 365 | Rejected doc purge |
| `retention.gdpr_grace_days` | 30 | Pre-purge window |

Changes require `super_admin` + audit log.

---

## 13. Celery jobs summary

| Job | Schedule | Retention action |
|-----|----------|------------------|
| `ishbor.auth.cleanup_sessions` | Daily 03:00 | Sessions, OTP |
| `ishbor.analytics.archive_partition` | Monthly 1st 04:00 | Drop old partitions |
| `ishbor.compliance.purge_kyc_documents` | Daily 05:00 | Rejected KYC |
| `ishbor.compliance.purge_soft_deleted` | Weekly | Files + drafts > 30d |
| `ishbor.compliance.purge_user` | On schedule | GDPR final purge |
| `ishbor.audit.archive_old` | Monthly | Move to archive table |

Full schedule: [CRON_JOBS.md](../fastapi/CRON_JOBS.md).

---

## 14. Compliance checklist

| Requirement | Status |
|-------------|--------|
| Financial 7-year hold | wallet_tx + audit |
| User export API | Spec'd §11.1 |
| User delete flow | Spec'd §11.2 |
| Analytics opt-out | Spec'd §4.3 |
| KYC limited retention | Spec'd §5 |
| Message retention documented | Spec'd §3 |
| Backup encryption | BACKUP_STRATEGY.md |

---

## 15. Related documents

- [SOFT_DELETE_STRATEGY.md](./SOFT_DELETE_STRATEGY.md)
- [AUDIT_TRAIL_STRATEGY.md](./AUDIT_TRAIL_STRATEGY.md)
- [FILE_STORAGE_ARCHITECTURE.md](../minio/FILE_STORAGE_ARCHITECTURE.md)
- [SECURITY_ARCHITECTURE.md](../SECURITY_ARCHITECTURE.md)
- [DATABASE_BACKUP_STRATEGY.md](./DATABASE_BACKUP_STRATEGY.md)
- [MESSAGES.md](../../13-domains/MESSAGES.md)

---

*Financial and audit data: 7 years immutable. Analytics: 24 months hot then rollup. Messages: 3 years with soft-delete tombstones. KYC: purge rejected after 1 year, approved after account close + 5 years.*
