# PERSONALIZATION_RULES.md

## ISHBOR — PERSONALIZATSIYA QOIDALARI

---

## 1. MAQSAD

PLAN.md Priority 2: onboarding ma'lumotlari (skills, categories, industry, experience, portfolio, services, orders, saved items) asosida Freelancer va Client uchun **mos tavsiyalar** ko'rsatish.

---

## 2. SCOPE

Qamrab oladi: qaysi onboarding/profil ma'lumotlari recommendation uchun ishlatiladi, har bir rol uchun qanday tavsiyalar ko'rsatilishi kerak, va bu tavsiyalarning UX_STANDARDS.md bilan bog'lanishi (dashboard'da qayerda ko'rinadi).

Qamrab olmaydi: recommendation algoritmining matematik/ML detallari — bu hujjat **qanday data ishlatilishi va natija qanday ko'rinishi kerakligi**ni belgilaydi, algoritm tanlovi texnik jamoa qarorida qoladi.

---

## 3. INPUT MA'LUMOTLAR (PERSONALIZATION SIGNALLARI)

| Signal | Manba (modul) | Kim uchun ishlatiladi |
|---|---|---|
| Skills | Auth/Onboarding profili | Freelancer → mos loyihalar; Client → mos freelancerlar |
| Categories | Onboarding profili, Services | Ikkala tomon |
| Industry | Onboarding profili | Ikkala tomon |
| Experience darajasi | Onboarding profili | Freelancer → murakkablik darajasiga mos loyihalar |
| Portfolio | Portfolio moduli | Client → freelancer tanlovi uchun ko'rsatiladigan misol sifatida |
| Services | Services moduli | Client → "sizga mos xizmatlar" |
| Orders (tarix) | Orders moduli | Ikkala tomon — o'tgan hamkorlik asosida o'xshash tavsiyalar |
| Saved items | Bookmark/saqlangan | Ikkala tomon — "saqlaganlaringizga o'xshash" |

> **Qoida:** Agar onboarding'da ma'lumot kiritilmagan bo'lsa (masalan, foydalanuvchi "Skills"ni o'tkazib yuborgan), tavsiyalar **umumiy/popular** asosda ko'rsatiladi — bo'sh natija yoki xato emas (UX_STANDARDS.md 5-bo'lim "Bo'sh holat" qoidasiga muvofiq).

---

## 4. FREELANCER UCHUN NATIJALAR

| Tavsiya turi | Asos |
|---|---|
| Mos loyihalar | Skills + Categories + Industry mos kelishi, Experience darajasiga mos murakkablik |
| Mos mijozlar | O'tgan Orders'dagi sohaga o'xshash Client'lar, yoki Client Industry mos kelishi |
| Mos tavsiyalar (umumiy) | Saved items + Orders tarixi asosida "sizga ham yoqishi mumkin" |

---

## 5. CLIENT UCHUN NATIJALAR

| Tavsiya turi | Asos |
|---|---|
| Mos freelancerlar | Loyiha/Onboarding'dagi Categories/Skills bilan Freelancer Skills mos kelishi + Trust Score (TRUST_SYSTEM.md) |
| Mos xizmatlar (Services) | Categories/Industry mos kelishi |
| Mos agentliklar | Categories + jamoa hajmi (kichik loyiha → kichik agency, katta loyiha → katta agency) |

---

## 6. KO'RINISH JOYI VA UX BOG'LANISHI

- Personalizatsiyalangan tavsiyalar **Dashboard**da, UX_STANDARDS.md 6.1-bo'limiga ko'ra "ikkinchi darajali blok" sifatida ko'rinadi (eng yuqorida — "hozir nima bo'layapti", keyin — tavsiyalar).
- List/Browse sahifalarida (Projects, Services, Freelancers ro'yxati) — standart filter natijalari ustida "Sizga tavsiya etiladi" bo'limi alohida ajratilishi mumkin, lekin asosiy ro'yxatni almashtirmaydi.
- Har bir tavsiya item'i UX_STANDARDS.md 3-bo'limidagi Action Hierarchy'ga mos — bosilganda tegishli detail sahifaga olib boradi (DEAD_ACTION_POLICY.md — tavsiya card'i ham "live action" bo'lishi shart).

---

## 7. DATA FRESHNESS (YANGILANISH) QOIDASI

7.1. Onboarding profilida o'zgarish (masalan, foydalanuvchi yangi skill qo'shdi) — tavsiyalar **keyingi dashboard yuklanishida** yangi ma'lumotni hisobga oladi (real-time shart emas, lekin stale bo'lmaydi — INTEGRATION_RULES.md 5-bo'limi).

7.2. Yangi Project/Service qo'shilganda, u mos profilli foydalanuvchilarning tavsiyalar ro'yxatida **maqbul vaqt ichida** (keyingi sessiya/yuklanishda) paydo bo'lishi kerak — "stale recommendation" Critical bug sifatida QA_CHECKLIST.md orqali hisobga olinadi.

---

## 8. QOIDALAR (UMUMIY)

1. Tavsiyalar hech qachon **bo'sh** ko'rsatilmaydi — agar mos natija topilmasa, 3-bo'lim "umumiy/popular" fallback ishlatiladi.
2. Tavsiya algoritmi o'zgarganda, 3-5 bo'limlardagi signal/natija jadvallari yangilanadi — bu jadvallar "qanday ishlashi kerak"ning haqiqat manbai.
3. Personalizatsiya natijalari INTEGRATION_RULES.md 6-bo'lim matritsasidagi "Onboarding → Personalization" qatoriga mos bo'lishi kerak.

---

## 9. AUDIT MEZONLARI

- [ ] Onboarding'da kiritilgan Skills/Categories/Industry/Experience tavsiyalarga ta'sir qiladi (test: ikki xil profil bilan turli tavsiyalar olinadi)
- [ ] Bo'sh profil holatida fallback tavsiyalar ko'rsatiladi, bo'sh ekran emas
- [ ] Yangi Project/Service qo'shilgandan keyin, mos profilli foydalanuvchi dashboardida ko'rinadi (7.2-bo'lim)
- [ ] Tavsiya card'lari DEAD_ACTION_POLICY.md bo'yicha "live action"

---

## 10. SUCCESS CRITERIA

- Freelancer va Client uchun 4 va 5-bo'limlardagi barcha tavsiya turlari ishlaydi va profilga mos natija beradi
- PRODUCT_READY_CHECKLIST.md 4.2-bo'limi to'liq PASS

---

## 11. QANDAY FOYDALANISH

**Insonlar uchun:**
- Onboarding formasiga yangi maydon qo'shilsa, 3-bo'lim jadvaliga qo'shing va qaysi tavsiya turiga ta'sir qilishini belgilang.

**Cursor/Claude uchun:**
- "Personalization audit" so'ralganda: ikki xil test-profil (turli Skills/Industry bilan) yaratib, har biri uchun Dashboard'dagi tavsiyalarni solishtiring — natijalar profilga mos farqlanishi kerak.
- Bo'sh profil bilan tekshirib, fallback ishlayotganini tasdiqlang (3-bo'lim, 8.1-qoida).
- Yangi Project/Service qo'shib, mos profilli foydalanuvchi dashboardida paydo bo'lishini (7.2-bo'lim) tekshiring — bu INTEGRATION_RULES.md bilan birga audit qilinadi.
