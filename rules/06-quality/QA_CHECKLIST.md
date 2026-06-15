# QA_CHECKLIST.md

## ISHBOR — QA JARAYONI VA STRESS TEST QOIDALARI

---

## 1. MAQSAD

PLAN.md Priority 6 (Stress Test) va Priority 9 (Product Ready Standard)ni amaliy jarayonga aylantirish:

> Audit → Fix → Retest → Verify. Report yozishning o'zi yetarli emas.

Bu hujjat — **har qanday audit/fix ishi qanday tartibda bajarilishi kerakligi** va **qanday stress-test parametrlari ishlatilishi kerakligi**ni belgilaydi. Bu boshqa barcha governance hujjatlari (UX_STANDARDS, INTEGRATION_RULES, DEAD_ACTION_POLICY va h.k.) bo'yicha audit o'tkazishning **umumiy protokoli**.

---

## 2. SCOPE

Qamrab oladi: Audit→Fix→Retest→Verify sikli ta'rifi, stress-test parametrlari va ssenariylari, hisobot formati.

Qamrab olmaydi: har bir mavzu bo'yicha **nimani** tekshirish (bu boshqa hujjatlarda — UX_STANDARDS, MOBILE_STANDARDS va h.k.) — bu hujjat faqat **qanday** tekshirish va hisobot berish kerakligini belgilaydi.

---

## 3. AUDIT → FIX → RETEST → VERIFY SIKLI (MAJBURIY)

Har qanday topshiriq (audit, bug fix, UX polish, integration tuzatish) shu 4 bosqichdan o'tishi **shart**. Hech qaysi bosqich o'tkazib yuborilmaydi.

### 3.1 AUDIT
- Muammo aniq tasvirlanadi: qaysi sahifa/modul, qaysi holatda, qanday kutilgan vs haqiqiy natija.
- Muammo tegishli governance hujjatga (masalan, DEAD_ACTION_POLICY.md) bog'lanadi — "qaysi qoida buzilgan".
- Muammo **Critical / Important / Minor** darajasiga ajratiladi (PRODUCT_READY_CHECKLIST.md bilan moslikda).

### 3.2 FIX
- Faqat aniqlangan muammoga tegishli o'zgarish kiritiladi (scope creep yo'q — PRODUCT_RULES.md "No Feature Mode" bilan mos).
- Fix INTEGRATION_RULES.md'dagi "Single Source of Truth" prinsipiga zid bo'lmasligi tekshiriladi (ya'ni, fix yangi data-duplication yaratmaydi).

### 3.3 RETEST
- Xuddi shu ssenariy (Audit bosqichida tasvirlangan) **qaytadan** bajariladi.
- Agar muammo boshqa joyларга ham (INTEGRATION_RULES.md 6-bo'lim matritsasiga ko'ra) ta'sir qilishi mumkin bo'lsa, bog'liq joylar ham tekshiriladi.

### 3.4 VERIFY
- Natija yozma shaklda tasdiqlanadi: "Muammo X hal qilindi, Y va Z joylarda ham tekshirildi, hozir kutilgan natija bilan mos."
- **Faqat shu bosqichdan keyin** vazifa "yopildi" deb hisoblanadi.

> **MUHIM QOIDA:** Agar biror vazifa "Audit qilindi, muammo topildi" deb tugatilsa, lekin Fix/Retest/Verify bajarilmasa — bu vazifa **bajarilmagan** hisoblanadi, hech qanday progress sifatida hisoblanmaydi (PLAN.md: "Report yozishning o'zi yetarli emas").

---

## 4. STRESS TEST PARAMETRLARI

PLAN.md Priority 6 bo'yicha quyidagi hajmlar bilan test ma'lumotlari yaratiladi (test/staging muhitida):

| Entity | Miqdor |
|---|---|
| Messages | 100 |
| Notifications | 100 |
| Projects | 50 |
| Services | 50 |
| Portfolios | 50 |
| Orders | 50 |
| Reviews | 50 |
| Applications (Proposals) | 50 |

### 4.1 Tekshiriladigan natijalar:
- [ ] **Crash yo'q** — sahifa render qilinadi, error boundary ishga tushmaydi
- [ ] **Duplicate ID yo'q** — har bir entity unikal ID'ga ega (list render, key prop tekshiriladi)
- [ ] **Stale state yo'q** — yangi qo'shilgan/o'zgartirilgan entity barcha tegishli ro'yxat/dashboard'larda darhol ko'rinadi
- [ ] **localStorage corruption yo'q** — katta hajmdagi data bilan localStorage/state serialize-deserialize qilinganda xato chiqmaydi, eski format bilan ziddiyat yo'q

### 4.2 Stress-test ssenariylari:
1. 50 ta loyiha ro'yxatini ochish — pagination/scroll to'g'ri ishlaydi, render sekinlashmaydi (PERFORMANCE_STANDARDS.md bilan bog'liq).
2. 100 ta notification kelganda — notification badge soni to'g'ri, list overflow qilmaydi (MOBILE_STANDARDS.md bilan bog'liq).
3. 50 ta buyurtma holatlari turli bosqichlarda (yangi, jarayonda, yakunlangan, bekor qilingan) — har bir holat to'g'ri filtrlanadi va ko'rsatiladi.
4. 100 ta xabar bilan chat oynasi — scroll, yangi xabar kelishi, o'qilmagan hisoblagich to'g'ri ishlaydi.

---

## 5. HISOBOT FORMATI

Har bir audit/fix vazifasi quyidagi formatda hisobot beradi:

```
### [Vazifa nomi]

**AUDIT:**
- Sahifa/Modul: ...
- Muammo: ...
- Buzilgan qoida: [hujjat nomi, bo'lim]
- Daraja: Critical / Important / Minor

**FIX:**
- O'zgartirilgan fayllar: ...
- Nima qilindi: ...

**RETEST:**
- Test ssenariysi: ...
- Natija: ...

**VERIFY:**
- Tasdiqlangan holat: ...
- Bog'liq joylar tekshirildi: [ha/yo'q, qaysilar]
```

---

## 6. QOIDALAR (UMUMIY)

1. Har qanday audit so'rovi (foydalanuvchidan yoki rejadan) kelganda, birinchi javob **Audit** bosqichi bo'lishi kerak — to'g'ridan-to'g'ri "fix qildim" deb javob berilmaydi.
2. Har bir Fix faqat o'z Audit'ida tasvirlangan muammoga tegishli — qo'shimcha "yo'l-yo'lakay" o'zgarishlar alohida vazifa sifatida hisobga olinadi (yoki alohida AUDIT yoziladi).
3. Stress-test ma'lumotlari **faqat test/staging muhitida** yaratiladi, production data bilan aralashtirilmaydi.

---

## 7. AUDIT MEZONLARI

- Har bir hisobotda 4 bosqichning hammasi mavjudligi
- Stress-test parametrlari (4-bo'lim) kamida release oldidan bir marta to'liq bajarilgan bo'lishi
- 4.1 bo'limdagi 4 natija (crash, duplicate ID, stale state, localStorage) bo'yicha aniq PASS/FAIL natijasi

---

## 8. SUCCESS CRITERIA

- Har bir yopilgan vazifa 5-bo'lim formatiga mos hisobotga ega
- Stress test 4.1 bo'limining barcha 4 bandi PASS
- PRODUCT_READY_CHECKLIST.md 4.6-bo'limi to'liq PASS

---

## 9. QANDAY FOYDALANISH

**Insonlar uchun:**
- Har qanday "tekshirib chiq" so'roviga javoban, 5-bo'lim formatidagi hisobotni talab qiling — faqat "tekshirdim, hammasi yaxshi" javobi yetarli emas.

**Cursor/Claude uchun:**
- Har qanday audit/fix vazifasi olganida, javobni 5-bo'limdagi 4-bosqichli formatda tuzing.
- Agar vazifa "umumiy stress test o'tkaz" bo'lsa, 4-bo'limdagi parametrlar va ssenariylarni ishlatib, 4.1 bo'limning 4 bandini PASS/FAIL bilan hisobot bering.
- Hech qachon faqat AUDIT bosqichi bilan vazifani "tugagan" deb belgilamang — Fix/Retest/Verify yo'q bo'lsa, vazifa "davom etmoqda" yoki "keyingi qadam: Fix" deb belgilang.
