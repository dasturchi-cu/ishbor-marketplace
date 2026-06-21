# EMAIL_NOTIFICATION_MATRIX.md

**Provider:** Resend (primary) / SendGrid fallback  
**From:** `noreply@ishbor.uz` · **Reply-to:** `support@ishbor.uz`  
**Stack:** FastAPI `EmailWorker` + Jinja2 templates + Celery queue `notifications`  
**Language:** Uzbek body; Latin script; amounts USD primary, UZS footnote optional

---

## 1. Matrix convention

| Column | Meaning |
|--------|---------|
| Event | Domain event name (outbox) |
| Template ID | File under `app/templates/email/{id}.html` |
| Recipient | Who receives email |
| Priority | immediate / digest / optional |
| Default pref | On unless user disabled category |

---

## 2. Authentication & account

| Event | Template ID | Recipient | Priority | Default pref |
|-------|-------------|-----------|----------|--------------|
| UserRegistered | `auth.welcome` | New user | immediate | always (transactional) |
| EmailVerificationRequested | `auth.verify_email` | Registrant | immediate | always |
| EmailVerified | `auth.email_confirmed` | User | optional | auth |
| PasswordResetRequested | `auth.password_reset` | User | immediate | always |
| PasswordChanged | `auth.password_changed` | User | immediate | always |
| PhoneVerified | `auth.phone_confirmed` | User | optional | auth |
| NewDeviceLogin | `auth.new_device` | User | immediate | security |
| SessionRevokedAll | `auth.sessions_revoked` | User | immediate | security |

**Welcome subject:** `Ishbor'ga xush kelibsiz!`  
**Verify subject:** `Email manzilingizni tasdiqlang`

---

## 3. Proposals & applications

| Event | Template ID | Recipient | Priority | Default pref |
|-------|-------------|-----------|----------|--------------|
| ApplicationSubmitted | `proposal.received` | Project owner (client) | immediate | proposals |
| ApplicationAccepted | `proposal.accepted` | Freelancer applicant | immediate | proposals |
| ApplicationRejected | `proposal.rejected` | Freelancer applicant | immediate | proposals |
| OfferSent | `proposal.offer_sent` | Offer recipient | immediate | proposals |
| ProjectClosed | `project.closed` | Applicants + owner | digest | proposals |

Maps `notifyProposalReceived`, `notifyProposalAccepted`, `notifyProjectClosed` in `notification-events.ts`.

**Deep link:** `https://ishbor.uz/projects/{slug}` or `/orders/{orderId}`

---

## 4. Orders & checkout

| Event | Template ID | Recipient | Priority | Default pref |
|-------|-------------|-----------|----------|--------------|
| OrderCreated | `order.created` | Client + freelancer | immediate | orders |
| CheckoutConfirmed | `order.receipt` | Client | immediate | orders |
| OrderStatusChanged | `order.status_update` | Both parties | immediate | orders |
| OrderCompleted | `order.completed` | Both parties | immediate | orders |
| OrderCancelled | `order.cancelled` | Both parties | immediate | orders |
| DeliverySubmitted | `order.delivery_submitted` | Client | immediate | orders |
| DeliveryApproved | `order.delivery_approved` | Freelancer | immediate | orders |

Checkout email includes fee breakdown per PLATFORM_FEE_SYSTEM:

```
Buyurtma summasi:     $X
Platforma komissiyasi (5%): $Y
Jami:                 $Z
```

---

## 5. Escrow & disputes

| Event | Template ID | Recipient | Priority | Default pref |
|-------|-------------|-----------|----------|--------------|
| EscrowFunded | `escrow.funded` | Client + freelancer | immediate | escrow |
| EscrowMilestoneReleased | `escrow.released` | Freelancer (primary), client (copy) | immediate | escrow |
| EscrowDisputeOpened | `escrow.dispute_opened` | Both + admin DL | immediate | escrow |
| EscrowDisputeResolved | `escrow.dispute_resolved` | Both parties | immediate | escrow |
| EscrowFrozenByAdmin | `escrow.frozen` | Both parties | immediate | escrow |
| EscrowRefunded | `escrow.refunded` | Client | immediate | escrow |

**Funded subject:** `Eskrou moliyalashtirildi — {orderTitle}`  
Maps `notifyEscrowFunded`, `notifyEscrowReleased`.

Admin DL: `finance@ishbor.uz` on dispute opened (internal template `admin.dispute_new`).

---

## 6. Wallet & payments

| Event | Template ID | Recipient | Priority | Default pref |
|-------|-------------|-----------|----------|--------------|
| WalletDeposited | `payment.deposit_success` | User | immediate | payments |
| DepositFailed | `payment.deposit_failed` | User | immediate | payments |
| WithdrawalRequested | `payment.withdraw_pending` | User | immediate | payments |
| WithdrawalCompleted | `payment.withdraw_success` | User | immediate | payments |
| WithdrawalFailed | `payment.withdraw_failed` | User | immediate | payments |
| WithdrawalRejectedByAdmin | `payment.withdraw_rejected` | User | immediate | payments |

Deposit receipt shows 1% fee line: `To'ldirish komissiyasi`.

---

## 7. Reviews & trust

| Event | Template ID | Recipient | Priority | Default pref |
|-------|-------------|-----------|----------|--------------|
| ReviewSubmitted | `review.received` | Reviewee | digest | reviews |
| ReviewResponsePosted | `review.response` | Reviewer | optional | reviews |
| TrustScoreDropAlert | `trust.score_drop` | User | digest | system |

Maps `notifyReviewReceived`.

---

## 8. Portfolio & listings

| Event | Template ID | Recipient | Priority | Default pref |
|-------|-------------|-----------|----------|--------------|
| PortfolioApproved | `portfolio.approved` | Owner | immediate | portfolio |
| PortfolioRejected | `portfolio.rejected` | Owner | immediate | portfolio |
| ProjectPublished | `listing.project_live` | Owner | optional | listings |
| ServicePublished | `listing.service_live` | Owner | optional | listings |
| FeaturedListingActivated | `listing.featured` | Owner | optional | listings |

Maps `notifyPortfolioApproved`.

---

## 9. Subscriptions & credits

| Event | Template ID | Recipient | Priority | Default pref |
|-------|-------------|-----------|----------|--------------|
| SubscriptionActivated | `subscription.activated` | User | immediate | billing |
| SubscriptionRenewed | `subscription.renewed` | User | immediate | billing |
| SubscriptionRenewalFailed | `subscription.payment_failed` | User | immediate | billing |
| SubscriptionCancelled | `subscription.cancelled` | User | immediate | billing |
| CreditsPurchased | `credits.purchased` | User | optional | billing |

Maps subscription-store notifications.

---

## 10. Referral & job alerts

| Event | Template ID | Recipient | Priority | Default pref |
|-------|-------------|-----------|----------|--------------|
| ReferralCredited | `referral.credited` | Referrer | optional | marketing |
| ReferralWelcomeBonus | `referral.welcome` | Referred user | optional | marketing |
| JobAlertMatch | `alerts.job_match` | Freelancer | digest | job_alerts |
| SavedSearchMatch | `alerts.search_match` | User | digest | job_alerts |

Digest: daily 09:00 Asia/Tashkent if multiple matches.

---

## 11. Messaging

| Event | Template ID | Recipient | Priority | Default pref |
|-------|-------------|-----------|----------|--------------|
| MessageReceivedOffline | `message.new` | Recipient (offline >15min) | digest | messages |
| UnreadMessagesReminder | `message.reminder` | User | digest | messages |

Real-time online users get in-app + WS only — no email spam.

---

## 12. Admin & compliance

| Event | Template ID | Recipient | Priority | Default pref |
|-------|-------------|-----------|----------|--------------|
| VerificationApproved | `admin.verification_approved` | User | immediate | always |
| VerificationRejected | `admin.verification_rejected` | User | immediate | always |
| AccountSuspended | `admin.account_suspended` | User | immediate | always |
| AccountBanned | `admin.account_banned` | User | immediate | always |
| AccountReactivated | `admin.account_reactivated` | User | immediate | always |
| ModerationContentRejected | `admin.content_rejected` | Content owner | immediate | always |
| DisputeResolutionNotice | `admin.dispute_resolution` | Both parties | immediate | escrow |

Maps `notifyAdminAction()` — kind `admin` in-app, email parallel.

---

## 13. Agency & team

| Event | Template ID | Recipient | Priority | Default pref |
|-------|-------------|-----------|----------|--------------|
| AgencyInviteSent | `agency.invite` | Invitee | immediate | agency |
| AgencyMemberJoined | `agency.member_joined` | Agency owner | optional | agency |
| AgencyMemberRemoved | `agency.member_removed` | Removed user | immediate | agency |

From `agency-store.ts` notification patterns.

---

## 14. AI & system (low priority)

| Event | Template ID | Recipient | Priority | Default pref |
|-------|-------------|-----------|----------|--------------|
| ProfileCompletionNudge | — | User | ❌ email off | in-app only |
| WeeklyMarketplaceDigest | `digest.weekly` | Opt-in users | weekly | marketing |
| PlatformMaintenanceNotice | `system.maintenance` | All active users | immediate | always |

AI smart notifications (`ai-smart-notifications.ts`) — in-app only by default.

---

## 15. EmailWorker implementation

```python
@celery.task(queue="notifications")
def send_email(job_id: str):
    job = email_jobs.get(job_id)
    if not prefs.email_enabled(job.category, job.user_id):
        return
    html = render_template(f"{job.template_id}.html", **job.context)
    resend.emails.send(
        from_="Ishbor <noreply@ishbor.uz>",
        to=[job.to_email],
        subject=job.subject_uz,
        html=html,
    )
```

---

## 16. Failure handling

| Failure | Action |
|---------|--------|
| Hard bounce | Set `users.email_verified=false`; in-app warning |
| Soft bounce | Retry 3× exponential backoff |
| Complaint/spam | Unsubscribe marketing categories |
| Template render error | Dead letter queue + P2 alert |

---

## 17. Unsubscribe categories

Users disable via `/settings` → maps to `notification_preferences.email`:

```json
{
  "proposals": true,
  "orders": true,
  "escrow": true,
  "messages": true,
  "marketing": false,
  "job_alerts": true
}
```

Transactional emails (auth, admin enforcement) ignore unsubscribe — legally required delivery.

---

*Every Ishbor domain event with user impact has an email template row. If an event is not in this matrix, it is in-app only until product adds email coverage.*
