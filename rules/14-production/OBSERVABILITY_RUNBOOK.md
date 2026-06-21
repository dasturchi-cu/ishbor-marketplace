# OBSERVABILITY_RUNBOOK.md

## Health endpoints

| Endpoint | Function | Use |
|----------|----------|-----|
| GET `/status` (UI) | getHealth | Public status page |
| Server fn getHealth | DB ping, version, env | Load balancer probe |
| Server fn getReady | ready + mode demo/database | K8s readiness |

## Logging standards (target)

```typescript
// Structured log shape
{ level, msg, requestId, userId?, route, durationMs, error? }
```

- **Request ID:** middleware assigns `x-request-id` (DEPLOYMENT_ARCHITECTURE)
- **Never log:** passwords, session tokens, full card numbers
- **Always log:** auth failures, escrow mutations, admin actions

## Error tracking

- Client: `reportLovableError` in `__root.tsx` error boundary
- Server: wrap handlers with try/catch → `toErrorResponse` (server/lib/errors.ts)
- Target: Sentry DSN via `SENTRY_DSN` env

## Metrics (production target)

| Metric | Alert threshold |
|--------|-----------------|
| API p95 latency | > 2s |
| Error rate 5xx | > 1% / 5min |
| Login failure rate | > 20% / 5min |
| Escrow fund failures | any |
| DB connection pool | > 80% |
| WS disconnect rate | > 10% / min |

## Dashboards

1. **Grafana:** infra + API golden signals
2. **Admin /admin/system:** product health summary
3. **Founder /admin/founder:** business KPIs

## On-call checklist

1. Check `/status` and getReady
2. Verify Neon/Railway status
3. Check error tracker for spike
4. Review audit log `/admin/audit`
5. Escalate payment webhook failures to finance runbook

## Local dev monitoring

```bash
npm run dev
curl http://localhost:8081/status
npm run db:studio  # drizzle studio when DATABASE_URL set
```
