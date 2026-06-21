# STORE_REGISTRY.md

All client-side persistence for Ishbor (localStorage / sessionStorage).

---

## Session & identity

| Key | Structure | Consumers | Dependencies |
|-----|-----------|-----------|--------------|
| `ishbor-session` | `AuthSession { user, remember, loggedInAt }` | useAuth, all guards | auth.ts + HttpOnly ishbor_sid cookie |
| `ishbor-active-role-{userId}` | `"client"` \| `"freelancer"` \| `"agency"` | active-role-store, RoleGate | auth session |
| `ishbor-onboarding` | `OnboardingState` (sessionStorage) | onboarding routes, register | auth-constants |
| `ishbor-pending-registration-password` | string (sessionStorage) | verify-otp | registration-store |
| `ishbor-user-status` | email → AccountStatus | login block | user-status-store |
| `ishbor-locale` | `"uz"` \| `"en"` \| `"ru"` | footer | locale-store |

---

## User data stores

| Key | Structure | Consumers | Cap/notes |
|-----|-----------|-----------|-----------|
| `ishbor-user-projects` | `Project[]` | my-projects, projects pages | — |
| `ishbor-user-services` | `StoredService[]` | my-services, services | — |
| `ishbor-user-portfolios` | `PortfolioItem[]` | portfolio routes | — |
| `ishbor-user-orders` | `Order[]` | orders, dashboard, crm | Merged with mock |
| `ishbor-user-escrow` | `EscrowWorkflow[]` | escrow routes | Merged with mock |
| `ishbor-user-applications` | `Application[]` | applications | — |
| `ishbor-user-profiles` | Profile extensions | profile, settings | — |
| `ishbor-reviews` | `Review[]` | profiles, order detail | — |
| `ishbor-saved` | `{ userId: SavedEntry[] }` | saved, SaveButton | By user |

---

## Communication

| Key | Structure | Consumers | Cap/notes |
|-----|-----------|-----------|-----------|
| `ishbor-messages-{userId}` | `{ conversations, threads }` | messages route | Legacy: `ishbor-messages` |
| `ishbor-notifications` | `Record<userId, AppNotification[]>` | notifications | Rejects array corrupt |
| `ishbor-response-metrics` | Per-username pending/history | trust, growth-metrics | — |

---

## Money & monetization

| Key | Structure | Consumers | Cap/notes |
|-----|-----------|-----------|-----------|
| `ishbor-wallet` | `Record<userId, Wallet>` | wallet, checkout | — |
| `ishbor-payment-methods` | Payment methods by user | wallet, settings | — |
| `ishbor-subscriptions` | Subscription by user | subscription, promotions | — |
| `ishbor-subscription-usage` | `{userId}:{YYYY-MM}` proposal count | subscription | — |
| `ishbor-credits-wallet` | Credits balance + txs | promotions, featured | 500 txs cap |
| `ishbor-revenue-log` | Revenue entries | revenue, admin | 2000 cap |
| `ishbor-featured-listings` | Featured purchases | promotions, analytics | — |
| `ishbor-featured-profile-{userId}` | `{ start, until }` | featured-store | Inline key |

---

## Settings & trust config

| Key | Structure | Consumers |
|-----|-----------|-----------|
| `ishbor-settings` | User settings per id | settings tabs |
| `ishbor-security` | 2FA, sessions | security tab |
| `ishbor-verification-settings` | KYC docs state | verification tab |
| `ishbor-alerts` | Job alerts | job-alerts tab |
| `ishbor-referrals` | Referral codes/credits | referral tab |
| `ishbor-ftue-state` | FTUE completion flags | ftue components |

---

## Analytics & admin

| Key | Structure | Consumers | Cap |
|-----|-----------|-----------|-----|
| `ishbor-analytics-events` | `AnalyticsEvent[]` | analytics routes | 5000 |
| `ishbor-portfolio-analytics` | View/save/share counts | portfolio analytics | — |
| `ishbor-admin-data` | Admin entity snapshots | admin panel | — |
| `ishbor-agencies` | `Agency[]` | agency routes | — |
| `ishbor-agency-portfolio` | Case studies | agency dashboard | — |
| `ishbor-conversion-store` | — | In-memory | conversion-store.ts |

---

## In-memory only (no localStorage)

| Module | Purpose |
|--------|---------|
| admin-store | Admin UI state, audit log |
| agency-metrics-store | Computed metrics |
| agency-ranking-store | Ranking scores |
| crm-store | Computed CRM views |
| monetization-store | Revenue overview compute |
| ranking-store | Marketplace ranking |
| reputation-store | Tier computation |
| visibility-store | Funnel metrics |
| ai-matching-store | Match suggestions |
| ai-opportunity-store | Opportunity scores |

---

## Store conventions

1. **Subscribe/notify pattern:** `subscribeX()` + `listeners Set`
2. **Cache invalidation:** Set cache null on write
3. **Stable empty:** Export `EMPTY_*` constants for useSyncExternalStore
4. **User scoping:** Key by `user.id` where multi-tenant
5. **Corruption guard:** Reject invalid JSON shapes (see notifications-store)
6. **SSR:** Return stable defaults when `typeof window === "undefined"`

---

## QA tools

| Tool | Purpose |
|------|---------|
| `src/lib/stress-seed.ts` | Populate all major keys for scale test |
| `clearStressSeed()` | Remove stress data |

---

**Total localStorage keys:** 31+ patterns

*See STORE_REGISTRY when adding new persistence — avoid duplicate keys.*
