# 🐛 Debug Patterns & Common Bugs

**Last Updated:** 2025-10-21
**Purpose:** Track bugs found and their solutions to prevent recurring issues

---

## 📋 Table of Contents
1. [Critical Rules](#critical-rules)
2. [Bug Log](#bug-log)
3. [Quick Checks Before Committing](#quick-checks)

---

## 🔴 Critical Rules

### Rule #1: snake_case vs camelCase
**ALWAYS use transformers when passing database data to frontend**

```typescript
// ❌ WRONG - Direct Prisma to Client
const categories = await prisma.categories.findMany();
return <Component categories={categories} />; // Client gets snake_case!

// ✅ CORRECT - Use transformer
import { transformDbCategoryToApi } from '@thulobazaar/types';

const dbCategories = await prisma.categories.findMany();
const categories = dbCategories.map(transformDbCategoryToApi);
return <Component categories={categories} />; // Client gets camelCase!
```

### Rule #2: Never Assume Property Names
```typescript
// ❌ WRONG - Assuming property names
const userId = req.user.sub;

// ✅ CORRECT - Log first, then access
console.log('🔍 Full req.user:', req.user);
const userId = req.user.id;
```

### Rule #3: Always Use Optional Chaining
```typescript
// ❌ WRONG
const name = user.profile.name;

// ✅ CORRECT
const name = user?.profile?.name || 'Unknown';
```

---

## 🐛 Bug Log

### Bug #1: Categories Filter Not Using Transformers
**Date:** 2025-10-21
**File:** `/monorepo/apps/web/src/app/[lang]/all-ads/page.tsx`
**Status:** 🟡 POTENTIAL BUG - Needs Review

**Issue:**
```typescript
// Line 133-171: Fetching categories from Prisma
const allCategories = await prisma.categories.findMany({
  where: { parent_id: null },
  include: {
    categories: {
      select: {
        id: true,
        name: true,
        icon: true,
      },
    },
  },
});

// Line 270: Passing directly to client component
<AllAdsFilters
  categories={categories}  // ⚠️ Still snake_case format!
  ...
/>
```

**Problem:**
- Prisma returns `parent_id`, `created_at`, etc. in snake_case
- Client component expects camelCase
- No transformer used

**Solution:**
```typescript
// 1. Create transformer in @thulobazaar/types
export function transformDbCategoryToApi(dbCategory: any) {
  return {
    id: dbCategory.id,
    name: dbCategory.name,
    icon: dbCategory.icon,
    parentId: dbCategory.parent_id,
    categories: dbCategory.categories?.map(transformDbCategoryToApi) || [],
  };
}

// 2. Use it in page.tsx
import { transformDbCategoryToApi } from '@thulobazaar/types';

const allCategories = await prisma.categories.findMany({...});
const categories = allCategories.map(transformDbCategoryToApi);
```

**Impact:**
- 🟢 Low - Currently works because TypeScript interface accepts both
- 🟡 Medium - Could break if strict types are enforced
- 🔴 High - Violates best practices from CRITICAL_GUIDELINES.md

**Next Steps:**
- [ ] Check if @thulobazaar/types has category transformers
- [ ] Add transformer if missing
- [ ] Update all-ads page to use transformers
- [ ] Apply same fix to search page

---

### Bug #2: Prisma - Cannot Use Both `include` and `select`
**Date:** 2025-10-21
**File:** `/monorepo/apps/web/src/app/[lang]/all-ads/page.tsx`
**Status:** 🟢 FIXED

**Issue:**
```typescript
// ❌ WRONG - Lines 133-151
const allCategories = await prisma.categories.findMany({
  where: { parent_id: null },
  include: {  // ❌ Using include
    categories: {
      select: { ... },
    },
  },
  select: {  // ❌ AND using select - CONFLICT!
    id: true,
    name: true,
    icon: true,
    categories: true,
  },
});
```

**Error:**
```
PrismaClientValidationError: Please either use `include` or `select`, but not both at the same time.
```

**Problem:**
- Prisma doesn't allow mixing `include` and `select` in the same query
- `include` = Include ALL fields from the relation
- `select` = Select SPECIFIC fields
- You must choose one approach

**Solution:**
```typescript
// ✅ CORRECT - Use only select
const allCategories = await prisma.categories.findMany({
  where: { parent_id: null },
  select: {
    id: true,
    name: true,
    icon: true,
    categories: {  // Nested select for relation
      select: {
        id: true,
        name: true,
        icon: true,
      },
      orderBy: { name: 'asc' },
    },
  },
});
```

**Impact:** 🔴 High - Page crashed completely

**Lesson Learned:**
- Always use EITHER `include` OR `select`, never both
- For relations, nest the `select` inside the parent `select`
- Test the page immediately after adding Prisma queries

---

### Bug #3: Prisma - Cannot Use `orderBy` in Nested Select
**Date:** 2025-10-21
**File:** `/monorepo/apps/web/src/app/[lang]/all-ads/page.tsx`
**Status:** 🟢 FIXED

**Issue:**
```typescript
// ❌ WRONG - Lines 133-148
const allCategories = await prisma.categories.findMany({
  where: { parent_id: null },
  select: {
    id: true,
    name: true,
    icon: true,
    categories: {
      select: {
        id: true,
        name: true,
        icon: true,
      },
      orderBy: { name: 'asc' }, // ❌ ERROR: orderBy not allowed in nested select
    },
  },
});
```

**Error:**
```
Invalid `prisma.categories.findMany()` invocation:
Unknown argument `orderBy`. Available options are marked with ?.
```

**Problem:**
- Prisma doesn't allow `orderBy` inside a nested relation `select`
- `orderBy` can only be used at the top level of `findMany()` or `findFirst()`
- When you need to sort nested relations, you must sort in JavaScript after fetching

**Solution:**
```typescript
// ✅ CORRECT - Remove orderBy from nested select, sort in JavaScript
const allCategories = await prisma.categories.findMany({
  where: { parent_id: null },
  select: {
    id: true,
    name: true,
    icon: true,
    categories: {
      select: {
        id: true,
        name: true,
        icon: true,
      },
    },
  },
});

// Sort subcategories alphabetically in JavaScript
allCategories.forEach((category) => {
  if (category.categories && category.categories.length > 0) {
    category.categories.sort((a, b) => a.name.localeCompare(b.name));
  }
});
```

**Impact:** 🔴 High - Page crashed completely

**Lesson Learned:**
- Prisma only allows `orderBy` at the top level of queries
- For nested relations, use JavaScript sorting after fetching data
- Always check Prisma docs for allowed arguments in nested queries

---

### Bug #4: Wrong Prisma Relation Name for Subcategories
**Date:** 2025-10-21
**File:** `/monorepo/apps/web/src/app/[lang]/all-ads/page.tsx`, `/monorepo/apps/web/src/app/[lang]/all-ads/AllAdsFilters.tsx`
**Status:** 🟢 FIXED

**Issue:**
```typescript
// ❌ WRONG - Using wrong relation name
const allCategories = await prisma.categories.findMany({
  where: { parent_id: null },
  select: {
    id: true,
    name: true,
    icon: true,
    categories: {  // ❌ Wrong relation name!
      select: {
        id: true,
        name: true,
        icon: true,
      },
    },
  },
});

// In AllAdsFilters.tsx
interface Category {
  id: number;
  name: string;
  icon: string;
  categories: { ... }[];  // ❌ Wrong relation name
}

{category.categories && category.categories.length > 0 && (  // ❌ Undefined
  <button>▶</button>
)}
```

**Problem:**
- In the Prisma schema, the self-referencing relation for subcategories is named `other_categories`, not `categories`
- The schema has TWO relations:
  - `categories` - references the PARENT category (many-to-one)
  - `other_categories` - references the CHILD categories (one-to-many)
- Using the wrong relation name caused:
  - Subcategories not being fetched from database
  - Accordion arrows not appearing in the UI
  - User couldn't expand categories to see subcategories

**Prisma Schema:**
```typescript
model categories {
  id               Int          @id @default(autoincrement())
  name             String       @db.VarChar(100)
  parent_id        Int?

  // This is the PARENT relation (many-to-one)
  categories       categories?  @relation("categoriesTocategories", fields: [parent_id], references: [id])

  // This is the CHILDREN relation (one-to-many) ✅ USE THIS!
  other_categories categories[] @relation("categoriesTocategories")
}
```

**Solution:**
```typescript
// ✅ CORRECT - Use other_categories for subcategories
const allCategories = await prisma.categories.findMany({
  where: { parent_id: null },
  select: {
    id: true,
    name: true,
    icon: true,
    other_categories: {  // ✅ Correct relation name
      select: {
        id: true,
        name: true,
        icon: true,
      },
    },
  },
});

// Sort subcategories after fetching
allCategories.forEach((category) => {
  if (category.other_categories && category.other_categories.length > 0) {
    category.other_categories.sort((a, b) => a.name.localeCompare(b.name));
  }
});

// In AllAdsFilters.tsx - Update interface
interface Category {
  id: number;
  name: string;
  icon: string;
  other_categories: {  // ✅ Correct relation name
    id: number;
    name: string;
    icon: string;
  }[];
}

// Update all references
{category.other_categories && category.other_categories.length > 0 && (
  <button onClick={() => toggleCategory(category.id)}>
    <span style={{
      transform: expandedCategories.has(category.id) ? 'rotate(90deg)' : 'rotate(0deg)',
    }}>
      ▶
    </span>
  </button>
)}

{category.other_categories && category.other_categories.length > 0 && expandedCategories.has(category.id) && (
  <div>
    {category.other_categories.map((subcategory) => (
      <button key={subcategory.id}>
        {subcategory.name}
      </button>
    ))}
  </div>
)}
```

**Impact:** 🔴 High - Feature completely broken, accordion didn't work at all

**Lesson Learned:**
- ALWAYS check the Prisma schema for exact relation names
- Self-referencing relations have TWO sides:
  - One for the parent (singular, many-to-one)
  - One for the children (plural, one-to-many)
- Use the plural relation (`other_categories`) to fetch child records
- Verify database queries return expected data before implementing UI
- Test with real data from database to catch relation issues early

**Quick Check Command:**
```bash
# View the Prisma schema for a model
grep -A 15 "model categories" packages/database/prisma/schema.prisma
```

---

### Bug #5: Location Pre-selection Not Working - Wrong Component Type
**Date:** 2025-10-21
**Files:**
- `/monorepo/apps/web/src/components/LocationSelector.tsx` (old, search-only)
- `/monorepo/apps/web/src/components/LocationHierarchySelector.tsx` (new, hierarchical)
- `/monorepo/apps/web/src/app/[lang]/post-ad/page.tsx`
- `/monorepo/apps/web/src/app/[lang]/edit-ad/[id]/page.tsx`
**Status:** 🟢 FIXED

**Issue:**
Location field in Edit Ad page was not pre-selecting the existing location value, despite correct data being passed.

**Root Cause:**
The monorepo was using a simple search-based `LocationSelector` component, but the old site used **hierarchical cascade dropdowns** (Province → District → Municipality). The old component architecture provided better UX and proper pre-population support.

**Old Site Component:**
```jsx
// /frontend/src/components/post-ad/LocationSelector.jsx
- Search with autocomplete (debounced 300ms)
- Hierarchical browser: Province → District → Municipality → Ward → Area
- Collapsible sections at each level
- API: /areas/hierarchy and /locations/search-all
```

**New Monorepo Component Structure:**
```typescript
// Old: Simple search-only component
<LocationSelector
  filterType="area"
  placeholder="Search for area, municipality, district..."
/>

// New: Hierarchical dropdown component
<LocationHierarchySelector
  placeholder="Search province, district, municipality..."
  required
/>
```

**Solution:**

**1. Created New LocationHierarchySelector Component** (`/monorepo/apps/web/src/components/LocationHierarchySelector.tsx`):

```typescript
export default function LocationHierarchySelector({
  onLocationSelect,
  selectedLocationId,
  label = 'Select Location',
  placeholder = 'Search province, district, municipality...',
  required = false,
}: LocationHierarchySelectorProps) {
  // State for hierarchy data
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [municipalities, setMunicipalities] = useState<Location[]>([]);

  // State for selections
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<number | null>(null);

  // Features:
  // 1. Search with autocomplete (uses /api/locations/search-all)
  // 2. Hierarchical cascade dropdowns (Province → District → Municipality)
  // 3. Auto-loads full hierarchy when selectedLocationId is provided
  // 4. Handles all 3 location types (province, district, municipality)
}
```

**Key Features:**
1. **Hierarchical Dropdowns**: Province dropdown appears first, then District (when province selected), then Municipality (when district selected)
2. **Search with Autocomplete**: Debounced search (300ms) using `/api/locations/search-all` endpoint
3. **Pre-population Support**: When `selectedLocationId` is provided, automatically:
   - Fetches the location details
   - Loads parent hierarchy (if municipality, loads district and province)
   - Pre-selects all dropdowns in the hierarchy
   - Displays selected location name in search box
4. **Clear Functionality**: User can clear selection and start over

**2. Updated Both Pages:**

```typescript
// Post Ad & Edit Ad pages
import LocationHierarchySelector from '@/components/LocationHierarchySelector';

<LocationHierarchySelector
  onLocationSelect={(location) => {
    setFormData({
      ...formData,
      locationId: location ? location.id.toString() : '',
      locationType: location ? location.type : ''
    });
  }}
  selectedLocationId={formData.locationId ? parseInt(formData.locationId) : null}
  label="Location"
  placeholder="Search province, district, municipality..."
  required
/>
```

**3. API Endpoints Used** (already existed in backend):
- `GET /api/locations?type=province` - Get all provinces
- `GET /api/locations?parent_id={id}&type=district` - Get districts for a province
- `GET /api/locations?parent_id={id}&type=municipality` - Get municipalities for a district
- `GET /api/locations/{id}` - Get single location details
- `GET /api/locations/search-all?q={query}` - Search all location types

**Impact:** 🔴 High - Location pre-selection now works correctly, and UX matches the old site

**Lesson Learned:**
- When migrating components, analyze the **UX pattern** from the old implementation, not just the data flow
- Hierarchical selection (cascading dropdowns) provides better UX than flat search for structured data
- Always consider pre-population requirements when designing form components
- Check backend API capabilities before creating new components - reuse existing endpoints
- User feedback about "old site worked better" is a signal to check the old implementation

**Files Created:**
- `/monorepo/apps/web/src/components/LocationHierarchySelector.tsx` (new component)

**Files Modified:**
- `/monorepo/apps/web/src/app/[lang]/post-ad/page.tsx` (replaced LocationSelector)
- `/monorepo/apps/web/src/app/[lang]/edit-ad/[id]/page.tsx` (replaced LocationSelector)

---

### Bug #6: Code Changes Not Applying - Stale Cache/Build Issues
**Date:** 2025-10-21
**Files:** Monorepo-wide (affects all packages and apps)
**Status:** 🟢 FIXED

**Issue:**
After making code changes to packages (especially `@thulobazaar/api-client` and `@thulobazaar/types`), the changes don't appear when testing:
- API calls don't use the new code
- TypeScript changes aren't reflected
- UI changes don't show up
- Alert messages added for debugging don't appear
- Console logs from new code don't print

**Symptoms:**
```bash
# You made changes but:
- ❌ No PUT request sent to backend (but alerts say it succeeded)
- ❌ New console.log() statements don't appear
- ❌ Browser Network tab shows no new requests
- ❌ Backend doesn't receive expected API calls
- ❌ Code appears to run old version
```

**Root Cause:**
Multiple layers of caching prevent new code from running:
1. **TypeScript not recompiled** - `packages/*/dist` folders contain old JavaScript
2. **Turbopack/Next.js cache** - `.next`, `.turbo` folders serve old bundles
3. **Browser cache** - Cached JavaScript files from previous builds
4. **Module resolution** - Node.js resolves old module exports

**Solution:**

**Step 1: Clear All Build Caches**
```bash
cd /Users/elw/Documents/Web/thulobazaar/monorepo

# Clear all caches
rm -rf .turbo \
       packages/api-client/dist \
       packages/api-client/.turbo \
       packages/types/dist \
       packages/types/.turbo \
       apps/web/.next \
       apps/web/.turbo
```

**Step 2: Rebuild Packages**
```bash
# Rebuild types package (required by api-client)
cd packages/types
npm run build

# Rebuild api-client package
cd ../api-client
npm run build
```

**Step 3: Restart Dev Servers**
```bash
# Stop frontend server (Ctrl+C)
# Then restart
cd /Users/elw/Documents/Web/thulobazaar/monorepo
npm run dev:web

# Backend usually doesn't need restart, but if issues persist:
cd /Users/elw/Documents/Web/thulobazaar/backend
npm run dev
```

**Step 4: Hard Refresh Browser**
```bash
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R
```

**Quick Fix Script:**
```bash
#!/bin/bash
# Save as: monorepo/clear-cache.sh

echo "🧹 Clearing all caches..."
cd /Users/elw/Documents/Web/thulobazaar/monorepo

rm -rf .turbo packages/*/dist packages/*/.turbo apps/web/.next apps/web/.turbo

echo "🔨 Rebuilding packages..."
cd packages/types && npm run build
cd ../api-client && npm run build

echo "✅ Done! Now restart dev server and hard refresh browser."
```

**When to Use This Fix:**
- ✅ After changing code in `packages/api-client/src/`
- ✅ After changing code in `packages/types/src/`
- ✅ After updating TypeScript interfaces
- ✅ When changes don't appear after saving files
- ✅ When seeing "Module not found" errors in Next.js
- ✅ When debugging logs don't appear in console
- ✅ After switching git branches
- ✅ After pulling changes from repository

**Prevention Tips:**
1. **Watch for compiled packages:** If editing `packages/*/src`, always rebuild with `npm run build`
2. **Use `--watch` mode:** Consider adding watch scripts to package.json:
   ```json
   "scripts": {
     "dev": "tsc --watch",
     "build": "tsc"
   }
   ```
3. **Check for changes:** Before debugging, verify your code changes are in the compiled `dist/` folder
4. **Clear browser cache:** Use DevTools "Disable cache" option while developing

**Impact:** 🔴 CRITICAL - Can waste hours debugging when code appears broken but is just cached

**Lesson Learned:**
- Monorepo packages need manual rebuilding when source code changes
- Multiple cache layers can hide your changes
- Always clear caches FIRST before deep debugging
- "Code doesn't work" often means "old code is running"
- TypeScript compilation is a required step, not automatic in monorepos

**Related Issues:**
- Bug #1: If you see snake_case instead of camelCase, might be using old transformers from cache
- Build errors: TypeScript errors in packages prevent app from starting

**Variation: Internal Server Error After Adding New Features**
**Date:** 2025-11-16
**Symptom:** "Internal Server Error" on specific pages after adding new API integrations

**Error in Logs:**
```
Error: ENOENT: no such file or directory, open '.next/server/app/[lang]/editor/dashboard/page/app-build-manifest.json'
Error: ENOENT: no such file or directory, open '.next/static/development/_buildManifest.js.tmp.xxx'
```

**Root Cause:**
Corrupted .next build cache after adding new backend endpoints and API integrations. The build manifest files got corrupted during hot reload.

**Solution:**
```bash
# Clear .next cache
rm -rf .turbo apps/web/.next apps/web/.turbo

# Kill all processes on port 3333
lsof -ti:3333 | xargs kill -9

# Restart dev server
npm run dev:web
```

**Impact:** 🔴 CRITICAL - Page completely broken with 500 error

**Prevention:**
- Clear cache after major API integrations
- Restart dev server if you see ENOENT errors in logs
- Don't ignore build manifest errors - they indicate cache corruption

---

### Bug #7: Database Enum Value Mismatch - Verification Status
**Date:** 2025-10-22
**Files:**
- `/monorepo/apps/web/src/app/[lang]/ad/[slug]/page.tsx`
**Status:** 🟢 FIXED

**Issue:**
Verification badges and status text not showing on ad detail page even though seller is verified in database.

**Problem:**
The code was checking for `business_verification_status === 'verified'` but the database stores the value as `'approved'`.

```typescript
// ❌ WRONG - checking for 'verified'
{ad.users_ads_user_idTousers?.business_verification_status === 'verified' && (
  <img src="/golden-badge.png" alt="Verified Business" />
)}
```

**Root Cause:**
Database enum values don't always match what we expect. Always check the actual database values before writing comparison logic.

**Solution:**
Changed all verification status checks from `'verified'` to `'approved'`:

```typescript
// ✅ CORRECT - checking for 'approved'
{ad.users_ads_user_idTousers?.business_verification_status === 'approved' && (
  <img src="/golden-badge.png" alt="Verified Business" />
)}
```

**Debugging Steps:**
1. Added console.log to check actual database values
2. Queried database directly:
```sql
SELECT business_verification_status, individual_verified
FROM users WHERE business_name = 'Shanti beauty Shop';
```
3. Found status was `'approved'` not `'verified'`
4. Updated all comparison checks

**Impact:** Medium - Feature completely broken but isolated to verification badges

**Files Modified:**
- Updated 4 instances of verification status checks in ad detail page
- Badge images already existed in `/apps/web/public/`

**Lesson Learned:**
- Always verify database enum values before writing conditional logic
- Don't assume status values - check the schema or query the database
- Use console.log or database queries to confirm actual stored values

---

### Bug #8: Edit Ad Page - Debug Code Cleanup
**Date:** 2025-10-22
**Files:**
- `/monorepo/apps/web/src/app/[lang]/edit-ad/[id]/page.tsx`
**Status:** 🟢 FIXED

**Issue:**
Excessive debug console.log statements cluttering the edit ad page after troubleshooting cache issues (Bug #6).

**Problem:**
During cache debugging, we added extensive console logging:
- Form submission logs (lines 276-312)
- Data loading logs (lines 135-195)
- Location rendering logs (lines 709-714)
- Validation error logs
- API request/response logs

**Solution:**
Removed all verbose debug logs while keeping essential error logging in catch blocks:

**Kept:**
```typescript
// Essential error logging
catch (err: any) {
  console.error('❌ Error loading data:', err);
  setError('Failed to load ad data');
}
```

**Removed:**
```typescript
// ❌ Removed verbose debug logs
console.log('🚀 [EDIT AD] Form submitted');
console.log('🚀 [EDIT AD] Existing images:', existingImages);
console.log('✅ [EDIT AD] All validations passed');
// ... and 15+ more debug logs
```

**Impact:** Low - Code cleanup only, no functional changes

**Lesson Learned:**
- Add debug logs during troubleshooting
- Remove them after issue is resolved
- Keep only essential error logging for production

---

### Bug #9: [Template for Future Bugs]
**Date:** YYYY-MM-DD
**File:**
**Status:** 🟢 FIXED / 🟡 IN PROGRESS / 🔴 CRITICAL

**Issue:**
```typescript
// Code showing the bug
```

**Problem:**
Description of what went wrong

**Solution:**
```typescript
// Fixed code
```

**Impact:** Low / Medium / High

---

## ✅ Quick Checks Before Committing

### Pre-Commit Checklist
- [ ] Used transformers for all Prisma → Client data flow?
- [ ] Logged unknown objects before accessing properties?
- [ ] Used optional chaining for nested objects?
- [ ] Added explicit TypeScript types (no `any` without reason)?
- [ ] Checked database schema for correct property names?
- [ ] Verified JWT/session structure before using?

### Common Mistakes to Avoid
1. ❌ Passing Prisma results directly to client components
2. ❌ Assuming property names without logging
3. ❌ Using `any` type without explicit reason
4. ❌ Accessing nested properties without optional chaining
5. ❌ Mixing snake_case and camelCase

---

## 📚 Reference Files

- **Critical Guidelines:** `/monorepo/CRITICAL_GUIDELINES.md`
- **Quick Dev Rules:** `/QUICK_DEV_RULES.md`
- **TypeScript Best Practices:** `/monorepo/TYPESCRIPT_NEXTJS_2025_BEST_PRACTICES.md`
- **Work In Progress:** `/WORK_IN_PROGRESS.md`

---

## 🔧 Debugging Tools

### Useful Commands
```bash
# Check Prisma schema
cd packages/database && npx prisma format

# View table structure
psql -d thulobazaar -c "\d categories"

# Check for TypeScript errors
cd apps/web && npm run build

# Clear Next.js cache only
rm -rf .next && npm run dev

# Clear ALL caches (use this when code changes don't apply)
cd /Users/elw/Documents/Web/thulobazaar/monorepo
rm -rf .turbo packages/*/dist packages/*/.turbo apps/web/.next apps/web/.turbo
cd packages/types && npm run build && cd ../api-client && npm run build
cd /Users/elw/Documents/Web/thulobazaar/monorepo && npm run dev:web
```

### Logging Template
```typescript
console.log('🔍 Debug Point:', {
  input: variableName,
  keys: Object.keys(variableName),
  type: typeof variableName,
  isArray: Array.isArray(variableName),
});
```

---

## 📝 Notes

- Always update this file when you find a bug
- Include the fix so future sessions can learn
- Reference the guideline that was violated
- Track if the bug is fixed or still pending

---

## Bug #9: Missing Verification Badges on Ad Listings
**Date:** 2025-10-22
**Status:** ✅ Fixed
**Session:** Session Summary 2025-10-22

### Problem
Verification badges (golden for business, blue for individual) were only showing on:
- ✅ Ad Detail page (SellerCard component)
- ✅ Seller Profile page

But were missing on:
- ❌ Search results page (SearchResultCard component)
- ❌ All Ads page (AdCard component)
- ❌ Homepage ad listings

### Root Cause
1. **Frontend:** Components didn't render verification badges
2. **Backend:** API endpoints weren't returning verification fields (`business_verification_status`, `individual_verified`)

### Solution

#### Backend Changes
Updated SQL queries to include verification fields:

**File:** `/backend/routes/ads.js` (GET /api/ads)
```sql
-- Added to SELECT statement
u.business_verification_status,
u.individual_verified,

-- Added JOIN
LEFT JOIN users u ON a.user_id = u.id

-- Updated GROUP BY
GROUP BY a.id, c.name, l.name, u.business_verification_status, u.individual_verified
```

**File:** `/backend/server.js` (GET /api/ads/nearby)
```sql
-- Added to SELECT
u.business_verification_status, u.individual_verified,

-- Added JOIN
LEFT JOIN users u ON a.user_id = u.id
```

#### Frontend Changes

**File:** `/frontend/src/components/search/SearchResultCard.jsx`
Added seller info section with badges:
```jsx
{/* Seller Info with Verification Badge */}
{ad.seller_name && (
  <div style={{ /* styles */ }}>
    <span>Seller:</span>
    <span>{ad.seller_name}</span>
    {/* Golden Badge for Business Verified */}
    {ad.business_verification_status === 'approved' && (
      <img src="/golden-badge.png" alt="Verified Business" title="Verified Business Account" />
    )}
    {/* Blue Badge for Individual Verified */}
    {ad.individual_verified && ad.business_verification_status !== 'approved' && (
      <img src="/blue-badge.png" alt="Verified Seller" title="Verified Individual Seller" />
    )}
  </div>
)}
```

**File:** `/frontend/src/components/AdCard.jsx`
Added badges to seller name:
```jsx
<div className="ad-seller" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
  <strong>{ad.seller_name}</strong>
  {/* Verification badges */}
</div>
```

Also updated PropTypes to include:
```javascript
business_verification_status: PropTypes.string,
individual_verified: PropTypes.bool
```

### Verification Badge Logic
```javascript
// Priority: Business verification > Individual verification > No badge
if (business_verification_status === 'approved') {
  // Show golden badge + "Verified Business Account"
} else if (individual_verified === true) {
  // Show blue badge + "Verified Individual Seller"
} else {
  // No badge
}
```

### Tooltips
Native HTML `title` attribute provides hover tooltips:
- Golden badge: "Verified Business Account"
- Blue badge: "Verified Individual Seller"

### Files Modified
**Backend (2 files):**
- `/backend/routes/ads.js` - Main ads listing endpoint
- `/backend/server.js` - Nearby ads endpoint

**Frontend (2 files):**
- `/frontend/src/components/search/SearchResultCard.jsx` - Search results
- `/frontend/src/components/AdCard.jsx` - Ad card (used on homepage, all ads page)

### Testing Checklist
- [ ] Search results show verification badges
- [ ] All Ads page shows verification badges
- [ ] Homepage shows verification badges
- [ ] Badges display correctly (golden for business, blue for individual)
- [ ] Hover tooltips appear
- [ ] Backend returns verification fields in API responses

### Related Bugs
- See Bug #7 (Verification status enum mismatch) - Fixed same day

---

**END OF DEBUG PATTERNS**
