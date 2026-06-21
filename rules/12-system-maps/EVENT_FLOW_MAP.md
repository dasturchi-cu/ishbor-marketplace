# EVENT_FLOW_MAP.md — Domain Events & Side Effects

Maps synchronous side effects in current stores → target async events in `EVENT_ARCHITECTURE.md`.

---

## 1. Current pattern (synchronous)

Stores call each other directly on mutation — no outbox, no idempotency keys.

```
mutation() {
  update local state
  localStorage.write
  notify()
  otherStore.sideEffect()  // synchronous
  notifications.add()
  analytics.record()
}
```

---

## 2. Commerce events

| Trigger | Store function | Direct side effects | Target event |
|---------|----------------|---------------------|--------------|
| Application submitted | createApplication | notify client, recordAnalytics, check subscription usage | `ApplicationSubmitted` |
| Application accepted | acceptApplication | createOrder, createEscrow, notify freelancer | `ApplicationAccepted`, `OrderCreated` |
| Order funded | fundOrderEscrow | fundEscrow, holdEscrowFunds | `EscrowFunded` |
| Milestone released | releaseEscrowMilestone | wallet release, revenue log | `EscrowReleased`, `LedgerEntryCreated` |
| Order completed | approveOrderDelivery | release all milestones, conversion event | `OrderCompleted` |
| Dispute opened | openEscrowDispute | notify both parties, admin queue | `DisputeOpened` |
| Review submitted | submitReview | update reputation compute, notify | `ReviewSubmitted` |

---

## 3. Auth events

| Trigger | Function | Side effects | Target event |
|---------|----------|--------------|--------------|
| Login success | loginSession | set cookie, applyServerSession, clear rate limit | `UserLoggedIn` |
| Logout | logoutSession | clear cookie, clear local | `UserLoggedOut` |
| Registration complete | completeRegistrationSession | insert user, auto login | `UserRegistered` |
| Admin suspend | suspendAdminUser | syncAccountStatus, logout if active | `AccountSuspended` |
| Password change | updateUserPassword | security-store record | `PasswordChanged` |

---

## 4. Marketplace events

| Trigger | Function | Side effects |
|---------|----------|--------------|
| Project published | publishProject | alerts checkJobAlerts, analytics |
| Service published | publishService | checkSavedSearchAlerts |
| Portfolio published | publishPortfolio | — |
| Featured purchased | purchaseFeaturedListing | credits spend, featured-listings record |
| Save toggled | toggleSaved | portfolio analytics if portfolio |

---

## 5. Communication events

| Trigger | Function | Side effects |
|---------|----------|--------------|
| Message sent | sendMessage | update snippet, unread, response-metrics |
| Offer sent | sendOffer | notification to recipient |
| Offer accepted | updateOfferState(accepted) | may create order |
| Typing | setTyping | local UI refresh tick |

---

## 6. Monetization events

| Trigger | Function | Side effects |
|---------|----------|--------------|
| Plan upgrade | upgradePlan | subscription record, analytics |
| Proposal submitted | recordProposalSubmitted | usage counter increment |
| Credit purchase | purchaseCredits | wallet credits, revenue log |
| Referral complete | completeReferral | credit both parties |

---

## 7. Analytics event types (`analytics-events-store`)

```
profile_view, project_view, service_view, portfolio_view,
application_sent, application_accepted, order_created, order_completed,
escrow_funded, escrow_released, message_sent, login, signup,
subscription_upgrade, featured_purchase, search
```

Functions: `recordAnalyticsEvent`, `recordConversionEvent` (conversion-store)

---

## 8. Target event architecture (production)

```
API handler
  → DB transaction
  → INSERT outbox_events
  → COMMIT
Worker polls outbox
  → NotificationWorker → notifications + email/push
  → AnalyticsWorker → warehouse
  → SearchIndexer → Elasticsearch/FTS
  → WebSocketPublisher → Redis pub/sub
```

Idempotency: `Idempotency-Key` header on checkout, escrow fund (PAYMENT_ARCHITECTURE)

---

## 9. Failure cases

| Event | Failure | Current | Target |
|-------|---------|---------|--------|
| Escrow fund | Insufficient balance | UI block | 402 + rollback |
| Notification | Store write fail | Silent | Outbox retry |
| Analytics | Cap 5000 reached | Drop oldest | Stream to warehouse |
| Admin sync | User on other device | Desync | Server push invalidation |

See [NOTIFICATION_ARCHITECTURE.md](../11-backend/NOTIFICATION_ARCHITECTURE.md).
