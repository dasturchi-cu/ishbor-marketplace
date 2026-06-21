# TABLE_SPECIFICATIONS.md

**Engine:** PostgreSQL 16 (VPS)  
**ORM:** SQLAlchemy 2.x (FastAPI)  
**Migrations:** Alembic  
**Convention:** `snake_case`, UUID PKs (`gen_random_uuid()`), `timestamptz`, Uzbek API errors (not DB messages)

**Demo UUID mapping (stable seed):**

| Legacy frontend ID | PostgreSQL UUID | Email |
|--------------------|-----------------|-------|
| `u-client-1` | `11111111-1111-4111-8111-000000000001` | sardor@asaka.uz |
| `u-freelancer-1` | `22222222-2222-4222-8222-000000000002` | nargiza@ishbor.uz |
| `u-admin-1` | `33333333-3333-4333-8333-000000000003` | admin@ishbor.uz |

---

## 1. Enums (PostgreSQL `CREATE TYPE`)

| Enum | Values |
|------|--------|
| `user_type` | `client`, `freelancer` |
| `account_status` | `active`, `suspended`, `banned`, `pending` |
| `active_role` | `client`, `freelancer`, `agency` |
| `oauth_provider` | `google`, `apple` |
| `otp_purpose` | `register`, `login`, `reset` |
| `project_status` | `draft`, `published`, `paused`, `closed` |
| `project_budget_type` | `fixed`, `hourly` |
| `experience_level` | `entry`, `intermediate`, `expert` |
| `admin_content_status` | `pending`, `approved`, `suspended`, `rejected`, `hidden`, `featured` |
| `service_status` | `draft`, `published`, `paused`, `archived` |
| `package_tier` | `essential`, `premium`, `enterprise` |
| `application_status` | `pending`, `shortlisted`, `rejected`, `accepted` |
| `portfolio_status` | `draft`, `published`, `archived` |
| `order_status` | `in_progress`, `review`, `revision`, `completed`, `disputed`, `cancelled` |
| `escrow_status` | `proposal`, `accepted`, `funded`, `in_progress`, `delivered`, `review`, `released`, `completed`, `disputed` |
| `escrow_milestone_status` | `pending`, `funded`, `released`, `disputed` |
| `dispute_status` | `open`, `pending`, `closed` |
| `wallet_tx_kind` | `in`, `out`, `fee`, `escrow_hold`, `escrow_release` |
| `wallet_tx_category` | `deposit`, `withdrawal`, `order`, `escrow`, `fee`, `milestone`, `refund`, `release` |
| `wallet_tx_status` | `completed`, `pending`, `failed` |
| `payment_method_type` | `humo`, `uzcard`, `visa`, `swift` |
| `payment_record_type` | `deposit`, `withdrawal`, `escrow_transfer`, `subscription`, `failed` |
| `payment_record_status` | `completed`, `pending`, `failed`, `held` |
| `subscription_plan` | `free`, `pro`, `elite` |
| `subscription_status` | `active`, `cancelled`, `past_due` |
| `freelancer_level` | `top_rated`, `expert`, `rising`, `verified` |
| `agency_role` | `owner`, `manager`, `recruiter`, `freelancer` |
| `agency_member_status` | `active`, `pending`, `removed` |
| `agency_verification_level` | `none`, `verified`, `premium`, `enterprise` |
| `agency_status` | `draft`, `published`, `archived` |
| `message_type` | `text`, `offer`, `escrow`, `file` |
| `notification_priority` | `low`, `normal`, `high` |
| `verification_type` | `identity`, `business`, `payment` |
| `verification_status` | `pending`, `approved`, `rejected` |
| `saved_entity_type` | `freelancer`, `service`, `project`, `portfolio` |
| `featured_entity_type` | `service`, `project`, `profile` |
| `admin_role` | `super_admin`, `finance_admin`, `support_admin`, `moderator` |
| `audit_category` | `user`, `admin`, `escrow`, `payment`, `moderation`, `system` |
| `file_purpose` | `avatar`, `portfolio`, `project_attachment`, `kyc`, `message`, `service_gallery` |
| `virus_scan_status` | `pending`, `clean`, `infected` |
| `ai_tool` | `proposal_assistant`, `project_generator`, `portfolio_optimizer`, `trust_coach`, `onboarding` |
| `referral_entry_status` | `pending`, `completed` |

---

## 2. Core identity

### 2.1 `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| email | citext | NOT NULL, UNIQUE | Normalized lowercase |
| email_verified_at | timestamptz | NULL | |
| phone | varchar(20) | UNIQUE NULL | |
| phone_verified_at | timestamptz | NULL | |
| password_hash | varchar(255) | NULL | bcrypt; NULL if OAuth-only |
| full_name | varchar(120) | NOT NULL | |
| user_type | user_type | NOT NULL | Permanent at registration |
| username | varchar(50) | UNIQUE NULL | Freelancers |
| company_slug | varchar(80) | UNIQUE NULL | Clients — `/clients/{slug}` |
| avatar_hue | smallint | NOT NULL DEFAULT 220 | |
| bio | text | | |
| location | varchar(120) | | |
| is_admin | boolean | NOT NULL DEFAULT false | |
| account_status | account_status | NOT NULL DEFAULT 'active' | |
| verified | boolean | NOT NULL DEFAULT false | Platform badge |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |
| last_active_at | timestamptz | NULL | |

**Example rows:**

| id | email | full_name | user_type | username | company_slug | avatar_hue | verified |
|----|-------|-----------|-----------|----------|--------------|------------|----------|
| `11111111-…-000001` | sardor@asaka.uz | Sardor Mirkomilov | client | NULL | asaka-capital | 215 | true |
| `22222222-…-000002` | nargiza@ishbor.uz | Nargiza Akhmedova | freelancer | nargiza | NULL | 250 | true |

### 2.2 `oauth_accounts`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users ON DELETE CASCADE |
| provider | oauth_provider | NOT NULL |
| provider_user_id | varchar(255) | NOT NULL |
| access_token_enc | text | encrypted at app layer |
| refresh_token_enc | text | |
| created_at | timestamptz | DEFAULT now() |

**UNIQUE:** `(provider, provider_user_id)`

### 2.3 `sessions`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users ON DELETE CASCADE |
| token_hash | varchar(64) | UNIQUE NOT NULL |
| remember | boolean | DEFAULT false |
| ip_address | inet | |
| user_agent | text | |
| expires_at | timestamptz | NOT NULL |
| created_at | timestamptz | DEFAULT now() |

### 2.4 `active_role_preferences`

| Column | Type | Constraints |
|--------|------|-------------|
| user_id | uuid | PK, FK → users |
| active_role | active_role | NOT NULL |
| updated_at | timestamptz | DEFAULT now() |

**Demo:** sardor → `client`; nargiza → `freelancer`

### 2.5 `password_reset_tokens` / 2.6 `otp_verifications`

Standard auth support tables per [AUTH_ARCHITECTURE.md](../AUTH_ARCHITECTURE.md). OTP max 5 attempts; expired OTP returns API error *"Tasdiqlash kodi muddati tugagan"*.

---

## 3. Profiles

### 3.1 `user_profiles`

| Column | Type | Constraints |
|--------|------|-------------|
| user_id | uuid | PK, FK → users |
| title | varchar(200) | |
| skills | text[] | DEFAULT '{}' |
| categories | text[] | DEFAULT '{}' |
| languages | jsonb | DEFAULT '[]' |
| availability | jsonb | DEFAULT '{}' |
| rate_usd | numeric(10,2) | |
| industry | varchar(100) | Client field |
| team_size | varchar(50) | |
| hiring_goals | text[] | DEFAULT '{}' |
| onboarding_complete | boolean | DEFAULT false |
| updated_at | timestamptz | |

**Demo nargiza:** `title='Katta brend strategi va UI dizayner'`, `skills={Branding,Figma,Webflow}`, `rate_usd=45.00`

**Demo sardor:** `industry='Fintech'`, `team_size='50-200'`, `hiring_goals={Dizayn,Dasturlash}`

### 3.2 `client_profiles`

| Column | Type | Constraints |
|--------|------|-------------|
| user_id | uuid | PK, FK → users |
| company_name | varchar(200) | |
| slug | varchar(80) | UNIQUE |
| industry | varchar(100) | |
| location | varchar(120) | |
| team_size_label | varchar(50) | |
| website | varchar(255) | |
| spent_total | numeric(14,2) | cached aggregate |
| hires_count | integer | DEFAULT 0 |
| bio | text | |
| verified | boolean | DEFAULT false |

**Demo sardor:** `company_name='Asaka Capital'`, `slug='asaka-capital'`, `spent_total=48200.00`, `hires_count=12`

### 3.3 `client_team_members`

Child of client profile — `client_user_id` FK, display-only team on public page.

### 3.4 `freelancer_stats`

Materialized/cached metrics (refreshed by job or trigger):

| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | PK, FK → users |
| rating | numeric(3,2) | |
| review_count | integer | |
| level | freelancer_level | |
| success_score | smallint | 0–100 |
| completion_rate | smallint | |
| on_time_delivery | smallint | |
| response_time_label | varchar(30) | e.g. `< 30m` |
| repeat_clients | integer | |
| total_earned | numeric(14,2) | |
| jobs_completed | integer | |
| identity_verified | boolean | |
| business_verified | boolean | |
| available | boolean | |
| member_since | date | |
| updated_at | timestamptz | |

**Demo nargiza:** `rating=5.00`, `review_count=184`, `level='top_rated'`, `success_score=98`, `total_earned=184000.00`, `jobs_completed=124`

---

## 4. Marketplace supply

### 4.1 `projects`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| slug | varchar(120) | UNIQUE NOT NULL |
| owner_user_id | uuid | FK → users NOT NULL |
| client_slug | varchar(80) | denormalized |
| title | varchar(300) | NOT NULL |
| description | text | NOT NULL |
| budget | numeric(12,2) | |
| budget_type | project_budget_type | |
| category | varchar(100) | |
| skills | text[] | |
| duration | varchar(80) | |
| experience_level | experience_level | |
| scope | text[] | |
| status | project_status | DEFAULT 'draft' |
| proposals_count | integer | DEFAULT 0 |
| escrow_protected | boolean | DEFAULT true |
| verified | boolean | DEFAULT false |
| featured | boolean | DEFAULT false |
| featured_until | timestamptz | |
| admin_status | admin_content_status | DEFAULT 'approved' |
| created_at | timestamptz | |
| published_at | timestamptz | |
| updated_at | timestamptz | |

**Demo:** sardor owns project `fintech-app-redesign` — budget $15,000, status `published`

### 4.2 `project_attachments`

`project_id` FK, `file_id` FK → `files`, `name`, `size_bytes`

### 4.3 `services`

| Column | Type | Key constraints |
|--------|------|-----------------|
| id | uuid | PK |
| slug | varchar(120) | UNIQUE |
| owner_user_id | uuid | FK → users |
| seller_username | varchar(50) | denormalized |
| title | varchar(300) | |
| category | varchar(100) | |
| description | text | |
| description_extended | text | |
| base_price | numeric(12,2) | |
| delivery_label | varchar(80) | |
| hue | smallint | |
| status | service_status | |
| admin_status | admin_content_status | |
| in_progress_count | integer | DEFAULT 0 |
| queue_position | integer | |
| rating | numeric(3,2) | |
| review_count | integer | |
| created_at / updated_at | timestamptz | |

**Demo nargiza:** slug `mobile-app-design-fintech`, `base_price=480.00`, status `published`

### 4.4–4.6 Child tables

`service_packages` (UNIQUE `service_id, tier`), `service_gallery`, `service_faqs`, `service_included_items`

### 4.7 `applications`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| project_id | uuid | FK → projects |
| freelancer_user_id | uuid | FK → users |
| cover_note | text | |
| proposal_amount | numeric(12,2) | |
| delivery_time | varchar(80) | |
| status | application_status | DEFAULT 'pending' |
| order_id | uuid | FK → orders NULL |
| archived | boolean | DEFAULT false |
| created_at | timestamptz | |

**UNIQUE:** `(project_id, freelancer_user_id)`

### 4.8 `portfolios` + children

`portfolio_gallery`, `portfolio_metrics`, `portfolio_links` — slug UNIQUE, `owner_user_id` FK

---

## 5. Commerce

### 5.1 `orders`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| title | varchar(300) | |
| client_user_id | uuid | FK → users |
| freelancer_user_id | uuid | FK → users |
| service_id | uuid | FK NULL |
| project_id | uuid | FK NULL |
| application_id | uuid | FK NULL |
| status | order_status | |
| progress | smallint | DEFAULT 0, CHECK 0–100 |
| amount | numeric(12,2) | |
| platform_fee | numeric(12,2) | |
| due_date | date | |
| escrow_funded | boolean | DEFAULT false |
| completed_at | timestamptz | |
| created_at | timestamptz | |

**Demo order (maps mock `o1`):**

| id | title | client | freelancer | status | amount | escrow_funded |
|----|-------|--------|------------|--------|--------|---------------|
| `aaaaaaaa-…-000001` | Fintech App Redesign — Phase 1 | sardor UUID | nargiza UUID | in_progress | 12000.00 | true |

### 5.2 `order_milestones`

`order_id` FK, `label`, `amount`, `sort_order`, `done` boolean

### 5.3 `escrow_workflows`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| order_id | uuid | FK UNIQUE → orders |
| amount | numeric(12,2) | |
| status | escrow_status | |
| frozen_by_admin | boolean | DEFAULT false |
| created_at / updated_at | timestamptz | |

**Demo:** order o1 escrow — status `in_progress`, amount 12000.00

### 5.4–5.5 `escrow_milestones`, `escrow_timeline_events`

Child tables keyed by `escrow_id`

### 5.6 `disputes`

`order_id`, `escrow_id`, `opened_by_user_id`, `reason`, `status`, `resolution` jsonb, `assigned_admin_id`

---

## 6. Money

### 6.1 `wallets`

| Column | Type | Constraints |
|--------|------|-------------|
| user_id | uuid | PK, FK → users |
| available | numeric(14,2) | DEFAULT 0, CHECK (available >= 0) |
| escrow_held | numeric(14,2) | DEFAULT 0 |
| pending | numeric(14,2) | DEFAULT 0 |
| lifetime_earned | numeric(14,2) | DEFAULT 0 |
| currency | char(3) | DEFAULT 'USD' |
| updated_at | timestamptz | |

**Demo:**

| user | available | escrow_held | lifetime_earned |
|------|-----------|-------------|-----------------|
| sardor | 8420.00 | 12000.00 | 0 |
| nargiza | 3200.00 | 0 | 184000.00 |

### 6.2 `wallet_transactions`

Append-only ledger. **Never UPDATE/DELETE** except archival job.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK |
| kind | wallet_tx_kind | |
| category | wallet_tx_category | |
| label | varchar(300) | |
| reference | varchar(200) | order id, gateway ref |
| amount | numeric(14,2) | |
| running_balance | numeric(14,2) | snapshot after tx |
| status | wallet_tx_status | |
| related_order_id | uuid | NULL |
| related_escrow_id | uuid | NULL |
| idempotency_key | varchar(64) | UNIQUE NULL |
| created_at | timestamptz | |

**Demo sardor tx:** `kind='escrow_hold'`, `amount=-12000`, `label='Fintech App Redesign — Phase 1'`

### 6.3–6.9 Financial tables

`payment_methods`, `payment_records`, `subscriptions`, `subscription_usage_monthly`, `credits_wallets`, `credit_transactions`, `revenue_ledger`, `featured_listings` — per DATABASE_SCHEMA §6. Credits cap 500 tx/user; revenue_ledger cap 2000 rows then archive.

---

## 7. Agency

### 7.1 `agencies`

`slug` UNIQUE, `owner_user_id` FK, `verification_level`, `status`, logo/cover `file_id` FKs

### 7.2 `agency_members`

**UNIQUE:** `(agency_id, user_id)` — roles: owner, manager, recruiter, freelancer

### 7.3 `agency_invites` / 7.4 `agency_case_studies`

Standard invite token + portfolio case studies

---

## 8. Communication

### 8.1 `conversations`

`project_context`, `escrow_amount`, timestamps

### 8.2 `conversation_participants`

**PK:** `(conversation_id, user_id)` — `pinned`, `archived`, `last_read_at`

**Demo:** conversation between sardor + nargiza on "Fintech App Redesign"

### 8.3 `messages`

| Column | Type | |
|--------|------|---|
| id | uuid | PK |
| conversation_id | uuid | FK |
| sender_user_id | uuid | FK |
| type | message_type | |
| body | text | |
| offer_payload | jsonb | |
| escrow_payload | jsonb | |
| file_id | uuid | FK NULL |
| read_at | timestamptz | |
| created_at | timestamptz | |

### 8.4 `notifications` / 8.5 `notification_preferences`

Per-user inbox; index on unread. Kinds mirror frontend `AppNotification`.

---

## 9. Trust & reviews

### 9.1 `reviews`

**UNIQUE:** `(order_id, reviewer_user_id)` — rating CHECK 1–5

**Demo:** sardor reviews nargiza on order o1 — rating 5, body in Uzbek

### 9.2 `verification_requests`

KYC queue — `documents` jsonb, `history` jsonb

### 9.3 `saved_items`

**PK:** `(user_id, entity_type, entity_id)`

---

## 10. Admin & ops

### 10.1 `admin_role_assignments`

`user_id` PK, `admin_role` enum

### 10.2 `audit_logs`

Append-only. **No UPDATE/DELETE.** FastAPI admin service inserts only.

### 10.3 `moderation_items`, `support_tickets`, `support_messages`

Admin ops mirrors mock admin types

### 10.4 `analytics_events`

Partitioned by month — see [DATABASE_PERFORMANCE.md](./DATABASE_PERFORMANCE.md)

---

## 11. Referrals, files, AI

| Table | Purpose |
|-------|---------|
| `referrals` | User referral code + credits |
| `referral_entries` | Per-referred-user tracking |
| `files` | S3/R2 metadata, virus scan status |
| `ai_usage_logs` | Token usage per tool |
| `search_documents` | Denormalized FTS document |
| `job_alerts` | Saved search alerts |
| `ftue_progress` | First-time UX progress |
| `security_settings` | 2FA, login alerts |
| `user_settings` | UI preferences |

---

## 12. Triggers & functions

| Function | Trigger on | Purpose |
|----------|------------|---------|
| `update_wallet_on_transaction()` | wallet_transactions INSERT | Adjust `wallets.available` atomically |
| `increment_proposals_count()` | applications INSERT | `projects.proposals_count++` |
| `refresh_freelancer_stats()` | orders/reviews change | Queue MV refresh |
| `generate_unique_slug()` | BEFORE INSERT | Slug collision suffix |
| `enforce_subscription_limits()` | applications INSERT | Check monthly proposal quota |
| `set_updated_at()` | users, projects, … | Auto `updated_at` |

---

## 13. Access control summary

No RLS. FastAPI enforces:

| Table | Read | Write |
|-------|------|-------|
| users | Self + public view fields | Self limited cols |
| wallets | Owner via API | Service layer only |
| orders | Participant or admin | Checkout service |
| messages | Conversation participant | Participant |
| admin_* | Admin RBAC | Admin RBAC |

Cross-user ID access returns `404` with *"Buyurtma topilmadi"* — not `403`.

---

*Full index list: [INDEXING_STRATEGY.md](./INDEXING_STRATEGY.md)*
