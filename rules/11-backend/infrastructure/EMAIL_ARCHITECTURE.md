# EMAIL_ARCHITECTURE.md

**Providers:** Resend (primary) / Postmark (fallback)  
**Use case:** Transactional email — auth, orders, escrow, admin alerts  
**Language:** Uzbek templates with HTML + plain text

---

## 1. Provider selection

| Provider | Strength | Ishbor use |
|----------|----------|------------|
| Resend | Developer-friendly API, good deliverability | Primary P0 |
| Postmark | High deliverability, detailed analytics | Fallback P1 |

Switch via `EMAIL_PROVIDER=resend|postmark` env var — same template engine.

---

## 2. Email categories

| Category | Examples | Priority |
|----------|----------|----------|
| Auth | Password reset, email verify, OTP backup | Critical |
| Transactional | Order created, escrow funded, milestone released | High |
| Notifications | Proposal received, message offline digest | Normal |
| Escrow/dispute | Dispute opened, resolution | High |
| Admin | Large withdrawal alert, backup failure | High |
| Marketing | Newsletter, promotions | Opt-in only — disabled P0 |

Maps NOTIFICATION_ARCHITECTURE.md email channel.

---

## 3. Architecture flow

```
Domain Event (OrderCreated)
    → NotificationWorker
    → Check notification_preferences.email.orders
    → Enqueue EmailJob (Celery queue: default)
    → EmailService.send(template_id, to, context)
    → Resend API POST /emails
    → Log delivery_id + status
```

Async — never block API request on email send.

---

## 4. EmailService implementation

```python
# server/services/email_service.py
class EmailService:
    async def send(self, template_id: str, to: str, context: dict, request_id: str):
        template = TEMPLATES[template_id]  # Uzbek subject + body
        html = render_jinja(template.html, context)
        text = render_jinja(template.text, context)

        if settings.EMAIL_PROVIDER == "resend":
            response = await resend.Emails.send({
                "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
                "to": [to],
                "subject": template.subject.format(**context),
                "html": html,
                "text": text,
                "headers": {"X-Entity-Ref-ID": request_id},
            })
        elif settings.EMAIL_PROVIDER == "postmark":
            response = await postmark.send(...)

        logger.info("email_sent", template_id=template_id, to_hash=hash_email(to))
        return response
```

---

## 5. Template catalog (Uzbek)

| Template ID | Subject | Trigger |
|-------------|---------|---------|
| `auth.password_reset` | Parolni tiklash | POST /auth/forgot-password |
| `auth.email_verify` | Email tasdiqlash | Registration |
| `order.created` | Buyurtma yaratildi | OrderCreated event |
| `escrow.funded` | Eskrou to'ldirildi | EscrowFunded event |
| `escrow.milestone_released` | Bosqich to'landi | EscrowMilestoneReleased |
| `escrow.dispute_opened` | Nizo ochilgan | DisputeOpened |
| `proposal.received` | Yangi taklif | ApplicationSubmitted |
| `withdrawal.completed` | Pul yechib olindi | WithdrawalCompleted |

HTML templates: `server/templates/email/{template_id}.html` — responsive, `#2563EB` primary color.

---

## 6. DNS configuration

For ishbor.uz deliverability:

| Record | Value |
|--------|-------|
| SPF | `v=spf1 include:amazonses.com include:spf.resend.com ~all` |
| DKIM | Resend/Postmark provided CNAME records |
| DMARC | `v=DMARC1; p=quarantine; rua=mailto:dmarc@ishbor.uz` |
| Return-Path | Provider bounce domain |

Verify in Resend dashboard before production send.

---

## 7. Environment variables

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
POSTMARK_SERVER_TOKEN=       # fallback
EMAIL_FROM=noreply@ishbor.uz
EMAIL_FROM_NAME=Ishbor
EMAIL_REPLY_TO=support@ishbor.uz
EMAIL_ENABLED=true           # false in local dev (log only)
```

Local dev: `EMAIL_ENABLED=false` — emails logged to stdout instead of sent.

---

## 8. Retry and failure handling

| Failure | Action |
|---------|--------|
| 429 rate limit | Celery retry 3× exponential backoff |
| Invalid email | Log warning, skip — don't retry |
| Provider outage | Queue jobs, alert P1, switch to Postmark |
| Bounce | Mark user email unverified, notify admin |

Store delivery status in `email_logs` table (P1):

```sql
CREATE TABLE email_logs (
  id uuid PRIMARY KEY,
  user_id uuid,
  template_id varchar(100),
  provider varchar(20),
  provider_message_id varchar(255),
  status enum('sent','delivered','bounced','failed'),
  created_at timestamptz DEFAULT now()
);
```

---

## 9. User preferences

Respect `notification_preferences.email.*` toggles — see NOTIFICATION_ARCHITECTURE.md.

Critical auth emails (password reset) bypass preferences — security requirement.

Marketing emails require explicit `marketing: true` opt-in — default false.

---

## 10. Admin alerts

High-priority admin emails bypass user preferences:

- Backup failure
- Webhook signature failure spike
- Large withdrawal request (>5000 USD equivalent)
- Dispute open >72h unresolved

Sent to `ADMIN_ALERT_EMAIL` env var distribution list.

---

## 11. Related documents

- [../NOTIFICATION_ARCHITECTURE.md](../NOTIFICATION_ARCHITECTURE.md)
- [ENVIRONMENT_STRATEGY.md](./ENVIRONMENT_STRATEGY.md)
- [SMS_ARCHITECTURE.md](./SMS_ARCHITECTURE.md)

---

*Resend for P0 transactional email. All templates in Uzbek. Email send is async via Celery — never blocks payment or auth flows.*
