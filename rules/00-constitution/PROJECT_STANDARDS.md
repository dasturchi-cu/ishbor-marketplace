# PROJECT_STANDARDS.md

## ISHBOR — MARKAZIY STANDARTLAR HUJJATI (SINGLE SOURCE OF TRUTH)

---

## 1. MAQSAD

Bu hujjat Ishbor loyihasidagi **barcha boshqa `.md` hujjatlar uchun ota-hujjat** hisoblanadi. Boshqa hujjatlarda (UX_STANDARDS, INTEGRATION_RULES, QA_CHECKLIST va h.k.) takrorlanadigan umumiy qoidalar — terminologiya, fayl strukturasi, naming convention, rol ta'riflari, umumiy texnik standartlar — shu yerda **bir marta** belgilanadi va boshqa hujjatlar shu yerga havola qiladi.

Agar biror qoida ikki hujjatda ham yozilishi kerak bo'lsa, u bu hujjatga ko'chiriladi va boshqalari unga link beradi. **Hech qachon bir xil qoida ikki joyda mustaqil yozilmasin** — bu zid qoidalarga olib keladi.

---

## 2. SCOPE

Bu hujjat quyidagilarni qamrab oladi:

- Loyihaning rasmiy moduli ro'yxati va ularning ta'riflari
- Foydalanuvchi rollari (Client, Freelancer, Agency, Admin) — rasmiy ta'riflar
- Fayl va papka nomlash konvensiyalari
- Komponent, state, va API naming standartlari
- Terminologiya lug'ati (bir tushuncha — bir nom, hamma joyda)
- Boshqa barcha governance hujjatlariga umumiy yo'l-yo'riq (qaysi hujjat nimani qamrab oladi)

Bu hujjat **qamrab olmaydi**: UX detallari, mobile breakpoints, security siyosati, QA jarayoni — bularning har biri o'z alohida hujjatida.

---

## 3. RASMIY MODUL RO'YXATI

PLAN.md asosida tasdiqlangan modullar (yangi modul qo'shilishi PRODUCT_RULES.md'dagi "No Feature Mode" shartlariga bog'liq):

| Modul | Qisqacha tavsif |
|---|---|
| Auth | Ro'yxatdan o'tish, login, sessiya, rol tanlash |
| Client | Mijoz dashboardi, buyurtma berish oqimi |
| Freelancer | Freelancer dashboardi, ish topish oqimi |
| Agency | Agentlik boshqaruvi, jamoa a'zolari |
| Admin | Platforma boshqaruvi, moderatsiya |
| Portfolio | Ish namunalari ko'rgazmasi |
| Services | Freelancer/Agency tomonidan taklif qilinadigan xizmatlar |
| Projects | Client tomonidan e'lon qilingan loyihalar |
| Proposals | Freelancer/Agency tomonidan loyihaga taklif |
| Orders | Tasdiqlangan ishlar, buyurtma lifecycle |
| Escrow | To'lovni ushlab turish va chiqarish tizimi |
| Reviews | Baholash va sharhlar |
| CRM | Mijozlar/loyihalar bilan munosabatlarni boshqarish |
| Analytics | Statistika va hisobotlar |
| AI Tools | AI-asoslangan yordamchi funksiyalar |
| Monetization | Pullik funksiyalar, komissiyalar |
| Agency System | Agentlik-specific ish oqimlari |
| Notifications | Bildirishnomalar tizimi |
| Wallet | Balans, to'lovlar, tranzaksiyalar |
| Subscription | Obuna rejalari |

> **Qoida:** Har qanday yangi modul yoki sub-modul qo'shishdan oldin shu jadval yangilanishi shart. Yangilanmagan modul "rasmiy emas" hisoblanadi va u haqida hech qaysi audit/fix ishi PRODUCT_READY_CHECKLIST.md'da hisobga olinmaydi.

---

## 4. FOYDALANUVCHI ROLLARI — RASMIY TA'RIFLAR

Har bir rol uchun aniq ta'rif beriladi. Bu ta'riflar **ROLE_CONSISTENCY.md**da chuqurroq tekshiriladi, lekin asosiy ta'rif shu yerda:

- **Client** — xizmat/loyiha buyurtma beruvchi foydalanuvchi. Asosiy maqsadi: mos freelancer/agency topish, loyiha boshqarish, to'lov qilish.
- **Freelancer** — yakka tartibdagi xizmat ko'rsatuvchi. Asosiy maqsadi: mos loyiha/buyurtma topish, portfolio ko'rsatish, daromad olish.
- **Agency** — bir nechta freelancer/jamoa a'zosini boshqaradigan tashkilot hisobi. Freelancer imkoniyatlari + jamoa boshqaruvi.
- **Admin** — platforma operatorlari. Moderatsiya, monitoring, disputlarni hal qilish.

> **Qoida:** Bir foydalanuvchi bir vaqtning o'zida bir nechta rolga ega bo'lishi mumkin (masalan, Client + Freelancer). Bu holat **ROLE_CONSISTENCY.md**da batafsil yoritiladi — bu yerda faqat ta'rif beriladi, switch logikasi emas.

---

## 5. NAMING CONVENTIONS

### 5.1 Fayl va papka nomlari
- Komponent fayllari: `PascalCase.tsx` (masalan, `ProjectCard.tsx`)
- Util/helper fayllari: `camelCase.ts`
- Hujjat fayllari (governance): `SCREAMING_SNAKE_CASE.md`

### 5.2 State va o'zgaruvchilar
- Global state kalitlari modul nomi bilan prefikslanadi: `wallet.balance`, `crm.activeDeals`, `auth.currentRole`
- Bitta tushuncha uchun bitta nom ishlatiladi butun loyiha bo'ylab (masalan, "loyiha" doim `project`, hech qachon `job` yoki `task` bilan aralashtirilmaydi)

### 5.3 Terminologiya lug'ati (bir tushuncha — bir nom)

| Tushuncha | Rasmiy atama (UZ) | Rasmiy atama (kod/EN) | Ishlatilmaydigan sinonimlar |
|---|---|---|---|
| Mijoz e'lon qilgan ish | Loyiha | `project` | job, task, gig |
| Freelancer taklifi | Taklif | `proposal` | bid, application (faqat Proposals modulida) |
| Tasdiqlangan ish | Buyurtma | `order` | contract, deal |
| Pul ushlab turish | Eskrov | `escrow` | hold, frozen funds |
| Ishonch ko'rsatkichi | Trust Score | `trustScore` | rating (rating — bu Reviews'dagi alohida tushuncha) |

> **Qoida:** Yangi atama qo'shilsa, shu jadvalga qo'shiladi. Bir xil tushunchaga ikki nom berilgan joy topilsa, bu **Critical bug** sifatida QA_CHECKLIST.md orqali hisobga olinadi.

---

## 6. HUJJATLAR XARITASI (qaysi savolga qaysi hujjatga qarash kerak)

| Savol | Qarang |
|---|---|
| Modullar bir-biri bilan qanday ishlashi kerak? | INTEGRATION_RULES.md |
| Rollar orasidagi farqlar, permission'lar | ROLE_CONSISTENCY.md |
| Sahifa UX qanday bo'lishi kerak (action hierarchy, 5-soniya qoidasi) | UX_STANDARDS.md |
| Vizual dizayn qoidalari (rang, tugma stillari, spacing, komponentlar) | DESIGN_GUARDRAILS.md |
| Mobile ekranlarda qanday ko'rinishi kerak? | MOBILE_STANDARDS.md |
| Tugma/action qachon "dead" hisoblanadi? | DEAD_ACTION_POLICY.md |
| Trust/Reputation/Verification qayerda ko'rinishi kerak? | TRUST_SYSTEM.md |
| Onboarding va personalization qanday ishlashi kerak? | PERSONALIZATION_RULES.md |
| Yangi feature qo'shish mumkinmi? | PRODUCT_RULES.md |
| Performance qanday tekshiriladi? | PERFORMANCE_STANDARDS.md |
| Audit qanday o'tkaziladi va nima tekshiriladi? | QA_CHECKLIST.md |
| Release oldidan nima tekshirilishi kerak? | PRODUCT_READY_CHECKLIST.md |

---

## 7. QOIDALAR (UMUMIY)

1. Har qanday yangi `.md` governance hujjati yaratilsa, u shu hujjatning 6-bo'limidagi xaritaga qo'shilishi shart.
2. Hech qaysi hujjat boshqa hujjatda allaqachon yozilgan qoidani takrorlamaydi — faqat havola qiladi.
3. Agar ikki hujjat orasida ziddiyat topilsa, **PROJECT_STANDARDS.md ustun** hisoblanadi va ziddiyat shu hujjatni yangilash orqali hal qilinadi.
4. Har bir governance hujjat o'zining "Audit mezonlari" bo'limiga ega bo'lishi shart — Cursor/Claude shu mezonlarni avtomatik tekshirish uchun ishlatadi.

---

## 8. CHECKLIST (PROJECT_STANDARDS bo'yicha)

- [ ] Barcha modullar 3-bo'limdagi jadvalda ro'yxatga olingan
- [ ] Barcha rollar 4-bo'limdagi ta'riflarga mos
- [ ] Terminologiya lug'atidagi atamalar kod va UI matnida bir xil ishlatilgan
- [ ] Yangi qo'shilgan har qanday governance hujjat 6-bo'limga qo'shilgan
- [ ] Boshqa hujjatlarda PROJECT_STANDARDS bilan ziddiyat yo'q

---

## 9. AUDIT MEZONLARI

Auditor (inson yoki Claude/Cursor) quyidagilarni tekshiradi:

- Kod bazasidagi modul nomlari 3-bo'limdagi rasmiy ro'yxatga mosligini
- UI matnlarida terminologiya lug'atidan chetga chiqish yo'qligini (masalan, bir joyda "loyiha", boshqa joyda "ish" deyilmasligi)
- Yangi qo'shilgan komponent/fayl nomlari 5-bo'limdagi konvensiyalarga mosligini

**Audit natijasi**: Har qanday chetga chiqish topilsa, u **Consistency Bug** sifatida belgilanadi va QA_CHECKLIST.md'dagi Audit→Fix→Retest→Verify siklidan o'tadi.

---

## 10. SUCCESS CRITERIA

- 100% modul nomlari va terminologiya butun kod bazasi va UI bo'ylab bir xil
- Yangi ishlaydigan har bir hujjat ushbu hujjatga havola qiladi, hech qanday qoida takrorlanmaydi
- Yangi developer (yoki Cursor/Claude) faqat shu hujjatni o'qib, loyihaning "tili"ni tushunishi mumkin

---

## 11. QANDAY FOYDALANISH

**Insonlar uchun:**
- Yangi modul, rol yoki atama qo'shishdan oldin shu hujjatni yangilang.
- Boshqa governance hujjat yozayotganda, avval shu yerda mavjud ta'rif/qoida bormi tekshiring — bo'lsa, takrorlamang, havola qiling.

**Cursor/Claude uchun (avtomatik audit kontekstida):**
- Har qanday audit boshlanishidan oldin shu hujjatni o'qing — bu loyihaning "lug'ati" va "xaritasi".
- Agar kod yoki boshqa hujjatda shu yerdagi ta'riflarga zid narsa topilsangiz, buni Consistency Bug deb belgilang va PROJECT_STANDARDS.md'ni "haqiqat manbai" sifatida ishlatib tuzating.
- Yangi `.md` hujjat yaratishdan oldin, 6-bo'limdagi xaritani tekshirib, bu mavzu allaqachon qamrab olinganmi yoki yo'qligini aniqlang.
