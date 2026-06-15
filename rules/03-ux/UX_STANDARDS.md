# UX_STANDARDS.md

## ISHBOR — UX STANDARTLARI

---

## 1. MAQSAD

PLAN.md Priority 3 (UX Simplification) va Success Condition'ni amaliy, tekshiriladigan qoidalarga aylantirish:

> Har sahifa 5 soniyada tushunarli bo'lishi kerak. Har user "Keyingi nima qilaman?" savoliga javob ko'rishi kerak. Maksimum 1 Primary Action + 2 Secondary Actions.

---

## 2. SCOPE

Qamrab oladi: sahifa darajasidagi action hierarchiyasi, "5 soniya qoidasi", "keyingi qadam" tushunchasi, va bularning har bir sahifa turi (dashboard, detail page, form, list) uchun qo'llanilishi.

Qamrab olmaydi: vizual stil (rang, shrift, spacing — bu **DESIGN_GUARDRAILS.md**), mobile-specific moslashuv (**MOBILE_STANDARDS.md**), tugma "ishlaydi/ishlamaydi" holati (**DEAD_ACTION_POLICY.md** — bu yerda faqat tugmalar soni/hierarchiyasi).

---

## 3. QOIDA 1: ACTION HIERARCHY (1 + 2)

Har bir sahifa/ekranda:

- **1 Primary Action** — sahifaning asosiy maqsadiga eng to'g'ridan-to'g'ri olib boradigan, vizual jihatdan eng ko'zga tashlanadigan tugma/havola.
- **Maksimum 2 Secondary Actions** — primary'ga alternativ yoki qo'shimcha harakatlar, vizual jihatdan kamroq ta'kidlangan.
- Boshqa barcha mumkin bo'lgan harakatlar (masalan, "Share", "Report", "Export") — **overflow menu** (uch nuqta `⋯`) ichiga joylashtiriladi, sahifaning asosiy maydoniga chiqarilmaydi.

### Misollar:

| Sahifa | Primary | Secondary 1 | Secondary 2 | Overflow'ga |
|---|---|---|---|---|
| Loyiha detali (Client) | "Takliflarni ko'rish" | "Tahrirlash" | "Bekor qilish" | Share, Report, Duplicate |
| Freelancer profili (Client ko'rinishi) | "Murojaat yuborish" | "Saqlash (bookmark)" | "Portfolio ko'rish" | Report, Block |
| Buyurtma detali | "Ishni topshirish" / "Tasdiqlash" (rolga qarab) | "Xabar yozish" | "Tafsilotlar" | Dispute ochish, Export |

> **Qoida:** Agar sahifada 3+ vizual jihatdan teng darajadagi tugma ko'rinsa, bu **UX violation** — qaysi biri primary ekanligi noaniq.

---

## 4. QOIDA 2: 5 SONIYA QOIDASI

Har bir sahifa ochilganidan keyin 5 soniya ichida foydalanuvchi quyidagi 3 savolga javob topa olishi kerak:

1. **Men qayerdaman?** (sahifa nomi/sarlavhasi, breadcrumb yoki kontekst aniq)
2. **Bu sahifada nima ko'rsatilmoqda?** (asosiy kontent turi vizual ravishda ajralib turadi)
3. **Keyin nima qilishim mumkin?** (Primary Action ko'zga tashlanadi — 3-bo'limga qarang)

### Tekshirish usuli:
- Sahifa screenshot'iga 5 soniya qarab, yuqoridagi 3 savolga javob berib bo'lmasa — **FAIL**.
- Eng ko'p uchraydigan sabablar: sarlavha yo'q/noaniq, bir nechta bir xil og'irlikdagi blok, CTA (call-to-action) ko'rinmaydi yoki boshqa elementlar orasida yo'qoladi.

---

## 5. QOIDA 3: "KEYINGI QADAM" PRINSIPI

Har bir holat (state) uchun foydalanuvchiga aniq keyingi qadam ko'rsatilishi kerak — bo'sh, kutish yoki yakunlangan holatlarda ham:

| Holat | Keyingi qadam ko'rsatilishi |
|---|---|
| Bo'sh dashboard (yangi foydalanuvchi) | "Birinchi loyihangizni yarating" / "Profilingizni to'ldiring" kabi aniq CTA |
| Kutilayotgan taklif | "Javobni qachon kutish mumkinligi" yoki keyingi harakat (masalan, "Xabar yozish") |
| Yakunlangan buyurtma | "Review qoldiring" yoki "Yangi loyiha qidiring" |
| Xatolik holati | Aniq xato matni + tuzatish uchun harakat (faqat "Xatolik yuz berdi" emas) |

> **Qoida:** "Bo'sh holat" (empty state) hech qachon faqat "Hech narsa topilmadi" matni bilan qolmaydi — doim CTA bilan birga keladi.

---

## 6. SAHIFA TURLARI BO'YICHA QO'SHIMCHA QOIDALAR

### 6.1 Dashboard
- Eng yuqorida — foydalanuvchi uchun eng muhim "hozir nima bo'layapti" ma'lumoti (masalan, kutilayotgan takliflar, faol buyurtmalar).
- Personalization'ga asoslangan tavsiyalar (PERSONALIZATION_RULES.md) ikkinchi darajali blok sifatida.

### 6.2 List/Browse sahifalar (Projects, Services, Freelancers ro'yxati)
- Filtr/sort har doim ko'rinadigan joyda, lekin Primary Action emas.
- Har bir list item'ning o'zi bitta aniq action'ga olib boradi (masalan, "Ko'rish" yoki to'g'ridan-to'g'ri detail sahifaga o'tish).

### 6.3 Forma sahifalar
- Faqat 1 submit (Primary). "Bekor qilish"/"Orqaga" — Secondary.
- Forma uzun bo'lsa, bosqichlarga bo'linadi (multi-step), har bosqichda progress ko'rsatiladi (TRUST_SYSTEM.md'dagi Progress qoidalariga mos).

---

## 7. QOIDALAR (UMUMIY)

1. Har bir yangi sahifa/komponent yaratilganda, 3-bo'limdagi Action Hierarchy jadvaliga o'xshash tahlil yozilishi kerak (Primary/Secondary/Overflow aniqlanishi).
2. DESIGN_GUARDRAILS.md bilan ziddiyat bo'lmasligi uchun: Primary Action har doim DESIGN_GUARDRAILS.md'da belgilangan "primary button" stilida bo'ladi, boshqa hech qaysi element shu stilda bo'lmaydi.
3. Mobile'da bu qoidalar o'zgarmaydi, faqat joylashish MOBILE_STANDARDS.md bo'yicha moslashtiriladi.

---

## 8. AUDIT MEZONLARI

Har bir sahifa uchun:
- [ ] Aniq 1 Primary Action mavjud va vizual jihatdan ustun
- [ ] Secondary action'lar ≤ 2
- [ ] Qolgan action'lar overflow menuda
- [ ] 5 soniya testi PASS (3 savolga javob bor)
- [ ] Bo'sh/xato/yakunlangan holatlarda aniq keyingi qadam ko'rsatilgan

---

## 9. SUCCESS CRITERIA

- Loyihadagi barcha asosiy sahifalarda (Dashboard, Project Detail, Order Detail, Profile, Service Detail va boshqalar) 8-bo'lim checklisti 100% PASS
- PRODUCT_READY_CHECKLIST.md'dagi "UX score > 98" shartiga hissa qo'shadi

---

## 10. QANDAY FOYDALANISH

**Insonlar uchun:**
- Yangi sahifa dizayni/tahriri qilishdan oldin, 3-bo'limdagi jadval formatida shu sahifa uchun Primary/Secondary/Overflow'ni oldindan rejalashtiring.

**Cursor/Claude uchun:**
- "UX audit" so'ralganda, har bir asosiy sahifa uchun 8-bo'lim checklistini to'ldiring.
- Agar sahifada 2dan ortiq vizual jihatdan teng tugma topilsa, qaysi birini Primary qilish kerakligini sahifa maqsadidan kelib chiqib aniqlang va qolganlarini Secondary/Overflow'ga tushiring — bu UX_VIOLATION turi sifatida hisobotda ko'rsatiladi.
- Fix'dan keyin 5 soniya testini qaytadan "o'tkazib ko'ring" (screenshot/struktura asosida) va natijani Retest/Verify bosqichida yozing.
