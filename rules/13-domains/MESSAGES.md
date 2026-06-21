# MESSAGES — Domain Specification

## Purpose

Deal-closing communication — text, files, structured offers, escrow events in thread.

## Storage

`ishbor-messages-{userId}` — per-user partition (legacy key migration on read)

## Message types

| type | Purpose |
|------|---------|
| text | Standard chat |
| offer | Price/delivery proposal with state machine |
| escrow | System escrow status in thread |
| file | Attachment metadata |

## Offer states

`pending` → `accepted` | `declined` | `expired`  
Accept may trigger order creation via updateOfferState

## Key functions

sendMessage, receiveMessage, sendOffer, updateOfferState, fundEscrowMessage, attachFile, markConversationRead, setTyping, setOnlineStatus, searchConversations, archiveConversation, pinConversation, getTotalUnread

## Route

`/messages` — mobile empty state, typing indicator wired to input (refresh tick)

## Realtime gap

No WebSocket — see [REALTIME_FLOW_MAP.md](../12-system-maps/REALTIME_FLOW_MAP.md)

## Database (target)

`conversations`, `conversation_participants`, `messages`, `message_attachments`

## API + WS (target)

REST CRUD + WS channels `conversation:{id}` for message.new, typing, read receipts

## Security

Participant-only thread access — verify both user IDs server-side

## Related

`call-store` — call history metadata  
`response-metrics-store` — SLA tracking
