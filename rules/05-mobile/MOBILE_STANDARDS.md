# MOBILE_STANDARDS.md

## ISHBOR — MOBILE/RESPONSIVE STANDARTLARI

---

## 1. MAQSAD

PLAN.md Priority 5: barcha sahifalar quyidagi viewport'larda muammosiz ishlashi:

> 320, 360, 375, 390, 414, 430, 768 px. Overflow yo'q, kesilgan matn yo'q, bosib bo'lmaydigan tugma yo'q.

---

## 2. SCOPE

Qamrab oladi: breakpoint ro'yxati, har bir breakpoint uchun tekshirish mezonlari, touch-target o'lchamlari, matn/overflow qoidalari.

Qamrab olmaydi: action hierarchy/UX mantiqi (UX_STANDARDS.md — bu qoidalar mobile'da ham o'zgarmaydi, faqat joylashish moslashadi), vizual stil tafsilotlari (DESIGN_GUARDRAILS.md).

---

## 3. RASMIY BREAKPOINT RO'YXATI

| Viewport kengligi (px) | Tipik qurilma |
|---|---|
| 320 | Eng kichik telefon (eski iPhone SE) |
| 360 | Android o'rtacha |
| 375 | iPhone standart |
| 390 | iPhone 12/13/14 |
| 414 | iPhone Plus/Max |
| 430 | iPhone Pro Max (yangi) |
| 768 | Tablet (portrait) |

> **Qoida:** Har qanday yangi sahifa/komponent shu 7 breakpoint'ning **barchasida** test qilinadi — faqat eng kengi (768) yoki eng tori (320) emas, hammasi, chunki orasidagi qiymatlarda ham overflow yuzaga kelishi mumkin (masalan, uzun matn 390px'da sig'adi, lekin 360px'da sig'maydi).

---

## 4. OVERFLOW QOIDASI

4.1. Hech qanday element ekran kengligidan oshib ketmasligi kerak — gorizontal scroll bar **paydo bo'lmaydi** (agar maxsus gorizontal-scroll komponent — masalan, kartalar karuseli — bo'lmasa va u ataylab shunday tasarlangan bo'lmasa).

4.2. Matn konteynerlari: uzun so'zlar (masalan, uzun email, URL, ism) `word-break`/`overflow-wrap` orqali to'g'ri o'raladi, konteynerdan chiqib ketmaydi.

4.3. Rasm/Video: konteyner kengligidan oshmaydi, aspect ratio saqlanadi.

---

## 5. KESILGAN MATN QOIDASI

5.1. Matn **faqat ataylab** (`text-overflow: ellipsis` + tooltip/expand imkoniyati bilan) kesiladi — masalan, uzun loyiha nomi list'da bir qatorga kesiladi, lekin to'liq matn detail sahifada ko'rinadi.

5.2. **Ataylab bo'lmagan kesilish** — masalan, tugma matni konteynerga sig'maganda yarmi yo'qoladi, yoki label input ustiga chiqib ketadi — bu **Critical Mobile Bug**.

5.3. Har bir UI matni (label, tugma, sarlavha) eng kichik breakpoint (320px)da **to'liq ko'rinishi yoki to'g'ri ellipsis bilan kesilishi** tekshiriladi.

---

## 6. TOUCH TARGET (BOSISH O'LCHAMI) QOIDASI

6.1. Har qanday bosiladigan element (tugma, link, icon-button, checkbox) minimal **44x44px** (yoki ekvivalent) bosish maydoniga ega bo'lishi kerak — bu vizual o'lcham bilan bir xil bo'lishi shart emas (padding bilan kengaytirilishi mumkin), lekin amaliy bosish maydoni shu o'lchamdan kichik bo'lmaydi.

6.2. Ikki bosiladigan element orasida **kamida 8px** bo'sh joy bo'lishi kerak — tasodifiy boshqa tugmani bosib qo'yish oldini olish uchun.

6.3. Forma maydonlari (input, select, textarea) — minimal balandlik 44px, font-size kamida 16px (iOS'da avtomatik zoom oldini olish uchun).

---

## 7. LAYOUT MOSLASHUVI

7.1. 320–430px oralig'ida — bir ustunli (single column) layout, side-by-side elementlar vertikal stack'ga aylanadi.

7.2. 768px (tablet) — kontent kengligi cheklanishi mumkin (masalan, max-width bilan markazda), lekin 320-430 qoidalari shu kenglikda ham buzilmasligi kerak (ya'ni tablet uchun alohida sinov o'tkaziladi, faqat desktop layout kichraytirilmaydi).

7.3. Navigation (menu) — 768px va undan kichik kengliklarda **hamburger/bottom-nav** formatiga o'tadi (agar desktop'da gorizontal menu ishlatilsa).

---

## 8. QOIDALAR (UMUMIY)

1. Har qanday yangi komponent kodga qo'shilishidan oldin, 3-bo'limdagi 7 breakpoint'da vizual tekshirilishi kerak (browser devtools orqali yoki responsive preview).
2. UX_STANDARDS.md'dagi Primary/Secondary/Overflow action hierarchy mobile'da ham saqlanadi — faqat joylashish o'zgaradi (masalan, Primary Action mobile'da pastki "sticky" tugma bo'lishi mumkin).
3. DEAD_ACTION_POLICY.md qoidalari mobile uchun ham bir xil — mobile'da ko'rinmaydigan/ishlamaydigan tugma ham Dead Button hisoblanadi.

---

## 9. AUDIT MEZONLARI

Har bir sahifa/komponent uchun, har bir 7 breakpoint'da:
- [ ] Gorizontal overflow yo'q
- [ ] Barcha matnlar to'liq ko'rinadi yoki ataylab ellipsis bilan kesilgan (5-bo'lim)
- [ ] Barcha tugma/link minimal 44x44px bosish maydoniga ega
- [ ] Ikki tugma orasida minimal 8px bo'sh joy
- [ ] Layout single-column (320-430px uchun)

---

## 10. SUCCESS CRITERIA

- Barcha asosiy sahifalar 7 breakpoint'da 100% PASS (9-bo'lim checklisti)
- PRODUCT_READY_CHECKLIST.md'dagi "Mobile score > 98" shartiga hissa qo'shadi

---

## 11. QANDAY FOYDALANISH

**Insonlar uchun:**
- Yangi UI o'zgarishi qilgandan keyin, browser devtools'da 320px va 768px'da (eng kichik va eng katta) tekshirib ko'ring — keyin oraliq qiymatlarda ham tezkor tekshirish.

**Cursor/Claude uchun:**
- "Mobile audit" so'ralganda, har bir asosiy sahifani 3-bo'limdagi 7 breakpoint kengligida (CSS/layout kodi orqali) tahlil qilib, 9-bo'lim checklistini har biri uchun to'ldiring.
- Har bir topilgan muammo (overflow, kesilgan matn, kichik tugma) uchun aniq breakpoint va element ko'rsatiladi, QA_CHECKLIST.md formatida Audit→Fix→Retest→Verify bajariladi.
- Fix qilingandan keyin, **faqat o'zgargan breakpoint emas, barcha 7 breakpoint** qaytadan tekshiriladi — chunki bir breakpoint uchun fix boshqasini buzishi mumkin.
