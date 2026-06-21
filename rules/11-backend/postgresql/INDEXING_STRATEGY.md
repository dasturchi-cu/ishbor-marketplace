# INDEXING_STRATEGY.md

**Engine:** PostgreSQL 16 on VPS  
**Application:** FastAPI + SQLAlchemy  
**Scale target:** 100k users, 500k messages/day  
**Parent:** [TABLE_SPECIFICATIONS.md](./TABLE_SPECIFICATIONS.md)

---

## 1. Principles

1. **Index every FK column** used in JOINs or CASCADE deletes
2. **Composite indexes** match exact `WHERE` + `ORDER BY` from FastAPI repository queries
3. **Partial indexes** reduce size for filtered subsets (published, unread, active)
4. **GIN indexes** for arrays, JSONB, and full-text search
5. **Avoid over-indexing** write-heavy append tables — balance insert cost
6. **Monitor** via `pg_stat_user_indexes` — drop indexes with `idx_scan = 0` after 30 days

---

## 2. `users`

| Index | Type | Definition | Rationale |
|-------|------|------------|-----------|
| `users_pkey` | btree | `(id)` | PK — session lookup |
| `idx_users_email` | btree | `(email)` | Login: `WHERE email = $1` |
| `idx_users_username` | btree | `(username) WHERE username IS NOT NULL` | Partial — freelancer profile URL |
| `idx_users_company_slug` | btree | `(company_slug) WHERE company_slug IS NOT NULL` | Partial — client public page |
| `idx_users_status` | btree | `(account_status)` | Admin user list filter |
| `idx_users_type` | btree | `(user_type, account_status)` | Marketplace browse filters |
| `idx_users_last_active` | btree | `(last_active_at DESC NULLS LAST)` | Admin inactive user report |

**Login hot path:** `idx_users_email` — unique, single row fetch.

---

## 3. Auth tables

### `sessions`

| Index | Definition | Rationale |
|-------|------------|-----------|
| `idx_sessions_token_hash` | UNIQUE `(token_hash)` | Cookie validation every request |
| `idx_sessions_user_id` | `(user_id)` | Logout all devices |
| `idx_sessions_expires_at` | `(expires_at) WHERE expires_at > now()` | Partial — cleanup job |

### `oauth_accounts`

| Index | Definition |
|-------|------------|
| `uq_oauth_provider_user` | UNIQUE `(provider, provider_user_id)` |
| `idx_oauth_user_id` | `(user_id)` |

### `password_reset_tokens` / `otp_verifications`

| Index | Definition |
|-------|------------|
| `idx_reset_token_hash` | UNIQUE `(token_hash)` |
| `idx_otp_phone_purpose` | `(phone, purpose, expires_at)` |

---

## 4. Profiles

### `user_profiles`

| Index | Type | Definition |
|-------|------|------------|
| `idx_user_profiles_skills` | GIN | `(skills)` |
| `idx_user_profiles_categories` | GIN | `(categories)` |
| `idx_user_profiles_rate` | btree | `(rate_usd) WHERE rate_usd IS NOT NULL` |

Freelancer search: `skills @> ARRAY['Figma']` uses GIN.

### `client_profiles`

| Index | Definition |
|-------|------------|
| `idx_client_profiles_slug` | UNIQUE `(slug)` |

### `freelancer_stats`

| Index | Definition | Rationale |
|-------|------------|-----------|
| `idx_freelancer_stats_rating` | `(rating DESC, review_count DESC)` | Browse sort default |
| `idx_freelancer_stats_level` | `(level, success_score DESC)` | Filter Top Rated |
| `idx_freelancer_stats_available` | `(available, rating DESC) WHERE available = true` | Partial — hire now |

---

## 5. Marketplace supply

### `projects`

| Index | Type | Definition | Rationale |
|-------|------|------------|-----------|
| `idx_projects_slug` | btree | UNIQUE `(slug)` | Detail page |
| `idx_projects_owner` | btree | `(owner_user_id, status)` | Client dashboard |
| `idx_projects_status` | btree | `(status, admin_status, published_at DESC)` | Public listing |
| `idx_projects_category` | btree | `(category, status)` | Category filter |
| `idx_projects_skills` | GIN | `(skills)` | Skill filter |
| `idx_projects_search` | GIN | `to_tsvector('simple', title \|\| ' ' \|\| description)` | FTS — Uzbek/simple config |
| `idx_projects_featured` | partial | `(featured_until DESC) WHERE featured = true AND status = 'published'` | Homepage featured |

### `services`

| Index | Definition |
|-------|------------|
| `idx_services_slug` | UNIQUE `(slug)` |
| `idx_services_owner` | `(owner_user_id, status)` |
| `idx_services_category_status` | `(category, status, admin_status)` |
| `idx_services_seller_username` | `(seller_username)` |
| `idx_services_search` | GIN tsvector on title + description |
| `idx_services_price` | `(base_price) WHERE status = 'published'` |

### `applications`

| Index | Definition | Rationale |
|-------|------------|-----------|
| `uq_application_project_freelancer` | UNIQUE `(project_id, freelancer_user_id)` | One proposal rule |
| `idx_applications_project_status` | `(project_id, status, created_at DESC)` | Client proposal inbox |
| `idx_applications_freelancer` | `(freelancer_user_id, archived, created_at DESC)` | Freelancer applications tab |

### `portfolios`

| Index | Definition |
|-------|------------|
| `idx_portfolios_slug` | UNIQUE `(slug)` |
| `idx_portfolios_owner` | `(owner_user_id, status)` |
| `idx_portfolios_freelancer_username` | `(freelancer_username)` |

---

## 6. Commerce & escrow

### `orders`

| Index | Definition | Rationale |
|-------|------------|-----------|
| `idx_orders_client` | `(client_user_id, status, created_at DESC)` | **Hot:** client order list |
| `idx_orders_freelancer` | `(freelancer_user_id, status, created_at DESC)` | **Hot:** freelancer order list |
| `idx_orders_status` | `(status, created_at DESC)` | Admin queue |
| `idx_orders_due_date` | `(due_date) WHERE status IN ('in_progress','review')` | Overdue alerts |
| `idx_orders_service` | `(service_id) WHERE service_id IS NOT NULL` | Service order history |
| `idx_orders_project` | `(project_id) WHERE project_id IS NOT NULL` | Project hire chain |

**Composite rationale:** Client dashboard query:

```sql
SELECT * FROM orders
WHERE client_user_id = $1 AND status = ANY($2)
ORDER BY created_at DESC LIMIT 20;
```

→ `idx_orders_client` covers filter + sort without sort step.

### `escrow_workflows`

| Index | Definition |
|-------|------------|
| `idx_escrow_order_id` | UNIQUE `(order_id)` |
| `idx_escrow_status` | `(status, updated_at DESC)` |
| `idx_escrow_frozen` | `(frozen_by_admin) WHERE frozen_by_admin = true` |

### `disputes`

| Index | Definition |
|-------|------------|
| `idx_disputes_status` | `(status, opened_at DESC)` |
| `idx_disputes_assigned_admin` | `(assigned_admin_id) WHERE status != 'closed'` |

---

## 7. Wallet & payments

### `wallets`

PK on `user_id` — no additional index needed for balance fetch.

### `wallet_transactions`

| Index | Definition | Rationale |
|-------|------------|-----------|
| `idx_wallet_tx_user_created` | `(user_id, created_at DESC)` | **Hot:** transaction history pagination |
| `idx_wallet_tx_idempotency` | UNIQUE `(idempotency_key) WHERE idempotency_key IS NOT NULL` | Duplicate payment prevention |
| `idx_wallet_tx_order` | `(related_order_id) WHERE related_order_id IS NOT NULL` | Order audit trail |
| `idx_wallet_tx_status_pending` | partial `(user_id, created_at) WHERE status = 'pending'` | Pending tx cleanup |

### `payment_records`

| Index | Definition |
|-------|------------|
| `idx_payment_records_user` | `(user_id, created_at DESC)` |
| `idx_payment_records_gateway_ref` | `(gateway_ref)` |
| `idx_payment_records_status` | `(status, created_at DESC)` |

---

## 8. Messaging & notifications

### `conversation_participants`

| Index | Definition | Rationale |
|-------|------------|-----------|
| `idx_conv_part_user` | `(user_id, archived, conversation_id)` | **Hot:** inbox list for user |
| `idx_conv_part_unread` | partial `(user_id) WHERE archived = false` | Active threads |

### `conversations`

| Index | Definition |
|-------|------------|
| `idx_conversations_updated` | `(updated_at DESC)` | Sort threads by activity |

### `messages`

| Index | Definition | Rationale |
|-------|------------|-----------|
| `idx_messages_conversation_created` | `(conversation_id, created_at DESC)` | **Hot:** thread pagination |
| `idx_messages_sender` | `(sender_user_id, created_at DESC)` | Abuse investigation |
| `idx_messages_unread` | partial `(conversation_id, created_at) WHERE read_at IS NULL` | Unread badge count |

**Thread query pattern:**

```sql
SELECT * FROM messages
WHERE conversation_id = $1 AND created_at < $2
ORDER BY created_at DESC LIMIT 50;
```

Index scan + backward index-only possible with `idx_messages_conversation_created`.

### `notifications`

| Index | Definition | Rationale |
|-------|------------|-----------|
| `idx_notifications_user_unread` | `(user_id, created_at DESC) WHERE read = false` | **Hot:** unread bell |
| `idx_notifications_user_all` | `(user_id, created_at DESC)` | Full notification list |
| `idx_notifications_priority` | partial `(user_id) WHERE priority = 'high' AND read = false` | Push priority |

---

## 9. Agency

| Table | Index |
|-------|-------|
| `agencies` | UNIQUE `(slug)`; `(owner_user_id)`; `(status, verification_level)` |
| `agency_members` | UNIQUE `(agency_id, user_id)`; `(user_id, status)` |
| `agency_invites` | `(agency_id, email)`; `(token_hash)` |

---

## 10. Admin & analytics

### `audit_logs`

| Index | Definition |
|-------|------------|
| `idx_audit_created` | `(created_at DESC)` |
| `idx_audit_actor` | `(actor_user_id, created_at DESC)` |
| `idx_audit_category` | `(category, created_at DESC)` |
| `idx_audit_target` | `(target_type, target_id)` |

### `analytics_events` (partitioned)

Per-partition indexes:

| Index | Definition |
|-------|------------|
| `idx_analytics_user_time` | `(user_id, created_at DESC)` |
| `idx_analytics_event_type` | `(event_type, created_at DESC)` |
| `idx_analytics_session` | `(session_id, created_at)` |

### `search_documents`

| Index | Type | Definition |
|-------|------|------------|
| `idx_search_docs_fts` | GIN | `(document tsvector)` |
| `idx_search_docs_entity` | btree | `(entity_type, entity_id)` UNIQUE |

---

## 11. Index maintenance

| Task | Schedule |
|------|----------|
| `REINDEX` bloated indexes | When `pg_stat_user_indexes.idx_scan` high but page reads spike |
| Update statistics | `ANALYZE` after bulk seed/migration |
| Monitor bloat | `pgstattuple` monthly on `messages`, `wallet_transactions` |
| New index rollout | `CREATE INDEX CONCURRENTLY` in production |

**Fillfactor:**

| Table | fillfactor | Why |
|-------|------------|-----|
| `messages` | 90 | Frequent INSERT, occasional `read_at` UPDATE |
| `notifications` | 90 | Mark-read updates |
| `wallets` | 70 | Frequent balance UPDATE — leave HOT room |
| Append-only tables | 100 | No updates |

---

## 12. Index budget at 100k users

| Table | Est. rows | Index size (order) |
|-------|-----------|-------------------|
| users | 100k | ~50 MB |
| messages | 50M | ~8 GB indexes |
| wallet_transactions | 5M | ~2 GB |
| notifications | 20M | ~4 GB |
| orders | 2M | ~500 MB |

Total index footprint target: <30% of disk — monitor and partition before reindex windows exceed maintenance slot.

---

*Query plans: [QUERY_OPTIMIZATION.md](./QUERY_OPTIMIZATION.md)*
