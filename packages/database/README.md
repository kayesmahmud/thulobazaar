# @thulobazaar/database

Shared database access layer using Prisma ORM for Thulobazaar monorepo.

## Features

- 🔒 **Type-safe database queries** with Prisma Client
- 🚀 **Optimized for Next.js** with singleton pattern
- 📦 **Shared across web and mobile** apps
- 🔄 **Auto-generated from existing database** (no migration needed)

## Installation

This package is already installed as part of the monorepo workspace.

## Usage

### In Next.js Server Components (Read-only)

```typescript
import { prisma } from '@thulobazaar/database';

export default async function HomePage() {
  // ✅ Type-safe query with autocomplete
  const ads = await prisma.ads.findMany({
    where: {
      status: 'active',
    },
    include: {
      users: true, // Relations are type-safe too!
      categories: true,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 20,
  });

  return <AdGrid ads={ads} />;
}
```

### In Next.js Server Actions (Mutations)

```typescript
'use server';

import { prisma } from '@thulobazaar/database';
import { revalidatePath } from 'next/cache';

export async function createAd(data: AdCreateInput) {
  const ad = await prisma.ads.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      user_id: data.userId,
      category_id: data.categoryId,
      location_id: data.locationId,
      status: 'pending',
    },
  });

  revalidatePath('/');
  return ad;
}
```

### Complex Queries with Filters

```typescript
import { prisma, Prisma } from '@thulobazaar/database';

export async function searchAds(filters: {
  search?: string;
  categoryId?: number;
  locationId?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
}) {
  const where: Prisma.adsWhereInput = {
    status: 'active',
  };

  // Text search
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  // Category filter
  if (filters.categoryId) {
    where.category_id = filters.categoryId;
  }

  // Location filter
  if (filters.locationId) {
    where.location_id = filters.locationId;
  }

  // Price range
  if (filters.minPrice || filters.maxPrice) {
    where.price = {};
    if (filters.minPrice) where.price.gte = filters.minPrice;
    if (filters.maxPrice) where.price.lte = filters.maxPrice;
  }

  const [ads, total] = await Promise.all([
    prisma.ads.findMany({
      where,
      include: {
        users: true,
        categories: true,
        locations: true,
        ad_images: {
          where: { is_primary: true },
          take: 1,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      skip: ((filters.page || 1) - 1) * 20,
      take: 20,
    }),
    prisma.ads.count({ where }),
  ]);

  return {
    data: ads,
    pagination: {
      total,
      page: filters.page || 1,
      pageSize: 20,
      totalPages: Math.ceil(total / 20),
    },
  };
}
```

## Database Management

### View Database in Browser

```bash
cd packages/database
npm run db:studio
```

This opens Prisma Studio at http://localhost:5555

### Update Schema from Database

If you make changes to the database directly (via SQL migrations), update the Prisma schema:

```bash
cd packages/database
npm run db:pull
```

Then regenerate the client:

```bash
npm run db:generate
```

## Safety Notes

- ✅ **Safe**: This package only READS from your existing database
- ✅ **Safe**: `prisma db pull` introspects without modifying data
- ✅ **Safe**: All queries are read-only by default in Server Components
- ⚠️ **Caution**: Only use write operations (create, update, delete) in authenticated Server Actions

## Available Models

- `ads` - Classified ads
- `users` - User accounts
- `categories` - Ad categories
- `locations` - Hierarchical locations (provinces → districts → municipalities)
- `ad_images` - Ad images
- `ad_promotions` - Promoted ads
- `ad_reports` - Ad reports
- `admin_activity_logs` - Admin action logs
- `admins` - Admin accounts
- `editors` - Editor accounts
- `areas` - Geographic areas
- `business_subscriptions` - Business subscriptions
- `business_verification_requests` - Business verification requests
- `individual_verification_requests` - Individual seller verification
- `messages` - User messages
- `payment_transactions` - Payment records
- `promotion_pricing` - Promotion pricing tiers
- `user_profiles` - Extended user profiles

## Performance Tips

1. **Use `select` to fetch only needed fields:**
   ```typescript
   const ads = await prisma.ads.findMany({
     select: {
       id: true,
       title: true,
       price: true,
     },
   });
   ```

2. **Use `include` for relations:**
   ```typescript
   const ad = await prisma.ads.findUnique({
     where: { id: 123 },
     include: {
       users: true,
       categories: true,
     },
   });
   ```

3. **Batch queries with `Promise.all`:**
   ```typescript
   const [ads, categories, locations] = await Promise.all([
     prisma.ads.findMany(),
     prisma.categories.findMany(),
     prisma.locations.findMany(),
   ]);
   ```

## TypeScript Support

All queries are fully type-safe! Try typing `prisma.` in your editor to see autocomplete suggestions.

```typescript
// ✅ TypeScript knows all fields and relations
const ad = await prisma.ads.findUnique({
  where: { id: 123 },
});

// ✅ TypeScript error: Property 'invalidField' does not exist
const invalid = await prisma.ads.findUnique({
  where: { id: 123 },
  select: { invalidField: true },
});
```

## Troubleshooting

### "Cannot find module '@prisma/client'"

Run:
```bash
cd packages/database
npm run db:generate
```

### "Environment variable not found: DATABASE_URL"

Make sure `.env` file exists in `packages/database/` with:
```
DATABASE_URL="postgresql://elw@localhost:5432/thulobazaar"
```

### Connection timeout errors

Check that PostgreSQL is running:
```bash
psql -U elw -d thulobazaar -c "SELECT 1;"
```
