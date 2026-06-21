# USER_FLOW_MAP.md — Client, Freelancer, Agency Journeys

All flows verified against route files and store transition functions.

---

## 1. Guest → activation

```
/ (landing)
  ├─ Search hero → /search or /services|/freelancers|/projects
  ├─ "Loyiha joylash" → /login?redirect=/projects/create OR /projects/preview
  └─ "Ish topish" → /projects

/register
  → save onboarding state + pending password (sessionStorage)
  → /verify-email → /verify-otp (OTP 123456)
  → completeRegistrationSession (server) → cookie + session
  → /welcome → onboarding steps OR dashboard

/login
  → loginSession (server) → cookie
  → resetActiveRoleOnLogin
  → /dashboard | /dashboard/freelancer | /admin
```

---

## 2. Client journey — hire & pay

### 2a. Post a project
```
/projects/create (requireRole client)
  → saveProjectDraft / publishProject (projects-store)
  → /my-projects
  → applications arrive (applications-store)
```

### 2b. Review proposals
```
/applications (client view via project detail)
  → shortlistApplication / acceptApplication
  → createOrder + createEscrowFromOrder (automatic)
  → /orders/$id
```

### 2c. Fund & manage
```
/checkout OR order detail "Fund escrow"
  → fundOrderEscrow + fundEscrow + holdEscrowFunds
  → /escrow/$id (status: funded)
  → /messages (coordinate delivery)
```

### 2d. Complete & review
```
/orders/$id → approveOrderDelivery
  → releaseEscrowMilestone → wallet payout to freelancer
  → ReviewForm → submitReview
```

### 2e. Direct hire (skip proposal)
```
/services/$slug "Buy" OR /freelancers/$username "Hire"
  → /checkout?service=|freelancer=
  → createDirectHireApplication → order + escrow immediately
```

---

## 3. Freelancer journey — win work

### 3a. Profile supply
```
/onboarding/skills… → profile-store
/portfolio/create → publishPortfolio
/services/create → publishService
/promotions → purchaseFeaturedListing (credits-store)
```

### 3b. Find & apply
```
/projects → /projects/$slug → Apply
  → canSubmitProposal (subscription-store limit)
  → createApplication (status: pending)
  → /applications/$id track status
```

### 3c. Win & deliver
```
acceptApplication (client action) → order created
  → /orders/$id (in_progress)
  → /messages send deliverables
  → markOrderInReview (freelancer or client)
```

### 3d. Get paid
```
Client approveOrderDelivery
  → releaseEscrowMilestone
  → wallet-store releaseEscrowToFreelancer
  → /wallet shows escrow_release tx
  → /analytics/freelancer revenue metrics
```

---

## 4. Agency journey

```
/agencies/create → createAgency → publishAgency
  → inviteMember (email) → acceptInvite
  → /dashboard/agency (agency-metrics-store)
  → /agency/clients (CRM pipeline)
  → agency-portfolio-store case studies on /agencies/$slug
```

**Permissions:** `agency-store.ROLE_PERMISSIONS` — owner, admin, member, viewer

---

## 5. Shared workspace flows

| Flow | Entry | Exit |
|------|-------|------|
| Messages deal close | /messages | offer accepted → order |
| Saved → hire | /saved | profile/service → checkout |
| Subscription upgrade | /subscription | upgradePlan → higher proposal limit |
| Settings KYC | /settings?tab=verification | submitVerificationDocument |
| Referral | /settings?tab=referral | applyReferralCode on register |
| AI proposal | /ai/proposal-assistant | copy to application |
| Dispute | /escrow/$id | openEscrowDispute → admin queue |

---

## 6. Role enforcement map

| Path prefix | Required role | Redirect if wrong |
|-------------|---------------|-------------------|
| `/my-projects`, `/projects/create`, `/checkout` | client | active dashboard |
| `/my-services`, `/applications`, `/portfolio/create` | freelancer | active dashboard |
| `/dashboard/agency`, `/agency/*` | agency | active dashboard |
| `/admin/*` | isAdmin | dashboard |
| `/portfolio` (hub) | freelancer | dashboard |

Sources: `guards.ts`, `client-auth-bootstrap.ts`, `active-role-store.pathRequiresRole`

---

## 7. FTUE / retention touchpoints

| Stage | Component | Store |
|-------|-----------|-------|
| First login | Welcome cards | ftue-store |
| Dashboard checklist | GettingStarted | ftue-store |
| Trust nudges | TrustCoach link | ai-trust-coach |
| Job alerts | settings tab | alerts-store |
| Empty states | EmptyState component | per-route |

---

## 8. Edge cases & failure flows

| Scenario | Current behavior | Production requirement |
|----------|------------------|---------------------|
| Proposal limit hit | canSubmitProposal false | 402 + upgrade CTA |
| Insufficient wallet | checkout blocked in UI | Server balance check |
| Escrow not funded | order stuck in_progress | Reminder notifications |
| Dispute opened | escrow → disputed | Admin SLA 24h |
| Suspended mid-session | logout on next action | Immediate session revoke |
| Wrong role URL | redirect to dashboard | SSR redirect via cookie |

See domain docs in [13-domains/](../13-domains/) for entity-level detail.
