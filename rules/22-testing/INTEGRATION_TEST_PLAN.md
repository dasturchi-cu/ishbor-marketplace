# INTEGRATION_TEST_PLAN.md

**Ishbor marketplace — FastAPI + PostgreSQL integration testing**  
**Status:** Planned — backend implementation pending per [11-backend/README.md](../11-backend/README.md)  
**Framework:** pytest · httpx AsyncClient · FastAPI TestClient · SQLAlchemy async

---

## 1. Purpose

Integration tests verify that **HTTP endpoints, database persistence, auth sessions, and RBAC** work together as a system. Unit tests validate store logic in isolation; integration tests prove the FastAPI service layer correctly maps to PostgreSQL schema defined in [DATABASE_SCHEMA.md](../11-backend/DATABASE_SCHEMA.md).

Ishbor-specific goals:

- Escrow and wallet mutations are **atomic** (no double-spend)
- Cross-user ID guessing returns **404**, not 403
- Subscription limits enforced **server-side** before proposal insert
- AI proxy endpoints log usage to `ai_usage_logs` without exposing API keys
- Uzbek error messages returned in `detail` fields

---

## 2. Test environment

### Directory layout (target)

```text
server/
├── app/
│   ├── main.py
│   ├── routers/
│   ├── services/
│   └── repositories/
└── tests/
    ├── conftest.py
    ├── fixtures/
    │   ├── users.py
    │   ├── projects.py
    │   └── orders.py
    ├── integration/
    │   ├── test_auth.py
    │   ├── test_projects.py
    │   ├── test_checkout.py
    │   ├── test_escrow.py
    │   ├── test_messages.py
    │   ├── test_ai_proxy.py
    │   └── test_admin.py
    └── factories/
        └── base.py
```

### Database

| Setting | Value |
|---------|-------|
| Engine | PostgreSQL 16 (Docker test container) |
| Migrations | Alembic `upgrade head` before suite |
| Isolation | Transaction rollback per test OR truncate all tables |
| Connection | `DATABASE_URL=postgresql+asyncpg://test:test@localhost:5433/ishbor_test` |
| Pool | `pool_size=1` for test determinism |

### Redis (optional per test)

| Use | Test approach |
|-----|---------------|
| Session cache | Real Redis test instance OR fakeredis |
| Rate limits | Real Redis — verify key TTL |
| Celery | Eager mode (`task_always_eager=True`) |

### MinIO

Use `moto` or MinIO test container for presigned upload flows. KYC bucket ACL tests are integration-critical.

---

## 3. FastAPI TestClient patterns

### Sync smoke (simple routes)

```text
from fastapi.testclient import TestClient
client = TestClient(app)
response = client.get("/health")
assert response.status_code == 200
```

### Async integration (preferred)

```text
import pytest
from httpx import AsyncClient, ASGITransport

@pytest.fixture
async def client(db_session):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
```

### Authenticated requests

1. `POST /auth/login` with test user credentials
2. Extract `ishbor_sid` cookie from `Set-Cookie`
3. Pass cookie on subsequent requests
4. Assert `event.context.auth` equivalent via response shape

---

## 4. DB fixtures

### conftest.py responsibilities

| Fixture | Scope | Description |
|---------|-------|-------------|
| `db_engine` | session | Create async engine, run migrations |
| `db_session` | function | Yield session, rollback after test |
| `client` | function | HTTP client with overridden `get_db` |
| `redis` | function | Flush DB 15 before each test |
| `test_client_user` | function | Client role user + profile |
| `test_freelancer_user` | function | Freelancer + skills + portfolio |
| `test_admin_user` | function | super_admin role assignment |
| `auth_cookies` | function | Factory: login → cookie dict |

### Seed data baseline

Minimum entities per test file:

| Entity | Factory method |
|--------|----------------|
| User (client) | `create_client(email="client@test.uz")` |
| User (freelancer) | `create_freelancer(username="test_fl")` |
| Project (published) | `create_project(owner=client, status="published")` |
| Service (published) | `create_service(owner=freelancer)` |
| Wallet | Auto-created on user registration trigger |

### QA_CHECKLIST stress fixtures

For performance integration tests (not every PR):

| Entity | Count |
|--------|-------|
| Messages | 100 |
| Notifications | 100 |
| Projects | 50 |
| Orders | 50 |

Seed via `pytest -m stress` marker.

---

## 5. Auth flow tests

### Registration

| Test | Assert |
|------|--------|
| Valid email + password | 201, user row, profile row, session cookie |
| Duplicate email | 409, Uzbek message |
| Weak password | 422, field errors |
| Referral code valid | `referrals` row linked |
| Referral code invalid | 400, registration still succeeds |

### Login

| Test | Assert |
|------|--------|
| Valid credentials | 200, `ishbor_sid` cookie, HttpOnly |
| Invalid password | 401, rate limit counter incremented |
| Suspended account | 403, `account_status=suspended` |
| Demo account (staging only) | 200 when `ALLOW_DEMO_AUTH=true` |
| Brute force | 429 after N attempts |

### Session

| Test | Assert |
|------|--------|
| Valid session | Protected route 200 |
| Expired session | 401, cookie cleared |
| Logout | Session revoked in DB + Redis |
| Role switch API | `active_role` updated, session rotated |

### OAuth (Google)

| Test | Assert |
|------|--------|
| PKCE flow mock | User created or linked |
| Existing email | Account link, no duplicate user |

---

## 6. Marketplace flow tests

### Projects (client)

| Endpoint | Tests |
|----------|-------|
| `POST /projects` | Create draft, validate budget |
| `PATCH /projects/{id}` | Owner only, slug regeneration |
| `POST /projects/{id}/publish` | Status transition, search index event |
| `GET /projects` | Public list excludes drafts |

### Applications (freelancer)

| Test | Assert |
|------|--------|
| Submit proposal | `applications` row, `proposals_count++` |
| Free plan limit exceeded | 402/403 with upgrade CTA message |
| Duplicate application | 409 |
| Non-owner project | 404 |

### Checkout + orders

| Test | Assert |
|------|--------|
| Project hire checkout | Order + escrow workflow created |
| Service purchase | Order type `service` |
| Platform fee 5% | Correct `platform_fee` column |
| Wallet insufficient | 400 with balance info |

### Escrow state machine

| Transition | Test |
|------------|------|
| funded → in_progress | Client action |
| in_progress → delivered | Freelancer action |
| delivered → released | Client approval, wallet credit |
| disputed | Both parties, admin resolution |

All transitions must be **single-transaction** — assert no partial wallet updates on failure.

---

## 7. Messaging + notifications

| Test | Assert |
|------|--------|
| Create conversation | Participants only |
| Send message | Row + notification job queued |
| Mark read | `read_at` set, unread count decremented |
| Cross-user thread access | 404 |

WebSocket tests: separate `tests/integration/test_websocket.py` with `websockets` library.

---

## 8. AI proxy integration

Per [AI_ARCHITECTURE.md](../23-ai/AI_ARCHITECTURE.md):

| Test | Assert |
|------|--------|
| `POST /ai/proposal-assistant` | Streams SSE, logs `ai_usage_logs` |
| Unauthenticated | 401 |
| Rate limit exceeded | 429 |
| Invalid tool id | 404 |
| PII in prompt | Redacted in log row |

Mock LLM provider in CI — never call OpenAI/Anthropic in PR pipeline.

---

## 9. Admin RBAC

| Test | Assert |
|------|--------|
| Non-admin `GET /admin/users` | 403 |
| support_admin suspend user | 200, audit log row |
| moderator without finance | `GET /admin/payments` 403 |
| finance_admin | Payments read OK |

---

## 10. Test markers

| Marker | Use |
|--------|-----|
| `@pytest.mark.integration` | Requires DB |
| `@pytest.mark.redis` | Requires Redis |
| `@pytest.mark.slow` | >2s, excluded from fast CI |
| `@pytest.mark.stress` | QA_CHECKLIST volumes |

### CI commands

```text
pytest server/tests -m "integration and not slow"   # PR gate
pytest server/tests -m stress                       # Nightly
pytest server/tests --cov=app --cov-fail-under=80   # Coverage gate
```

---

## 11. Failure diagnostics

| Failure type | Action |
|--------------|--------|
| Migration drift | Run `alembic upgrade head`, regenerate if intentional |
| Flaky timing | Avoid `sleep`; use `asyncio.wait_for` |
| Cookie not set | Check `Secure` flag disabled in test settings |
| FK violation | Verify factory creation order |

---

## 12. Success criteria

- [ ] All auth flows covered (register, login, logout, session expiry)
- [ ] Checkout → escrow → release happy path green
- [ ] Subscription limit enforced server-side (not bypassable via API)
- [ ] Admin RBAC matrix from PERMISSION_MATRIX.md validated
- [ ] 80% coverage on `server/app/services/`
- [ ] Zero tests depend on production database

---

## 13. References

- [AUTH_ARCHITECTURE.md](../11-backend/auth/AUTH_ARCHITECTURE.md)
- [API_SPECIFICATION.md](../11-backend/API_SPECIFICATION.md)
- [RBAC_SPECIFICATION.md](../11-backend/RBAC_SPECIFICATION.md)
- [DATABASE_SCHEMA.md](../11-backend/DATABASE_SCHEMA.md)
- [UNIT_TEST_PLAN.md](./UNIT_TEST_PLAN.md)

---

*Last updated: 2026-06-20*
