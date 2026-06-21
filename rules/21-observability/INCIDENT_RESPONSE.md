# INCIDENT_RESPONSE.md

**Purpose:** Incident severity levels, on-call procedures, and communication templates for Ishbor  
**Stack:** VPS · Docker · Nginx · FastAPI · PostgreSQL  
**Audience:** On-call engineer, founder, support team

---

## 1. Incident definition

An incident is any unplanned event that:

- Degrades or stops Ishbor service for users
- Risks financial loss (escrow, wallet, payment webhooks)
- Risks data breach or unauthorized access
- Fails SLA commitments to users or partners

Not an incident: planned maintenance (with notice), single-user bugs, staging-only issues.

---

## 2. Severity levels

| Level | Name | Criteria | Response target | Examples |
|-------|------|----------|-----------------|----------|
| **P0** | Critical | Platform unusable or financial integrity at risk | **15 minutes** | API down, checkout broken, webhook forgery, suspected breach |
| **P1** | High | Major feature degraded, significant user impact | **30 minutes** | 5xx >1%, auth failures spike, disk critical, backup failed |
| **P2** | Medium | Partial degradation, workaround exists | **4 hours** | Slow API p95, Celery backlog, WS disconnects elevated |
| **P3** | Low | Minor issue, limited impact | **Next business day** | Non-critical UI bug, staging alert, metric drift |

Escalate severity if impact grows — P2 → P1 if checkout affected.

---

## 3. On-call rotation

### 3.1 Roles

| Role | Responsibility | Contact |
|------|----------------|---------|
| **Primary on-call** | First responder, triage, fix or escalate | Rotating engineer |
| **Secondary on-call** | Backup if primary unreachable in 15 min | Engineering lead |
| **Founder / product** | P0 financial decisions, user communication approval | Founder |
| **Finance admin** | Payment gateway liaison, withdrawal holds | Designated admin |

### 3.2 Rotation schedule

- Weekly rotation — document in shared calendar
- Handoff: review open alerts, recent deploys, known issues
- Coverage hours: 24/7 for P0/P1; P2/P3 business hours (Asia/Tashkent)

### 3.3 On-call toolkit access

On-call engineer must have:

- SSH key to production VPS (`deploy` user)
- Telegram `#ishbor-p0` and `#ishbor-alerts` channels
- Sentry org access (ishbor-api, ishbor-web projects)
- Grafana via SSH tunnel: `ssh -L 3000:localhost:3000 deploy@VPS`
- GitHub repo deploy permissions
- Payme/Humo merchant dashboard credentials (finance admin for P0 payment issues)

---

## 4. Incident response phases

```
Detect → Triage → Mitigate → Resolve → Post-mortem
```

### Phase 1 — Detect (0–5 min)

Sources:

| Source | Signal |
|--------|--------|
| Prometheus / Alertmanager | Automated P0–P3 alerts |
| Sentry | Error spike, new issue in checkout tag |
| Uptime probe | `/health/ready` failing |
| User reports | Support tickets, Telegram |
| Admin panel | `/admin/system` degraded status |
| Founder | Direct escalation |

### Phase 2 — Triage (5–15 min)

On-call checklist:

1. Acknowledge alert in Telegram — "Investigating [alert name]"
2. Check public status: `https://ishbor.uz/status` and `https://api.ishbor.uz/health/ready`
3. Check recent deploys — last 2 hours? Rollback candidate?
4. Check Sentry for new errors correlated with deploy SHA
5. Check Grafana: API 5xx, disk, PostgreSQL, Redis, Celery queues
6. Assign severity P0–P3
7. Open incident thread in Telegram `#ishbor-incidents`

**Do NOT check Neon/Railway/Supabase** — Ishbor is self-hosted VPS only.

### Phase 3 — Mitigate (immediate)

Priority order for P0:

| Issue | Immediate action |
|-------|------------------|
| API down | `docker compose ps` → restart api/nginx; check logs |
| Database down | Restart postgres container; check disk space |
| Checkout broken | Enable `MAINTENANCE_MODE` on checkout if needed; preserve escrow state |
| Webhook forgery | Block webhook IP at nginx; freeze wallet withdrawals |
| Suspected breach | Rotate `SESSION_SECRET`, revoke all sessions, freeze withdrawals |
| DDoS | Tighten nginx rate limits; contact provider |

Rollback deploy:

```bash
cd /opt/ishbor
export IMAGE_TAG=previous-known-good-sha
docker compose pull && docker compose up -d
```

### Phase 4 — Resolve

- Root cause identified and fixed
- `/health/ready` green for 15 consecutive minutes
- Error rate back to baseline
- Affected users identified (if P0/P1)
- Monitoring confirms stable

### Phase 5 — Post-mortem (within 72 hours)

Write report in `rules/99-reports/incidents/YYYY-MM-DD-title.md`:

| Section | Content |
|---------|---------|
| Summary | One paragraph — what happened |
| Timeline | UTC timestamps of detect, triage, mitigate, resolve |
| Impact | Users affected, duration, financial exposure |
| Root cause | Technical explanation |
| Fix | What was deployed |
| Prevention | Action items with owners and dates |
| Attachments | Grafana snapshot URL, Sentry issue links |

Blameless culture — focus on systems, not individuals.

---

## 5. Communication

### 5.1 Internal communication

| Severity | Channel | Update frequency |
|----------|---------|------------------|
| P0 | Telegram `#ishbor-p0` + `#ishbor-incidents` | Every 15 min until mitigated |
| P1 | Telegram `#ishbor-alerts` | Every 30 min |
| P2 | Slack `#ishbor-ops` | At triage + resolution |
| P3 | Ticket/backlog | At resolution |

Template — initial ack:

```
🔴 P0 INCIDENT — [short title]
Status: Investigating
Impact: [checkout down / API 503 / etc]
On-call: @[name]
Started: [HH:MM UZT]
Thread: this message
```

Template — update:

```
Update [HH:MM UZT]: Root cause identified — [brief]. Mitigation in progress.
ETA: [time or unknown]
```

Template — resolved:

```
✅ RESOLVED [HH:MM UZT]
Duration: [X minutes]
Cause: [one line]
Fix: [deploy rollback / config change]
Post-mortem: [link] by [date]
```

### 5.2 External communication (users)

| Severity | Action |
|----------|--------|
| P0 >15 min | Update `/status` page — "Vaqtincha nosozlik" |
| P0 >30 min | In-app banner if frontend accessible |
| P0 payment | Email affected users within 24h (founder approval) |
| P1 | Status page update optional |
| P2/P3 | No public communication unless user-visible |

Status page copy (Uzbek):

```
Tizimda vaqtincha nosozlik kuzatilmoqda. Jamoamiz muammoni hal qilish ustida ishlamoqda.
Taxminiy tiklanish vaqti: [HH:MM] (Toshkent vaqti).
```

Never disclose security breach details publicly until legal review (P0 breach).

### 5.3 Partner communication

| Partner | When to contact |
|---------|-----------------|
| Payme / Humo | Webhook failures >30 min |
| Eskiz SMS | OTP delivery failure rate >10% |
| Resend email | Transactional email bounce spike |
| VPS provider | Hardware failure, network outage |

Finance admin leads payment partner communication.

---

## 6. Scenario runbooks

### 6.1 API returning 503

```
1. curl https://api.ishbor.uz/health/ready
2. ssh deploy@VPS → docker compose ps
3. docker compose logs api --tail 100
4. Check postgres: docker compose exec postgres pg_isready
5. Check redis: docker compose exec redis redis-cli ping
6. Restart if transient: docker compose restart api
7. If disk full → clean logs, expand volume
```

### 6.2 Payment webhook failures (P0)

```
1. Check nginx webhook allowlist — provider IP changed?
2. Check api logs for signature verification errors
3. Check Celery payments queue depth
4. DO NOT manually credit wallets — use reconciliation job
5. Contact Payme support if provider-side issue
6. Replay missed webhooks from gateway dashboard after fix
```

### 6.3 Suspected account breach (P0)

```
1. Identify affected user IDs from audit_logs
2. POST /admin/users/{id}/revoke-sessions for each
3. Rotate SESSION_SECRET → forces all re-login
4. Enable stricter auth rate limits temporarily
5. Review wallet transactions for anomalies
6. Freeze withdrawals platform-wide if widespread
7. Notify founder immediately
8. Document for potential legal/compliance review
```

### 6.4 Database corruption / restore

```
1. Stop api and celery: docker compose stop api celery-worker celery-beat
2. Identify last good backup in /opt/ishbor/backups/postgres/
3. Restore to staging first — verify integrity
4. Restore production with founder approval
5. Replay Celery jobs for missed webhooks
6. Post-mortem required
```

See [../11-backend/infrastructure/DISASTER_RECOVERY.md](../11-backend/infrastructure/DISASTER_RECOVERY.md).

---

## 7. Escalation matrix

| Condition | Escalate to |
|-----------|-------------|
| Primary unreachable 15 min | Secondary on-call |
| P0 unresolved 30 min | Engineering lead + founder |
| Financial exposure >$1000 | Founder + finance admin |
| Data breach confirmed | Founder + legal counsel |
| VPS provider outage | Founder (user comms decision) |

---

## 8. Incident metrics (review monthly)

| Metric | Target |
|--------|--------|
| P0 mean time to acknowledge (MTTA) | <5 min |
| P0 mean time to resolve (MTTR) | <60 min |
| Post-mortems completed | 100% of P0/P1 within 72h |
| Repeat incidents (same root cause) | 0 |

Track in Grafana or spreadsheet — review in monthly ops meeting.

---

## 9. Related documents

- [ALERTING_RULES.md](./ALERTING_RULES.md)
- [UPTIME_MONITORING.md](./UPTIME_MONITORING.md)
- [SENTRY_GUIDE.md](./SENTRY_GUIDE.md)
- [../11-backend/MONITORING_ARCHITECTURE.md](../11-backend/MONITORING_ARCHITECTURE.md)
- [../11-backend/infrastructure/DISASTER_RECOVERY.md](../11-backend/infrastructure/DISASTER_RECOVERY.md)
- [../11-backend/security/SECURITY_ARCHITECTURE.md](../11-backend/security/SECURITY_ARCHITECTURE.md)
- [../14-production/OBSERVABILITY_RUNBOOK.md](../14-production/OBSERVABILITY_RUNBOOK.md)

---

*P0: 15 min response — checkout, webhooks, breach. Communicate via Telegram internally, /status externally. Post-mortem within 72h in rules/99-reports/incidents/.*
