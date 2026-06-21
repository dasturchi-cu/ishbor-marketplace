# PROJECTS — Domain Specification

## Purpose & business value

Client-posted work listings — supply side of marketplace. Drives freelancer applications and platform GMV.

## Entity: Project

From mock-data + projects-store merge.  
**Status:** `draft` | `published` | `closed` | `paused`  
**Storage:** `ishbor-user-projects`

## Key functions

| Function | Effect |
|----------|--------|
| saveProjectDraft | status=draft |
| publishProject | status=published, visible in /projects |
| updateProjectStatus | admin or owner close/pause |
| getPublishedProjects | public catalog filter |
| getMyProjects | client scoped |
| isProjectOwner | guard for edit |
| deleteProject | remove from store |

## User journey

1. `/projects/preview` (guest planning) OR `/projects/create` (auth client)
2. Form: title, description, budget, category, skills, timeline
3. Publish → appears in `/projects` + search
4. Receive applications → accept → order flow

## Permissions

- Create/edit: client role (requireRole in projects.create.tsx)
- Public view: published only
- Admin mod: updateAdminProject → sync updateProjectStatus

## Validations

- Required fields on publish (title, description, budget range)
- Slug uniqueness derived from title

## Database requirements

Tables: `projects`, `project_skills`, `project_attachments`  
FTS index on title + description for /api/v1/search  
RLS: owner CRUD, public SELECT where status=published

## API requirements

```
GET    /api/v1/projects?q=&category=&sort=
GET    /api/v1/projects/:slug
POST   /api/v1/projects
PATCH  /api/v1/projects/:slug
POST   /api/v1/projects/:slug/publish
DELETE /api/v1/projects/:slug
```

## Notifications

Job alerts (alerts-store.checkJobAlertsForProject) on publish

## Analytics

`project_view`, conversion funnel on apply

## Admin

`/admin/projects` — approve/suspend/reject syncs to marketplace store

## Scalability

10k active projects: GIN index on search vector, cache popular categories in Redis

Routes: `/projects`, `/projects/$slug`, `/projects/create`, `/my-projects`, `/projects/preview`
