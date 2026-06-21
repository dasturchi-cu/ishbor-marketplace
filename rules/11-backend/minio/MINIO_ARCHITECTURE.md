# MINIO_ARCHITECTURE.md

**Provider:** Self-hosted MinIO on Ishbor VPS — replaces Cloudflare R2 / AWS S3  
**Protocol:** S3-compatible API  
**Deployment:** Docker container on `ishbor-internal` network

---

## 1. Overview

MinIO provides S3-compatible object storage co-located with the application VPS. Benefits for Uzbekistan deployment:

- Data residency — files stay on UZ VPS
- No egress fees to external S3/R2
- Low latency for presigned uploads from local users
- Same boto3/minio-py SDK as cloud S3

```
FastAPI ──presign──▶ Client browser ──PUT──▶ MinIO :9000
                     ◀── CDN nginx ── GET ── cdn.ishbor.uz
```

---

## 2. Bucket structure

| Bucket | Access | Purpose |
|--------|--------|---------|
| `ishbor-uploads` | Private | Pending + confirmed uploads (default) |
| `ishbor-public` | Public read | Avatars, portfolios, services, agencies |
| `ishbor-private` | Private | KYC documents, sensitive attachments |

### Object key layout

```
ishbor-public/
  avatars/{userId}/{fileId}.{ext}
  portfolios/{userId}/{portfolioId}/{fileId}.{ext}
  services/{serviceId}/{fileId}.{ext}
  agencies/{agencyId}/{fileId}.{ext}

ishbor-uploads/
  pending/{userId}/{fileId}.{ext}     # before confirm

ishbor-private/
  kyc/{userId}/{fileId}.{ext}
  projects/{projectId}/{fileId}.{ext}  # participant-only attachments
  messages/{conversationId}/{fileId}.{ext}
```

---

## 3. Docker deployment

```yaml
minio:
  image: minio/minio:latest
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: ${MINIO_ROOT_USER}
    MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
  volumes:
    - minio_data:/data
  networks:
    - ishbor-internal
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
```

MinIO Console (`:9001`) accessible via SSH tunnel only — not public.

---

## 4. Service accounts

Create dedicated S3 credentials for FastAPI — not root credentials:

```bash
mc admin user add local ishbor-app $APP_SECRET
mc admin policy attach local readwrite --user ishbor-app
# Use generated access key in S3_ACCESS_KEY / S3_SECRET_KEY
```

Root credentials (`MINIO_ROOT_USER/PASSWORD`) for admin operations only.

---

## 5. Public bucket CDN

nginx serves `ishbor-public` at `cdn.ishbor.uz`:

```nginx
location / {
    proxy_pass http://minio:9000/ishbor-public/;
    expires 7d;
    add_header Cache-Control "public";
}
```

Cache busting via fileId in URL path — immutable content addressing.

---

## 6. Capacity planning

| Phase | Storage | VPS disk |
|-------|---------|----------|
| Beta (1k users) | ~50 GB | 160 GB VPS sufficient |
| Growth (10k users) | ~500 GB | Dedicated storage VPS |
| Scale | Multi-TB | MinIO distributed mode |

Monitor: Prometheus `minio_bucket_usage_total_bytes` alert at 80% disk.

---

## 7. High availability (P2)

Single-node MinIO for beta. Scale path:

- MinIO erasure coding across 4+ drives
- Or separate storage VPS with MinIO + replication
- CDN nginx remains entry point

---

## 8. Environment variables

```bash
MINIO_ROOT_USER=
MINIO_ROOT_PASSWORD=
S3_ENDPOINT=http://minio:9000       # internal Docker
S3_PUBLIC_ENDPOINT=https://cdn.ishbor.uz  # client-facing GET
S3_BUCKET=ishbor-uploads
S3_PUBLIC_BUCKET=ishbor-public
S3_PRIVATE_BUCKET=ishbor-private
S3_ACCESS_KEY=                      # ishbor-app service account
S3_SECRET_KEY=
S3_REGION=us-east-1
```

---

## 9. Related documents

- [FILE_STORAGE_ARCHITECTURE.md](./FILE_STORAGE_ARCHITECTURE.md)
- [UPLOAD_FLOW.md](./UPLOAD_FLOW.md)
- [FILE_SECURITY.md](./FILE_SECURITY.md)
- [../infrastructure/BACKUP_STRATEGY.md](../infrastructure/BACKUP_STRATEGY.md)

---

*Self-hosted MinIO on VPS replaces all R2/S3 references. Three buckets separate public media, pending uploads, and private sensitive documents.*
