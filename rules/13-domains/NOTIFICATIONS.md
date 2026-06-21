# NOTIFICATIONS — Domain Specification

## Purpose

In-app activity feed driving re-engagement (applications, orders, messages, payments).

## Storage

`ishbor-notifications` → `Record<userId, AppNotification[]>`  
Corruption guard rejects invalid array shape

## Notification kinds

application, order, message, system, payment, review, escrow, subscription, … (NotificationKind enum)

## Key functions

addNotification, markNotificationRead, markAllNotificationsRead, getUnreadCount, dismissNotification, rehydrateFromStorage

## Triggers (synchronous today)

- createApplication → notify client
- acceptApplication → notify freelancer
- sendOffer → notify recipient
- order status changes → both parties

## Route

`/notifications` — feed with read/dismiss  
Nav badge: getUnreadCount via useSyncExternalStore

## Target architecture

NotificationWorker from outbox → DB insert → WS push to `user:{userId}`  
Email digest for critical: escrow funded, payment received

## Database

`notifications` table: id, user_id, kind, payload JSON, read_at, created_at  
Index (user_id, read_at, created_at DESC)

## Scalability

100k users × 20 notifications avg = 2M rows — TTL archive after 90 days

## API

GET /notifications?page=, PATCH /notifications/:id/read, POST /notifications/read-all

See [NOTIFICATION_ARCHITECTURE.md](../11-backend/NOTIFICATION_ARCHITECTURE.md)
