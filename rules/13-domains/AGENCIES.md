# AGENCIES — Domain Specification

## Purpose

Team-based B2B supply — multiple members under one brand with CRM and case studies.

## Entity: Agency (agency-store)

Fields: id, slug, name, ownerId, members[], status, verified, permissions  
**Storage:** `ishbor-agencies`

## Roles & permissions

`ROLE_PERMISSIONS`: owner > admin > member > viewer  
Capabilities: manage_members, publish_listings, view_crm, manage_finances (varies by role)

## Key functions

createAgency, publishAgency, inviteMember, acceptInvite, removeMember, assignRole, requestVerification

## Routes

`/agencies`, `/agencies/$slug`, `/agencies/create`, `/dashboard/agency`, `/agency/clients`

## Related stores

- `agency-metrics-store` — computeAgencyMetrics, leaderboard
- `agency-ranking-store` — rankAgencies
- `agency-portfolio-store` — case studies on profile

## User journey

Auth user creates agency → invite team → publish → agency dashboard metrics → CRM clients

## Database (target)

Tables: `agencies`, `agency_members`, `agency_invites`, `agency_case_studies`

## API

POST /agencies, POST /agencies/:id/invites, GET /agencies/:slug/members

## Edge cases

- User switches activeRole to agency — dashboard/agency unlocked
- Pending invites: getPendingInvitesForUser

Demo seed: seedDemoAgencyIfNeeded on login
