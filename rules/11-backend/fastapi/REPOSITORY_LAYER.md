# REPOSITORY_LAYER.md

**Project:** Ishbor Marketplace  
**ORM:** SQLAlchemy 2.0 async (`asyncpg` driver)  
**Pattern:** Repository per aggregate + Unit of Work

---

## 1. Purpose

Repositories encapsulate all PostgreSQL access. Services call repositories; repositories never call services. Each repository maps to one aggregate root (or supporting entity group) from DATABASE_SCHEMA.md.

**Rules:**
- Use `select()` / `insert()` / `update()` Core API — avoid legacy `session.query()`
- Return ORM models to services; services map to Pydantic DTOs
- All queries filter `deleted_at IS NULL` where soft-delete applies
- Money queries use `SELECT ... FOR UPDATE` inside UnitOfWork transactions

---

## 2. Base infrastructure

### 2.1 Async engine

```python
# app/core/database.py
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=settings.SQL_ECHO,
)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)
```

### 2.2 Base repository

```python
class BaseRepository(Generic[T]):
    def __init__(self, session: AsyncSession, model: type[T]):
        self.session = session
        self.model = model

    async def get_by_id(self, id: UUID) -> T | None:
        return await self.session.get(self.model, id)

    async def add(self, entity: T) -> T:
        self.session.add(entity)
        return entity

    async def flush(self) -> None:
        await self.session.flush()
```

### 2.3 Unit of Work

```python
class UnitOfWork:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.users = UserRepository(session)
        self.orders = OrderRepository(session)
        self.escrow = EscrowRepository(session)
        self.wallets = WalletRepository(session)
        self.outbox = OutboxRepository(session)
        # ... all repos attached

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        if exc_type:
            await self.session.rollback()
        else:
            await self.session.commit()

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()
```

**Money operations:** Always `async with uow:` — never commit mid-escrow without full transaction.

---

## 3. Repository catalog

| Repository | Aggregate / tables | Key methods |
|------------|-------------------|-------------|
| `UserRepository` | `users` | `get_by_email`, `get_by_username`, `get_by_id_for_update` |
| `SessionRepository` | `sessions` | `get_by_token_hash`, `create`, `delete_by_user`, `delete_expired` |
| `OAuthAccountRepository` | `oauth_accounts` | `get_by_provider`, `upsert` |
| `ProfileRepository` | `user_profiles`, `freelancer_profiles`, `client_profiles` | `get_by_user_id`, `update_partial` |
| `ProjectRepository` | `projects`, `project_attachments` | `get_public_by_slug`, `list_public`, `create`, `update_status` |
| `ServiceRepository` | `services`, `service_packages`, `service_gallery` | `get_public_by_slug`, `list_by_category` |
| `ApplicationRepository` | `applications` | `list_for_freelancer`, `get_for_project`, `count_monthly` |
| `OrderRepository` | `orders`, `order_milestones` | `get_by_id`, `list_for_participant`, `create`, `update_status` |
| `EscrowRepository` | `escrow_workflows`, `escrow_milestones`, `escrow_timeline` | `get_by_order_id`, `fund`, `release_milestone` |
| `DisputeRepository` | `disputes` | `create`, `resolve`, `list_open` |
| `WalletRepository` | `wallets`, `wallet_transactions` | `get_for_update`, `append_transaction` |
| `PaymentMethodRepository` | `payment_methods` | `list_for_user`, `set_default` |
| `PaymentRecordRepository` | `payment_records` | `create`, `get_by_gateway_ref` |
| `SubscriptionRepository` | `subscriptions`, `subscription_usage_monthly` | `get_active`, `increment_usage` |
| `CreditsRepository` | `credits_wallets`, `credit_transactions` | `get_balance`, `append_transaction` |
| `ReviewRepository` | `reviews` | `create`, `list_by_freelancer`, `avg_rating` |
| `PortfolioRepository` | `portfolios`, `portfolio_links` | `get_public_by_slug`, `list_for_user` |
| `SavedItemRepository` | `saved_items` | `list`, `upsert`, `delete` |
| `AgencyRepository` | `agencies`, `agency_members`, `agency_case_studies` | `get_by_slug`, `list_members` |
| `ConversationRepository` | `conversations`, `conversation_participants` | `list_for_user`, `get_participant` |
| `MessageRepository` | `messages` | `list_cursor`, `create`, `mark_read` |
| `NotificationRepository` | `notifications`, `notification_preferences` | `list`, `unread_count`, `create` |
| `SearchDocumentRepository` | `search_documents` | `upsert`, `delete_by_entity` |
| `AnalyticsEventRepository` | `analytics_events` | `bulk_insert`, `aggregate` |
| `ModerationRepository` | `moderation_items` | `list_queue`, `resolve` |
| `SupportTicketRepository` | `support_tickets`, `support_messages` | `list`, `add_message` |
| `VerificationRepository` | `verification_documents` | `list_pending`, `approve` |
| `FeaturedListingRepository` | `featured_listings` | `list_active`, `expire_past` |
| `ReferralRepository` | `referrals`, `referral_entries` | `get_by_code`, `complete` |
| `RevenueLedgerRepository` | `revenue_ledger` | `append`, `sum_by_period` |
| `FileRepository` | `files` | `create`, `get_by_id`, `mark_confirmed` |
| `AuditLogRepository` | `audit_logs` | `append`, `query` |
| `OutboxRepository` | `outbox_events` | `insert`, `fetch_unprocessed`, `mark_processed` |
| `AIUsageLogRepository` | `ai_usage_logs` | `insert`, `count_hourly` |
| `AdminRoleRepository` | `admin_role_assignments` | `get_for_user` |
| `IdempotencyRepository` | `idempotency_keys` | `get_or_create`, `store_response` |

---

## 4. Representative repository implementations

### 4.1 UserRepository

```python
class UserRepository(BaseRepository[User]):
    async def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email, User.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_for_update(self, user_id: UUID) -> User | None:
        stmt = select(User).where(User.id == user_id).with_for_update()
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
```

### 4.2 SessionRepository

```python
class SessionRepository(BaseRepository[Session]):
    async def get_by_token_hash(self, token_hash: str) -> Session | None:
        stmt = (
            select(Session)
            .options(joinedload(Session.user))
            .where(Session.token_hash == token_hash, Session.expires_at > func.now())
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def delete_oldest_over_limit(self, user_id: UUID, keep: int = 10) -> list[str]:
        """Returns token_hashes of deleted sessions for Redis invalidation."""
        ...
```

### 4.3 OrderRepository

```python
class OrderRepository(BaseRepository[Order]):
    async def list_for_participant(
        self, user_id: UUID, params: PageParams
    ) -> tuple[list[Order], int]:
        stmt = (
            select(Order)
            .where(
                or_(Order.client_id == user_id, Order.freelancer_id == user_id),
                Order.deleted_at.is_(None),
            )
            .order_by(Order.created_at.desc())
            .offset(params.offset)
            .limit(params.limit)
        )
        ...

    async def update_status(self, order_id: UUID, status: OrderStatus) -> Order:
        stmt = (
            update(Order)
            .where(Order.id == order_id)
            .values(status=status, updated_at=func.now())
            .returning(Order)
        )
        ...
```

### 4.4 WalletRepository (money-critical)

```python
class WalletRepository(BaseRepository[Wallet]):
    async def get_for_update(self, user_id: UUID) -> Wallet:
        stmt = select(Wallet).where(Wallet.user_id == user_id).with_for_update()
        result = await self.session.execute(stmt)
        wallet = result.scalar_one()
        return wallet

    async def append_transaction(
        self,
        wallet_id: UUID,
        tx: WalletTransactionCreate,
    ) -> WalletTransaction:
        wallet = await self.session.get(Wallet, wallet_id, with_for_update=True)
        if wallet.balance + tx.amount < 0:
            raise InsufficientBalanceError()
        wallet.balance += tx.amount
        entity = WalletTransaction(**tx.model_dump(), wallet_id=wallet_id)
        self.session.add(entity)
        await self.session.flush()
        return entity
```

### 4.5 OutboxRepository

```python
class OutboxRepository(BaseRepository[OutboxEvent]):
    async def insert(self, event: DomainEvent) -> OutboxEvent:
        row = OutboxEvent(
            aggregate_type=event.aggregate_type,
            aggregate_id=event.aggregate_id,
            event_type=event.event_type,
            payload=event.model_dump(mode="json"),
        )
        self.session.add(row)
        await self.session.flush()
        return row

    async def fetch_unprocessed(self, limit: int = 50) -> list[OutboxEvent]:
        stmt = (
            select(OutboxEvent)
            .where(OutboxEvent.processed_at.is_(None))
            .order_by(OutboxEvent.created_at)
            .limit(limit)
            .with_for_update(skip_locked=True)
        )
        ...
```

---

## 5. Query patterns

### 5.1 Public listing with filters

```python
async def list_public(self, params: ProjectListParams) -> tuple[list[Project], int]:
    base = select(Project).where(
        Project.status == "published",
        Project.deleted_at.is_(None),
    )
    if params.category:
        base = base.where(Project.category == params.category)
    if params.q:
        base = base.where(Project.title.ilike(f"%{params.q}%"))
    count_stmt = select(func.count()).select_from(base.subquery())
    ...
```

### 5.2 Full-text search (phase 1)

```python
stmt = select(SearchDocument).where(
    SearchDocument.document.op("@@")(func.plainto_tsquery("simple", query))
).order_by(func.ts_rank(...).desc())
```

### 5.3 Cursor pagination (messages)

```python
stmt = (
    select(Message)
    .where(Message.conversation_id == conv_id, Message.created_at < cursor)
    .order_by(Message.created_at.desc())
    .limit(limit)
)
```

---

## 6. Idempotency storage

```python
class IdempotencyRepository:
    async def get_cached_response(self, key: str, user_id: UUID) -> IdempotencyRecord | None:
        stmt = select(IdempotencyKey).where(
            IdempotencyKey.key == key,
            IdempotencyKey.user_id == user_id,
            IdempotencyKey.expires_at > func.now(),
        )
        ...

    async def store_response(self, key: str, user_id: UUID, response: dict, status: int) -> None:
        ...
```

Table: `idempotency_keys (key, user_id, response_body, status_code, expires_at)` — TTL 24h.

---

## 7. Migration strategy

- Alembic autogenerate disabled for production — hand-reviewed migrations only
- Naming: `{seq}_{description}.py` e.g. `001_initial_schema.py`
- Seed: `016_seed_demo_data.sql` for non-production demo accounts
- Zero-downtime: additive columns first, backfill, then constraint

---

## 8. Testing repositories

```python
@pytest.fixture
async def db_session():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with async_session_factory() as session:
        yield session
        await session.rollback()

async def test_wallet_append_transaction(db_session):
    repo = WalletRepository(db_session)
    wallet = await repo.get_for_update(user_id)
    tx = await repo.append_transaction(wallet.id, WalletTransactionCreate(amount=-100, ...))
    assert tx.amount == -100
```

Use testcontainers PostgreSQL for integration tests — no SQLite (JSONB, citext, enums).

---

## 9. Performance guidelines

| Pattern | When |
|---------|------|
| `joinedload` / `selectinload` | Prevent N+1 on detail endpoints |
| Partial indexes | `WHERE status = 'published'` on listings |
| `EXPLAIN ANALYZE` | Any query > 50ms in staging |
| Connection pool | 10 + 20 overflow per uvicorn worker |
| Read replica (phase 2) | Public list endpoints only |

---

## 10. Anti-patterns

| Prohibited | Alternative |
|------------|-------------|
| Raw SQL strings in services | Repository methods |
| `session.commit()` in repository | UnitOfWork in service |
| Returning ORM to router | Service maps to Pydantic |
| Cross-aggregate joins in router | Service orchestrates multiple repos |
| Missing `FOR UPDATE` on wallet | Always lock wallet row |

---

*See also: [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md), [SERVICE_LAYER.md](./SERVICE_LAYER.md), [DOMAIN_LAYER.md](./DOMAIN_LAYER.md)*
