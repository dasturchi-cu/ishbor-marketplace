# SPAM_PREVENTION.md

**Purpose:** Prevent proposal spam, message spam, and quota abuse on Ishbor marketplace  
**Authority:** Server-side enforcement (FastAPI) — client `subscription-store.ts` mirrors limits for UX  
**Plans:** Free (Bepul) · Pro · Elite — defined in subscription plan registry

---

## 1. Problem statement

Marketplace spam degrades trust and increases moderation cost:

| Spam type | Actor | Harm |
|-----------|-------|------|
| Proposal spam | Freelancer | Clients overwhelmed; low-quality bids |
| Message spam | Any authenticated user | Harassment, phishing, off-platform deals |
| Application flooding | Freelancer | Client inbox unusable |
| Service listing spam | Freelancer | Search pollution |
| Project posting spam | Client | Fake demand, SEO manipulation |

Controls combine subscription quotas, rate limits, content moderation, and trust signals.

---

## 2. Subscription plan limits (authoritative registry)

Source: `src/lib/subscription-store.ts` — migrate to PostgreSQL `subscriptions` + `subscription_usage` tables on FastAPI backend.

### 2.1 Plan definitions

| Plan | ID | Price (UZS/mo) | Proposals/month | Max services |
|------|----|----------------|-----------------|--------------|
| Bepul | `free` | 0 | **10** | **3** |
| Pro | `pro` | 99,000 | **Unlimited** (`null`) | **20** |
| Elite | `elite` | 249,000 | **Unlimited** (`null`) | **Unlimited** (`null`) |

### 2.2 Additional plan entitlements (anti-spam context)

| Feature | Free | Pro | Elite |
|---------|------|-----|-------|
| Featured profile | No | Yes | Yes |
| Priority ranking boost | 0 | +10 | +25 |
| Featured listings | No | No | Yes |
| Priority support | No | Yes | Yes |
| Advanced analytics | No | Yes | Yes |

Higher plans receive ranking boost — not exemption from message spam limits.

### 2.3 Usage tracking

Monthly proposal usage keyed by `{userId}:{YYYY-MM}`:

```
ishbor-subscription-usage → { "user-uuid:2026-06": { month: "2026-06", proposals: 7 } }
```

Server equivalent:

```sql
-- subscription_usage table
user_id UUID, month DATE, proposals_count INT, messages_sent INT
UNIQUE (user_id, month)
```

Reset: first day of calendar month (Asia/Tashkent). No rollover of unused quota.

---

## 3. Proposal spam prevention

### 3.1 Submission flow

```
POST /v1/applications (proposal submit)
  → Auth: require_role("freelancer")
  → Rate limit: applications.submit — 20/hour per user (Redis)
  → Plan check: canSubmitProposal(user_id)
  → Duplicate check: same user + same project within 24h → reject
  → Content validation: min 50 chars, max 5000 chars, no URL flood
  → INSERT application
  → recordProposalSubmitted(user_id) — increment monthly counter
  → Notify project owner (async)
```

### 3.2 Free plan enforcement

When `proposalsPerMonth = 10` and `used >= 10`:

```json
{
  "error": "PROPOSAL_LIMIT_EXCEEDED",
  "message": "Bu oy uchun takliflar limiti tugadi. Pro yoki Elite rejasiga o'ting.",
  "used": 10,
  "limit": 10,
  "upgrade_url": "/pricing"
}
```

Frontend: `canSubmitProposal()` in subscription-store returns `false`; projects detail page shows upsell banner with remaining count.

### 3.3 Server-side functions (target FastAPI)

| Function | Logic |
|----------|-------|
| `getProposalUsage(user_id)` | Returns `{ used, limit }` from DB |
| `canSubmitProposal(user_id)` | `limit is None OR used < limit` |
| `recordProposalSubmitted(user_id)` | Atomic increment with month key |

**Critical:** Never trust client counter — server reads authoritative usage from PostgreSQL.

### 3.4 Anti-duplicate rules

| Rule | Window | Action |
|------|--------|--------|
| Same project, same freelancer | 24 hours | Reject — "Allaqachon taklif yuborgansiz" |
| Same cover letter hash | 1 hour across projects | Flag for moderation |
| >5 proposals in 10 minutes | — | Rate limit 429 |
| Proposal to own project (multi-role) | — | Reject — conflict of interest |

### 3.5 Application accept limits (client side)

Clients accepting applications: no subscription limit, but rate limit 50 accepts/hour to prevent automation abuse.

---

## 4. Message spam prevention

### 4.1 Rate limits

| Action | Limit | Key |
|--------|-------|-----|
| Start new conversation | 20 / hour | user_id |
| Send message (existing thread) | 60 / hour | user_id |
| Send message (same thread) | 30 / hour | user_id + thread_id |
| WebSocket messages | 64 KB max payload | per message |
| Attachments per message | 5 files | per message |

Redis keys: `ratelimit:messages.send:user:{uuid}`, `ratelimit:messages.new:user:{uuid}`.

### 4.2 Content rules

| Rule | Enforcement |
|------|-------------|
| Max message length | 10,000 characters |
| Max messages per thread stored | 10,000 (archival job for older) |
| Identical body sent 3× in 5 min | Block with 429 |
| >5 URLs in single message | Flag for moderation |
| Phone/email in first message to stranger | Soft warn + moderation flag (P1) |
| Blocked user messaging | 403 — bidirectional block |

### 4.3 Conversation eligibility

Messages only between:

- Order participants (client ↔ freelancer on active order)
- Application thread (client ↔ applicant freelancer)
- Agency members (internal)
- Admin support thread

No cold DM to arbitrary users — prevents unsolicited spam.

### 4.4 WebSocket flood protection

| Control | Value |
|---------|-------|
| Max connections per IP | 5 |
| Max connections per user | 3 |
| Ping interval | 30 seconds |
| Missed pongs before disconnect | 3 |
| Invalid session on WS | Close code 4001 |

See [../WEBSOCKET_SPECIFICATION.md](../WEBSOCKET_SPECIFICATION.md).

---

## 5. Service and project listing spam

### 5.1 Service creation limits

From subscription plan `maxServices`:

| Plan | Max active services |
|------|---------------------|
| Free | 3 |
| Pro | 20 |
| Elite | Unlimited |

`canCreateService(userId, currentCount)` — server checks before INSERT.

Additional rate limit: 5 service creates / hour per user regardless of plan.

### 5.2 Project posting limits (clients)

| Limit | Value |
|-------|-------|
| Active projects per client | 10 (free), 50 (verified business) |
| Project creates / day | 5 |
| Duplicate title within 7 days | Reject |

Verified business clients: KYC-approved accounts get higher limits.

---

## 6. Notification spam prevention

| Control | Detail |
|---------|-------|
| Max push/email per user / hour | 30 |
| Batch similar notifications | Collapse "3 new proposals" into one |
| User mute preferences | Respect in notifications-store |
| System broadcasts | Admin-only, max 1/day platform-wide |

Prevents notification channel abuse and email provider blocklisting.

---

## 7. Moderation integration

Spam that passes rate limits still hits moderation:

| Trigger | Queue |
|---------|-------|
| User report | `/admin/moderation` |
| Auto-flag: URL flood, duplicate content | `/admin/moderation` |
| 3+ moderation rejections | Account suspended pending review |
| Trust score below threshold | New content held for review |

Moderation actions audit-logged with before/after state.

---

## 8. Upsell and UX (not security)

Free plan users see remaining proposal count on:

- `/dashboard/freelancer` — banner when ≤3 remaining
- `/projects/$slug` — submit button disabled with upgrade link
- `/applications` — limit reached state
- `/pricing` — plan comparison

Copy in Uzbek. Primary color `#2563EB` for upgrade CTA.

Error from server always includes stable `error` code — frontend maps to toast + `/pricing` link.

---

## 9. Migration from client store to server

Current state: `subscription-store.ts` uses localStorage — **not authoritative for production**.

| Phase | Action |
|-------|--------|
| P0 | FastAPI reads/writes `subscriptions` + `subscription_usage` tables |
| P0 | All proposal submit goes through API — client store becomes read cache |
| P1 | Stripe/Payme billing for plan upgrades |
| P1 | Celery job: monthly usage reset + renewal billing |

Until migration complete, treat localStorage limits as demo-only — document in staging banner.

---

## 10. Monitoring

| Metric | Alert |
|--------|-------|
| `proposals_created_total` spike >3× baseline | P2 — possible bot farm |
| `PROPOSAL_LIMIT_EXCEEDED` rate >10% of submits | P2 — UX or attack |
| Messages blocked (duplicate body) | Daily report |
| Moderation queue depth | >50 items → P2 |
| Free→Pro conversion after limit hit | Business metric — Grafana |

---

## 11. Test cases

| # | Scenario | Expected |
|---|----------|----------|
| T1 | Free user submits 10 proposals in month | 11th rejected with PROPOSAL_LIMIT_EXCEEDED |
| T2 | Pro user submits 50 proposals | All accepted (subject to 20/hour rate limit) |
| T3 | Same proposal twice in 24h | Second rejected |
| T4 | 61 messages in 1 hour | 61st returns 429 |
| T5 | Free user creates 4th service | Rejected — service limit |
| T6 | Message to non-participant stranger | 403 — no conversation eligibility |

---

## 12. Related documents

- [ABUSE_PREVENTION.md](./ABUSE_PREVENTION.md)
- [RATE_LIMITING.md](./RATE_LIMITING.md)
- [../payments/PAYMENT_ARCHITECTURE.md](../payments/PAYMENT_ARCHITECTURE.md) — subscription billing
- [../../04-trust/TRUST_SYSTEM.md](../../04-trust/TRUST_SYSTEM.md)
- [../../21-observability/ALERTING_RULES.md](../../21-observability/ALERTING_RULES.md)

---

*Proposal limits: Free 10/month, Pro/Elite unlimited. Service limits: Free 3, Pro 20, Elite unlimited. Server enforces all quotas — client subscription-store is UX mirror until FastAPI migration.*
