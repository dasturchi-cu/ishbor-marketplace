# CRM — Domain Specification

## Purpose

Relationship management for repeat hiring — client tracks freelancers, freelancer tracks clients.

## Implementation

**Computed store (no localStorage)** — `crm-store.ts`

| Function | Audience | Data sources |
|----------|----------|--------------|
| getClientCrmData | Client | orders, saved, messages, reviews |
| getFreelancerCrmData | Freelancer | orders, applications, messages |

## Routes

- `/clients/manage` — client CRM (requireRole client)
- `/freelancers/manage` — freelancer CRM
- `/agency/clients` — agency CRM (agency-metrics-store)

## CRM entity shape (derived)

Contacts with: name, lastOrder, totalSpend/earn, status, tags, conversation link

## Business value

Retention — repeat clients = lower CAC, higher LTV

## Database (target)

`crm_contacts`, `crm_notes`, `crm_tags` — or derive from orders aggregate views

## API

GET /api/v1/crm/contacts?role=client|freelancer

## Analytics

Repeat client rate in reputation-store (repeatClients field on Freelancer mock)

## Edge cases

Empty CRM → EmptyState with CTA to browse marketplace
