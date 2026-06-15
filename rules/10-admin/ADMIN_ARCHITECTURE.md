# Ishbor Enterprise Admin OS — Architecture

## Overview

The Ishbor Admin OS is an enterprise-grade operations panel at `/admin` for founders, operations managers, finance teams, support teams, and moderators. It is built with React, TanStack Router, Tailwind CSS, and shadcn/ui (Radix primitives), using the existing Ishbor design system (primary `#2563EB`).

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Routes (/admin/*)                  │
│  Dashboard · Users · Verifications · Projects · Services    │
│  Orders · Applications · Escrow · Disputes · Payments       │
│  Moderation · Support · Analytics · Audit · System          │
├─────────────────────────────────────────────────────────────┤
│              Admin Components (src/components/admin/)        │
│  Shell · DataTable · Actions · Charts · ActivityFeed · Search│
├─────────────────────────────────────────────────────────────┤
│              shadcn/ui Components (src/components/ui/)       │
│  Button · Badge · Card · Dialog · Sheet · Tabs · Table …    │
├─────────────────────────────────────────────────────────────┤
│                   Admin Lib (src/lib/)                       │
│  admin-mock-data · admin-store · admin-roles                │
├─────────────────────────────────────────────────────────────┤
│              Marketplace Data (src/lib/mock-data.ts)         │
│  Freelancers · Clients · Orders · Escrow · Applications     │
└─────────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Admin Shell (`components/admin/shell.tsx`)
- Dedicated sidebar layout separate from `WorkspaceShell`
- Role-based navigation filtering
- Mobile drawer navigation
- Global search trigger (⌘K)
- Role switcher for demo/testing

### 2. Role-Based Access (`lib/admin-roles.ts`)

| Role | Access |
|------|--------|
| **Super Admin** | All 15 sections |
| **Finance Admin** | Dashboard, Orders, Escrow, Disputes, Payments, Analytics, Audit |
| **Support Admin** | Dashboard, Users, Verifications, Orders, Escrow, Disputes, Support, Audit |
| **Moderator** | Dashboard, Projects, Services, Orders, Applications, Moderation, Audit |

### 3. Action System (`lib/admin-store.ts`)
Every admin action flows through `performAdminAction()`:
1. Confirmation modal (via `AdminActionDialog`)
2. Execute action callback
3. Toast success/error feedback (Sonner)
4. Audit log entry (`addAuditEntry`)

### 4. Data Layer (`lib/admin-mock-data.ts`)
Extended mock data for admin operations:
- `adminUsers` — unified user records (freelancers + clients)
- `verificationRequests` — identity/business verification queue
- `disputes` — dispute resolution cases
- `paymentRecords` — deposits, withdrawals, escrow transfers
- `supportTickets` — support queue
- `moderationQueue` — content moderation items
- `systemHealth` — service status indicators
- `activityFeed` — real-time activity events
- `analyticsData` — GMV, revenue, retention metrics
- `chartData` — growth time series

### 5. UI Components (`components/ui/`)
shadcn/ui-style components using Radix primitives and Ishbor design tokens:
- `button`, `badge`, `card`, `input`, `dialog`, `sheet`
- `tabs`, `select`, `checkbox`, `table`

## State Management

- **Admin role**: React Context (`AdminProvider`)
- **Search modal**: React Context (`AdminSearchProvider`)
- **Audit log**: Module-level store with pub/sub (`subscribeAudit`)
- **Actions**: Local component state + `useAdminActionDialog` hook

## Security Model (Production Roadmap)

Current implementation uses mock data with client-side role switching. Production deployment requires:

1. Server-side role verification on every admin route (`beforeLoad` guard)
2. API authorization middleware per action
3. Immutable audit log persistence (database)
4. Rate limiting on destructive actions
5. Two-factor authentication for Super Admin

## Responsive Design

- Desktop: Fixed 240px sidebar + fluid content area
- Tablet: Collapsible sidebar via Sheet drawer
- Mobile: Bottom-agnostic layout with hamburger menu
- Data tables: Horizontal scroll with sticky headers

## Integration Points

| Marketplace Entity | Admin Section |
|-------------------|---------------|
| `freelancers` + `clients` | Users |
| `projects` | Projects |
| `services` | Services |
| `orders` | Orders |
| `applications` | Applications |
| `escrowWorkflows` | Escrow |
| `transactions` | Payments |
| `reviews` | Moderation |

## File Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── admin-context.tsx      # Role + admin identity
│   │   ├── shell.tsx              # Layout + navigation
│   │   ├── data-table.tsx         # Searchable data tables
│   │   ├── actions.tsx            # Stat cards + action dialogs
│   │   ├── charts.tsx             # Recharts wrappers
│   │   ├── activity-feed.tsx      # Real-time feed + health indicators
│   │   ├── search.tsx             # ⌘K command palette
│   │   └── search-context.tsx     # Search modal state
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── admin-mock-data.ts
│   ├── admin-store.ts
│   └── admin-roles.ts
└── routes/
    ├── admin.tsx                  # Layout route
    ├── admin.index.tsx            # Dashboard
    ├── admin.users.tsx
    ├── admin.users.$id.tsx
    ├── admin.verifications.tsx
    ├── admin.projects.tsx
    ├── admin.services.tsx
    ├── admin.orders.tsx
    ├── admin.applications.tsx
    ├── admin.escrow.tsx
    ├── admin.escrow.$id.tsx
    ├── admin.disputes.tsx
    ├── admin.payments.tsx
    ├── admin.moderation.tsx
    ├── admin.support.tsx
    ├── admin.analytics.tsx
    ├── admin.audit.tsx
    └── admin.system.tsx
```
