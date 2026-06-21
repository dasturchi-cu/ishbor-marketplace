# CDN_STRATEGY.md

**Ishbor marketplace — static assets, MinIO public bucket, Cloudflare**  
**Goal:** Sub-200ms asset delivery to Uzbekistan mobile users

---

## 1. What gets CDN-cached

### Tier 1 — Always CDN (immutable)

| Asset type | Source | Cache-Control |
|------------|--------|---------------|
| JS bundles | Nitro `.output/public/assets/*` | `max-age=31536000, immutable` |
| CSS bundles | Same | `max-age=31536000, immutable` |
| Fonts (woff2) | `/assets/fonts/` | `max-age=31536000, immutable` |
| Favicon, manifest | `/public/` | `max-age=86400` |
| Logo, brand SVG | `/assets/brand/` | `max-age=604800` |

Vite/Nitro content-hashes in filenames (`action-feedback-Budxe_0l.js`) enable immutable caching.

### Tier 2 — CDN with shorter TTL

| Asset type | Source | Cache-Control |
|------------|--------|---------------|
| Public portfolio images | MinIO `ishbor-public` bucket | `max-age=86400` |
| Service gallery images | MinIO public | `max-age=86400` |
| Freelancer avatars | MinIO public | `max-age=3600` |
| Agency cover images | MinIO public | `max-age=86400` |
| OG images (generated) | MinIO or `/api/og` | `max-age=3600` |

### Tier 3 — Never CDN-cache

| Content | Reason |
|---------|--------|
| HTML shell (authenticated) | User-specific |
| `/api/*` | Dynamic data |
| Wallet, escrow, orders | Financial |
| KYC documents | Private — presigned URLs |
| Message attachments (private) | ACL |
| WebSocket | Not cacheable |

---

## 2. CDN architecture options

### Option A — Nginx only (Phase 1 beta)

```text
User → Nginx (ishbor.uz) → static files from /var/www/ishbor/current
                         → proxy /api → FastAPI
```

| Pros | Cons |
|------|------|
| Zero cost | No edge PoP in Central Asia |
| Simple | No DDoS protection |

**Acceptable for:** closed beta <200 users.

### Option B — Cloudflare (recommended Phase 2+)

```text
User → Cloudflare edge → Origin (Nginx VPS)
```

| Feature | Plan |
|---------|------|
| CDN | Free/Pro |
| SSL | Full (strict) |
| WAF | Pro+ |
| DDoS | Included |
| Brotli | Included |
| Polish (image opt) | Pro |

**DNS:**

| Record | Value |
|--------|-------|
| `ishbor.uz` | A → VPS (proxied orange cloud) |
| `api.ishbor.uz` | A → VPS (proxied) |
| `cdn.ishbor.uz` | CNAME → MinIO or CF worker |

### Option C — Cloudflare + R2 (Phase 3)

MinIO → migrate public bucket to R2 for infinite scale.  
Private buckets remain MinIO on VPS or move to R2 with signed URLs.

---

## 3. MinIO public bucket

Per [MINIO_ARCHITECTURE.md](../11-backend/minio/MINIO_ARCHITECTURE.md):

### Bucket layout

| Bucket | Access | CDN |
|--------|--------|-----|
| `ishbor-public` | Public read | Yes |
| `ishbor-uploads` | Presigned only | No |
| `ishbor-kyc` | Private ACL | No |
| `ishbor-messages` | Participant presigned | No |

### Public URL pattern

```text
# Direct MinIO (Phase 1)
https://ishbor.uz/media/{key}

# CDN (Phase 2)
https://cdn.ishbor.uz/{key}

# Nginx proxy to MinIO internal
location /media/ {
    proxy_pass http://minio:9000/ishbor-public/;
    proxy_cache media_cache;
    proxy_cache_valid 200 24h;
}
```

### Image optimization pipeline

```text
Upload → MinIO ishbor-uploads (private)
       → Celery: resize, WebP convert
       → Copy to ishbor-public
       → CDN purge/invalidate old key
```

| Variant | Max width | Format |
|---------|-----------|--------|
| thumb | 200px | WebP |
| card | 600px | WebP |
| full | 1920px | WebP/JPEG |

---

## 4. Nginx static asset config

```nginx
location /assets/ {
    alias /var/www/ishbor/current/assets/;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header X-Content-Type-Options nosniff;
    gzip_static on;
    # brotli_static on; if module available
}

location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache";  # HTML shell
}
```

---

## 5. Cloudflare configuration (when enabled)

### Page rules / Cache rules

| URL pattern | Setting |
|-------------|---------|
| `ishbor.uz/assets/*` | Cache Everything, Edge TTL 1 month |
| `cdn.ishbor.uz/*` | Cache Everything, Edge TTL 1 day |
| `api.ishbor.uz/*` | Bypass cache |
| `ishbor.uz/admin/*` | Bypass cache |

### Security

| Setting | Value |
|---------|-------|
| SSL mode | Full (strict) |
| Min TLS | 1.2 |
| Always HTTPS | On |
| Bot fight mode | On (launch) |
| Rate limiting | Complement nginx limits |

### Purge strategy

| Event | Action |
|-------|--------|
| Frontend deploy | Purge `ishbor.uz/assets/*` OR rely on hash filenames (no purge needed) |
| User updates avatar | Purge `cdn.ishbor.uz/avatars/{user_id}/*` |
| Service image update | Purge specific URL |
| Emergency | Purge everything (last resort) |

API hook: `POST /internal/cdn/purge` (admin only).

---

## 6. Geographic performance (Uzbekistan)

| Origin location | Tashkent RTT (approx) |
|-----------------|----------------------|
| Hetzner Helsinki | 80–120ms |
| Hetzner Frankfurt | 100–140ms |
| Selectel Moscow | 40–80ms |
| Cloudflare edge (Tbilisi) | 30–60ms to cache HIT |

**Target:** Cache HIT ratio >80% for static assets → effective <100ms.

### Mobile considerations (MOBILE_STANDARDS.md)

- Serve WebP with JPEG fallback
- Lazy load below-fold images (`loading="lazy"`)
- Responsive `srcset` for portfolio grids
- Max initial JS bundle <300 KB gzipped

---

## 7. Environment URLs

| Env | Static | Media CDN |
|-----|--------|-----------|
| local | `localhost:8081` | MinIO localhost:9000 |
| staging | `staging.ishbor.uz` | `cdn.staging.ishbor.uz` |
| production | `ishbor.uz` | `cdn.ishbor.uz` |

`CDN_BASE_URL` env var per ENVIRONMENT_STRATEGY.md.

---

## 8. CORS for CDN assets

```text
Access-Control-Allow-Origin: https://ishbor.uz
Access-Control-Allow-Methods: GET, HEAD
```

Fonts require CORS for cross-origin CSS.

---

## 9. Monitoring

| Metric | Target |
|--------|--------|
| CDN cache hit ratio | >80% |
| Origin bandwidth | Decreasing as hit ratio improves |
| 404 on /assets | 0 (broken deploy indicator) |
| Image LCP | <2.5s on 3G (PERFORMANCE_STANDARDS) |
| Cloudflare threat score | Monitor blocked requests |

---

## 10. Cost estimate

| Phase | CDN | Bandwidth |
|-------|-----|-----------|
| Beta | $0 (nginx only) | <100 GB/mo |
| Launch | Cloudflare Pro ~$20/mo | 500 GB/mo |
| Growth | CF Business or R2 | 5 TB/mo |

MinIO egress from VPS is expensive at scale — CDN offloads 80%+.

---

## 11. Implementation checklist

- [ ] Hash-based asset filenames in build (already via Vite)
- [ ] `Cache-Control` headers on nginx
- [ ] MinIO `ishbor-public` bucket policy read-only public
- [ ] Image processing Celery task
- [ ] `CDN_BASE_URL` in frontend for media URLs
- [ ] Cloudflare DNS proxied
- [ ] Cache rules configured
- [ ] Purge API for avatar updates
- [ ] Lighthouse performance ≥70

---

## 12. References

- [FILE_STORAGE_ARCHITECTURE.md](../11-backend/minio/FILE_STORAGE_ARCHITECTURE.md)
- [NGINX_ARCHITECTURE.md](../11-backend/infrastructure/NGINX_ARCHITECTURE.md)
- [CACHING_STRATEGY.md](./CACHING_STRATEGY.md)
- [PERFORMANCE_STANDARDS.md](../06-quality/PERFORMANCE_STANDARDS.md)

---

*Last updated: 2026-06-20*
