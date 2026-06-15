# TRUST_SYSTEM.md

## ISHBOR — TRUST SYSTEM QOIDALARI

---

## 1. MAQSAD

PLAN.md Priority 4: "Har joyda Trust Score, Reputation, Verification, Progress ko'rinishi kerak. Marketplace ishonch uyg'otishi kerak."

Bu hujjat — bu 4 elementning **har biri qayerda, qanday formatda va qanday hisoblanган holda** ko'rinishi kerakligini belgilaydi — bir xil foydalanuvchi turli joyda turlicha ko'rinmasligi uchun.

---

## 2. SCOPE

Qamrab oladi: Trust Score, Reputation, Verification badge, Progress indikatorlarining ta'rifi, hisoblash mantiqi (yuqori darajada), va ko'rinish joylari ro'yxati.

Qamrab olmaydi: dizayn/rang detallari (DESIGN_GUARDRAILS.md), review yozish/moderatsiya jarayoni (bu MARKETPLACE_RULES.md doirasida bo'lishi mumkin, agar yaratilsa).

---

## 3. TA'RIFLAR

### 3.1 Trust Score
Foydalanuvchining umumiy ishonchlilik ko'rsatkichi — bir nechta faktordan hisoblanadigan yagona raqam/daraja (masalan, 0-100 yoki "Yangi / O'rta / Yuqori / Premium" darajalari).

**Hisoblash komponentlari (yuqori darajada):**
- Yakunlangan buyurtmalar soni
- O'rtacha review bahosi (Reviews moduli)
- Verification holati (3.3-bo'lim)
- Javob berish tezligi/faollik

> **Qoida:** Aniq formula (vaznlar, raqamlar) mahsulot jamoasi tomonidan belgilanadi va shu yerga yozib qo'yiladi — lekin **qaysi modul Trust Score'ni hisoblaydi** aniq bo'lishi shart (INTEGRATION_RULES.md 3-bo'limiga ko'ra — Reviews + Auth egasi).

### 3.2 Reputation
Sifat ko'rsatkichi — asosan **Reviews modulidan** kelib chiqadi (o'rtacha bahosi, sharhlar soni). Trust Score'ning bir qismi, lekin alohida ko'rsatiladi (masalan, "4.8 ⭐ (120 sharh)").

### 3.3 Verification (Tasdiqlash)
Foydalanuvchi identifikatsiyasi/malakasi tasdiqlangan holatini ko'rsatadigan belgi(lar):
- Email tasdiqlangan
- Telefon tasdiqlangan
- Identity (shaxsni tasdiqlash) tasdiqlangan
- Skill/Portfolio tasdiqlangan (agar mavjud bo'lsa)

Har biri alohida badge sifatida ko'rinadi, lekin Trust Score'ga ham ta'sir qiladi.

### 3.4 Progress (Jarayon ko'rsatkichi)
Foydalanuvchi yoki buyurtma/loyiha holatining "qancha bosqich o'tgani"ni ko'rsatadigan vizual indikator:
- Profil to'ldirilganlik darajasi (masalan, "Profilingiz 80% to'liq")
- Buyurtma lifecycle bosqichi (masalan, "3/5 bosqich: Ish topshirildi")
- Onboarding progress

---

## 4. KO'RINISH JOYLARI MATRITSASI

| Element | Profil sahifasi | Card (list'da) | Dashboard | Buyurtma/Loyiha detali |
|---|---|---|---|---|
| Trust Score | ✅ To'liq (raqam/daraja + tushuntirish) | ✅ Qisqa (badge) | ✅ Foydalanuvchining o'zinikiga | — |
| Reputation | ✅ To'liq (bahosi + sharh soni) | ✅ Qisqa (⭐ bahosi) | ✅ | ✅ (kontragent haqida) |
| Verification | ✅ Barcha badge'lar | ✅ Asosiy badge(lar) | — | ✅ (kontragent haqida) |
| Progress | ✅ (profil to'ldirilganlik) | — | ✅ (faol buyurtmalar) | ✅ (buyurtma bosqichi) |

> **Qoida:** Agar Trust Score profil sahifasida 72 ko'rinsa, lekin shu foydalanuvchining card'ida boshqa qiymat (masalan, eski cache'dan 65) ko'rinsa — bu **Critical Trust Bug** (INTEGRATION_RULES.md Single Source of Truth buzilishi).

---

## 5. VIZUAL KONSISTENTLIK QOIDALARI

5.1. Trust Score uchun **bitta vizual format** butun loyiha bo'ylab ishlatiladi (masalan, doim 0-100 progress-ring + daraja nomi). Bir joyda foiz, boshqa joyda yulduzcha ko'rinishi — **inconsistency**.

5.2. Verification badge'lari — har biri uchun bitta belgilangan icon/rang, butun loyiha bo'ylab bir xil (PROJECT_STANDARDS.md terminologiya prinsipiga muvofiq — "bir tushuncha, bir ko'rinish").

5.3. Progress indikatorlari — foiz va vizual bar birga ko'rsatiladi (faqat foiz yoki faqat bar emas), tushunarlilik uchun.

---

## 6. "ISHONCH UYG'OTISH" — SIFAT MEZONLARI

PLAN.md'dagi "Marketplace ishonch uyg'otishi kerak" qoidasi quyidagi tekshiruvlar orqali baholanadi:

- Yangi (verification'siz, 0 buyurtma) foydalanuvchi profili — **kamsituvchi yoki bo'sh** ko'rinmaydi, balki "Yangi a'zo" kabi neytral, ammo shaffof holat ko'rsatiladi.
- Yuqori Trust Score'li foydalanuvchilar vizual jihatdan **ajralib turadi** (masalan, maxsus badge), lekin bu boshqalarni "ishonchsiz" qilib ko'rsatmaydi.
- Eskrov holati (Orders/Escrow) har doim ko'rinadigan va tushunarli — foydalanuvchi pulining qayerda ekanligini bilishi.

---

## 7. QOIDALAR (UMUMIY)

1. Trust Score, Reputation, Verification — har biri **bitta modul tomonidan hisoblanadi va boshqa modullar faqat o'qiydi** (INTEGRATION_RULES.md 3-bo'limi).
2. Yangi sahifa/komponent qo'shilganda, agar u foydalanuvchi haqida ma'lumot ko'rsatsa, 4-bo'lim matritsasiga moslab Trust/Reputation/Verification/Progress elementlari qo'shiladi (agar mos kelsa).
3. Hisoblash formulasi o'zgarganda, bu yagona joyda (egasi modulda) o'zgartiriladi — UI'ning hech qaysi qismi formulani "o'zича" qayta hisoblamaydi.

---

## 8. AUDIT MEZONLARI

- [ ] 4-bo'lim matritsasidagi har bir katakcha amalda mavjud va to'g'ri qiymatni ko'rsatadi
- [ ] Bir xil foydalanuvchi uchun Trust Score barcha joylarda bir xil qiymat
- [ ] Verification badge'lari vizual jihatdan konsistent (5.2-bo'lim)
- [ ] Progress indikatorlari foiz+bar formatida (5.3-bo'lim)
- [ ] Yangi foydalanuvchi profili 6-bo'lim sifat mezonlariga mos (kamsituvchi emas, shaffof)

---

## 9. SUCCESS CRITERIA

- 4-bo'lim matritsasi 100% amalga oshirilgan
- Trust-bog'liq ma'lumotlar bo'yicha 0 ta inconsistency (Single Source of Truth)
- PRODUCT_READY_CHECKLIST.md 4.4-bo'limiga to'liq hissa

---

## 10. QANDAY FOYDALANISH

**Insonlar uchun:**
- Yangi sahifa qo'shilganda, 4-bo'lim matritsasini ko'rib, qaysi Trust elementlari kerak ekanligini aniqlang.

**Cursor/Claude uchun:**
- "Trust audit" so'ralganda, 4-bo'lim matritsasidagi har bir katakchani amalda tekshiring — bir xil foydalanuvchi turli sahifalarda bir xil Trust Score/Reputation/Verification ko'rsatadimi.
- Topilgan nomuvofiqlikni INTEGRATION_RULES.md'dagi "Single Source of Truth" jadvaliga bog'lab, qaysi modul "to'g'ri" qiymat egasi ekanligini aniqlang va boshqa joylarni shunga moslang.
- QA_CHECKLIST.md formatida Audit→Fix→Retest→Verify bilan hisobot bering.
