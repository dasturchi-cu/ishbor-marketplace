# PRODUCTION_CHECKLIST.md

**Ishbor marketplace — comprehensive production go-live checklist**  
**Use:** Final verification before ishbor.uz GA · Complements [LAUNCH_CHECKLIST.md](../06-quality/LAUNCH_CHECKLIST.md)

---

## How to use

1. Assign owner per section
2. Mark PASS/FAIL/N/A with date
3. **Critical** items block launch
4. **Important** items need waiver from launch lead
5. Complete [BETA_LAUNCH_PLAN.md](./BETA_LAUNCH_PLAN.md) Phase 3 exit criteria first

---

## 1. Infrastructure (Critical)

### VPS & Docker

- [ ] **CRIT** Production VPS provisioned (8 vCPU, 16 GB RAM minimum)
- [ ] **CRIT** Docker Compose production stack running (api, worker, beat, postgres, redis, minio, nginx)
- [ ] **CRIT** SSL certificates valid (Let's Encrypt auto-renew)
- [ ] **CRIT** DNS A/AAAA records for ishbor.uz, api.ishbor.uz
- [ ] **CRIT** Firewall: 80/443 public only; DB/Redis internal
- [ ] **IMP** SSH key-only auth, fail2ban enabled
- [ ] **IMP** Automatic security updates configured
- [ ] **IMP** Docker log rotation configured

### Secrets

- [ ] **CRIT** `.env` production secrets set (not in git)
- [ ] **CRIT** `SESSION_SECRET` unique 64+ chars
- [ ] **CRIT** `POSTGRES_PASSWORD` strong random
- [ ] **CRIT** `OPENAI_API_KEY` server-only (if AI live)
- [ ] **CRIT** Payment gateway production keys (Payme merchant)
- [ ] **CRIT** `ALLOW_DEMO_AUTH=false`
- [ ] **CRIT** `DEBUG=false`, `APP_ENV=production`
- [ ] **IMP** Secrets rotation calendar documented

### Backups

- [ ] **CRIT** PostgreSQL daily pg_dump + WAL archiving
- [ ] **CRIT** Backup restore tested within 30 days
- [ ] **CRIT** MinIO bucket replication or daily sync
- [ ] **IMP** Off-site backup storage (S3-compatible)
- [ ] **IMP** RPO ≤1h, RTO ≤4h documented

---

## 2. Database (Critical)

- [ ] **CRIT** Alembic migrations at `head` on production
- [ ] **CRIT** No pending destructive migrations
- [ ] **CRIT** PgBouncer connection pooling active
- [ ] **CRIT** Indexes verified on hot paths (projects, orders, messages)
- [ ] **IMP** `ai_usage_logs` table present
- [ ] **IMP** Autovacuum tuned for production load
- [ ] **IMP** Read replica configured (if >5k users expected at launch)

---

## 3. Application (Critical)

### Build & deploy

- [ ] **CRIT** `npm run build` passes on release tag
- [ ] **CRIT** Docker image tagged with git SHA
- [ ] **CRIT** Health endpoints: `/health`, `/ready` return 200
- [ ] **CRIT** Graceful shutdown tested (SIGTERM)
- [ ] **IMP** Blue-green or rolling deploy procedure documented

### Auth

- [ ] **CRIT** HttpOnly cookie `ishbor_sid` — Secure, SameSite=Lax
- [ ] **CRIT** Registration + email verification flow
- [ ] **CRIT** Google OAuth production credentials
- [ ] **CRIT** Phone OTP via Eskiz production
- [ ] **CRIT** Demo accounts disabled for public registration
- [ ] **CRIT** Password reset flow end-to-end
- [ ] **IMP** Session rotation on privilege change
- [ ] **IMP** Cross-tab logout sync

### RBAC

- [ ] **CRIT** RoleGate: client cannot access `/my-services`
- [ ] **CRIT** RoleGate: freelancer cannot access `/checkout` as client-only flows
- [ ] **CRIT** AdminOnlyGate on `/admin/*`
- [ ] **CRIT** Entity 404 for cross-user order/escrow access
- [ ] **IMP** AgencyGate permissions verified

---

## 4. Marketplace flows (Critical)

### Client journey

- [ ] **CRIT** Post project → publish → visible on `/projects`
- [ ] **CRIT** Review proposals → accept → checkout
- [ ] **CRIT** Escrow fund → in_progress → release
- [ ] **CRIT** Wallet balance updates correctly
- [ ] **IMP** CRM client list populates after hire
- [ ] **IMP** Analytics events recorded

### Freelancer journey

- [ ] **CRIT** Browse projects → submit proposal
- [ ] **CRIT** Subscription proposal limits enforced
- [ ] **CRIT** Service create → publish
- [ ] **CRIT** Portfolio create → publish
- [ ] **CRIT** Order delivery → payment release
- [ ] **IMP** Withdrawal request (if live)

### Agency journey

- [ ] **IMP** Agency create → publish profile
- [ ] **IMP** Team invite flow
- [ ] **IMP** Case studies visible

---

## 5. Payments & escrow (Critical)

- [ ] **CRIT** Payme/Humo production sandbox → live switch verified
- [ ] **CRIT** Platform fee 5% calculated correctly
- [ ] **CRIT** Escrow state machine — no illegal transitions
- [ ] **CRIT** Idempotency keys on payment confirm
- [ ] **CRIT** Wallet ledger double-entry integrity
- [ ] **CRIT** No negative wallet balances possible
- [ ] **IMP** Refund flow tested
- [ ] **IMP** Dispute flow → admin resolution
- [ ] **IMP** Daily reconciliation job running

---

## 6. AI tools (Important)

- [ ] **IMP** AI proxy deployed with `AI_LLM_ENABLED` per rollout plan
- [ ] **IMP** Usage limits enforced per [AI_USAGE_LIMITS.md](../23-ai/AI_USAGE_LIMITS.md)
- [ ] **IMP** `ai_usage_logs` recording tokens
- [ ] **IMP** Rate limits active on `/api/ai/*`
- [ ] **IMP** Rule-based fallback when LLM unavailable
- [ ] **IMP** All 6 tools have working CTAs (no dead actions)

---

## 7. Realtime (Important)

- [ ] **IMP** WebSocket chat message delivery <2s p95
- [ ] **IMP** Notification badge updates
- [ ] **IMP** WS auth — no unauthenticated connections
- [ ] **IMP** Sticky sessions or Redis pub/sub for multi-instance

---

## 8. Security (Critical)

- [ ] **CRIT** HTTPS everywhere, HSTS enabled
- [ ] **CRIT** CSP headers configured
- [ ] **CRIT** CORS restricted to ishbor.uz domains
- [ ] **CRIT** Rate limiting on auth endpoints
- [ ] **CRIT** Input validation on all POST endpoints
- [ ] **CRIT** File upload virus scan (ClamAV)
- [ ] **CRIT** KYC documents private bucket ACL
- [ ] **IMP** Dependency audit (`npm audit`, `pip audit`)
- [ ] **IMP** Penetration test summary (or internal security audit)

---

## 9. UX & content (Critical)

- [ ] **CRIT** All user-facing copy in O'zbek
- [ ] **CRIT** No dead buttons (DEAD_ACTION_POLICY)
- [ ] **CRIT** No "coming soon" copy
- [ ] **CRIT** Every page has primary + empty state CTA
- [ ] **CRIT** Mobile 375px — landing, login, dashboard, checkout
- [ ] **CRIT** Terms `/terms`, privacy `/privacy` published
- [ ] **IMP** Help center `/help` complete
- [ ] **IMP** Error pages (404, 500) branded

---

## 10. Testing gates (Critical)

- [ ] **CRIT** Unit tests pass in CI
- [ ] **CRIT** E2E smoke + auth pass on production build
- [ ] **CRIT** E2E journeys J1–J6 pass on staging
- [ ] **CRIT** Integration tests pass (auth, checkout, escrow)
- [ ] **IMP** k6 load test 1000 VU pass on staging
- [ ] **IMP** QA_CHECKLIST stress test PASS all 4 criteria

---

## 11. Monitoring & observability (Critical)

- [ ] **CRIT** Prometheus metrics scraping API
- [ ] **CRIT** Grafana dashboards (API, DB, Redis, payments)
- [ ] **CRIT** Sentry error tracking (frontend + backend)
- [ ] **CRIT** Uptime monitor on ishbor.uz (1-min interval)
- [ ] **CRIT** PagerDuty/alert on 5xx >1%, disk >85%
- [ ] **IMP** Structured JSON logging
- [ ] **IMP** Audit log for admin actions
- [ ] **IMP** Status page status.ishbor.uz

---

## 12. Legal & compliance (Critical)

- [ ] **CRIT** Terms of service reviewed (Uzbekistan jurisdiction)
- [ ] **CRIT** Privacy policy (PDP Law compliance target)
- [ ] **CRIT** Escrow terms disclosed at checkout
- [ ] **CRIT** Platform fee disclosed
- [ ] **IMP** Cookie consent if analytics cookies used
- [ ] **IMP** Data retention policy documented

---

## 13. Operations (Important)

- [ ] **IMP** [INCIDENT_PLAYBOOK.md](./INCIDENT_PLAYBOOK.md) distributed to team
- [ ] **IMP** [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) rehearsed
- [ ] **IMP** On-call rotation defined
- [ ] **IMP** Support email support@ishbor.uz active
- [ ] **IMP** Runbook for common deploy tasks
- [ ] **IMP** Communication templates (downtime, incident)

---

## 14. Performance (Important)

- [ ] **IMP** Lighthouse home page ≥70 performance
- [ ] **IMP** API p95 <500ms browse endpoints
- [ ] **IMP** CDN serving static assets
- [ ] **IMP** Image optimization (WebP, lazy load)
- [ ] **IMP** Redis cache hit rate >60% on public lists

---

## 15. Go / no-go meeting

| Attendee | Sign-off |
|----------|----------|
| Launch lead | |
| Backend lead | |
| Frontend lead | |
| DevOps | |
| Founder | |

**Decision:** GO / NO-GO / GO with waivers

**Waivers (if any):**

| Item | Risk | Mitigation | Owner |
|------|------|------------|-------|
| | | | |

---

## 16. Post-launch (first 24h)

- [ ] Monitor error rates every 30 min
- [ ] Support queue <2h response
- [ ] Payment reconciliation manual check
- [ ] User registration funnel healthy
- [ ] Escrow transactions completing
- [ ] War room standup at +12h and +24h

---

## References

- [LAUNCH_CHECKLIST.md](../06-quality/LAUNCH_CHECKLIST.md) — route-by-route manual QA
- [BETA_LAUNCH_PLAN.md](./BETA_LAUNCH_PLAN.md)
- [PRODUCT_READY_CHECKLIST.md](../01-product/PRODUCT_READY_CHECKLIST.md)
- [22-testing/](../22-testing/README.md)

---

*Last updated: 2026-06-20*
