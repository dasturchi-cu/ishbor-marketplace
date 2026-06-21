# SEARCH — Domain Specification

## Purpose

Discovery across services, freelancers, and projects — conversion driver.

## Implementation

### Unified search page
`/search` — tabs: Hammasi | Xizmatlar | Mutaxassislar | Loyihalar  
Uses `filterServices`, `filterFreelancers`, `filterProjects` from marketplace.ts

### Hero / nav search
Nav `goSearch` → `/search?q=` (unified)  
Landing hero → pickSearchRoute keyword routing (legacy keyword heuristics)

### Sort options
`SortOption`: newest, rating, popular, price_asc/desc, trust_score, success_score, response_rate, ranking_score

### Data sources
- Services: getAllServices() + user-created
- Freelancers: mock-data freelancers array (8 seed)
- Projects: getPublishedProjects()

## Validations

normalizeSearch sanitizes q, category, sort, filter params  
head() meta tags — defensive against undefined search during SSR

## Target production

POST /api/v1/search with PostgreSQL FTS + ranking weights  
Redis cache popular queries  
Separate indexes per entity type

## Analytics

recordAnalyticsEvent type `search` with query metadata

## Scalability

100k documents: GIN tsvector, query timeout 500ms, pagination cursor-based

## Edge cases

Empty query → EmptyState prompt  
Zero results → link to /projects  
Mobile 375px — verified in Playwright audit

File: `src/routes/search.tsx`, `src/lib/marketplace.ts`
