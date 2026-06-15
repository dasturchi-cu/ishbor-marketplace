# Marketplace Flow Audit — Phase 12.5

**Date:** 2026-06-13  
**Scope:** Core marketplace business flows only (no admin).

## Executive Summary

Phase 12.5 makes primary business actions visible in navigation, workspace sidebar, dashboards, and landing page. Client and freelancer journeys are now discoverable without hunting through dead-end pages.

## Flow Status

| Flow | Route(s) | Status |
|------|----------|--------|
| Post project | `/projects/create` | ✅ Visible in nav, sidebar, home, dashboard |
| My projects | `/my-projects` | ✅ Filter tabs: All, Draft, Published, Paused, Closed |
| Browse projects | `/projects` | ✅ Primary CTA for freelancers |
| Submit proposal | `/projects/$slug?proposal=true` | ✅ On project cards + detail |
| My applications | `/applications` | ✅ Pending, Accepted, Rejected, Archived |
| Hire freelancer | `/checkout?type=hire` | ✅ Talent cards + profile |
| Fund escrow | `/checkout?type=order` | ✅ After accept / invite |
| Manage orders | `/orders` | ✅ Dashboard + workspace nav |

## Navigation Improvements

### Global header (all pages including workspace)
- **Guest:** Find work + Post project (login redirect)
- **Client:** My projects + Post project
- **Freelancer:** My applications + Find work

### Workspace sidebar
- **Client:** Client, My Projects, Post Project, Orders, Escrow…
- **Freelancer:** Freelancer, My Applications, Find Work, Orders, Escrow…

### Mobile menu
- Role-specific links added (My projects / My applications / Find work)

## Discovery

Landing page now includes dual-path cards:
- **I want to hire** → Post a project
- **I want to work** → Browse projects

Final CTA section adds **Find work** alongside Post project and Browse talent.

## Files Changed

- `src/components/site/nav.tsx` — Role-based `NavBusinessActions`
- `src/components/site/workspace-shell.tsx` — Post Project, Find Work, My Applications labels
- `src/routes/my-projects.tsx` — Status filter tabs + View action
- `src/routes/applications.index.tsx` — Pending/Accepted/Rejected/Archived + archive
- `src/routes/projects.$slug.tsx` — Proposal sort + shortlist
- `src/routes/dashboard.index.tsx` — My projects + Post project actions
- `src/routes/dashboard.freelancer.tsx` — Find work + My applications CTAs
- `src/routes/projects.index.tsx` — Role-based header CTA
- `src/routes/index.tsx` — Dual journey cards on home
- `src/lib/applications-store.ts` — `archiveApplication`, `shortlistApplication`
- `src/lib/mock-data.ts` — `archived` on Application

## Remaining Limitations

- Data persists in localStorage (demo phase)
- Admin panel not updated (intentionally excluded)
- Service listing creation still via profile (not primary freelancer path)
