# BETA_LAUNCH_PLAN.md

**Ishbor marketplace — phased beta rollout in Uzbekistan**  
**Timeline:** Demo → Staging → Closed Beta → Open Beta → Production

---

## 1. Executive summary

Ishbor launches incrementally in Uzbekistan, validating the **hire → escrow → deliver → review** loop with real users before national marketing. Each phase has explicit entry criteria, user caps, and rollback triggers.

North star: **first successful escrow transaction** with a non-demo user in production.

---

## 2. Phase overview

```text
Phase 0: Demo (current)     — localStorage MVP, investor demos
Phase 1: Staging           — FastAPI + Postgres, internal QA
Phase 2: Closed beta       — 50–200 invited Uzbek users
Phase 3: Open beta         — 1,000 users, waitlist opens
Phase 4: Production GA     — ishbor.uz public launch
```

| Phase | URL | Auth | Payments |
|-------|-----|------|----------|
| 0 Demo | localhost / preview | Demo accounts | Simulated |
| 1 Staging | staging.ishbor.uz | Demo + test | Payme sandbox |
| 2 Closed β | beta.ishbor.uz | Invite code | Sandbox → limited real |
| 3 Open β | beta.ishbor.uz | Public register | Real (capped) |
| 4 GA | ishbor.uz | Public | Full production |

---

## 3. Phase 0 — Demo (current state)

**Status:** ~87% readiness (Phase 28)

### Characteristics

- Frontend TanStack Router + localStorage stores
- No FastAPI backend in production
- Demo accounts: sardor@asaka.uz, nargiza@ishbor.uz, admin@ishbor.uz
- AI tools: rule-based client generation

### Exit criteria to Phase 1

- [ ] FastAPI core deployed to staging
- [ ] Auth cookie `ishbor_sid` replaces localStorage session
- [ ] PostgreSQL schema migrated (Alembic head)
- [ ] E2E smoke + auth pass against staging
- [ ] LAUNCH_CHECKLIST critical items audited

---

## 4. Phase 1 — Staging (internal)

**Duration:** 2–4 weeks  
**Users:** Team + QA only (<20)

### Infrastructure

Per [DEPLOYMENT_GUIDE.md](../11-backend/infrastructure/DEPLOYMENT_GUIDE.md):

| Service | Staging config |
|---------|----------------|
| VPS | 4 vCPU, 8 GB RAM (Hetzner/Selectel) |
| PostgreSQL 16 | Docker, daily backup |
| Redis 7 | Sessions + rate limits |
| MinIO | File uploads |
| Nginx | SSL Let's Encrypt |
| FastAPI | 2 workers |
| Celery | 2 workers |

### Data

- Synthetic seed data (QA_CHECKLIST volumes)
- No production PII
- `ALLOW_DEMO_AUTH=true`
- `PAYME_TEST=true`

### Validation checklist

| Area | Gate |
|------|------|
| Auth | Register, login, OAuth Google, OTP |
| Marketplace | Post project, apply, hire |
| Payments | Escrow fund → release (sandbox) |
| Messages | WS chat delivery |
| AI proxy | Shadow mode, usage logs |
| Admin | Moderation, user suspend |
| Load | k6 browse 200 VUs pass |

### Exit criteria to Phase 2

- [ ] Integration test suite green
- [ ] E2E journeys J1–J6 pass
- [ ] Zero P0 bugs open
- [ ] Monitoring dashboards live
- [ ] INCIDENT_PLAYBOOK rehearsed

---

## 5. Phase 2 — Closed beta (Uzbekistan)

**Duration:** 4–6 weeks  
**Users:** 50–200 invited  
**Geography:** Uzbekistan only (IP soft-check + phone +998)

### Invite mechanism

| Channel | Quota |
|---------|-------|
| Founder network | 50 |
| Tashkent tech communities | 50 |
| University partnerships (TSU, INHA) | 50 |
| Waitlist early supporters | 50 |

Invite code: `BETA-{unique}` — single use, 7-day expiry.

### User mix target

| Persona | % |
|---------|---|
| Clients (SMB, startups) | 40% |
| Freelancers (design, dev) | 45% |
| Agencies | 10% |
| Admins/moderators | 5% |

### Feature flags (closed beta)

| Flag | Value |
|------|-------|
| `ALLOW_DEMO_AUTH` | true (for support) |
| `REGISTRATION_OPEN` | invite-only |
| `AI_LLM_ENABLED` | 10% rollout |
| `PAYMENTS_LIVE` | sandbox |
| `MAX_BETA_USERS` | 200 |

### Support

- Telegram group for beta users (Uzbek)
- In-app `/help` + support tickets
- 24h response SLA

### Weekly beta review

| Metric | Review |
|--------|--------|
| Registrations / activations | Growth |
| Projects posted | Supply |
| Proposals submitted | Demand |
| Escrow funded | **North star** |
| NPS survey | Qualitative |
| Support tickets | Pain points |

### Exit criteria to Phase 3

- [ ] ≥10 real escrow transactions
- [ ] ≥100 active users (7-day)
- [ ] D7 retention >25%
- [ ] No P0 incidents in 14 days
- [ ] Payment reconciliation clean

---

## 6. Phase 3 — Open beta

**Duration:** 4–8 weeks  
**Users:** Up to 1,000  
**URL:** beta.ishbor.uz (or ishbor.uz with beta banner)

### Changes from closed beta

| Aspect | Change |
|--------|--------|
| Registration | Public (Uzbekistan phone verify) |
| Payments | Production Payme/Humo (transaction cap 5M UZS) |
| AI | 50% LLM rollout |
| Marketing | Soft launch — Telegram, LinkedIn UZ |
| Demo auth | Disabled for new users |

### Transaction caps (risk mitigation)

| Limit | Value |
|-------|-------|
| Max escrow per order | 5,000 USD equivalent |
| Max daily platform volume | 50M UZS |
| New freelancer first withdrawal | Manual review |

### Load testing gate

- k6 mixed 1,000 VU test pass per [LOAD_TEST_PLAN.md](../22-testing/LOAD_TEST_PLAN.md)
- WebSocket 2,000 connections stable

### Exit criteria to Phase 4 (GA)

- [ ] 1,000 registered users
- [ ] ≥100 escrow transactions total
- [ ] GMV trend positive week-over-week
- [ ] PRODUCTION_CHECKLIST 100% critical items
- [ ] Legal: terms, privacy, escrow policy published

---

## 7. Phase 4 — Production GA

**URL:** https://ishbor.uz  
**Announcement:** Uzbekistan freelance marketplace launch

### Launch day sequence

| Time (UZT) | Action |
|------------|--------|
| T-7d | Freeze feature branch, QA only |
| T-3d | Production deploy (dark) |
| T-1d | Final E2E + load smoke |
| T-0 06:00 | DNS cutover |
| T-0 08:00 | Status page green |
| T-0 10:00 | Public announcement |
| T+0 24h | War room review |

See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md).

---

## 8. Uzbekistan-specific considerations

| Topic | Approach |
|-------|----------|
| Language | O'zbek primary, Russian secondary (future) |
| Payments | Humo, Uzcard, Payme — local methods first |
| SMS OTP | Eskiz.uz |
| Currency display | USD projects, UZS subscriptions |
| Business hours support | 09:00–18:00 UZT |
| Holidays | Navruz, Ramazon — reduced support staffing |
| Legal entity | Uzbekistan LLC partnership (target) |

---

## 9. Rollback triggers (any phase)

Immediate pause if:

- Wallet balance corruption detected
- Escrow double-release
- Auth bypass (cross-user data leak)
- Payment gateway duplicate charges
- >5% error rate for 10 minutes

Action: [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) + [INCIDENT_PLAYBOOK.md](./INCIDENT_PLAYBOOK.md)

---

## 10. Post-launch (30 days)

| Week | Focus |
|------|-------|
| 1 | Stability, hotfixes, support volume |
| 2 | AI LLM 100% rollout |
| 3 | Subscription monetization push |
| 4 | Retrospective, scale plan per [SCALING_STRATEGY.md](../25-scaling/SCALING_STRATEGY.md) |

---

## 11. References

- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
- [ENVIRONMENT_STRATEGY.md](../11-backend/infrastructure/ENVIRONMENT_STRATEGY.md)
- [PRODUCT_READY_CHECKLIST.md](../01-product/PRODUCT_READY_CHECKLIST.md)
- [PROJECT_BIBLE.md](../00-constitution/PROJECT_BIBLE.md)

---

*Last updated: 2026-06-20*
