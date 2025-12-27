# ThuluBazaar Monorepo

A modern, **production-ready** monorepo for ThuluBazaar marketplace platform, supporting Web (Next.js), iOS, and Android (React Native) with **60-70% shared code**.

## ✅ Code Quality

- ✅ **Snake_case vs camelCase** - Proper type transformations
- ✅ **Null safety** - Safe property access throughout
- ✅ **Type safety** - 95% TypeScript coverage
- ✅ **Testing** - Vitest with React Testing Library
- ✅ **Best practices** - Follows critical guidelines

## 🏗️ Project Structure

```
thulobazaar-monorepo/
├── apps/
│   ├── web/          # Next.js 15+ TypeScript (Web app)
│   ├── api/          # Express + TypeScript (Backend API)
│   └── mobile/       # React Native + Expo (iOS & Android)
├── packages/
│   ├── types/        # Database types (snake_case) + API types (camelCase) + Transformers
│   ├── utils/        # Shared utility functions (30+ utilities)
│   ├── api-client/   # API client for web & mobile
│   ├── ui/           # Shared React/React Native components - TODO
│   └── config/       # Shared configuration - TODO
└── turbo.json        # Turborepo configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
npm install
```

### Development
```bash
# Run all apps in development mode
npm run dev

# Run specific app
npm run dev:web      # Web app only
npm run dev:api      # API server only
npm run dev:mobile   # Mobile app only
```

### Build
```bash
npm run build
```

### Testing
```bash
# Run tests in watch mode
npm run test --workspace=web

# Run tests once
npm run test:run --workspace=web

# Run with coverage
npm run test:coverage --workspace=web
```

## 📦 Shared Packages

### @thulobazaar/types (700+ lines)
**CRITICAL:** This package exports TWO type systems:

1. **Database Types** (`DbUser`, `DbAd`, etc.) - snake_case, matches PostgreSQL exactly
2. **API Types** (`User`, `Ad`, etc.) - camelCase, for frontend/mobile
3. **Transformers** - Convert between the two

**Why two systems?**
- PostgreSQL returns snake_case: `{ full_name: "John", created_at: "..." }`
- TypeScript prefers camelCase: `{ fullName: "John", createdAt: "..." }`
- Transformers bridge the gap automatically

**Usage:**
```typescript
// Backend
import { DbUser, transformDbUserToApi } from '@thulobazaar/types';
const dbUser = await query<DbUser>('SELECT * FROM users...');
const apiUser = transformDbUserToApi(dbUser); // Convert!

// Frontend
import { User } from '@thulobazaar/types';
const user: User = await apiClient.getUser(); // Already camelCase!
```

See [CRITICAL_GUIDELINES.md](./CRITICAL_GUIDELINES.md) for full details.

### @thulobazaar/utils
30+ utility functions:
- Date: `formatDate`, `formatRelativeTime`
- Price: `formatPrice`, `formatPriceShort`
- Validation: `validateEmail`, `validatePhone`, `validatePassword`
- Location: `calculateDistance`, `formatDistance`
- String: `slugify`, `truncate`, `capitalize`
- And more...

### @thulobazaar/api-client
Unified API client with 30+ methods for both web and mobile.

### @thulobazaar/ui (TODO)
Shared React components that work on web and mobile.

## 🔄 Code Sharing (60-70%)

**Shared:**
- ✅ TypeScript types & interfaces
- ✅ API client & data fetching
- ✅ Business logic & utilities
- ✅ Validation schemas
- ✅ Constants & configuration
- ✅ UI components (platform-agnostic)

**Platform-specific:**
- Navigation (Next.js router vs React Navigation)
- Platform UI adjustments
- Native features (camera, notifications)

## 📱 Apps

### Web (`apps/web`)
- Next.js 15+ with App Router
- TypeScript 5.x
- Tailwind CSS 4.x
- React 19
- Server-side rendering (SSR)
- SEO optimized

### API (`apps/api`)
- Express.js with TypeScript
- PostgreSQL database
- Typesense search
- JWT authentication

### Mobile (`apps/mobile`)
- React Native with Expo
- TypeScript
- Shared UI components
- iOS & Android support

## 🛠️ Tech Stack

- **Frontend Framework:** Next.js 15+, React Native (Expo)
- **Language:** TypeScript 5.x
- **React:** 19.x
- **API:** Express.js
- **Database:** PostgreSQL + Prisma ORM
- **Search:** Typesense
- **Testing:** Vitest + React Testing Library
- **Monorepo:** Turborepo
- **Package Manager:** npm workspaces

## 📝 License

Private - ThuluBazaar
