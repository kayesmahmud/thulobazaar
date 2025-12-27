# Next.js 15 Params Promise Fix

## Issue
Next.js 15 changed `params` to be a Promise. Direct access like `params.lang` now shows a warning and will break in future versions.

## Error Message
```
A param property was accessed directly with `params.lang`.
`params` is now a Promise and should be unwrapped with `React.use()`
before accessing properties of the underlying params object.
```

## Solution Pattern

### Before (Next.js 14 - Old Way):
```typescript
export default function MyPage({ params }: { params: { lang: string } }) {
  // Direct access to params.lang
  const someValue = params.lang;

  return <div>...</div>;
}
```

### After (Next.js 15 - New Way):
```typescript
import { use } from 'react';

export default function MyPage({ params }: { params: Promise<{ lang: string }> }) {
  // Unwrap params first
  const { lang } = use(params);

  // Now use the unwrapped value
  const someValue = lang;

  return <div>...</div>;
}
```

## Step-by-Step Fix

### 1. Add `use` to React imports
```typescript
// Before
import { useState } from 'react';

// After
import { use, useState } from 'react';
```

### 2. Update params type definition
```typescript
// Before
{ params }: { params: { lang: string } }

// After
{ params }: { params: Promise<{ lang: string }> }
```

### 3. Unwrap params at component start
```typescript
export default function MyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params); // Add this line

  // Rest of component...
}
```

### 4. Replace all `params.lang` with `lang`
```typescript
// Before
<DashboardLayout lang={params.lang} />
getEditorNavSections(params.lang)
router.push(`/${params.lang}/editor/login`)

// After
<DashboardLayout lang={lang} />
getEditorNavSections(lang)
router.push(`/${lang}/editor/login`)
```

## Files Already Fixed ✅

### Initial Fixes:
1. `/app/[lang]/editor/dashboard/page.tsx` - ✅ Fixed
2. `/app/[lang]/editor/templates/page.tsx` - ✅ Fixed

### High Priority (Pages using `useEditorAuth`):
3. `/app/[lang]/editor/ad-management/page.tsx` - ✅ Fixed
4. `/app/[lang]/editor/user-management/page.tsx` - ✅ Fixed
5. `/app/[lang]/editor/business-verification/page.tsx` - ✅ Fixed
6. `/app/[lang]/editor/individual-verification/page.tsx` - ✅ Fixed
7. `/app/[lang]/editor/reported-ads/page.tsx` - ✅ Fixed
8. `/app/[lang]/editor/user-reports/page.tsx` - ✅ Fixed

### Medium Priority (Other editor pages):
9. `/app/[lang]/editor/support-chat/page.tsx` - ✅ Fixed
10. `/app/[lang]/editor/analytics/page.tsx` - ✅ Fixed
11. `/app/[lang]/editor/audit-logs/page.tsx` - ✅ Fixed
12. `/app/[lang]/editor/bulk-actions/page.tsx` - ✅ Fixed

## Complete Example

Here's a complete before/after example from the templates page:

### Before:
```typescript
'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/admin';
import { useEditorAuth } from '@/hooks/useEditorAuth';

export default function ResponseTemplatesPage({ params }: { params: { lang: string } }) {
  const { staff, authLoading, handleLogout } = useEditorAuth(params.lang);

  return (
    <DashboardLayout
      lang={params.lang}
      navSections={getEditorNavSections(params.lang)}
    >
      <EditorPageHeader lang={params.lang} />
    </DashboardLayout>
  );
}
```

### After:
```typescript
'use client';

import { use, useState } from 'react';
import { DashboardLayout } from '@/components/admin';
import { useEditorAuth } from '@/hooks/useEditorAuth';

export default function ResponseTemplatesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const { staff, authLoading, handleLogout } = useEditorAuth(lang);

  return (
    <DashboardLayout
      lang={lang}
      navSections={getEditorNavSections(lang)}
    >
      <EditorPageHeader lang={lang} />
    </DashboardLayout>
  );
}
```

## Quick Fix Script

To help with mass updates, use this sed pattern:

```bash
# 1. Add 'use' import (if using useState)
sed -i '' "s/import { useState/import { use, useState/" page.tsx

# 2. Update params type
sed -i '' "s/{ params }: { params: { lang: string } }/{ params }: { params: Promise<{ lang: string }> }/" page.tsx

# 3. Manually add unwrap line after function declaration:
# const { lang } = use(params);

# 4. Replace all params.lang with lang (review changes!)
sed -i '' "s/params\.lang/lang/g" page.tsx
```

## Testing

After applying the fix:
1. ✅ No console warnings about params access
2. ✅ Page renders correctly
3. ✅ Navigation works
4. ✅ All lang-dependent features work

## References

- [Next.js 15 Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [React.use() Documentation](https://react.dev/reference/react/use)
- [Next.js App Router Params](https://nextjs.org/docs/app/api-reference/file-conventions/page#params)

## Notes

- This is a **migration path** - direct access still works but will be removed in future versions
- Apply this fix to ALL pages that use `params` in the App Router
- The `use()` hook can only be called in Client Components ('use client')
- For Server Components, params is NOT a Promise (different behavior)

---

**Status:** ✅ 12/12 editor pages fixed (100% complete)
**Result:** All Next.js 15 params Promise issues resolved!
