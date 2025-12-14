# ThuluBazaar Image Optimization Guide

> Documentation for image processing, optimization, and storage

---

## Table of Contents

1. [Current Implementation](#current-implementation)
2. [Image Processing Settings](#image-processing-settings)
3. [File Structure](#file-structure)
4. [Usage Examples](#usage-examples)
5. [Optimization Status](#optimization-status)
6. [Recommended Improvements](#recommended-improvements)
7. [S3 Integration Guide](#s3-integration-guide)
8. [Performance Tips](#performance-tips)

---

## Current Implementation

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Sharp** | `sharp@0.34.5` | Image processing & optimization |
| **Multer** | `multer` | File upload handling |
| **Format** | JPEG | Output format |
| **Storage** | Local disk | Current (move to S3 for production) |

### How It Works

```
User Uploads Image
        ↓
┌───────────────────────┐
│   Multer receives     │
│   raw file            │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│   Sharp processes:    │
│   • Validates format  │
│   • Resizes if needed │
│   • Compresses        │
│   • Converts to JPEG  │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│   Saves to disk       │
│   /public/uploads/    │
└───────────────────────┘
```

---

## Image Processing Settings

### Default Settings

```typescript
// apps/web/src/lib/utils/image.ts

const DEFAULT_OPTIONS = {
  maxWidth: 1920,      // Max width in pixels
  maxHeight: 1920,     // Max height in pixels
  quality: 85,         // JPEG quality (0-100)
  format: 'jpeg',      // Output format
};
```

### Per Upload Type Settings

| Upload Type | Max Size | Quality | Format | Max Files |
|-------------|----------|---------|--------|-----------|
| **Ad Images** | 1920×1920 | 85% | JPEG | 10 |
| **Avatars** | No optimization | - | Original | 1 |
| **Documents** | No optimization | - | Original | 1 |
| **Chat Images** | Varies | - | Original | 1 |

### File Size Limits

| Upload Type | Max File Size | Location |
|-------------|---------------|----------|
| Ad Images | 10 MB | `apps/api/src/middleware/upload.ts` |
| Avatars | 5 MB | `apps/api/src/middleware/upload.ts` |
| Documents | 10 MB | `apps/api/src/middleware/upload.ts` |

---

## File Structure

### Image Utility Location

```
apps/web/src/lib/utils/
├── image.ts          # Main image processing functions
└── index.ts          # Exports

apps/api/src/middleware/
└── upload.ts         # Multer configuration
```

### Upload Directories

```
public/uploads/
├── ads/              # Ad images (optimized)
├── avatars/          # User avatars (not optimized)
└── documents/        # Verification documents
```

---

## Usage Examples

### Processing Ad Images

```typescript
import { processMultipleImages } from '@/lib/utils';

// In API route
const images = formData.getAll('images') as File[];

const processedImages = await processMultipleImages(images, 'uploads/ads', {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 85,
  format: 'jpeg',
});

// Returns:
// [
//   {
//     filename: 'ad-1702567890123-456789.jpg',
//     filePath: 'uploads/ads/ad-1702567890123-456789.jpg',
//     fileSize: 245678,
//     mimeType: 'image/jpeg'
//   },
//   ...
// ]
```

### Processing Single Image

```typescript
import { processAndSaveImage } from '@/lib/utils';

const file = formData.get('image') as File;

const processed = await processAndSaveImage(file, 'uploads/avatars', {
  maxWidth: 400,
  maxHeight: 400,
  quality: 80,
  format: 'jpeg',
});
```

### Deleting Images

```typescript
import { deleteImage, deleteMultipleImages } from '@/lib/utils';

// Delete single image
await deleteImage('uploads/ads/ad-123456.jpg');

// Delete multiple images
await deleteMultipleImages([
  'uploads/ads/ad-123456.jpg',
  'uploads/ads/ad-789012.jpg',
]);
```

---

## Optimization Status

### Currently Optimized ✅

| Feature | Status | Details |
|---------|--------|---------|
| Ad Images | ✅ Working | Resize + compress + convert |
| Format Validation | ✅ Working | JPEG, PNG, WebP, GIF |
| Size Limits | ✅ Working | 10MB max |
| Multiple Files | ✅ Working | Up to 10 images |

### Not Yet Optimized ❌

| Feature | Status | Impact |
|---------|--------|--------|
| Avatar Images | ❌ Missing | Large profile images |
| WebP Format | ❌ Missing | 30% larger files |
| Thumbnails | ❌ Missing | Slow listing pages |
| S3 Storage | ❌ Missing | Can't scale horizontally |
| CDN Integration | ❌ Missing | Slow for distant users |

---

## Recommended Improvements

### 1. Add WebP Format Support

WebP provides 30% smaller files than JPEG with same quality.

```typescript
// Change default format
const DEFAULT_OPTIONS = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 85,
  format: 'webp',  // Changed from 'jpeg'
};
```

### 2. Generate Thumbnails

Create smaller versions for listing pages.

```typescript
// Add thumbnail generation
export async function processWithThumbnail(
  file: File,
  uploadDir: string
): Promise<{ original: ProcessedImage; thumbnail: ProcessedImage }> {
  // Process original
  const original = await processAndSaveImage(file, uploadDir, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 85,
    format: 'webp',
  });

  // Process thumbnail
  const thumbnail = await processAndSaveImage(file, `${uploadDir}/thumbs`, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 75,
    format: 'webp',
  });

  return { original, thumbnail };
}
```

### 3. Optimize Avatars

```typescript
// In avatar upload route
const processedAvatar = await processAndSaveImage(avatarFile, 'uploads/avatars', {
  maxWidth: 400,
  maxHeight: 400,
  quality: 80,
  format: 'webp',
});
```

### 4. Add Responsive Images

Generate multiple sizes for different devices.

```typescript
const RESPONSIVE_SIZES = [
  { name: 'thumb', width: 150, height: 150, quality: 70 },
  { name: 'small', width: 400, height: 400, quality: 75 },
  { name: 'medium', width: 800, height: 800, quality: 80 },
  { name: 'large', width: 1920, height: 1920, quality: 85 },
];

export async function processResponsiveImages(
  file: File,
  uploadDir: string
): Promise<Record<string, ProcessedImage>> {
  const results: Record<string, ProcessedImage> = {};

  for (const size of RESPONSIVE_SIZES) {
    results[size.name] = await processAndSaveImage(file, uploadDir, {
      maxWidth: size.width,
      maxHeight: size.height,
      quality: size.quality,
      format: 'webp',
    });
  }

  return results;
}
```

---

## S3 Integration Guide

### Why S3 for Production?

| Local Storage | S3 Storage |
|---------------|------------|
| ❌ Single server only | ✅ Access from anywhere |
| ❌ Lost if server fails | ✅ 99.999999999% durability |
| ❌ Limited disk space | ✅ Unlimited storage |
| ❌ No CDN integration | ✅ CloudFront CDN ready |

### S3 Setup

#### 1. Install AWS SDK

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

#### 2. Create S3 Upload Utility

```typescript
// apps/web/src/lib/utils/s3.ts

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'thulobazaar-images';

export interface S3UploadResult {
  key: string;
  url: string;
  size: number;
}

export async function uploadToS3(
  file: File,
  folder: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'webp' | 'png';
  } = {}
): Promise<S3UploadResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 85,
    format = 'webp',
  } = options;

  // Process image with Sharp
  const buffer = Buffer.from(await file.arrayBuffer());

  let sharpInstance = sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });

  // Convert to specified format
  if (format === 'webp') {
    sharpInstance = sharpInstance.webp({ quality });
  } else if (format === 'jpeg') {
    sharpInstance = sharpInstance.jpeg({ quality });
  } else {
    sharpInstance = sharpInstance.png({ quality });
  }

  const processedBuffer = await sharpInstance.toBuffer();

  // Generate unique filename
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const ext = format === 'jpeg' ? 'jpg' : format;
  const key = `${folder}/${timestamp}-${random}.${ext}`;

  // Upload to S3
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: processedBuffer,
    ContentType: `image/${format}`,
    CacheControl: 'max-age=31536000', // 1 year cache
  }));

  return {
    key,
    url: `https://${BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${key}`,
    size: processedBuffer.length,
  };
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  }));
}
```

#### 3. Environment Variables

```bash
# .env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=thulobazaar-images
```

#### 4. S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::thulobazaar-images/*"
    }
  ]
}
```

#### 5. CloudFront CDN (Recommended)

```
User Request
     ↓
CloudFront Edge (Nepal/India)  ← Cached here
     ↓ (if not cached)
S3 Bucket (Mumbai)
```

Benefits:
- Images cached at edge locations near Nepal
- Faster loading for users
- Reduced S3 costs

---

## Performance Tips

### 1. Lazy Loading

```tsx
// In Next.js components
import Image from 'next/image';

<Image
  src={imageUrl}
  alt="Ad image"
  width={400}
  height={300}
  loading="lazy"  // Lazy load
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### 2. Use Next.js Image Optimization

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['thulobazaar-images.s3.ap-south-1.amazonaws.com'],
    formats: ['image/webp', 'image/avif'],
  },
};
```

### 3. Image Size Guidelines

| Use Case | Recommended Size | Format |
|----------|------------------|--------|
| Ad Listing Thumbnail | 400×300 | WebP |
| Ad Detail Image | 1200×900 | WebP |
| User Avatar | 200×200 | WebP |
| Shop Banner | 1200×400 | WebP |
| Category Icon | 100×100 | WebP |

### 4. Compression Comparison

| Format | Quality 85% | File Size | Savings |
|--------|-------------|-----------|---------|
| Original PNG | - | 2.5 MB | - |
| JPEG | 85% | 450 KB | 82% |
| WebP | 85% | 320 KB | 87% |
| AVIF | 85% | 250 KB | 90% |

---

## Testing Image Optimization

### Manual Test

```bash
# 1. Upload a large image (5MB+) via the ad posting form
# 2. Check the saved file size in public/uploads/ads/
# 3. Should be significantly smaller (usually < 500KB)

# Check file sizes
ls -lh public/uploads/ads/
```

### Automated Test

```typescript
// apps/web/src/__tests__/unit/image.test.ts

import { describe, it, expect } from 'vitest';
import { processAndSaveImage } from '@/lib/utils/image';
import { readFileSync } from 'fs';

describe('Image Processing', () => {
  it('should compress large images', async () => {
    // Create a test file
    const largeImage = new File([/* large buffer */], 'test.jpg', {
      type: 'image/jpeg',
    });

    const result = await processAndSaveImage(largeImage, 'uploads/test', {
      maxWidth: 800,
      quality: 80,
    });

    // File should be compressed
    expect(result.fileSize).toBeLessThan(500000); // < 500KB
  });

  it('should resize oversized images', async () => {
    // Test that images larger than maxWidth are resized
  });

  it('should reject invalid formats', async () => {
    // Test that non-image files are rejected
  });
});
```

---

## Quick Reference

### Current Settings

```typescript
// Ad Images
{ maxWidth: 1920, maxHeight: 1920, quality: 85, format: 'jpeg' }

// Recommended for Production
{ maxWidth: 1920, maxHeight: 1920, quality: 85, format: 'webp' }
```

### File Paths

```
Image Utility:    apps/web/src/lib/utils/image.ts
Upload Middleware: apps/api/src/middleware/upload.ts
Upload Directory:  public/uploads/
```

### Commands

```bash
# Check image file sizes
ls -lh public/uploads/ads/

# Delete old test images
rm -rf public/uploads/ads/ad-test-*

# View sharp version
npm ls sharp
```

---

## Migration Checklist (Local → S3)

- [ ] Install AWS SDK packages
- [ ] Create S3 bucket in ap-south-1
- [ ] Configure bucket policy for public read
- [ ] Add environment variables
- [ ] Create S3 upload utility
- [ ] Update ad upload routes to use S3
- [ ] Update avatar upload to use S3
- [ ] Set up CloudFront CDN
- [ ] Migrate existing images to S3
- [ ] Update image URLs in database
- [ ] Test all upload features
- [ ] Remove local upload directory

---

*Last updated: December 2024*
