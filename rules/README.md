# Ishbor Rules

**Yagona hujjat manbasi** — loyihadagi barcha `.md` fayllar faqat shu papkada.

**Sikil:** Audit → Fix → Retest → Verify → Commit

**Master index:** [MASTER_DOCUMENTATION_INDEX.md](./MASTER_DOCUMENTATION_INDEX.md) · **Coverage:** [DOCUMENTATION_COMPLETENESS_REPORT.md](./DOCUMENTATION_COMPLETENESS_REPORT.md) (100%)

---

## O'qish tartibi (majburiy)

| # | Hujjat | Maqsad |
|---|--------|--------|
| 1 | [00-constitution/PROJECT_BIBLE.md](./00-constitution/PROJECT_BIBLE.md) | Mahsulot qonuni |
| 2 | [00-constitution/PROJECT_STANDARDS.md](./00-constitution/PROJECT_STANDARDS.md) | Markaziy konstitutsiya |
| 3 | [01-product/PRODUCT_REQUIREMENTS.md](./01-product/PRODUCT_REQUIREMENTS.md) | Feature registry |
| 4 | [01-product/PLAN.md](./01-product/PLAN.md) | Product-ready roadmap |
| 5 | [01-product/PRODUCT_READY_CHECKLIST.md](./01-product/PRODUCT_READY_CHECKLIST.md) | Release checklist |
| 6 | [06-quality/LAUNCH_CHECKLIST.md](./06-quality/LAUNCH_CHECKLIST.md) | Pre-launch tekshiruv |
| 7 | [06-quality/AUDIT_PLAYBOOK.md](./06-quality/AUDIT_PLAYBOOK.md) | Audit tartibi |

---

## Tuzilma

```
rules/
├── README.md                 ← bu indeks
├── 00-constitution/          PROJECT_BIBLE, PROJECT_STANDARDS, DESIGN_GUARDRAILS
├── 01-product/               PLAN, requirements, checklists, roadmap
├── 02-integration/           integration, roles, route/store registry
├── 03-ux/                    UX, UI, dead action, feature completion, coming-soon copy
├── 04-trust/                 trust system
├── 05-mobile/                mobile standards
├── 06-quality/               QA, performance, audit, launch, bug prevention
├── 07-personalization/       personalization rules
├── 08-marketplace/           marketplace domain rules
├── 09-security/              security guidelines
├── 10-admin/                 admin architecture, routes, workflow
├── 11-backend/               FastAPI, PostgreSQL, Redis, MinIO (86 docs)
├── 12-system-maps/           SYSTEM_MAP, FEATURE_MAP, flows, boundaries
├── 13-domains/               per-domain specs (stores, lifecycle, API requirements)
├── 14-production/            stability, observability, disaster recovery
├── 17-marketplace/           project/service/order/escrow/dispute lifecycles
├── 18-notifications/         email/SMS/push/in-app notification matrices
├── 19-admin/                 admin ops, moderation, KYC, ban system
├── 21-observability/         Sentry, alerting, incident response, uptime
├── 22-testing/               Vitest, integration, Playwright, k6 load plans
├── 23-ai/                    AI architecture, tools, prompts, usage limits
├── 24-launch/                beta rollout, production checklist, rollback, incidents
├── 25-scaling/               growth phases, multi-server, CDN, caching
├── MASTER_DOCUMENTATION_INDEX.md   ← full doc catalog
├── DOCUMENTATION_COMPLETENESS_REPORT.md
└── 99-reports/               tarixiy phase va audit hisobotlar
    ├── phase/
    ├── audits/
    ├── flows/
    └── meta/
```

---

## PLAN → hujjat

| Priority | Hujjat |
|----------|--------|
| Success | [PRODUCT_READY_CHECKLIST](./01-product/PRODUCT_READY_CHECKLIST.md) |
| P1 | [INTEGRATION_RULES](./02-integration/INTEGRATION_RULES.md), [ROLE_CONSISTENCY](./02-integration/ROLE_CONSISTENCY.md) |
| P2 | [PERSONALIZATION_RULES](./07-personalization/PERSONALIZATION_RULES.md) |
| P3 | [UX_STANDARDS](./03-ux/UX_STANDARDS.md) |
| P4 | [TRUST_SYSTEM](./04-trust/TRUST_SYSTEM.md) |
| P5 | [MOBILE_STANDARDS](./05-mobile/MOBILE_STANDARDS.md) |
| P6+P9 | [QA_CHECKLIST](./06-quality/QA_CHECKLIST.md) |
| P7 | [PERFORMANCE_STANDARDS](./06-quality/PERFORMANCE_STANDARDS.md) |
| P8 | [DEAD_ACTION_POLICY](./03-ux/DEAD_ACTION_POLICY.md), [FEATURE_COMPLETION_POLICY](./03-ux/FEATURE_COMPLETION_POLICY.md), [COMING_SOON_ELIMINATION](./03-ux/COMING_SOON_ELIMINATION.md) |
| P10 | [PRODUCT_RULES](./01-product/PRODUCT_RULES.md) |
| Backend | [11-backend/README.md](./11-backend/README.md) — FastAPI, PostgreSQL, Redis, MinIO (docs complete, implementation pending) |
| System maps | [12-system-maps/README.md](./12-system-maps/README.md) — code-derived topology & flows |
| Domains | [13-domains/README.md](./13-domains/README.md) — entity lifecycle & API per domain |
| Discovery | [DOCUMENTATION_COMPLETENESS_REPORT.md](./DOCUMENTATION_COMPLETENESS_REPORT.md) — 100% coverage |
| Master index | [MASTER_DOCUMENTATION_INDEX.md](./MASTER_DOCUMENTATION_INDEX.md) |
| Marketplace lifecycles | [17-marketplace/README.md](./17-marketplace/README.md) |
| Notifications | [18-notifications/README.md](./18-notifications/README.md) |
| Admin ops | [19-admin/README.md](./19-admin/README.md) |
| Observability | [21-observability/README.md](./21-observability/README.md) |
| Production | [14-production/PRODUCTION_STABILITY_REPORT.md](./14-production/PRODUCTION_STABILITY_REPORT.md) |
| Testing | [22-testing/README.md](./22-testing/README.md) |
| AI | [23-ai/README.md](./23-ai/README.md) |
| Launch | [24-launch/README.md](./24-launch/README.md) |
| Scaling | [25-scaling/README.md](./25-scaling/README.md) |

---

## 99-reports (tarixiy, faqat reference)

| Papka | Vazifa |
|-------|--------|
| [phase/](./99-reports/phase/) | PHASE_7 … PHASE_29C hisobotlar |
| [audits/](./99-reports/audits/) | UX, mobile, escrow, portfolio auditlar |
| [flows/](./99-reports/flows/) | Client/freelancer journey |
| [meta/](./99-reports/meta/) | Founder audit, product ready |

Ziddiyat bo'lsa: `00-constitution` + `01-product` + kod ustun.

---

*Oxirgi tozalash: 2026-06-15 — `docs/` va root stub'lar olib tashlandi. Faqat `rules/`.*
