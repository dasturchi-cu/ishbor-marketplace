# DESIGN_GUARDRAILS.md

## ISHBOR — VIZUAL DIZAYN QOIDALARI

---

## 1. MAQSAD

UX_STANDARDS.md va MOBILE_STANDARDS.md'da ishlatiladigan "Primary button stili", "vizual jihatdan ustun", "konsistent badge" kabi tushunchalarni **aniq vizual qoidalarga** aylantirish. Bu hujjat — Ishbor'ning "professional marketplace hissi" (PLAN.md Success Condition) ni vizual jihatdan ta'minlash uchun **markazlashtirilgan dizayn lug'ati**.

---

## 2. SCOPE

Qamrab oladi: tugma turlari va ularning vizual ierarxiyasi, rang/tipografiya foydalanish prinsiplari (mavjud design-token tizimiga moslab), spacing/komponent konsistentligi.

Qamrab olmaydi: aniq HEX kodlar/font fayllar (agar loyihada allaqachon design-system mavjud bo'lsa, bu hujjat unga **havola qiladi**, takrorlamaydi) — bu hujjat **qoidalar va printsiplar** darajasida, mavjud design-system'ning "qanday ishlatilishi"ni belgilaydi.

> **Eslatma:** Agar loyihada alohida design-token fayli/tizimi (masalan, Tailwind config, Figma tokens) mavjud bo'lsa, u **yagona rang/o'lcham manbai** hisoblanadi. Bu hujjat shu manbadan qanday foydalanish qoidalarini belgilaydi, yangi qiymatlar "ixtiro qilmaydi".

---

## 3. TUGMA IERARXIYASI (UX_STANDARDS.md bilan bog'liq)

UX_STANDARDS.md 3-bo'limidagi "Primary/Secondary/Overflow" tushunchalari vizual jihatdan quyidagicha ifodalanadi:

| Daraja | Vizual ko'rinish | Qachon ishlatiladi |
|---|---|---|
| Primary | To'ldirilgan (filled) fon, brend rangi, eng katta vizual og'irlik | Faqat 1 dona, sahifaning asosiy harakati |
| Secondary | Konturli (outline) yoki neytral fon, kichikroq vizual og'irlik | Maksimum 2 dona |
| Overflow | Icon-only (⋯) yoki matn-link, eng kam vizual og'irlik | Cheklanmagan, menyu ichida |
| Disabled | Past kontrast, kursor `not-allowed` | DEAD_ACTION_POLICY.md 6-bo'limidagi istisno holatlar uchun |

> **Qoida:** Bitta sahifada bir vaqtning o'zida 2 ta "Primary" stilidagi tugma bo'lishi **mumkin emas** — bu UX_STANDARDS.md 3-bo'limini buzadi va vizual ravishda foydalanuvchini chalkashtiradi.

---

## 4. RANG ISHLATISH PRINSIPLARI

4.1. **Semantik ranglar** — har bir holat uchun bitta rang, butun loyiha bo'ylab bir xil:
- Muvaffaqiyat/Tasdiqlangan (masalan, Verification badge, "Completed" holat) — yashil oilasi
- Ogohlantirish/Kutilmoqda (masalan, "Pending" holat) — sariq/orange oilasi
- Xato/Bekor qilingan — qizil oilasi
- Neytral/Ma'lumot — ko'k yoki brend-neytral

4.2. TRUST_SYSTEM.md'dagi Verification badge'lari, Order holat belgilari, Notification turlari — barchasi 4.1-bo'lim semantik ranglariga mos bo'lishi kerak, har modul o'z ranglarini "ixtiro qilmaydi".

---

## 5. SPACING VA KOMPONENT KONSISTENTLIGI

5.1. Bir xil turdagi komponentlar (masalan, "Card" — Project Card, Service Card, Freelancer Card) **bir xil asosiy struktura**ga ega: rasm/avatar, sarlavha, qisqa tavsif, Trust/Reputation belgisi (TRUST_SYSTEM.md 4-bo'limi), Primary action.

5.2. Ikki bosiladigan element orasidagi minimal masofa MOBILE_STANDARDS.md 6.2-bo'limidagi 8px qoidasiga mos — bu mobile uchun emas, **barcha** breakpoint'lar uchun minimal qiymat.

5.3. Sarlavha hierarchiyasi (H1/H2/H3 ekvivalenti) har sahifa turida bir xil tartibda ishlatiladi — UX_STANDARDS.md 5-soniya qoidasidagi "Men qayerdaman?" savolini hal qilish uchun.

---

## 6. QOIDALAR (UMUMIY)

1. Yangi komponent yaratilganda, avval 3-5 bo'limlardagi mavjud naqshlardan (pattern) foydalanish ko'rib chiqiladi — yangi vizual naqsh yaratish oxirgi chora.
2. Agar mavjud design-token tizimi bilan ziddiyat topilsa (masalan, ikkita "Primary button" stili mavjud), bu **Visual Inconsistency Bug** sifatida belgilanadi va qaysi biri "rasmiy" ekanligi aniqlanadi (eski/ko'p ishlatilgani saqlanadi, odatda).
3. TRUST_SYSTEM.md, ROLE_CONSISTENCY.md (dashboard bloklari), PERSONALIZATION_RULES.md (tavsiya card'lari) — barchasi shu hujjatdagi Card/Badge/Button qoidalariga amal qiladi, har biri o'z stilini yaratmaydi.

---

## 7. AUDIT MEZONLARI

- [ ] Har sahifada faqat 1 ta "Primary" vizual stildagi tugma (3-bo'lim)
- [ ] Semantik ranglar (4-bo'lim) barcha modullarda bir xil holatlar uchun bir xil ishlatilgan
- [ ] Bir xil komponent turlari (Card, Badge) bir xil struktura/spacing'ga ega (5-bo'lim)
- [ ] Mavjud design-token tizimidan tashqari "ixtiro qilingan" rang/o'lcham yo'q

---

## 8. SUCCESS CRITERIA

- Visual Inconsistency Bug = 0
- UX_STANDARDS.md va MOBILE_STANDARDS.md'dagi vizual havolalar (Primary button, badge, spacing) bu hujjatdagi qoidalarga mos
- PRODUCT_READY_CHECKLIST.md 4.3 va 4.5-bo'limlariga vizual jihatdan hissa qo'shadi

---

## 9. QANDAY FOYDALANISH

**Insonlar uchun:**
- Yangi komponent yaratishda, avval mavjud Card/Button/Badge naqshlarini topib, ulardan foydalaning — yangisini yaratishdan oldin shu hujjatga qarang.

**Cursor/Claude uchun:**
- "UI/Design audit" so'ralganda, kod bazasidagi tugma/card/badge komponentlarini taqqoslab, 3-5 bo'limlardagi qoidalarga zid variantlar (masalan, bir nechta turli "Primary button" CSS klassi) topilganda, ularni **Visual Inconsistency Bug** sifatida hisobotga kiritadi.
- Fix qilishda, eng ko'p ishlatilgan/rasmiy variant tanlanadi va boshqalari shunga moslashtiriladi — yangi variant yaratilmaydi.
- QA_CHECKLIST.md formatida Audit→Fix→Retest→Verify bilan yopiladi.
