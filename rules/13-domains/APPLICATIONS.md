# APPLICATIONS — Domain Specification

## Purpose & business value

Proposals connect freelancers to client projects. Subscription tier limits proposal count (freemium monetization).

## Entity: Application

Fields: id, projectSlug, freelancerId, coverLetter, bidAmount, deliveryDays, status, archived, orderId?

**Storage:** `ishbor-user-applications`

## Status lifecycle

```
pending → shortlisted → accepted → (orderId set)
pending → rejected
createDirectHireApplication → accepted immediately
```

## Key functions

| Function | Rules |
|----------|-------|
| createApplication | canSubmitProposal (subscription), notifies client |
| shortlistApplication | client action |
| acceptApplication | creates order + escrow, sets orderId |
| createDirectHireApplication | skips pending, immediate order |
| archiveApplication | archived flag, status unchanged |
| updateApplicationStatus | generic transition |

## User journey

**Freelancer:** `/projects/$slug` Apply → `/applications/$id` track  
**Client:** project detail → review proposals → accept  
**AI assist:** `/ai/proposal-assistant` → copy to application form

## Permissions

- Create: freelancer role, own profile
- Accept/reject: project owner (client)
- View detail: applicant or project owner

## Validations

- `canSubmitProposal` checks subscription-store usage counter
- `recordProposalSubmitted` increments `ishbor-subscription-usage` monthly key
- Bid amount > 0, delivery days > 0 (form validation)

## Database requirements

Tables: `applications`, `application_status_history`  
Index: (project_id, status), (freelancer_id, created_at)

## API requirements

```
POST   /api/v1/projects/:slug/applications
GET    /api/v1/applications?role=freelancer|client
PATCH  /api/v1/applications/:id/accept
PATCH  /api/v1/applications/:id/reject
PATCH  /api/v1/applications/:id/shortlist
```

## Notifications

Client: new application  
Freelancer: accepted/rejected

## Analytics

`application_sent`, `application_accepted`

## Admin

`/admin/applications` — updateApplication in admin-data-store

## Edge cases

| Case | Behavior |
|------|----------|
| Proposal limit reached | canSubmitProposal false, upgrade CTA |
| Accept twice | orderId already set — idempotent accept |
| Project closed | createApplication should fail (verify project status) |

Routes: `/applications`, `/applications/$id`
