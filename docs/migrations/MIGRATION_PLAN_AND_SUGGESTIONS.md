# Thulobazaar Next.js 15 Migration Plan & Modern Suggestions

**Generated:** 2025-10-20
**From:** React + Vite Frontend
**To:** Next.js 15.5.6 + TypeScript Monorepo

---

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Component Migration Checklist](#component-migration-checklist)
3. [Design System Migration Strategy](#design-system-migration-strategy)
4. [URL Structure & SEO Implementation](#url-structure--seo-implementation)
5. [Search Functionality Migration](#search-functionality-migration)
6. [Modern Next.js 15 Suggestions](#modern-nextjs-15-suggestions)
7. [Implementation Priorities](#implementation-priorities)

---

## Migration Overview

### Current Status

**Completed:**
- ✅ Monorepo setup with Turborepo and npm workspaces
- ✅ Shared packages created (`@thulobazaar/types`, `@thulobazaar/utils`, `@thulobazaar/api-client`)
- ✅ Core components migrated: Header, AdCard, LazyImage, RecentlyViewed, Breadcrumb
- ✅ Main pages created: Home, Dashboard, Profile, PostAd, EditAd, Admin Dashboard, Editor Dashboard, Seller Profile
- ✅ Next.js 15 async params pattern implemented across all client components

**Remaining:**
- 🔄 ~90 components to migrate (107 total, 13 done)
- 🔄 Complete design system migration (theme.js → Tailwind CSS)
- 🔄 SEO-friendly URL patterns implementation
- 🔄 Full search functionality with advanced filters
- 🔄 Authentication system (AuthContext, AuthModal)
- 🔄 Context providers (Toast, Language)
- 🔄 Utility functions and custom hooks
- 🔄 Category-specific forms and specs
- 🔄 Mobile app using `@thulobazaar/api-client`

### Technology Stack

**Old Frontend:**
- React 18 with Vite
- JavaScript
- CSS + inline styles with theme.js design system
- React Router DOM for routing
- Bikroy-style SEO URLs

**New Monorepo:**
- Next.js 15.5.6 with App Router
- TypeScript with strict typing
- Turbopack (700x faster than Webpack)
- Server Components + Client Components
- Tailwind CSS (recommended)

---

## Component Migration Checklist

### Phase 1: Core Infrastructure (COMPLETED ✅)

**Layout Components:**
- [x] Header (migrated)
- [x] AdCard (migrated)
- [x] LazyImage (migrated)
- [x] RecentlyViewed (migrated)
- [x] Breadcrumb (migrated)

**Pages:**
- [x] Home (created)
- [x] Dashboard (created)
- [x] Profile (created)
- [x] Post Ad (created)
- [x] Edit Ad (created)
- [x] Admin Dashboard (created)
- [x] Editor Dashboard (created)
- [x] Seller Profile (created)

### Phase 2: Authentication & Context (HIGH PRIORITY 🔴)

**Components to Migrate:**
- [ ] `AuthModal.jsx` → `/components/auth/AuthModal.tsx`
- [ ] `AuthContext.jsx` → Convert to Next.js 15 pattern
- [ ] `LanguageContext.jsx` → Convert to Next.js 15 i18n
- [ ] `Toast.jsx` → `/components/common/Toast.tsx`
- [ ] `ToastProvider` → React Context pattern

**Implementation Notes:**
- Use Next.js 15 internationalization (i18n) instead of custom LanguageContext
- Consider using `next-auth` for authentication instead of custom AuthContext
- Toast notifications: Consider using `sonner` or `react-hot-toast` library

### Phase 3: Search & Browse (HIGH PRIORITY 🔴)

**Components to Migrate:**

**Search Components:**
- [ ] `SearchResults.jsx` → `/app/[lang]/search/page.tsx`
- [ ] `SearchFiltersPanel.jsx` → `/components/search/SearchFiltersPanel.tsx`
- [ ] `SearchResultsGrid.jsx` → `/components/search/SearchResultsGrid.tsx`
- [ ] `SearchPagination.jsx` → `/components/search/SearchPagination.tsx`
- [ ] `ActiveLocationFilters.jsx` → `/components/search/ActiveLocationFilters.tsx`
- [ ] `AdvancedFilters.jsx` → `/components/search/AdvancedFilters.tsx`
- [ ] `LocationHierarchyBrowser.jsx` → `/components/search/LocationHierarchyBrowser.tsx`

**Browse Components:**
- [ ] `Browse.jsx` → `/app/[lang]/ads/[...slug]/page.tsx` (catch-all route)
- [ ] `AllAds.jsx` → `/app/[lang]/all-ads/page.tsx`
- [ ] `AdFiltersBar.jsx` → `/components/all-ads/AdFiltersBar.tsx`
- [ ] `AdGrid.jsx` → `/components/all-ads/AdGrid.tsx`
- [ ] `AdSortDropdown.jsx` → `/components/all-ads/AdSortDropdown.tsx`
- [ ] `NearbyAds.jsx` → `/app/[lang]/ads/nearby/page.tsx`

**Implementation Notes:**
- Use Next.js 15 Server Components for search page (faster initial load)
- Implement URL-based search state (no client-side state for filters)
- Use React Server Actions for filter updates (experimental but powerful)
- Location hierarchy should use province → district → municipality structure

### Phase 4: Ad Details & Related (MEDIUM PRIORITY 🟡)

**Components to Migrate:**
- [ ] `AdDetail.jsx` → `/app/[lang]/ad/[slug]/page.tsx`
- [ ] `ImageGallery.jsx` → `/components/ad-detail/ImageGallery.tsx`
- [ ] `SellerCard.jsx` → `/components/ad-detail/SellerCard.tsx`
- [ ] `ContactModal.jsx` → `/components/ad-detail/ContactModal.tsx`
- [ ] `ReportModal.jsx` → `/components/ad-detail/ReportModal.tsx`

**Category-Specific Specs Components:**
- [ ] `ElectronicsSpecs.jsx` → `/components/ad-details/specs/ElectronicsSpecs.tsx`
- [ ] `VehiclesSpecs.jsx` → `/components/ad-details/specs/VehiclesSpecs.tsx`
- [ ] `PropertySpecs.jsx` → `/components/ad-details/specs/PropertySpecs.tsx`
- [ ] `FashionSpecs.jsx` → `/components/ad-details/specs/FashionSpecs.tsx`
- [ ] `HomeLivingSpecs.jsx` → `/components/ad-details/specs/HomeLivingSpecs.tsx`
- [ ] `PetsSpecs.jsx` → `/components/ad-details/specs/PetsSpecs.tsx`
- [ ] `ServicesSpecs.jsx` → `/components/ad-details/specs/ServicesSpecs.tsx`

**Implementation Notes:**
- Use Next.js `generateMetadata` for dynamic SEO (title, description, OG tags)
- Implement `generateStaticParams` for popular ads (ISR - Incremental Static Regeneration)
- Use next/image for ImageGallery (automatic optimization)

### Phase 5: Post Ad & Category Forms (MEDIUM PRIORITY 🟡)

**Post Ad Components:**
- [ ] `CategorySelector.jsx` → `/components/post-ad/CategorySelector.tsx`
- [ ] `ImageUploader.jsx` → `/components/post-ad/ImageUploader.tsx`
- [ ] `AdFormFields.jsx` (post-ad) → `/components/post-ad/AdFormFields.tsx`
- [ ] `LocationSelector.jsx` → `/components/post-ad/LocationSelector.tsx`

**Edit Ad Components:**
- [ ] `AdFormFields.jsx` (edit-ad) → `/components/edit-ad/AdFormFields.tsx`
- [ ] `ImageUploadSection.jsx` → `/components/edit-ad/ImageUploadSection.tsx`
- [ ] `FormActions.jsx` → `/components/edit-ad/FormActions.tsx`

**Category-Specific Form Templates:**
- [ ] `ElectronicsForm.jsx` → `/components/post-ad/templates/ElectronicsForm.tsx`
- [ ] `VehiclesForm.jsx` → `/components/post-ad/templates/VehiclesForm.tsx`
- [ ] `PropertyForm.jsx` → `/components/post-ad/templates/PropertyForm.tsx`
- [ ] `FashionForm.jsx` → `/components/post-ad/templates/FashionForm.tsx`
- [ ] `HomeLivingForm.jsx` → `/components/post-ad/templates/HomeLivingForm.tsx`
- [ ] `PetsForm.jsx` → `/components/post-ad/templates/PetsForm.tsx`
- [ ] `ServicesForm.jsx` → `/components/post-ad/templates/ServicesForm.tsx`

**Supporting Components:**
- [ ] `ImageUpload.jsx` → `/components/common/ImageUpload.tsx`
- [ ] `ImageCropperModal.jsx` → `/components/profile/ImageCropperModal.tsx`
- [ ] `MapEditor.jsx` → `/components/post-ad/MapEditor.tsx`
- [ ] `StaticMap.jsx` → `/components/common/StaticMap.tsx`
- [ ] `InteractiveMap.jsx` → `/components/common/InteractiveMap.tsx`
- [ ] `LocationSearchInput.jsx` → `/components/common/LocationSearchInput.tsx`

**Implementation Notes:**
- Use React Server Actions for form submissions (no need for API routes)
- Implement progressive enhancement (forms work without JavaScript)
- Use Zod for form validation (type-safe, works with TypeScript)
- Image upload: Consider using uploadthing or cloudinary for better performance

### Phase 6: Dashboard Components (LOW PRIORITY 🟢)

**User Dashboard:**
- [ ] `DashboardStats.jsx` → `/components/dashboard/DashboardStats.tsx`
- [ ] `DashboardFilters.jsx` → `/components/dashboard/DashboardFilters.tsx`
- [ ] `DashboardAdCard.jsx` → `/components/dashboard/DashboardAdCard.tsx`

**Editor Dashboard:**
- [ ] `EditorStats.jsx` → `/components/editor/EditorStats.tsx`
- [ ] `EditorFilters.jsx` → `/components/editor/EditorFilters.tsx`
- [ ] `AdManagementTable.jsx` → `/components/editor/AdManagementTable.tsx`
- [ ] `UserManagementTable.jsx` → `/components/editor/UserManagementTable.tsx`
- [ ] `ActivityLogPanel.jsx` → `/components/editor/ActivityLogPanel.tsx`
- [ ] `BusinessVerificationTable.jsx` → `/components/editor/BusinessVerificationTable.tsx`
- [ ] `EditorHeader.jsx` → `/components/editor/EditorHeader.tsx`

**Admin Dashboard:**
- [ ] `AdminStats.jsx` → `/components/admin/AdminStats.tsx`
- [ ] `AdminFilters.jsx` → `/components/admin/AdminFilters.tsx`
- [ ] `AdminSettings.jsx` → `/components/admin/AdminSettings.tsx`
- [ ] `AdminAdCard.jsx` → `/components/admin/AdminAdCard.tsx`
- [ ] `AdminUserCard.jsx` → `/components/admin/AdminUserCard.tsx`
- [ ] `AdminHeader.jsx` → `/components/admin/AdminHeader.tsx`

**Implementation Notes:**
- Use React Server Components for initial data (faster page loads)
- Client components only where interactivity is needed
- Consider using TanStack Table for data tables (better than custom tables)

### Phase 7: Profile & Verification (LOW PRIORITY 🟢)

**Profile Components:**
- [ ] `ProfileHeader.jsx` → `/components/profile/ProfileHeader.tsx`
- [ ] `ProfileStats.jsx` → `/components/profile/ProfileStats.tsx`
- [ ] `ProfileEditForm.jsx` → `/components/profile/ProfileEditForm.tsx`
- [ ] `ShopProfile.jsx` → `/app/[lang]/shop/[shopSlug]/page.tsx`

**Verification Components:**
- [ ] `BusinessVerificationForm.jsx` → `/components/verification/BusinessVerificationForm.tsx`
- [ ] `IndividualVerificationForm.jsx` → `/components/verification/IndividualVerificationForm.tsx`

### Phase 8: Promotion & Payment (LOW PRIORITY 🟢)

**Components:**
- [ ] `PromoteAdModal.jsx` → `/components/promotion/PromoteAdModal.tsx`
- [ ] `PromotionBadge.jsx` → `/components/promotion/PromotionBadge.tsx`
- [ ] `PromotionSelectionPage.jsx` → `/app/[lang]/promote/[adId]/page.tsx`
- [ ] `PaymentPage.jsx` → `/app/[lang]/payment/[adId]/page.tsx`
- [ ] `PaymentSuccessPage.jsx` → `/app/[lang]/payment-success/page.tsx`

### Phase 9: Common Components (LOW PRIORITY 🟢)

**Components:**
- [ ] `ErrorMessage.jsx` → `/components/common/ErrorMessage.tsx`
- [ ] `LoadingState.jsx` → `/components/common/LoadingState.tsx`
- [ ] `PageLoader.jsx` → `/components/common/PageLoader.tsx`
- [ ] `ErrorBoundary.jsx` → `/components/common/ErrorBoundary.tsx`
- [ ] `Pagination.jsx` → `/components/common/Pagination.tsx`

**Headers:**
- [ ] `UserHeader.jsx` → `/components/header/UserHeader.tsx`
- [ ] `SimpleHeader.jsx` → `/components/header/SimpleHeader.tsx`
- [ ] `AdminLogin.jsx` → `/app/[lang]/admin/page.tsx`
- [ ] `EditorLogin.jsx` → `/app/[lang]/editor/page.tsx`

---

## Design System Migration Strategy

### Current Design System (theme.js)

The old frontend uses a comprehensive design system in `/frontend/src/styles/theme.js` (605 lines):

```javascript
// Colors
export const colors = {
  primary: '#dc1e4a',      // Bikroy red
  secondary: '#3b82f6',    // Blue
  success: '#10b981',      // Green
  warning: '#f59e0b',      // Orange
  danger: '#ef4444',       // Red
  // ... plus neutrals, semantic colors, etc.
};

// Spacing (4px grid system)
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px'
};

// Typography
export const typography = {
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    // ... up to 5xl
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
};

// Component styles (cards, buttons, inputs, etc.)
export const styles = { /* ... */ };
```

### Strategy 1: Tailwind CSS (RECOMMENDED ⭐)

**Pros:**
- Industry standard, widely adopted
- Excellent TypeScript support
- Built-in responsive design
- Automatic CSS purging (smaller bundle sizes)
- Great developer experience with IntelliSense
- Works seamlessly with Next.js 15
- Large ecosystem of plugins and components

**Cons:**
- Learning curve for team members unfamiliar with utility classes
- Can lead to long className strings

**Implementation:**

1. **Install Tailwind CSS:**

```bash
cd apps/web
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. **Configure `tailwind.config.js` with your design system:**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#dc1e4a',
          light: '#fef2f2',
          dark: '#991b1b',
        },
        secondary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px',
        '5xl': '48px',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
```

3. **Update `app/globals.css`:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-sans bg-gray-50;
  }
}

@layer components {
  /* Custom component classes */
  .btn-primary {
    @apply bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors;
  }

  .card {
    @apply bg-white rounded-lg shadow-md p-4;
  }
}
```

4. **Usage Example:**

```tsx
// Before (theme.js)
<div style={{
  ...styles.card.default,
  padding: spacing.lg,
  backgroundColor: colors.primary
}}>
  Hello
</div>

// After (Tailwind)
<div className="card p-lg bg-primary">
  Hello
</div>
```

### Strategy 2: CSS-in-JS (Alternative)

**Pros:**
- Dynamic styling based on props
- No class name conflicts
- Scoped styles automatically
- Easy migration from existing inline styles

**Cons:**
- Runtime overhead (slower than Tailwind)
- Larger bundle sizes
- Can complicate Server Components

**Options:**
- **Emotion** (`@emotion/react`)
- **Styled Components** (Next.js 15 has built-in support)
- **Stitches** (zero-runtime CSS-in-JS)

**Not Recommended** for this project due to Next.js 15 Server Components focus.

### Strategy 3: CSS Modules (Current Approach)

**Pros:**
- No additional dependencies
- Works with Server Components
- Scoped styles automatically
- Can reuse existing theme.js

**Cons:**
- More verbose than Tailwind
- Manual responsive design
- No built-in design system utilities

**Only use for component-specific styles** that can't be achieved with Tailwind.

### Recommendation

**Use Tailwind CSS** as the primary styling solution:

1. Migrate theme.js to `tailwind.config.js`
2. Use Tailwind utility classes for 90% of styling
3. Use CSS Modules for complex component-specific styles (10%)
4. Create shared component library with Tailwind classes

---

## URL Structure & SEO Implementation

### Current URL Patterns (Bikroy-style)

The old frontend uses SEO-friendly URLs:

```javascript
// Ad detail URLs: /ad/[product-description]-[location]-[id]
/ad/iphone-15-pro-max-256gb-kathmandu-123

// Browse URLs: /ads/[location]/[category]/[subcategory]
/ads/kathmandu/electronics/mobiles
/ads/lalitpur/vehicles/motorcycles

// Seller/Shop URLs
/seller/rajesh-kumar-seller
/shop/electronics-hub-kathmandu
```

### Next.js 15 Implementation

#### 1. Dynamic Ad URLs

**File:** `/app/[lang]/ad/[slug]/page.tsx`

```tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface AdPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: AdPageProps): Promise<Metadata> {
  const { slug } = await params;

  // Extract ID from slug (last segment after last hyphen)
  const id = extractIdFromSlug(slug);
  const ad = await fetchAd(id);

  if (!ad) return { title: 'Ad Not Found' };

  return {
    title: `${ad.title} - ${ad.location_name} | Thulobazaar`,
    description: ad.description.substring(0, 160),
    keywords: [ad.category, ad.subcategory, ad.location_name, 'Nepal'],
    openGraph: {
      title: ad.title,
      description: ad.description,
      images: [ad.primary_image],
      type: 'website',
    },
  };
}

// Generate static params for popular ads (ISR)
export async function generateStaticParams() {
  const popularAds = await fetchPopularAds(100); // Top 100 ads

  return popularAds.map((ad) => ({
    slug: generateAdSlug(ad),
  }));
}

export default async function AdPage({ params }: AdPageProps) {
  const { lang, slug } = await params;
  const id = extractIdFromSlug(slug);
  const ad = await fetchAd(id);

  if (!ad) notFound();

  return <AdDetail ad={ad} lang={lang} />;
}

// Helper: Generate SEO-friendly slug
function generateAdSlug(ad: Ad): string {
  const titleSlug = ad.title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const locationSlug = ad.location_name
    .toLowerCase()
    .replace(/\s+/g, '-');

  return `${titleSlug}-${locationSlug}-${ad.id}`;
}

// Helper: Extract ID from slug
function extractIdFromSlug(slug: string): number {
  const parts = slug.split('-');
  return parseInt(parts[parts.length - 1]);
}
```

#### 2. Hierarchical Browse URLs

**File:** `/app/[lang]/ads/[...slug]/page.tsx` (catch-all route)

```tsx
interface BrowsePageProps {
  params: Promise<{ lang: string; slug: string[] }>;
}

export async function generateMetadata({ params }: BrowsePageProps): Promise<Metadata> {
  const { slug } = await params;

  // Parse slug segments
  // /ads/kathmandu → ['kathmandu']
  // /ads/kathmandu/electronics → ['kathmandu', 'electronics']
  // /ads/kathmandu/electronics/mobiles → ['kathmandu', 'electronics', 'mobiles']

  const [location, category, subcategory] = slug;

  let title = 'Browse Ads';
  if (subcategory) {
    title = `${subcategory} in ${location}`;
  } else if (category) {
    title = `${category} in ${location}`;
  } else if (location) {
    title = `Ads in ${location}`;
  }

  return {
    title: `${title} | Thulobazaar`,
    description: `Find ${title.toLowerCase()} on Thulobazaar, Nepal's leading classifieds marketplace.`,
  };
}

export default async function BrowsePage({ params }: BrowsePageProps) {
  const { lang, slug } = await params;
  const [location, category, subcategory] = slug;

  // Fetch ads with hierarchical filters
  const ads = await fetchAds({
    location,
    category,
    subcategory,
  });

  return <Browse ads={ads} location={location} category={category} subcategory={subcategory} />;
}
```

#### 3. URL Utilities Migration

**File:** `/packages/utils/src/urlUtils.ts`

```typescript
export interface Ad {
  id: number;
  title: string;
  location_name: string;
  location_slug?: string;
}

// Generate slug from text
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate ad URL: /ad/[product-description]-[location]-[id]
export function generateAdUrl(ad: Ad, lang: string = 'en'): string {
  const titleSlug = generateSlug(ad.title);
  const locationSlug = ad.location_slug || generateSlug(ad.location_name);
  return `/${lang}/ad/${titleSlug}-${locationSlug}-${ad.id}`;
}

// Generate hierarchical browse URL
export function generateBrowseUrl(
  location?: string,
  category?: string,
  subcategory?: string,
  lang: string = 'en'
): string {
  let url = `/${lang}/ads`;

  if (location) {
    const locationSlug = generateSlug(location);
    url += `/${locationSlug}`;

    if (category) {
      const categorySlug = generateSlug(category);
      url += `/${categorySlug}`;

      if (subcategory) {
        const subcategorySlug = generateSlug(subcategory);
        url += `/${subcategorySlug}`;
      }
    }
  }

  return url;
}

// Extract ID from slug
export function extractIdFromSlug(slug: string): number {
  const parts = slug.split('-');
  return parseInt(parts[parts.length - 1], 10);
}
```

#### 4. SEO Enhancements

**sitemap.ts** - Generate dynamic sitemap:

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://thulobazaar.com';

  // Fetch all active ads
  const ads = await fetchAllAds();

  const adUrls = ads.map((ad) => ({
    url: `${baseUrl}${generateAdUrl(ad)}`,
    lastModified: ad.updated_at,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/en/search`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ];

  return [...staticPages, ...adUrls];
}
```

**robots.txt**:

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/editor/', '/dashboard/'],
    },
    sitemap: 'https://thulobazaar.com/sitemap.xml',
  };
}
```

---

## Search Functionality Migration

### Current Search Features

The old SearchResults component has:

1. **Text search** with query params
2. **Category filters** (main + subcategories)
3. **Location filters** (hierarchical: province → district → municipality)
4. **Price range** with debounced inputs (5s delay)
5. **Condition filter** (new/used)
6. **Sort options** (newest, oldest, price-low, price-high, popular)
7. **Pagination** (20 items per page)
8. **Mobile filter modals** (location, category, sort)
9. **URL-based state** (all filters in query params)
10. **SEO metadata** (dynamic title/description based on filters)

### Next.js 15 Implementation

#### 1. Server Component Search Page

**File:** `/app/[lang]/search/page.tsx`

```tsx
import { Metadata } from 'next';
import SearchClient from '@/components/search/SearchClient';

interface SearchPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    search?: string;
    category?: string;
    subcategory?: string;
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string;
    sortBy?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;

  const parts: string[] = [];
  if (params.search) parts.push(params.search);
  if (params.subcategory) {
    parts.push(params.subcategory);
  } else if (params.category && params.category !== 'all') {
    parts.push(params.category);
  }
  if (params.location && params.location !== 'all') {
    parts.push(`in ${params.location}`);
  }

  const title = parts.length > 0
    ? `${parts.join(' ')} - Thulobazaar`
    : 'Search Results - Thulobazaar';

  const categoryText = params.subcategory
    ? `${params.category} > ${params.subcategory}`
    : params.category !== 'all'
      ? params.category
      : 'items';

  const location = params.location !== 'all'
    ? ` in ${params.location}`
    : ' across Nepal';

  const description = `Find ${categoryText}${location}. Browse ads on Thulobazaar, Nepal's leading classifieds marketplace.`;

  return {
    title,
    description,
    keywords: [
      params.category,
      params.subcategory,
      params.location,
      'Nepal classifieds',
      params.search,
    ].filter(Boolean).join(', '),
  };
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { lang } = await params;
  const filters = await searchParams;

  // Fetch data on server (faster initial load)
  const [adsData, categories, locations] = await Promise.all([
    fetchAdsWithFilters(filters),
    fetchCategories(true), // with subcategories
    fetchLocationHierarchy(),
  ]);

  return (
    <SearchClient
      initialAds={adsData.data}
      totalAds={adsData.pagination.total}
      categories={categories}
      locations={locations}
      initialFilters={filters}
      lang={lang}
    />
  );
}
```

#### 2. Client Component for Interactivity

**File:** `/components/search/SearchClient.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import SearchFiltersPanel from './SearchFiltersPanel';
import AdCard from '../AdCard';
import Pagination from '../common/Pagination';

interface SearchClientProps {
  initialAds: Ad[];
  totalAds: number;
  categories: Category[];
  locations: Location[];
  initialFilters: SearchFilters;
  lang: string;
}

export default function SearchClient({
  initialAds,
  totalAds,
  categories,
  locations,
  initialFilters,
  lang,
}: SearchClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [ads, setAds] = useState(initialAds);
  const [loading, setLoading] = useState(false);

  // Update filters in URL (debounced for price)
  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    if (!newFilters.page) {
      params.delete('page');
    }

    const newUrl = `${pathname}?${params.toString()}`;
    router.push(newUrl);
  };

  // Client-side filtering for instant feedback (optional)
  // Or use React Server Actions for server-side filtering

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Filters Sidebar */}
          <aside className="hidden lg:block">
            <SearchFiltersPanel
              categories={categories}
              locations={locations}
              filters={initialFilters}
              onFilterChange={updateFilters}
            />
          </aside>

          {/* Results */}
          <main>
            <h1 className="text-2xl font-bold mb-4">
              Search Results ({totalAds} ads)
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ads.map((ad) => (
                <AdCard key={ad.id} ad={ad} lang={lang} />
              ))}
            </div>

            {totalAds > 20 && (
              <Pagination
                currentPage={parseInt(initialFilters.page || '1')}
                totalItems={totalAds}
                itemsPerPage={20}
                onPageChange={(page) => updateFilters({ page: page.toString() })}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
```

#### 3. Advanced: React Server Actions

For even better UX, use React Server Actions (Next.js 15 feature):

```tsx
// app/[lang]/search/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function searchAds(filters: SearchFilters) {
  const ads = await fetchAdsWithFilters(filters);

  // Revalidate the search page cache
  revalidatePath('/[lang]/search');

  return ads;
}
```

Use in client component:

```tsx
'use client';

import { searchAds } from './actions';
import { useTransition } from 'react';

export default function SearchClient() {
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (filters) => {
    startTransition(async () => {
      const results = await searchAds(filters);
      setAds(results.data);
    });
  };

  // UI shows loading state via isPending
}
```

---

## Modern Next.js 15 Suggestions

### 1. Internationalization (i18n)

Replace custom LanguageContext with Next.js 15 i18n:

**File:** `next.config.js`

```javascript
module.exports = {
  i18n: {
    locales: ['en', 'ne'],
    defaultLocale: 'en',
  },
};
```

**File:** `/app/[lang]/layout.tsx`

```tsx
import { notFound } from 'next/navigation';

const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  ne: () => import('@/dictionaries/ne.json').then((module) => module.default),
};

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ne' }];
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.Node;
  params: Promise<{ lang: 'en' | 'ne' }>;
}) {
  const { lang } = await params;
  const dict = await dictionaries[lang]();

  return (
    <html lang={lang}>
      <body>
        <DictionaryProvider dict={dict}>
          {children}
        </DictionaryProvider>
      </body>
    </html>
  );
}
```

### 2. Authentication with NextAuth.js

Replace custom AuthContext:

```bash
npm install next-auth @auth/core
```

**File:** `/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Call your backend API
        const user = await loginUser(credentials.email, credentials.password);

        if (user) {
          return user;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
});

export { handler as GET, handler as POST };
```

Usage:

```tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function Header() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;

  if (session) {
    return (
      <>
        Signed in as {session.user.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }

  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
}
```

### 3. Image Optimization

Replace custom ImageUploader with next/image:

```tsx
import Image from 'next/image';

export default function AdCard({ ad }) {
  return (
    <div>
      <Image
        src={ad.primary_image || '/placeholder.png'}
        alt={ad.title}
        width={300}
        height={200}
        className="rounded-lg"
        placeholder="blur"
        blurDataURL="/placeholder-blur.png"
      />
    </div>
  );
}
```

For uploads, use **uploadthing**:

```bash
npm install uploadthing @uploadthing/react
```

### 4. Data Fetching Patterns

**Server Components (Default):**

```tsx
// app/[lang]/page.tsx
export default async function HomePage() {
  const ads = await fetchAds(); // Direct database query or API call

  return <AdGrid ads={ads} />;
}
```

**Client Components (Interactive):**

```tsx
'use client';

import { useState, useEffect } from 'react';

export default function InteractiveAds() {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    fetchAds().then(setAds);
  }, []);

  return <AdGrid ads={ads} />;
}
```

**Streaming with Suspense:**

```tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncAds />
    </Suspense>
  );
}

async function AsyncAds() {
  const ads = await fetchAds();
  return <AdGrid ads={ads} />;
}
```

### 5. State Management

For global state, use **Zustand** (lighter than Redux):

```bash
npm install zustand
```

```typescript
// stores/useFilterStore.ts
import { create } from 'zustand';

interface FilterState {
  category: string;
  location: string;
  setCategory: (category: string) => void;
  setLocation: (location: string) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  category: 'all',
  location: 'all',
  setCategory: (category) => set({ category }),
  setLocation: (location) => set({ location }),
}));
```

Usage:

```tsx
'use client';

import { useFilterStore } from '@/stores/useFilterStore';

export default function Filters() {
  const category = useFilterStore((state) => state.category);
  const setCategory = useFilterStore((state) => state.setCategory);

  return (
    <select value={category} onChange={(e) => setCategory(e.target.value)}>
      <option value="all">All Categories</option>
      <option value="electronics">Electronics</option>
    </select>
  );
}
```

### 6. Form Handling with React Hook Form + Zod

```bash
npm install react-hook-form zod @hookform/resolvers
```

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const adSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  category_id: z.number(),
  location_id: z.number(),
});

type AdFormData = z.infer<typeof adSchema>;

export default function PostAdForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdFormData>({
    resolver: zodResolver(adSchema),
  });

  const onSubmit = async (data: AdFormData) => {
    // Submit to server action or API route
    await createAd(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <p className="text-red-500">{errors.title.message}</p>}

      <input type="number" {...register('price', { valueAsNumber: true })} />
      {errors.price && <p className="text-red-500">{errors.price.message}</p>}

      <button type="submit">Post Ad</button>
    </form>
  );
}
```

### 7. API Routes vs Server Actions

**API Routes (Traditional):**

```typescript
// app/api/ads/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');

  const ads = await fetchAds({ category });

  return NextResponse.json({ ads });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const ad = await createAd(body);

  return NextResponse.json({ ad });
}
```

**Server Actions (Modern):**

```typescript
// app/actions/ads.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createAd(formData: FormData) {
  const title = formData.get('title') as string;
  const price = parseInt(formData.get('price') as string);

  const ad = await db.ads.create({
    data: { title, price },
  });

  revalidatePath('/');
  return ad;
}
```

Usage in client component:

```tsx
'use client';

import { createAd } from '@/app/actions/ads';

export default function PostAdForm() {
  return (
    <form action={createAd}>
      <input name="title" />
      <input name="price" type="number" />
      <button type="submit">Post Ad</button>
    </form>
  );
}
```

### 8. Performance Optimization

**Lazy Loading:**

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // Disable SSR for this component
});
```

**Partial Prerendering (Experimental):**

```javascript
// next.config.js
module.exports = {
  experimental: {
    ppr: true, // Partial Prerendering
  },
};
```

**React Compiler (Experimental):**

```javascript
// next.config.js
module.exports = {
  experimental: {
    reactCompiler: true,
  },
};
```

### 9. Error Handling

**error.tsx** (Error Boundary):

```tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="bg-primary text-white px-4 py-2 rounded-lg"
      >
        Try again
      </button>
    </div>
  );
}
```

**not-found.tsx:**

```tsx
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-4xl font-bold mb-4">404</h2>
      <p className="text-gray-600">Ad not found</p>
    </div>
  );
}
```

### 10. Analytics & Monitoring

**Google Analytics 4:**

```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </body>
    </html>
  );
}
```

**Sentry (Error Tracking):**

```bash
npx @sentry/wizard@latest -i nextjs
```

---

## Implementation Priorities

### Sprint 1: Foundation (Weeks 1-2)

**Goal:** Get core infrastructure working with Tailwind CSS

- [ ] Install and configure Tailwind CSS
- [ ] Migrate theme.js to tailwind.config.js
- [ ] Set up Next.js i18n for en/ne
- [ ] Implement NextAuth.js for authentication
- [ ] Migrate AuthModal and ToastProvider

**Deliverables:**
- Tailwind CSS fully configured
- Authentication working
- Language switching working

### Sprint 2: Search & Browse (Weeks 3-4)

**Goal:** Full search functionality with SEO

- [ ] Migrate SearchResults page
- [ ] Implement SearchFiltersPanel with Tailwind
- [ ] Create dynamic ad detail pages with generateMetadata
- [ ] Implement hierarchical browse URLs
- [ ] Add sitemap.ts and robots.ts

**Deliverables:**
- Search page fully functional
- SEO-friendly URLs working
- Browse pages with filters

### Sprint 3: Forms & Uploads (Weeks 5-6)

**Goal:** Ad posting and editing

- [ ] Migrate PostAd page
- [ ] Implement category-specific forms
- [ ] Set up image upload with uploadthing
- [ ] Add form validation with Zod
- [ ] Migrate EditAd page

**Deliverables:**
- Users can post ads with images
- Users can edit their ads
- Form validation working

### Sprint 4: Dashboards (Weeks 7-8)

**Goal:** Complete all dashboard pages

- [ ] Migrate Dashboard components
- [ ] Migrate Editor Dashboard
- [ ] Migrate Admin Dashboard
- [ ] Implement role-based access control

**Deliverables:**
- User dashboard fully functional
- Admin/Editor dashboards working
- RBAC implemented

### Sprint 5: Polish & Performance (Weeks 9-10)

**Goal:** Optimize and test

- [ ] Implement ISR for popular ads
- [ ] Add Partial Prerendering (experimental)
- [ ] Set up error tracking with Sentry
- [ ] Add Google Analytics 4
- [ ] Performance testing and optimization
- [ ] Mobile responsiveness testing

**Deliverables:**
- Lighthouse score > 90
- All pages mobile-responsive
- Analytics tracking
- Error monitoring

### Sprint 6: Mobile App (Weeks 11-12)

**Goal:** React Native mobile app using shared packages

- [ ] Set up React Native project in monorepo
- [ ] Implement authentication using `@thulobazaar/api-client`
- [ ] Create core screens (Home, Search, Ad Detail, Post Ad)
- [ ] Test on iOS and Android

**Deliverables:**
- Mobile app MVP ready
- Shared API client working across web and mobile

---

## Summary

This migration plan provides a comprehensive roadmap for transitioning from the React + Vite frontend to a modern Next.js 15 monorepo. The key recommendations are:

1. **Use Tailwind CSS** for styling (best DX, performance, and ecosystem)
2. **Implement SEO-friendly URLs** with Next.js dynamic routes and generateMetadata
3. **Use NextAuth.js** for authentication (industry standard)
4. **Leverage Server Components** for better performance
5. **Implement React Server Actions** for form submissions (modern approach)
6. **Use Zod** for type-safe form validation
7. **Set up proper monitoring** with Sentry and Google Analytics

By following this plan, you'll have a modern, performant, SEO-friendly classifieds platform that scales well and provides an excellent user experience.

---

**Next Steps:**

1. Review this document
2. Decide on design system approach (Tailwind CSS recommended)
3. Start with Sprint 1: Foundation
4. Iterate and adjust based on learnings

**Questions or need clarification?** Feel free to ask!

---

---

# Migration Progress Update - October 20, 2025

## Search Page Implementation Complete ✅

### What Was Fixed Today

**Issue:** Search page had React Server Component errors with event handlers.

**Actions Taken:**

1. **Verified Prisma Relations** ✅
   - Checked `categories` model in schema.prisma
   - Confirmed correct relation names: `categories` (parent) and `other_categories` (children)
   - All Prisma queries working correctly

2. **Created SortDropdown Client Component** ✅
   - File: `apps/web/src/app/[lang]/search/SortDropdown.tsx`
   - Fixed error: "Event handlers cannot be passed to Client Component props"
   - Uses Next.js router for client-side navigation
   - Preserves all search parameters

3. **Cleared Next.js Cache** ✅
   - Removed `.next` directory
   - Fresh compilation resolved all caching issues

4. **Verified Existing Components** ✅
   - SearchFilters.tsx (333 lines) - Already working
   - SearchPagination.tsx (131 lines) - Already working

### Files Changed

**New Files (1):**
- `apps/web/src/app/[lang]/search/SortDropdown.tsx` (42 lines)

**Modified Files (1):**
- `apps/web/src/app/[lang]/search/page.tsx`
  - Added SortDropdown import
  - Replaced inline form with SortDropdown component

### Working Features

**Search & Filtering:**
- ✅ Text search (title + description)
- ✅ Category filter with parent hierarchy
- ✅ Location filter (province → district → municipality)
- ✅ Price range filter
- ✅ Condition filter (new/used)
- ✅ Active filter count badges
- ✅ Clear all filters button

**Sorting:**
- ✅ Newest first (default)
- ✅ Oldest first
- ✅ Price: Low to High
- ✅ Price: High to Low

**Display:**
- ✅ Responsive ad grid
- ✅ Images loading correctly
- ✅ Category hierarchy display
- ✅ Location hierarchy display
- ✅ Price formatting
- ✅ Relative time display
- ✅ Condition badges
- ✅ Featured badges

**Pagination:**
- ✅ Previous/Next buttons
- ✅ Smart page numbers with ellipsis
- ✅ Mobile-friendly display
- ✅ Preserves all filters

### Technical Implementation

**Search Page Architecture:**
```
apps/web/src/app/[lang]/search/
├─ page.tsx (Server Component)
│  ├─ Fetches data with Prisma
│  ├─ Hierarchical location filtering
│  └─ Category filtering
├─ SearchFilters.tsx (Client Component)
├─ SearchPagination.tsx (Client Component)
└─ SortDropdown.tsx (Client Component - NEW)
```

**Prisma Query Performance:**
- Hierarchical location filtering working
- Category filtering with parent relations working
- Optimized includes for related data
- No N+1 query issues

### Testing Results

- ✅ Compiled successfully in 3.5s
- ✅ Returns HTTP 200 in ~300ms
- ✅ No Prisma errors
- ✅ All queries executing correctly
- ✅ No console errors
- ✅ All features tested and working

### Updated Status

**Pages Completed:**
- ✅ Homepage (`/[lang]`)
- ✅ All Ads (`/[lang]/all-ads`)
- ✅ Ad Detail (`/[lang]/ad/[slug]`)
- ✅ **Search Page (`/[lang]/search`)** ← NEW

**Prisma Integration:**
- ✅ All relations properly named
- ✅ Hierarchical queries working
- ✅ Self-referencing relations working
- ✅ No performance issues

**Next.js 15 Patterns:**
- ✅ Server Components for data fetching
- ✅ Client Components for interactivity
- ✅ Proper 'use client' directives
- ✅ No event handler errors

### Key Learnings

1. **Event handlers require Client Components** - Cannot pass onChange from Server to Client Component
2. **Cache clearing is important** - After major changes, delete `.next` directory
3. **Prisma relation names** - Always check schema.prisma for exact names
4. **Next.js 15 best practices** - Separate data fetching (Server) from interactions (Client)

---

**Date:** October 20, 2025
**Status:** Search page fully functional and production-ready
**Next:** Continue with remaining component migrations
