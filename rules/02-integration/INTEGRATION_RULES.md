# INTEGRATION_RULES.md

## ISHBOR — MODULLARARO INTEGRATSIYA QOIDALARI

---

## 1. MAQSAD

PLAN.md Priority 1: "Har bir modul bir-biri bilan to'liq ishlashi kerak. Bitta joydagi o'zgarish barcha kerakli joylarda aks etishi kerak."

Bu hujjat — modullar (PROJECT_STANDARDS.md 3-bo'limdagi rasmiy ro'yxat) orasidagi **data flow, state sync va role-based ko'rinish** qoidalarini belgilaydi. Maqsad: bitta modulda qilingan o'zgarish boshqa barcha bog'liq modullarda avtomatik va to'g'ri aks etishini ta'minlash.

---

## 2. SCOPE

Qamrab oladi:
- Modullararo data dependency xaritasi
- State sync qoidalari (qaysi o'zgarish qayerga tarqalishi kerak)
- Role switch va permission integratsiyasi
- "Single source of truth" prinsipi har bir data turi uchun

Qamrab olmaydi: UI/UX ko'rinishi (UX_STANDARDS.md), performance optimallashtirish texnikasi (PERFORMANCE_STANDARDS.md) — bu yerda faqat **to'g'rilik (correctness)**, tezlik emas.

---

## 3. ASOSIY PRINSIP: SINGLE SOURCE OF TRUTH (DATA)

Har bir data turi uchun **bitta** "egasi" modul bo'ladi. Boshqa modullar bu datani **faqat o'qish** uchun olishi mumkin, lekin o'zining nusxasini saqlamasligi kerak (yoki agar saqlasa — sync mexanizmi bo'lishi shart).

| Data turi | Egasi modul | Kim o'qiydi |
|---|---|---|
| Foydalanuvchi profili, rol | Auth | Hammasi |
| Loyiha holati | Projects | Client, Freelancer, Agency, CRM, Analytics |
| Taklif holati | Proposals | Projects, CRM, Notifications |
| Buyurtma holati | Orders | Wallet, Escrow, Reviews, CRM, Analytics |
| Balans, tranzaksiyalar | Wallet | Dashboard, Analytics, Subscription |
| Eskrov holati | Escrow | Orders, Wallet, Notifications |
| Trust/Reputation ko'rsatkichlari | Reviews + Auth | Hammasi (TRUST_SYSTEM.md orqali) |
| Onboarding profili (skills, industry) | Auth/Onboarding | Personalization (barcha rekomendatsiyalar) |

> **Qoida:** Agar ikkita modul bir xil ma'lumotni mustaqil hisoblayotgani aniqlansa (masalan, Wallet balansi Dashboard'da alohida hisoblanayotgan bo'lsa), bu **Critical Integration Bug** hisoblanadi.

---

## 4. ROLE SWITCH QOIDALARI

- Foydalanuvchi rol almashtirganda (masalan, Client → Freelancer rejimiga o'tish), quyidagilar **darhol** yangilanishi kerak:
  - Navigation/menu tarkibi
  - Dashboard widget'lari
  - Notifications filtri (rolga tegishli bildirishnomalar)
  - Permissions (qaysi action'lar ko'rinadi/yashirin)
- Eski rol konteksti (masalan, oldingi rolning ochiq modal/forma holati) **tozalanishi** kerak — aks holda "stale state" (PLAN.md Priority 6).

Batafsil rol-specific qoidalar uchun → **ROLE_CONSISTENCY.md**

---

## 5. STATE SYNC QOIDALARI

5.1. **Yozish (write) operatsiyasi** har doim egasi modul orqali amalga oshiriladi. Boshqa modul to'g'ridan-to'g'ri boshqa modulning state'ini o'zgartirmaydi.

5.2. **O'qish (read) operatsiyasi** uchun: agar bir modul boshqa modul datasini ko'rsatsa (masalan, Dashboard Wallet balansini ko'rsatadi), u **real-time yoki subscription orqali** olinadi, hardcode/cache qilingan eski qiymat emas.

5.3. **Cascading update misoli:**
- Order holati "Completed" bo'lganda → Escrow chiqarish trigger bo'ladi → Wallet balans yangilanadi → Notifications yuboriladi → Analytics statistikasi yangilanadi → Reviews so'rovi trigger bo'ladi → CRM'da deal holati yangilanadi.
- Shu zanjirdagi **har bir bosqich** test qilinishi kerak. Agar bitta bosqich ishlamasa (masalan, Notifications yuborilmasa), bu **Critical Integration Bug**.

5.4. Bir nechta tab/sessiya ochiq bo'lsa, kritik state (balans, buyurtma holati) yangilanishi barcha ochiq sessiyalarga tarqalishi kerak (yoki kamida keyingi page-load'da to'g'ri ko'rsatilishi).

---

## 6. INTEGRATSIYA MATRITSASI (TEKSHIRISH UCHUN)

Quyidagi modul juftliklari har audit'da tekshiriladi:

| # | Modul A | Modul B | Tekshiriladigan integratsiya |
|---|---|---|---|
| 1 | Auth | Hammasi | Rol o'zgarishi → UI/permission yangilanishi |
| 2 | Projects | Proposals | Yangi taklif → loyiha holatiga ta'sir |
| 3 | Proposals | Orders | Taklif qabul qilinishi → buyurtma yaratilishi |
| 4 | Orders | Escrow | Buyurtma yaratilishi → eskrov ochilishi |
| 5 | Orders | Wallet | Buyurtma yakunlanishi → balans o'zgarishi |
| 6 | Orders | Reviews | Buyurtma yakunlanishi → review so'rovi |
| 7 | Reviews | TrustSystem | Review qo'yilishi → Trust Score yangilanishi |
| 8 | Hammasi | Notifications | Har bir muhim event → tegishli bildirishnoma |
| 9 | Hammasi | Analytics | Har bir muhim event → statistika yangilanishi |
| 10 | Onboarding | Personalization | Profil ma'lumoti → recommendation'lar |
| 11 | Agency | Freelancer | Agency a'zosi sifatida ishlash — individual profil bilan farqi |
| 12 | Hammasi | CRM | Client/Freelancer bilan bog'liq harakatlar CRM'da ko'rinishi |

---

## 7. QOIDALAR (UMUMIY)

1. Har bir yangi feature/fix loyihaga kirishidan oldin, u 6-bo'limdagi matritsaga ta'sir qiladigan bo'lsa, mos qatorlar qaytadan test qilinadi.
2. Hech qanday modul boshqa modulning ma'lumotini "taxmin qilib" ko'rsatmaydi — faqat egasi moduldan olingan haqiqiy qiymatni.
3. Yangi modul qo'shilsa (PROJECT_STANDARDS.md orqali rasmiylashtirilgandan keyin), u 3-bo'lim va 6-bo'lim jadvallariga qo'shiladi.

---

## 8. AUDIT MEZONLARI

Har bir audit quyidagi savollarga javob beradi:
- 3-bo'limdagi har bir data turi uchun, uni ko'rsatadigan barcha modullar **bir xil qiymatni** ko'rsatadimi?
- 6-bo'limdagi 12 integratsiyaning har biri **end-to-end** ishlaydimi (real action bajarib, natijani barcha bog'liq modullarda tekshirish orqali)?
- Rol almashtirishda eski rol state'i to'liq tozalanadimi (5-bo'lim)?

---

## 9. SUCCESS CRITERIA

- 6-bo'limdagi 12 integratsiyaning barchasi end-to-end PASS
- 3-bo'limdagi har bir data turi faqat bitta joyda "yoziladi", barcha boshqa joylarda "o'qiladi"
- Role switch'da stale state holatlari 0

---

## 10. QANDAY FOYDALANISH

**Insonlar uchun:**
- Yangi modul qo'shishda yoki mavjud modulni o'zgartirishda, avval 3 va 6-bo'limlardagi jadvallarni yangilang — qaysi modullar ta'sirlanishini aniqlang.

**Cursor/Claude uchun:**
- "Integration audit" so'ralganda, 6-bo'limdagi 12 qatorni birma-bir end-to-end tekshiring: real action bajarib (masalan, taklif yuborish), natijani barcha bog'liq modullarda (Orders, Notifications, CRM, Analytics) kuzating.
- Agar kodda bir data ikki joyda mustaqil saqlanayotgani/hisoblanayotgani topilsa, buni 3-bo'limdagi "Single Source of Truth" jadvaliga moslab Critical Bug deb belgilang va to'g'ri egasi modulga yo'naltiring.
- Fix qilingandan keyin, shu integratsiya qatorini QA_CHECKLIST.md'dagi Audit→Fix→Retest→Verify formatida qayta tekshiring.
