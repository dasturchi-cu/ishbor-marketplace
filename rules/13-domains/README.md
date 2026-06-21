# Domain Documentation — Ishbor

**Generated:** 2026-06-20 from codebase discovery  
Each document describes **what the code actually does today** plus **production requirements** from `rules/11-backend/`.

---

## Index

| Domain | Document | Primary stores | Routes |
|--------|----------|----------------|--------|
| Users & Auth | [USERS_AUTH.md](./USERS_AUTH.md) | auth, active-role, profile, security | login, register, settings |
| Clients | [CLIENTS.md](./CLIENTS.md) | projects, crm, orders | dashboard, my-projects, checkout |
| Freelancers | [FREELANCERS.md](./FREELANCERS.md) | services, applications, portfolio | dashboard/freelancer, applications |
| Agencies | [AGENCIES.md](./AGENCIES.md) | agency-store, agency-metrics | agencies/*, dashboard/agency |
| Projects | [PROJECTS.md](./PROJECTS.md) | projects-store | projects/*, my-projects |
| Services | [SERVICES.md](./SERVICES.md) | services-store | services/*, my-services |
| Applications | [APPLICATIONS.md](./APPLICATIONS.md) | applications-store | applications/* |
| Orders & Escrow | [ORDERS_ESCROW.md](./ORDERS_ESCROW.md) | orders, escrow | orders/*, escrow/*, checkout |
| Wallet & Transactions | [WALLET_TRANSACTIONS.md](./WALLET_TRANSACTIONS.md) | wallet, payment-methods, revenue | wallet, checkout |
| CRM | [CRM.md](./CRM.md) | crm-store | clients/manage, freelancers/manage |
| Notifications | [NOTIFICATIONS.md](./NOTIFICATIONS.md) | notifications-store | notifications |
| Messages | [MESSAGES.md](./MESSAGES.md) | messages-store, call-store | messages |
| AI Tools | [AI_TOOLS.md](./AI_TOOLS.md) | ai-* stores | ai/* |
| Admin OS | [ADMIN_OS.md](./ADMIN_OS.md) | admin-data, admin-store | admin/* |
| Analytics | [ANALYTICS.md](./ANALYTICS.md) | analytics-events, conversion | analytics/* |
| Search | [SEARCH.md](./SEARCH.md) | marketplace.ts | search, hero search |
| Moderation & Disputes | [MODERATION_DISPUTES.md](./MODERATION_DISPUTES.md) | admin-data | admin/moderation, admin/disputes |
| Reviews & Trust | [REVIEWS_TRUST.md](./REVIEWS_TRUST.md) | reviews, reputation, verified | profiles, orders |
| Referrals & Monetization | [REFERRALS_MONETIZATION.md](./REFERRALS_MONETIZATION.md) | referral, subscription, credits | settings, subscription, promotions |

---

## Document template (each domain follows)

1. **Purpose & business value**
2. **User journey**
3. **Entities & relationships**
4. **Lifecycle & states**
5. **Permissions (RBAC)**
6. **Validations**
7. **Current implementation** (stores, routes, functions)
8. **Database requirements** (from DATABASE_SCHEMA.md)
9. **API requirements** (from API_SPECIFICATION.md)
10. **WebSocket / notification hooks**
11. **Analytics events**
12. **Security requirements**
13. **Admin capabilities**
14. **Scalability notes**
15. **Edge cases & failure recovery**

---

## Cross-domain transaction

The platform north star spans: **Applications → Orders → Escrow → Wallet → Reviews**

See [ORDERS_ESCROW.md](./ORDERS_ESCROW.md) for the integrated lifecycle.
