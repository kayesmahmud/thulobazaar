# 🚀 ThuluBazaar Monorepo Setup Guide

## ✅ What Has Been Created

Your monorepo is now set up with:

### 📦 Shared Packages (60-70% code reuse)
- **@thulobazaar/types** - TypeScript types for User, Ad, Category, Location, etc.
- **@thulobazaar/utils** - Utilities for date, price, validation, distance, SEO, etc.
- **@thulobazaar/api-client** - Unified API client for web and mobile

### 🌐 Web App
- **apps/web** - Next.js 14 with TypeScript, App Router, and i18n support

### 📁 Ready for Mobile
- Structure prepared for React Native app in `apps/mobile`
- All shared packages will work immediately in mobile app!

---

## 🎯 Step-by-Step Installation

### Step 1: Navigate to Monorepo
```bash
cd /Users/elw/Documents/Web/thulobazaar/monorepo
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all dependencies for all packages and apps in the monorepo.

### Step 3: Build Shared Packages
```bash
npm run build
```

This compiles TypeScript for all shared packages.

### Step 4: Create Environment File
```bash
cd apps/web
cp .env.example .env.local
```

Edit `.env.local` and set your API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 5: Start Development
```bash
# From monorepo root
cd /Users/elw/Documents/Web/thulobazaar/monorepo

# Start web app only
npm run dev:web

# OR start all apps
npm run dev
```

### Step 6: Open in Browser
```
http://localhost:3000
```

You should see a welcome page showing that the monorepo is working!

---

## 🎨 How Code Sharing Works

### Example 1: Shared Types

**In any package/app:**
```typescript
import type { User, Ad, Category } from '@thulobazaar/types';

// These types work identically in:
// ✅ Next.js (web)
// ✅ React Native (mobile)
// ✅ Express API (backend)
```

### Example 2: Shared Utilities

**Web (Next.js):**
```typescript
import { formatPrice, formatRelativeTime } from '@thulobazaar/utils';

const price = formatPrice(50000); // "Rs. 50,000"
const time = formatRelativeTime(new Date()); // "Just now"
```

**Mobile (React Native) - Same code!:**
```typescript
import { formatPrice, formatRelativeTime } from '@thulobazaar/utils';

const price = formatPrice(50000); // "Rs. 50,000"
const time = formatRelativeTime(new Date()); // "Just now"
```

### Example 3: Shared API Client

**Web (Next.js):**
```typescript
import { apiClient } from '@/lib/api';

const ads = await apiClient.getAds({ category_id: 1 });
```

**Mobile (React Native) - Same API!:**
```typescript
import { createApiClient } from '@thulobazaar/api-client';

const apiClient = createApiClient({
  baseURL: 'http://localhost:5000',
  getAuthToken: () => AsyncStorage.getItem('token'),
});

const ads = await apiClient.getAds({ category_id: 1 });
```

---

## 📱 Adding React Native Mobile App

### Step 1: Create Mobile App
```bash
cd apps
npx create-expo-app mobile --template expo-template-blank-typescript
```

### Step 2: Install Shared Packages
```bash
cd mobile
npm install @thulobazaar/types @thulobazaar/utils @thulobazaar/api-client
```

### Step 3: Use Shared Code
```typescript
// apps/mobile/App.tsx
import { formatPrice } from '@thulobazaar/utils';
import { createApiClient } from '@thulobazaar/api-client';
import type { Ad } from '@thulobazaar/types';

// Same types, same utilities, same API client!
```

---

## 🔄 Development Workflow

### Running Apps
```bash
# Web only
npm run dev:web

# API only
npm run dev:api

# Mobile only
npm run dev:mobile

# All together
npm run dev
```

### Building
```bash
# Build everything
npm run build

# Build specific app
cd apps/web && npm run build
```

### Type Checking
```bash
# Check all packages
npm run type-check
```

---

## 📊 Code Sharing Breakdown

### ✅ Shared Across Web & Mobile (60-70%)

| Package | What's Shared | Usage |
|---------|---------------|-------|
| **@thulobazaar/types** | All TypeScript interfaces | 100% shared |
| **@thulobazaar/utils** | Date, price, validation, distance | 95% shared |
| **@thulobazaar/api-client** | All API calls | 100% shared |
| **Business logic** | Filters, calculations, sorting | 90% shared |

### ❌ Platform-Specific (30-40%)

| Feature | Web (Next.js) | Mobile (React Native) |
|---------|---------------|----------------------|
| **Navigation** | Next.js router | React Navigation |
| **Images** | next/image | react-native Image |
| **Storage** | localStorage | AsyncStorage |
| **Styling** | CSS/Tailwind | StyleSheet |

---

## 🎯 Migration Path from Old Code

### Priority 1: Shared Code (Start Here)
1. Copy types from old backend → `packages/types`
2. Copy utilities → `packages/utils`
3. Create API client methods based on old API routes

### Priority 2: Components
1. Start with simple components (buttons, cards)
2. Convert to TypeScript
3. Use shared types and utilities

### Priority 3: Pages
1. Convert one page at a time
2. Use Next.js file-based routing
3. Keep old app running during migration

---

## 🛠️ Troubleshooting

### Issue: "Cannot find module '@thulobazaar/types'"
**Solution:** Build shared packages first
```bash
npm run build
```

### Issue: TypeScript errors
**Solution:** Make sure all packages are installed
```bash
npm install
```

### Issue: Port 3000 already in use
**Solution:** Kill existing process or use different port
```bash
npx kill-port 3000
# OR
cd apps/web && npm run dev -- -p 3001
```

---

## 🎉 Next Steps

1. ✅ Complete this setup guide
2. Start migrating components from old frontend
3. Setup TypeScript backend (apps/api)
4. Add React Native mobile app
5. Share components between web and mobile

---

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Turborepo Docs](https://turbo.build/repo/docs)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Questions?** Check the README.md or the example code in `apps/web/src/app/[lang]/page.tsx`
