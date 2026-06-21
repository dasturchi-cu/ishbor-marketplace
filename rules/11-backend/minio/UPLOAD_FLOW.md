# UPLOAD_FLOW.md

**Pattern:** Presigned PUT from FastAPI → direct client upload to MinIO  
**Default bucket:** `ishbor-uploads` (pending) → moved on confirm  
**Expiry:** Presigned URL valid 15 minutes

---

## 1. Sequence diagram

```
Client                FastAPI                 PostgreSQL           MinIO
  │                      │                        │                  │
  │ POST /files/presign  │                        │                  │
  │ {filename, mime,     │                        │                  │
  │  size, purpose}      │                        │                  │
  │─────────────────────▶│                        │                  │
  │                      │ validate rules         │                  │
  │                      │ INSERT files pending   │                  │
  │                      │───────────────────────▶│                  │
  │                      │ generate presigned PUT │                  │
  │                      │───────────────────────────────────────────▶│
  │◀─ {fileId, uploadUrl, headers, expiresAt} ───│                  │
  │                      │                        │                  │
  │ PUT uploadUrl        │                        │                  │
  │ (binary body)        │                        │                  │
  │─────────────────────────────────────────────────────────────────▶│
  │◀─ 200 ETag ─────────────────────────────────────────────────────│
  │                      │                        │                  │
  │ POST /files/confirm  │                        │                  │
  │ {fileId, etag}       │                        │                  │
  │─────────────────────▶│                        │                  │
  │                      │ HEAD object ─ verify ─────────────────────▶│
  │                      │ UPDATE files status  │                  │
  │                      │ enqueue VirusScanJob │                  │
  │                      │───────────────────────▶│                  │
  │◀─ {fileId, status: scanning} ────────────────│                  │
  │                      │                        │                  │
  │         [Celery: virus scan clean]           │                  │
  │                      │ move to final bucket │                  │
  │                      │ UPDATE status=active │                  │
  │                      │───────────────────────▶│                  │
  │◀─ WS: file.ready ───│                        │                  │
```

---

## 2. POST /files/presign

### Request

```json
{
  "filename": "portfolio-cover.jpg",
  "mime_type": "image/jpeg",
  "size_bytes": 2048000,
  "purpose": "portfolio_cover"
}
```

### Validation

```python
async def presign_file(request: PresignRequest, user: User):
    rules = UPLOAD_RULES[request.purpose]  # max size, allowed MIME
    if request.size_bytes > rules.max_bytes:
        raise HTTPException(400, "FILE_TOO_LARGE")
    if request.mime_type not in rules.allowed_mime:
        raise HTTPException(400, "MIME_NOT_ALLOWED")
    await check_user_quota(user.id, request.purpose)

    file_id = uuid4()
    object_key = f"pending/{user.id}/{file_id}{ext_from_filename(request.filename)}"

    file = await db.insert(File(
        id=file_id, user_id=user.id, purpose=request.purpose,
        bucket="ishbor-uploads", object_key=object_key,
        mime_type=request.mime_type, size_bytes=request.size_bytes,
        status="pending", virus_scan_status="pending",
    ))

    upload_url = minio_client.presigned_put_object(
        bucket_name="ishbor-uploads",
        object_name=object_key,
        expires=timedelta(minutes=15),
        headers={"Content-Type": request.mime_type},
    )

    return PresignResponse(
        file_id=file_id,
        upload_url=upload_url,
        headers={"Content-Type": request.mime_type},
        expires_at=datetime.utcnow() + timedelta(minutes=15),
    )
```

---

## 3. Client PUT to MinIO

Frontend upload utility:

```typescript
async function uploadFile(file: File, purpose: UploadPurpose): Promise<string> {
  const presign = await api.post("/files/presign", {
    filename: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    purpose,
  });

  const putResponse = await fetch(presign.upload_url, {
    method: "PUT",
    headers: presign.headers,
    body: file,
  });

  if (!putResponse.ok) throw new UploadError("PUT failed");

  const etag = putResponse.headers.get("ETag");
  await api.post("/files/confirm", { file_id: presign.file_id, etag });
  return presign.file_id;
}
```

No Authorization header on PUT — presigned URL contains signature.

---

## 4. POST /files/confirm

```python
async def confirm_file(request: ConfirmRequest, user: User):
    file = await db.get_file(request.file_id, for_update=True)
    if file.user_id != user.id:
        raise HTTPException(403)
    if file.status != "pending":
        return ConfirmResponse(file_id=file.id, status=file.status)  # idempotent

    # Verify object exists and size matches
    stat = minio_client.stat_object(file.bucket, file.object_key)
    if stat.size != file.size_bytes:
        raise HTTPException(400, "SIZE_MISMATCH")

    await db.update(file, status="confirmed", virus_scan_status="pending")
    virus_scan.delay(file_id=str(file.id))

    return ConfirmResponse(file_id=file.id, status="scanning")
```

---

## 5. Post-scan bucket move

After ClamAV clean:

```python
final_bucket = "ishbor-public" if purpose in PUBLIC_PURPOSES else "ishbor-private"
final_key = build_final_key(purpose, user_id, file_id, ext)

minio_client.copy_object(final_bucket, final_key, CopySource(file.bucket, file.object_key))
minio_client.remove_object(file.bucket, file.object_key)

await db.update(file, bucket=final_bucket, object_key=final_key, status="active", virus_scan_status="clean")
```

If infected: delete object, `status=rejected`, notify user, audit log.

---

## 6. Pending upload cleanup

Celery job every hour:

```python
# Delete presigned-but-never-confirmed files older than 1 hour
orphans = await db.query(File.status == "pending", File.created_at < now() - 1h)
for file in orphans:
    minio_client.remove_object(file.bucket, file.object_key)
    await db.delete(file)
```

---

## 7. Entity attachment

After `file.status = active`, client attaches to entity:

```json
POST /portfolios
{
  "title": "...",
  "cover_file_id": "uuid-from-upload"
}
```

Server verifies: file belongs to user, purpose matches, status=active.

---

## 8. Error codes

| Code | HTTP | Message (UZ) |
|------|------|--------------|
| FILE_TOO_LARGE | 400 | Fayl hajmi ruxsat etilganidan katta |
| MIME_NOT_ALLOWED | 400 | Fayl turi qo'llab-quvvatlanmaydi |
| QUOTA_EXCEEDED | 429 | Yuklash limiti oshib ketdi |
| PRESIGN_EXPIRED | 410 | Yuklash vaqti tugagan — qayta urinib ko'ring |
| SIZE_MISMATCH | 400 | Fayl hajmi mos kelmadi |
| FILE_INFECTED | 422 | Fayl xavfsizlik tekshiruvidan o'tmadi |

---

## 9. Related documents

- [FILE_STORAGE_ARCHITECTURE.md](./FILE_STORAGE_ARCHITECTURE.md)
- [FILE_SECURITY.md](./FILE_SECURITY.md)
- [MEDIA_PROCESSING.md](./MEDIA_PROCESSING.md)

---

*Upload flow uses presigned PUT to ishbor-uploads bucket. FastAPI never proxies binary — client uploads directly to MinIO.*
