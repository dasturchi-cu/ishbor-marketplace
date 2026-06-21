# LOGGING_ARCHITECTURE.md

**Format:** structlog JSON to stdout → Docker log driver → file rotation or Loki  
**Correlation:** `X-Request-Id` header propagated nginx → FastAPI → Celery tasks

---

## 1. Logging stack

```
FastAPI (structlog JSON)
    → Docker stdout
    → json-file driver (50MB × 5 files)
    → Optional: Promtail → Loki → Grafana
    → Optional: Sentry for errors
```

Nginx access logs: separate JSON format — see NGINX_ARCHITECTURE.md.

---

## 2. Structured log format

```json
{
  "timestamp": "2026-06-20T10:15:30.123Z",
  "level": "info",
  "event": "request_completed",
  "request_id": "192.168.1.1-1718878530.123-42",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/v1/checkout/confirm",
  "status_code": 200,
  "duration_ms": 342,
  "service": "ishbor-api",
  "environment": "production"
}
```

### Required fields (every log line)

| Field | Source |
|-------|--------|
| timestamp | ISO8601 UTC |
| level | debug/info/warning/error |
| event | Semantic event name |
| request_id | X-Request-Id header or generated |
| service | `ishbor-api` / `celery-worker` |
| environment | APP_ENV |

---

## 3. FastAPI implementation

```python
# server/lib/logging.py
import structlog
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="")

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(log_level),
)

# Middleware
@app.middleware("http")
async def request_logging(request, call_next):
    rid = request.headers.get("X-Request-Id") or generate_request_id()
    request_id_var.set(rid)
    structlog.contextvars.bind_contextvars(request_id=rid)
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Request-Id"] = rid
    logger.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=round((time.perf_counter() - start) * 1000),
    )
    return response
```

---

## 4. Correlation ID propagation

| Layer | Behavior |
|-------|----------|
| Nginx | Generate or pass through `X-Request-Id` |
| FastAPI | Bind to structlog context |
| Celery | Pass `request_id` in task kwargs |
| WebSocket | `request_id` in connection handshake |
| Sentry | Tag events with `request_id` |

Celery task:

```python
@celery_app.task
def process_webhook(request_id: str, payload: dict):
    structlog.contextvars.bind_contextvars(request_id=request_id)
    logger.info("webhook_processing", provider="payme")
```

---

## 5. Log levels by environment

| Environment | Default level | Debug endpoints |
|-------------|---------------|-----------------|
| local | DEBUG | All |
| staging | INFO | `/admin/system` verbose |
| production | INFO | WARNING for 4xx spam |

Critical flows always INFO minimum: `checkout`, `escrow`, `payment_webhook`, `auth`.

---

## 6. Never log

| Data | Reason |
|------|--------|
| Passwords | Credential leak |
| Session tokens | Session hijack |
| Full PAN / CVV | PCI violation |
| OTP codes | Auth bypass |
| KYC document content | PII |
| `Authorization` headers | Token leak |
| Full webhook bodies with card data | PCI — log gateway_ref only |

Use structured redaction:

```python
logger.info("deposit_initiated", user_id=uid, amount=amount, method_last4=last4)
# NOT: logger.info("deposit", card=pan)
```

---

## 7. File rotation (without Loki)

```bash
# /etc/logrotate.d/ishbor
/opt/ishbor/logs/nginx/*.json {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
}
```

Docker json-file driver handles container stdout rotation — see DOCKER_ARCHITECTURE.md.

---

## 8. Loki setup (optional P1)

```yaml
# docker-compose logging overlay
services:
  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./logs:/var/log/ishbor:ro
      - ./monitoring/promtail.yml:/etc/promtail/config.yml
    networks:
      - ishbor-internal

  loki:
    image: grafana/loki:latest
    networks:
      - ishbor-internal
```

Grafana Explore: `{service="ishbor-api"} |= "checkout"` filtered by `request_id`.

---

## 9. Celery logging

```python
# celery_app.py
worker_hijack_root_logger = False
celery_app.conf.update(
    worker_log_format="%(message)s",  # structlog JSON
)
```

Separate log stream per queue in production for filtering:

```
docker compose logs -f celery-worker | jq 'select(.event=="webhook_processing")'
```

---

## 10. Audit vs application logs

| Type | Destination | Retention |
|------|-------------|-----------|
| Application logs | stdout/Loki | 30 days |
| Audit logs | PostgreSQL `audit_logs` | 7 years |
| Financial logs | `wallet_transactions` | Permanent |
| Nginx access | file/Loki | 90 days |

Audit logs are NOT stdout — see ../security/AUDIT_LOG_SYSTEM.md.

---

## 11. Related documents

- [NGINX_ARCHITECTURE.md](./NGINX_ARCHITECTURE.md)
- [../MONITORING_ARCHITECTURE.md](../MONITORING_ARCHITECTURE.md)
- [../security/AUDIT_LOG_SYSTEM.md](../security/AUDIT_LOG_SYSTEM.md)

---

*Every request is traceable end-to-end via X-Request-Id. JSON structured logs enable Loki queries and Sentry correlation without plain-text grep.*
