# PROJECT_STANDARDS.md

## Ishbor Global Rivojlanish Qoidalari

Bu loyiha ustida ishlayotgan barcha AI agentlar, Cursor, Bolt, Claude, GPT va developerlar ushbu qoidalarni har bir vazifadan oldin o‘qishi va ularga amal qilishi shart.

---

# 1. Dizayn tizimini himoya qilish

**TAQIQLANADI:**

* Brendingni o‘zgartirish
* Logoni o‘zgartirish
* Ranglarni almashtirish
* Navigatsiya strukturasini buzish
* Ishbor UI stilini almashtirish

**SAQLANADI:**

* Asosiy rang: `#2563EB`
* Mavjud tipografiya
* Mavjud bo‘shliq (spacing) tizimi
* Mavjud karta tizimi
* Mavjud border radius tizimi
* Mavjud layout ierarxiyasi

Aniq so‘rov bo‘lmasa, qayta dizayn qilish taqiqlanadi.

---

# 2. UX qoidalari

Har bir sahifada foydalanuvchi o‘zidan so‘rashi kerak bo‘lgan savol:

**"Keyin nima qilaman?"**

Javob sahifaning o‘zida ko‘rinishi kerak.

Har bir sahifada quyidagilar bo‘lishi shart:

* Asosiy CTA (Primary CTA)
* Ikkinchi darajali CTA (Secondary CTA)
* Bo‘sh holat CTA (Empty State CTA)

Tupik sahifalar (dead-end) taqiqlanadi.

---

# 3. Tupik harakatlar yo‘q (No Dead Actions)

Har qanday:

* Tugma
* Havola
* Karta harakati
* Dropdown harakati
* Kontekst menyu harakati

quyidagilardan **kamida bittasini** bajarishi kerak:

* Navigatsiya qilish
* Modal ochish
* Holatni o‘zgartirish (mutate state)
* Mazmunli fikr-mulohaza ko‘rsatish

Faqat toast ko‘rsatadigan soxta harakatlar taqiqlanadi.

---

# 4. Marketplace standartlari

Marketplace quyidagi oqimlarni to‘liq qo‘llashi kerak:

**Mijoz (Client):**

```
Loyiha joylash
    ↓
Takliflar olish
    ↓
Frilanserlarni ko‘rib chiqish
    ↓
Ishga olish
    ↓
Escrow’ni moliyalashtirish
    ↓
Buyurtmani boshqarish
    ↓
Sharh qoldirish
```

**Frilanser (Freelancer):**

```
Loyihalarni ko‘rish
    ↓
Taklif yuborish
    ↓
Qabul qilinish
    ↓
Buyurtmani yakunlash
    ↓
To‘lov olish
    ↓
Portfolio yaratish
```

Har bir qadam ishlashi kerak.

---

# 5. Admin standartlari

Admin panel faqat audit uchun emas.

Har bir admin harakati quyidagilarni berishi kerak:

* Haqiqiy holat yangilanishi
* Audit jurnali
* Tasdiqlash dialogi
* Muvaffaqiyatli fikr-mulohaza

---

# 6. Portfolio standartlari

Har bir frilanser quyidagilarni joylay olishi kerak:

* Portfolio
* Case study
* Galereya
* Natijalar
* Sharhlar

Portfolio marketplace ishonch elementi hisoblanadi.

---

# 7. Lokalizatsiya qoidalari

**Standart til:** O‘zbek

Yangi qo‘shilgan komponentlarda:

* Inglizcha matn ishlatmaslik
* Professional o‘zbek tilidan foydalanish

Tekshiriladi:

* Tugmalar
* Toast xabarlari
* Xato holatlari
* Bildirishnomalar
* Bo‘sh holatlar
* Modallar
* Tooltip’lar

---

# 8. Mobile First

Har bir yangi funksiya quyidagi o‘lchamlarda tekshirilsin:

* 320px
* 360px
* 375px
* 390px
* 414px
* 430px
* 768px

**Taqiqlanadi:**

* Overflow (tashqariga chiqish)
* Buzilgan kartalar
* Kesilgan matn

---

# 9. Qulaylik (Accessibility)

Har bir forma quyidagilarga ega bo‘lishi kerak:

* Label
* Placeholder
* Xato holati
* Muvaffaqiyat holati

**Touch target:** kamida 44px

---

# 10. Ishlash tezligi (Performance)

**Taqiqlanadi:**

* Keraksiz re-render
* Dublikat holat (duplicate state)
* Dublikat store’lar
* Dublikat biznes logikasi

**Afzal:**

* Qayta ishlatiladigan komponentlar
* Umumiy hook’lar
* Umumiy store’lar

---

# 11. Ishonch va konversiya

Har yangi funksiya quyidagilardan **kamida bittasini** yaxshilashi kerak:

* Ishonch
* Konversiya
* Qayta qaytish (retention)
* Foydalanuvchi tushunchasi (clarity)

Aks holda funksiya rad etiladi.

---

# 12. Har bir merge’dan oldin

**Majburiy audit:**

* Mehmon oqimi (Guest Flow)
* Mijoz oqimi (Client Flow)
* Frilanser oqimi (Freelancer Flow)
* Admin oqimi (Admin Flow)
* Mobil oqim (Mobile Flow)

**Hisobot yaratish:** `FEATURE_AUDIT_REPORT.md`

**Kiritiladi:**

* Tupik tugmalar
* Tupik havolalar
* UX muammolari
* UI muammolari
* Mobil muammolar
* Konversiya muammolari
* Tavsiya etilgan tuzatishlar

---

# 13. Sifat darajasi (Quality Gate)

Vazifa **TUGALLANGAN** hisoblanmaydi agar:

* Tupik tugma mavjud bo‘lsa
* Tupik havola mavjud bo‘lsa
* Placeholder matn mavjud bo‘lsa
* Buzilgan mobil layout mavjud bo‘lsa
* Foydalanuvchi keyingi qadamni tushunmasa

---

# 14. Rol tizimi standarti

**Foydalanuvchi rollari:**

* Mijoz (Client)
* Frilanser (Freelancer)
* Ikkalasi (Both)

Agar foydalanuvchi roli **both** bo‘lsa:

Profil, Dashboard va Workspace ichida **rol almashtirgich** bo‘lishi shart.

**Frilanser ko‘rinishi:**

* Portfolio
* Arizalar
* Daromad
* Sharhlar

**Mijoz ko‘rinishi:**

* Kompaniya
* Loyihalar
* Buyurtmalar
* Escrow
* Xarajatlar

Tanlangan rol `localStorage` da saqlanadi.

---

# 15. Rivojlanish ustuvorligi

Har doim quyidagi tartib:

1. Funksionallik
2. UX
3. Mobil
4. Ishonch
5. Ishlash tezligi
6. Vizual yaxshilash

Vizual dizayn funksionallikdan ustun emas.

---

**STANDART OXIRI**

---

# 16. Enterprise documentation (Single Source of Truth)

Har bir vazifadan oldin quyidagi hujjatlarni o'qing:

1. `docs/PROJECT_BIBLE.md`
2. `PROJECT_STANDARDS.md` (bu fayl)
3. `docs/PRODUCT_REQUIREMENTS.md`
4. `docs/LAUNCH_CHECKLIST.md`
5. `docs/AUDIT_PLAYBOOK.md`

To'liq indeks: `docs/README.md`

Hujjat va kod ziddiyati bo'lsa — avval hujjatni tekshiring, keyin kodni audit qiling va moslashtiring.
