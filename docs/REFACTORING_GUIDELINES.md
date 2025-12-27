# ThuLoBazaar Refactoring Guidelines

**Version:** 1.0.0
**Last Updated:** December 2024
**Stack:** Next.js 15, Express.js, PostgreSQL, Prisma, TypeScript, TailwindCSS

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [File Size Limits](#2-file-size-limits)
3. [Page Refactoring Pattern](#3-page-refactoring-pattern)
4. [Component Guidelines](#4-component-guidelines)
5. [Custom Hooks](#5-custom-hooks)
6. [TypeScript Best Practices](#6-typescript-best-practices)
7. [Database & Prisma](#7-database--prisma)
8. [API Layer Design](#8-api-layer-design)
9. [Service Layer](#9-service-layer)
10. [Performance Optimization](#10-performance-optimization)
11. [Security Guidelines](#11-security-guidelines)
12. [Code Quality](#12-code-quality)

---

## 1. Project Structure

### 1.1 Monorepo Structure

```
monorepo/
├── apps/
│   ├── web/                          # Next.js 15 frontend (port 3333)
│   │   ├── src/
│   │   │   ├── app/[lang]/           # Internationalized routes
│   │   │   │   ├── (public)/         # Public routes
│   │   │   │   ├── dashboard/        # User dashboard
│   │   │   │   ├── editor/           # Editor dashboard
│   │   │   │   ├── super-admin/      # Super admin dashboard
│   │   │   │   └── layout.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/               # Reusable UI components
│   │   │   │   ├── ads/              # Ad-related components
│   │   │   │   ├── forms/            # Form components
│   │   │   │   ├── layout/           # Layout components
│   │   │   │   ├── admin/            # Admin components
│   │   │   │   └── editor/           # Editor components
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── lib/                  # Utilities & services
│   │   │   │   ├── auth/             # Auth utilities
│   │   │   │   ├── sms/              # SMS integration
│   │   │   │   ├── paymentGateways/  # Payment services
│   │   │   │   └── navigation/       # Nav configurations
│   │   │   ├── contexts/             # React contexts
│   │   │   └── types/                # TypeScript types
│   │   └── public/
│   ├── api/                          # Express backend (port 5000)
│   │   └── src/
│   │       ├── routes/
│   │       ├── middleware/
│   │       └── services/
│   └── mobile/                       # React Native app
├── packages/
│   ├── types/                        # Shared TypeScript types
│   ├── api-client/                   # API client library
│   └── database/                     # Prisma schema & migrations
└── docs/                             # Documentation
```

### 1.2 Page-Level Structure (Refactored)

When a page exceeds 200 lines, refactor into this structure:

```
app/[lang]/super-admin/financial/
├── page.tsx                    # Main page component (< 150 lines)
├── types.ts                    # TypeScript interfaces & constants
├── useFinancialStats.ts        # Custom hook for data/logic
└── components/
    ├── index.ts                # Barrel exports
    ├── FilterSection.tsx       # Filter controls
    ├── SummaryCards.tsx        # Stats cards
    ├── DataTable.tsx           # Data table
    └── ChartSection.tsx        # Charts/visualizations
```

### 1.3 File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase.tsx | `UserProfile.tsx` |
| Custom Hooks | useCamelCase.ts | `useLocalStorage.ts` |
| Types/Interfaces | types.ts or camelCase.ts | `types.ts`, `apiTypes.ts` |
| Utilities | camelCase.ts | `formatDate.ts` |
| Constants | UPPER_SNAKE_CASE | `API_ENDPOINTS` |

### 1.4 Import Order

```typescript
// 1. React & Next.js
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { format } from 'date-fns';

// 3. Internal packages (@thulobazaar/*)
import { transformDbUserToApi } from '@thulobazaar/types';

// 4. Internal aliases (@/*)
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';

// 5. Relative imports (local)
import { useFinancialStats } from './useFinancialStats';
import { FilterSection, SummaryCards } from './components';
import type { FinancialStats } from './types';
```

---

## 2. File Size Limits

### 2.1 Maximum Line Counts

| File Type | Max Lines | Action When Exceeded |
|-----------|-----------|---------------------|
| Page Components | 200 | Extract to types.ts + useXxx.ts + components/ |
| React Components | 300 | Extract subcomponents or hooks |
| Custom Hooks | 150 | Split logic into multiple hooks |
| API Route Handlers | 200 | Extract to services |
| Service Files | 400 | Split into domain-specific services |
| Type Files | 200 | Split by domain |
| Utility Files | 150 | Group related functions |

### 2.2 Component Complexity Triggers

Refactor when a component has:
- More than 5 `useState` hooks
- More than 3 `useEffect` hooks
- Nested conditionals deeper than 3 levels
- More than 3 responsibilities
- JSX longer than 150 lines

---

## 3. Page Refactoring Pattern

### 3.1 Standard Structure

**types.ts** - Interfaces, types, constants
```typescript
// Types
export interface FinancialStats {
  summary: { totalRevenue: number; /* ... */ };
  dailyRevenue: DailyRevenue[];
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  transactions: number;
}

// Constants
export const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  // ...
] as const;

export type PeriodType = typeof PERIOD_OPTIONS[number]['value'];

// Utility functions specific to this page
export const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString('en-NP', { minimumFractionDigits: 2 })}`;
};
```

**useXxx.ts** - Custom hook for data fetching and state management
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import type { FinancialStats, PeriodType } from './types';

interface UseFinancialStatsReturn {
  stats: FinancialStats | null;
  loading: boolean;
  period: PeriodType;
  setPeriod: (period: PeriodType) => void;
  refresh: () => Promise<void>;
  handleLogout: () => Promise<void>;
}

export function useFinancialStats(lang: string): UseFinancialStatsReturn {
  const router = useRouter();
  const { staff, isLoading, logout } = useStaffAuth();

  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('30days');

  const loadStats = useCallback(async () => {
    // Fetch logic...
  }, [period]);

  useEffect(() => {
    if (!isLoading && staff) {
      loadStats();
    }
  }, [isLoading, staff, loadStats]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  }, [logout, router, lang]);

  return { stats, loading, period, setPeriod, refresh: loadStats, handleLogout };
}
```

**components/index.ts** - Barrel exports
```typescript
export { default as FilterSection } from './FilterSection';
export { default as SummaryCards } from './SummaryCards';
export { default as DataTable } from './DataTable';
```

**page.tsx** - Clean, orchestrating component
```typescript
'use client';

import { use } from 'react';
import { DashboardLayout } from '@/components/admin';
import { getSuperAdminNavSections } from '@/lib/navigation';
import { useFinancialStats } from './useFinancialStats';
import { FilterSection, SummaryCards, DataTable } from './components';

export default function FinancialPage({
  params: paramsPromise
}: {
  params: Promise<{ lang: string }>
}) {
  const params = use(paramsPromise);
  const { stats, loading, period, setPeriod, handleLogout } = useFinancialStats(params.lang);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <FilterSection period={period} onPeriodChange={setPeriod} />
      {stats && <SummaryCards summary={stats.summary} />}
      {stats && <DataTable data={stats.dailyRevenue} />}
    </DashboardLayout>
  );
}
```

---

## 4. Component Guidelines

### 4.1 Component Structure

```typescript
'use client'; // Only if needed

import React, { useState, useCallback, memo } from 'react';
import type { User } from '@/types';

// Props interface - always define
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  isAdmin?: boolean;
}

// Use memo for expensive renders
export default function UserCard({
  user,
  onEdit,
  onDelete,
  isAdmin = false,
}: UserCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Memoize callbacks that are passed to children
  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDelete(user.id);
    } finally {
      setIsDeleting(false);
    }
  }, [user.id, onDelete]);

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="font-semibold text-gray-900">{user.name}</h3>
      <p className="text-gray-600">{user.email}</p>

      {isAdmin && (
        <div className="flex gap-2 mt-4">
          <button onClick={() => onEdit(user.id)}>Edit</button>
          <button onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  );
}
```

### 4.2 Component Categories

| Folder | Purpose | Examples |
|--------|---------|----------|
| `ui/` | Reusable, generic components | Button, Input, Modal, Card |
| `forms/` | Form-specific components | LoginForm, ImageUpload |
| `layout/` | Layout components | Header, Sidebar, Footer |
| `ads/` | Ad-related components | AdCard, AdsFilter |
| `admin/` | Admin dashboard components | DashboardLayout, StatsCard |
| `editor/` | Editor dashboard components | EditorModal, EditorTabs |

### 4.3 Export Patterns

Use barrel exports (index.ts) for folders:

```typescript
// components/ui/index.ts
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Modal } from './Modal';
export { StatusBadge } from './StatusBadge';

// Usage
import { Button, Input, Modal } from '@/components/ui';
```

---

## 5. Custom Hooks

### 5.1 Hook Naming Convention

```typescript
// Data fetching hooks
useUsers()
useFinancialStats()
useCategories()

// State management hooks
useLocalStorage()
useDebounce()
useToggle()

// Feature-specific hooks
useAuth()
useEditorAuth()
useStaffAuth()
```

### 5.2 Hook Structure

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useData<T>(endpoint: string): UseDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
```

---

## 6. TypeScript Best Practices

### 6.1 Type Definitions

```typescript
// Use interfaces for object shapes
interface User {
  id: number;
  email: string;
  fullName: string;
  createdAt: string;
}

// Use type for unions and intersections
type UserRole = 'admin' | 'editor' | 'user';
type UserWithRole = User & { role: UserRole };

// Use const assertions for fixed values
const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const;

type Status = typeof STATUS[keyof typeof STATUS];
```

### 6.2 API Response Types

```typescript
// Generic API response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Paginated response
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 6.3 Avoid `any`

```typescript
// Bad
const handleData = (data: any) => { /* ... */ };

// Good
const handleData = (data: unknown) => {
  if (isUser(data)) {
    // TypeScript now knows data is User
  }
};

// Type guard
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data
  );
}
```

---

## 7. Database & Prisma

### 7.1 Snake_case to camelCase Transformation

**Critical Rule:** Database uses snake_case, JavaScript uses camelCase.

```typescript
// packages/types/src/transformers.ts
import type { DbUser, ApiUser } from './index';

export function transformDbUserToApi(dbUser: DbUser): ApiUser {
  return {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.full_name,
    phoneNumber: dbUser.phone_number,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
    businessVerificationStatus: dbUser.business_verification_status,
  };
}

// Usage in API routes
const result = await pool.query<DbUser>('SELECT * FROM users WHERE id = $1', [id]);
const apiUser = transformDbUserToApi(result.rows[0]);
res.json({ success: true, data: apiUser });
```

### 7.2 Prisma Query Patterns

```typescript
// Select only needed fields
const users = await prisma.users.findMany({
  select: {
    id: true,
    email: true,
    full_name: true,
    // Don't select password_hash!
  },
  where: {
    deleted_at: null, // Soft delete filter
    status: 'active',
  },
  orderBy: { created_at: 'desc' },
  take: 50,
});

// Use transactions for multiple operations
await prisma.$transaction(async (tx) => {
  const user = await tx.users.create({ data: userData });
  await tx.audit_logs.create({
    data: { action: 'USER_CREATED', user_id: user.id },
  });
  return user;
});
```

### 7.3 Prisma Gotchas

```typescript
// NEVER mix include + select
// Bad
await prisma.categories.findMany({
  include: { subcategories: true },
  select: { id: true }, // ERROR!
});

// Good - use only select with nested select
await prisma.categories.findMany({
  select: {
    id: true,
    name: true,
    subcategories: { select: { id: true, name: true } },
  },
});

// NEVER orderBy in nested select - sort in JavaScript
const cats = await prisma.categories.findMany({ /* ... */ });
cats.forEach(cat =>
  cat.subcategories?.sort((a, b) => a.name.localeCompare(b.name))
);
```

### 7.4 Migration Workflow

```bash
# NEVER edit database directly!

# 1. Edit schema.prisma
vim packages/database/prisma/schema.prisma

# 2. Create migration
cd packages/database
npm run db:migrate

# 3. Generate client
npm run db:generate

# 4. Commit migration files
git add packages/database/migrations/
git commit -m "Add verification tables"
```

---

## 8. API Layer Design

### 8.1 Next.js API Route Structure

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/userService';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch data
    const user = await UserService.getUserById(params.id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });

  } catch (error) {
    console.error('GET /api/users/[id] failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 8.2 Response Format

```typescript
// Success response
{
  "success": true,
  "data": { /* ... */ },
  "message": "User created successfully" // Optional
}

// Error response
{
  "success": false,
  "error": "Validation failed",
  "details": [ // Optional
    { "field": "email", "message": "Invalid email format" }
  ]
}

// Paginated response
{
  "success": true,
  "data": [ /* ... */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 9. Service Layer

### 9.1 Service Pattern

```typescript
// services/userService.ts
import { prisma } from '@/lib/prisma';
import { transformDbUserToApi } from '@thulobazaar/types';

export class UserService {
  static async getUserById(id: number) {
    const user = await prisma.users.findUnique({
      where: { id, deleted_at: null },
    });

    if (!user) return null;
    return transformDbUserToApi(user);
  }

  static async getPaginatedUsers(page = 1, limit = 20, filters?: UserFilters) {
    const skip = (page - 1) * limit;

    const where = {
      deleted_at: null,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.search && {
        OR: [
          { email: { contains: filters.search, mode: 'insensitive' } },
          { full_name: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.users.findMany({ where, skip, take: limit, orderBy: { created_at: 'desc' } }),
      prisma.users.count({ where }),
    ]);

    return {
      data: users.map(transformDbUserToApi),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
```

---

## 10. Performance Optimization

### 10.1 React Performance

```typescript
// Use React.memo for pure components
export const UserCard = memo(function UserCard({ user }: Props) {
  return <div>{user.name}</div>;
});

// Memoize expensive computations
const sortedUsers = useMemo(
  () => users.sort((a, b) => a.name.localeCompare(b.name)),
  [users]
);

// Memoize callbacks passed to children
const handleClick = useCallback(() => {
  onSelect(user.id);
}, [user.id, onSelect]);

// Code splitting for large components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### 10.2 Data Fetching

```typescript
// Parallel fetching
const [users, stats, categories] = await Promise.all([
  UserService.getUsers(),
  StatsService.getStats(),
  CategoryService.getCategories(),
]);

// Pagination for large datasets
const { data, pagination } = await UserService.getPaginatedUsers(page, 20);
```

---

## 11. Security Guidelines

### 11.1 Input Validation

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2).max(100),
});

// In API route
const body = await request.json();
const result = CreateUserSchema.safeParse(body);

if (!result.success) {
  return NextResponse.json({
    success: false,
    error: 'Validation failed',
    details: result.error.errors,
  }, { status: 400 });
}
```

### 11.2 Authentication Checks

```typescript
// Always verify auth before sensitive operations
const session = await getSession();
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Check permissions
if (session.user.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### 11.3 Safe Property Access

```typescript
// Always use optional chaining
const userName = user?.profile?.name || 'Unknown';

// Log before accessing unknown structures
console.log('Session structure:', Object.keys(session));
const userId = session?.user?.id;
```

---

## 12. Code Quality

### 12.1 Before Committing Checklist

- [ ] File under size limits?
- [ ] Types defined (no `any`)?
- [ ] Optional chaining used for nested access?
- [ ] DB data transformed before sending to client?
- [ ] Auth checks in place?
- [ ] Error handling implemented?
- [ ] Console.logs removed?
- [ ] Build passes?

### 12.2 Refactoring Priority

1. **Critical:** Security vulnerabilities, breaking changes
2. **High:** Files over 400 lines, code duplication
3. **Medium:** Files 200-400 lines, type safety improvements
4. **Low:** Code style, minor optimizations

### 12.3 When to Refactor

- File exceeds size limits
- More than 5 useState hooks in a component
- Duplicated code in 3+ places
- Complex nested conditionals (3+ levels)
- Component has multiple responsibilities

---

## Quick Reference

### Cache Clear (When Code Not Updating)

```bash
cd /Users/elw/Documents/Web/thulobazaar/monorepo
rm -rf .turbo packages/*/dist packages/*/.turbo apps/web/.next
cd packages/types && npm run build
cd ../api-client && npm run build
npm run dev
```

### Common Commands

```bash
# Development
npm run dev:web          # Start frontend
npm run dev:api          # Start backend

# Database
npm run db:generate      # Regenerate Prisma client
npm run db:migrate       # Create migration

# Build & Check
npm run build            # Build all
npm run type-check       # TypeScript check
```

---

**Maintained by:** ThuLoBazaar Engineering Team
**Last Updated:** December 2024
