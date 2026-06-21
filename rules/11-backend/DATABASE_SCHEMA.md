# DATABASE_SCHEMA.md

**Engine:** PostgreSQL 16 on self-managed VPS (NOT Supabase, NOT Neon)  
**Application:** FastAPI + SQLAlchemy 2.x  
**Migrations:** Alembic (`backend/alembic/versions/`)  
**Access control:** Application-level RBAC in FastAPI — no PostgreSQL RLS  
**Extensions:** `pgcrypto`, `pg_trgm` (search), `citext` (email)  
**Convention:** `snake_case`, UUID primary keys (`gen_random_uuid()`), `timestamptz`, soft-delete via `deleted_at` where noted

**PostgreSQL deep-dive docs:** [postgresql/](./postgresql/) — architecture, ERD, indexes, performance, migrations, queries, backup

---

## 1. Entity relationship overview

```
users ──┬── user_profiles ──┬── freelancer_profiles
        │                   └── client_profiles
        ├── oauth_accounts
        ├── sessions
        ├── active_role_preferences
        ├── user_settings
        ├── security_settings
        ├── verification_documents
        ├── payment_methods
        ├── wallets ── wallet_transactions
        ├── credits_wallets ── credit_transactions
        ├── subscriptions ── subscription_usage_monthly
        ├── referrals ── referral_entries
        ├── saved_items
        ├── notifications
        ├── notification_preferences
        ├── job_alerts
        ├── ftue_progress
        │
        ├── projects ── project_attachments ── applications
        ├── services ── service_packages ── service_gallery ── service_faqs
        ├── portfolios ── portfolio_metrics ── portfolio_links
        ├── orders ── order_milestones ── reviews
        ├── escrow_workflows ── escrow_milestones ── escrow_timeline
        ├── disputes
        │
        ├── agency_members ── agencies ── agency_case_studies
        ├── conversations ── conversation_participants ── messages
        │
        └── admin_role_assignments ── audit_logs

analytics_events (append-only)
payment_records (financial audit)
moderation_items
support_tickets ── support_messages
featured_listings
revenue_ledger
files (upload metadata)
ai_usage_logs
search_documents (materialized / denormalized)
```

---

## 2. Core identity

### 2.1 `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | Maps `AuthUser.id` |
| email | citext | UNIQUE NOT NULL | |
| email_verified_at | timestamptz | | |
| phone | varchar(20) | UNIQUE NULL | OTP verify |
| phone_verified_at | timestamptz | | |
| password_hash | varchar(255) | NULL | NULL if OAuth-only |
| full_name | varchar(120) | NOT NULL | |
| user_type | enum('client','freelancer') | NOT NULL | Account type |
| username | varchar(50) | UNIQUE NULL | Freelancers |
| company_slug | varchar(80) | UNIQUE NULL | Clients |
| avatar_hue | smallint | NOT NULL DEFAULT 220 | |
| bio | text | | |
| location | varchar(120) | | |
| is_admin | boolean | NOT NULL DEFAULT false | |
| account_status | enum('active','suspended','banned','pending') | NOT NULL DEFAULT 'active' | Admin enforce |
| verified | boolean | NOT NULL DEFAULT false | Platform badge |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |
| last_active_at | timestamptz | | |

**Indexes:** `idx_users_email`, `idx_users_username`, `idx_users_company_slug`, `idx_users_status`, `idx_users_type`

### 2.2 `oauth_accounts`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users ON DELETE CASCADE |
| provider | enum('google','apple') | NOT NULL |
| provider_user_id | varchar(255) | NOT NULL |
| access_token_enc | text | encrypted |
| refresh_token_enc | text | |
| created_at | timestamptz | |

**UNIQUE:** `(provider, provider_user_id)`

### 2.3 `sessions`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| token_hash | varchar(64) | UNIQUE NOT NULL |
| remember | boolean | DEFAULT false |
| ip_address | inet | |
| user_agent | text | |
| expires_at | timestamptz | NOT NULL |
| created_at | timestamptz | |

**Indexes:** `idx_sessions_user_id`, `idx_sessions_expires_at`

### 2.4 `active_role_preferences`

| Column | Type | Constraints |
|--------|------|-------------|
| user_id | uuid | PK, FK → users |
| active_role | enum('client','freelancer','agency') | NOT NULL |
| updated_at | timestamptz | |

Replaces `ishbor-active-role-{userId}`.

### 2.5 `password_reset_tokens`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| token_hash | varchar(64) | UNIQUE |
| expires_at | timestamptz | |
| used_at | timestamptz | |

### 2.6 `otp_verifications`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users NULL |
| phone | varchar(20) | |
| code_hash | varchar(64) | |
| purpose | enum('register','login','reset') | |
| attempts | smallint | DEFAULT 0 |
| expires_at | timestamptz | |
| verified_at | timestamptz | |

---

## 3. Profiles

### 3.1 `user_profiles`

Onboarding aggregate from `profile-store.ts` / `auth-constants`.

| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | PK, FK → users |
| title | varchar(200) | Freelancer headline |
| skills | text[] | GIN index |
| categories | text[] | GIN index |
| languages | jsonb | `[{language, level}]` |
| availability | jsonb | `{available, hoursPerWeek, timezone, responseTime}` |
| rate_usd | numeric(10,2) | |
| industry | varchar(100) | Client |
| team_size | varchar(50) | Client |
| hiring_goals | text[] | Client |
| onboarding_complete | boolean | DEFAULT false |
| updated_at | timestamptz | |

### 3.2 `client_profiles`

Public company page (`clients.$company`).

| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | PK, FK → users |
| company_name | varchar(200) | |
| slug | varchar(80) | UNIQUE |
| industry | varchar(100) | |
| location | varchar(120) | |
| team_size_label | varchar(50) | |
| website | varchar(255) | |
| spent_total | numeric(14,2) | computed/cached |
| hires_count | integer | |
| bio | text | |
| verified | boolean | |

### 3.3 `client_team_members`

| Column | Type |
|--------|------|
| id | uuid PK |
| client_user_id | uuid FK |
| name | varchar(120) |
| role | varchar(100) |
| avatar_hue | smallint |

### 3.4 `freelancer_stats`

Materialized metrics from `Freelancer` type / `growth-metrics.ts`.

| Column | Type |
|--------|------|
| user_id | uuid PK |
| rating | numeric(3,2) |
| review_count | integer |
| level | enum('top_rated','expert','rising','verified') |
| success_score | smallint |
| completion_rate | smallint |
| on_time_delivery | smallint |
| response_time_label | varchar(30) |
| repeat_clients | integer |
| total_earned | numeric(14,2) |
| jobs_completed | integer |
| identity_verified | boolean |
| business_verified | boolean |
| available | boolean |
| member_since | date |
| updated_at | timestamptz |

---

## 4. Marketplace supply

### 4.1 `projects`

Maps `Project` in `mock-data.ts` + `projects-store.ts`.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| slug | varchar(120) | UNIQUE NOT NULL |
| owner_user_id | uuid | FK → users NOT NULL |
| client_slug | varchar(80) | |
| title | varchar(300) | NOT NULL |
| description | text | NOT NULL |
| budget | numeric(12,2) | |
| budget_type | enum('fixed','hourly') | |
| category | varchar(100) | |
| skills | text[] | GIN |
| duration | varchar(80) | |
| experience_level | enum('entry','intermediate','expert') | |
| scope | text[] | |
| status | enum('draft','published','paused','closed') | DEFAULT 'draft' |
| proposals_count | integer | DEFAULT 0 |
| escrow_protected | boolean | DEFAULT true |
| verified | boolean | DEFAULT false |
| featured | boolean | DEFAULT false |
| featured_until | timestamptz | |
| admin_status | enum('pending','approved','suspended','rejected') | DEFAULT 'approved' |
| created_at | timestamptz | |
| published_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:** `idx_projects_status`, `idx_projects_owner`, `idx_projects_category`, `idx_projects_slug`, GIN `idx_projects_skills`, FTS `idx_projects_search` on `(title, description)`

### 4.2 `project_attachments`

| Column | Type |
|--------|------|
| id | uuid PK |
| project_id | uuid FK |
| file_id | uuid FK → files |
| name | varchar(255) |
| size_bytes | bigint |

### 4.3 `services`

Maps `Service` + `StoredService`.

| Column | Type |
|--------|------|
| id | uuid PK |
| slug | varchar(120) UNIQUE |
| owner_user_id | uuid FK |
| seller_username | varchar(50) |
| title | varchar(300) |
| category | varchar(100) |
| description | text |
| description_extended | text |
| base_price | numeric(12,2) |
| delivery_label | varchar(80) |
| hue | smallint |
| status | enum('draft','published','paused','archived') |
| admin_status | enum('pending','approved','suspended','rejected') |
| in_progress_count | integer DEFAULT 0 |
| queue_position | integer |
| rating | numeric(3,2) |
| review_count | integer |
| created_at | timestamptz |
| updated_at | timestamptz |

### 4.4 `service_packages`

| Column | Type |
|--------|------|
| id | uuid PK |
| service_id | uuid FK |
| tier | enum('essential','premium','enterprise') |
| price | numeric(12,2) |
| delivery | varchar(80) |
| revisions | varchar(20) |
| description | text |
| features | text[] |
| popular | boolean |

**UNIQUE:** `(service_id, tier)`

### 4.5 `service_gallery`, `service_faqs`, `service_included_items`

Standard child tables referencing `service_id`.

### 4.6 `applications` (proposals)

Maps `Application` + `applications-store.ts`.

| Column | Type |
|--------|------|
| id | uuid PK |
| project_id | uuid FK |
| freelancer_user_id | uuid FK |
| cover_note | text |
| proposal_amount | numeric(12,2) |
| delivery_time | varchar(80) |
| status | enum('pending','shortlisted','rejected','accepted') |
| order_id | uuid FK → orders NULL |
| archived | boolean DEFAULT false |
| created_at | timestamptz |

**UNIQUE:** `(project_id, freelancer_user_id)` — one proposal per freelancer per project

### 4.7 `portfolios`

Maps `PortfolioItem` in `portfolio-types.ts`.

| Column | Type |
|--------|------|
| id | uuid PK |
| slug | varchar(120) UNIQUE |
| owner_user_id | uuid FK |
| freelancer_username | varchar(50) |
| title | varchar(300) |
| category | varchar(100) |
| description | text |
| objectives | text |
| challenges | text |
| solutions | text |
| skills | text[] |
| technologies | text[] |
| client_name | varchar(200) |
| duration | varchar(80) |
| team_size | varchar(50) |
| budget_range | varchar(80) |
| completion_date | date |
| cover_file_id | uuid FK → files |
| video_url | varchar(500) |
| case_study | jsonb |
| outcomes | text |
| hue | smallint |
| status | enum('draft','published','archived') |
| admin_status | enum('pending','approved','rejected','hidden','featured') |
| featured | boolean |
| featured_until | timestamptz |
| view_count | integer DEFAULT 0 |
| created_at | timestamptz |
| updated_at | timestamptz |

### 4.8 `portfolio_gallery`, `portfolio_metrics`, `portfolio_links`

Child tables for gallery images (file_id FK), metrics, external links.

---

## 5. Commerce

### 5.1 `orders`

Maps `Order` + `orders-store.ts`.

| Column | Type |
|--------|------|
| id | uuid PK |
| title | varchar(300) |
| client_user_id | uuid FK |
| freelancer_user_id | uuid FK |
| service_id | uuid FK NULL |
| project_id | uuid FK NULL |
| application_id | uuid FK NULL |
| status | enum('in_progress','review','revision','completed','disputed','cancelled') |
| progress | smallint DEFAULT 0 |
| amount | numeric(12,2) |
| platform_fee | numeric(12,2) |
| due_date | date |
| escrow_funded | boolean DEFAULT false |
| completed_at | timestamptz |
| created_at | timestamptz |

**Indexes:** `idx_orders_client`, `idx_orders_freelancer`, `idx_orders_status`

### 5.2 `order_milestones`

| Column | Type |
|--------|------|
| id | uuid PK |
| order_id | uuid FK |
| label | varchar(200) |
| amount | numeric(12,2) |
| sort_order | smallint |
| done | boolean DEFAULT false |

### 5.3 `escrow_workflows`

Maps `EscrowWorkflow`.

| Column | Type |
|--------|------|
| id | uuid PK |
| order_id | uuid FK UNIQUE |
| amount | numeric(12,2) |
| status | enum('proposal','accepted','funded','in_progress','delivered','review','released','completed','disputed') |
| frozen_by_admin | boolean DEFAULT false |
| created_at | timestamptz |
| updated_at | timestamptz |

### 5.4 `escrow_milestones`

| Column | Type |
|--------|------|
| id | uuid PK |
| escrow_id | uuid FK |
| label | varchar(200) |
| amount | numeric(12,2) |
| status | enum('pending','funded','released','disputed') |

### 5.5 `escrow_timeline_events`

| Column | Type |
|--------|------|
| id | uuid PK |
| escrow_id | uuid FK |
| step | varchar(200) |
| event_date | date |
| done | boolean |

### 5.6 `disputes`

Maps admin `Dispute`.

| Column | Type |
|--------|------|
| id | uuid PK |
| order_id | uuid FK |
| escrow_id | uuid FK |
| opened_by_user_id | uuid FK |
| reason | text |
| status | enum('open','pending','closed') |
| resolution | jsonb |
| assigned_admin_id | uuid FK NULL |
| opened_at | timestamptz |
| closed_at | timestamptz |

---

## 6. Money

### 6.1 `wallets`

Maps `UserWallet` — **server ledger, never client-writable balance**.

| Column | Type |
|--------|------|
| user_id | uuid PK FK |
| available | numeric(14,2) DEFAULT 0 CHECK (available >= 0) |
| escrow_held | numeric(14,2) DEFAULT 0 |
| pending | numeric(14,2) DEFAULT 0 |
| lifetime_earned | numeric(14,2) DEFAULT 0 |
| currency | char(3) DEFAULT 'USD' |
| updated_at | timestamptz |

### 6.2 `wallet_transactions`

Append-only ledger. Maps `WalletTransaction`.

| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK |
| kind | enum('in','out','fee','escrow_hold','escrow_release') |
| category | enum('deposit','withdrawal','order','escrow','fee','milestone','refund','release') |
| label | varchar(300) |
| reference | varchar(200) |
| amount | numeric(14,2) |
| running_balance | numeric(14,2) |
| status | enum('completed','pending','failed') |
| related_order_id | uuid NULL |
| related_escrow_id | uuid NULL |
| idempotency_key | varchar(64) UNIQUE NULL |
| created_at | timestamptz |

**Index:** `idx_wallet_tx_user_created DESC`

### 6.3 `payment_methods`

| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK |
| type | enum('humo','uzcard','visa','swift') |
| label | varchar(100) |
| last4 | char(4) |
| token_ref | varchar(255) |
| is_default | boolean |
| created_at | timestamptz |

### 6.4 `payment_records`

Admin + gateway audit. Maps `PaymentRecord`.

| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK |
| type | enum('deposit','withdrawal','escrow_transfer','subscription','failed') |
| amount | numeric(14,2) |
| status | enum('completed','pending','failed','held') |
| method | varchar(50) |
| gateway_ref | varchar(255) |
| created_at | timestamptz |

### 6.5 `subscriptions`

Maps `subscription-store.ts` PLANS.

| Column | Type |
|--------|------|
| user_id | uuid PK FK |
| plan | enum('free','pro','elite') |
| status | enum('active','cancelled','past_due') |
| started_at | timestamptz |
| renews_at | timestamptz |
| cancelled_at | timestamptz |

### 6.6 `subscription_usage_monthly`

| Column | Type |
|--------|------|
| user_id | uuid FK |
| month | char(7) | `YYYY-MM` |
| proposals_used | integer DEFAULT 0 |
| PRIMARY KEY (user_id, month) |

### 6.7 `credits_wallets` + `credit_transactions`

Maps `credits-store.ts`. Cap 500 transactions per user (archival job).

### 6.8 `revenue_ledger`

Platform revenue. Maps `revenue-store.ts`. Cap 2000 rows then archive.

### 6.9 `featured_listings`

Maps `featured-listings-store.ts`.

| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK |
| entity_type | enum('service','project','profile') |
| entity_id | uuid |
| credits_spent | numeric(12,2) |
| starts_at | timestamptz |
| ends_at | timestamptz |

---

## 7. Agency

### 7.1 `agencies`

Maps `Agency` in `agency-types.ts`.

| Column | Type |
|--------|------|
| id | uuid PK |
| slug | varchar(120) UNIQUE |
| owner_user_id | uuid FK |
| name | varchar(200) |
| description | text |
| logo_file_id | uuid FK |
| cover_file_id | uuid FK |
| founded_year | smallint |
| team_size | integer |
| specializations | text[] |
| languages | text[] |
| location | varchar(120) |
| website | varchar(255) |
| verification_level | enum('none','verified','premium','enterprise') |
| status | enum('draft','published','archived') |
| created_at | timestamptz |
| updated_at | timestamptz |

### 7.2 `agency_members`

| Column | Type |
|--------|------|
| id | uuid PK |
| agency_id | uuid FK |
| user_id | uuid FK |
| role | enum('owner','manager','recruiter','freelancer') |
| status | enum('active','pending','removed') |
| invited_at | timestamptz |
| joined_at | timestamptz |

**UNIQUE:** `(agency_id, user_id)`

### 7.3 `agency_invites`

| Column | Type |
|--------|------|
| id | uuid PK |
| agency_id | uuid FK |
| email | citext |
| role | enum agency_role |
| token_hash | varchar(64) |
| expires_at | timestamptz |
| accepted_at | timestamptz |

### 7.4 `agency_case_studies`

Maps `AgencyCaseStudy`.

---

## 8. Communication

### 8.1 `conversations`

| Column | Type |
|--------|------|
| id | uuid PK |
| project_context | varchar(300) |
| escrow_amount | numeric(12,2) |
| created_at | timestamptz |
| updated_at | timestamptz |

### 8.2 `conversation_participants`

| Column | Type |
|--------|------|
| conversation_id | uuid FK |
| user_id | uuid FK |
| pinned | boolean |
| archived | boolean |
| last_read_at | timestamptz |
| PRIMARY KEY (conversation_id, user_id) |

### 8.3 `messages`

Maps `ThreadMessage`.

| Column | Type |
|--------|------|
| id | uuid PK |
| conversation_id | uuid FK |
| sender_user_id | uuid FK |
| type | enum('text','offer','escrow','file') |
| body | text |
| offer_payload | jsonb |
| escrow_payload | jsonb |
| file_id | uuid FK |
| read_at | timestamptz |
| created_at | timestamptz |

**Index:** `idx_messages_conversation_created`

### 8.4 `notifications`

Maps `AppNotification`.

| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK |
| kind | enum notification_kind |
| title | varchar(200) |
| body | text |
| priority | enum('low','normal','high') |
| href | varchar(500) |
| read | boolean DEFAULT false |
| created_at | timestamptz |

**Index:** `idx_notifications_user_unread`

### 8.5 `notification_preferences`

Per-channel toggles from settings tab.

---

## 9. Trust & reviews

### 9.1 `reviews`

Maps `Review`.

| Column | Type |
|--------|------|
| id | uuid PK |
| order_id | uuid FK |
| reviewer_user_id | uuid FK |
| reviewee_user_id | uuid FK |
| rating | smallint CHECK 1-5 |
| body | text |
| service_id | uuid NULL |
| created_at | timestamptz |

**UNIQUE:** `(order_id, reviewer_user_id)`

### 9.2 `verification_requests`

Maps admin KYC queue.

| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK |
| type | enum('identity','business','payment') |
| status | enum('pending','approved','rejected') |
| documents | jsonb |
| history | jsonb |
| submitted_at | timestamptz |
| reviewed_at | timestamptz |
| reviewed_by | uuid FK → users |

### 9.3 `saved_items`

Maps `saved-store.ts`.

| Column | Type |
|--------|------|
| user_id | uuid FK |
| entity_type | enum('freelancer','service','project','portfolio') |
| entity_id | varchar(120) |
| created_at | timestamptz |
| PRIMARY KEY (user_id, entity_type, entity_id) |

---

## 10. Admin & ops

### 10.1 `admin_role_assignments`

| Column | Type |
|--------|------|
| user_id | uuid PK FK |
| admin_role | enum('super_admin','finance_admin','support_admin','moderator') |

### 10.2 `audit_logs`

Immutable. Maps `admin-store` audit.

| Column | Type |
|--------|------|
| id | uuid PK |
| actor_user_id | uuid FK |
| category | enum('user','admin','escrow','payment','moderation','system') |
| action | text |
| target_type | varchar(50) |
| target_id | varchar(120) |
| metadata | jsonb |
| ip_address | inet |
| created_at | timestamptz |

**No UPDATE/DELETE** — append only via FastAPI admin/audit service.

### 10.3 `moderation_items`, `support_tickets`, `support_messages`

Maps admin mock types.

### 10.4 `analytics_events`

Append-only. Maps `AnalyticsEvent`. Partition by month. Retain 24 months.

---

## 11. Referrals & growth

### 11.1 `referrals`

| Column | Type |
|--------|------|
| user_id | uuid PK |
| code | varchar(20) UNIQUE |
| credits_balance | numeric(12,2) |
| referred_by_user_id | uuid NULL |

### 11.2 `referral_entries`

| Column | Type |
|--------|------|
| id | uuid PK |
| referrer_user_id | uuid FK |
| referred_user_id | uuid FK UNIQUE |
| status | enum('pending','completed') |
| credited_at | timestamptz |
| created_at | timestamptz |

---

## 12. Files

### 12.1 `files`

| Column | Type |
|--------|------|
| id | uuid PK |
| owner_user_id | uuid FK |
| bucket | varchar(100) |
| key | varchar(500) |
| mime_type | varchar(100) |
| size_bytes | bigint |
| purpose | enum('avatar','portfolio','project_attachment','kyc','message','service_gallery') |
| virus_scan_status | enum('pending','clean','infected') |
| created_at | timestamptz |

---

## 13. AI

### 13.1 `ai_usage_logs`

| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK |
| tool | enum('proposal_assistant','project_generator','portfolio_optimizer','trust_coach','onboarding') |
| tokens_in | integer |
| tokens_out | integer |
| created_at | timestamptz |

---

## 14. Application-level access control (FastAPI RBAC)

Ishbor does **not** use PostgreSQL Row Level Security. All authorization is enforced in the FastAPI service layer per [RBAC_SPECIFICATION.md](./RBAC_SPECIFICATION.md). Repository queries always scope by authenticated user; admin routes require `admin_role_assignments` check.

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| users | self OR public fields via view | registration endpoint | self (limited cols) | admin only |
| projects | public if published; owner all | owner client | owner | owner draft only |
| orders | participant OR admin | checkout service | participant status actions | none |
| escrow_workflows | participant OR admin | escrow service | escrow service | none |
| wallets | owner only | wallet service | wallet service (ledger trigger) | none |
| wallet_transactions | owner read | wallet service insert only | none | none |
| messages | conversation participant | participant | participant (read_at) | none |
| notifications | owner | notification service | owner (read flag) | owner |
| admin tables | admin RBAC | admin RBAC | admin RBAC | admin RBAC |

**Enforcement layers:** session validation → account status gate → platform role → entity ownership → admin section permission. Cross-user ID guessing returns `404` with Uzbek message (e.g. *"Buyurtma topilmadi"*) — not raw permission errors.

**Public read views:** `v_public_freelancers`, `v_public_services`, `v_public_projects`, `v_public_agencies`, `v_public_portfolios` — expose only published, non-suspended entities. Views queried by public FastAPI routes; underlying tables never exposed directly.

---

## 15. Database functions & triggers

| Function | Purpose |
|----------|---------|
| `update_wallet_on_transaction()` | Trigger: adjust wallet.available on wallet_transactions INSERT |
| `increment_proposals_count()` | Trigger on applications INSERT |
| `refresh_freelancer_stats()` | Called on order complete / review |
| `generate_unique_slug(title, table)` | Slug collision handling |
| `enforce_subscription_limits()` | Called before application/service insert |

---

## 16. Migration strategy

Alembic revisions in the FastAPI backend — see [postgresql/MIGRATION_STRATEGY.md](./postgresql/MIGRATION_STRATEGY.md).

```
backend/alembic/versions/
  20260601_001_extensions_and_enums.py
  20260601_002_users_auth.py
  20260601_003_profiles.py
  20260601_004_marketplace_supply.py
  20260601_005_commerce_escrow.py
  20260601_006_wallets_payments.py
  20260601_007_subscriptions_credits.py
  20260601_008_agency.py
  20260601_009_messaging_notifications.py
  20260601_010_reviews_trust.py
  20260601_011_admin_ops.py
  20260601_012_analytics_referrals.py
  20260601_013_files_ai.py
  20260601_014_views_and_search.py
  20260601_015_seed_demo_data.py   # local/staging only — sardor@asaka.uz, nargiza@ishbor.uz
```

Migrations run against VPS PostgreSQL directly on port `5432` as `ishbor_migrate`. Application connects via PgBouncer on `6432`.

---

*Derived from: `mock-data.ts`, `portfolio-types.ts`, `agency-types.ts`, `server/db/schema.ts`, all `*-store.ts`, `admin-mock-data.ts`.*
