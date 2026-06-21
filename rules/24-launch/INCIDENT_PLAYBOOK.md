# INCIDENT_PLAYBOOK.md

**Ishbor marketplace — common incidents and response procedures**  
**On-call:** Follow detect → triage → mitigate → resolve → postmortem

---

## 1. Incident severity

| Level | Definition | Response time | Examples |
|-------|------------|---------------|----------|
| **SEV-1** | Platform down or money at risk | 15 min | Site 503, wallet corruption, payment duplicates |
| **SEV-2** | Major feature broken | 1 hour | Login fail, checkout broken, WS down |
| **SEV-3** | Degraded experience | 4 hours | Slow search, AI fallback, email delay |
| **SEV-4** | Minor issue | Next business day | UI glitch, non-critical admin bug |

---

## 2. Response workflow

```text
1. DETECT   — Alert, user report, monitoring
2. TRIAGE   — Assign severity, incident commander
3. MITIGATE — Feature flag, rollback, scale (fastest fix)
4. RESOLVE  — Root cause fix, deploy
5. COMMUNICATE — Status page, support, stakeholders
6. POSTMORTEM — Blameless RCA within 48h (SEV-1/2)
```

### Incident commander

| SEV | Commander |
|-----|-----------|
| 1 | Launch lead |
| 2 | Backend or frontend lead (by domain) |
| 3–4 | On-call engineer |

---

## 3. SEV-1: Site completely down

### Symptoms

- ishbor.uz returns 502/503/504
- Uptime monitor red
- Health check `/health` failing

### Diagnosis

```text
1. curl -I https://ishbor.uz
2. ssh deploy@vps — docker compose ps
3. docker compose logs api --tail 100
4. systemctl status nginx
5. df -h  (disk full?)
6. docker compose exec postgres pg_isready
```

### Common causes & fixes

| Cause | Fix |
|-------|-----|
| API container crashed | `docker compose restart api` |
| OOM kill | Increase memory / reduce workers |
| Disk full | Clear logs, expand volume |
| Nginx misconfig | Restore backup config, `nginx -t` |
| SSL expired | `certbot renew` |
| DDoS | Enable Cloudflare under attack mode |

### Mitigation

- [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) Type A if bad deploy
- Maintenance page if extended outage

---

## 4. SEV-1: Wallet / escrow data corruption

### Symptoms

- Negative wallet balances
- Escrow released twice
- Order paid but escrow not funded
- User reports missing funds

### Immediate actions

```text
1. SEV-1 declare — notify launch lead + finance
2. PAYMENTS_LIVE=false  (stop new money movement)
3. Preserve logs: docker compose logs api worker > incident_logs.txt
4. DB snapshot: pg_dump immediately
5. Identify affected user_ids and order_ids
6. Do NOT run ad-hoc SQL without second reviewer
```

### Investigation queries

```sql
-- Negative balances
SELECT * FROM wallets WHERE available < 0;

-- Duplicate escrow releases
SELECT order_id, COUNT(*) FROM escrow_events 
WHERE event_type = 'released' GROUP BY order_id HAVING COUNT(*) > 1;

-- Orphan orders (paid but no escrow)
SELECT o.id FROM orders o 
LEFT JOIN escrow_workflows e ON e.order_id = o.id 
WHERE o.status = 'paid' AND e.id IS NULL;
```

### Resolution

- Manual ledger adjustment with audit trail
- Finance admin documents each correction
- Reconciliation script before re-enabling payments

---

## 5. SEV-1: Authentication bypass / data leak

### Symptoms

- User sees another user's orders/messages
- Security researcher report
- API returns data without auth check

### Immediate actions

```text
1. SEV-1 — all hands
2. Identify affected endpoint
3. If exploitable: take API offline OR block route at Nginx
4. Force session rotation: delete all sessions (users re-login)
5. Preserve access logs
6. Legal review if PII exposed
```

### Fix pattern

- Fail-closed entity guard per RBAC_SPECIFICATION
- Return 404 not 403 for cross-user access
- Deploy hotfix → full auth integration test pass

---

## 6. SEV-2: Login / registration broken

### Symptoms

- 500 on POST /auth/login
- OAuth redirect loop
- OTP SMS not delivered

### Diagnosis

| Check | Command/action |
|-------|----------------|
| API logs | `docker compose logs api \| grep auth` |
| Redis | Session store connectivity |
| Postgres | users table accessible |
| Eskiz balance | SMS provider dashboard |
| Rate limit | Redis keys `auth:rl:*` |

### Fixes

| Cause | Fix |
|-------|-----|
| bcrypt CPU spike | Scale API workers |
| Redis down | Restart redis, sessions rebuild |
| Eskiz API key expired | Rotate key in .env |
| Google OAuth redirect mismatch | Fix OAuth console URIs |
| Migration broke users table | Forward-fix migration |

### Workaround

- Demo auth ONLY on staging, never production workaround

---

## 7. SEV-2: Checkout / payment failures

### Symptoms

- Checkout spinner forever
- Payme callback 500
- Orders stuck in `pending_payment`

### Diagnosis

```text
1. Check payment service logs
2. Verify Payme merchant credentials
3. Check idempotency key collisions
4. Test sandbox transaction manually
```

### Fixes

| Cause | Fix |
|-------|-----|
| Callback URL wrong | Update Payme merchant settings |
| SSL cert issue on callback | Fix api.ishbor.uz cert |
| Idempotency bug | Hotfix + reconcile stuck orders |
| Gateway timeout | Increase timeout, retry job |

### User communication

*To'lov vaqtincha qabul qilinmayapti. Jamoa muammoni hal qilmoqda. Buyurtmangiz saqlanib qoldi.*

---

## 8. SEV-2: WebSocket / chat down

### Symptoms

- Messages not delivering real-time
- WS connection immediate disconnect
- Notification badges stale

### Diagnosis

| Check | Detail |
|-------|--------|
| Nginx WS upgrade | `proxy_set_header Upgrade $http_upgrade` |
| Sticky sessions | IP hash if multi-instance |
| Redis pub/sub | `PUBSUB CHANNELS` |
| Connection limit | `ulimit -n` |

### Mitigation

- `WEBSOCKET_ENABLED=false` → HTTP polling fallback (if implemented)
- Restart API + Redis

---

## 9. SEV-3: Slow performance / high latency

### Symptoms

- p95 >2s on browse
- User complaints "sekin"
- k6 thresholds failing

### Diagnosis

| Layer | Tool |
|-------|------|
| API | Grafana p95 latency |
| DB | `pg_stat_statements`, slow query log |
| Redis | `INFO memory`, hit rate |
| Nginx | Access log response times |

### Fixes

| Cause | Fix |
|-------|-----|
| Missing index | Add index, deploy migration |
| Cache cold | Warm cache, extend TTL |
| Connection pool exhausted | Increase PgBouncer pool |
| N+1 queries | Fix repository layer |
| Traffic spike | Scale API instances |

See [SCALING_STRATEGY.md](../25-scaling/SCALING_STRATEGY.md).

---

## 10. SEV-3: AI tools failing / cost spike

### Symptoms

- AI returns errors
- OpenAI bill alert
- Users report empty generations

### Immediate actions

```text
1. AI_LLM_ENABLED=false  (instant fallback to rules)
2. Check ai_usage_logs for abuse (single user >10k tokens/day)
3. Verify API key validity and quota
4. Check rate limit false positives
```

### Fixes

| Cause | Fix |
|-------|-----|
| Provider outage | Fallback chain → rule-based |
| Key expired | Rotate OPENAI_API_KEY |
| Abuse | Suspend user, tighten rate limits |
| Prompt bug (infinite loop) | Hotfix prompt template |

---

## 11. SEV-3: Email / SMS delivery failures

### Symptoms

- Verification emails not arriving
- OTP SMS timeout

### Diagnosis

- Celery worker logs (`email`, `sms` queues)
- Resend/Postmark dashboard
- Eskiz.uz balance and delivery reports

### Fixes

- Restart Celery workers
- Failover SMTP provider
- Queue backlog — scale workers

---

## 12. SEV-3: MinIO / file upload failures

### Symptoms

- Avatar upload 500
- Portfolio images broken
- KYC upload fails

### Diagnosis

```text
docker compose logs minio
mc admin info local
df -h  (disk)
```

### Fixes

- Disk full → expand volume
- Presigned URL clock skew → sync NTP
- Bucket policy → re-apply FILE_SECURITY.md ACLs

---

## 13. Communication templates

### SEV-1 initial

```text
🔴 Ishbor xizmatida uzilish
Biz muammoni aniqladik va hal qilmoqdamiz.
Yangilanishlar: status.ishbor.uz
```

### SEV-2 update

```text
🟡 Ishbor: {feature} vaqtincha ishlamayapti
{workaround if any}
Jamoa ishlayapti.
```

### Resolved

```text
🟢 Muammo hal qilindi
Sabab: {brief}
Vaqt: {duration}
```

---

## 14. Postmortem template

```markdown
## Incident: {title}
- **Date:** 
- **Duration:** 
- **Severity:** 
- **Impact:** {users affected, money at risk}

### Timeline
- HH:MM — Detected
- HH:MM — Mitigated
- HH:MM — Resolved

### Root cause


### What went well


### What went wrong


### Action items
| Action | Owner | Due |
|--------|-------|-----|
```

Store in `rules/99-reports/incidents/`.

---

## 15. Escalation contacts

| Role | Contact method |
|------|----------------|
| On-call engineer | PagerDuty |
| Launch lead | Phone + Telegram |
| Founder | Telegram (SEV-1 only) |
| Payment provider | Payme merchant support |
| VPS provider | Hetzner/Selectel ticket |

---

## 16. References

- [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md)
- [MONITORING_ARCHITECTURE.md](../11-backend/MONITORING_ARCHITECTURE.md)
- [DISASTER_RECOVERY.md](../11-backend/infrastructure/DISASTER_RECOVERY.md)
- [SECURITY_ARCHITECTURE.md](../11-backend/security/SECURITY_ARCHITECTURE.md)

---

*Last updated: 2026-06-20*
