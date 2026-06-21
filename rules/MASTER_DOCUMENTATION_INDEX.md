# MASTER_DOCUMENTATION_INDEX.md

**Project:** Ishbor Marketplace  
**Last updated:** 2026-06-20  
**Total documents:** 275+ markdown files in `rules/`  
**Purpose:** Single entry point for a new senior engineering team to build the entire platform from documentation alone.

**Stack (documented):** FastAPI · PostgreSQL 16 · Redis 7 · MinIO · Celery · WebSockets · Docker · Nginx · VPS  
**Excluded:** Supabase — not used, not documented.

---

## 1. Start here (mandatory reading order)

| # | Document | Why |
|---|----------|-----|
| 1 | [00-constitution/PROJECT_BIBLE.md](./00-constitution/PROJECT_BIBLE.md) | Product law — personas, money flow, demo accounts |
| 2 | [01-product/PRODUCT_VISION.md](./01-product/PRODUCT_VISION.md) | 3-year vision and differentiation |
| 3 | [01-product/PRODUCT_REQUIREMENTS.md](./01-product/PRODUCT_REQUIREMENTS.md) | Feature registry (47 domains) |
| 4 | [12-system-maps/SYSTEM_MAP.md](./12-system-maps/SYSTEM_MAP.md) | Code-derived system topology |
| 5 | [12-system-maps/DOMAIN_MODEL.md](./12-system-maps/DOMAIN_MODEL.md) | Core aggregates and invariants |
| 6 | [11-backend/BACKEND_ARCHITECTURE.md](./11-backend/BACKEND_ARCHITECTURE.md) | FastAPI backend overview |
| 7 | [11-backend/API_SPECIFICATION.md](./11-backend/API_SPECIFICATION.md) | 120+ REST endpoints |
| 8 | [11-backend/DATABASE_SCHEMA.md](./11-backend/DATABASE_SCHEMA.md) | 50+ PostgreSQL tables |
| 9 | [DOCUMENTATION_COMPLETENESS_REPORT.md](./DOCUMENTATION_COMPLETENESS_REPORT.md) | Coverage audit |

---

## 2. Product & business

| Document | Path |
|----------|------|
| Product vision | [01-product/PRODUCT_VISION.md](./01-product/PRODUCT_VISION.md) |
| Business model | [01-product/BUSINESS_MODEL.md](./01-product/BUSINESS_MODEL.md) |
| Monetization strategy | [01-product/MONETIZATION_STRATEGY.md](./01-product/MONETIZATION_STRATEGY.md) |
| KPI metrics | [01-product/KPI_METRICS.md](./01-product/KPI_METRICS.md) |
| Growth strategy | [01-product/GROWTH_STRATEGY.md](./01-product/GROWTH_STRATEGY.md) |
| Product requirements | [01-product/PRODUCT_REQUIREMENTS.md](./01-product/PRODUCT_REQUIREMENTS.md) |
| Roadmap | [01-product/PLAN.md](./01-product/PLAN.md) |
| Release checklist | [01-product/PRODUCT_READY_CHECKLIST.md](./01-product/PRODUCT_READY_CHECKLIST.md) |
| Constitution | [00-constitution/PROJECT_BIBLE.md](./00-constitution/PROJECT_BIBLE.md) |

---

## 3. Architecture & system maps

| Document | Path |
|----------|------|
| System map | [12-system-maps/SYSTEM_MAP.md](./12-system-maps/SYSTEM_MAP.md) |
| Feature map | [12-system-maps/FEATURE_MAP.md](./12-system-maps/FEATURE_MAP.md) |
| Data flow map | [12-system-maps/DATA_FLOW_MAP.md](./12-system-maps/DATA_FLOW_MAP.md) |
| Event flow map | [12-system-maps/EVENT_FLOW_MAP.md](./12-system-maps/EVENT_FLOW_MAP.md) |
| Service boundaries | [12-system-maps/SERVICE_BOUNDARIES.md](./12-system-maps/SERVICE_BOUNDARIES.md) |
| Domain model | [12-system-maps/DOMAIN_MODEL.md](./12-system-maps/DOMAIN_MODEL.md) |
| User flows | [12-system-maps/USER_FLOW_MAP.md](./12-system-maps/USER_FLOW_MAP.md) |
| Admin flows | [12-system-maps/ADMIN_FLOW_MAP.md](./12-system-maps/ADMIN_FLOW_MAP.md) |
| Realtime flows | [12-system-maps/REALTIME_FLOW_MAP.md](./12-system-maps/REALTIME_FLOW_MAP.md) |
| Security map | [12-system-maps/SECURITY_MAP.md](./12-system-maps/SECURITY_MAP.md) |
| Integration map | [12-system-maps/INTEGRATION_MAP.md](./12-system-maps/INTEGRATION_MAP.md) |
| Dependency map | [12-system-maps/DEPENDENCY_MAP.md](./12-system-maps/DEPENDENCY_MAP.md) |

---

## 4. Domain specifications (frontend → backend contract)

| Domain | Path |
|--------|------|
| Index | [13-domains/README.md](./13-domains/README.md) |
| Users & auth | [13-domains/USERS_AUTH.md](./13-domains/USERS_AUTH.md) |
| Projects | [13-domains/PROJECTS.md](./13-domains/PROJECTS.md) |
| Services | [13-domains/SERVICES.md](./13-domains/SERVICES.md) |
| Applications | [13-domains/APPLICATIONS.md](./13-domains/APPLICATIONS.md) |
| Orders & escrow | [13-domains/ORDERS_ESCROW.md](./13-domains/ORDERS_ESCROW.md) |
| Wallet & transactions | [13-domains/WALLET_TRANSACTIONS.md](./13-domains/WALLET_TRANSACTIONS.md) |
| Messages | [13-domains/MESSAGES.md](./13-domains/MESSAGES.md) |
| Notifications | [13-domains/NOTIFICATIONS.md](./13-domains/NOTIFICATIONS.md) |
| Agencies | [13-domains/AGENCIES.md](./13-domains/AGENCIES.md) |
| Admin OS | [13-domains/ADMIN_OS.md](./13-domains/ADMIN_OS.md) |
| AI tools | [13-domains/AI_TOOLS.md](./13-domains/AI_TOOLS.md) |
| *(+ 8 more domains)* | [13-domains/](./13-domains/) |

---

## 5. Marketplace lifecycles

| Document | Path |
|----------|------|
| Index | [17-marketplace/README.md](./17-marketplace/README.md) |
| Project workflow | [17-marketplace/PROJECT_WORKFLOW.md](./17-marketplace/PROJECT_WORKFLOW.md) |
| Service workflow | [17-marketplace/SERVICE_WORKFLOW.md](./17-marketplace/SERVICE_WORKFLOW.md) |
| Order lifecycle | [17-marketplace/ORDER_LIFECYCLE.md](./17-marketplace/ORDER_LIFECYCLE.md) |
| Escrow lifecycle | [17-marketplace/ESCROW_LIFECYCLE.md](./17-marketplace/ESCROW_LIFECYCLE.md) |
| Dispute lifecycle | [17-marketplace/DISPUTE_LIFECYCLE.md](./17-marketplace/DISPUTE_LIFECYCLE.md) |
| Refund lifecycle | [17-marketplace/REFUND_LIFECYCLE.md](./17-marketplace/REFUND_LIFECYCLE.md) |

---

## 6. Backend (FastAPI)

| Document | Path |
|----------|------|
| Backend index | [11-backend/README.md](./11-backend/README.md) |
| Architecture | [11-backend/BACKEND_ARCHITECTURE.md](./11-backend/BACKEND_ARCHITECTURE.md) |
| API specification | [11-backend/API_SPECIFICATION.md](./11-backend/API_SPECIFICATION.md) |
| API versioning | [11-backend/fastapi/API_VERSIONING.md](./11-backend/fastapi/API_VERSIONING.md) |
| Error handling | [11-backend/fastapi/ERROR_HANDLING.md](./11-backend/fastapi/ERROR_HANDLING.md) |
| FastAPI architecture | [11-backend/fastapi/FASTAPI_ARCHITECTURE.md](./11-backend/fastapi/FASTAPI_ARCHITECTURE.md) |
| Service layer | [11-backend/fastapi/SERVICE_LAYER.md](./11-backend/fastapi/SERVICE_LAYER.md) |
| Repository layer | [11-backend/fastapi/REPOSITORY_LAYER.md](./11-backend/fastapi/REPOSITORY_LAYER.md) |
| Domain layer | [11-backend/fastapi/DOMAIN_LAYER.md](./11-backend/fastapi/DOMAIN_LAYER.md) |
| Background jobs | [11-backend/fastapi/BACKGROUND_JOBS.md](./11-backend/fastapi/BACKGROUND_JOBS.md) |
| Cron jobs | [11-backend/fastapi/CRON_JOBS.md](./11-backend/fastapi/CRON_JOBS.md) |
| Event architecture | [11-backend/EVENT_ARCHITECTURE.md](./11-backend/EVENT_ARCHITECTURE.md) |
| Implementation plan | [11-backend/BACKEND_IMPLEMENTATION_MASTER_PLAN.md](./11-backend/BACKEND_IMPLEMENTATION_MASTER_PLAN.md) |

---

## 7. Database (PostgreSQL)

| Document | Path |
|----------|------|
| Schema (canonical) | [11-backend/DATABASE_SCHEMA.md](./11-backend/DATABASE_SCHEMA.md) |
| PostgreSQL architecture | [11-backend/postgresql/POSTGRESQL_ARCHITECTURE.md](./11-backend/postgresql/POSTGRESQL_ARCHITECTURE.md) |
| ERD | [11-backend/postgresql/ERD.md](./11-backend/postgresql/ERD.md) |
| Table specifications | [11-backend/postgresql/TABLE_SPECIFICATIONS.md](./11-backend/postgresql/TABLE_SPECIFICATIONS.md) |
| Indexing strategy | [11-backend/postgresql/INDEXING_STRATEGY.md](./11-backend/postgresql/INDEXING_STRATEGY.md) |
| Soft delete strategy | [11-backend/postgresql/SOFT_DELETE_STRATEGY.md](./11-backend/postgresql/SOFT_DELETE_STRATEGY.md) |
| Audit trail strategy | [11-backend/postgresql/AUDIT_TRAIL_STRATEGY.md](./11-backend/postgresql/AUDIT_TRAIL_STRATEGY.md) |
| Data retention policy | [11-backend/postgresql/DATA_RETENTION_POLICY.md](./11-backend/postgresql/DATA_RETENTION_POLICY.md) |
| Migration strategy | [11-backend/postgresql/MIGRATION_STRATEGY.md](./11-backend/postgresql/MIGRATION_STRATEGY.md) |
| Query optimization | [11-backend/postgresql/QUERY_OPTIMIZATION.md](./11-backend/postgresql/QUERY_OPTIMIZATION.md) |
| Database performance | [11-backend/postgresql/DATABASE_PERFORMANCE.md](./11-backend/postgresql/DATABASE_PERFORMANCE.md) |
| Backup strategy | [11-backend/postgresql/DATABASE_BACKUP_STRATEGY.md](./11-backend/postgresql/DATABASE_BACKUP_STRATEGY.md) |

---

## 8. Redis

| Document | Path |
|----------|------|
| Redis architecture | [11-backend/redis/REDIS_ARCHITECTURE.md](./11-backend/redis/REDIS_ARCHITECTURE.md) |
| Cache strategy | [11-backend/redis/CACHE_STRATEGY.md](./11-backend/redis/CACHE_STRATEGY.md) |
| Session storage | [11-backend/redis/SESSION_STORAGE.md](./11-backend/redis/SESSION_STORAGE.md) |
| Queue architecture | [11-backend/redis/QUEUE_ARCHITECTURE.md](./11-backend/redis/QUEUE_ARCHITECTURE.md) |
| Rate limit storage | [11-backend/redis/RATE_LIMIT_STORAGE.md](./11-backend/redis/RATE_LIMIT_STORAGE.md) |

---

## 9. Payments & wallet

| Document | Path |
|----------|------|
| Payment architecture | [11-backend/payments/PAYMENT_ARCHITECTURE.md](./11-backend/payments/PAYMENT_ARCHITECTURE.md) |
| Wallet system | [11-backend/payments/WALLET_SYSTEM.md](./11-backend/payments/WALLET_SYSTEM.md) |
| Escrow system | [11-backend/payments/ESCROW_SYSTEM.md](./11-backend/payments/ESCROW_SYSTEM.md) |
| Commission system | [11-backend/payments/COMMISSION_SYSTEM.md](./11-backend/payments/COMMISSION_SYSTEM.md) |
| Platform fee system | [11-backend/payments/PLATFORM_FEE_SYSTEM.md](./11-backend/payments/PLATFORM_FEE_SYSTEM.md) |
| Payout system | [11-backend/payments/PAYOUT_SYSTEM.md](./11-backend/payments/PAYOUT_SYSTEM.md) |
| Withdrawal system | [11-backend/payments/WITHDRAWAL_SYSTEM.md](./11-backend/payments/WITHDRAWAL_SYSTEM.md) |
| Fraud prevention | [11-backend/payments/FRAUD_PREVENTION.md](./11-backend/payments/FRAUD_PREVENTION.md) |
| Humo integration | [11-backend/payments/HUMO_INTEGRATION.md](./11-backend/payments/HUMO_INTEGRATION.md) |
| Uzcard integration | [11-backend/payments/UZCARD_INTEGRATION.md](./11-backend/payments/UZCARD_INTEGRATION.md) |
| Transaction / refund / dispute flows | [11-backend/payments/](./11-backend/payments/) |

---

## 10. Authentication & authorization

| Document | Path |
|----------|------|
| Auth index | [11-backend/auth/](./11-backend/auth/) |
| Auth architecture | [11-backend/auth/AUTH_ARCHITECTURE.md](./11-backend/auth/AUTH_ARCHITECTURE.md) |
| Auth flows | [11-backend/auth/AUTH_FLOW.md](./11-backend/auth/AUTH_FLOW.md) |
| JWT strategy | [11-backend/auth/JWT_STRATEGY.md](./11-backend/auth/JWT_STRATEGY.md) |
| Cookie strategy | [11-backend/auth/COOKIE_STRATEGY.md](./11-backend/auth/COOKIE_STRATEGY.md) |
| Session management | [11-backend/auth/SESSION_MANAGEMENT.md](./11-backend/auth/SESSION_MANAGEMENT.md) |
| OAuth | [11-backend/auth/OAUTH_ARCHITECTURE.md](./11-backend/auth/OAUTH_ARCHITECTURE.md) |
| Password reset | [11-backend/auth/PASSWORD_RESET_FLOW.md](./11-backend/auth/PASSWORD_RESET_FLOW.md) |
| Email verification | [11-backend/auth/EMAIL_VERIFICATION_FLOW.md](./11-backend/auth/EMAIL_VERIFICATION_FLOW.md) |
| RBAC specification | [11-backend/RBAC_SPECIFICATION.md](./11-backend/RBAC_SPECIFICATION.md) |
| Permission matrix | [11-backend/auth/PERMISSION_MATRIX.md](./11-backend/auth/PERMISSION_MATRIX.md) |

---

## 11. Realtime (WebSockets)

| Document | Path |
|----------|------|
| WebSocket architecture | [11-backend/websockets/WEBSOCKET_ARCHITECTURE.md](./11-backend/websockets/WEBSOCKET_ARCHITECTURE.md) |
| Realtime events | [11-backend/websockets/REALTIME_EVENTS.md](./11-backend/websockets/REALTIME_EVENTS.md) |
| Chat events | [11-backend/websockets/CHAT_EVENTS.md](./11-backend/websockets/CHAT_EVENTS.md) |
| Notification events | [11-backend/websockets/NOTIFICATION_EVENTS.md](./11-backend/websockets/NOTIFICATION_EVENTS.md) |
| Presence system | [11-backend/websockets/PRESENCE_SYSTEM.md](./11-backend/websockets/PRESENCE_SYSTEM.md) |
| WebSocket security | [11-backend/websockets/WEBSOCKET_SECURITY.md](./11-backend/websockets/WEBSOCKET_SECURITY.md) |

---

## 12. Notifications

| Document | Path |
|----------|------|
| Index | [18-notifications/README.md](./18-notifications/README.md) |
| Notification architecture | [11-backend/NOTIFICATION_ARCHITECTURE.md](./11-backend/NOTIFICATION_ARCHITECTURE.md) |
| Email matrix | [18-notifications/EMAIL_NOTIFICATION_MATRIX.md](./18-notifications/EMAIL_NOTIFICATION_MATRIX.md) |
| SMS matrix | [18-notifications/SMS_NOTIFICATION_MATRIX.md](./18-notifications/SMS_NOTIFICATION_MATRIX.md) |
| Push matrix | [18-notifications/PUSH_NOTIFICATION_MATRIX.md](./18-notifications/PUSH_NOTIFICATION_MATRIX.md) |
| In-app matrix | [18-notifications/IN_APP_NOTIFICATION_MATRIX.md](./18-notifications/IN_APP_NOTIFICATION_MATRIX.md) |

---

## 13. Admin operations

| Document | Path |
|----------|------|
| Index | [19-admin/README.md](./19-admin/README.md) |
| Admin OS backend | [11-backend/admin/ADMIN_OS_BACKEND.md](./11-backend/admin/ADMIN_OS_BACKEND.md) |
| Admin operations | [19-admin/ADMIN_OPERATIONS.md](./19-admin/ADMIN_OPERATIONS.md) |
| Moderation guidelines | [19-admin/MODERATION_GUIDELINES.md](./19-admin/MODERATION_GUIDELINES.md) |
| KYC verification | [19-admin/KYC_VERIFICATION.md](./19-admin/KYC_VERIFICATION.md) |
| User ban system | [19-admin/USER_BAN_SYSTEM.md](./19-admin/USER_BAN_SYSTEM.md) |
| Audit log workflow | [19-admin/AUDIT_LOG_WORKFLOW.md](./19-admin/AUDIT_LOG_WORKFLOW.md) |
| Admin route map | [10-admin/ADMIN_ROUTE_MAP.md](./10-admin/ADMIN_ROUTE_MAP.md) |

---

## 14. Security

| Document | Path |
|----------|------|
| Security architecture | [11-backend/security/SECURITY_ARCHITECTURE.md](./11-backend/security/SECURITY_ARCHITECTURE.md) |
| Security checklist | [11-backend/security/SECURITY_CHECKLIST.md](./11-backend/security/SECURITY_CHECKLIST.md) |
| Threat model | [11-backend/security/THREAT_MODEL.md](./11-backend/security/THREAT_MODEL.md) |
| Abuse prevention | [11-backend/security/ABUSE_PREVENTION.md](./11-backend/security/ABUSE_PREVENTION.md) |
| Spam prevention | [11-backend/security/SPAM_PREVENTION.md](./11-backend/security/SPAM_PREVENTION.md) |
| Account protection | [11-backend/security/ACCOUNT_PROTECTION.md](./11-backend/security/ACCOUNT_PROTECTION.md) |
| API security | [11-backend/security/API_SECURITY.md](./11-backend/security/API_SECURITY.md) |
| Rate limiting | [11-backend/security/RATE_LIMITING.md](./11-backend/security/RATE_LIMITING.md) |
| Audit log system | [11-backend/security/AUDIT_LOG_SYSTEM.md](./11-backend/security/AUDIT_LOG_SYSTEM.md) |
| CSP / headers | [11-backend/security/CSP_CONFIGURATION.md](./11-backend/security/CSP_CONFIGURATION.md) |

---

## 15. Infrastructure & deployment

| Document | Path |
|----------|------|
| Infrastructure architecture | [11-backend/infrastructure/INFRASTRUCTURE_ARCHITECTURE.md](./11-backend/infrastructure/INFRASTRUCTURE_ARCHITECTURE.md) |
| Server architecture | [11-backend/infrastructure/SERVER_ARCHITECTURE.md](./11-backend/infrastructure/SERVER_ARCHITECTURE.md) |
| Docker architecture | [11-backend/infrastructure/DOCKER_ARCHITECTURE.md](./11-backend/infrastructure/DOCKER_ARCHITECTURE.md) |
| Docker compose | [11-backend/infrastructure/DOCKER_COMPOSE_STRUCTURE.md](./11-backend/infrastructure/DOCKER_COMPOSE_STRUCTURE.md) |
| Nginx architecture | [11-backend/infrastructure/NGINX_ARCHITECTURE.md](./11-backend/infrastructure/NGINX_ARCHITECTURE.md) |
| VPS setup | [11-backend/infrastructure/VPS_SETUP.md](./11-backend/infrastructure/VPS_SETUP.md) |
| SSL setup | [11-backend/infrastructure/SSL_SETUP.md](./11-backend/infrastructure/SSL_SETUP.md) |
| Domain setup | [11-backend/infrastructure/DOMAIN_SETUP.md](./11-backend/infrastructure/DOMAIN_SETUP.md) |
| Environment setup | [11-backend/infrastructure/ENVIRONMENT_SETUP.md](./11-backend/infrastructure/ENVIRONMENT_SETUP.md) |
| Deployment guide | [11-backend/infrastructure/DEPLOYMENT_GUIDE.md](./11-backend/infrastructure/DEPLOYMENT_GUIDE.md) |
| CI/CD pipeline | [11-backend/infrastructure/CI_CD_PIPELINE.md](./11-backend/infrastructure/CI_CD_PIPELINE.md) |
| Email / SMS | [11-backend/infrastructure/EMAIL_ARCHITECTURE.md](./11-backend/infrastructure/EMAIL_ARCHITECTURE.md) |

---

## 16. MinIO / file storage

| Document | Path |
|----------|------|
| MinIO architecture | [11-backend/minio/MINIO_ARCHITECTURE.md](./11-backend/minio/MINIO_ARCHITECTURE.md) |
| File storage | [11-backend/minio/FILE_STORAGE_ARCHITECTURE.md](./11-backend/minio/FILE_STORAGE_ARCHITECTURE.md) |
| Upload flow | [11-backend/minio/UPLOAD_FLOW.md](./11-backend/minio/UPLOAD_FLOW.md) |
| Media processing | [11-backend/minio/MEDIA_PROCESSING.md](./11-backend/minio/MEDIA_PROCESSING.md) |
| File security | [11-backend/minio/FILE_SECURITY.md](./11-backend/minio/FILE_SECURITY.md) |

---

## 17. Observability

| Document | Path |
|----------|------|
| Index | [21-observability/README.md](./21-observability/README.md) |
| Monitoring architecture | [11-backend/MONITORING_ARCHITECTURE.md](./11-backend/MONITORING_ARCHITECTURE.md) |
| Logging architecture | [11-backend/infrastructure/LOGGING_ARCHITECTURE.md](./11-backend/infrastructure/LOGGING_ARCHITECTURE.md) |
| Sentry guide | [21-observability/SENTRY_GUIDE.md](./21-observability/SENTRY_GUIDE.md) |
| Alerting rules | [21-observability/ALERTING_RULES.md](./21-observability/ALERTING_RULES.md) |
| Incident response | [21-observability/INCIDENT_RESPONSE.md](./21-observability/INCIDENT_RESPONSE.md) |
| Uptime monitoring | [21-observability/UPTIME_MONITORING.md](./21-observability/UPTIME_MONITORING.md) |
| Production stability | [14-production/PRODUCTION_STABILITY_REPORT.md](./14-production/PRODUCTION_STABILITY_REPORT.md) |

---

## 18. Testing

| Document | Path |
|----------|------|
| Index | [22-testing/README.md](./22-testing/README.md) |
| Unit test plan | [22-testing/UNIT_TEST_PLAN.md](./22-testing/UNIT_TEST_PLAN.md) |
| Integration test plan | [22-testing/INTEGRATION_TEST_PLAN.md](./22-testing/INTEGRATION_TEST_PLAN.md) |
| E2E test plan | [22-testing/E2E_TEST_PLAN.md](./22-testing/E2E_TEST_PLAN.md) |
| Load test plan | [22-testing/LOAD_TEST_PLAN.md](./22-testing/LOAD_TEST_PLAN.md) |
| QA checklist | [06-quality/QA_CHECKLIST.md](./06-quality/QA_CHECKLIST.md) |

---

## 19. AI

| Document | Path |
|----------|------|
| Index | [23-ai/README.md](./23-ai/README.md) |
| AI architecture | [23-ai/AI_ARCHITECTURE.md](./23-ai/AI_ARCHITECTURE.md) |
| AI tools spec | [23-ai/AI_TOOLS_SPEC.md](./23-ai/AI_TOOLS_SPEC.md) |
| Prompt library | [23-ai/PROMPT_LIBRARY.md](./23-ai/PROMPT_LIBRARY.md) |
| AI usage limits | [23-ai/AI_USAGE_LIMITS.md](./23-ai/AI_USAGE_LIMITS.md) |

---

## 20. Launch & scaling

| Document | Path |
|----------|------|
| Beta launch plan | [24-launch/BETA_LAUNCH_PLAN.md](./24-launch/BETA_LAUNCH_PLAN.md) |
| Production checklist | [24-launch/PRODUCTION_CHECKLIST.md](./24-launch/PRODUCTION_CHECKLIST.md) |
| Rollback plan | [24-launch/ROLLBACK_PLAN.md](./24-launch/ROLLBACK_PLAN.md) |
| Incident playbook | [24-launch/INCIDENT_PLAYBOOK.md](./24-launch/INCIDENT_PLAYBOOK.md) |
| Scaling strategy | [25-scaling/SCALING_STRATEGY.md](./25-scaling/SCALING_STRATEGY.md) |
| Multi-server architecture | [25-scaling/MULTI_SERVER_ARCHITECTURE.md](./25-scaling/MULTI_SERVER_ARCHITECTURE.md) |
| CDN strategy | [25-scaling/CDN_STRATEGY.md](./25-scaling/CDN_STRATEGY.md) |
| Caching strategy | [25-scaling/CACHING_STRATEGY.md](./25-scaling/CACHING_STRATEGY.md) |
| Scalability architecture | [11-backend/SCALABILITY_ARCHITECTURE.md](./11-backend/SCALABILITY_ARCHITECTURE.md) |

---

## 21. Integration registries

| Document | Path |
|----------|------|
| Route registry | [02-integration/ROUTE_REGISTRY.md](./02-integration/ROUTE_REGISTRY.md) |
| Store registry | [02-integration/STORE_REGISTRY.md](./02-integration/STORE_REGISTRY.md) |
| Role matrix | [02-integration/ROLE_MATRIX.md](./02-integration/ROLE_MATRIX.md) |

---

## 22. Historical reports (reference only)

Phase reports, UX audits, journey reports: [99-reports/](./99-reports/) — do not override constitution or product docs.

---

*For coverage metrics see [DOCUMENTATION_COMPLETENESS_REPORT.md](./DOCUMENTATION_COMPLETENESS_REPORT.md)*
