# PRODUCT_RULES.md

## ISHBOR — MAHSULOT QARORLARI QOIDALARI ("NO FEATURE MODE")

---

## 1. MAQSAD

PLAN.md asosiy maqsadi va Priority 10 (No Feature Mode)ni rasmiy gatekeeping mexanizmiga aylantirish:

> Yangi feature qo'shish — FAQAT Critical buglar = 0, Integration buglar = 0, Role buglar = 0, UX score > 98, Mobile score > 98 bo'lgandan keyin. Ungacha: faqat bug fix, ux polish, ui polish, performance, consistency ustida ishlanadi.

Bu hujjat — **har qanday yangi ish so'rovi kelganda, bu "feature" yoki "fix" ekanligini aniqlash** va shunga qarab davom etish/etmaslikni belgilaydi.

---

## 2. SCOPE

Qamrab oladi: "Feature" va "Fix/Polish" ta'riflari, gatekeeping jarayoni, shartlar bajarilganda nima sodir bo'ladi.

Qamrab olmaydi: gatekeeping shartlarining o'lchov mezonlari (bular PRODUCT_READY_CHECKLIST.md'da) — bu hujjat faqat **qaror qabul qilish jarayonini** belgilaydi.

---

## 3. TA'RIFLAR: FEATURE vs FIX/POLISH

### 3.1 "Feature" hisoblanadi:
- Yangi modul yoki sub-modul qo'shish (PROJECT_STANDARDS.md 3-bo'limidagi ro'yxatga yangi qator)
- Mavjud modulga **yangi imkoniyat** qo'shish (masalan, Wallet'ga "kripto to'lov" qo'shish)
- Yangi foydalanuvchi-yo'naltirilgan oqim (masalan, yangi onboarding bosqichi)
- Yangi rol yoki sub-rol qo'shish

### 3.2 "Fix/Polish" hisoblanadi (har doim ruxsat etilgan):
- **Bug fix** — mavjud funksiya kutilganidek ishlamayotgan joyni tuzatish
- **UX polish** — UX_STANDARDS.md qoidalariga moslashtirish (masalan, action hierarchy tuzatish)
- **UI polish** — DESIGN_GUARDRAILS.md qoidalariga moslashtirish (vizual konsistentlik)
- **Performance** — PERFORMANCE_STANDARDS.md bo'yicha optimallashtirish, funksional natija o'zgarmaydi
- **Consistency** — PROJECT_STANDARDS.md terminologiya/naming bo'yicha tuzatish, INTEGRATION_RULES.md bo'yicha data-sync tuzatish

### 3.3 Chegaraviy holatlar (gray area)
- "Mavjud funksiyani yaxshilash" — agar foydalanuvchi uchun **yangi imkoniyat** qo'shilsa (masalan, filtrlashga yangi filtr turi) → Feature.
- "Mavjud funksiyani yaxshilash" — agar faqat **mavjud imkoniyat** to'g'ri/tezroq/chiroyliroq ishlasa → Fix/Polish.

> Noaniq holatlarda, savol PM (yoki foydalanuvchi)ga qaytariladi: "Bu [tavsif] — yangi imkoniyatmi yoki mavjudni tuzatishmi?"

---

## 4. GATEKEEPING JARAYONI

Har qanday yangi ish so'rovi kelganda:

**QADAM 1:** So'rov 3-bo'lim bo'yicha Feature yoki Fix/Polish ekanligi aniqlanadi.

**QADAM 2:** Agar Fix/Polish bo'lsa → to'g'ridan-to'g'ri QA_CHECKLIST.md Audit→Fix→Retest→Verify siklida bajariladi, gatekeeping kerak emas.

**QADAM 3:** Agar Feature bo'lsa → PRODUCT_READY_CHECKLIST.md'ning eng so'nggi to'ldirilgan nusxasi tekshiriladi:
- Agar barcha shartlar (Critical=0, Integration=0, Role=0, UX>98, Mobile>98) ✅ bo'lsa → Feature ishiga ruxsat.
- Agar bironta shart ❌ bo'lsa → Feature ishi **boshlanmaydi**. Foydalanuvchiga aniq aytiladi: "Bu so'rov yangi feature hisoblanadi. Hozirgi holatda PRODUCT_READY_CHECKLIST.md'da [X] shart bajarilmagan, shuning uchun PLAN.md Priority 10 bo'yicha avval shu [X]ni tuzatish kerak."

**QADAM 4:** Agar PRODUCT_READY_CHECKLIST.md hali to'ldirilmagan/eskirgan bo'lsa → avval shu checklistni to'ldirish (audit) tavsiya etiladi, keyin Feature/Fix qarori beriladi.

---

## 5. QOIDALAR (UMUMIY)

1. Hech qanday Feature so'rovi "tezroq", "kichik o'zgarish", "shunchaki qo'shimcha" kabi bahonalar bilan gatekeeping'dan o'tkazib yuborilmaydi — 4-bo'lim jarayoni har doim qo'llaniladi.
2. Agar foydalanuvchi Feature so'rasa va shartlar bajarilmagan bo'lsa, Claude/Cursor **rad etmaydi**, balki holatni tushuntirib, muqobil sifatida tegishli Fix/Polish ishlarini taklif qiladi (masalan, "Hozir buni qo'sholmaymiz, chunki UX score 95 (>98 kerak). Xohlasangiz, avval UX_STANDARDS.md audit'ini o'tkazib, score'ni oshiraylik — keyin bu feature'ga qaytamiz").
3. Bu qoida **doimiy** — loyiha "Product Ready" deb e'lon qilingandan keyin ham, agar keyinchalik yangi Critical bug topilsa, gatekeeping qaytadan faollashadi (regressiv himoya).

---

## 6. AUDIT MEZONLARI

- Har bir so'nggi 10 ish so'rovi tahlil qilinganda, har biri 3-bo'lim bo'yicha to'g'ri tasniflangan (Feature/Fix) bo'lishi
- Agar Feature ishi PRODUCT_READY_CHECKLIST shartlari bajarilmagan holda boshlangan bo'lsa, bu **Process Violation** sifatida belgilanadi

---

## 7. SUCCESS CRITERIA

- "No Feature Mode" davrida 100% ish so'rovlari Fix/Polish toifasida bajarilgan (Process Violation = 0)
- PRODUCT_READY_CHECKLIST.md shartlari bajarilgandan so'ng, Feature so'rovlari normal tarzda boshlanadi

---

## 8. QANDAY FOYDALANISH

**Insonlar uchun:**
- Yangi ish so'rashdan oldin, PRODUCT_READY_CHECKLIST.md'ning oxirgi holatini tekshiring — agar FAIL'lar bo'lsa, so'rovingiz kechiktirilishi mumkinligini bilib qoling.

**Cursor/Claude uchun:**
- Har qanday yangi so'rov kelganda, **avval** 3-bo'lim bo'yicha Feature/Fix tasnifini aniqlang (bu ichki qadam, foydalanuvchiga alohida e'lon qilinmasa ham bo'ladi).
- Agar Feature bo'lsa va PRODUCT_READY_CHECKLIST.md mavjud/yangilangan bo'lsa, shartlarni tekshirib, 4-bo'lim QADAM 3 bo'yicha javob bering.
- Agar PRODUCT_READY_CHECKLIST.md hali mavjud emas yoki juda eski bo'lsa, buni foydalanuvchiga aytib, avval audit o'tkazishni taklif qiling.
- Hech qachon Feature so'rovini sukut bo'yicha bajarmang — har doim 4-bo'lim jarayonidan o'tkazing.
