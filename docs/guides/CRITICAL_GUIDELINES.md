# 🔴 CRITICAL DEVELOPMENT GUIDELINES

## ⚠️ TOP MISTAKES TO AVOID

This document contains the **most common and critical mistakes** that will break your app if not followed.

---

## 1. Snake_case vs CamelCase Mismatch 🐍

### ❌ THE PROBLEM

```typescript
// Database returns (PostgreSQL uses snake_case):
{
  "full_name": "John Doe",
  "created_at": "2024-01-01",
  "is_active": true
}

// But you try to access (JavaScript convention is camelCase):
user.fullName  // ❌ undefined!
user.createdAt // ❌ undefined!
user.isActive  // ❌ undefined!
```

### ✅ THE SOLUTION

**ALWAYS use transformers:**

```typescript
// ✅ CORRECT - Backend code
import { transformDbUserToApi, DbUser } from '@thulobazaar/types';

const result = await pool.query<DbUser>('SELECT * FROM users WHERE id = $1', [id]);
const dbUser = result.rows[0];

// Transform DB format to API format
const apiUser = transformDbUserToApi(dbUser);

res.json({ success: true, data: apiUser });
```

Now frontend can access:
```typescript
user.fullName  // ✅ "John Doe"
user.createdAt // ✅ Date
user.isActive  // ✅ true
```

---

## 2. Wrong Property Names in req.user 🔑

### ❌ THE PROBLEM

```typescript
// You assume JWT has "sub" property
const userId = req.user.sub;  // ❌ undefined!
```

### ✅ THE SOLUTION

**Step 1: ALWAYS log the object first**

```typescript
console.log('🔍 Full req.user:', req.user);
console.log('🔍 Keys:', Object.keys(req.user));
```

**Step 2: Use the correct property**

```typescript
// After logging, you see: { id: 123, email: "..." }
const userId = req.user.id;  // ✅ works!
```

**Step 3: Use safe accessor**

```typescript
import { safeGet } from '@thulobazaar/types';

const userId = safeGet<number>(req.user, 'id', 'req.user.id');
if (!userId) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

---

## 3. Null/Undefined Property Access 💥

### ❌ THE PROBLEM

```typescript
const name = user.profile.name;  // ❌ user.profile is null!
const price = ad.attributes.price; // ❌ ad.attributes is undefined!
```

### ✅ THE SOLUTION

**Option 1: Optional Chaining (Recommended)**

```typescript
const name = user?.profile?.name;  // ✅ Returns undefined instead of crashing
const price = ad?.attributes?.price;
```

**Option 2: Explicit Checks**

```typescript
if (user && user.profile && user.profile.name) {
  const name = user.profile.name;
}
```

**Option 3: Provide Defaults**

```typescript
const name = user?.profile?.name || 'Unknown';
const price = ad?.attributes?.price ?? 0;
```

---

## 4. TypeScript Type Assumptions 📝

### ❌ THE PROBLEM

```typescript
// TypeScript infers wrong type
let existingImages = [];  // Inferred as never[]
existingImages = JSON.parse(body.existingImages);  // ❌ Type error!
```

### ✅ THE SOLUTION

**ALWAYS use explicit types:**

```typescript
// ✅ CORRECT
let existingImages: string[] = [];
existingImages = JSON.parse(body.existingImages);

// Or even better - use interface
interface ImageData {
  url: string;
  order: number;
}

let existingImages: ImageData[] = [];
existingImages = JSON.parse(body.existingImages);
```

---

## 5. Database Query Type Safety 🗄️

### ❌ THE PROBLEM

```typescript
const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
const user = result.rows[0];
// user is typed as 'any' - no type safety!
```

### ✅ THE SOLUTION

**Use generic types:**

```typescript
import { DbUser } from '@thulobazaar/types';

const result = await pool.query<DbUser>(
  'SELECT * FROM users WHERE id = $1',
  [id]
);
const user = result.rows[0]; // ✅ Typed as DbUser!

// Now TypeScript knows the exact properties
console.log(user.full_name);  // ✅ Type-safe
console.log(user.created_at); // ✅ Type-safe
```

---

## ✅ BEST PRACTICES CHECKLIST

### Before Writing Any Code:

- [ ] **Check database schema**: Run `\d table_name` in psql
- [ ] **Log full objects**: `console.log('🔍 Full object:', obj)`
- [ ] **Use transformers**: Convert snake_case to camelCase
- [ ] **Add type annotations**: Never rely on type inference for important data
- [ ] **Use optional chaining**: Access nested properties safely
- [ ] **Verify JWT structure**: Log `req.user` to see actual properties

### Example Checklist for a New Endpoint:

```typescript
// ✅ CORRECT EXAMPLE

// 1. Import types
import { DbAd, transformDbAdToApi, safeGet } from '@thulobazaar/types';
import { Request, Response } from 'express';

// 2. Type the request
interface GetAdRequest extends Request {
  user?: { id: number; email: string };
}

// 3. Handler with full type safety
async function getAd(req: GetAdRequest, res: Response) {
  try {
    // 4. Safe property access
    const userId = safeGet<number>(req.user, 'id', 'req.user.id');
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const adId = parseInt(req.params.id);
    if (isNaN(adId)) {
      return res.status(400).json({ error: 'Invalid ad ID' });
    }

    // 5. Typed query
    const result = await pool.query<DbAd>(
      'SELECT * FROM ads WHERE id = $1 AND user_id = $2',
      [adId, userId]
    );

    // 6. Check for null
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    const dbAd = result.rows[0];

    // 7. Transform to API format
    const apiAd = transformDbAdToApi(dbAd);

    // 8. Return
    res.json({ success: true, data: apiAd });

  } catch (error) {
    console.error('❌ Error in getAd:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 🎯 Quick Reference

### Database Types (Backend)
```typescript
import { DbUser, DbAd, DbCategory } from '@thulobazaar/types';
// Use these when querying PostgreSQL
```

### API Types (Frontend/Mobile)
```typescript
import { User, Ad, Category } from '@thulobazaar/types';
// Use these in React/React Native components
```

### Transformers (Critical!)
```typescript
import { transformDbUserToApi, transformDbAdToApi } from '@thulobazaar/types';

// Always transform before sending to frontend
const apiUser = transformDbUserToApi(dbUser);
```

### Safe Access
```typescript
import { safeGet } from '@thulobazaar/types';

const userId = safeGet<number>(req.user, 'id', 'req.user.id');
```

---

## 🚨 Common Error Messages & Fixes

### "Cannot read property 'X' of undefined"

**Cause:** Trying to access property on null/undefined object

**Fix:**
```typescript
// Use optional chaining
const value = obj?.nested?.property;
```

### "Property 'fullName' does not exist on type 'DbUser'"

**Cause:** Using camelCase property on database type

**Fix:**
```typescript
// Use correct snake_case OR transform first
const name = dbUser.full_name; // ✅ Direct access
// OR
const user = transformDbUserToApi(dbUser);
const name = user.fullName; // ✅ After transform
```

### "Type 'never[]' is not assignable to type 'string[]'"

**Cause:** TypeScript inferred wrong type from empty array

**Fix:**
```typescript
// Add explicit type annotation
let images: string[] = [];
```

---

## 📖 Further Reading

- [Database Types Reference](./packages/types/src/database.ts)
- [API Types Reference](./packages/types/src/api.ts)
- [Transformers Reference](./packages/types/src/transformers.ts)

---

**Remember: The #1 rule is NEVER ASSUME PROPERTY NAMES - ALWAYS VERIFY WITH LOGGING FIRST!**
