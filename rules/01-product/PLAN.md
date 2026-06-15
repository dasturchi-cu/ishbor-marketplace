# PLAN.md

## ISHBOR — PRODUCT READY ROADMAP

### HOZIRGI HOLAT

Marketplace yadro funksiyalari mavjud:

* Auth
* Client
* Freelancer
* Agency
* Admin
* Portfolio
* Services
* Projects
* Proposals
* Orders
* Escrow
* Reviews
* CRM
* Analytics
* AI Tools
* Monetization
* Agency System
* Notifications
* Wallet
* Subscription

Asosiy maqsad:

Yangi feature qo'shish emas.

Mavjud tizimni:

* barqaror
* tushunarli
* professional
* product-ready

qilish.

---

# PRIORITY 1

## INTEGRATION

Har bir modul bir-biri bilan to'liq ishlashi kerak.

Tekshirish:

* Role switch
* Permissions
* State sync
* Dashboard
* Analytics
* Wallet
* Notifications
* CRM
* AI
* Agency

Talab:

Bitta joydagi o'zgarish barcha kerakli joylarda aks etishi kerak.

---

# PRIORITY 2

## PERSONALIZATION

User onboarding ma'lumotlari ishlashi kerak.

Foydalanish:

* Skills
* Categories
* Industry
* Experience
* Portfolio
* Services
* Orders
* Saved items

Natija:

Freelancer:

* mos loyihalar
* mos mijozlar
* mos tavsiyalar

Client:

* mos freelancerlar
* mos xizmatlar
* mos agentliklar

Ko'rsin.

---

# PRIORITY 3

## UX SIMPLIFICATION

Qoida:

1 Primary Action

2 Secondary Actions

Maksimum.

Har sahifa:

5 soniyada tushunarli bo'lishi kerak.

Har user:

"Keyingi nima qilaman?"

savoliga javob ko'rishi kerak.

---

# PRIORITY 4

## TRUST

Har joyda:

* Trust Score
* Reputation
* Verification
* Progress

ko'rinishi kerak.

Marketplace ishonch uyg'otishi kerak.

---

# PRIORITY 5

## MOBILE

Viewport:

* 320
* 360
* 375
* 390
* 414
* 430
* 768

Har sahifa:

* overflow yo'q
* kesilgan matn yo'q
* bosib bo'lmaydigan tugma yo'q

---

# PRIORITY 6

## STRESS TEST

Tekshirish:

100 messages

100 notifications

50 projects

50 services

50 portfolios

50 orders

50 reviews

50 applications

Talab:

* crash yo'q
* duplicate id yo'q
* stale state yo'q
* localStorage corruption yo'q

---

# PRIORITY 7

## PERFORMANCE

Tekshirish:

* unnecessary rerender
* duplicate calculations
* stale subscriptions
* heavy components

Maqsad:

Marketplace tez ishlashi kerak.

---

# PRIORITY 8

## DEAD ACTION POLICY

Qoida:

0 dead button.

0 fake action.

0 toast-only workflow.

Agar tugma bo'lsa:

natija berishi shart.

---

# PRIORITY 9

## PRODUCT READY STANDARD

Har bir yangi o'zgarishdan oldin:

1. Audit
2. Fix
3. Retest
4. Verify

Keyin commit.

Report yozishning o'zi yetarli emas.

---

# PRIORITY 10

## NO FEATURE MODE

Yangi feature qo'shish:

FAQAT

* Critical buglar = 0
* Integration buglar = 0
* Role buglar = 0
* UX score > 98
* Mobile score > 98

bo'lgandan keyin.

Ungacha:

feature emas,

faqat:

* bug fix
* ux polish
* ui polish
* performance
* consistency

ustida ishlanadi.

---

# SUCCESS CONDITION

User platformga kirganda:

"Qanday ishlataman?"

emas,

"Qaysi ishni birinchi qilaman?"

deb o'ylashi kerak.

Ishbor professional marketplace hissini berishi kerak.

Every audit must:

Audit → Fix → Retest → Verify

No report-only work.

---

## Rules system

Barcha qoidalar markazlashtirilgan: [README.md](../README.md)

| PLAN | Hujjat |
|------|--------|
| Success | [PRODUCT_READY_CHECKLIST.md](./PRODUCT_READY_CHECKLIST.md) |
| P1 | [INTEGRATION_RULES.md](../02-integration/INTEGRATION_RULES.md), [ROLE_CONSISTENCY.md](../02-integration/ROLE_CONSISTENCY.md) |
| P2 | [PERSONALIZATION_RULES.md](../07-personalization/PERSONALIZATION_RULES.md) |
| P3 | [UX_STANDARDS.md](../03-ux/UX_STANDARDS.md) |
| P4 | [TRUST_SYSTEM.md](../04-trust/TRUST_SYSTEM.md) |
| P5 | [MOBILE_STANDARDS.md](../05-mobile/MOBILE_STANDARDS.md) |
| P6, P9 | [QA_CHECKLIST.md](../06-quality/QA_CHECKLIST.md) |
| P7 | [PERFORMANCE_STANDARDS.md](../06-quality/PERFORMANCE_STANDARDS.md) |
| P8 | [DEAD_ACTION_POLICY.md](../03-ux/DEAD_ACTION_POLICY.md) |
| P10 | [PRODUCT_RULES.md](./PRODUCT_RULES.md) |
