# LOAD_TEST_PLAN.md

**Ishbor marketplace — k6 load and stress testing**  
**Tool:** Grafana k6 · **Target:** 1,000 concurrent users (beta) → 10,000 (launch)  
**Environment:** Staging only — never load test production without explicit approval

---

## 1. Purpose

Load tests validate Ishbor's **capacity, latency SLOs, and failure modes** under realistic Uzbekistan marketplace traffic. QA_CHECKLIST stress tests validate frontend with 50–100 entities; k6 tests validate **API + database + Redis + WebSocket** at concurrency.

Goals:

- Prove browse/search remains responsive at 1k concurrent users
- Validate login and session handling under burst
- Ensure checkout/escrow paths don't corrupt wallet state
- Identify connection pool exhaustion before launch
- Establish baseline for [SCALING_STRATEGY.md](../25-scaling/SCALING_STRATEGY.md)

---

## 2. Tooling

### k6 installation

```text
# CI: grafana/k6-action
# Local: choco install k6 (Windows) or brew install k6 (macOS)
```

### Directory layout (target)

```text
load/
├── README.md
├── config/
│   ├── staging.env.json
│   └── thresholds.json
├── scenarios/
│   ├── browse.js
│   ├── login.js
│   ├── checkout.js
│   └── websocket-chat.js
├── lib/
│   ├── auth.js
│   └── data.js
└── scripts/
    └── seed-staging.sh
```

### Environment variables

| Variable | Example |
|----------|---------|
| `BASE_URL` | `https://staging.ishbor.uz` |
| `API_URL` | `https://api.staging.ishbor.uz` |
| `K6_VUS` | 1000 |
| `K6_DURATION` | 10m |

---

## 3. Performance SLOs

| Scenario | p50 | p95 | p99 | Error rate |
|----------|-----|-----|-----|------------|
| Browse (public) | <100ms | <300ms | <500ms | <0.1% |
| Search | <150ms | <400ms | <800ms | <0.1% |
| Login | <200ms | <500ms | <1s | <0.5% |
| Authenticated dashboard | <200ms | <600ms | <1.2s | <0.1% |
| Checkout start | <300ms | <800ms | <2s | <0.1% |
| Checkout complete | <500ms | <2s | <5s | <0.01% |
| WebSocket message | — | <100ms | <200ms | <0.1% |

**Saturation signal:** p95 > 2× baseline for 5 min → scale alert.

---

## 4. Scenario 1 — Browse (public discovery)

**File:** `load/scenarios/browse.js`  
**Weight:** 50% of total VUs  
**Auth:** None

### Endpoints hit

| Step | Method | Path | Weight |
|------|--------|------|--------|
| Home | GET | `/` | 20% |
| Projects list | GET | `/api/projects?page=1` | 25% |
| Project detail | GET | `/api/projects/{slug}` | 20% |
| Services list | GET | `/api/services` | 15% |
| Freelancers | GET | `/api/freelancers` | 10% |
| Search | GET | `/api/search?q=figma` | 10% |

### VU profile

| Phase | VUs | Duration |
|-------|-----|----------|
| Ramp up | 0 → 500 | 3m |
| Steady | 500 | 5m |
| Ramp up | 500 → 1000 | 2m |
| Steady | 1000 | 10m |
| Ramp down | 1000 → 0 | 2m |

### Assertions

- `http_req_duration{p:95} < 500`
- `http_req_failed < 0.001`
- No 503 responses during steady state

---

## 5. Scenario 2 — Login burst

**File:** `load/scenarios/login.js`  
**Weight:** 15%  
**Auth:** Credentials from seed file

### Flow

```text
1. POST /auth/login { email, password }
2. Extract ishbor_sid cookie
3. GET /api/me
4. GET /api/dashboard/summary
5. Think time 2-5s
6. POST /auth/logout (10% of iterations)
```

### Test accounts

Seed 500 synthetic users:

- `load_client_{n}@test.ishbor.uz`
- `load_fl_{n}@test.ishbor.uz`
- Password: rotated test secret (not demo1234)

### Rate limit validation

- Verify Redis rate limit keys don't block entire IP at expected login rate
- Alert if 429 rate > 1% (misconfigured limits)

### VU profile

| Phase | VUs | Duration |
|-------|-----|----------|
| Spike | 0 → 200 | 30s |
| Steady | 200 | 5m |
| Spike | 200 → 500 | 1m |
| Steady | 500 | 3m |

---

## 6. Scenario 3 — Checkout (critical path)

**File:** `load/scenarios/checkout.js`  
**Weight:** 10%  
**Auth:** Required (client sessions)

### Sub-flows

| Flow | % | Steps |
|------|---|-------|
| Project hire | 60% | List proposals → accept → checkout → pay |
| Service purchase | 30% | Service detail → order → checkout |
| Direct hire | 10% | Profile → hire → checkout |

### Flow detail (project hire)

```text
1. Login as load_client_{n}
2. GET /api/projects/mine
3. GET /api/projects/{id}/applications
4. POST /api/applications/{id}/accept
5. POST /api/checkout { order_type: "project_hire", ... }
6. POST /api/payments/confirm (test gateway)
7. GET /api/escrow/{order_id}
8. Assert escrow.status == "funded"
```

### Data integrity checks (post-run script)

```sql
-- No negative wallet balances
SELECT COUNT(*) FROM wallets WHERE available < 0;  -- must be 0

-- Order count matches successful checkouts
-- Escrow total matches order amounts
```

### VU profile

| Phase | VUs | Duration |
|-------|-----|----------|
| Ramp | 0 → 50 | 2m |
| Steady | 50 | 10m |
| Peak | 50 → 100 | 2m |
| Steady | 100 | 5m |

**Note:** Checkout is write-heavy — lower VU count than browse.

---

## 7. Scenario 4 — 1,000 concurrent (mixed)

**File:** `load/scenarios/mixed-1k.js`  
**Purpose:** Production-like traffic mix

| Scenario | VU share |
|----------|----------|
| Browse | 50% (500 VUs) |
| Login/session | 15% (150 VUs) |
| Authenticated read (messages, notifications) | 20% (200 VUs) |
| Checkout | 10% (100 VUs) |
| AI tool proxy | 5% (50 VUs) |

### AI proxy subset

```text
POST /api/ai/proposal-assistant
POST /api/ai/project-generator
```

Mock LLM in staging (100ms fixed delay) — measure proxy overhead only.

### Duration

Total test: **30 minutes** at 1000 VUs steady (after 5m ramp).

---

## 8. WebSocket scenario (optional P1)

**File:** `load/scenarios/websocket-chat.js`

| Metric | Target |
|--------|--------|
| Concurrent WS connections | 2,000 |
| Messages/sec | 500 |
| Fan-out latency p99 | <200ms |

Uses k6 `ws` module; Redis pub/sub must handle channel partitioning per WEBSOCKET_SPECIFICATION.md.

---

## 9. Seed data requirements

Staging seed before load test:

| Entity | Count | Notes |
|--------|-------|-------|
| Users (clients) | 1,000 | |
| Users (freelancers) | 2,000 | With skills |
| Projects (published) | 500 | |
| Services | 500 | |
| Orders (completed) | 200 | Historical |
| Messages | 10,000 | Across threads |
| Notifications | 5,000 | |

Aligns with QA_CHECKLIST volumes ×10 for realistic list pagination.

---

## 10. Infrastructure monitoring during tests

Watch alongside k6:

| System | Metric | Alert threshold |
|--------|--------|-----------------|
| PostgreSQL | `active_connections` | >80% pool |
| PostgreSQL | `slow_queries` | >100/min |
| Redis | `used_memory` | >80% maxmemory |
| Redis | `connected_clients` | >5000 |
| FastAPI | CPU | >70% 5min |
| Nginx | `5xx_rate` | >0.1% |

Grafana dashboard: per MONITORING_ARCHITECTURE.md.

---

## 11. CI / schedule

| When | Scenario | VUs | Gate |
|------|----------|-----|------|
| Weekly (staging) | browse + login | 200 | Informational |
| Pre-beta | mixed-1k | 1000 | Must pass SLOs |
| Pre-launch | mixed-1k + checkout | 1000 | Must pass + integrity |
| Post-scale change | full suite | per SCALING_STRATEGY | Regression |

---

## 12. Failure response

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| p95 browse >1s | Missing index, no cache | EXPLAIN ANALYZE, add Redis cache |
| Login 503 | Connection pool exhausted | Increase PgBouncer pool |
| Checkout duplicates | Missing idempotency key | Fix payment service |
| WS disconnect storm | Sticky session missing | Enable IP hash in Nginx |
| Redis OOM | No eviction policy | Set `maxmemory-policy allkeys-lru` |

Escalate per [INCIDENT_PLAYBOOK.md](../24-launch/INCIDENT_PLAYBOOK.md).

---

## 13. Success criteria

- [ ] Browse p95 <500ms at 1000 VUs
- [ ] Login error rate <0.5% at 200 VU burst
- [ ] Checkout p95 <2s at 100 VUs
- [ ] Zero wallet balance anomalies post-checkout test
- [ ] No unhandled 500s during 30m mixed test
- [ ] Results archived in `rules/99-reports/load/`

---

## 14. References

- [QA_CHECKLIST.md](../06-quality/QA_CHECKLIST.md) — stress volumes
- [PERFORMANCE_STANDARDS.md](../06-quality/PERFORMANCE_STANDARDS.md)
- [SCALING_STRATEGY.md](../25-scaling/SCALING_STRATEGY.md)
- [RATE_LIMITING.md](../11-backend/security/RATE_LIMITING.md)
- [API_SPECIFICATION.md](../11-backend/API_SPECIFICATION.md)

---

*Last updated: 2026-06-20*
