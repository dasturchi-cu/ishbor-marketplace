# SOFT_DELETE_STRATEGY.md

**Project:** Ishbor Marketplace  
**Engine:** PostgreSQL 16 · SQLAlchemy 2.x · Alembic  
**Pattern:** `deleted_at TIMESTAMPTZ NULL` — NULL = active, non-NULL = soft-deleted  
**Related:** [TABLE_SPECIFICATIONS.md](./TABLE_SPECIFICATIONS.md), [REPOSITORY_LAYER.md](../fastapi/REPOSITORY_LAYER.md)

---

## 1. Purpose

Ishbor uses soft delete for user-facing entities where:

- Historical references must remain intact (orders, messages, audit)
- Accidental deletion should be recoverable within a grace period
- Public listings must disappear immediately without breaking FK integrity
- GDPR erasure requires a controlled purge path distinct from day-to-day delete

Hard delete is reserved for ephemeral data, join tables, and post-GDPR purge.

**Frontend today:** `deleteProject`, `deleteService` remove rows from localStorage — production replaces with soft delete + async purge.

---

## 2. Column convention

```sql
deleted_at TIMESTAMPTZ NULL DEFAULT NULL
deleted_by UUID NULL REFERENCES users(id)  -- optional, admin/user actor
```

| Value | Meaning |
|-------|---------|
| `NULL` | Active record — visible per status/RBAC rules |
| Non-NULL timestamp | Soft-deleted — hidden from default queries |
| `deleted_by` set | Who initiated delete (user self-serve or admin) |

**Repository rule (mandatory):** All SELECT on soft-deletable tables include `deleted_at IS NULL` unless explicitly querying trash/admin archive.

From REPOSITORY_LAYER.md:

```python
stmt = select(Project).where(
    Project.slug == slug,
    Project.deleted_at.is_(None),
)
```

---

## 3. Tables using soft delete

### 3.1 User & identity

| Table | Soft delete | Public visibility after delete |
|-------|-------------|--------------------------------|
| `users` | Yes | Profile 404; orders/messages anonymized |
| `user_profiles` | Via user cascade | N/A |
| `client_profiles` | Via user cascade | Company page 404 |
| `oauth_accounts` | Hard delete on unlink | N/A |

**Note:** Suspend/ban uses `account_status` enum — not soft delete. Soft delete = account closure request.

### 3.2 Marketplace supply

| Table | Soft delete | Maps store function |
|-------|-------------|---------------------|
| `projects` | Yes | `deleteProject(slug)` → API DELETE |
| `project_attachments` | Via project | Files queued for MinIO purge |
| `services` | Yes | `deleteService(slug)` |
| `service_packages` | Via service | Child rows hidden with parent |
| `service_gallery` | Via service | |
| `service_faqs` | Via service | |
| `portfolios` | Yes | Portfolio archive flow |
| `portfolio_gallery` | Via portfolio | |

Published project/service with active orders **cannot** soft delete — must `paused` or `closed` first.

### 3.3 Commerce (partial)

| Table | Soft delete | Notes |
|-------|-------------|-------|
| `orders` | Yes | Hidden from participant lists; financial records remain |
| `applications` | `archived` boolean | Not `deleted_at` — freelancer withdraws proposal |
| `agencies` | Yes | `status=archived` + `deleted_at` on full removal |

### 3.4 Communication

| Table | Soft delete | Notes |
|-------|-------------|-------|
| `conversations` | Per-participant `archived` | Full delete rare |
| `messages` | Yes (user delete) | Tombstone "Xabar o'chirildi" in UI |
| `notifications` | Hard delete on dismiss | Or `read_at` only |

### 3.5 Trust & saved

| Table | Soft delete |
|-------|-------------|
| `saved_items` | Hard delete (PK composite) |
| `reviews` | No — moderation hides via `admin_status` |

---

## 4. Tables WITHOUT soft delete (immutable / hard delete only)

| Table | Reason |
|-------|--------|
| `wallet_transactions` | Append-only financial ledger |
| `payment_records` | Legal retention |
| `audit_logs` | Append-only — DB trigger blocks UPDATE/DELETE |
| `revenue_ledger` | Financial immutability |
| `escrow_timeline_events` | Audit trail for escrow UI |
| `ledger_entries` | Double-entry accounting |
| `idempotency_keys` | TTL expiry job hard deletes after 24h |
| `sessions` | Hard delete on logout/expiry |
| `otp_verifications` | Hard delete after 24h (SMS_ARCHITECTURE.md) |
| `outbox_events` | Processed rows archived, not soft deleted |

**Rule:** Money and compliance tables never use `deleted_at`. Use status enums and append-only rows.

---

## 5. Hard delete rules

Hard `DELETE FROM` allowed only when:

| Scenario | Tables | Process |
|----------|--------|---------|
| Session cleanup | `sessions` | Celery `ishbor.auth.cleanup_sessions` |
| OTP expiry | `otp_verifications` | Daily cron |
| Idempotency TTL | `idempotency_keys` | Daily cron |
| GDPR purge complete | User subtree | `ishbor.compliance.purge_user` job after 30-day grace |
| Test/staging reset | All | Migration seed only — never production |
| Orphan MinIO object | `files` | After `files.status=deleted` + retention |

**Forbidden in production:**

- Hard delete on `audit_logs`, `wallet_transactions`, `payment_records`
- CASCADE DELETE from `users` to orders (use soft delete + anonymize)

---

## 6. Delete API behavior

### 6.1 User-initiated delete

```
DELETE /api/v1/projects/:slug
DELETE /api/v1/services/:slug
DELETE /api/v1/portfolio/:slug
```

**Guards:**

- Owner only (`isProjectOwner`, `isServiceOwner` → server RBAC)
- No open orders referencing entity
- No funded escrow on derived orders
- Status not blocking (e.g. cannot delete `published` project with pending applications — pause first)

**Effect:**

```sql
UPDATE projects SET
  deleted_at = now(),
  deleted_by = :user_id,
  status = 'closed',
  updated_at = now()
WHERE slug = :slug AND owner_user_id = :user_id AND deleted_at IS NULL;
```

Emit `ProjectDeleted` → search index removal (`ishbor.marketplace.index_project` delete task).

### 6.2 Admin delete / moderation

```
PATCH /api/v1/admin/moderation/:id
→ action: removed
```

Sets `admin_status = 'hidden'` AND optionally `deleted_at` for legal removal. Audit log required:

```json
{
  "category": "moderation",
  "action": "content_removed",
  "entity_type": "project",
  "reason": "Spam — takroriy e'lon"
}
```

---

## 7. Query and index implications

### 7.1 Partial indexes

```sql
CREATE INDEX idx_projects_published_active
  ON projects (category, published_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX idx_services_public
  ON services (category, rating DESC)
  WHERE status = 'published' AND deleted_at IS NULL;
```

### 7.2 Search index

`search_documents` row removed on soft delete — not merely filtered. Re-index on restore.

### 7.3 Unique constraints

Slug uniqueness applies to **active** rows only:

```sql
CREATE UNIQUE INDEX uq_projects_slug_active
  ON projects (slug) WHERE deleted_at IS NULL;
```

Allows same slug reuse after GDPR purge creates new user — rare; prefer never reuse slugs of banned content.

---

## 8. Restore (undelete)

| Actor | Window | Endpoint |
|-------|--------|----------|
| User | 30 days | `POST /api/v1/projects/:slug/restore` |
| Admin | Unlimited | `POST /api/v1/admin/projects/:slug/restore` |

```sql
UPDATE projects SET deleted_at = NULL, deleted_by = NULL, updated_at = now()
WHERE slug = :slug AND deleted_at > now() - interval '30 days';
```

After 30 days, only admin can restore from backup — not self-serve.

---

## 9. GDPR and account deletion

### 9.1 Data subject request flow

1. User: `POST /api/v1/users/me/delete-request`
2. Email confirmation + 14-day cooling-off (configurable)
3. Celery job: `ishbor.compliance.anonymize_user`
4. After 30 days: `ishbor.compliance.purge_user` hard deletes PII

### 9.2 Anonymization (soft phase)

| Field | Action |
|-------|--------|
| `users.email` | Replace with `deleted-{uuid}@ishbor.invalid` |
| `users.full_name` | "O'chirilgan foydalanuvchi" |
| `users.phone` | NULL |
| `users.password_hash` | NULL |
| Avatar files | MinIO purge |
| KYC documents | Immediate MinIO purge |
| Messages body | Replace with NULL, retain metadata |
| Reviews | Keep rating, anonymize reviewer name |

### 9.3 Hard purge (final phase)

Hard delete rows where legal retention allows:

- `saved_items`, `notification_preferences`, draft projects/services
- MinIO objects for user-owned files

**Retain (legal hold):**

- `wallet_transactions`, `payment_records`, `audit_logs` — 7 years
- `orders`, `escrow_workflows`, `disputes` — anonymized participant IDs, keep amounts
- Tax/reporting aggregates in `revenue_ledger`

### 9.4 Export before delete

`GET /api/v1/users/me/export` — JSON bundle per GDPR:

- Profile, orders, messages, wallet tx (no full card numbers)
- Delivered within 72 hours via signed MinIO link

---

## 10. MinIO file lifecycle

Maps FILE_STORAGE_ARCHITECTURE.md:

| Trigger | Action |
|---------|--------|
| Entity soft delete | `files.status = 'pending_delete'` |
| 30 days after soft delete | Celery removes object + hard delete `files` row |
| GDPR immediate | Skip grace — purge KYC/avatar now |
| Account deletion | Queue all user `files` for purge |

---

## 11. Frontend migration

| Store function | Production API |
|----------------|----------------|
| `deleteProject(slug)` | `DELETE /api/v1/projects/:slug` |
| `deleteService(slug)` | `DELETE /api/v1/services/:slug` |
| Hard localStorage remove | Server soft delete; UI removes from list on 204 |

Public catalog queries (`getPublishedProjects`, `getPublishedServices`) — server already filters `deleted_at IS NULL`; client must handle 404 on stale cache.

---

## 12. Monitoring

| Metric | Alert |
|--------|-------|
| Soft-deleted rows pending purge > 30d | Cron backlog |
| GDPR delete queue depth | > 100 pending |
| Restore rate | Anomaly if spike (support issue) |
| Unique slug conflicts on restore | Index violation |

---

## 13. Related documents

- [AUDIT_TRAIL_STRATEGY.md](./AUDIT_TRAIL_STRATEGY.md) — admin delete auditing
- [DATA_RETENTION_POLICY.md](./DATA_RETENTION_POLICY.md) — retention periods
- [FILE_STORAGE_ARCHITECTURE.md](../minio/FILE_STORAGE_ARCHITECTURE.md) — object purge
- [AUDIT_LOG_SYSTEM.md](../security/AUDIT_LOG_SYSTEM.md) — immutable audit
- [REPOSITORY_LAYER.md](../fastapi/REPOSITORY_LAYER.md) — query filters

---

*Soft delete via `deleted_at` applies to marketplace and user content. Financial, audit, and ledger tables are append-only. GDPR uses anonymize → hard purge with legal retention exceptions.*
