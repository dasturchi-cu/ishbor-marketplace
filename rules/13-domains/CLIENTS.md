# CLIENTS — Domain Specification

## Purpose

Companies and individuals hiring talent — primary revenue persona (escrow funding, platform fees).

## Workspace routes

`/dashboard`, `/my-projects`, `/projects/create`, `/checkout`, `/clients/manage`, `/analytics/client`, `/clients/$company`

## Key stores

- `projects-store` — listing supply
- `orders-store`, `escrow-store`, `wallet-store` — spend
- `crm-store.getClientCrmData` — freelancer relationship pipeline
- `saved-store` — bookmark talent
- `applications-store` — receive proposals (via project detail)

## User journey summary

Post project → review applications → accept → fund escrow → approve delivery → review freelancer

Direct paths: hire from service/package checkout, hire from freelancer profile

## Permissions

`requireRole(["client"])` on create project, checkout, client CRM

## Demo identity

`sardor@asaka.uz` — Asaka Capital, companySlug `asaka-capital`, public `/clients/asaka-capital`

## Database (target)

`users.user_type=client`, `client_profiles` with industry, team_size, hiring_goals (partially in user_profiles JSON)

## API

Client-scoped: GET /orders?role=client, POST /projects, POST /checkout/confirm

## Analytics

Client dashboard: spend buckets, active orders, hire conversion (analytics-events-store)

## Edge cases

- Client switches to freelancer role → redirected from /my-projects
- Company page public without auth for trust

See [USER_FLOW_MAP.md](../12-system-maps/USER_FLOW_MAP.md) §2
