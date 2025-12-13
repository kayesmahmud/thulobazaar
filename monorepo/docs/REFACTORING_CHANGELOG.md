# ThuLoBazaar Refactoring Changelog

**Date:** December 2024
**Commit:** `6bc6c73 Refactor lib folder and fix editor ad-management images`

---

## Overview

Major refactoring of the `lib/` folder to organize code into modular subfolders, fix client/server bundling issues, and resolve API routing problems in the editor dashboard.

---

## Folder Structure Changes

### Before
```
apps/web/src/lib/
├── auth.ts
├── cn.ts
├── consoleFilter.ts
├── editorApi.ts              # Single monolithic file
├── editorNavigation.ts
├── location.ts
├── slug.ts                   # Mixed client/server code
├── themeTransformers.ts
├── themes.ts
├── transformAd.ts
├── url-builder.ts
├── utils.ts                  # Mixed utilities
└── ...
```

### After
```
apps/web/src/lib/
├── ads/                      # Ad-related utilities
│   ├── index.ts
│   ├── client.ts             # Client-safe exports
│   ├── transformAd.ts
│   └── types.ts
├── editorApi/                # Editor API module
│   ├── index.ts
│   ├── client.ts             # Base API client
│   ├── types.ts              # Type definitions
│   ├── dashboard.ts          # Dashboard endpoints
│   ├── ads.ts                # Ad management endpoints
│   ├── users.ts              # User management endpoints
│   ├── verifications.ts      # Verification endpoints
│   └── shops.ts              # Shop endpoints
├── location/                 # Location utilities
│   ├── index.ts
│   ├── types.ts              # Client-safe types
│   └── location.ts           # Server-side functions
├── themes/                   # Theme system
│   ├── index.ts
│   ├── themes.ts
│   └── themeTransformers.ts
├── urls/                     # URL utilities
│   ├── index.ts
│   ├── client.ts             # Client-safe exports
│   ├── builder.ts            # URL building functions
│   ├── slug.ts               # Server-side slug (with Prisma)
│   └── slug-utils.ts         # Client-safe slug utilities
├── utils/                    # General utilities
│   ├── index.ts
│   ├── client.ts             # Client-safe exports
│   └── utils.ts              # Core utilities
├── auth.ts
├── cn.ts
├── consoleFilter.ts
└── editorNavigation.ts
```

---

## Critical Fixes

### 1. Client/Server Bundling Error

**Problem:** Prisma/pg modules were being bundled into client components, causing:
```
Module not found: Can't resolve 'dns'
Module not found: Can't resolve 'net'
Module not found: Can't resolve 'tls'
```

**Root Cause:** Barrel exports (`index.ts`) were importing server-only code that client components then pulled in.

**Solution:** Created separate `client.ts` files with only client-safe exports.

#### `lib/urls/client.ts`
```typescript
// Before: Imported from slug.ts which used Prisma
export { slugify, generateSeoSlug } from './slug';

// After: Imports from client-safe slug-utils.ts
export { buildAdUrl, generateAdListingMetadata } from './builder';
export { slugify, generateSeoSlug } from './slug-utils';
```

#### `lib/urls/slug-utils.ts` (NEW FILE)
```typescript
/**
 * Client-safe slug utilities
 * These functions don't require database access
 */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function generateSeoSlug(title: string, id: number): string {
  const baseSlug = slugify(title);
  const truncatedSlug = baseSlug.slice(0, 50).replace(/-+$/, '');
  return `${truncatedSlug}-${id}`;
}
```

---

### 2. Editor API Not Connecting to Backend

**Problem:** API calls failed with `Request failed: /api/editor/ads?status=pending...`

**Root Cause:** The `buildUrl` function in `editorApi/client.ts` incorrectly routed `/api/` prefixed endpoints to Next.js API routes instead of the backend.

#### `lib/editorApi/client.ts`

**Before:**
```typescript
function buildUrl(endpoint: string, useRelativeUrl?: boolean): string {
  // This was treating all /api/ endpoints as Next.js routes
  if (useRelativeUrl || endpoint.startsWith('/api/')) {
    return endpoint;
  }
  return `${API_BASE}${endpoint}`;
}
```

**After:**
```typescript
function buildUrl(endpoint: string, useRelativeUrl?: boolean): string {
  if (useRelativeUrl) {
    return endpoint;
  }
  return `${API_BASE}${endpoint}`;
}
```

---

### 3. Broken Thumbnail Images

**Problem:** Ad thumbnails in editor ad-management page showed broken image icons.

**Root Cause:** Images are stored in `apps/web/public/uploads/ads/` but the code was trying to load them from the backend API server.

#### `app/[lang]/editor/ad-management/page.tsx`

**Before:**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Image URL pointed to backend
<img
  src={`${API_BASE}/${ad.images[0]}`}
  alt={ad.title}
  className="w-48 h-36 object-cover rounded-lg"
/>
```

**After:**
```typescript
// Removed unused API_BASE for images

// Image URL is relative, served by Next.js from public folder
<img
  src={`/${ad.images[0]}`}
  alt={ad.title}
  className="w-48 h-36 object-cover rounded-lg"
/>
```

**Image Path Example:**
- Database stores: `uploads/ads/1734064800000-image.jpg`
- File location: `apps/web/public/uploads/ads/1734064800000-image.jpg`
- Correct URL: `/uploads/ads/1734064800000-image.jpg` (served by Next.js)

---

## Deleted Files

### `/en/editor/ads-list` Page (Redundant)

The `ads-list` page was removed as its functionality already exists in `ad-management`.

**Deleted folder:**
```
apps/web/src/app/[lang]/editor/ads-list/
├── page.tsx
└── AdsListContent.tsx
```

**Updated navigation** in `lib/editorNavigation.ts`:
```typescript
// Removed entry:
{
  href: `/${lang}/editor/ads-list`,
  icon: 'List',
  label: 'Ads List',
},
```

---

## Type Definition Updates

### `lib/editorApi/types.ts`

Added missing fields to the `Ad` interface:

```typescript
export interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category_name: string;
  location_name: string;
  seller_name: string;
  seller_email: string;
  reviewer_name: string | null;
  // Added fields:
  images?: string[];
  primaryImage?: string | null;
  imageUrl?: string | null;
  slug?: string;
  status_reason?: string | null;
  suspended_until?: string | null;
}
```

---

## Import Path Changes

Components importing from `lib/` should now use:

| Old Import | New Import |
|------------|------------|
| `from '@/lib/editorApi'` | `from '@/lib/editorApi'` (unchanged, uses barrel) |
| `from '@/lib/slug'` | `from '@/lib/urls'` or `from '@/lib/urls/client'` |
| `from '@/lib/url-builder'` | `from '@/lib/urls'` |
| `from '@/lib/transformAd'` | `from '@/lib/ads'` or `from '@/lib/ads/client'` |
| `from '@/lib/location'` | `from '@/lib/location'` |
| `from '@/lib/themes'` | `from '@/lib/themes'` |

### Client Components

For client components (`'use client'`), use the `/client` subpath to avoid bundling server code:

```typescript
// In client components:
import { slugify, buildAdUrl } from '@/lib/urls/client';
import { transformAdToCard } from '@/lib/ads/client';
```

---

## Testing Checklist

After this refactoring, verify:

- [ ] `npm run dev:web` starts without module resolution errors
- [ ] Editor dashboard loads at `/en/editor/dashboard`
- [ ] Ad management shows ads with thumbnails at `/en/editor/ad-management`
- [ ] API calls reach backend (check Network tab, should go to `localhost:5000`)
- [ ] No Prisma/pg modules in client bundle (check for dns/net/tls errors)

---

## Related Files Reference

### Backend API Routes (apps/api)

| Route | File |
|-------|------|
| `/api/editor/ads` | `src/routes/editor/ads.routes.ts` |
| `/api/editor/dashboard/*` | `src/routes/editor.routes.ts` |
| `/api/editor/verifications` | `src/routes/editor/verifications.routes.ts` |

### Database Schema

Images are stored in `ad_images` table:
```sql
SELECT id, ad_id, file_path FROM ad_images;
-- file_path example: 'uploads/ads/1734064800000-image.jpg'
```

---

## Summary

| Change | Impact |
|--------|--------|
| Modular lib/ structure | Better code organization, tree-shaking |
| Client-safe exports | No server code in client bundle |
| Fixed API routing | Editor API calls reach backend |
| Fixed image URLs | Thumbnails load from correct path |
| Removed ads-list | Cleaner navigation, no duplicate pages |
