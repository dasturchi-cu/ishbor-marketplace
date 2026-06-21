# FILE_STORAGE_ARCHITECTURE.md

**Replaces:** `mock-upload.ts`, gradient placeholders, R2/S3 cloud references  
**Provider:** Self-hosted MinIO on VPS (S3-compatible)  
**Sources:** Original FILE_STORAGE_ARCHITECTURE.md, portfolio-form uploads, project attachments

---

## 1. Upload purposes

| Purpose | Max size | MIME types | Bucket | Public |
|---------|----------|------------|--------|--------|
| avatar | 2 MB | image/jpeg, png, webp | ishbor-public | Yes |
| portfolio_cover | 5 MB | image/jpeg, png, webp | ishbor-public | Yes (if published) |
| portfolio_gallery | 5 MB ×12 max | image/* | ishbor-public | Yes |
| service_gallery | 5 MB ×8 max | image/* | ishbor-public | Yes |
| project_attachment | 25 MB | pdf, zip, docx, png, jpg | ishbor-private | Participants |
| message_file | 10 MB | pdf, image/* | ishbor-private | Conversation |
| kyc_document | 10 MB | pdf, image/* | ishbor-private | Owner + admin |
| agency_logo | 2 MB | image/* | ishbor-public | Yes |
| agency_cover | 5 MB | image/* | ishbor-public | Yes |
| video_intro | 100 MB | video/mp4 (P2) | ishbor-public | Yes |

---

## 2. Architecture overview

```
1. Client requests presign     POST /v1/files/presign
2. FastAPI validates rules     size, MIME, purpose, user quota
3. INSERT files (pending)      PostgreSQL metadata
4. Return presigned PUT URL    MinIO ishbor-uploads bucket
5. Client PUT directly         Browser → MinIO (not through API)
6. Client confirms             POST /v1/files/confirm
7. HEAD object verify          size + existence
8. Virus scan job              Celery → ClamAV
9. Move to final bucket        ishbor-public or ishbor-private
10. Entity attachment          portfolio.cover_file_id = file.id
```

Binary never touches FastAPI server — presigned URL pattern only.

---

## 3. Bucket mapping by purpose

| Purpose | Initial bucket | Final bucket after confirm |
|---------|---------------|---------------------------|
| avatar, portfolio_*, service_*, agency_* | ishbor-uploads | ishbor-public |
| kyc_document | ishbor-uploads | ishbor-private |
| project_attachment, message_file | ishbor-uploads | ishbor-private |

Public files served via `https://cdn.ishbor.uz/{key}`.  
Private files via signed GET URL (15 min expiry).

---

## 4. CDN and caching

| Asset type | URL | Cache |
|------------|-----|-------|
| Public images | cdn.ishbor.uz | 7 days nginx |
| Thumbnails | cdn.ishbor.uz/thumbs/ | 7 days |
| KYC | Signed MinIO URL | No CDN — 15 min |
| Project attachments | Signed URL | 1 hour |

Image optimization: imgproxy or Celery resize worker — see MEDIA_PROCESSING.md.

---

## 5. Database (`files` table)

Metadata only — never binary in PostgreSQL.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | Uploader |
| purpose | enum | avatar, portfolio_cover, etc. |
| bucket | varchar | ishbor-public / ishbor-private |
| object_key | varchar | Full MinIO key path |
| mime_type | varchar | Validated |
| size_bytes | bigint | Validated on confirm |
| status | enum | pending, active, rejected, deleted |
| virus_scan_status | enum | pending, clean, infected |
| created_at | timestamptz | |

Entity linking:
- `portfolios.cover_file_id` → files
- `portfolio_gallery.file_id` → files
- `project_attachments.file_id` → files
- `messages.file_id` → files
- `verification_documents.file_id` → files

---

## 6. Migration from mock-upload

| Current (frontend) | Target (production) |
|--------------------|---------------------|
| `mock-upload.ts` data URLs | presign → PUT → confirm |
| Gradient gallery placeholders | Real CDN URLs from files table |
| Base64 in localStorage | fileId references only |
| Cloudflare R2 env vars | MinIO S3_ENDPOINT on VPS |

Frontend upload component calls API presign — never writes blob to localStorage.

---

## 7. Deletion and GDPR

| Trigger | Action |
|---------|--------|
| Portfolio soft delete | Remove gallery objects after 30 days |
| Account deletion | Celery purge job — all user MinIO objects |
| Entity hard delete | Cascade delete files records + MinIO objects |
| Infected file | Immediate MinIO delete + status=rejected |

Soft delete: `files.status = deleted`, object removed after retention period.

---

## 8. Environment variables

```bash
S3_ENDPOINT=http://minio:9000
S3_PUBLIC_ENDPOINT=https://cdn.ishbor.uz
S3_BUCKET=ishbor-uploads
S3_PUBLIC_BUCKET=ishbor-public
S3_PRIVATE_BUCKET=ishbor-private
S3_ACCESS_KEY=
S3_SECRET_KEY=
CDN_BASE_URL=https://cdn.ishbor.uz
```

---

## 9. Related documents

- [MINIO_ARCHITECTURE.md](./MINIO_ARCHITECTURE.md)
- [UPLOAD_FLOW.md](./UPLOAD_FLOW.md)
- [MEDIA_PROCESSING.md](./MEDIA_PROCESSING.md)
- [FILE_SECURITY.md](./FILE_SECURITY.md)

---

*All R2/S3 cloud references replaced with self-hosted MinIO. File metadata in PostgreSQL; binary in MinIO buckets.*
