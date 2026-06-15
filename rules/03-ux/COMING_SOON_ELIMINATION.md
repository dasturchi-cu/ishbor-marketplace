# COMING_SOON_ELIMINATION.md

## ISHBOR — "TEZ ORADA" MATNLARINI YO'Q QILISH

---

## 1. MAQSAD

Foydalanuvchi platformada **tayyor mahsulot** hissini olishi kerak — "ishlab chiqilmoqda" yoki "tez orada" degan matnlar bilan emas.

**Bu hujjat faqat matn va yorliqlarga tegishli.** Featurelarni yashirish yoki olib tashlash uchun [FEATURE_COMPLETION_POLICY.md](./FEATURE_COMPLETION_POLICY.md) ga qarang.

---

## 2. ASOSIY QOIDA

```
VISIBLE FEATURE = WORKING FEATURE
```

Feature ko'rinadi → ishlashi shart. Ishlamasa → **tugat** (yashir emas), agar tugatib bo'lmasa → kirish nuqtasini olib tashla.

Batafsil: [FEATURE_COMPLETION_POLICY.md](./FEATURE_COMPLETION_POLICY.md)

---

## 3. QIDIRUV KALIT SO'ZLARI

Auditda quyidagilar qidiriladi (UI, empty state, tooltip, admin, agency, settings, analytics, CRM, AI, wallet, subscription, messages, notifications, marketplace):

| Kalit so'z | O'zbek / Ingliz |
|------------|-----------------|
| Coming Soon | Tez orada |
| Planned | Kelajakda |
| Future feature | Yaqinda qo'shiladi |
| Beta | Hali ishlab chiqilmoqda |
| Under construction | Demo only (UI matni) |
| In progress | Placeholder (UI matni) |
| Not implemented | TODO / FIXME (foydalanuvchiga ko'rinadigan) |
| Demo | Sinov rejimi (UI matnida) |

**Istisno:** HTML `placeholder` atributlari (forma input) — bu UX, eliminatsiya qamroviga kirmaydi.

---

## 4. QOIDALAR

| Holat | Harakat |
|-------|---------|
| "Tez orada" matni + feature ko'rinadi | Matnni olib tashla, featureni tugat |
| Feature ko'rinadi | Ishlashi shart ([FEATURE_COMPLETION_POLICY](./FEATURE_COMPLETION_POLICY.md)) |
| Tugma ishlamaydi (dead) | Olib tashlash yoki tugatish |
| Route butunlay buzilgan | Kirish nuqtasini olib tashlash |
| Bo'lim qiymat bermaydi va tugatib bo'lmaydi | Yashirish |

### Foydalanuvchi ko'rmasligi kerak:

- "Coming Soon" / "Tez orada" / "Yaqinda qo'shiladi"
- "Hali ishlab chiqilmoqda" / "Kelajakda"
- "Beta" / "Demo" (UI matnida; tezkor kirish hisoblari bundan mustasno)

---

## 5. FAQAT OLIB TASHLASH

[FEATURE_COMPLETION_POLICY.md](./FEATURE_COMPLETION_POLICY.md) bo'yicha faqat:

- Dead buttons
- Broken routes
- Duplicate actions
- Unused components

**Feature sonini kamaytirish maqsad emas.**

---

## 6. AUDIT SIKLI

```
Audit → Complete (yoki Fix) → Retest → Verify → Takrorlash
```

**Muvaffaqiyat mezonlari:**

- 0 "coming soon" matni (foydalanuvchiga ko'rinadigan)
- 0 dead button
- 0 tugallanmagan ko'rinadigan feature (ishlaydigan yoki yo'q)
- 0 o'lik workflow

---

## 7. BOG'LIQ HUJJATLAR

- [FEATURE_COMPLETION_POLICY.md](./FEATURE_COMPLETION_POLICY.md) — feature tugallash
- [DEAD_ACTION_POLICY.md](./DEAD_ACTION_POLICY.md) — o'lik tugmalar
- [UX_STANDARDS.md](./UX_STANDARDS.md) — empty state va CTA
- [PRODUCT_READY_CHECKLIST.md](../01-product/PRODUCT_READY_CHECKLIST.md) — release gate
- [AUDIT_PLAYBOOK.md](../06-quality/AUDIT_PLAYBOOK.md) — audit tartibi

---

*Yangilangan: 2026-06-15 — Completion over elimination.*
