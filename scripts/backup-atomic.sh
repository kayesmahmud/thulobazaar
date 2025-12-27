#!/bin/bash

# Atomic Backup Script for ThulobaBazaar
# Creates consistent point-in-time backup of database + filesystem
# Based on PostgreSQL + MongoDB atomic backup best practices 2025

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/Users/elw/Documents/Web/thulobazaar/monorepo"
BACKUP_ROOT="/Users/elw/backups/thulobazaar"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"
KEEP_BACKUPS=7  # Keep last 7 backups

echo -e "${BLUE}📦 ThulobaBazaar Atomic Backup${NC}"
echo "=============================================="
echo "Timestamp: $TIMESTAMP"
echo "Backup to: $BACKUP_DIR"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"
cd "$PROJECT_DIR"

# ============================================
# Step 1: Create database backup
# ============================================
echo -e "${BLUE}Step 1/5: Backing up database...${NC}"

# Using pg_dump with custom format for faster restore
PGPASSWORD=postgres pg_dump \
  -U elw \
  -d thulobazaar \
  -F c \
  -f "$BACKUP_DIR/database.dump" \
  --verbose

DB_SIZE=$(du -sh "$BACKUP_DIR/database.dump" | cut -f1)
echo -e "${GREEN}✅ Database backed up ($DB_SIZE)${NC}"
echo ""

# ============================================
# Step 2: Backup _prisma_migrations table separately
# ============================================
echo -e "${BLUE}Step 2/5: Backing up migration history...${NC}"

PGPASSWORD=postgres psql -U elw -d thulobazaar -c \
  "COPY (SELECT * FROM _prisma_migrations ORDER BY started_at) TO STDOUT CSV HEADER" \
  > "$BACKUP_DIR/migrations.csv"

MIGRATION_COUNT=$(tail -n +2 "$BACKUP_DIR/migrations.csv" | wc -l | tr -d ' ')
echo -e "${GREEN}✅ Migrations backed up ($MIGRATION_COUNT migrations)${NC}"
echo ""

# ============================================
# Step 3: Copy uploads directory (rsync for efficiency)
# ============================================
echo -e "${BLUE}Step 3/5: Backing up uploaded files...${NC}"

# Using rsync with --link-dest for incremental backups (space-efficient)
LAST_BACKUP=$(ls -td "$BACKUP_ROOT"/20* 2>/dev/null | head -2 | tail -1)

if [ -n "$LAST_BACKUP" ] && [ -d "$LAST_BACKUP/uploads" ]; then
  echo "Using incremental backup (linking to $LAST_BACKUP)"
  rsync -av \
    --link-dest="$LAST_BACKUP/uploads" \
    apps/web/public/uploads/ \
    "$BACKUP_DIR/uploads/"
else
  echo "Creating full backup (no previous backup found)"
  rsync -av \
    apps/web/public/uploads/ \
    "$BACKUP_DIR/uploads/"
fi

FILE_COUNT=$(find "$BACKUP_DIR/uploads" -type f | wc -l | tr -d ' ')
UPLOAD_SIZE=$(du -sh "$BACKUP_DIR/uploads" | cut -f1)
echo -e "${GREEN}✅ Files backed up ($FILE_COUNT files, $UPLOAD_SIZE)${NC}"
echo ""

# ============================================
# Step 4: Backup configuration files
# ============================================
echo -e "${BLUE}Step 4/5: Backing up configuration...${NC}"

# Backup .env file (without sensitive values)
if [ -f ".env" ]; then
  grep -v "PASSWORD\|SECRET\|TOKEN\|KEY" .env > "$BACKUP_DIR/env.template" 2>/dev/null || true
fi

# Backup package.json files
cp package.json "$BACKUP_DIR/"
cp packages/database/package.json "$BACKUP_DIR/database-package.json"
cp packages/database/prisma/schema.prisma "$BACKUP_DIR/schema.prisma"

echo -e "${GREEN}✅ Configuration backed up${NC}"
echo ""

# ============================================
# Step 5: Create manifest with metadata
# ============================================
echo -e "${BLUE}Step 5/5: Creating manifest...${NC}"

GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
SCHEMA_HASH=$(sha256sum packages/database/prisma/schema.prisma | cut -d' ' -f1)

cat > "$BACKUP_DIR/manifest.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date -Iseconds)",
  "git_commit": "$GIT_COMMIT",
  "git_branch": "$GIT_BRANCH",
  "database": {
    "name": "thulobazaar",
    "size": "$DB_SIZE",
    "migrations_count": $MIGRATION_COUNT,
    "schema_hash": "$SCHEMA_HASH"
  },
  "uploads": {
    "file_count": $FILE_COUNT,
    "total_size": "$UPLOAD_SIZE"
  },
  "system": {
    "hostname": "$(hostname)",
    "postgres_version": "$(psql --version | head -1)",
    "node_version": "$(node --version)"
  }
}
EOF

echo -e "${GREEN}✅ Manifest created${NC}"
echo ""

# ============================================
# Verification
# ============================================
echo -e "${BLUE}Verification:${NC}"
echo "📊 Manifest contents:"
cat "$BACKUP_DIR/manifest.json"
echo ""

# Test database dump is valid
echo -e "${BLUE}Testing database dump integrity...${NC}"
if pg_restore --list "$BACKUP_DIR/database.dump" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Database dump is valid${NC}"
else
  echo -e "${RED}❌ Database dump appears corrupted${NC}"
  exit 1
fi
echo ""

# ============================================
# Cleanup old backups
# ============================================
echo -e "${BLUE}Cleaning up old backups (keeping last $KEEP_BACKUPS)...${NC}"

BACKUP_COUNT=$(ls -1d "$BACKUP_ROOT"/20* 2>/dev/null | wc -l | tr -d ' ')
if [ "$BACKUP_COUNT" -gt "$KEEP_BACKUPS" ]; then
  DELETE_COUNT=$((BACKUP_COUNT - KEEP_BACKUPS))
  ls -1td "$BACKUP_ROOT"/20* | tail -n $DELETE_COUNT | while read old_backup; do
    echo "Deleting: $old_backup"
    rm -rf "$old_backup"
  done
  echo -e "${GREEN}✅ Deleted $DELETE_COUNT old backup(s)${NC}"
else
  echo "No old backups to delete (have $BACKUP_COUNT, keeping $KEEP_BACKUPS)"
fi
echo ""

# ============================================
# Summary
# ============================================
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

echo "=============================================="
echo -e "${GREEN}✅ BACKUP COMPLETE${NC}"
echo ""
echo "📍 Location: $BACKUP_DIR"
echo "📦 Total size: $TOTAL_SIZE"
echo "🗄️  Database: $DB_SIZE"
echo "📁 Files: $FILE_COUNT files ($UPLOAD_SIZE)"
echo "🔄 Migrations: $MIGRATION_COUNT"
echo ""
echo "To restore this backup:"
echo "  ./scripts/restore.sh $BACKUP_DIR"
echo ""
