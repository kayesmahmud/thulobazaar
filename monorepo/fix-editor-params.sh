#!/bin/bash

# Fix Next.js 15 params Promise issue in all editor pages

echo "🔧 Fixing Next.js 15 params Promise issue in editor pages..."

# List of editor page files
files=(
  "apps/web/src/app/[lang]/editor/templates/page.tsx"
  "apps/web/src/app/[lang]/editor/support-chat/page.tsx"
  "apps/web/src/app/[lang]/editor/analytics/page.tsx"
  "apps/web/src/app/[lang]/editor/audit-logs/page.tsx"
  "apps/web/src/app/[lang]/editor/bulk-actions/page.tsx"
  "apps/web/src/app/[lang]/editor/ad-management/page.tsx"
  "apps/web/src/app/[lang]/editor/user-management/page.tsx"
  "apps/web/src/app/[lang]/editor/business-verification/page.tsx"
  "apps/web/src/app/[lang]/editor/individual-verification/page.tsx"
  "apps/web/src/app/[lang]/editor/reported-ads/page.tsx"
  "apps/web/src/app/[lang]/editor/user-reports/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"

    # 1. Add 'use' to React imports if not already there
    if ! grep -q "import { use," "$file" && grep -q "import { " "$file"; then
      sed -i '' "s/import { /import { use, /" "$file"
    fi

    # 2. Change params type from { lang: string } to Promise<{ lang: string }>
    sed -i '' "s/{ params }: { params: { lang: string } }/{ params }: { params: Promise<{ lang: string }> }/" "$file"

    # 3. Add const { lang } = use(params); after function declaration
    # This is trickier and needs to be done carefully

    echo "  ✓ Updated $file"
  else
    echo "  ⚠️  File not found: $file"
  fi
done

echo "✅ All editor pages updated!"
echo "⚠️  Please manually add 'const { lang } = use(params);' as the first line in each component function"
