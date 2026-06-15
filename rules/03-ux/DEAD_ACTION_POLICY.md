# DEAD_ACTION_POLICY.md

## ISHBOR — DEAD ACTION (NATIJASIZ HARAKAT) SIYOSATI

---

## 1. MAQSAD

PLAN.md Priority 8:

> 0 dead button. 0 fake action. 0 toast-only workflow. Agar tugma bo'lsa: natija berishi shart.

Bu hujjat ushbu qoidani **aniq ta'riflar va tekshirish usuli** bilan ta'minlaydi — chunki "dead button" tushunchasi sub'ektiv bo'lib qolmasligi kerak.

---

## 2. SCOPE

Har qanday bosiladigan/teginiladigan element: tugma, link, icon-button, card, switch, menu item. Qamrab olmaydi: sof dekorativ elementlar (animatsiya, illustratsiya) — ular interaktiv emas deb belgilangan bo'lishi sharti bilan.

---

## 3. TA'RIFLAR

### 3.1 Dead Button (O'lik tugma)
Tugma bosilganda **hech qanday kuzatiladigan o'zgarish** sodir bo'lmaydi: na navigatsiya, na state o'zgarishi, na modal ochilishi, na hech narsa.

**Misol:** "Filtrlash" tugmasi bor, lekin bosilganda hech narsa o'zgarmaydi (filtr UI ham ochilmaydi, ham natija o'zgarmaydi).

### 3.2 Fake Action (Soxta harakat)
Tugma bir narsa **va'da qiladi**, lekin haqiqatda boshqa (yoki hech narsa) qiladi. Foydalanuvchi kutgan natija bilan haqiqiy natija mos kelmaydi.

**Misol:** "Eksport qilish" tugmasi bosilganda fayl yuklanmaydi, faqat console'ga log yoziladi yoki hech narsa qilmaydi, lekin tugma hali ham "Eksport qilish" deb turadi.

### 3.3 Toast-Only Workflow (Faqat bildirishnoma bilan tugaydigan oqim)
Foydalanuvchi muhim harakat qiladi (forma to'ldiradi, narsa yuboradi), lekin natijada faqat "Muvaffaqiyatli bajarildi ✅" degan toast ko'rinadi va **haqiqiy data o'zgarmaydi** — keyingi safar sahifani yangilasa, hech narsa o'zgarmagan bo'ladi.

**Misol:** "Taklif yubor" tugmasi bosiladi, "Yuborildi!" toast chiqadi, lekin Proposals ro'yxatida bu taklif ko'rinmaydi.

---

## 4. QOIDA: "NATIJA" NIMANI ANGLATADI

Har bir action quyidagi natija turlaridan **kamida bittasini** berishi shart:

| Natija turi | Misol |
|---|---|
| Navigatsiya | Boshqa sahifa/ekranga o'tish |
| State o'zgarishi (persistent) | Ma'lumot saqlanadi, sahifa yangilansa ham qoladi |
| UI o'zgarishi (modal/panel) | Modal ochiladi, accordion kengayadi |
| Tashqi natija | Fayl yuklab olinadi, email ochiladi, tashqi link ochiladi |

Faqat **vizual feedback** (toast, spinner, rang o'zgarishi) — bu yetarli emas, agar undan keyin yuqoridagi 4 turdan birortasi sodir bo'lmasa.

---

## 5. INVENTARIZATSIYA JARAYONI

Har audit'da quyidagi jarayon bajariladi:

1. Har bir sahifadagi barcha interaktiv elementlar ro'yxatga olinadi.
2. Har biri uchun: "Bosilganda nima sodir bo'lishi **kerak**?" (kutilgan natija) yoziladi.
3. Har biri haqiqatda bosib ko'riladi (yoki kod orqali tekshiriladi): "Bosilganda nima sodir bo'ladi?" (haqiqiy natija).
4. Kutilgan va haqiqiy natija solishtiriladi:
   - Mos kelsa → ✅ Live Action
   - Mos kelmasa, natija yo'q → ❌ Dead Button
   - Mos kelmasa, boshqa natija → ❌ Fake Action
   - Toast bor, data o'zgarmadi → ❌ Toast-Only Workflow

---

## 6. ISTISNOLAR (NIMA DEAD BUTTON HISOBLANMAYDI)

- **Disabled tugma** aniq sababli holat bilan (masalan, "Saqlash" tugmasi forma to'liq to'ldirilmaguncha disabled, va bu vizual ravishda aniq) — bu dead emas, bu **kutilgan holat**.
- **"Tez kunda" (Coming Soon) belgisi bilan aniq belgilangan funksiya** — agar bu PRODUCT_RULES.md'dagi "No Feature Mode" davrida vaqtincha qoldirilgan bo'lsa va aniq label bilan belgilangan bo'lsa. Biroq, bu holat **minimal** bo'lishi kerak va PRODUCT_READY_CHECKLIST.md'da alohida ro'yxatga olinadi — "0 dead button" maqsadiga erishish uchun bular ham yo'q qilinishi kerak.

> **Eslatma:** "Coming Soon" istisnosi vaqtinchalik bahona sifatida ishlatilmaydi. Har bir shunday holat PRODUCT_READY_CHECKLIST.md'ga FAIL sifatida kiritiladi, chunki yakuniy maqsad — 0 ta shunday holat.

---

## 7. QOIDALAR (UMUMIY)

1. Yangi tugma/action qo'shilganda, uning natijasi shu kod o'zgarishi ichida **to'liq implement qilingan** bo'lishi shart — "keyinroq qo'shamiz" qabul qilinmaydi.
2. Agar biror funksiya hali tayyor bo'lmasa, mos tugma **butunlay yashirilgan** bo'lishi kerak, "Coming Soon" bilan ko'rsatilmaydi (6-bo'limdagi istisno faqat hozirgi mavjud holatlarni hisobga olish uchun, yangilarini qo'shish uchun emas).
3. UX_STANDARDS.md'dagi Primary/Secondary action'lar — bularning barchasi shu hujjatdagi "Live Action" talabiga mos bo'lishi shart.

---

## 8. AUDIT MEZONLARI

- [ ] Har bir sahifadagi har bir interaktiv element 5-bo'limdagi jarayondan o'tgan
- [ ] Topilgan har bir Dead Button/Fake Action/Toast-Only Workflow ro'yxatga olingan (sahifa, element, kutilgan natija, haqiqiy natija)
- [ ] Har biri uchun fix qilingan va qaytadan 5-bo'lim jarayoni orqali tekshirilgan (Retest/Verify)

---

## 9. SUCCESS CRITERIA

- Loyiha bo'ylab inventarizatsiya 100% yakunlangan
- Dead Button = 0, Fake Action = 0, Toast-Only Workflow = 0
- 6-bo'limdagi istisnolar soni — minimal va har biri PRODUCT_READY_CHECKLIST.md'da hisobga olingan

---

## 10. QANDAY FOYDALANISH

**Insonlar uchun:**
- Yangi feature/fix qo'shishda, har bir yangi tugma uchun "kutilgan natija"ni oldindan yozib qo'ying — bu test paytida solishtirish uchun asos bo'ladi.

**Cursor/Claude uchun:**
- "Dead action audit" so'ralganda, har bir sahifa/komponent kodini o'qib, har bir onClick/onPress/href handler'ining **haqiqatda nima qilishini** tekshiring (masalan, bo'sh funksiya, faqat `console.log`, faqat `setToast()` lekin data o'zgarishi yo'q — bularning barchasi shubhali).
- Har bir topilgan muammoni 5-bo'limdagi jadval formatida (sahifa, element, kutilgan, haqiqiy, toif) hisobotga kiritib, keyin fix qiling.
- Fix'dan keyin shu element uchun yana bir marta "bosilganda nima sodir bo'ladi" tekshirish — bu Verify bosqichi.
