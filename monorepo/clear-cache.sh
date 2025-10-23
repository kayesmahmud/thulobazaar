#!/bin/bash
# Clear all monorepo caches and rebuild packages
# Use this when code changes don't seem to apply

echo "🧹 Clearing all caches..."
cd /Users/elw/Documents/Web/thulobazaar/monorepo

# Remove all cache directories
rm -rf .turbo \
       packages/api-client/dist \
       packages/api-client/.turbo \
       packages/types/dist \
       packages/types/.turbo \
       packages/utils/dist \
       packages/utils/.turbo \
       packages/database/.turbo \
       apps/web/.next \
       apps/web/.turbo

echo "✅ Caches cleared!"
echo ""
echo "🔨 Rebuilding packages..."

# Rebuild types package (required by other packages)
cd packages/types
npm run build
echo "  ✅ Types package built"

# Rebuild api-client package
cd ../api-client
npm run build
echo "  ✅ API client package built"

# Return to root
cd /Users/elw/Documents/Web/thulobazaar/monorepo

echo ""
echo "✅ Done! All caches cleared and packages rebuilt."
echo ""
echo "📝 Next steps:"
echo "  1. Restart dev server: npm run dev:web"
echo "  2. Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
echo ""
