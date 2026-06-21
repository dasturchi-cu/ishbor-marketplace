# Marketplace Lifecycle Documentation — Ishbor

**Folder:** `rules/17-marketplace/`  
**Purpose:** End-to-end workflow specs for marketplace commerce — state machines, API paths, store mappings  
**Stack:** FastAPI · PostgreSQL · Celery · TanStack Start frontend  
**Sources:** `rules/13-domains/*`, `rules/11-backend/*`, `src/lib/*-store.ts`

---

## 1. North star flow

The Ishbor marketplace north star spans six connected lifecycles:

```
Projects / Services (supply)
        │
        ▼
Applications (projects only) OR Checkout (services)
        │
        ▼
Orders (contract)
        │
        ▼
Escrow (fund hold)
        │
        ├──▶ Milestone release → Freelancer paid (5% platform fee)
        │
        └──▶ Dispute → Admin resolve
                    │
                    ├──▶ Refund → Client wallet
                    └──▶ Release → Freelancer wallet
```

Every production mutation moves from client localStorage stores to `/api/v1/*` with server-enforced state machines and optimistic locking (`version` column).

---

## 2. Document index

| # | Document | Primary store | Status enum | Key API prefix |
|---|----------|---------------|-------------|----------------|
| 1 | [PROJECT_WORKFLOW.md](./PROJECT_WORKFLOW.md) | `projects-store.ts` | draft → published ↔ paused → closed | `/api/v1/projects` |
| 2 | [SERVICE_WORKFLOW.md](./SERVICE_WORKFLOW.md) | `services-store.ts` | draft → published ↔ paused → archived | `/api/v1/services` |
| 3 | [ORDER_LIFECYCLE.md](./ORDER_LIFECYCLE.md) | `orders-store.ts` | in_progress → review → completed \| disputed \| cancelled | `/api/v1/orders` |
| 4 | [ESCROW_LIFECYCLE.md](./ESCROW_LIFECYCLE.md) | `escrow-store.ts` | accepted → funded → … → completed \| disputed | `/api/v1/escrow` |
| 5 | [DISPUTE_LIFECYCLE.md](./DISPUTE_LIFECYCLE.md) | escrow + admin-data-store | open → pending → closed | `/api/v1/admin/disputes` |
| 6 | [REFUND_LIFECYCLE.md](./REFUND_LIFECYCLE.md) | escrow + wallet | N/A (wallet tx category=refund) | `/api/v1/admin/escrow`, `/orders/cancel` |

---

## 3. Store → API migration matrix

| Store file | Storage key | Server tables | Migration priority |
|------------|-------------|---------------|-------------------|
| `projects-store.ts` | `ishbor-user-projects` | `projects`, `project_*` | P1 — supply catalog |
| `services-store.ts` | `ishbor-user-services` | `services`, `service_*` | P1 — supply catalog |
| `orders-store.ts` | `ishbor-user-orders` | `orders`, `order_milestones` | P0 — money path |
| `escrow-store.ts` | `ishbor-user-escrow` | `escrow_workflows`, `escrow_*` | P0 — money path |
| `applications-store.ts` | (applications) | `applications` | P1 — project hire |
| `admin-data-store.ts` | admin mock | `disputes`, `moderation_*` | P0 — trust |
| `wallet-store.ts` | localStorage | `wallets`, `wallet_transactions` | P0 — ledger |

---

## 4. Cross-cutting concerns

### 4.1 Backend infrastructure docs

| Topic | Document |
|-------|----------|
| API versioning | [../11-backend/fastapi/API_VERSIONING.md](../11-backend/fastapi/API_VERSIONING.md) |
| Error codes (Uzbek) | [../11-backend/fastapi/ERROR_HANDLING.md](../11-backend/fastapi/ERROR_HANDLING.md) |
| Soft delete | [../11-backend/postgresql/SOFT_DELETE_STRATEGY.md](../11-backend/postgresql/SOFT_DELETE_STRATEGY.md) |
| Audit trail | [../11-backend/postgresql/AUDIT_TRAIL_STRATEGY.md](../11-backend/postgresql/AUDIT_TRAIL_STRATEGY.md) |
| Data retention | [../11-backend/postgresql/DATA_RETENTION_POLICY.md](../11-backend/postgresql/DATA_RETENTION_POLICY.md) |
| Cron jobs | [../11-backend/fastapi/CRON_JOBS.md](../11-backend/fastapi/CRON_JOBS.md) |
| Background tasks | [../11-backend/fastapi/BACKGROUND_JOBS.md](../11-backend/fastapi/BACKGROUND_JOBS.md) |

### 4.2 Domain specs (13-domains)

| Domain | Document |
|--------|----------|
| Projects | [../13-domains/PROJECTS.md](../13-domains/PROJECTS.md) |
| Services | [../13-domains/SERVICES.md](../13-domains/SERVICES.md) |
| Orders & Escrow | [../13-domains/ORDERS_ESCROW.md](../13-domains/ORDERS_ESCROW.md) |
| Moderation & Disputes | [../13-domains/MODERATION_DISPUTES.md](../13-domains/MODERATION_DISPUTES.md) |
| Wallet | [../13-domains/WALLET_TRANSACTIONS.md](../13-domains/WALLET_TRANSACTIONS.md) |

### 4.3 Payment backend

| Topic | Document |
|-------|----------|
| Escrow system | [../11-backend/payments/ESCROW_SYSTEM.md](../11-backend/payments/ESCROW_SYSTEM.md) |
| Dispute flow | [../11-backend/payments/DISPUTE_FLOW.md](../11-backend/payments/DISPUTE_FLOW.md) |
| Refund flow | [../11-backend/payments/REFUND_FLOW.md](../11-backend/payments/REFUND_FLOW.md) |
| Transaction boundaries | [../11-backend/payments/TRANSACTION_FLOW.md](../11-backend/payments/TRANSACTION_FLOW.md) |

---

## 5. Route map (frontend)

| Route | Lifecycle doc | Role |
|-------|---------------|------|
| `/projects`, `/projects/$slug` | PROJECT_WORKFLOW | public/client |
| `/projects/create`, `/my-projects` | PROJECT_WORKFLOW | client |
| `/services`, `/services/$slug` | SERVICE_WORKFLOW | public |
| `/services/create`, `/my-services` | SERVICE_WORKFLOW | freelancer |
| `/checkout` | ORDER + ESCROW | client |
| `/orders`, `/orders/$id` | ORDER_LIFECYCLE | client/freelancer |
| `/escrow`, `/escrow/$id` | ESCROW_LIFECYCLE | client/freelancer |
| `/admin/projects` | PROJECT_WORKFLOW §Admin | admin |
| `/admin/services` | SERVICE_WORKFLOW §Admin | admin |
| `/admin/orders` | ORDER_LIFECYCLE §Admin | admin |
| `/admin/escrow/$id` | ESCROW_LIFECYCLE §Admin | admin |
| `/admin/disputes` | DISPUTE_LIFECYCLE | admin |
| `/wallet` | REFUND_LIFECYCLE | auth |

Full registry: [../02-integration/ROUTE_REGISTRY.md](../02-integration/ROUTE_REGISTRY.md)

---

## 6. WebSocket events (marketplace)

| Event | Lifecycle | Recipients |
|-------|-----------|------------|
| `order.status_changed` | Order | client + freelancer |
| `order.created` | Order | both parties |
| `escrow.funded` | Escrow | both parties |
| `escrow.released` | Escrow | freelancer |
| `escrow.disputed` | Dispute | both + admin |
| `escrow.completed` | Escrow | both parties |
| `project.published` | Project | job alert subscribers |

Spec: [../11-backend/WEBSOCKET_SPECIFICATION.md](../11-backend/WEBSOCKET_SPECIFICATION.md)

---

## 7. Analytics events (marketplace)

| Event | Source store | Trigger |
|-------|--------------|---------|
| `project_created` | projects-store | publishProject |
| `project_view` | analytics-events | detail page |
| `service_view` | analytics-events | detail page |
| `order_created` | orders-store | createOrder |
| `order_completed` | orders-store | approveOrderDelivery |
| `escrow_funded` | wallet/escrow | fundEscrow |
| `escrow_released` | escrow | releaseEscrowMilestone |

---

## 8. Admin RBAC by lifecycle

| Section | Admin role | Key actions |
|---------|------------|-------------|
| Projects/Services | moderation_admin | suspend, approve, feature |
| Orders | support_admin | view, escalate |
| Escrow | finance_admin | release, refund, freeze |
| Disputes | moderation_admin + finance_admin | assign, resolve, split |
| Audit | super_admin, founder | read export |

Matrix: [../11-backend/auth/PERMISSION_MATRIX.md](../11-backend/auth/PERMISSION_MATRIX.md)

---

## 9. Implementation order (recommended)

1. **P0:** Orders + Escrow + Wallet API — money path off localStorage
2. **P0:** Disputes + Refunds + audit_logs
3. **P1:** Projects + Services CRUD + search index
4. **P1:** Applications accept → order create
5. **P2:** Featured listings cron + subscription limits
6. **P2:** CRM/analytics server ingestion

Master plan: [../11-backend/BACKEND_IMPLEMENTATION_MASTER_PLAN.md](../11-backend/BACKEND_IMPLEMENTATION_MASTER_PLAN.md)

---

## 10. Conventions used in this folder

- State machines use `→` for transitions and `\|` for terminal/alternate states
- API paths use `/api/v1` prefix unless noted (webhooks excluded)
- Store function names match `src/lib/*-store.ts` exports exactly
- Uzbek user messages referenced in ERROR_HANDLING.md — not duplicated here
- PostgreSQL enums from TABLE_SPECIFICATIONS.md are authoritative over mock-data drift

---

## 11. Conflict resolution

If this folder disagrees with `rules/13-domains/*` or code:

1. Check latest phase reports in `rules/99-reports/`
2. Audit the store implementation
3. Align docs OR code in same PR
4. Note change in audit/report

Per PROJECT_BIBLE documentation-first rule.

---

*This index links marketplace lifecycle docs derived from projects-store, services-store, orders-store, escrow-store, and admin dispute patterns — targeting FastAPI + PostgreSQL production backend.*
