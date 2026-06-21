# MEDIA_PROCESSING.md

**Workers:** Celery `media` queue + optional imgproxy sidecar  
**Scope:** Image resize, portfolio thumbnails, avatar optimization  
**Storage:** Processed variants in MinIO `ishbor-public`

---

## 1. Overview

Raw uploads are optimized before CDN delivery:

| Variant | Width | Use case |
|---------|-------|----------|
| thumb | 400px | Card grids, search results |
| medium | 800px | Detail pages |
| large | 1200px | Full portfolio view |
| original | as uploaded | Download / zoom |

Avatar: single 256px square crop.  
Portfolio/service gallery: thumb + medium + original.

---

## 2. Processing pipeline

```
File confirm → VirusScanJob (clean)
    → MediaProcessJob
        → Download from MinIO
        → Pillow resize + WebP convert
        → Upload variants to ishbor-public
        → UPDATE files SET variants = jsonb
        → Emit file.processed event
```

```python
@celery_app.task(name="media.process_image", queue="media")
def process_image(file_id: str):
    file = get_file(file_id)
    if not file.mime_type.startswith("image/"):
        return

    raw = minio_client.get_object(file.bucket, file.object_key)
    img = Image.open(raw)

    variants = {}
    for name, width in VARIANTS.items():
        resized = resize_cover(img, width)
        webp_bytes = save_webp(resized, quality=85)
        variant_key = f"{dirname(file.object_key)}/{name}/{file.id}.webp"
        minio_client.put_object("ishbor-public", variant_key, webp_bytes)
        variants[name] = variant_key

    db.update(file, variants=variants, processing_status="complete")
```

---

## 3. Portfolio thumbnails

Maps portfolio gallery cards — replaces gradient placeholders (B-016).

| Field | Value |
|-------|-------|
| Source | `files.variants.thumb` |
| CDN URL | `https://cdn.ishbor.uz/portfolios/{userId}/{portfolioId}/thumb/{fileId}.webp` |
| Fallback | medium variant if thumb pending |
| Placeholder | Neutral `#F1F5F9` skeleton until processed |

Frontend:

```typescript
function getPortfolioCoverUrl(file: FileRecord): string {
  if (file.variants?.thumb) {
    return `${CDN_BASE}/${file.variants.thumb}`;
  }
  if (file.status === "active") return `${CDN_BASE}/${file.object_key}`;
  return PORTFOLIO_PLACEHOLDER; // skeleton only — not gradient demo
}
```

---

## 4. Avatar processing

```
1. Upload purpose=avatar
2. After virus scan: crop center square
3. Generate 64px, 128px, 256px variants
4. WebP format — fallback JPEG for ancient browsers (P2)
5. UPDATE users.avatar_file_id
6. Invalidate CDN cache for old avatar path
```

Circular crop applied client-side via CSS — server stores square.

---

## 5. imgproxy alternative (P2)

For on-the-fly resize without pre-generation:

```nginx
location /img/ {
    proxy_pass http://imgproxy:8080/;
    # Signed URLs prevent abuse
}
```

Pre-generation (Celery) preferred for beta — predictable CDN caching, lower CPU at request time.

---

## 6. Video intro (P2)

**Phase 1:** YouTube/Vimeo URL only — no upload processing.  
**Phase 2:** MP4 upload → FFmpeg worker:

```
upload video/mp4 → ishbor-uploads
→ FFmpeg transcode → HLS segments in ishbor-public
→ CDN serve .m3u8
```

Celery `media` queue — long-running, separate worker pool (1 worker, concurrency 1).

---

## 7. Queue configuration

```yaml
celery-worker-media:
  image: ishbor-api:latest
  command: celery -A server.workers.celery_app worker -Q media -c 2
  deploy:
    resources:
      limits:
        memory: 1G  # Pillow memory for large images
```

Job timeout: 120s per image. Retry 2× on failure.

---

## 8. files.variants schema

```json
{
  "thumb": "portfolios/userId/portfolioId/thumb/fileId.webp",
  "medium": "portfolios/userId/portfolioId/medium/fileId.webp",
  "large": "portfolios/userId/portfolioId/large/fileId.webp"
}
```

Stored in `files.metadata` JSONB column.

---

## 9. Monitoring

| Metric | Alert |
|--------|-------|
| `media_process_duration_seconds` p95 >30s | P2 |
| `media_process_failures_total` >10/hour | P2 |
| Media queue depth >100 | P2 — add worker |

---

## 10. Related documents

- [UPLOAD_FLOW.md](./UPLOAD_FLOW.md)
- [FILE_STORAGE_ARCHITECTURE.md](./FILE_STORAGE_ARCHITECTURE.md)
- [MINIO_ARCHITECTURE.md](./MINIO_ARCHITECTURE.md)

---

*Celery media worker generates WebP thumbnails at 400/800/1200px. Portfolio cards use real CDN URLs — gradient placeholders removed after processing completes.*
