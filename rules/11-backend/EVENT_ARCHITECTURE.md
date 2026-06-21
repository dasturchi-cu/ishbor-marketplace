# EVENT_ARCHITECTURE.md

**Pattern:** Domain events + transactional outbox + async consumers  
**Replaces:** Direct cross-store calls (e.g. checkout → addNotification → recordAnalyticsEvent)

---

## 1. Event bus topology

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ API Service │────▶│ outbox_events│────▶│ Outbox Worker   │
│ (in TX)     │     │ (PostgreSQL) │     │ (BullMQ)        │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────┐
                    ▼                              ▼                          ▼
            NotificationWorker            AnalyticsWorker              SearchIndexer
            WebSocketPublisher              RevenueWorker                 EmailWorker
            AuditWorker                     RankingRefreshJob             ReferralWorker
```

---

## 2. Outbox table

```sql
CREATE TABLE outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type varchar(50) NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type varchar(100) NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  retry_count smallint DEFAULT 0,
  error text
);
CREATE INDEX idx_outbox_unprocessed ON outbox_events (created_at) WHERE processed_at IS NULL;
```

Events inserted in **same transaction** as domain mutation.

---

## 3. Domain events catalog

### Auth
| Event | Payload | Consumers |
|-------|---------|-----------|
| `UserRegistered` | userId, email, userType, referralCode? | EmailWorker, AnalyticsWorker, ReferralWorker |
| `UserLoggedIn` | userId, ip | AuditWorker |
| `EmailVerified` | userId | NotificationWorker |
| `PasswordReset` | userId | EmailWorker, AuditWorker |
| `AccountSuspended` | userId, reason, adminId | NotificationWorker, WebSocketPublisher |

### Marketplace
| Event | Payload | Consumers |
|-------|---------|-----------|
| `ProjectCreated` | projectId, ownerId | SearchIndexer, AnalyticsWorker |
| `ProjectPublished` | projectId | SearchIndexer, NotificationWorker (job alerts) |
| `ProjectClosed` | projectId | NotificationWorker (notifyProposalReceived users) |
| `ServicePublished` | serviceId | SearchIndexer |
| `ApplicationSubmitted` | applicationId, projectId, freelancerId | NotificationWorker, AnalyticsWorker |
| `ApplicationAccepted` | applicationId, orderId | NotificationWorker, WebSocketPublisher |
| `ApplicationRejected` | applicationId | NotificationWorker |

### Commerce
| Event | Payload | Consumers |
|-------|---------|-----------|
| `OrderCreated` | orderId, clientId, freelancerId, amount | NotificationWorker, AnalyticsWorker, AdminActivity |
| `CheckoutCompleted` | orderId, escrowId, paymentRecordId | NotificationWorker, RevenueWorker, WebSocketPublisher |
| `EscrowFunded` | escrowId, orderId, amount | NotificationWorker, WebSocketPublisher, AnalyticsWorker |
| `EscrowMilestoneReleased` | escrowId, milestoneId, amount | WalletWorker, NotificationWorker, AnalyticsWorker |
| `EscrowDisputeOpened` | disputeId, escrowId | NotificationWorker, AdminActivity |
| `OrderCompleted` | orderId | RankingRefresh, NotificationWorker, ReviewPrompt |
| `ReviewSubmitted` | reviewId, orderId, rating | RankingRefresh, NotificationWorker |

### Money
| Event | Payload | Consumers |
|-------|---------|-----------|
| `WalletDeposited` | userId, amount, txId | NotificationWorker, WebSocketPublisher |
| `WalletWithdrawalRequested` | userId, amount | AdminActivity, PaymentWorker |
| `SubscriptionUpgraded` | userId, plan, amount | RevenueWorker, AnalyticsWorker |
| `CreditsPurchased` | userId, amount | RevenueWorker |
| `FeaturedListingPurchased` | userId, entityType, entityId | SearchIndexer, AnalyticsWorker |
| `ReferralCompleted` | referrerId, referredId, credits | CreditsWorker, NotificationWorker |

### Agency
| Event | Payload | Consumers |
|-------|---------|-----------|
| `AgencyCreated` | agencyId, ownerId | AnalyticsWorker |
| `AgencyPublished` | agencyId | SearchIndexer |
| `AgencyMemberInvited` | agencyId, email, role | EmailWorker |
| `AgencyMemberJoined` | agencyId, userId | NotificationWorker |
| `AgencyVerificationRequested` | agencyId | AdminActivity |

### Messaging
| Event | Payload | Consumers |
|-------|---------|-----------|
| `MessageSent` | conversationId, messageId, senderId | WebSocketPublisher, NotificationWorker (if offline) |
| `OfferSent` | conversationId, messageId | WebSocketPublisher |
| `OfferAccepted` | conversationId, messageId, orderId | WebSocketPublisher, OrderCreated chain |

### Admin
| Event | Payload | Consumers |
|-------|---------|-----------|
| `AdminActionPerformed` | adminId, action, target, category | AuditWorker (immutable log) |
| `ModerationResolved` | itemId, decision | NotificationWorker |
| `DisputeResolved` | disputeId, resolution | EscrowWorker, NotificationWorker |
| `VerificationApproved` | requestId, userId | NotificationWorker, RankingRefresh |

### AI
| Event | Payload | Consumers |
|-------|---------|-----------|
| `AIToolUsed` | userId, tool, tokensIn, tokensOut | AIUsageWorker, AnalyticsWorker |

---

## 4. Consumer responsibilities

| Worker | Queue | Idempotent |
|--------|-------|------------|
| NotificationWorker | `notifications` | Yes — dedupe by eventId |
| WebSocketPublisher | `realtime` | Yes |
| AnalyticsWorker | `analytics` | Yes — append events |
| SearchIndexer | `search` | Yes — upsert document |
| EmailWorker | `email` | Yes |
| RevenueWorker | `revenue` | Yes — ledger append |
| AuditWorker | `audit` | Yes — append only |
| RankingRefreshJob | `cron` | Scheduled every 15min |
| ReferralWorker | `referrals` | Yes |

---

## 5. Event payload schema (base)

```typescript
type DomainEvent<T extends string, P> = {
  eventId: string;
  eventType: T;
  aggregateType: string;
  aggregateId: string;
  occurredAt: string; // ISO8601
  actorUserId?: string;
  payload: P;
  metadata?: {
    requestId?: string;
    ip?: string;
  };
};
```

---

## 6. Frontend event sources replaced

| Current direct call | Event |
|--------------------|-------|
| `addNotification()` in checkout | `CheckoutCompleted` → NotificationWorker |
| `recordAnalyticsEvent()` scattered | Domain events → AnalyticsWorker |
| `notifyProposalReceived()` | `ApplicationSubmitted` |
| `performAdminAction()` + audit | `AdminActionPerformed` |
| `recordRevenueEntry()` | `SubscriptionUpgraded`, `CheckoutCompleted` |

---

## 7. Retry & dead letter

| Setting | Value |
|---------|-------|
| Max retries | 5 |
| Backoff | exponential 1s → 60s |
| Dead letter | `outbox_events.error` + alert |
| Monitoring | Sentry + queue depth metric |

---

## 8. Cron jobs (scheduled events)

| Job | Schedule | Action |
|-----|----------|--------|
| `refresh_rankings` | */15 * * * * | Recompute freelancer/service/project scores |
| `expire_featured_listings` | 0 * * * * | Set featured=false past ends_at |
| `subscription_renewal` | 0 6 * * * | Charge renewals, handle past_due |
| `cleanup_sessions` | 0 3 * * * | DELETE expired sessions |
| `archive_analytics` | 0 4 1 * * | Partition old analytics_events |
| `job_alert_digest` | 0 8 * * * | Match alerts to new projects |
| `wallet_pending_release` | */30 * * * * | Process pending withdrawals |

---

*Maps all side effects currently triggered synchronously in `*-store.ts` files.*
