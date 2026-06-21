# FILE_STORAGE_ARCHITECTURE.md

**Replaces:** `mock-upload.ts`, gradient placeholders, `handleMockAttach()` in projects.create  
**Provider:** S3-compatible (Cloudflare R2 recommended for cost + CDN)

---

## 1. Upload purposes

| Purpose | Max size | MIME types | Public |
|---------|----------|------------|--------|
| avatar | 2 MB | image/jpeg, png, webp | Yes |
| portfolio_cover | 5 MB | image/* | Yes (if published) |
| portfolio_gallery | 5 MB each, max 12 | image/* | Yes |
| service_gallery | 5 MB each, max 8 | image/* | Yes |
| project_attachment | 25 MB | pdf, zip, docx, png, jpg | Participant only |
| message_file | 10 MB | pdf, image/* | Conversation participants |
| kyc_document | 10 MB | pdf, image/* | Owner + admin only |
| agency_logo | 2 MB | image/* | Yes |
| agency_cover | 5 MB | image/* | Yes |
| video_intro | 100 MB | video/mp4 (P2 transcode) | Yes |

---

## 2. Upload flow (presigned)

```
1. POST /files/presign { filename, mimeType, sizeBytes, purpose }
   → validate size/mime against purpose rules
   → INSERT files (status=pending, virus_scan_status=pending)
   → generate presigned PUT URL (15 min expiry)
   → return { fileId, uploadUrl, headers }

2. Client PUT directly to R2/S3

3. POST /files/confirm { fileId, etag? }
   → HEAD object — verify exists + size
   → enqueue VirusScanJob
   → update files.virus_scan_status

4. On scan clean → file available for entity attachment
   On infected → delete object, mark rejected, notify user
```

Maps portfolio-form upload, project attachments, message file send.

---

## 3. Bucket structure

```
ishbor-prod/
  avatars/{userId}/{fileId}.{ext}
  portfolios/{userId}/{portfolioId}/{fileId}.{ext}
  services/{serviceId}/{fileId}.{ext}
  projects/{projectId}/{fileId}.{ext}
  messages/{conversationId}/{fileId}.{ext}
  kyc/{userId}/{fileId}.{ext}          # private bucket
  agencies/{agencyId}/{fileId}.{ext}
```

**Private bucket:** `ishbor-private` for KYC — signed URLs for admin review only.

---

## 4. CDN

| Asset type | CDN | Cache |
|------------|-----|-------|
| Public images | Cloudflare CDN | 7 days |
| KYC | No CDN | signed URL 15 min |
| Attachments | Signed URL | 1 hour |

**Image optimization:** Cloudflare Images or imgproxy for thumbnails (400px, 800px, 1200px).

---

## 5. Database (`files` table)

See DATABASE_SCHEMA.md — stores metadata only, never binary.

Linking:
- `portfolios.cover_file_id` → files
- `portfolio_gallery.file_id` → files
- `project_attachments.file_id` → files
- `messages.file_id` → files
- `verification_documents.file_id` → files

---

## 6. Virus scanning

| Phase | Scanner |
|-------|---------|
| P0 | ClamAV sidecar on worker |
| P1 | Cloudflare malware scanning |

Infected file: delete from bucket, SET virus_scan_status=infected, audit log, notify user.

---

## 7. Video intro (freelancer profile)

**Phase 1:** Store URL only (YouTube/Vimeo embed) — no upload  
**Phase 2:** Upload to R2 → transcode job (Mux / FFmpeg worker) → HLS delivery

Maps `VideoIntro` component — currently gradient demo.

---

## 8. Deletion & GDPR

| Trigger | Action |
|---------|--------|
| User deletes portfolio | Remove gallery objects after 30-day soft delete |
| Account deletion request | Queue purge job for all user files |
| Entity hard delete | Cascade delete file records + S3 objects |

---

## 9. Frontend migration

| Current | Target |
|---------|--------|
| `mock-upload.ts` data URLs | presign → PUT → confirm |
| Gradient gallery placeholders (B-016) | Real file URLs from CDN |
| Base64 in localStorage | Never — fileId references only |

---

*Storage env vars: `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `CDN_BASE_URL`*
