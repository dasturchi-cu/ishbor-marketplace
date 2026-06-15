# FEATURE_COMPLETION_POLICY.md

## ISHBOR — FEATURE TUGALLASH SIYOSATI

---

## 1. ASOSIY QOIDA

```
VISIBLE FEATURE = WORKING FEATURE
```

Ko'rinadigan feature **ishlashi shart**. Lekin birinchi yo'l — **olib tashlash emas, tugallash**.

---

## 2. FEATURE BOR BO'LSA

| # | Harakat |
|---|---------|
| 1 | Uni olib tashlashga shoshilma |
| 2 | Ishlatish mumkin bo'lgan darajaga olib chiq |
| 3 | Mavjud store va localStorage orqali tugat |
| 4 | UX oqimini yakunla |

---

## 3. MISOLLAR

### Video Call

- ❌ Olib tashlama
- ✅ Call modal
- ✅ Calling state
- ✅ Connected state
- ✅ End call
- ✅ Call history

### Voice Call

- ❌ Olib tashlama
- ✅ Ishlaydigan demo flow (modal + state + tarix)

### Analytics

- ❌ Yashirma
- ✅ Tushunarli qil (metrikalar, empty state, CTA)

### Agency

- ❌ Yashirma
- ✅ Integratsiya qil (dashboard, CRM, portfolio)

### Subscription

- ❌ Yashirma
- ✅ Foydasini tushuntir (rejalar, upgrade oqimi)

### CRM

- ❌ Yashirma
- ✅ CTA va workflow qo'sh

---

## 4. FAQAT OLIB TASHLASH KERAK BO'LGANDA

- Dead buttons (natijasiz tugmalar)
- Broken routes (ishlamaydigan yo'llar)
- Duplicate actions (takroriy harakatlar)
- Unused components (hech qayerda ishlatilmaydigan komponentlar)

---

## 5. BOSHQA HAMMA NARSA

```
Complete → Integrate → Polish → Retest → Verify
```

**Maqsad:** Feature sonini kamaytirish emas — **featurelarni tugallash**.

---

## 6. COMING SOON BILAN FARQ

| Hujjat | Vazifa |
|--------|--------|
| [COMING_SOON_ELIMINATION.md](./COMING_SOON_ELIMINATION.md) | "Tez orada", "Beta", "Demo" **matnlarini** olib tashlash |
| **FEATURE_COMPLETION_POLICY** (bu hujjat) | Ko'rinadigan **featurelarni tugallash** |

Agar feature ko'rinadi va "tez orada" deb yozilgan bo'lsa:
1. Matnni olib tashla
2. Featureni tugallash siyosati bo'yicha ishlaydigan qil

---

## 7. BOG'LIQ HUJJATLAR

- [DEAD_ACTION_POLICY.md](./DEAD_ACTION_POLICY.md)
- [COMING_SOON_ELIMINATION.md](./COMING_SOON_ELIMINATION.md)
- [UX_STANDARDS.md](./UX_STANDARDS.md)
- [PRODUCT_READY_CHECKLIST.md](../01-product/PRODUCT_READY_CHECKLIST.md)

---

*Qo'shilgan: 2026-06-15 — Feature completion over elimination.*
