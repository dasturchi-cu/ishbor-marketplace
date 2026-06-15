# Ishbor Enterprise Admin OS — Route Map

## Route Tree

```
/admin                          → Admin Dashboard (KPIs, charts, activity feed)
├── /admin/users                → User Management (search, filters, bulk actions)
│   └── /admin/users/$id        → User Detail (profile, orders, wallet, escrow, reviews)
├── /admin/verifications        → Verification Center (pending/approved/rejected)
├── /admin/projects             → Project Management (approve/reject/suspend/delete)
├── /admin/services             → Service Management (approve/reject/suspend/delete)
├── /admin/orders               → Order Management (active/review/completed/cancelled/disputed)
├── /admin/applications         → Application Management (pending/shortlisted/accepted/rejected)
├── /admin/escrow               → Escrow Command Center (active/released/pending/disputed)
│   └── /admin/escrow/$id       → Escrow Detail (timeline, milestones, chat, audit)
├── /admin/disputes             → Dispute Center (open/pending/closed)
├── /admin/payments             → Payments & Wallet (deposits/withdrawals/escrow/failed)
├── /admin/moderation           → Content Moderation (users/services/projects/reviews)
├── /admin/support              → Support Center (tickets, priority, assignment)
├── /admin/analytics            → Analytics Center (GMV, revenue, retention, top lists)
├── /admin/audit                → Audit Logs (who, what, when)
└── /admin/system               → System Health (API, DB, queue, email, payments, escrow)
```

## Route Details

| Route | Title | Key Features | Role Access |
|-------|-------|-------------|-------------|
| `/admin` | Dashboard | 11 KPI cards, 4 growth charts, activity feed, quick actions | All roles |
| `/admin/users` | Users | Search, role/status/verification filters, bulk suspend | Super, Support |
| `/admin/users/$id` | User Detail | 8 tabs, suspend/ban/activate/verify actions | Super, Support |
| `/admin/verifications` | Verifications | 3 status tabs, document viewer, approve/reject | Super, Support |
| `/admin/projects` | Projects | Approve/reject/edit/suspend/delete, bulk approve | Super, Moderator |
| `/admin/services` | Services | Approve/reject/edit/suspend/delete | Super, Moderator |
| `/admin/orders` | Orders | 5 status tabs, force complete/cancel/pause/escalate | All except System-only |
| `/admin/applications` | Applications | 4 status tabs, moderate/remove spam/suspend | Super, Moderator |
| `/admin/escrow` | Escrow | 4 status tabs, release/freeze/refund/investigate | Super, Finance, Support |
| `/admin/escrow/$id` | Escrow Detail | Timeline, milestones, chat, audit trail | Super, Finance, Support |
| `/admin/disputes` | Disputes | 3 status tabs, resolve/refund/pay/split/escalate | Super, Finance, Support |
| `/admin/payments` | Payments | 5 type tabs, approve/reject/hold withdrawals | Super, Finance |
| `/admin/moderation` | Moderation | Content queue, hide/approve/remove/warn, bulk | Super, Moderator |
| `/admin/support` | Support | Ticket list, assign/reply/close/escalate | Super, Support |
| `/admin/analytics` | Analytics | GMV, revenue, fees, conversion, retention, tops | Super, Finance |
| `/admin/audit` | Audit Logs | Live-updating log, category filter, search | All roles |
| `/admin/system` | System Health | 6 service indicators, overall status | Super Admin only |

## Navigation

- **Sidebar**: Persistent on desktop (240px), drawer on mobile
- **Breadcrumb**: Eyebrow + title in page header
- **Back link**: "Marketplace" link returns to `/`
- **Search**: `⌘K` opens section search palette
- **Role switcher**: Dropdown in sidebar for demo access control

## Data Loaders

| Route | Loader Data |
|-------|------------|
| `/admin/users/$id` | `getAdminUser(id)` → 404 if missing |
| `/admin/escrow/$id` | `getEscrowWorkflow(id)` → 404 if missing |

## Auth Guards

All `/admin/*` routes require authentication via `requireAuth` in the parent `admin.tsx` layout route.

## Meta Titles

Each route sets a unique `<title>` via TanStack Router `head()`:
- Pattern: `{Section Name} — Ishbor Admin`
- Dashboard: `Admin Dashboard — Ishbor`
