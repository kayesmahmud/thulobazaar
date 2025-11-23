#!/bin/bash

# Quick Fixes for ThuLoBazaar Monorepo
# Fixes the 2 issues found in Code Health Report

set -e  # Exit on error

echo "=========================================="
echo "🔧 Quick Fixes for ThuLoBazaar Monorepo"
echo "=========================================="
echo ""

# Configuration
MONOREPO_DIR="/Users/elw/Documents/Web/thulobazaar/monorepo"
WEB_APP_DIR="$MONOREPO_DIR/apps/web"

# Fix #1: Clear Next.js Cache and Restart Dev Server
echo "🔄 Fix #1: Clearing Next.js cache..."
echo ""

# Kill dev server if running
echo "  Stopping dev server (if running)..."
lsof -ti:3333 | xargs kill -9 2>/dev/null || echo "  No dev server running on port 3333"

# Clear Next.js cache
echo "  Clearing .next cache..."
if [ -d "$WEB_APP_DIR/.next" ]; then
    rm -rf "$WEB_APP_DIR/.next"
    echo "  ✅ Cache cleared"
else
    echo "  ℹ️  No cache found (already clean)"
fi

# Clear Turbo cache
echo "  Clearing Turbo cache..."
if [ -d "$MONOREPO_DIR/.turbo" ]; then
    rm -rf "$MONOREPO_DIR/.turbo"
    echo "  ✅ Turbo cache cleared"
fi

echo ""
echo "✅ Fix #1 Complete: Cache cleared"
echo ""

# Fix #2: Add .gitignore to apps/web
echo "📝 Fix #2: Adding .gitignore to apps/web..."
echo ""

GITIGNORE_PATH="$WEB_APP_DIR/.gitignore"

if [ -f "$GITIGNORE_PATH" ]; then
    echo "  ℹ️  .gitignore already exists, backing up..."
    mv "$GITIGNORE_PATH" "$GITIGNORE_PATH.backup"
    echo "  Backup created: .gitignore.backup"
fi

cat > "$GITIGNORE_PATH" << 'EOF'
# Next.js
/.next/
/out/

# Production
/build

# Local env files
.env*.local
.env
!.env.example

# Testing
/coverage
/.nyc_output

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
.pnpm-debug.log*

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Vercel
.vercel
EOF

echo "  ✅ .gitignore created"
echo ""
echo "✅ Fix #2 Complete: .gitignore added"
echo ""

# Summary
echo "=========================================="
echo "✅ ALL FIXES APPLIED"
echo "=========================================="
echo ""
echo "📋 Summary:"
echo "  1. ✅ Next.js cache cleared"
echo "  2. ✅ .gitignore added to apps/web"
echo ""
echo "🚀 Next Steps:"
echo "  1. Start dev server: cd $MONOREPO_DIR && npm run dev"
echo "  2. Test endpoints: curl http://localhost:3333/api/categories"
echo "  3. Test admin endpoint: curl -H 'Authorization: Bearer \$TOKEN' http://localhost:3333/api/admin/ads?limit=2"
echo ""
echo "📚 For more details, see: CODE_HEALTH_REPORT.md"
echo ""
