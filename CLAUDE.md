# ThuluBazaar - Essential Reference

## 🎯 Quick Info
**Stack:** Next.js 15 + Express + PostgreSQL + Prisma
**Ports:** 3333 (web), 5000 (api)
**DB:** thulobazaar @ localhost:5432 (user: elw, pass: postgres)

## 📁 Paths
```
/Users/elw/Documents/Web/thulobazaar/monorepo/
├── apps/
│   ├── web/            # Next.js frontend (port 3333)
│   ├── api/            # Express backend (port 5000)
│   └── mobile/         # React Native app
└── packages/           # types, api-client, database
```

## 🚀 Commands

### Start (from monorepo root)
```bash
# Frontend only
npm run dev:web

# Backend only
npm run dev:api

# Both (in separate terminals)
npm run dev:web
npm run dev:api
```

### Cache Issues (Code not updating?)
```bash
cd /Users/elw/Documents/Web/thulobazaar/monorepo
rm -rf .turbo packages/*/dist packages/*/.turbo apps/web/.next
cd packages/types && npm run build
cd ../api-client && npm run build
```

### Database & Migrations
```bash
# Connect
PGPASSWORD=postgres psql -U elw -d thulobazaar

# Prisma
cd packages/database
npm run db:generate                # Regenerate Prisma client
npm run db:migrate                 # Create new migration (after editing schema)
npm run db:migrate:status          # Check migration status
npm run db:check-drift             # Check for schema drift (CRITICAL!)

# ⚠️ NEVER edit database directly - use migrations!
# See: SCHEMA_DRIFT_PREVENTION.md for full guide
```

### Fix Ports
```bash
lsof -ti:3333 | xargs kill -9  # Frontend
lsof -ti:5000 | xargs kill -9  # Backend
```

## ⚠️ Critical Rules

### 1. ALWAYS Transform DB ↔ API
```typescript
// ❌ WRONG
res.json(dbUser);  // snake_case fields!

// ✅ CORRECT
import { transformDbUserToApi } from '@thulobazaar/types';
res.json(transformDbUserToApi(dbUser));
```

### 2. Prisma Gotchas
```typescript
// ❌ NEVER mix include + select
prisma.users.findMany({
  include: { ads: true },
  select: { id: true }  // ERROR!
})

// ❌ NEVER orderBy in nested select

// ❌ Categories children relation
include: { categories: true }  // WRONG! This is parent

// ✅ CORRECT
include: { other_categories: true }  // Children
```

### 3. Safe Property Access
```typescript
// ❌ WRONG
const id = req.user.sub;

// ✅ CORRECT
console.log('🔍', req.user);  // Check first!
const id = req.user?.id || null;
```

### 4. Type Safety
```typescript
// ❌ WRONG
let arr = [];  // Inferred as never[]

// ✅ CORRECT
let arr: string[] = [];

// ✅ Type DB queries
const result = await pool.query<DbUser>('SELECT...');
```

### 5. Database Schema Changes
- **NEVER** edit database directly with SQL - use Prisma migrations
- **NEVER** use `db push` in production - use `db:migrate:deploy`
- See: `SCHEMA_DRIFT_PREVENTION.md` for full guide

## 🗄️ Database

**Tables:** users, ads, categories, locations
**Key:** Business verified = `business_verification_status IN ('approved', 'verified')`
**Relations:** Categories use `other_categories` for children
**Shop URLs:** Custom in `custom_shop_slug`, fallback to `businessName-userId`

## 🔑 Auth

- **Users:** `/api/auth/login` → localStorage `token`
- **Editors/Admins:** `/api/editor/auth/login` → `editorToken`
- **Contexts:** `UserAuthContext`, `StaffAuthContext`

## 🐛 Common Issues

| Issue | Fix |
|-------|-----|
| Code not updating | Clear cache (see above) |
| Prisma errors | `npx prisma generate` |
| Port in use | `lsof -ti:PORT \| xargs kill -9` |
| 404 on new route | Restart backend |
| Shop URL not working | Check `custom_shop_slug` first |

## 🎨 Key Files

- Auth: `apps/web/src/lib/auth.ts`
- API: `packages/api-client/src/index.ts`
- Types: `packages/types/src/index.ts`
- Schema: `packages/database/prisma/schema.prisma`

## 🎯 Workflow

1. Add types to `packages/types` if needed
2. Create API endpoint in `apps/api/src/routes/`
3. Add API client method in `packages/api-client/`
4. **Build packages:** `npm run build` in each
5. Create frontend component in `apps/web/`
6. **Clear cache** if changes don't apply

## 🧪 Testing Rules (MUST FOLLOW!)

### After ANY Fix, Auto-Verify:
```bash
# API/Route changes
npm run test:api                    # or curl test

# Component/UI changes
npm run test:unit

# Hook/data flow changes
npm run test:integration

# Full page/feature changes
npm run test:e2e

# Database changes
psql -c "SELECT * FROM table LIMIT 5"   # Verify data
```

### Test Commands Available:
```bash
npm run test:api          # API route tests
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e          # Playwright E2E tests
npm run test:e2e:headed   # E2E with browser visible
curl                      # Quick API verification
```

### NEVER Say "Fixed" Without:
1. Running relevant test OR
2. Showing curl/API response OR
3. Verifying with console.log output

### If No Test Exists → Create One:
- API fix → Add test in `apps/web/src/__tests__/api/`
- Component fix → Add test in `apps/web/src/__tests__/components/`
- Hook fix → Add test in `apps/web/src/__tests__/hooks/`

## 🔍 Debugging Rules (MUST FOLLOW!)

### Always Debug End-to-End:
```
Database → API Route → API-Client → Hook → Component → UI
```

### Before Fixing, Trace Full Flow:
1. **Check API**: What does the endpoint return? (curl or Network tab)
2. **Check API-Client**: How does it transform the response?
3. **Check Hook**: What does it expect? Add `console.log`
4. **Check Component**: Is state correct? (React DevTools)
5. **Check Render**: Any conditional hiding content?

### Quick Diagnostic:
| Symptom | Layer to Check |
|---------|---------------|
| 404/500 errors | API route |
| Empty response | Database/Prisma query |
| Data structure wrong | API-client transform |
| State undefined | Hook parsing |
| UI empty but state ok | Component render |

### Add Debug Logging FIRST:
```typescript
console.log('📊 [ComponentName] API Response:', response);
console.log('📊 [ComponentName] Parsed data:', data);
console.log('📊 [ComponentName] State:', state);
```

## 📚 Important Guides

- **SCHEMA_DRIFT_PREVENTION.md** - How to prevent database schema drift incidents
- **packages/database/MIGRATION_QUICK_REFERENCE.md** - Quick Prisma migration commands
