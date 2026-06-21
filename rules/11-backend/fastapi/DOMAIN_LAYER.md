# DOMAIN_LAYER.md

**Project:** Ishbor Marketplace  
**Framework:** Pydantic v2 models + explicit state machines  
**Source:** Frontend stores (`orders-store.ts`, `escrow-store.ts`, `admin-mock-data.ts`) + DATABASE_SCHEMA.md

---

## 1. Purpose

The domain layer defines business entities, enums, state transition rules, and domain events independent of FastAPI routers and SQLAlchemy ORM. Services validate transitions here before persisting.

**Package layout:**
```
app/domain/
├── enums.py           # Shared enums
├── auth.py            # SessionContext, UserType
├── orders.py          # OrderStatus machine
├── escrow.py          # EscrowStatus machine
├── disputes.py        # DisputeStatus machine
├── events.py          # DomainEvent base + catalog
├── money.py           # Money value object (Decimal)
└── validators.py      # Cross-field business validators
```

---

## 2. Value objects

### 2.1 Money

```python
class Money(BaseModel):
    amount: Decimal = Field(decimal_places=2, max_digits=12)
    currency: Literal["USD", "UZS"] = "USD"

    @field_validator("amount")
    @classmethod
    def non_negative_where_required(cls, v: Decimal, info) -> Decimal:
        return v.quantize(Decimal("0.01"))
```

**Rule:** Never use `float` for money. Platform fee: 5% (`PLATFORM_FEE_RATE = Decimal("0.05")`).

### 2.2 Slug

```python
class Slug(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v: str) -> str:
        if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", v):
            raise ValueError("Slug format invalid")
        return v
```

---

## 3. Core enums

```python
class UserType(str, Enum):
    CLIENT = "client"
    FREELANCER = "freelancer"

class ActiveRole(str, Enum):
    CLIENT = "client"
    FREELANCER = "freelancer"
    AGENCY = "agency"

class AccountStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    BANNED = "banned"
    PENDING = "pending"

class ProjectStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    PAUSED = "paused"
    CLOSED = "closed"

class ApplicationStatus(str, Enum):
    PENDING = "pending"
    SHORTLISTED = "shortlisted"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class OrderStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    REVISION = "revision"
    COMPLETED = "completed"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"

class EscrowStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    FUNDED = "funded"
    PARTIALLY_RELEASED = "partially_released"
    COMPLETED = "completed"
    DISPUTED = "disputed"
    REFUNDED = "refunded"
    FROZEN = "frozen"

class MilestoneStatus(str, Enum):
    PENDING = "pending"
    FUNDED = "funded"
    RELEASED = "released"
    DISPUTED = "disputed"

class DisputeStatus(str, Enum):
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    RESOLVED_CLIENT = "resolved_client"
    RESOLVED_FREELANCER = "resolved_freelancer"
    RESOLVED_SPLIT = "resolved_split"
    CLOSED = "closed"

class CheckoutType(str, Enum):
    SERVICE = "service"
    HIRE = "hire"
    ORDER = "order"
```

---

## 4. Order state machine

Maps frontend `OrderStatusBadge` states from `trust.tsx`.

### 4.1 States

| State | Description | Frontend label |
|-------|-------------|----------------|
| `pending` | Order created, awaiting payment/fund | — |
| `in_progress` | Work started, escrow funded | Jarayonda |
| `review` | Freelancer submitted deliverable | Ko'rib chiqilmoqda |
| `revision` | Client requested changes | Qayta ishlash |
| `completed` | Client confirmed delivery | Yakunlangan |
| `disputed` | Escrow dispute opened | Nizoli |
| `cancelled` | Cancelled by participant or admin | Bekor qilingan |

### 4.2 Transition table

| From | Event / Action | To | Actor |
|------|----------------|-----|-------|
| `pending` | `checkout_confirm` success | `in_progress` | System |
| `pending` | `cancel` | `cancelled` | Client |
| `in_progress` | Freelancer submits work | `review` | Freelancer |
| `review` | `confirm_delivery` | `completed` | Client |
| `review` | `request_revision` | `revision` | Client |
| `revision` | Freelancer resubmits | `review` | Freelancer |
| `*` (not terminal) | `open_dispute` | `disputed` | Client or Freelancer |
| `disputed` | Admin resolves → complete | `completed` | Admin |
| `disputed` | Admin resolves → cancel | `cancelled` | Admin |
| `in_progress`, `review`, `revision` | `cancel` (mutual/policy) | `cancelled` | Participant |
| `*` | Admin force complete | `completed` | Admin |
| `*` | Admin force cancel | `cancelled` | Admin |

### 4.3 Implementation

```python
class OrderStateMachine:
    TRANSITIONS: dict[OrderStatus, dict[str, OrderStatus]] = {
        OrderStatus.PENDING: {
            "checkout_confirm": OrderStatus.IN_PROGRESS,
            "cancel": OrderStatus.CANCELLED,
        },
        OrderStatus.IN_PROGRESS: {
            "submit_work": OrderStatus.REVIEW,
            "open_dispute": OrderStatus.DISPUTED,
            "cancel": OrderStatus.CANCELLED,
        },
        OrderStatus.REVIEW: {
            "confirm_delivery": OrderStatus.COMPLETED,
            "request_revision": OrderStatus.REVISION,
            "open_dispute": OrderStatus.DISPUTED,
        },
        OrderStatus.REVISION: {
            "submit_work": OrderStatus.REVIEW,
            "open_dispute": OrderStatus.DISPUTED,
        },
        OrderStatus.DISPUTED: {
            "resolve_complete": OrderStatus.COMPLETED,
            "resolve_cancel": OrderStatus.CANCELLED,
        },
    }

    TERMINAL = {OrderStatus.COMPLETED, OrderStatus.CANCELLED}

    @classmethod
    def transition(cls, current: OrderStatus, event: str) -> OrderStatus:
        if current in cls.TERMINAL:
            raise InvalidTransitionError(current, event)
        next_status = cls.TRANSITIONS.get(current, {}).get(event)
        if not next_status:
            raise InvalidTransitionError(current, event)
        return next_status
```

**Side effects on transition:**
- → `completed`: emit `OrderCompleted`, prompt review, refresh ranking
- → `disputed`: emit `EscrowDisputeOpened`, freeze escrow releases
- → `cancelled`: refund escrow if funded, emit `OrderCancelled`

---

## 5. Escrow state machine

Maps `escrow-store.ts` workflow states.

### 5.1 States

| State | Description |
|-------|-------------|
| `pending` | Escrow row created, not yet accepted |
| `accepted` | Terms accepted, awaiting client fund |
| `funded` | Client funds held in platform escrow |
| `partially_released` | At least one milestone released, others remain |
| `completed` | All milestones released to freelancer |
| `disputed` | Dispute opened — releases frozen |
| `refunded` | Funds returned to client |
| `frozen` | Admin freeze — no releases |

### 5.2 Transition table

| From | Event | To | Actor |
|------|-------|-----|-------|
| `pending` | Order checkout creates escrow | `accepted` | System |
| `accepted` | `fund` | `funded` | Client |
| `funded` | `release_milestone` (partial) | `partially_released` | Client |
| `funded` | `release_milestone` (all) | `completed` | Client |
| `partially_released` | `release_milestone` (remaining) | `completed` | Client |
| `funded`, `partially_released` | `open_dispute` | `disputed` | Participant |
| `disputed` | Admin resolve → freelancer | `completed` | Admin |
| `disputed` | Admin resolve → client | `refunded` | Admin |
| `*` | Admin `freeze` | `frozen` | Admin |
| `frozen` | Admin `unfreeze` | previous state | Admin |
| `funded`, `disputed` | Admin `refund` | `refunded` | Admin |

### 5.3 Milestone sub-state machine

```
pending → funded (on escrow fund — first milestone or proportional)
funded → released (on client release)
funded → disputed (on order dispute)
disputed → released (on admin resolve favor freelancer)
```

```python
class EscrowStateMachine:
    @classmethod
    def can_release_milestone(cls, escrow: EscrowStatus, milestone: MilestoneStatus) -> bool:
        if escrow in (EscrowStatus.DISPUTED, EscrowStatus.FROZEN, EscrowStatus.REFUNDED):
            return False
        return milestone == MilestoneStatus.FUNDED
```

**Invariant:** Sum of released milestone amounts + platform fee ≤ total funded amount.

---

## 6. Dispute state machine

Maps admin disputes from `admin-mock-data.ts`.

### 6.1 States

| State | Description |
|-------|-------------|
| `open` | Dispute filed, awaiting admin |
| `under_review` | Admin investigating |
| `resolved_client` | Full refund to client |
| `resolved_freelancer` | Full release to freelancer |
| `resolved_split` | Partial split |
| `closed` | Archived after resolution |

### 6.2 Transition table

| From | Event | To | Actor |
|------|-------|-----|-------|
| — | `open_dispute` | `open` | Participant |
| `open` | Admin picks up | `under_review` | Admin |
| `under_review` | Resolve for client | `resolved_client` | Admin |
| `under_review` | Resolve for freelancer | `resolved_freelancer` | Admin |
| `under_review` | Split resolution | `resolved_split` | Admin |
| `resolved_*` | Archive | `closed` | System (cron) or Admin |

```python
class DisputeStateMachine:
    RESOLUTION_STATES = {
        DisputeStatus.RESOLVED_CLIENT,
        DisputeStatus.RESOLVED_FREELANCER,
        DisputeStatus.RESOLVED_SPLIT,
    }

    @classmethod
    def resolve(
        cls,
        current: DisputeStatus,
        resolution: Literal["client", "freelancer", "split"],
    ) -> DisputeStatus:
        if current != DisputeStatus.UNDER_REVIEW:
            raise InvalidTransitionError(current, f"resolve_{resolution}")
        return {
            "client": DisputeStatus.RESOLVED_CLIENT,
            "freelancer": DisputeStatus.RESOLVED_FREELANCER,
            "split": DisputeStatus.RESOLVED_SPLIT,
        }[resolution]
```

**Side effects:**
- `resolved_client` → EscrowService.admin_refund + OrderStatus → cancelled
- `resolved_freelancer` → EscrowService.admin_release + OrderStatus → completed
- `resolved_split` → partial wallet transactions per split DTO

---

## 7. Domain events

Base event schema (EVENT_ARCHITECTURE.md):

```python
class DomainEvent(BaseModel, Generic[T]):
    event_id: UUID = Field(default_factory=uuid4)
    event_type: str
    aggregate_type: str
    aggregate_id: UUID
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    actor_user_id: UUID | None = None
    payload: T
    metadata: EventMetadata | None = None

    model_config = ConfigDict(frozen=True)
```

### 7.1 Event factory examples

```python
def order_completed(order_id: UUID, actor_id: UUID) -> DomainEvent[OrderCompletedPayload]:
    return DomainEvent(
        event_type="OrderCompleted",
        aggregate_type="order",
        aggregate_id=order_id,
        actor_user_id=actor_id,
        payload=OrderCompletedPayload(order_id=order_id),
    )
```

### 7.2 Payload models (selected)

```python
class CheckoutCompletedPayload(BaseModel):
    order_id: UUID
    escrow_id: UUID
    payment_record_id: UUID
    amount: Money
    platform_fee: Money

class EscrowMilestoneReleasedPayload(BaseModel):
    escrow_id: UUID
    milestone_id: UUID
    amount: Money
    freelancer_id: UUID

class ApplicationAcceptedPayload(BaseModel):
    application_id: UUID
    order_id: UUID
    project_id: UUID
    client_id: UUID
    freelancer_id: UUID
```

Full catalog: EVENT_ARCHITECTURE.md §3.

---

## 8. Domain validation rules

| Entity | Rule | Error code |
|--------|------|------------|
| Project | title min 10 chars, budget > 0 | `PROJECT_VALIDATION` |
| Application | proposal amount ≤ project budget × 1.5 | `PROPOSAL_OVER_BUDGET` |
| Checkout | payment method belongs to client | `PAYMENT_METHOD_FORBIDDEN` |
| Escrow fund | wallet balance ≥ amount + fee | `ESCROW_INSUFFICIENT_BALANCE` |
| Review | order status must be `completed` | `REVIEW_ORDER_NOT_COMPLETE` |
| Service create | subscription limit not exceeded | `SUBSCRIPTION_LIMIT` |
| Proposal submit | monthly limit (free: 10) | `PROPOSAL_LIMIT_EXCEEDED` |

Validators live in `app/domain/validators.py` — called by services before state transitions.

---

## 9. Aggregate boundaries

| Aggregate root | Child entities | Consistency boundary |
|----------------|----------------|---------------------|
| Order | milestones, reviews | Single UoW with Escrow on checkout |
| Escrow | milestones, timeline | Single UoW with Wallet on fund/release |
| User | profile, settings | Profile updates independent |
| Project | attachments, applications | Application accept spans Order aggregate |
| Conversation | messages | Message append independent; offer accept spans Order |

**Cross-aggregate rule:** Use domain events + outbox — never direct cross-service DB joins in one transaction except documented pairs (Order + Escrow + Wallet on checkout).

---

## 10. Mapping ORM ↔ Domain

```python
def order_to_domain(orm: OrderORM) -> OrderDomain:
    return OrderDomain(
        id=orm.id,
        status=OrderStatus(orm.status),
        client_id=orm.client_id,
        freelancer_id=orm.freelancer_id,
        total=Money(amount=orm.total_amount),
        progress=orm.progress,
    )
```

ORM models in `app/models/` (SQLAlchemy). Domain models in `app/domain/`. Never expose ORM to routers.

---

*See also: [EVENT_ARCHITECTURE.md](../EVENT_ARCHITECTURE.md), [PAYMENT_ARCHITECTURE.md](../PAYMENT_ARCHITECTURE.md), [SERVICE_LAYER.md](./SERVICE_LAYER.md)*
