# PERFORMANCE_STANDARDS.md

## ISHBOR — PERFORMANCE STANDARTLARI

---

## 1. MAQSAD

PLAN.md Priority 7: "Marketplace tez ishlashi kerak" — unnecessary rerender, duplicate calculation, stale subscription, heavy component'larni aniqlash va tuzatish uchun aniq mezonlar berish.

---

## 2. SCOPE

Qamrab oladi: frontend performance muammolarining 4 asosiy turi, ularni aniqlash usullari, va tuzatish yo'l-yo'riqlari.

Qamrab olmaydi: backend/server performance (agar loyihada backend bo'lsa, bu alohida hujjat talab qiladi — hozircha PLAN.md frontend-marketplace'ga qaratilgan), QA stress-test parametrlari (QA_CHECKLIST.md — u yerda hajm, bu yerda tezlik/effektivlik).

---

## 3. UNNECESSARY RERENDER

### Ta'rif:
Komponent props/state o'zgarmagan holda qayta render bo'lishi.

### Tipik sabablar:
- Parent komponentda har render'da yangi obyekt/funksiya yaratilishi (`() => {}` inline funksiyalar, `{}`/`[]` literal'lar prop sifatida)
- `React.memo`, `useMemo`, `useCallback` kerak bo'lgan joyda ishlatilmaganligi
- Context provider qiymati har render'da yangi obyekt bo'lishi, hatto ichki qiymat o'zgarmagan bo'lsa ham

### Tekshirish:
- React DevTools Profiler orqali — "nima uchun bu komponent qayta render bo'ldi" tahlili
- Og'ir list/dashboard komponentlari uchun render-count log qo'shib, oddiy harakat (masalan, bir input'ga harf kiritish) paytida nechta komponent qayta render bo'lishi tekshiriladi

### Qoida:
- Bir input maydoniga harf kiritish — faqat shu maydon va unga bog'liq vizual elementlar qayta render bo'lishi kerak, butun sahifa emas.

---

## 4. DUPLICATE CALCULATION

### Ta'rif:
Bir xil hisoblash (filtrlash, sortlash, agregatsiya) bir nechta joyda mustaqil takrorlanishi — ayniqsa har render'da qayta hisoblanishi.

### Tipik sabablar:
- `useMemo` ishlatilmagan og'ir filtrlash/sort operatsiyalari
- Bir xil ma'lumot ustida bir nechta komponentda alohida-alohida hisoblash (masalan, Dashboard va Analytics ikkalasi ham Wallet tranzaksiyalaridan jami summani alohida hisoblaydi)

### Bog'liqlik:
INTEGRATION_RULES.md 3-bo'limidagi "Single Source of Truth" prinsipi — agar hisoblash natijasi bir nechta joyda ishlatilsa, u **bir marta** hisoblanib, natija (yoki memoized selector) bo'lishi kerak, har joyda qayta hisoblanmaydi.

### Qoida:
- Har bir "og'ir" hisoblash (50+ element ustida filter/sort/reduce) `useMemo` yoki ekvivalent bilan o'ralgan bo'lishi kerak, dependency array to'g'ri belgilangan.

---

## 5. STALE SUBSCRIPTION

### Ta'rif:
Komponent unmount bo'lgandan keyin ham davom etayotgan subscription/listener/interval — bu memory leak va keraksiz update'larga olib keladi.

### Tipik sabablar:
- `useEffect` ichida subscription/listener qo'shilgan, lekin cleanup funksiyasi (`return () => {...}`) yo'q
- `setInterval`/`setTimeout` tozalanmagan
- Eski rol/sahifa konteksti uchun ochilgan WebSocket/event listener yangi kontekstga o'tilganda yopilmagan

### Tekshirish:
- Sahifalar orasida tez-tez navigatsiya qilib (masalan, Dashboard → Profile → Dashboard), browser memory profiler orqali listener/subscription sonini kuzatish — son doimiy o'sib bormasligi kerak

### Qoida:
- Har bir `useEffect` (yoki ekvivalent) ichidagi subscription/listener/timer **majburiy cleanup**ga ega.

---

## 6. HEAVY COMPONENTS

### Ta'rif:
Render qilish uchun ko'p vaqt/resurs talab qiladigan komponentlar — ayniqsa, ko'rinmaydigan (off-screen) holatda ham to'liq render bo'layotgan komponentlar.

### Tipik sabablar:
- Katta list'lar virtualizatsiyasiz render qilinishi (50+ element — QA_CHECKLIST.md stress-test hajmlariga mos)
- Og'ir grafik/chart komponentlari har kichik state o'zgarishida to'liq qayta chiziladi
- Rasm/media optimallashtirilmagan (katta original o'lcham yuklanadi, kichik thumbnail kerak bo'lsa ham)

### Qoida:
- 50+ elementli list'lar uchun virtualizatsiya (windowing) yoki pagination ishlatiladi.
- Chart/grafik komponentlar faqat tegishli data o'zgarganda qayta render bo'ladi, butun dashboard re-render bo'lganda emas.

---

## 7. QOIDALAR (UMUMIY)

1. Har qanday yangi list/dashboard komponenti yozilganda, 3-6 bo'limlardagi 4 muammo turi nazarda tutilib yoziladi (proaktiv, keyin tuzatishdan ko'ra).
2. Performance fix'lari **funksional natijani o'zgartirmasligi** kerak — faqat tezlik/effektivlik yaxshilanadi (DEAD_ACTION_POLICY.md va INTEGRATION_RULES.md bilan ziddiyat bo'lmasligi uchun, fix oldin va keyin bir xil natija berishi tekshiriladi).
3. Stress-test hajmlari (QA_CHECKLIST.md, 50-100 element) performance audit uchun ham asosiy o'lchov hajmi hisoblanadi.

---

## 8. AUDIT MEZONLARI

Har bir asosiy sahifa/komponent uchun:
- [ ] Rerender audit: bir input o'zgarishi faqat tegishli qism qayta render qiladi (3-bo'lim)
- [ ] Duplicate calculation yo'q — bir xil hisoblash bir joyda, memoized (4-bo'lim)
- [ ] Barcha subscription/listener/timer cleanup'ga ega (5-bo'lim)
- [ ] 50+ elementli list'lar virtualizatsiya/pagination bilan (6-bo'lim)

---

## 9. SUCCESS CRITERIA

- 8-bo'lim checklisti barcha asosiy sahifalarda PASS
- QA_CHECKLIST.md stress-test hajmlarida (50-100 element) sahifalar sezilarli sekinlashishsiz ishlaydi
- PRODUCT_READY_CHECKLIST.md 4.7-bo'limiga hissa qo'shadi

---

## 10. QANDAY FOYDALANISH

**Insonlar uchun:**
- Yangi og'ir komponent (katta list, chart, real-time dashboard) yozishda, 3-6 bo'limlardagi qoidalarni boshidanoq qo'llang — keyinroq tuzatishdan ko'ra arzonroq.

**Cursor/Claude uchun:**
- "Performance audit" so'ralganda, har bir asosiy sahifa kodini 3-6 bo'limlardagi 4 muammo turi bo'yicha tekshiring: inline funksiya/obyekt props'lar, memoization yo'qligi, cleanup'siz effect'lar, virtualizatsiyasiz katta list'lar.
- Har bir topilgan muammo uchun aniq fayl/komponent nomi va qaysi turga tegishli ekanligi (3/4/5/6-bo'lim) ko'rsatiladi.
- Fix qilingandan keyin, funksional natija o'zgarmaganini (INTEGRATION_RULES va DEAD_ACTION_POLICY bo'yicha) tekshirish — Retest/Verify bosqichida bu alohida ta'kidlanadi.
