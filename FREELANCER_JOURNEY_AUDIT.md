# Freelancer Journey Audit — Phase 12.5

## Journey Map

```
Home → Browse Projects → Submit Proposal → Track Applications
  → Get Hired → Deliver Work → Receive Payment
```

## Step-by-Step Verification

| Step | Entry Point | Route | Status |
|------|-------------|-------|--------|
| 1. Home | Landing "I want to work" | `/projects` | ✅ |
| 2. Browse projects | Nav **Find work**, sidebar | `/projects` | ✅ Primary CTA |
| 3. Submit proposal | Project card / detail | `/projects/$slug?proposal=true` | ✅ |
| 4. Proposal form | Budget, delivery, cover letter | Inline on detail | ✅ |
| 5. Track applications | Nav, sidebar, dashboard | `/applications` | ✅ **My Applications** |
| 6. Application detail | List item | `/applications/$id` | ✅ Timeline + links |
| 7. Get hired | Client accepts | Status → Accepted | ✅ |
| 8. Active order | Dashboard | `/orders/$id` | ✅ |
| 9. Escrow / payment | Order + wallet | `/escrow`, `/wallet` | ✅ Mock |

## My Applications Sections

| Tab | Includes | Actions |
|-----|----------|---------|
| Pending | pending + shortlisted | View detail, project link, client link |
| Accepted | accepted | View order path in detail |
| Rejected | rejected | Archive button |
| Archived | archived=true | Read-only history |

## Application Row Data

Each application shows:
- ✅ Project title + link to posting
- ✅ Client name (+ client profile when slug available)
- ✅ Status badge
- ✅ Proposal amount + delivery time
- ✅ Submitted date
- ✅ Cover letter preview

## Freelancer CTAs (No Hidden Actions)

- Header: **My applications** + **Find work** (even on workspace)
- Dashboard: **Find work** (primary) + **My applications**
- Sidebar: **My Applications**, **Find Work**
- Projects page header: **My applications** when logged in as freelancer
- Empty states: **Browse projects** CTA

## Demo Account

- Email: `nargiza@ishbor.uz` / Password: `demo1234`
