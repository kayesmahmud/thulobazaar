#!/bin/bash

# Safe Deletion Script for Old Backend and Frontend
# This script creates backups before deletion
# Run from: /Users/elw/Documents/Web/thulobazaar/monorepo

set -e  # Exit on error

echo "=========================================="
echo "🗑️  Safe Deletion of Old Backend & Frontend"
echo "=========================================="
echo ""

# Configuration
PARENT_DIR="/Users/elw/Documents/Web/thulobazaar"
BACKUP_DIR="$PARENT_DIR/backups/pre-deletion-$(date +%Y%m%d-%H%M%S)"
BACKEND_DIR="$PARENT_DIR/backend"
FRONTEND_DIR="$PARENT_DIR/frontend"

# Check if directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found: $BACKEND_DIR"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

echo "📂 Directories to backup:"
echo "  - $BACKEND_DIR"
echo "  - $FRONTEND_DIR"
echo ""
echo "💾 Backup location: $BACKUP_DIR"
echo ""

# Ask for confirmation
read -p "Create backups? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted by user"
    exit 0
fi

echo ""
echo "📦 Creating backups..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup backend
echo "  Backing up backend..."
cp -r "$BACKEND_DIR" "$BACKUP_DIR/backend"
echo "  ✅ Backend backed up"

# Backup frontend
echo "  Backing up frontend..."
cp -r "$FRONTEND_DIR" "$BACKUP_DIR/frontend"
echo "  ✅ Frontend backed up"

# Calculate sizes
BACKEND_SIZE=$(du -sh "$BACKUP_DIR/backend" | cut -f1)
FRONTEND_SIZE=$(du -sh "$BACKUP_DIR/frontend" | cut -f1)

echo ""
echo "✅ Backups created successfully!"
echo ""
echo "📊 Backup sizes:"
echo "  - Backend:  $BACKEND_SIZE"
echo "  - Frontend: $FRONTEND_SIZE"
echo ""

# List backup contents
echo "📋 Backup contents:"
ls -lh "$BACKUP_DIR"
echo ""

# Ask for deletion
echo "⚠️  WARNING: This will permanently delete the old backend and frontend folders!"
echo ""
read -p "Delete old folders? (type 'DELETE' to confirm): " delete_confirm

if [ "$delete_confirm" != "DELETE" ]; then
    echo "✅ Backups created, but folders NOT deleted"
    echo "   Backups are located at: $BACKUP_DIR"
    exit 0
fi

echo ""
echo "🗑️  Deleting old folders..."

# Delete backend
rm -rf "$BACKEND_DIR"
echo "  ✅ Backend deleted"

# Delete frontend
rm -rf "$FRONTEND_DIR"
echo "  ✅ Frontend deleted"

echo ""
echo "=========================================="
echo "✅ DELETION COMPLETE"
echo "=========================================="
echo ""
echo "📦 Backups preserved at:"
echo "   $BACKUP_DIR"
echo ""
echo "🚀 Next steps:"
echo "   1. Test your monorepo: cd monorepo && npm run dev"
echo "   2. Verify all endpoints work"
echo "   3. Keep backups for 30-90 days"
echo ""
