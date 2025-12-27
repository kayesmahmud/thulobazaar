# 🚀 TypeScript & Next.js 2025 Best Practices

**Updated:** Based on latest 2025 guidelines and industry standards

This document outlines the **latest TypeScript and Next.js best practices for 2025** and shows how this monorepo implements them.

---

## 📋 TypeScript 2025 Best Practices

### ✅ 1. Strict Mode (MUST HAVE)

**Best Practice:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Our Implementation:**
✅ All our `tsconfig.json` files use `"strict": true`

**Files:**
- `packages/types/tsconfig.json`
- `packages/utils/tsconfig.json`
- `packages/api-client/tsconfig.json`
- `apps/web/tsconfig.json`

---

### ✅ 2. Use `unknown` Over `any` (Type Safety)

**❌ BAD - 2024 way:**
```typescript
function processData(data: any) {
  return data.value; // No type safety!
}
```

**✅ GOOD - 2025 way:**
```typescript
function processData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String((data as { value: string }).value);
  }
  throw new Error('Invalid data');
}
```

**Our Implementation:**
✅ We use explicit types throughout
✅ Only `any` in `safeGet` utility (for debugging purposes)

**Example:** `packages/types/src/transformers.ts`

---

### ✅ 3. Template Literal Types (2025 Feature)

**Best Practice:**
```typescript
// Enforce specific string patterns
type AdStatus = 'pending' | 'active' | 'sold' | 'rejected' | 'expired';
type AdId = `ad_${number}`;
type SlugPattern = `${string}-${string}`;

// Template literal types for routes
type Route = `/${string}` | `/en/${string}` | `/ne/${string}`;
```

**Our Implementation:**
✅ We use literal types for status fields
```typescript
// packages/types/src/api.ts
export type AdStatus = 'pending' | 'active' | 'sold' | 'rejected' | 'expired';
export type UserRole = 'user' | 'editor' | 'admin';
export type LocationType = 'province' | 'district' | 'municipality' | 'area' | 'ward';
```

**Enhancement Opportunity:** Add template literal types for IDs and slugs

---

### ✅ 4. Utility Types (Advanced Transformations)

**Best Practice - Use built-in utilities:**
```typescript
// Partial - Make all properties optional
type PartialUser = Partial<User>;

// Pick - Select specific properties
type UserCredentials = Pick<User, 'email' | 'password'>;

// Omit - Exclude specific properties
type UserWithoutPassword = Omit<User, 'password'>;

// Required - Make all properties required
type RequiredUser = Required<User>;

// Record - Create object type with specific keys
type UserMap = Record<number, User>;

// ReturnType - Extract return type
type ApiResult = ReturnType<typeof apiClient.getUser>;
```

**Our Implementation:**
✅ We use `Partial<>` in transformers:
```typescript
// packages/types/src/transformers.ts
export function transformApiUserToDb(apiUser: Partial<User>): Partial<DbUser>
```

**Enhancement:** Can add more utility type usage

---

### ✅ 5. Type Inference (Let TypeScript Work)

**❌ BAD - Over-annotating:**
```typescript
const name: string = "John"; // Redundant
const age: number = 25; // Redundant
const users: User[] = getUsers(); // Redundant if getUsers() is typed
```

**✅ GOOD - Leverage inference:**
```typescript
const name = "John"; // TypeScript infers string
const age = 25; // TypeScript infers number
const users = getUsers(); // Inferred from function return type

// Only annotate when necessary
const data: User[] = []; // Good - can't infer empty array type
```

**Our Implementation:**
✅ We use inference where appropriate
✅ Explicit types where needed (function parameters, empty arrays)

---

### ✅ 6. ESM (ECMAScript Modules) - 2025 Standard

**Best Practice:**
```json
// package.json
{
  "type": "module", // ESM by default
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

**Our Implementation:**
⚠️ **NEEDS UPDATE** - Currently using CommonJS
```json
// Current: packages/types/tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs" // ❌ Old way
  }
}
```

**Action Required:** Update to ESM (see fixes below)

---

### ✅ 7. Avoid Type Assertions (Use Type Guards)

**❌ BAD:**
```typescript
const user = data as User; // Unsafe!
```

**✅ GOOD:**
```typescript
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data
  );
}

if (isUser(data)) {
  console.log(data.email); // Type-safe!
}
```

**Our Implementation:**
✅ We use type guards in transformers
⚠️ Can add more type guards for validation

---

### ✅ 8. Discriminated Unions (Pattern Matching)

**Best Practice:**
```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleResponse<T>(response: ApiResponse<T>) {
  if (response.success) {
    return response.data; // TypeScript knows data exists
  } else {
    throw new Error(response.error); // TypeScript knows error exists
  }
}
```

**Our Implementation:**
✅ We use discriminated unions:
```typescript
// packages/types/src/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```

**Enhancement:** Make it a proper discriminated union (see fixes)

---

## 🌐 Next.js 15 (2025) Best Practices

### ✅ 1. App Router (Not Pages Router)

**Best Practice:**
```
app/
├── layout.tsx          ← Root layout
├── page.tsx           ← Home page
├── [lang]/            ← Dynamic segment
│   ├── layout.tsx     ← Nested layout
│   └── page.tsx       ← Page
└── api/               ← API routes
    └── users/
        └── route.ts   ← Route handler
```

**Our Implementation:**
✅ We use App Router
✅ Correct structure with `app/[lang]/`

**Files:**
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/[lang]/layout.tsx`
- `apps/web/src/app/[lang]/page.tsx`

---

### ✅ 2. React Server Components (RSC)

**Best Practice:**
```typescript
// Server Component (default in App Router)
async function ProductPage({ params }: { params: { id: string } }) {
  // Fetch directly in component
  const product = await fetch(`/api/products/${params.id}`);

  return <ProductDetails product={product} />;
}

// Mark client components explicitly
'use client';
function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Our Implementation:**
✅ Our pages are Server Components by default
⚠️ Need to add `'use client'` to interactive components

**Current:**
```typescript
// apps/web/src/app/[lang]/page.tsx
export default async function HomePage({ params }: HomePageProps) {
  // ✅ Server Component
}
```

**Action Required:** Add client components with `'use client'` directive

---

### ✅ 3. Server Actions (2025 Standard)

**Best Practice:**
```typescript
// app/actions.ts
'use server';

export async function createAd(formData: FormData) {
  const title = formData.get('title');
  const result = await db.insert({ title });
  revalidatePath('/ads');
  return result;
}

// Use in Client Component
'use client';
function AdForm() {
  return (
    <form action={createAd}>
      <input name="title" />
      <button type="submit">Create</button>
    </form>
  );
}
```

**Our Implementation:**
❌ **NOT IMPLEMENTED** - We use traditional API routes

**Action Required:** Add Server Actions for forms (see fixes)

---

### ✅ 4. Data Fetching Patterns

**Best Practice - 2025:**
```typescript
// ✅ Fetch in Server Component
async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 } // ISR - revalidate every hour
  });
  return <div>{data}</div>;
}

// ✅ Parallel data fetching
async function Dashboard() {
  const [users, products, orders] = await Promise.all([
    fetch('/api/users').then(r => r.json()),
    fetch('/api/products').then(r => r.json()),
    fetch('/api/orders').then(r => r.json()),
  ]);

  return <DashboardView users={users} products={products} orders={orders} />;
}

// ✅ Streaming with Suspense
function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <SlowComponent />
    </Suspense>
  );
}
```

**Our Implementation:**
✅ We use async Server Components
⚠️ Need to add ISR and Suspense

---

### ✅ 5. Metadata API (SEO)

**Best Practice:**
```typescript
import { Metadata } from 'next';

// Static metadata
export const metadata: Metadata = {
  title: 'My Page',
  description: 'Page description',
};

// Dynamic metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const ad = await getAd(params.slug);

  return {
    title: `${ad.title} - ThuluBazaar`,
    description: ad.description,
    openGraph: {
      images: ad.images,
    },
  };
}
```

**Our Implementation:**
✅ We have basic metadata in layout
⚠️ Need to add `generateMetadata` for dynamic pages

**Current:**
```typescript
// apps/web/src/app/layout.tsx
export const metadata: Metadata = {
  title: 'ThuluBazaar - Buy & Sell Everything',
  description: 'Nepal\'s leading marketplace',
};
```

**Action Required:** Add dynamic metadata (see fixes)

---

### ✅ 6. Image Optimization

**Best Practice:**
```typescript
import Image from 'next/image';

// ✅ Optimized with automatic WebP conversion
<Image
  src="/product.jpg"
  alt="Product"
  width={500}
  height={300}
  priority={false} // Set true for above-fold images
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// Configure in next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-cdn.com',
      },
    ],
  },
};
```

**Our Implementation:**
✅ We use `next/image` in AdCard
✅ We have remote patterns configured

**Files:**
- `apps/web/src/components/AdCard.tsx`
- `apps/web/next.config.js`

---

### ✅ 7. Route Handlers (API Routes)

**Best Practice - 2025:**
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/users
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  const users = await db.query('SELECT * FROM users WHERE name LIKE $1', [query]);

  return NextResponse.json({ success: true, data: users });
}

// POST /api/users
export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.insert(body);

  return NextResponse.json({ success: true, data: user }, { status: 201 });
}

// With middleware
export const config = {
  matcher: '/api/:path*',
};
```

**Our Implementation:**
❌ **NOT IMPLEMENTED** - No API routes yet

**Action Required:** Add API routes when migrating backend

---

### ✅ 8. Error Handling

**Best Practice:**
```typescript
// app/error.tsx - Error boundary
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// app/not-found.tsx
export default function NotFound() {
  return <div>404 - Page not found</div>;
}

// app/loading.tsx - Loading state
export default function Loading() {
  return <Skeleton />;
}
```

**Our Implementation:**
❌ **NOT IMPLEMENTED**

**Action Required:** Add error.tsx, not-found.tsx, loading.tsx

---

### ✅ 9. Folder Structure (2025 Standard)

**Best Practice:**
```
app/                    ← App Router (pages only)
├── (auth)/            ← Route groups (no URL segment)
│   ├── login/
│   └── register/
├── [lang]/
│   └── page.tsx
└── api/

src/                   ← Application code
├── components/        ← React components
│   ├── ui/           ← Reusable UI
│   └── features/     ← Feature-specific
├── lib/              ← Utilities, helpers
├── hooks/            ← Custom hooks
├── types/            ← Local types (use @thulobazaar/types for shared)
├── actions/          ← Server actions
└── middleware.ts     ← Middleware

public/               ← Static assets
```

**Our Implementation:**
✅ Good structure with `src/`
⚠️ Can improve with route groups and more organization

---

### ✅ 10. Performance Optimization

**Best Practice - 2025:**

#### a) Turbopack (Default in Next.js 15)
```json
// package.json
{
  "scripts": {
    "dev": "next dev --turbo", // Uses Turbopack
    "build": "next build"
  }
}
```

#### b) Code Splitting (Automatic)
```typescript
// Automatic code splitting
import dynamic from 'next/dynamic';

const DynamicComponent = dynamic(() => import('@/components/Heavy'), {
  loading: () => <Skeleton />,
  ssr: false, // Client-side only
});
```

#### c) Lazy Loading
```typescript
import { lazy } from 'react';

const LazyComponent = lazy(() => import('./HeavyComponent'));
```

**Our Implementation:**
⚠️ Not using `--turbo` flag
⚠️ Not using dynamic imports yet

**Action Required:** Add Turbopack and dynamic imports

---

## 🔧 Required Updates to Our Monorepo

### 1. Update to ESM

**packages/types/package.json:**
```json
{
  "name": "@thulobazaar/types",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

**packages/types/tsconfig.json:**
```json
{
  "compilerOptions": {
    "module": "ESNext", // ✅ Updated from "commonjs"
    "moduleResolution": "bundler", // ✅ 2025 standard
    // ... rest
  }
}
```

### 2. Improve ApiResponse Type (Discriminated Union)

**packages/types/src/api.ts:**
```typescript
// ❌ CURRENT
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ✅ IMPROVED - Discriminated Union
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; message?: string };
```

### 3. Add Type Guards

**packages/types/src/guards.ts:** (NEW FILE)
```typescript
import type { User, Ad, Category } from './api';

export function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data &&
    'fullName' in data
  );
}

export function isAd(data: unknown): data is Ad {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data &&
    'price' in data
  );
}
```

### 4. Add Server Actions

**apps/web/src/actions/ads.ts:** (NEW FILE)
```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createAdAction(formData: FormData) {
  // Validate
  const title = formData.get('title') as string;
  const price = Number(formData.get('price'));

  if (!title || !price) {
    return { error: 'Invalid data' };
  }

  // Create ad via API
  const response = await fetch(`${process.env.API_URL}/api/ads`, {
    method: 'POST',
    body: JSON.stringify({ title, price }),
  });

  const data = await response.json();

  // Revalidate and redirect
  revalidatePath('/ads');
  redirect(`/en/ad/${data.slug}`);
}
```

### 5. Add Dynamic Metadata

**apps/web/src/app/[lang]/ad/[slug]/page.tsx:**
```typescript
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface Props {
  params: { slug: string; lang: string };
}

// ✅ Dynamic metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ad = await fetchAdBySlug(params.slug);

  if (!ad) return { title: 'Ad Not Found' };

  return {
    title: `${ad.title} - ThuluBazaar`,
    description: ad.description.substring(0, 160),
    openGraph: {
      title: ad.title,
      description: ad.description,
      images: ad.images,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ad.title,
      description: ad.description,
      images: ad.images,
    },
  };
}

export default async function AdPage({ params }: Props) {
  const ad = await fetchAdBySlug(params.slug);
  if (!ad) notFound();

  return <AdDetail ad={ad} />;
}
```

### 6. Add Error Boundaries

**apps/web/src/app/error.tsx:**
```typescript
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

**apps/web/src/app/not-found.tsx:**
```typescript
export default function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Page not found</p>
    </div>
  );
}
```

**apps/web/src/app/loading.tsx:**
```typescript
export default function Loading() {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}
```

### 7. Add Turbopack Support

**apps/web/package.json:**
```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start"
  }
}
```

---

## ✅ Summary: Our Compliance with 2025 Standards

| Practice | Status | Action Needed |
|----------|--------|---------------|
| **TypeScript Strict Mode** | ✅ Done | None |
| **Avoid `any`** | ✅ Mostly | Review safeGet |
| **Template Literal Types** | ⚠️ Partial | Add for IDs/slugs |
| **Utility Types** | ✅ Done | Can expand usage |
| **Type Inference** | ✅ Done | None |
| **ESM Modules** | ❌ Not done | Update configs |
| **Type Guards** | ⚠️ Partial | Add more guards |
| **Discriminated Unions** | ⚠️ Partial | Update ApiResponse |
| **App Router** | ✅ Done | None |
| **Server Components** | ✅ Done | Add 'use client' where needed |
| **Server Actions** | ❌ Not done | Implement |
| **Dynamic Metadata** | ❌ Not done | Add generateMetadata |
| **Error Handling** | ❌ Not done | Add error.tsx |
| **Turbopack** | ❌ Not done | Update scripts |
| **Image Optimization** | ✅ Done | None |
| **ISR/Caching** | ⚠️ Partial | Add revalidate options |

---

## 📊 Priority Actions

### HIGH PRIORITY:
1. ✅ Keep current strict TypeScript config
2. ✅ Keep App Router structure
3. ❌ Add error.tsx, not-found.tsx, loading.tsx
4. ❌ Add dynamic metadata to ad pages
5. ❌ Update ApiResponse to discriminated union

### MEDIUM PRIORITY:
1. ❌ Migrate to ESM
2. ❌ Add Server Actions
3. ❌ Add type guards
4. ❌ Add Turbopack flag

### LOW PRIORITY:
1. Template literal types for IDs
2. More dynamic imports
3. Expand utility type usage

---

## 🎯 Conclusion

Our monorepo **already follows many 2025 best practices**:
- ✅ TypeScript strict mode
- ✅ App Router architecture
- ✅ Server Components
- ✅ Image optimization
- ✅ Type safety throughout

**Key improvements needed:**
- Add error handling (error.tsx, etc.)
- Add dynamic metadata
- Migrate to ESM
- Add Server Actions
- Update ApiResponse type

**The foundation is solid!** These are enhancements, not critical fixes.

---

## 📚 References

- [TypeScript 2025 Best Practices](https://dev.to/sovannaro/typescript-best-practices-2025-elevate-your-code-quality-1gh3)
- [Next.js 15 Best Practices](https://www.antanaskovic.com/blog/next-js-15-best-practices-unlocking-the-full-potential-of-modern-web-development)
- [React & Next.js 2025 Modern Best Practices](https://strapi.io/blog/react-and-nextjs-in-2025-modern-best-practices)
- [Next.js Official Documentation](https://nextjs.org/docs)
