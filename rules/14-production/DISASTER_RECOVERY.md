# DISASTER_RECOVERY.md

## RPO / RTO targets (production)

| Tier | RPO | RTO | Scope |
|------|-----|-----|-------|
| Database | 1 hour | 4 hours | Neon PITR |
| File storage (R2) | 24 hours | 8 hours | Versioning |
| Application | 0 (stateless) | 30 min | Redeploy |

## Neon PostgreSQL backup

- Enable **point-in-time recovery** on production branch
- Staging branch: daily reset from prod snapshot (sanitized)
- Migration rollback: `drizzle-kit` down migrations kept in repo

## Application recovery

1. Redeploy last known good image from CI build artifact
2. Verify `getReady` returns `{ ready: true, mode: "database" }`
3. Run smoke e2e against staging
4. Promote to production

## Data corruption (localStorage era — demo)

- User impact: single-browser data loss
- Mitigation: migrate to server authority (Backend Phase 2–3)
- QA: `clearStressSeed()` in stress-seed.ts

## Payment incident

1. Disable Payme webhook processing (feature flag)
2. Freeze escrow releases via admin
3. Reconcile ledger from Payme export vs revenue_ledger
4. Customer comms template (Uzbek) in support playbook

## Secrets rotation

| Secret | Rotation |
|--------|----------|
| SESSION_SECRET | Invalidate all sessions |
| DATABASE_URL | Neon rotate + redeploy |
| Payme keys | Provider dashboard |

Store in Railway/env — never commit.

## Contact escalation

1. On-call engineer
2. Founder/admin (admin@ishbor.uz demo)
3. Legal for dispute mass-incident

## Test DR quarterly

- [ ] Restore Neon branch to new instance
- [ ] Full deploy from scratch via CI
- [ ] Verify auth + one checkout flow
- [ ] Document actual RTO achieved
