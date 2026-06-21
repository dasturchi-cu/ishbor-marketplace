# FILE_SECURITY.md

**Controls:** ClamAV virus scan, MIME validation, KYC ACL, signed URLs  
**Principle:** Never trust client-provided content — validate server-side

---

## 1. Security layers

```
Upload request
  → Purpose + size + MIME validation (presign)
  → Presigned URL (time-limited, scoped key)
  → Client PUT to MinIO
  → Confirm: HEAD verify size
  → ClamAV virus scan (Celery)
  → MIME magic byte re-check
  → Bucket ACL assignment
  → Entity attachment guard
```

---

## 2. Virus scanning — ClamAV

### Sidecar deployment

```yaml
clamav:
  image: clamav/clamav:latest
  networks:
    - ishbor-internal
  restart: unless-stopped
```

Celery worker connects to ClamAV via TCP `:3310`.

### Scan job

```python
@celery_app.task(name="media.virus_scan", queue="media")
def virus_scan(file_id: str):
    file = get_file(file_id)
    obj = minio_client.get_object(file.bucket, file.object_key)
    stream = io.BytesIO(obj.read())

    result = clamd.scan_stream(stream)
    if result is None:
        # Clean — proceed to media processing
        db.update(file, virus_scan_status="clean")
        process_image.delay(file_id)
    else:
        # Infected
        minio_client.remove_object(file.bucket, file.object_key)
        db.update(file, virus_scan_status="infected", status="rejected")
        audit_log(action="file_infected", entity_id=file_id)
        notify_user(file.user_id, "Fayl xavfsizlik tekshiruvidan o'tmadi")
```

Infected files: deleted from MinIO immediately — not quarantined (simplicity P0).

---

## 3. MIME validation

### Extension + Content-Type check (presign)

```python
ALLOWED_MIME = {
    "avatar": {"image/jpeg", "image/png", "image/webp"},
    "kyc_document": {"image/jpeg", "image/png", "application/pdf"},
    "project_attachment": {"application/pdf", "application/zip", ...},
}
```

### Magic byte verification (post-upload)

```python
import magic
def verify_mime(file_path: str, declared_mime: str) -> bool:
    detected = magic.from_file(file_path, mime=True)
    return detected in ALLOWED_MIME[purpose] and detected == declared_mime
```

Mismatch → reject file, delete from MinIO, log warning (possible attack).

---

## 4. KYC document access ACL

KYC files in `ishbor-private` bucket — never public CDN.

### Access rules

| Actor | Access method |
|-------|---------------|
| Document owner | Signed GET URL — 15 min expiry |
| Admin (verification_admin) | Signed GET URL — audit logged |
| Other users | DENY — 403 |
| CDN | No public access — bucket policy blocks |

```python
async def get_kyc_download_url(file_id: UUID, requester: User) -> str:
    file = await get_file(file_id)
    if file.purpose != "kyc_document":
        raise HTTPException(400)

    if requester.id == file.user_id:
        pass  # owner
    elif requester.is_admin and has_admin_role(requester, "verification_admin"):
        await audit_log(action="kyc_document_viewed", entity_id=file_id, actor=requester)
    else:
        raise HTTPException(403)

    return minio_client.presigned_get_object(
        bucket="ishbor-private",
        object_name=file.object_key,
        expires=timedelta(minutes=15),
    )
```

Every admin KYC view → `audit_logs` entry.

---

## 5. Bucket policies

```json
// ishbor-public — public read
{
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": ["*"]},
    "Action": ["s3:GetObject"],
    "Resource": ["arn:aws:s3:::ishbor-public/*"]
  }]
}

// ishbor-private — no public access
{
  "Statement": [{
    "Effect": "Deny",
    "Principal": {"AWS": ["*"]},
    "Action": ["s3:GetObject"],
    "Resource": ["arn:aws:s3:::ishbor-private/*"],
    "Condition": {"StringNotEquals": {"s3:authType": "REST-HEADER"}}
  }]
}
```

Applied via `mc admin policy` — see MINIO_ARCHITECTURE.md.

---

## 6. Presigned URL security

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| PUT expiry | 15 minutes | Limit window for abuse |
| GET expiry (private) | 15 minutes | KYC, attachments |
| GET expiry (shared attachment) | 1 hour | Project files |
| Key scope | Includes userId + fileId | Prevent overwrite attacks |
| Content-Type enforced | In presign signature | Prevent MIME swap |

Presigned URLs are single-object scoped — cannot list bucket.

---

## 7. Upload abuse prevention

| Control | Limit |
|---------|-------|
| Presign rate | 30/hour per user |
| Pending uploads | Max 10 per user |
| Total storage quota | 500 MB free, plan-based increase |
| Max gallery items | Enforced at entity attach |
| Duplicate upload | Same hash rejected within 1h (P2) |

---

## 8. SSRF prevention

FastAPI never fetches user-supplied URLs for file content.  
Video intro Phase 1: URL stored as string — validated against YouTube/Vimeo domain whitelist only — no server-side fetch.

---

## 9. Deletion security

| Event | Action |
|-------|--------|
| User deletes file | Soft delete → hard delete after 30 days |
| Account deletion | Purge all MinIO objects for user_id prefix |
| Admin content removal | Immediate delete + audit log |
| Infected file | Immediate delete |

Purge job verifies no orphaned MinIO objects outside files table (monthly).

---

## 10. Related documents

- [UPLOAD_FLOW.md](./UPLOAD_FLOW.md)
- [../security/SECURITY_ARCHITECTURE.md](../security/SECURITY_ARCHITECTURE.md)
- [../security/AUDIT_LOG_SYSTEM.md](../security/AUDIT_LOG_SYSTEM.md)
- [MEDIA_PROCESSING.md](./MEDIA_PROCESSING.md)

---

*Every upload passes ClamAV scan and MIME magic byte verification before activation. KYC documents require signed URLs with admin view auditing.*
