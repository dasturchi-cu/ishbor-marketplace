# ADMIN_OS — Domain Specification

## Purpose

Platform operations — user safety, content moderation, financial intervention, compliance audit.

## Stores

- `admin-data-store` (`ishbor-admin-data`) — entity snapshots mirroring marketplace + queues
- `admin-store` (`ishbor-audit-log`) — AuditEntry chronological log

## Route map (22 routes)

Dashboard, users, verifications, projects, services, portfolios, orders, escrow, disputes, payments, applications, moderation, support, analytics, audit, system, founder, ai

Full map: [ADMIN_FLOW_MAP.md](../12-system-maps/ADMIN_FLOW_MAP.md)

## Critical admin actions

| Action | Function | Marketplace sync |
|--------|----------|------------------|
| Suspend user | suspendAdminUser | user-status + logout |
| Approve project | updateAdminProject | updateProjectStatus published |
| Reject service | updateAdminService | updateServiceStatus paused |
| Release escrow | adminReleaseEscrow | escrow-store |
| Refund escrow | adminRefundEscrow | wallet + escrow |

## Permissions (target)

RBAC from RBAC_SPECIFICATION — separate admin roles: support, finance, superadmin

## Audit

addAuditEntry on sensitive mutations — category, actor, target, result

## Database (target)

All admin reads from Postgres views — no localStorage snapshot  
`audit_log` append-only, 7-year retention for financial actions

## Security

- Admin session requires isAdmin from DB only (not client flag)
- MFA for finance actions
- IP allowlist optional for /admin in production

## Scalability

Admin queues paginated, materialized counts refreshed every 60s  
Founder dashboard: pre-aggregated metrics tables

See [ADMIN_ARCHITECTURE.md](../10-admin/ADMIN_ARCHITECTURE.md)
