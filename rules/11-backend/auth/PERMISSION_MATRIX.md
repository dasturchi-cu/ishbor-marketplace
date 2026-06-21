# PERMISSION_MATRIX.md

**Scope:** Complete authorization matrix for Ishbor Marketplace API  
**Roles:** Guest, Client, Freelancer, Agency (member permissions), Admin (RBAC sections)  
**Enforcement:** FastAPI Depends guards — see [RBAC_SPECIFICATION.md](../RBAC_SPECIFICATION.md)  
**Legend:** ✅ allowed | ❌ denied | 🔒 owner/participant only | 🏢 agency permission required | 👑 admin section

---

## 1. Role definitions

| Role | Auth required | Notes |
|------|---------------|-------|
| **Guest** | No | Public browse only |
| **Client** | Yes | `activeRole=client` or dual-account switched to client |
| **Freelancer** | Yes | `activeRole=freelancer` |
| **Agency** | Yes | `activeRole=agency` + `agency_members` permission |
| **Admin** | Yes | `is_admin=true` + `admin_role` section access |

**Account type** (`users.user_type`) is permanent; **active role** is switchable. Admin users may have any active role for UI but admin API checks `is_admin` independently.

**Agency sub-roles:** owner, manager, recruiter, freelancer (member) — see §3.

**Fail-closed:** Any unmatched cell defaults to ❌.

---

## 2. Authentication & profile

| Action / Resource | Guest | Client | Freelancer | Agency | Admin |
|-------------------|:-----:|:------:|:----------:|:------:|:-----:|
| POST /auth/register | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST /auth/login | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /auth/session | ❌ | ✅ | ✅ | ✅ | ✅ |
| PATCH /auth/active-role → client | ❌ | ✅ | ✅* | ✅* | ✅ |
| PATCH /auth/active-role → freelancer | ❌ | ✅* | ✅ | ✅* | ✅ |
| PATCH /auth/active-role → agency | ❌ | ❌** | ❌** | ✅** | ✅ |
| GET /users/me | ❌ | ✅ | ✅ | ✅ | ✅ |
| PATCH /users/me/profile | ❌ | ✅ | ✅ | ✅ | ✅ |
| POST /users/me/verification | ❌ | ✅ | ✅ | ✅ | ✅ |
| GET /freelancers (public) | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /clients/:slug (public) | ✅ | ✅ | ✅ | ✅ | ✅ |

\* Dual account — allowed if user_type or membership supports target role  
\** Requires active `agency_members` row with status=active

---

## 3. Agency permission sub-matrix

When **Agency** column shows 🏢, required permission:

| Action | owner | manager | recruiter | member |
|--------|:-----:|:-------:|:---------:|:------:|
| view_dashboard | ✅ | ✅ | ✅ | ✅ |
| edit_agency | ✅ | ✅ | ❌ | ❌ |
| invite_members | ✅ | ✅ | ❌ | ❌ |
| manage_roles | ✅ | ❌ | ❌ | ❌ |
| view_crm | ✅ | ✅ | ✅ | ❌ |
| publish_agency | ✅ | ❌ | ❌ | ❌ |
| request_verification | ✅ | ❌ | ❌ | ❌ |

---

## 4. Marketplace — projects

| Action | Guest | Client | Freelancer | Agency | Admin |
|--------|:-----:|:------:|:----------:|:------:|:-----:|
| GET /projects | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /projects/:slug | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /projects | ❌ | ✅ | ❌ | ❌ | 👑 projects |
| PATCH /projects/:slug | ❌ | 🔒 owner | ❌ | ❌ | 👑 |
| POST publish/pause/close | ❌ | 🔒 owner | ❌ | ❌ | 👑 |
| DELETE /projects/:slug (draft) | ❌ | 🔒 owner | ❌ | ❌ | 👑 |
| POST attachments | ❌ | 🔒 owner | ❌ | ❌ | 👑 |
| POST /projects/:slug/applications | ❌ | ❌ | ✅ | ❌*** | 👑 |

\*** Agency member acting as freelancer for agency portfolio — use freelancer active role

---

## 5. Marketplace — services

| Action | Guest | Client | Freelancer | Agency | Admin |
|--------|:-----:|:------:|:----------:|:------:|:-----:|
| GET /services | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /services/:slug | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /services | ❌ | ❌ | ✅ | ❌ | 👑 services |
| PATCH /services/:slug | ❌ | ❌ | 🔒 owner | ❌ | 👑 |
| POST publish | ❌ | ❌ | 🔒 owner | ❌ | 👑 |
| DELETE /services/:slug | ❌ | ❌ | 🔒 owner | ❌ | 👑 |

---

## 6. Applications (proposals)

| Action | Guest | Client | Freelancer | Agency | Admin |
|--------|:-----:|:------:|:----------:|:------:|:-----:|
| GET /applications | ❌ | ❌ | ✅ own | ❌ | 👑 applications |
| POST application on project | ❌ | ❌ | ✅ | ❌ | 👑 |
| PATCH withdraw application | ❌ | ❌ | 🔒 applicant | ❌ | 👑 |
| POST accept/reject/shortlist | ❌ | 🔒 project owner | ❌ | ❌ | 👑 |

---

## 7. Orders, checkout, escrow

| Action | Guest | Client | Freelancer | Agency | Admin |
|--------|:-----:|:------:|:----------:|:------:|:-----:|
| GET /orders | ❌ | 🔒 participant | 🔒 participant | 🔒 participant | 👑 orders |
| GET /orders/:id | ❌ | 🔒 participant | 🔒 participant | 🔒 participant | 👑 |
| POST /checkout/preview | ❌ | ✅ | ❌ | ❌ | 👑 |
| POST /checkout/confirm | ❌ | ✅ | ❌ | ❌ | 👑 |
| POST confirm-delivery | ❌ | 🔒 client | ❌ | ❌ | 👑 |
| POST request-revision | ❌ | 🔒 client | ❌ | ❌ | 👑 |
| POST cancel order | ❌ | 🔒 participant | 🔒 participant | 🔒 participant | 👑 |
| GET /escrow/:id | ❌ | 🔒 participant | 🔒 participant | 🔒 participant | 👑 escrow |
| POST /escrow/:id/fund | ❌ | 🔒 client | ❌ | ❌ | 👑 finance |
| POST milestone release | ❌ | 🔒 client | ❌ | ❌ | 👑 finance |
| POST /escrow/:id/dispute | ❌ | 🔒 participant | 🔒 participant | 🔒 participant | 👑 |

**Participant:** `order.client_user_id` OR `order.freelancer_user_id` OR admin with section access.

---

## 8. Wallet & payments

| Action | Guest | Client | Freelancer | Agency | Admin |
|--------|:-----:|:------:|:----------:|:------:|:-----:|
| GET /wallet | ❌ | 🔒 self | 🔒 self | 🔒 self | 👑 payments |
| POST /wallet/deposit | ❌ | 🔒 self | 🔒 self | 🔒 self | ❌ |
| POST /wallet/withdraw | ❌ | 🔒 self* | 🔒 self* | 🔒 self* | ❌ |
| GET /wallet/transactions | ❌ | 🔒 self | 🔒 self | 🔒 self | 👑 |
| GET/POST /payment-methods | ❌ | 🔒 self | 🔒 self | 🔒 self | ❌ |

\* Requires email + phone verified P1

---

## 9. Subscriptions, credits, promotions

| Action | Guest | Client | Freelancer | Agency | Admin |
|--------|:-----:|:------:|:----------:|:------:|:-----:|
| GET /subscription/plans | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /subscription | ❌ | ✅ | ✅ | ✅ | ✅ |
| POST upgrade/cancel | ❌ | ✅ | ✅ | ✅ | 👑 |
| GET /credits | ❌ | ✅ | ✅ | ✅ | ✅ |
| POST /credits/purchase | ❌ | ✅ | ✅ | ✅ | ❌ |
| GET/POST /promotions/featured | ❌ | ❌ | ✅ | ❌ | 👑 |

---

## 10. Portfolio

| Action | Guest | Client | Freelancer | Agency | Admin |
|--------|:-----:|:------:|:----------:|:------:|:-----:|
| GET /portfolio/:slug (published) | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /portfolio (own list) | ❌ | ❌ | ✅ | ❌ | 👑 portfolios |
| POST /portfolio | ❌ | ❌ | ✅ | ❌ | 👑 |
| PATCH/DELETE /portfolio/:slug | ❌ | ❌ | 🔒 owner | ❌ | 👑 |
| POST publish portfolio | ❌ | ❌ | 🔒 owner | ❌ | 👑 |

---

## 11. Agencies

| Action | Guest | Client | Freelancer | Agency | Admin |
|--------|:-----:|:------:|:----------:|:------:|:-----:|
| GET /agencies | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /agencies/:slug | ✅ | ✅ | ✅ | 🏢 member | ✅ |
| POST /agencies (create) | ❌ | ✅ | ✅ | ✅ | 👑 |
| PATCH /agencies/:slug | ❌ | ❌ | ❌ | 🏢 edit_agency | 👑 |
| POST publish agency | ❌ | ❌ | ❌ | 🏢 owner | 👑 |
| POST invite member | ❌ | ❌ | ❌ | 🏢 invite_members | 👑 |
| PATCH member role | ❌ | ❌ | ❌ | 🏢 manage_roles | 👑 |
| GET /agencies/:slug/clients | ❌ | ❌ | ❌ | 🏢 view_crm | 👑 |
| POST case-studies | ❌ | ❌ | ❌ | 🏢 edit_agency | 👑 |
| POST verification-request | ❌ | ❌ | ❌ | 🏢 owner | 👑 |

---

## 12. Messaging

| Action | Guest | Client | Freelancer | Agency | Admin |
|--------|:-----:|:------:|:----------:|:------:|:-----:|
| GET /conversations | ❌ | ✅ | ✅ | ✅ | 👑 support* |
| GET /conversations/:id/messages | ❌ | 🔒 participant | 🔒 participant | 🔒 participant | 👑 |
| POST /conversations | ❌ | ✅ | ✅ | ✅ | ❌ |
| POST message (text/file) | ❌ | 🔒 participant | 🔒 participant | 🔒 participant | ❌ |
| POST offer message | ❌ | ❌ | 🔒 freelancer side | 🔒 | ❌ |
| POST accept-offer | ❌ | 🔒 client side | ❌ | ❌ | ❌ |
| PATCH read/archive | ❌ | 🔒 participant | 🔒 participant | 🔒 participant | ❌ |
| WS conversation:{id} subscribe | ❌ | 🔒 participant | 🔒 participant | 🔒 participant | ❌ |

\* Admin read-only for dispute/support tickets P1 — not general user DM access

Maps [MESSAGES.md](../../13-domains/MESSAGES.md) participant-only rule.

---

## 13. Notifications

| Action | Guest | Client | Freelancer | Agency | Admin |
|--------|:-----:|:------:|:----------:|:------:|:-----:|
| GET /notifications | ❌ | 🔒 self | 🔒 self | 🔒 self | ❌ |
| PATCH read / read-all | ❌ | 🔒 self | 🔒 self | 🔒 self | ❌ |
| GET unread-count | ❌ | 🔒 self | 🔒 self | 🔒 self | ❌ |
| PATCH preferences | ❌ | 🔒 self | 🔒 self | 🔒 self | ❌ |
| WS user:{id}:notifications | ❌ | 🔒 self | 🔒 self | 🔒 self | ❌ |

Maps [NOTIFICATIONS.md](../../13-domains/NOTIFICATIONS.md).

---

## 14. Saved, reviews, referrals, CRM

| Action | Guest | Client | Freelancer | Agency | Admin |
|--------|:-----:|:------:|:----------:|:------:|:-----:|
| GET/POST/DELETE /saved | ❌ | ✅ | ✅ | ✅ | ❌ |
| POST /orders/:id/reviews | ❌ | 🔒 client completed | ❌ | ❌ | ❌ |
| GET /reviews (public by user) | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /referrals | ❌ | ✅ | ✅ | ✅ | ❌ |
| GET /crm/clients | ❌ | ❌ | ✅ | 🏢 view_crm | 👑 |
| GET /crm/freelancers | ❌ | ✅ | ❌ | ❌ | 👑 |
| GET/PATCH /crm/leads | ❌ | ✅ | ❌ | 🏢 view_crm | 👑 |

---

## 15. Analytics & AI

| Action | Guest | Client | Freelancer | Agency | Admin |
|--------|:-----:|:------:|:----------:|:------:|:-----:|
| GET /analytics/client | ❌ | ✅ | ❌ | ❌ | 👑 analytics |
| GET /analytics/freelancer | ❌ | ❌ | ✅ | ❌ | 👑 |
| POST /analytics/events | ❌ | ✅ | ✅ | ✅ | ✅ |
| POST /ai/project-generator | ❌ | ✅ | ❌ | ❌ | 👑 ai |
| POST /ai/proposal-assistant | ❌ | ❌ | ✅ | ❌ | 👑 ai |
| POST /ai/portfolio-optimizer | ❌ | ❌ | ✅ | ❌ | 👑 ai |
| POST /ai/trust-coach | ❌ | ✅ | ✅ | ✅ | 👑 ai |

---

## 16. Search & files

| Action | Guest | Client | Freelancer | Agency | Admin |
|--------|:-----:|:------:|:----------:|:------:|:-----:|
| GET /search | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /search/suggest | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /files/presign | ❌ | ✅ | ✅ | ✅ | ✅ |
| GET /files/:id | ❌ | 🔒 owner/public | 🔒 | 🔒 | 👑 |

---

## 17. Admin API sections

| Section | super_admin | finance_admin | support_admin | moderator |
|---------|:-----------:|:-------------:|:-------------:|:---------:|
| dashboard | ✅ | ✅ | ✅ | ✅ |
| users | ✅ | ❌ | ✅ | ❌ |
| verifications | ✅ | ❌ | ✅ | ❌ |
| projects/services/portfolios | ✅ | ❌ | ❌ | ✅ |
| orders/applications | ✅ | ✅ | ✅ | ✅ |
| escrow/disputes | ✅ | ✅ | ✅ | ❌ |
| payments | ✅ | ✅ | ❌ | ❌ |
| moderation | ✅ | ❌ | ❌ | ✅ |
| support | ✅ | ❌ | ✅ | ❌ |
| analytics/revenue | ✅ | partial | ❌ | ❌ |
| audit | ✅ | ✅ | ✅ | ✅ |
| system/founder/ai | ✅ | ❌ | ❌ | ❌ |

Admin mutations: suspend/ban, verify KYC, release escrow, resolve dispute, moderate content — each maps to role in RBAC_SPECIFICATION.md §5.

---

## 18. WebSocket channels (summary)

| Channel | Guest | Client | Freelancer | Agency | Admin |
|---------|:-----:|:------:|:----------:|:------:|:-----:|
| user:{self}:notifications | ❌ | ✅ | ✅ | ✅ | ❌ |
| user:{self}:messages | ❌ | ✅ | ✅ | ✅ | ❌ |
| conversation:{id} | ❌ | 🔒 | 🔒 | 🔒 | ❌ |
| presence:{userId} | ❌ | opt-in | opt-in | opt-in | ❌ |
| admin:activity | ❌ | ❌ | ❌ | ❌ | 👑 dashboard |

---

## 19. Account status overrides

| Status | Effect on matrix |
|--------|------------------|
| pending (unverified) | POST projects/services/checkout ❌ |
| suspended | All authenticated actions ❌ except GET /auth/session logout |
| banned | All ❌ — 403 ACCOUNT_BANNED |

---

## 20. Related documents

- [RBAC_SPECIFICATION.md](../RBAC_SPECIFICATION.md) — FastAPI Depends implementation
- [ROLE_MATRIX.md](../../02-integration/ROLE_MATRIX.md) — frontend route mirror
- [API_SPECIFICATION.md](../API_SPECIFICATION.md) — endpoint catalog

---

*Authoritative permission matrix for Ishbor — API must enforce every cell; frontend gates are UX only.*
