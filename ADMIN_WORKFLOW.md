# Ishbor Enterprise Admin OS — Workflows

## Daily Operations Workflows

### 1. Morning Dashboard Review
**Actor**: Operations Manager / Super Admin

1. Navigate to `/admin`
2. Review KPI cards (users, orders, escrow, revenue, disputes)
3. Check real-time activity feed for overnight events
4. Use Quick Actions to jump to pending queues:
   - Verification requests
   - Open disputes
   - Pending withdrawals
   - Open support tickets

### 2. User Verification Workflow
**Actor**: Support Admin

```
User submits docs → Verification Center (/admin/verifications)
    ├── Review identity documents
    ├── Check verification history
    ├── Decision:
    │   ├── Approve → Audit log + user verified badge
    │   ├── Reject → Audit log + notification to user
    │   └── Request More Info → Audit log + message to user
    └── Update user record (/admin/users/$id)
```

### 3. Escrow Dispute Resolution
**Actor**: Finance Admin / Support Admin

```
Dispute opened → Dispute Center (/admin/disputes)
    ├── Review case details (parties, amount, reason)
    ├── Open escrow detail (/admin/escrow/$id)
    │   ├── Review timeline
    │   ├── Check milestones
    │   ├── Read chat history
    │   └── Review audit trail
    ├── Resolution:
    │   ├── Resolve (mutual agreement)
    │   ├── Refund Client (full/partial)
    │   ├── Pay Freelancer (full/partial)
    │   ├── Split Payment (custom ratio)
    │   └── Escalate to legal
    └── All actions → Confirmation modal → Toast → Audit log
```

### 4. Payment & Withdrawal Processing
**Actor**: Finance Admin

```
Withdrawal request → Payments (/admin/payments)
    ├── Filter: Withdrawals + Pending
    ├── Review amount, method, user history
    ├── Decision:
    │   ├── Approve → Funds released → Audit log
    │   ├── Reject → User notified → Audit log
    │   └── Hold → Transaction frozen → Audit log
    └── Failed payments tab for retry/investigation
```

### 5. Content Moderation Workflow
**Actor**: Moderator

```
Report received → Moderation (/admin/moderation)
    ├── Review flagged content (user/service/project/review)
    ├── Check reporter reason
    ├── Action:
    │   ├── Approve (dismiss report)
    │   ├── Hide (remove from public view)
    │   ├── Remove (delete content)
    │   └── Warn User (send warning + audit)
    └── Bulk actions for spam campaigns
```

### 6. Support Ticket Lifecycle
**Actor**: Support Admin

```
Ticket created → Support Center (/admin/support)
    ├── Triage by priority (urgent → high → normal → low)
    ├── Assign to agent
    ├── Reply to user (in-platform messaging)
    ├── Resolution:
    │   ├── Close (resolved)
    │   └── Escalate (senior support / finance / legal)
    └── All actions logged in audit trail
```

### 7. Project/Service Approval
**Actor**: Moderator

```
New listing submitted → Projects/Services (/admin/projects, /admin/services)
    ├── Review content, pricing, category
    ├── Check user trust score
    ├── Decision:
    │   ├── Approve → Live on marketplace
    │   ├── Reject → User notified
    │   ├── Edit → Admin edits listing
    │   ├── Suspend → Hidden temporarily
    │   └── Delete → Removed permanently
    └── Audit log entry for all actions
```

## Action Feedback Loop

Every admin action follows this pattern:

```
┌──────────┐    ┌──────────────┐    ┌─────────┐    ┌───────────┐
│  Click   │ →  │  Confirm     │ →  │ Execute │ →  │  Toast    │
│  Action  │    │  Modal       │    │ Action  │    │ Feedback  │
└──────────┘    └──────────────┘    └─────────┘    └───────────┘
                                         │
                                         ▼
                                   ┌───────────┐
                                   │ Audit Log │
                                   │ Entry     │
                                   └───────────┘
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open admin search |
| `Escape` | Close modal/drawer |

## Role-Specific Daily Tasks

### Super Admin
- System health check (`/admin/system`)
- Review audit logs (`/admin/audit`)
- Analytics review (`/admin/analytics`)
- Escalated dispute decisions

### Finance Admin
- Process withdrawal queue
- Monitor escrow volume
- Review failed payments
- Revenue analytics

### Support Admin
- Triage support tickets
- Process verification requests
- User account issues (suspend/ban/activate)
- Dispute first-response

### Moderator
- Content moderation queue
- Project/service approvals
- Application spam removal
- Review flagging

## Escalation Paths

```
Support Ticket → Support Admin → Senior Support → Super Admin
Dispute → Finance Admin → Legal Team → Super Admin
Moderation → Moderator → Support Admin → Super Admin
System Alert → Auto-notify → Super Admin
```
