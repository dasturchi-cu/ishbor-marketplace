# MARKETPLACE_RULES.md

Marketplace-domain qoidalari — escrow, komissiya, order lifecycle.  
Boshqa hujjatlarda takrorlanmaslik uchun markazlashtirilgan.

**Mahsulot qonuni:** [PROJECT_BIBLE.md](../00-constitution/PROJECT_BIBLE.md) §12

---

## 1. Discovery va login wall

| Qoida | Tafsilot |
|-------|----------|
| Public discovery | Projects, services, freelancers, agencies, portfolios — login'siz |
| Login wall | Create, hire, pay, message — auth majburiy |
| Guest CTA | Browse OK → action → login redirect |

---

## 2. Client flow (to'liq zanjir)

```
Loyiha joylash
    ↓
Takliflar olish
    ↓
Frilanserlarni ko'rib chiqish
    ↓
Ishga olish
    ↓
Escrow'ni moliyalashtirish
    ↓
Buyurtmani boshqarish
    ↓
Sharh qoldirish
```

Har bir qadam ishlashi kerak. Tupik qadam taqiqlanadi.

---

## 3. Freelancer flow

```
Loyihalarni ko'rish
    ↓
Taklif yuborish
    ↓
Qabul qilinish
    ↓
Buyurtmani yakunlash
    ↓
To'lov olish
    ↓
Portfolio yaratish
```

---

## 4. Order lifecycle

| Status | Kim o'zgartiradi | Keyingi |
|--------|------------------|---------|
| draft | Client | publish / hire |
| active | System / participants | deliver, milestone |
| in_progress | Freelancer deliver | client review |
| completed | Client confirm | review, payout |
| disputed | Either | admin queue |
| cancelled | Client / admin | — |

**Qoida:** Order status o'zgarishi → notifications, wallet, escrow, analytics sync.

---

## 5. Escrow qoidalari

| Qoida | Tafsilot |
|-------|----------|
| Barcha to'lov | Escrow orqali (checkout) |
| Escrow shield | UI'da ko'rinadi ([TRUST_SYSTEM.md](../04-trust/TRUST_SYSTEM.md)) |
| Milestone | Client release action |
| Dispute | Admin queue, funds hold |
| Access | Faqat participant + admin ([ROLE_CONSISTENCY.md](../02-integration/ROLE_CONSISTENCY.md)) |

---

## 6. Komissiya va to'lov

| Parametr | Qiymat |
|----------|--------|
| Platform fee | 5% checkout |
| Currency | UZS (demo) |
| Wallet | credits-store / wallet-store |
| Subscription | Plan-based discounts (featured, connects) |

**Qoida:** Checkout'da fee ko'rinadi — yashirin komissiya yo'q.

---

## 7. Entity access

| Entity | Qoida |
|--------|-------|
| Order `$id` | Participant fail-closed |
| Escrow `$id` | Participant fail-closed |
| Project public | Browse OK, create auth |
| Service public | Browse OK, purchase auth |
| Review | orderId bog'langan, bir marta |

---

## 8. Mock + stored data

- Orders/projects: mock seed + localStorage merge
- Yangi user action UI'da darhol ko'rinishi kerak
- Duplicate ID merge qilmasin

---

## 9. Admin override

- Admin barcha entity'ni `/admin/*` orqali ko'radi
- User route'larda admin override yo'q
- Admin mutate → user store yangilanadi

---

## 10. Marketplace audit checklist

- [ ] Guest browse — crash yo'q
- [ ] Client full flow — project → hire → checkout → escrow
- [ ] Freelancer full flow — apply → order → deliver
- [ ] Service purchase checkout
- [ ] Escrow participant-only access
- [ ] Platform fee checkout'da ko'rinadi
- [ ] Review order bilan bog'langan

---

*Integration: [INTEGRATION_RULES.md](../02-integration/INTEGRATION_RULES.md). Security: [SECURITY_GUIDELINES.md](../09-security/SECURITY_GUIDELINES.md).*
