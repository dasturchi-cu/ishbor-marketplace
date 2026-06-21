# QUERY_OPTIMIZATION.md

**Engine:** PostgreSQL 16 on VPS  
**Application:** FastAPI (SQLAlchemy 2.x async)  
**Tooling:** `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)`  
**Demo users:** sardor `11111111-1111-4111-8111-000000000001`, nargiza `22222222-2222-4222-8222-000000000002`

---

## 1. Methodology

1. Capture query from SQLAlchemy echo log or `pg_stat_statements`
2. Run `EXPLAIN (ANALYZE, BUFFERS)` on staging with production-like row counts
3. Target: Index Scan or Bitmap Index Scan — avoid Seq Scan on tables >10k rows
4. Fix: index, rewrite query, or partition prune
5. Re-run and attach plan to PR if >50ms regression

**Uzbek errors** are returned by FastAPI, not PostgreSQL — optimize silently; user never sees query plans.

---

## 2. Hot query: wallet balance

**Endpoint:** `GET /api/v1/wallet`  
**Frequency:** Every wallet page load + post-checkout refresh  
**Requirement:** Primary DB, no cache

### 2.1 Query

```sql
SELECT
    w.user_id,
    w.available,
    w.escrow_held,
    w.pending,
    w.lifetime_earned,
    w.currency,
    w.updated_at
FROM wallets w
WHERE w.user_id = '11111111-1111-4111-8111-000000000001';
```

### 2.2 Expected plan

```
Index Scan using wallets_pkey on wallets w
  Index Cond: (user_id = '11111111-...'::uuid)
  Buffers: shared hit=2
  Execution Time: 0.08 ms
```

### 2.3 Transaction history (paginated)

```sql
SELECT id, kind, category, label, amount, running_balance, status, created_at
FROM wallet_transactions
WHERE user_id = '11111111-1111-4111-8111-000000000001'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

**Expected plan:**

```
Index Scan Backward using idx_wallet_tx_user_created on wallet_transactions
  Index Cond: (user_id = '11111111-...'::uuid)
  Execution Time: 0.5–2 ms (up to 500 ms at 100k tx without index)
```

### 2.4 Anti-pattern

```sql
-- BAD: computes balance from ledger every request
SELECT SUM(CASE WHEN kind IN ('in','escrow_release') THEN amount ELSE -amount END)
FROM wallet_transactions WHERE user_id = $1;
```

Use `wallets.available` maintained by trigger `update_wallet_on_transaction()`.

---

## 3. Hot query: order list

**Endpoint:** `GET /api/v1/orders?status=in_progress,review`  
**User:** sardor (client) or nargiza (freelancer)

### 3.1 Client order list

```sql
SELECT
    o.id,
    o.title,
    o.status,
    o.progress,
    o.amount,
    o.due_date,
    o.escrow_funded,
    o.created_at,
    fu.full_name AS freelancer_name,
    fu.username AS freelancer_username,
    fu.avatar_hue AS freelancer_hue
FROM orders o
JOIN users fu ON fu.id = o.freelancer_user_id
WHERE o.client_user_id = '11111111-1111-4111-8111-000000000001'
  AND o.status = ANY (ARRAY['in_progress','review']::order_status[])
ORDER BY o.created_at DESC
LIMIT 20;
```

### 3.2 Expected plan

```
Limit
  -> Nested Loop
       -> Index Scan Backward using idx_orders_client on orders o
            Index Cond: (client_user_id = '11111111-...'::uuid AND status = ANY (...))
       -> Index Scan using users_pkey on users fu
  Execution Time: 1–5 ms
```

### 3.3 Freelancer variant

Same structure with `idx_orders_freelancer` and `client_user_id` join swapped.

### 3.4 Optimization notes

- **Do not** `SELECT *` — 12 columns sufficient for list DTO
- Keyset pagination preferred at scale:

```sql
WHERE o.client_user_id = $1
  AND (o.created_at, o.id) < ($cursor_ts, $cursor_id)
ORDER BY o.created_at DESC, o.id DESC
LIMIT 20;
```

- Partial index if status filter always active: discuss at 100k orders — composite index usually sufficient

---

## 4. Hot query: message threads

### 4.1 Inbox list

**Endpoint:** `GET /api/v1/conversations`

```sql
SELECT
    c.id,
    c.project_context,
    c.updated_at,
    cp.pinned,
    cp.archived,
    cp.last_read_at,
    (
        SELECT m.body
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message_preview,
    (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = c.id
          AND m.read_at IS NULL
          AND m.sender_user_id != '11111111-1111-4111-8111-000000000001'
    ) AS unread_count
FROM conversations c
JOIN conversation_participants cp ON cp.conversation_id = c.id
WHERE cp.user_id = '11111111-1111-4111-8111-000000000001'
  AND cp.archived = false
ORDER BY c.updated_at DESC
LIMIT 30;
```

**Optimization:** Replace correlated subqueries with LATERAL join or denormalize `conversations.last_message_at`, `last_message_body`, `unread_count` updated by trigger on `messages` INSERT — target <15ms inbox.

### 4.2 Thread messages (cursor pagination)

**Endpoint:** `GET /api/v1/conversations/{id}/messages?before=`

```sql
SELECT
    m.id,
    m.sender_user_id,
    m.type,
    m.body,
    m.offer_payload,
    m.escrow_payload,
    m.file_id,
    m.read_at,
    m.created_at,
    u.full_name AS sender_name,
    u.avatar_hue AS sender_hue
FROM messages m
JOIN users u ON u.id = m.sender_user_id
WHERE m.conversation_id = 'cccccccc-cccc-4ccc-8ccc-000000000001'
  AND m.created_at < '2026-06-20T10:00:00+00'::timestamptz
ORDER BY m.created_at DESC
LIMIT 50;
```

### 4.3 Expected plan

```
Limit
  -> Nested Loop
       -> Index Scan Backward using idx_messages_conversation_created on messages m
            Index Cond: (conversation_id = 'cccccccc-...'::uuid AND created_at < '2026-06-20...')
       -> Index Scan using users_pkey on users u
  Execution Time: 2–8 ms (50 messages)
```

### 4.4 Mark read batch

```sql
UPDATE messages
SET read_at = now()
WHERE conversation_id = $1
  AND sender_user_id != $2
  AND read_at IS NULL;
```

Use single UPDATE per thread open — index `idx_messages_unread` helps find rows.

---

## 5. Hot query: marketplace search

**Endpoint:** `GET /api/v1/freelancers?q=nargiza&skills=Figma`

### 5.1 Username / name trigram

```sql
SELECT u.id, u.username, u.full_name, u.avatar_hue, u.bio, u.location,
       fs.rating, fs.review_count, fs.level, fs.rate_usd
FROM users u
JOIN freelancer_stats fs ON fs.user_id = u.id
WHERE u.user_type = 'freelancer'
  AND u.account_status = 'active'
  AND (
    u.username ILIKE '%nargiza%'
    OR u.full_name ILIKE '%nargiza%'
  )
ORDER BY fs.rating DESC, fs.review_count DESC
LIMIT 24;
```

**With pg_trgm:**

```
Bitmap Index Scan on idx_users_username_trgm
  OR Index Scan using idx_freelancer_stats_rating
  Execution Time: 5–20 ms
```

Index: `CREATE INDEX idx_users_username_trgm ON users USING gin (username gin_trgm_ops);`

### 5.2 Full-text project search

```sql
SELECT p.id, p.slug, p.title, p.budget, p.category, p.published_at
FROM projects p
WHERE p.status = 'published'
  AND p.admin_status = 'approved'
  AND to_tsvector('simple', p.title || ' ' || p.description) @@ plainto_tsquery('simple', 'fintech dizayn')
ORDER BY p.published_at DESC
LIMIT 20;
```

**Expected plan:**

```
Bitmap Index Scan on idx_projects_search
  Recheck Cond: (to_tsvector(...) @@ plainto_tsquery(...))
  Filter: status = 'published' AND admin_status = 'approved'
  Execution Time: 10–50 ms
```

### 5.3 Skill array filter

```sql
SELECT u.id, u.username, fs.rating
FROM users u
JOIN user_profiles up ON up.user_id = u.id
JOIN freelancer_stats fs ON fs.user_id = u.id
WHERE u.user_type = 'freelancer'
  AND u.account_status = 'active'
  AND up.skills @> ARRAY['Figma','Branding']::text[]
ORDER BY fs.rating DESC
LIMIT 24;
```

Uses `idx_user_profiles_skills` GIN — `Bitmap Index Scan`.

### 5.4 Scale path

At >100ms p95 on FTS: export to Meilisearch — PostgreSQL remains source of truth, search index async via BullMQ on publish events.

---

## 6. Hot query: notifications unread count

```sql
SELECT COUNT(*)
FROM notifications
WHERE user_id = '22222222-2222-4222-8222-000000000002'
  AND read = false;
```

**Expected plan:**

```
Index Only Scan using idx_notifications_user_unread on notifications
  Index Cond: (user_id = '22222222-...'::uuid)
  Execution Time: <1 ms
```

Badge poll every 30s via WebSocket preferred over repeated COUNT — push delta on insert.

---

## 7. Hot query: escrow status (order detail)

```sql
SELECT
    e.id,
    e.amount,
    e.status,
    e.frozen_by_admin,
    json_agg(
        json_build_object('label', em.label, 'amount', em.amount, 'status', em.status)
        ORDER BY em.id
    ) AS milestones
FROM escrow_workflows e
LEFT JOIN escrow_milestones em ON em.escrow_id = e.id
WHERE e.order_id = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001'
GROUP BY e.id;
```

**Expected:** Index Scan on `idx_escrow_order_id` (unique) — <3ms.

---

## 8. Common regressions & fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Seq Scan on `messages` | Missing `conversation_id` in WHERE | Always filter by conversation |
| Sort step on orders | Wrong index column order | `(user_id, status, created_at DESC)` |
| High buffer reads on search | `ILIKE '%term%'` without trgm | Add GIN trgm or FTS |
| N+1 in FastAPI | Lazy load per order | Join or `selectinload()` |
| Lock wait on wallet | Long transaction holding row | Short tx; `SELECT ... FOR UPDATE` only in WalletService |
| Partition miss on analytics | No `created_at` range | Add range to all analytics queries |

---

## 9. SQLAlchemy tuning

```python
# Eager load order list participants — one round trip
stmt = (
    select(Order)
    .options(selectinload(Order.freelancer))
    .where(Order.client_user_id == user_id)
    .order_by(Order.created_at.desc())
    .limit(20)
)
```

- Use `asyncpg` prepared statement threshold 0 with PgBouncer transaction pooling
- `execution_options={"postgresql_readonly": True}` for replica reads
- Log queries >100ms to structured log with `request_id`

---

## 10. Verification checklist (staging)

| Query | Target p95 | Index used |
|-------|------------|------------|
| Wallet balance | <10 ms | wallets_pkey |
| Wallet tx page | <25 ms | idx_wallet_tx_user_created |
| Client orders | <25 ms | idx_orders_client |
| Message thread | <30 ms | idx_messages_conversation_created |
| Freelancer search | <100 ms | GIN/trgm |
| Unread notifications | <5 ms | idx_notifications_user_unread |

Run after each migration touching indexed columns.

---

*Indexes defined in [INDEXING_STRATEGY.md](./INDEXING_STRATEGY.md)*
