# MODERATION_DISPUTES — Domain Specification

## Purpose

Content safety and conflict resolution — legal requirement for real-money marketplace.

## Moderation

**Route:** `/admin/moderation`  
**Entity:** ModerationItem in admin-data-store  
**Actions:** updateModerationItem — approve/reject/flag content

**Synced entities:** projects, services, portfolios via admin project/service mod queues

## Disputes

**Route:** `/admin/disputes`  
**Trigger:** openEscrowDispute in escrow-store → workflow status disputed  
**Entity:** Dispute in admin-data-store — parties, reason, status, resolution

**Admin resolution paths:**
- adminReleaseEscrow — favor freelancer
- adminRefundEscrow — favor client
- updateDispute with resolution notes

## Trust SLA

TRUST_SYSTEM.md: 24-hour admin response target on disputes

## Database (target)

`moderation_queue`, `disputes`, `dispute_messages`, `dispute_evidence`  
State: opened → under_review → resolved → closed

## Notifications

Both parties notified on dispute open and resolution

## Legal

Terms (/terms) reference dispute process — Uzbek copy LIVE

## Edge cases

- Dispute while milestone partially released — partial refund logic
- Repeat disputants — flag user trust score

See [TRUST_SYSTEM.md](../04-trust/TRUST_SYSTEM.md)
