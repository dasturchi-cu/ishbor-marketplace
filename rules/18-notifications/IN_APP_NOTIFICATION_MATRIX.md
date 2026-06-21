# IN_APP_NOTIFICATION_MATRIX.md

**Scope:** In-app notification feed — `notifications-store` kinds mapped to domain triggers  
**Route:** `/notifications` · Nav badge via `getUnreadCount()`  
**Storage demo:** `ishbor-notifications` → `Record<userId, AppNotification[]>`  
**Production:** PostgreSQL `notifications` table + WebSocket `notification.new`  
**Domain:** [13-domains/NOTIFICATIONS.md](../13-domains/NOTIFICATIONS.md)

---

## 1. AppNotification shape

```typescript
type NotificationKind =
  | "payment" | "proposal" | "review" | "system"
  | "message" | "escrow" | "order" | "portfolio" | "admin";

type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;       // Uzbek
  body: string;        // Uzbek
  time: string;
  read: boolean;
  priority: "low" | "normal" | "high";
  href?: string;
  userId?: string;
};
```

Cap: 100 notifications per user in demo (`addNotification` slice); 500 in production with 90-day archive.

---

## 2. Store functions

| Function | Effect |
|----------|--------|
| `addNotification(input)` | Prepend to user feed, notify subscribers |
| `markNotificationRead(id)` | Set read=true |
| `markAllNotificationsRead()` | Bulk read |
| `getUnreadCount()` | Filter !read.length |
| `dismissNotification(id)` | Remove from feed |
| `rehydrateFromStorage()` | Refresh subscribers after external write |

Helper layer: `notification-events.ts` → `notifyUser()`, typed wrappers.

---

## 3. Kind: `proposal`

| Trigger | Source | title | body pattern | href | priority |
|---------|--------|-------|--------------|------|----------|
| Application submitted | `applications-store` → `notifyProposalReceived` | Yangi taklif olindi | "{projectTitle}" loyihangiz uchun yangi taklif keldi. | /projects/{slug} | high |
| Application accepted | `notifyProposalAccepted` | Taklif qabul qilindi | "{projectTitle}" taklifingiz qabul qilindi. Buyurtma yaratildi. | /orders/{id} | high |
| Job alert match | `alerts-store` | Yangi mos loyiha / xizmat | "{title}" — ko'nikmalaringizga mos. | listing href | high |
| Project matches (AI) | `ai-smart-notifications.ts` | Mos loyihalar topildi | Sizga mos {n} ta loyiha topildi. | /projects | high |

**Recipient:** Project owner for received; freelancer for accepted; alert subscriber for matches.

---

## 4. Kind: `order`

| Trigger | Source | title | body | href | priority |
|---------|--------|-------|------|------|----------|
| Order created | `notifyOrderCreated`, `orders-store`, `applications-store` | Buyurtma yaratildi | "{orderTitle}" buyurtmasi yaratildi. | /orders/{id} | high |
| Checkout confirmed | `checkout.tsx` | Buyurtma tasdiqlandi | Buyurtmangiz "{orderTitle}" endi faol. | /orders/{id} | high |

---

## 5. Kind: `escrow`

| Trigger | Source | title | body | href | priority |
|---------|--------|-------|------|------|----------|
| Escrow funded | `notifyEscrowFunded`, `checkout.tsx` | Eskrou moliyalashtirildi | ${amount} eskrouda — {orderTitle}. | /escrow/{id} | high |
| Client released milestone | `escrow.$id.tsx` | To'lov chiqarildi | ${amount} {milestone} uchun chiqarildi | /escrow/{id} | normal |
| Escrow released (helper) | `notifyEscrowReleased` | Eskrou mablag'i chiqarildi | ${amount} "{project}" uchun chiqarildi. | /escrow/{id} | high |
| Dispute opened | `escrow-store` / route | (dynamic) | Nizo ochildi — {orderTitle} | /escrow/{id} | high |

---

## 6. Kind: `payment`

| Trigger | Source | title | body | href | priority |
|---------|--------|-------|------|------|----------|
| Milestone payout received | `escrow.$id.tsx` | Bosqich to'lovi qabul qilindi | {project} loyihasidan ${amount} | /wallet | high |
| Deposit success | `wallet-store` (future API) | Hamyon to'ldirildi | ${amount} qo'shildi | /wallet | high |
| Withdrawal pending | `withdrawFunds()` | Yechib olish so'rovi | ${amount} ko'rib chiqilmoqda | /wallet | normal |
| Withdrawal failed | admin/API | Yechib olish rad etildi | Sabab: {reason} | /wallet | high |

Wallet tx kinds map here — `WalletTransaction` UI is separate from notification feed but linked via href `/wallet`.

---

## 7. Kind: `message`

| Trigger | Source | title | body | href | priority |
|---------|--------|-------|------|------|----------|
| Message sent (offline recipient) | `messages.tsx` | Yangi xabar | {sender}: {preview} | /messages | normal |

Only when recipient not in active thread (future: WS presence). Demo fires on send unconditionally.

---

## 8. Kind: `review`

| Trigger | Source | title | body | href | priority |
|---------|--------|-------|------|------|----------|
| Review submitted | `notifyReviewReceived`, `review-form.tsx` | Yangi sharh olindi | "{project}" uchun {rating} yulduzli sharh. | /profile | normal |

---

## 9. Kind: `portfolio`

| Trigger | Source | title | body | href | priority |
|---------|--------|-------|------|------|----------|
| Portfolio approved | `notifyPortfolioApproved`, `portfolio-store` | Portfolio tasdiqlandi | "{title}" portfoliongiz e'lon qilindi. | /portfolio/{slug} | normal |

---

## 10. Kind: `system`

| Trigger | Source | title | body | href | priority |
|---------|--------|-------|------|------|----------|
| Project closed | `notifyProjectClosed` | Loyiha yopildi | "{projectTitle}" loyihasi yopildi. | /my-projects | normal |
| Subscription activated | `subscription-store` | {planName} rejasi faollashdi | Plan details | /subscription | high |
| Subscription cancelled | `subscription-store` | Obuna bekor qilindi | — | /subscription | normal |
| Featured listing | `featured-store` | Ajratilgan ro'yxat faollashdi | "{title}" {n} kun ko'rsatiladi. | listing href | normal |
| Referral credited | `referral-store` | Referral mukofoti | +{amount} UZS kredit qo'shildi. | /settings | high |
| Referral welcome | `referral-store` | Xush kelibsiz bonus | Referral orqali qo'shildingiz. | /dashboard/freelancer | normal |
| Saved search match | `alerts-store` | Saqlangan qidiruv: yangi natija | "{title}" qidiruvingizga mos. | listing href | normal |
| Profile 80% complete | `ai-smart-notifications.ts` | Profil deyarli tayyor | Profilingiz {n}% tayyor. | /settings | normal |
| Low opportunity score | `ai-smart-notifications.ts` | Imkoniyat balli past | Ball: {n}/100 | /ai/trust-coach | normal |
| Stale order reminder | `ai-smart-notifications.ts` | (generated) | 7 kun faolsiz buyurtma | /orders/{id} | normal |
| Agency invite / member | `agency-store` | (dynamic) | Agency team events | /agencies | normal |

---

## 11. Kind: `admin`

| Trigger | Source | title | body | href | priority |
|---------|--------|-------|------|------|----------|
| Generic admin action | `notifyAdminAction()` | (admin provided) | (admin provided) | /support or custom | high |
| Verification approved | admin.verifications flow | Tasdiqlash tasdiqlandi | Endi to'liq imkoniyatlar ochiq. | /settings | high |
| Verification rejected | admin.verifications | Tasdiqlash rad etildi | {reason} | /settings/verification | high |
| Account suspended | `suspendAdminUser` | Hisob to'xtatildi | Vaqtincha to'xtatildi. Support bilan bog'laning. | /support | high |
| Account banned | `banAdminUser` | Hisob bloklandi | support@ishbor.uz | /support | high |
| Moderation rejection | moderation flow | Kontent rad etildi | {reason uz} | content edit href | high |
| Dispute resolution | disputes admin | Nizo hal qilindi | {summary} | /escrow/{id} | high |

Always `priority: high` — user must see enforcement actions.

---

## 12. Synchronous demo vs async production

| Demo (today) | Production |
|--------------|------------|
| Store calls `addNotification` inline | Domain event → outbox |
| Same-tab immediate badge update | WS + poll fallback |
| localStorage per user | PostgreSQL INSERT |
| No preference check | `notification_preferences.inApp` |

Migration: grep all `addNotification(` — replace with event emit list in NOTIFICATION_ARCHITECTURE.md § migration.

---

## 13. UI behavior (`/notifications`)

- Sort: newest first (prepend on add)
- Unread: bold title + blue dot
- Click: `markNotificationRead` + navigate `href`
- Dismiss swipe/button: `dismissNotification`
- Empty state: "Hozircha bildirishnomalar yo'q"
- Filter tabs (future): Hammasi | To'lov | Buyurtma | Tizim

Nav badge: hidden at 0; cap display `99+`.

---

## 14. WebSocket sync

On `notification.new`:

```json
{
  "type": "notification.new",
  "payload": {
    "notification": { "...AppNotification" },
    "unreadCount": 5
  }
}
```

Client inserts at head of feed if not duplicate `id`.

---

## 15. Corruption guard

Production API validates array shape on read — mirrors demo `corruption guard rejects invalid array shape` from domain spec. Malformed → reset to `[]` + log incident.

---

## 16. Testing matrix (QA)

For each row in sections 3–11:

- [ ] Trigger fires notification for correct `userId` only
- [ ] `kind` matches tab filter
- [ ] `href` navigates to live route (ROUTE_REGISTRY)
- [ ] Unread count increments/decrements
- [ ] markAll clears badge
- [ ] 100+ items paginate (Phase 28 pattern)

---

*The in-app feed is Ishbor's primary notification surface — nine kinds, every marketplace trigger documented, Uzbek copy from `notification-events.ts` and inline store calls.*
