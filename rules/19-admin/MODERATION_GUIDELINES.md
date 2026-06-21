# MODERATION_GUIDELINES.md

**Scope:** Content moderation policy for Ishbor marketplace — projects, services, portfolios, reviews, messages  
**Routes:** `/admin/moderation`, `/admin/projects`, `/admin/services`, `/admin/portfolios`  
**Language:** Reject reasons delivered to users in **Uzbek**  
**Related:** [04-trust/TRUST_SYSTEM.md](../04-trust/TRUST_SYSTEM.md), [PROJECT_BIBLE.md](../00-constitution/PROJECT_BIBLE.md)

---

## 1. Moderation principles

| Principle | Rule |
|-----------|------|
| Complete features | Reject with actionable reason — no vague "not allowed" |
| No dead ends | User always gets path to fix and resubmit |
| Consistency | Same violation → same reason code |
| Speed | First review within 24h of submission |
| Audit | Every reject → `addAuditEntry` category `moderation` |
| Notify | `notifyAdminAction` or content-specific notification with reason |

Ishbor is Uzbek-first marketplace for professional freelance work — moderation protects trust, not censorship of legitimate business content.

---

## 2. Content in scope

| Entity | Admin route | Approve effect | Reject effect |
|--------|-------------|----------------|---------------|
| Client project | `/admin/projects` | `published` | `closed` |
| Freelancer service | `/admin/services` | `published` | `paused` |
| Portfolio item | `/admin/portfolios` | public profile | hidden |
| Moderation queue item | `/admin/moderation` | varies by type | removed/warn |
| Review (flagged) | moderation queue | visible | hidden + warn |
| Profile bio/avatar | moderation queue | — | reset + warn |

---

## 3. Prohibited content (auto-reject)

| Category | Description | Reason code |
|----------|-------------|-------------|
| ILLEGAL | Uzbekistan law violations — drugs, weapons, gambling | `REJ-ILLEGAL` |
| ADULT | Pornography, explicit sexual services | `REJ-ADULT` |
| SCAM | Fake credentials, impossible guarantees, phishing links | `REJ-SCAM` |
| HATE | Discrimination, violence incitement | `REJ-HATE` |
| SPAM | Duplicate listings, keyword stuffing, external contact only | `REJ-SPAM` |
| OFF_PLATFORM | "Telegram orqali to'lang", bypassing Ishbor escrow | `REJ-OFFPLATFORM` |
| IMPERSONATION | Fake identity, stolen portfolio | `REJ-IMPERSON` |
| MALWARE | Malicious file links | `REJ-MALWARE` |

Repeated `REJ-SCAM` or `REJ-OFFPLATFORM` → escalate to user suspend (USER_BAN_SYSTEM).

---

## 4. Quality rejects (fixable)

| Category | When to use | Reason code |
|----------|-------------|-------------|
| INCOMPLETE | Missing budget, timeline, deliverables | `REJ-INCOMPLETE` |
| LOW_QUALITY | Unreadable description, placeholder text | `REJ-QUALITY` |
| WRONG_CATEGORY | Service in wrong category | `REJ-CATEGORY` |
| COPYRIGHT | Suspected stolen work — need proof | `REJ-COPYRIGHT` |
| CONTACT_LEAK | Phone/email in public description | `REJ-CONTACT` |
| PRICING_ABUSE | $1 bait listings | `REJ-PRICING` |
| LANGUAGE | Not Uzbek/Russian/English — no translation | `REJ-LANGUAGE` |

User may edit and resubmit — status returns to pending review.

---

## 5. Uzbek reject reason templates

Use these exact strings in admin UI `reason` field and user notifications:

### REJ-ILLEGAL
```
Kontent qonun hujjatlariga zid. E'lon qabul qilinmadi. Savollar: support@ishbor.uz
```

### REJ-ADULT
```
Noqonuniy yoki noo'rin kontent aniqlandi. E'lon rad etildi.
```

### REJ-SCAM
```
Aldov yoki chalg'ituvchi ma'lumotlar aniqlandi. E'lon rad etildi. Takroriy holatda hisob to'xtatilishi mumkin.
```

### REJ-HATE
```
Nafret so'zlari yoki kamsitish aniqlandi. E'lon rad etildi.
```

### REJ-SPAM
```
Takroriy yoki spam e'lon. Iltimos, bitta aniq e'lon yarating.
```

### REJ-OFFPLATFORM
```
Ishbor eskrou tizimidan chetlab to'lov talab qilinmasligi kerak. E'lon rad etildi.
```

### REJ-IMPERSON
```
Shaxs yoki portfolio haqiqiyligi tasdiqlanmadi. Hujjatlarni /settings/verification ga yuklang.
```

### REJ-INCOMPLETE
```
E'lon yetarli darajada to'liq emas. Byudjet, muddat va natija tavsifini qo'shing.
```

### REJ-QUALITY
```
Tavsif sifat talabiga javob bermaydi. Iltimos, batafsil va professional yozing.
```

### REJ-CATEGORY
```
Noto'g'ri kategoriya tanlangan. Mos kategoriyani tanlab qayta yuboring.
```

### REJ-COPYRIGHT
```
Mualliflik huquqi shubhasi. Asl ishingiz ekanligini tasdiqlovchi ma'lumot qo'shing.
```

### REJ-CONTACT
```
Aloqa ma'lumotlari (telefon, email) ochiq matnda taqiqlangan. Ishbor xabarlar orqali bog'laning.
```

### REJ-PRICING
```
Narx noto'g'ri yoki chalg'ituvchi. Haqiqiy narx ko'rsating.
```

### REJ-LANGUAGE
```
Tavsif tushunarli tilde emas. O'zbek, rus yoki ingliz tilida yozing.
```

---

## 6. Approval checklist

Before **Tasdiqlash**:

- [ ] Title accurate and professional
- [ ] Description matches category
- [ ] Budget/price reasonable for market
- [ ] No contact info in public fields
- [ ] Images portfolio — no watermarked stolen work
- [ ] No off-platform payment language
- [ ] Uzbek primary language OK

Portfolio approve → trigger `notifyPortfolioApproved`.

---

## 7. Moderation queue workflow

```
/admin/moderation
  → filter status=pending
  → open item preview
  → approve OR reject with reason code + custom note
  → updateModerationItem(id, { status, reasonCode, reasonUz })
  → addAuditEntry
  → notify user
```

**History:** Store reviewer name + timestamp on item (production: `moderation_reviews` table).

---

## 8. Escalation to user sanctions

| Violation count | Action |
|-----------------|--------|
| 1st off-platform | Reject + warning notification |
| 2nd off-platform | 7-day suspend |
| 3rd | Ban review |
| 1st scam confirm | Immediate suspend |
| Copyright DMCA | Remove + ban if repeat |

Coordinate with `/admin/users` — see USER_BAN_SYSTEM.md.

---

## 9. Appeals

User appeals via `/support` ticket tagged `moderation-appeal`:

1. Support reviews within 48h
2. Original reviewer or senior moderator decides
3. Overturn → republish + audit note
4. Uphold → send template with reason

No public "appeal" button P0 — support ticket only.

---

## 10. Special cases

### Agencies
Agency listings must show agency name consistently. Reject if individual freelancer misrepresents agency capacity.

### Featured listings
Featured purchase does **not** bypass moderation — featured item still must be approved content.

### AI-generated spam
Bulk AI proposals/listings → `REJ-SPAM` + user flag for fraud review.

---

## 11. FastAPI moderation API (production)

```
GET  /api/v1/admin/moderation?status=pending
POST /api/v1/admin/moderation/{id}/approve
POST /api/v1/admin/moderation/{id}/reject  { reason_code, reason_uz }
POST /api/v1/admin/projects/{slug}/approve
POST /api/v1/admin/services/{slug}/reject
```

RBAC: `moderator` role minimum. Audit log mandatory — 409 if missing reason on reject.

---

## 12. Metrics

Track weekly:
- Median time to first review
- Reject rate by reason code
- Resubmit success rate
- Appeals overturn rate

Target: <24h median review, <15% reject rate for established users.

---

*Moderation keeps Ishbor trustworthy — clear Uzbek reasons, consistent codes, and escalation paths when content crosses from quality issue to safety violation.*
