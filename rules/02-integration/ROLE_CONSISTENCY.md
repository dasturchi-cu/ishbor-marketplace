# ROLE_CONSISTENCY.md

## ISHBOR — ROL KONSISTENTLIGI QOIDALARI

---

## 1. MAQSAD

PLAN.md Priority 1'ning rol-specific qismi: "Role switch, Permissions" har bir modulda to'g'ri ishlashi. Bu hujjat — Client, Freelancer, Agency, Admin rollari (PROJECT_STANDARDS.md 4-bo'limda ta'riflangan) o'rtasidagi **permission, dashboard va multi-role** qoidalarini belgilaydi.

---

## 2. SCOPE

Qamrab oladi: har bir rol nimani ko'ra olishi/qila olishi, multi-role (bir foydalanuvchi bir nechta rolga ega) holatlari, rol-specific dashboard tarkibi.

Qamrab olmaydi: modullararo data-flow (INTEGRATION_RULES.md), UX joylashuvi (UX_STANDARDS.md) — bu yerda faqat **kimga nima ruxsat va nima ko'rsatiladi**.

---

## 3. PERMISSION MATRITSASI

| Harakat | Client | Freelancer | Agency | Admin |
|---|---|---|---|---|
| Loyiha yaratish | ✅ | ❌ | ❌ | ✅ (moderatsiya uchun) |
| Loyihaga taklif yuborish | ❌ | ✅ | ✅ | ❌ |
| Xizmat (service) joylashtirish | ❌ | ✅ | ✅ | ❌ |
| Buyurtmani tasdiqlash/yopish | ✅ (client tomonidan qabul) | ✅ (ishni topshirish) | ✅ (jamoa nomidan) | ✅ (dispute holatida) |
| Eskrovga pul kiritish | ✅ | ❌ | ❌ | ❌ |
| Eskrovdan pul chiqarish (so'rov) | ❌ | ✅ | ✅ | ✅ (tasdiqlash) |
| Review qoldirish | ✅ (freelancer/agency haqida) | ✅ (client haqida) | ✅ (client haqida) | ❌ |
| Jamoa a'zolarini boshqarish | ❌ | ❌ | ✅ | ❌ |
| Boshqa foydalanuvchini bloklash/banlash | ❌ | ❌ | ❌ | ✅ |
| Platform-wide statistikani ko'rish | ❌ | ❌ | ❌ | ✅ |

> **Qoida:** Yangi action qo'shilganda, bu jadvalga qator qo'shiladi. Agar kod darajasida bu jadvalga mos kelmaydigan ruxsat topilsa (masalan, Client eskrovdan pul chiqarish so'rovini yubora olsa), bu **Critical Role Bug**.

---

## 4. MULTI-ROLE FOYDALANUVCHILAR

Bir foydalanuvchi bir vaqtning o'zida bir nechta rolga ega bo'lishi mumkin (masalan, Client + Freelancer).

### Qoidalar:
4.1. Foydalanuvchi **bir vaqtning o'zida faqat bitta "active rol kontekstida"** bo'ladi — masalan, "Freelancer rejimi" yoki "Client rejimi". Bu kontekst aniq ko'rinadigan switch orqali almashtiriladi (INTEGRATION_RULES.md 4-bo'limidagi Role Switch qoidalariga muvofiq).

4.2. Active rol konteksti quyidagilarga ta'sir qiladi:
- Dashboard tarkibi (5-bo'lim)
- Permission matritsasi (3-bo'lim) — faqat active rolga mos ruxsatlar ko'rinadi
- Notifications filtri — faqat active rolga tegishli bildirishnomalar birinchi o'ringa chiqadi (lekin boshqa roldagi muhim bildirishnomalar ham yo'qolmasligi kerak — masalan, Freelancer rejimida bo'lsa-da, Client sifatidagi buyurtma yangiligi haqida bildirishnoma kelishi mumkin)

4.3. Ma'lumotlar (masalan, Trust Score, Wallet balansi) **rol-agnostik** — ya'ni bitta foydalanuvchining umumiy balansi, faqat bir rolga tegishli emas (agar biznes-mantiqda alohida ajratish talab qilinmasa, bu holda PROJECT_STANDARDS.md'ga aniq yozilishi kerak).

---

## 5. ROL-SPECIFIC DASHBOARD TARKIBI

| Rol | Dashboard'da birinchi ko'rinadigan bloklar |
|---|---|
| Client | Faol loyihalar, yangi takliflar, kutilayotgan to'lovlar |
| Freelancer | Mos loyihalar (Personalization), faol buyurtmalar, daromad statistikasi |
| Agency | Jamoa faoliyati, faol buyurtmalar (jamoa bo'yicha), umumiy daromad |
| Admin | Moderatsiya navbati, platform statistikasi, disputlar |

Har bir blok UX_STANDARDS.md 6.1-bo'limidagi Dashboard qoidalariga mos bo'lishi kerak (eng muhim "hozir nima bo'layapti" birinchi o'rinda).

---

## 6. AGENCY — FREELANCER FARQI

Agency rolida ishlash Freelancer rolidan quyidagi jihatlar bilan farqlanadi:

- Agency profilida **jamoa a'zolari ro'yxati** mavjud, Freelancer profilida yo'q.
- Agency tomonidan yuborilgan taklif/buyurtma — **jamoa nomidan**, lekin qaysi a'zo mas'ul ekanligi ko'rsatiladi (CRM bilan integratsiya — INTEGRATION_RULES.md).
- Agency Trust Score — jamoa a'zolari Trust Score'larining agregatsiyasi (TRUST_SYSTEM.md'da hisoblash usuli belgilanadi).

---

## 7. QOIDALAR (UMUMIY)

1. Permission matritsasi (3-bo'lim) — bu **yagona haqiqat manbai**. Kod darajasidagi har qanday permission-check shu jadvalga mos bo'lishi kerak.
2. Yangi rol yoki sub-rol (masalan, "Agency Manager" vs "Agency Member") qo'shilishi PROJECT_STANDARDS.md 4-bo'limini yangilashni talab qiladi, va keyin shu hujjatga moslab 3, 5, 6-bo'limlar kengaytiriladi.
3. Rol-specific UI matnlari (masalan, tugma nomlari) PROJECT_STANDARDS.md terminologiya lug'atiga mos bo'lishi kerak.

---

## 8. AUDIT MEZONLARI

- [ ] 3-bo'limdagi permission matritsasining har bir katakchasi kod darajasida tekshirilgan (✅/❌ holatlar amalda mos)
- [ ] Multi-role foydalanuvchi uchun rol almashtirish 4-bo'lim qoidalariga mos
- [ ] Har bir rol dashboardi 5-bo'lim tarkibiga mos
- [ ] Agency-specific funksiyalar (6-bo'lim) Freelancer rejimida ko'rinmaydi va aksincha

---

## 9. SUCCESS CRITERIA

- Critical Role Bug = 0 (PRODUCT_READY_CHECKLIST.md 4.9-bo'limi bilan mos)
- Permission matritsasi 100% kod bilan mos
- Multi-role switch holatlarida ma'lumot oqishi (data leakage) yo'q — masalan, Freelancer rejimida Client-only ma'lumotlar ko'rinmaydi

---

## 10. QANDAY FOYDALANISH

**Insonlar uchun:**
- Yangi permission yoki rol-specific funksiya qo'shishda, avval 3-bo'lim jadvaliga qator/ustun qo'shing, keyin implement qiling.

**Cursor/Claude uchun:**
- "Role audit" so'ralganda, har bir rol uchun login qilib (yoki rol-switch qilib), 3-bo'limdagi har bir katakchani amalda tekshiring — ruxsat berilgan harakat ko'rinadi/ishlaydi, ruxsat berilmagan harakat ko'rinmaydi/disabled.
- Multi-role foydalanuvchida rol almashtirib, 4-bo'lim qoidalariga (eski rol state tozalanishi, dashboard to'liq almashishi) mos kelishini tekshiring.
- Topilgan nomuvofiqlik QA_CHECKLIST.md formatida (Audit→Fix→Retest→Verify) hisobot qilinadi.
