# PRODUCT_READY_CHECKLIST.md

## ISHBOR — PRODUCT-READY HOLAT TEKSHIRUV RO'YXATI

---

## 1. MAQSAD

PLAN.md'dagi **SUCCESS CONDITION**ni o'lchanadigan, bajariladigan checklistga aylantirish:

> User platformga kirganda "Qanday ishlataman?" emas, "Qaysi ishni birinchi qilaman?" deb o'ylashi kerak.

Bu hujjat — barcha boshqa governance hujjatlarining (UX_STANDARDS, INTEGRATION_RULES, TRUST_SYSTEM va h.k.) **yig'ma natijasi**. Har bir release/major-fix tugagandan keyin shu checklist to'ldiriladi. To'ldirilmagan yoki "FAIL" bo'lgan checklist bilan **release qilinmaydi**.

---

## 2. SCOPE

Bu hujjat 10 ta PLAN.md priority'sining **yakuniy holatini** tekshiradi. U batafsil qoidalarni o'z ichiga olmaydi (ular boshqa hujjatlarda) — faqat "bajarildi / bajarilmadi" darajasidagi yuqori-darajali natijalarni tekshiradi.

---

## 3. QOIDALAR

1. Checklist har bir **major fix-cycle** yoki **release** oldidan to'liq qaytadan to'ldiriladi — eski natijalar qayta ishlatilmaydi.
2. Har bir band uchun faqat ikki holat bor: ✅ PASS yoki ❌ FAIL. "Qisman" holat yo'q — agar band to'liq bajarilmagan bo'lsa, FAIL.
3. Bironta ❌ FAIL bo'lsa, PRODUCT_RULES.md'dagi "No Feature Mode" qoidasiga ko'ra **yangi feature ishi boshlanmaydi** — faqat shu FAIL'larni tuzatish ustida ishlanadi.
4. Har bir band qarshisida **qaysi hujjat/qoida asosida tekshirilgani** ko'rsatiladi — bu Cursor/Claude uchun "qayerga borib batafsil tekshirish" yo'l-yo'rig'i.
5. Report yozishning o'zi yetarli emas (PLAN.md, Priority 9) — har bir PASS uchun **Audit→Fix→Retest→Verify** sikli INTEGRATION_RULES/QA_CHECKLIST'da ko'rsatilgan tartibda real bajarilgan bo'lishi kerak.

---

## 4. ASOSIY CHECKLIST

### 4.1 Integration (→ INTEGRATION_RULES.md)
- [ ] Role switch barcha modullarda to'g'ri ishlaydi
- [ ] Permissions har bir rol uchun to'g'ri qo'llanilgan
- [ ] State sync — bir joydagi o'zgarish barcha kerakli joylarda aks etadi
- [ ] Dashboard, Analytics, Wallet, Notifications, CRM, AI, Agency moduli orasida data uzilishi yo'q

### 4.2 Personalization (→ PERSONALIZATION_RULES.md)
- [ ] Onboarding ma'lumotlari (skills, categories, industry, experience) recommendation'larga ta'sir qiladi
- [ ] Freelancer uchun mos loyiha/mijoz/tavsiyalar ko'rinadi
- [ ] Client uchun mos freelancer/xizmat/agentlik ko'rinadi

### 4.3 UX Simplification (→ UX_STANDARDS.md)
- [ ] Har sahifada maksimum 1 Primary + 2 Secondary action
- [ ] Har sahifa 5 soniya ichida tushunarli (heuristik baholash)
- [ ] Har bir sahifada "keyingi qadam" aniq ko'rsatilgan

### 4.4 Trust (→ TRUST_SYSTEM.md)
- [ ] Trust Score barcha kerakli joylarda ko'rinadi
- [ ] Reputation/Verification belgilari konsistent
- [ ] Progress indikatorlari mavjud va to'g'ri ishlaydi

### 4.5 Mobile (→ MOBILE_STANDARDS.md)
- [ ] 320–768px barcha breakpoint'larda overflow yo'q
- [ ] Kesilgan matn yo'q
- [ ] Barcha tugmalar bosish uchun yetarli o'lchamda

### 4.6 Stress Test (→ QA_CHECKLIST.md)
- [ ] 100 messages / 100 notifications stress test — crash yo'q
- [ ] 50 projects/services/portfolios/orders/reviews/applications — crash yo'q
- [ ] Duplicate ID yo'q
- [ ] Stale state yo'q
- [ ] localStorage corruption yo'q

### 4.7 Performance (→ PERFORMANCE_STANDARDS.md)
- [ ] Unnecessary rerender yo'q
- [ ] Duplicate calculation yo'q
- [ ] Stale subscription yo'q
- [ ] Heavy component'lar optimallashtirilgan

### 4.8 Dead Action Policy (→ DEAD_ACTION_POLICY.md)
- [ ] 0 dead button
- [ ] 0 fake action
- [ ] 0 toast-only workflow

### 4.9 Role Consistency (→ ROLE_CONSISTENCY.md)
- [ ] Critical role bug = 0
- [ ] Har bir rol o'z dashboardida to'g'ri ma'lumotlarni ko'radi

---

## 5. SCORE HISOBLASH

PLAN.md Priority 10'dagi "No Feature Mode" shartlari uchun:

- **Critical buglar = 0** → 4.1, 4.6, 4.9 bo'limlaridagi barcha bandlar PASS bo'lishi shart
- **Integration buglar = 0** → 4.1 to'liq PASS
- **Role buglar = 0** → 4.9 to'liq PASS
- **UX score > 98** → 4.3 va 4.8 bo'limlaridagi bandlar bo'yicha hisoblangan ball (har band = teng og'irlik, PASS = 100, FAIL = 0, o'rtacha > 98)
- **Mobile score > 98** → 4.5 bo'yicha xuddi shunday hisoblanadi

> Faqat shu shartlarning **barchasi** bajarilganda PRODUCT_RULES.md'da yangi feature ishiga ruxsat beriladi.

---

## 6. AUDIT MEZONLARI

- Har bir checklist bandi tekshirilganda, tegishli boshqa hujjatdagi (masalan, MOBILE_STANDARDS.md) batafsil checklist ham to'liq bajarilgan bo'lishi kerak — bu yerdagi band shu batafsil checklistning "yig'indisi".
- Har bir FAIL uchun: muammo tasvirlangan, fix qilingan, retest qilingan, va verify qilingan dalil (skrinshot, log, yoki test natijasi) bo'lishi kerak.
- "Report yozildi, lekin fix qilinmadi" holati — bu o'zi alohida Critical bug hisoblanadi (PLAN.md Priority 9 buzilishi).

---

## 7. SUCCESS CRITERIA

- Ushbu checklist'ning barcha bandlari ✅ PASS
- 5-bo'limdagi barcha sonli shartlar (Critical=0, Integration=0, Role=0, UX>98, Mobile>98) bajarilgan
- Har bir PASS uchun Audit→Fix→Retest→Verify dalili mavjud

Faqat shu holatda loyiha "Product-Ready" deb e'lon qilinadi va PRODUCT_RULES.md asosida yangi feature ishlariga o'tish mumkin.

---

## 8. QANDAY FOYDALANISH

**Insonlar uchun:**
- Har bir katta fix-cycle yoki release oldidan ushbu hujjatni nusxalab, sanasi bilan to'ldiring (masalan, `PRODUCT_READY_CHECKLIST_2026-06-15.md`).
- Har bir FAIL bandi uchun alohida fix-task yarating va uni QA_CHECKLIST.md jarayoni orqali yopib, qaytadan tekshiring.

**Cursor/Claude uchun:**
- Katta audit so'rovi kelganda ("loyihani umumiy tekshir" yoki "product-ready holatga olib chiq" kabi), shu checklistni asos sifatida ishlatib, har bir bo'limni mos governance hujjat (havolalar 4-bo'limda) bo'yicha batafsil tekshiring.
- Natijani shu formatda qaytaring: har band uchun PASS/FAIL + sabab + tavsiya etilgan fix.
- Agar biror band uchun mos governance hujjat hali yaratilmagan bo'lsa, buni foydalanuvchiga bildiring — yangi hujjat kerak bo'lishi mumkin.
