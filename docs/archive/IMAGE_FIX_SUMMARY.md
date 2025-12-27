# Image Loading Fix Summary

**Date:** October 29, 2025
**Issue:** All images missing in ad cards and ad details
**Status:** ✅ FIXED

---

## Root Cause

Components were trying to load images from the **wrong server port**:
- **Wrong URL:** `http://localhost:5000/uploads/...` (old Express server)
- **Correct URL:** `/uploads/...` (current Next.js server on port 3333)

This happened because:
1. Code used `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'`
2. Defaulted to port 5000 (old Express backend)
3. Next.js server runs on port 3333
4. Images are in `/monorepo/apps/web/public/uploads/`

---

## Files Fixed

### 1. AdCard Component
**File:** `/apps/web/src/components/AdCard.tsx`

**Before:**
```typescript
const imageUrl = ad.primaryImage
  ? (ad.primaryImage.startsWith('http')
      ? ad.primaryImage
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${ad.primaryImage}`)
  : null;
```

**After:**
```typescript
const imageUrl = ad.primaryImage
  ? (ad.primaryImage.startsWith('http')
      ? ad.primaryImage
      : `/${ad.primaryImage}`)
  : null;
```

### 2. Ad Detail Page
**File:** `/apps/web/src/app/[lang]/ad/[slug]/page.tsx`

**Before:**
```typescript
const images = ad.ad_images.map(img =>
  `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${img.file_path}`
);
```

**After:**
```typescript
const images = ad.ad_images.map(img =>
  `/${img.file_path}`
);
```

### 3. Dashboard Page
**File:** `/apps/web/src/app/[lang]/dashboard/page.tsx`

**Before:**
```typescript
src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${ad.images[0].file_path || ad.images[0].filename}`}
```

**After:**
```typescript
src={`/${ad.images[0].file_path || ad.images[0].filename}`}
```

### 4. Environment Variable
**File:** `/apps/web/.env`

**Before:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3333
```

**After:**
```bash
# NEXT_PUBLIC_API_URL is used by client-side code for API calls
# For Next.js 15, all API routes are on the same server, so we use empty string for relative URLs
NEXT_PUBLIC_API_URL=
```

---

## How Images Work Now

### Image Storage
```
/monorepo/apps/web/public/uploads/
├── ads/
│   ├── ad-1761021546580-361291216.png
│   ├── 3 Tier Document Tray.webp
│   └── ...
├── avatars/
├── covers/
├── business_verification/
└── individual_verification/
```

### Database Paths
Images are stored in the database with relative paths:
```sql
SELECT file_path FROM ad_images LIMIT 1;
-- Result: uploads/ads/3 Tier Document Tray.webp
```

### How They Load
1. **Server-side (SSR):** Image path from DB → `/${path}` → `/uploads/ads/image.png`
2. **Next.js serves:** Files from `public/` folder are accessible at root `/`
3. **Browser loads:** `http://localhost:3333/uploads/ads/image.png` ✅

### Example Flow
```
Database: uploads/ads/goat.jpeg
    ↓
Component: /${file_path}
    ↓
HTML: <img src="/uploads/ads/goat.jpeg" />
    ↓
Browser requests: http://localhost:3333/uploads/ads/goat.jpeg
    ↓
Next.js serves: /monorepo/apps/web/public/uploads/ads/goat.jpeg
    ↓
Image displays: ✅
```

---

## Verification

### Test Image Accessibility
```bash
# Test if image is accessible
curl -s -o /dev/null -w "%{http_code}" http://localhost:3333/uploads/ads/ad-1761021546580-361291216.png
# Result: 200 ✅
```

### Check Homepage HTML
```bash
curl -s http://localhost:3333/en | grep -o '<img src="/uploads' | head -3
# Result:
# <img src="/uploads
# <img src="/uploads
# <img src="/uploads
# ✅ All images use correct paths
```

### Visual Verification
Visit these pages and check images load:
- ✅ Homepage: http://localhost:3333/en
- ✅ Ad details: http://localhost:3333/en/ad/[any-ad-slug]
- ✅ Dashboard: http://localhost:3333/en/dashboard (when logged in)
- ✅ Shop pages: http://localhost:3333/en/shop/[shop-slug]

---

## Why This Approach Works

### ✅ Advantages
1. **No hardcoded ports** - Works on any port
2. **No CORS issues** - Same origin (same server)
3. **Works in production** - Relative paths work everywhere
4. **Fast loading** - No external server calls
5. **Simple & clean** - Just `/${path}` instead of `${URL}/${path}`

### 🎯 Production Ready
When deployed to production (e.g., Vercel):
- Next.js serves images from `public/` folder
- Paths like `/uploads/ads/image.png` work automatically
- No configuration needed
- CDN automatically caches images

---

## Other Components Using Images

### Components NOT Changed (Working Correctly)
These components use `NEXT_PUBLIC_API_URL` for **API calls** (not images), which is fine:

1. **ShopSidebar.tsx** - Fetches shop data from `/api/shop/[slug]/*`
2. **ShopProfileClient.tsx** - Uploads avatar/cover to `/api/profile/*`
3. **ImageUpload.tsx** - Handles image uploads
4. **LocationHierarchySelector.tsx** - Fetches location data

These use the API URL for `fetch()` calls, which will now use relative URLs:
```typescript
fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/shop/${shopSlug}/about`)
// Becomes: fetch('/api/shop/${shopSlug}/about')
// ✅ Works perfectly - same server
```

---

## For Production Deployment

### Environment Variables
```bash
# Development (.env)
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=http://localhost:3333

# Production (.env.production)
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=https://thulobazaar.com
```

### Vercel Deployment
Images will be automatically served from:
```
https://thulobazaar.com/uploads/ads/image.png
```

No CDN configuration needed - Vercel handles it automatically!

---

## Summary

### What Was Wrong
- Images trying to load from `http://localhost:5000` (old server)
- Next.js runs on port 3333
- Images couldn't be found

### What Was Fixed
- Changed image URLs to relative paths (`/uploads/...`)
- Images now load from the same Next.js server
- Set `NEXT_PUBLIC_API_URL=` (empty) for relative API calls

### Result
✅ All images now loading correctly
✅ Ad cards display images
✅ Ad detail pages show image gallery
✅ Dashboard shows ad thumbnails
✅ Production-ready configuration

---

**Fix Applied:** October 29, 2025 12:27 PM
**Files Changed:** 4 files (3 components + 1 env file)
**Status:** All images working ✅
