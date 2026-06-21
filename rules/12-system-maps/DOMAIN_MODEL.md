# DOMAIN_MODEL.md

**Ishbor Marketplace — Core domain aggregates**  
**Version:** 1.0 · **Status:** Spec aligned with demo stores + FastAPI domain layer  
**Related:** [SERVICE_BOUNDARIES.md](./SERVICE_BOUNDARIES.md), [../11-backend/fastapi/DOMAIN_LAYER.md](../11-backend/fastapi/DOMAIN_LAYER.md), [../11-backend/postgresql/ERD.md](../11-backend/postgresql/ERD.md)

---

## 1. Purpose

Bu hujjat Ishbor **core aggregate** larini, ularning **invariant** larini va **bounded context** egalik chegaralarini belgilaydi. Aggregate — izchillik (consistency) chegarasi; tashqi modellar faqat ID orqali reference qiladi.

**Stack persistence:** PostgreSQL (source of truth) · Redis (cache/session) · MinIO (files)

**Demo hozir:** `*-store.ts` localStorage — aggregate qoidalari bir xil, persistence vaqtincha local.

---

## 2. Domain overview

```
                    ┌─────────────┐
                    │    User     │◄──────┐
                    └──────┬──────┘       │
           ┌───────────────┼───────────────┤
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼─────┐
    │   Project   │ │   Service   │ │  Agency   │
    └──────┬──────┘ └──────┬──────┘ └─────┬─────┘
           │               │               │
    ┌──────▼──────┐        │         members│
    │ Application │        │               │
    └──────┬──────┘        │               │
           │ accept         │ buy           │
           └───────┬────────┘               │
                   ▼                        │
            ┌─────────────┐                 │
            │    Order    │◄────────────────┘
            └──────┬──────┘
                   │
            ┌──────▼──────┐     ┌─────────────┐
            │   Escrow    │────►│   Wallet    │
            └─────────────┘     └─────────────┘
                   │
            ┌──────▼──────┐
            │ Conversation│ (parallel — messaging)
            └─────────────┘
```

**Money rule:** Barcha pul `Money` value object — Decimal, currency UZS (production default). Platform fee: **5%** (`PLATFORM_FEE_RATE`).

---

## 3. Aggregate: User

### 3.1 Identity

**Root ID:** `user_id` (UUID)

**Egasi:** AuthService + UserService

**Demo session:** `ishbor-session`; active role: `ishbor-active-role-{userId}`

**Turlar:**

| Field | Qiymatlar |
|-------|-----------|
| userType | client, freelancer (registration) |
| activeRole | client, freelancer, agency (runtime switch) |
| accountStatus | active, suspended, banned, pending |

### 3.2 Child entities (User aggregate ichida)

| Entity | Tavsif |
|--------|--------|
| Profile | username, fullName, bio, avatar |
| Settings | locale, notifications prefs |
| OnboardingState | company/skills steps completion |
| VerificationRequest | pending/approved/rejected |
| SecuritySettings | 2FA, password change timestamps |

### 3.3 Invariants

| # | Invariant |
|---|-----------|
| U1 | Email unique per account |
| U2 | username unique among freelancers (public `/freelancers/$username`) |
| U3 | activeRole ∈ user allowed roles; agency requires agency membership |
| U4 | suspended/banned user cannot checkout, message, or submit proposals |
| U5 | verified badge faqat AdminService.verify yoki approved verification |
| U6 | Trust/Success score hech qachon manual override — faqat computed (`growth-metrics`) |
| U7 | Dual account (client+freelancer) — bir user_id, role switcher orqali |

### 3.4 Demo accounts

| Email | Rol | Parol |
|-------|-----|-------|
| sardor@asaka.uz | Client | demo1234 |
| nargiza@ishbor.uz | Freelancer | demo1234 |
| admin@ishbor.uz | Admin | demo1234 |

### 3.5 Domain events

`UserRegistered`, `UserVerified`, `ActiveRoleSwitched`, `UserSuspended`

---

## 4. Aggregate: Project

### 4.1 Identity

**Root ID:** `project_id` · public slug: `/projects/$slug`

**Egasi:** ProjectService · store: `projects-store`

**Egasi (client):** User (client_id)

### 4.2 Attributes

| Field | Tavsif |
|-------|--------|
| title, description, budget | Loyiha scope |
| category, skills | Discovery/matching |
| status | draft → published → paused → closed |
| featured, featuredUntil | Promoted listing (7 kun) |
| attachments | FileService file_id references |

### 4.3 Invariants

| # | Invariant |
|---|-----------|
| P1 | Faqat owner (client) publish/pause/close/delete_draft |
| P2 | published loyiha public `/projects` da ko'rinadi — login shart emas |
| P3 | closed loyiha yangi taklif qabul qilmaydi |
| P4 | paused loyiha listingda "paused" holatda — apply bloklanishi mumkin |
| P5 | Featured faqat credits spend orqali — disclosure bilan |
| P6 | Budget UZS — Decimal, manfiy emas |
| P7 | Application aggregate alohida — Project faqat application_id reference |

### 4.4 Lifecycle

```
draft → publish → published
published → pause → paused
published → close → closed
paused → publish → published
```

### 4.5 Domain events

`ProjectPublished`, `ProjectPaused`, `ProjectClosed`, `ProjectFeatured`

---

## 5. Aggregate: Service (ServiceCatalog)

### 5.1 Identity

**Root ID:** `service_id` · slug: `/services/$slug`

**Egasi:** ServiceCatalogService · store: `services-store`

**Egasi (freelancer):** User (owner_id)

### 5.2 Attributes

| Field | Tavsif |
|-------|--------|
| title, description, packages | Gig paketlari |
| price, deliveryDays | Direct buy |
| category | `/services` filter |
| status | draft, published |
| featured, featuredUntil | Promotions |

### 5.3 Invariants

| # | Invariant |
|---|-----------|
| S1 | Faqat freelancer owner create/update/publish/delete |
| S2 | maxServices limit — SubscriptionService (free: 3, pro: 20, elite: ∞) |
| S3 | published service public discovery — login wall faqat buy |
| S4 | Direct buy → Order (CheckoutType.SERVICE) — service o'zgarmaydi |
| S5 | Featured cost: 100 000 UZS base, plan discount 10%/20% |
| S6 | Seller stats (Success Score) runtime computed — service aggregate da saqlanmaydi |

### 5.6 Domain events

`ServicePublished`, `ServicePurchased`, `ServiceFeatured`

---

## 6. Aggregate: Order

### 6.1 Identity

**Root ID:** `order_id` · route: `/orders/$id`

**Egasi:** OrderService · store: `orders-store`

### 6.2 Participants

| Role | Reference |
|------|-----------|
| client_id | User |
| freelancer_id / seller | User (username) |
| project_id OR service_id | Optional source |
| escrow_id | Escrow aggregate |

### 6.3 Checkout types

| Type | Manba |
|------|-------|
| SERVICE | `/services/$slug` → checkout |
| HIRE | `/freelancers/$username` → checkout |
| ORDER | Project application accept → checkout |

### 6.4 Status state machine

| Status | Label (UZ) |
|--------|------------|
| pending | To'lov kutilmoqda |
| in_progress | Jarayonda |
| review | Ko'rib chiqilmoqda |
| revision | Qayta ishlash |
| completed | Yakunlangan |
| disputed | Nizoli |
| cancelled | Bekor qilingan |

**Terminal:** completed, cancelled

### 6.5 Invariants

| # | Invariant |
|---|-----------|
| O1 | Faqat participant (client, freelancer) yoki admin order detail ko'radi — fail-closed |
| O2 | checkout_confirm → in_progress + escrow accepted/funded chain |
| O3 | confirm_delivery faqat review holatidan → completed |
| O4 | Review faqat completed order dan keyin (Review aggregate) |
| O5 | Platform fee 5% checkoutda hisoblanadi — yashirin emas |
| O6 | cancel terminal holatdan keyin mumkin emas |
| O7 | disputed order — escrow release bloklangan |
| O8 | amount Money — Decimal; fee + net = gross consistency |

### 6.6 Domain events

`OrderCreated`, `OrderFunded`, `OrderCompleted`, `OrderCancelled`, `OrderDisputed`

---

## 7. Aggregate: Escrow

### 7.1 Identity

**Root ID:** `escrow_id` · route: `/escrow/$id`

**Egasi:** EscrowService · store: `escrow-store`

**Bog'langan:** Order (1:1 yoki 1:N order-escrow policy — hozir 1:1)

### 7.2 Structure

| Component | Tavsif |
|-----------|--------|
| totalAmount | Client fund summasi |
| platformFee | 5% |
| milestones[] | MilestoneStatus: pending → funded → released |
| status | Escrow state machine |

### 7.3 Escrow status machine

| Status | Tavsif |
|--------|--------|
| pending | Yaratilgan |
| accepted | Shartlar qabul |
| funded | Mablag' ushlab turilgan |
| partially_released | Qisman release |
| completed | To'liq release |
| disputed | Nizoda — release freeze |
| refunded | Mijozga qaytarilgan |
| frozen | Admin freeze |

### 7.4 Invariants

| # | Invariant |
|---|-----------|
| E1 | fund faqat client actor — idempotency_key bilan |
| E2 | release_milestone faqat milestone FUNDED va escrow DISPUTED/FROZEN/REFUNDED emas |
| E3 | released milestones sum + platformFee ≤ total funded |
| E4 | open_dispute → escrow disputed + order disputed sinxron |
| E5 | admin_refund / admin_release — faqat admin RBAC |
| E6 | EscrowShield UI — barcha payment flow larda majburiy (trust) |
| E7 | Milestone release → Wallet credit freelancer (WalletService) |
| E8 | Bir xil idempotency_key qayta ishlanmaydi |

### 7.5 Domain events

`EscrowFunded`, `EscrowMilestoneReleased`, `EscrowDisputeOpened`, `EscrowRefunded`, `EscrowCompleted`

---

## 8. Aggregate: Wallet

### 8.1 Identity

**Root ID:** `wallet_id` (per user_id)

**Egasi:** WalletService · store: `wallet-store`

**Route:** `/wallet`

**Eslatma:** Credits promo wallet — **alohida aggregate** (CreditsService). Wallet — haqiqiy pul balans.

### 8.2 Structure

| Component | Tavsif |
|-----------|--------|
| balance | UZS available |
| transactions[] | deposit, withdraw, escrow_release, fee |
| payment_methods[] | Uzcard, Humo token refs |

### 8.3 Invariants

| # | Invariant |
|---|-----------|
| W1 | balance ≥ 0 — overdraft yo'q |
| W2 | withdraw ≤ available balance |
| W3 | deposit/withdraw idempotency_key majburiy |
| W4 | escrow release → deposit transaction linked to escrow_id |
| W5 | Wallet ≠ Credits wallet — aralash tranzaksiya yo'q |
| W6 | payment_methods faqat owner CRUD |
| W7 | Demo withdraw simulyatsiya; production PaymentService gateway |

### 8.4 Domain events

`WalletDeposited`, `WalletWithdrawn`, `WalletCreditedFromEscrow`

---

## 9. Aggregate: Conversation

### 9.1 Identity

**Root ID:** `conversation_id`

**Egasi:** MessagingService · store: `messages-store`

**Route:** `/messages`

### 9.2 Structure

| Component | Tavsif |
|-----------|--------|
| participants[] | user_id list (odatda 2) |
| messages[] | text, offer, system |
| offers[] | price, scope — accept → Order |
| read cursors | per participant |

### 9.3 Invariants

| # | Invariant |
|---|-----------|
| C1 | Faqat participant conversation va messages ko'radi |
| C2 | send_offer faqat freelancer (yoki agency member seller) |
| C3 | accept_offer → OrderService checkout chain — conversation o'zi order yaratmaydi |
| C4 | Message chronological — edit/delete policy: soft delete future |
| C5 | Response metrics (`growth-metrics`) — message received/responded timestamps |
| C6 | Realtime delivery WebSocket — aggregate source PostgreSQL |

### 9.4 Domain events

`MessageSent`, `OfferSent`, `OfferAccepted`, `ConversationArchived`

---

## 10. Aggregate: Agency

### 10.1 Identity

**Root ID:** `agency_id` · slug: `/agencies/$slug`

**Egasi:** AgencyService · store: `agency-store`

### 10.2 Structure

| Component | Tavsif |
|-----------|--------|
| profile | name, description, logo |
| members[] | user_id, role |
| case_studies[] | portfolio-like |
| clients[] | agency CRM pipeline |
| verificationStatus | owner request → admin queue |

### 10.3 Member roles

| Role | Permissions |
|------|-------------|
| owner | all + billing + verification request |
| manager | edit_agency, invite, CRM |
| recruiter | invite, view projects |
| freelancer | member profile, assigned work |

**Gate:** AgencyGate · `/dashboard/agency` · `/agency/clients` (view_crm)

### 10.4 Invariants

| # | Invariant |
|---|-----------|
| A1 | Exactly one owner per agency — owner transfer explicit |
| A2 | slug unique public |
| A3 | published profile — owner/manager publish action |
| A4 | member removal — owner/manager; owner o'zi olib bo'lmaydi |
| A5 | Agency CRM clients — agency scope, Client aggregate emas |
| A6 | Agency orders — member freelancer orqali Order aggregate (agency_id metadata) |
| A7 | Verification badge — admin approve, hardcode emas |

### 10.5 Domain events

`AgencyCreated`, `AgencyMemberInvited`, `AgencyPublished`, `AgencyVerificationRequested`

---

## 11. Supporting aggregates (reference)

Quyidagilar core 8 ta bilan chambarchas bog'liq — SERVICE_BOUNDARIES da alohida context:

| Aggregate | Service | Asosiy invariant |
|-----------|---------|------------------|
| Application | ApplicationService | 1 active pending per freelancer per project |
| Review | ReviewService | 1 review per completed order per client |
| Subscription | SubscriptionService | 1 active plan per user; usage reset monthly |
| CreditsWallet | CreditsService | spend ≤ balance; referral 50k UZS |
| Notification | NotificationService | user scoped; unread count consistent |
| Dispute | DisputeService | 1 open dispute per escrow at a time |
| File | FileService | owner upload; MinIO key immutable |

---

## 12. Cross-aggregate rules

| Qoida | Tavsif |
|-------|--------|
| Eventual consistency | Search/Ranking index — Outbox → async |
| No cross-aggregate FK mutation | Service orchestration + domain events |
| Participant access | Order, Escrow, Conversation — fail-closed entity guards |
| Admin override | AdminService → domain services, direct table yo'q |
| Mock + stored merge | Demo: yangi user action UI da ko'rinishi kerak |
| Reviews | completed order only |
| Referral complete | referred user meaningful action — completeReferral |

---

## 13. Aggregate → route → store map

| Aggregate | Public route | Owner workspace | Store (demo) |
|-----------|--------------|-----------------|--------------|
| User | `/freelancers/$username` | `/profile`, `/settings` | profile-store, auth |
| Project | `/projects/$slug` | `/my-projects`, `/projects/create` | projects-store |
| Service | `/services/$slug` | `/my-services`, `/services/create` | services-store |
| Order | — | `/orders/$id` | orders-store |
| Escrow | — | `/escrow/$id` | escrow-store |
| Wallet | — | `/wallet` | wallet-store |
| Conversation | — | `/messages` | messages-store |
| Agency | `/agencies/$slug` | `/dashboard/agency` | agency-store |

---

## 14. Production persistence map

| Aggregate | PostgreSQL | Redis | MinIO |
|-----------|------------|-------|-------|
| User | users, profiles | session | avatars |
| Project | projects | list cache | attachments |
| Service | services | list cache | gallery |
| Order | orders | — | deliverables |
| Escrow | escrows, milestones | — | — |
| Wallet | wallets, transactions | — | — |
| Conversation | conversations, messages | presence | attachments |
| Agency | agencies, members | — | logos, case studies |

---

## 15. Related documents

| Hujjat | Mavzu |
|--------|-------|
| [SERVICE_BOUNDARIES.md](./SERVICE_BOUNDARIES.md) | Service ownership |
| [DOMAIN_LAYER.md](../11-backend/fastapi/DOMAIN_LAYER.md) | State machines |
| [payments/ESCROW_SYSTEM.md](../11-backend/payments/ESCROW_SYSTEM.md) | Escrow detail |
| [TRUST_SYSTEM.md](../04-trust/TRUST_SYSTEM.md) | Trust invariants |
| [ROLE_MATRIX.md](../02-integration/ROLE_MATRIX.md) | RBAC |

---

*Aggregate invariant o'zgarganda DOMAIN_LAYER, ERD va tegishli domain spec (13-domains/) bir vaqtda yangilanadi.*
