# Client Journey Audit — Phase 12.5

## Journey Map

```
Home → Post Project → Manage Projects → Receive Proposals → Review Freelancers
  → Hire Freelancer → Fund Escrow → Manage Order → Complete Project
```

## Step-by-Step Verification

| Step | Entry Point | Route | Status |
|------|-------------|-------|--------|
| 1. Home | Landing | `/` | ✅ Hire/work cards visible |
| 2. Post project | Nav, dashboard, home | `/projects/create` | ✅ Always visible for clients |
| 3. Manage projects | Nav, sidebar, dashboard | `/my-projects` | ✅ Filter by status |
| 4. Receive proposals | Project detail (owner view) | `/projects/$slug` | ✅ Proposals panel |
| 5. Review freelancers | Proposal cards | `/freelancers/$username` | ✅ View profile link |
| 6. Compare proposals | Project detail | Sort + shortlist | ✅ Added Phase 12.5 |
| 7. Accept proposal | Project detail | → creates order | ✅ |
| 8. Hire directly | Talent browse | `/checkout?type=hire` | ✅ |
| 9. Invite to project | Freelancer profile | Modal → checkout | ✅ |
| 10. Fund escrow | Checkout | `/checkout?type=order` | ✅ |
| 11. Manage order | Dashboard, orders | `/orders/$id` | ✅ |
| 12. Complete project | Order milestones | `/orders/$id` | ✅ Mock milestones |

## My Projects — Actions Per Status

| Status | View | Edit | Pause | Resume | Close | Delete |
|--------|------|------|-------|--------|-------|--------|
| Draft | ✅ | ✅ | — | — | — | ✅ |
| Published | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| Paused | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| Closed | ✅ | — | — | — | — | ✅ |

## Client CTAs (No Hidden Actions)

- Header: **My projects** + **Post project** (even on workspace pages)
- Dashboard: **My projects** + **Post project**
- Sidebar: **My Projects**, **Post Project**
- Empty state: **Post your first project**

## Demo Account

- Email: `sardor@asaka.uz` / Password: `demo1234`
