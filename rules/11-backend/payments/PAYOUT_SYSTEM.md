# PAYOUT_SYSTEM.md

**Scope:** Freelancer fund receipt after milestone release — escrow → available balance  
**Maps:** `processEscrowMilestoneRelease()`, `releaseEscrowToFreelancer()`, `notifyEscrowReleased()`  
**Stack:** FastAPI `EscrowService` + `LedgerService` + Celery notification worker  
**Related:** [ESCROW_SYSTEM.md](./ESCROW_SYSTEM.md), [WALLET_SYSTEM.md](./WALLET_SYSTEM.md), [PLATFORM_FEE_SYSTEM.md](./PLATFORM_FEE_SYSTEM.md)

---

## 1. Definition

**Payout** (Ishbor terminology): Transfer of milestone funds from client escrow hold to freelancer **available wallet balance** after client approval or admin override. This is **not** a bank withdrawal — that is [WITHDRAWAL_SYSTEM.md](./WITHDRAWAL_SYSTEM.md).

```
Client escrow_held  ──release──▶  Freelancer available
                         │
                         └── lifetime_earned += amount
```

Platform 5% fee was already collected at checkout — payout transfers **100% of milestone amount** to freelancer.

---

## 2. Actors and triggers

| Actor | Action | API / store function |
|-------|--------|-------------------|
| Client | Approve milestone | `POST /escrow/{id}/milestones/{mid}/release` |
| Client | Approve full delivery | `approveOrderDelivery()` → batch release all funded milestones |
| Admin | Force release (dispute) | `POST /admin/escrow/{id}/release` → `adminReleaseEscrow()` |
| System | Auto-release (future P2) | Cron if client silent 14 days post-delivery |

**Blocked when:**
- Escrow `status = disputed` and admin has not authorized release
- `frozen_by_admin = true`
- Milestone `status != funded`

---

## 3. Atomic transaction (PostgreSQL)

Maps `processEscrowMilestoneRelease(clientUserId, freelancerUserId, amount, project)`:

```sql
BEGIN;

-- Lock escrow workflow
SELECT * FROM escrow_workflows WHERE id = :escrow_id FOR UPDATE;

-- Guard: milestone funded, caller authorized, not frozen
UPDATE escrow_milestones
SET status = 'released', released_at = NOW()
WHERE id = :milestone_id AND status = 'funded';

-- Client side: reduce escrow_held
UPDATE wallets SET escrow_held = escrow_held - :amount
WHERE user_id = :client_id AND escrow_held >= :amount;

-- Freelancer side: credit available + lifetime
UPDATE wallets SET
  available = available + :amount,
  lifetime_earned = lifetime_earned + :amount
WHERE user_id = :freelancer_id;

-- Ledger (double-entry)
-- Debit  client:escrow           :amount
-- Debit  platform:escrow_pool    :amount
-- Credit freelancer:available    :amount

-- User-facing transaction logs
INSERT INTO wallet_transactions (user_id, kind, category, label, amount, ...)
VALUES
  (:client_id, 'escrow_hold', 'escrow', 'Bosqich mablag''i chiqarildi', -:amount, ...),
  (:freelancer_id, 'escrow_release', 'release', 'Bosqich mablag''i chiqarildi', :amount, ...);

-- Timeline
INSERT INTO escrow_timeline_events (escrow_id, step, done) VALUES (:escrow_id, 'Mablag'' chiqarildi', true);

-- Complete escrow if all milestones released
UPDATE escrow_workflows SET status = 'completed'
WHERE id = :escrow_id
  AND NOT EXISTS (
    SELECT 1 FROM escrow_milestones
    WHERE escrow_id = :escrow_id AND status NOT IN ('released')
  );

COMMIT;
```

**Idempotency key:** `{escrow_id}:{milestone_id}:release` — duplicate POST returns 200 with original result.

---

## 4. FastAPI service layer

```python
class PayoutService:
    async def release_milestone(
        self,
        escrow_id: UUID,
        milestone_id: UUID,
        actor_id: UUID,
        idempotency_key: str,
        admin_override: bool = False,
    ) -> MilestoneReleaseResult:
        async with self.db.begin():
            escrow = await self.escrow_repo.lock(escrow_id)
            self._authorize_release(escrow, actor_id, admin_override)
            milestone = await self.escrow_repo.get_milestone(milestone_id)
            await self.ledger.post_milestone_release(
                client_id=escrow.client_user_id,
                freelancer_id=escrow.freelancer_user_id,
                amount=milestone.amount,
                escrow_id=escrow_id,
                milestone_id=milestone_id,
                idempotency_key=idempotency_key,
            )
            await self.escrow_repo.mark_released(milestone_id)
        await self.events.emit("EscrowMilestoneReleased", ...)
        return MilestoneReleaseResult(...)
```

Admin path sets `admin_override=True` and requires `finance` role + MFA.

---

## 5. Partial and split payouts (disputes)

Admin dispute resolution may split milestone amount:

| Resolution | Client refund | Freelancer payout |
|------------|---------------|-------------------|
| Full to freelancer | $0 | 100% milestone |
| Full to client | 100% | $0 (refund flow) |
| 60/40 split | 40% | 60% |

Split posts **two ledger groups** in one transaction — both must balance. Audit entry required with resolution notes in Uzbek for user notification.

Maps admin audit seed: *"Nizo hal qilindi — to'lov 60/40 bo'lib taqsimlandi"*.

---

## 6. Notifications and events

On successful release:

| Channel | Recipient | Template |
|---------|-----------|----------|
| In-app | Freelancer | `notifyEscrowReleased()` — kind: escrow |
| In-app | Client | Optional confirmation — kind: escrow |
| Email | Freelancer | `escrow.released` — high priority |
| WebSocket | Both | `escrow.updated` on order channel |

Domain event `EscrowMilestoneReleased` enqueued to outbox → NotificationWorker.

---

## 7. User-visible wallet labels (Uzbek)

| kind | category | label |
|------|----------|-------|
| escrow_release | release | Bosqich mablag'i chiqarildi |
| in | milestone | (legacy alias in seed data) |

Freelancer `/wallet` filter "Incoming" shows release transactions. `runningBalance` reflects post-credit available.

---

## 8. Order completion linkage

When all milestones `status = released`:

1. `escrow_workflows.status` → `completed`
2. `orders.status` → `completed` (if delivery approved)
3. Review prompt triggered for both parties
4. Trust score recalculation job queued
5. GMV analytics event (not additional platform fee)

`computePlatformRevenue()` uses completed orders for reporting — fee already in `revenue_ledger` at fund time.

---

## 9. Payout vs withdrawal distinction

| | Payout | Withdrawal |
|---|--------|------------|
| Direction | Escrow → Ishbor wallet | Ishbor wallet → Bank card |
| Actor initiates | Client or admin | Freelancer |
| Fee | None (5% at fund) | Gateway pass-through |
| KYC required | No | Yes above threshold |
| Pending bucket | No | Yes (`pending` balance) |

Freelancer must **release milestone → available → withdraw** as two-step flow.

---

## 10. Admin operations

| Route | Action |
|-------|--------|
| `/admin/escrow` | List workflows with funded milestones |
| `/admin/escrow/$id` | Release, freeze, refund buttons |
| `/admin/disputes` | Resolution → may trigger payout or refund |

`adminReleaseEscrow(escrowId, milestoneLabel)` → `releaseEscrowMilestone()` in escrow-store.

**Production:** MFA + dual approval for admin release > $5,000 USD equivalent.

---

## 11. Reconciliation invariants

Daily check:

```sql
-- Sum freelancer releases today = escrow pool debits
SELECT SUM(amount) FROM wallet_transactions
WHERE kind = 'escrow_release' AND created_at >= CURRENT_DATE;

-- Client escrow_held matches sum of funded (not released) milestones
SELECT SUM(escrow_held) FROM wallets
  = SELECT SUM(amount) FROM escrow_milestones WHERE status IN ('funded', 'disputed');
```

Violation → freeze releases (P0).

---

## 12. Edge cases

| Case | Handling |
|------|----------|
| Duplicate release click | Idempotency key — no double credit |
| Insufficient client escrow_held | 409 — data corruption alert |
| Freelancer account suspended | Release still credits wallet; withdrawal blocked |
| Client account suspended mid-order | Admin-only release/refund |
| Milestone amount > remaining escrow | Block — milestone amounts must sum to order subtotal |
| Currency rounding | Round to 2 decimals USD; last milestone absorbs penny diff |

---

## 13. API summary

| Method | Path | Response |
|--------|------|----------|
| POST | `/api/v1/escrow/{id}/milestones/{mid}/release` | `{ milestone, freelancer_wallet }` |
| POST | `/api/v1/orders/{id}/approve-delivery` | Batch release all funded |
| POST | `/api/v1/admin/escrow/{id}/release` | Admin override |
| GET | `/api/v1/wallet` | Updated `available`, `lifetimeEarned` |

WebSocket: subscribe `user:{freelancerId}` for `wallet.updated`.

---

## 14. Migration from demo

Remove client-side `processEscrowMilestoneRelease()` mutations. Escrow release buttons call API; optimistic UI rolls back on 409/402.

---

*Payout is the freelancer's payday inside Ishbor — escrow milestone funds become spendable available balance, ready for bank withdrawal after KYC gates.*
