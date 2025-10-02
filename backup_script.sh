#!/bin/bash

# Daily Backup Script for Thulobazaar
# This script backs up database and pushes to GitHub
# Created: $(date)

# Configuration
PROJECT_DIR="/Users/elw/Documents/Web/thulobazaar"
BACKEND_DIR="$PROJECT_DIR/backend"
DB_NAME="thulobazaar"
DB_USER="elw"
DB_HOST="localhost"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Start backup process
log "🚀 Starting daily backup for Thulobazaar..."

# Change to project directory
cd "$PROJECT_DIR" || {
    error "Failed to change to project directory: $PROJECT_DIR"
    exit 1
}

# Check if git repo exists
if [ ! -d ".git" ]; then
    error "Not a git repository. Please initialize git first."
    exit 1
fi

# Step 1: Database backup
log "📊 Creating database backup..."
DB_BACKUP_FILE="$BACKEND_DIR/thulobazaar_backup_$DATE.sql"
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$DB_BACKUP_FILE"

if [ $? -eq 0 ] && [ -s "$DB_BACKUP_FILE" ]; then
    log "✅ Database backup created: $(basename $DB_BACKUP_FILE)"

    # Also create/update the main backup file
    cp "$DB_BACKUP_FILE" "$BACKEND_DIR/thulobazaar_backup.sql"
    log "✅ Updated main backup file: thulobazaar_backup.sql"
else
    error "Database backup failed!"
    exit 1
fi

# Step 2: Clean old backups (keep only last 7 days)
log "🧹 Cleaning old database backups..."
find "$BACKEND_DIR" -name "thulobazaar_backup_*.sql" -mtime +7 -delete
log "✅ Old backups cleaned (kept last 7 days)"

# Step 3: Add all changes to git
log "📁 Adding files to git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    warn "No changes detected. Skipping commit."
else
    # Step 4: Create commit
    log "💾 Committing changes..."
    COMMIT_MSG="Daily backup - $(date '+%Y-%m-%d %H:%M:%S')

    - Database backup created
    - Code changes included
    - Automated daily backup"

    git commit -m "$COMMIT_MSG"

    if [ $? -eq 0 ]; then
        log "✅ Changes committed successfully"
    else
        error "Git commit failed!"
        exit 1
    fi
fi

# Step 5: Push to GitHub
log "🚀 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    log "✅ Successfully pushed to GitHub"
else
    error "Failed to push to GitHub. Check your internet connection and GitHub access."
    exit 1
fi

# Step 6: Create a compressed backup archive (optional)
log "📦 Creating compressed backup archive..."
ARCHIVE_NAME="thulobazaar_backup_$DATE.tar.gz"
tar -czf "$BACKUP_DIR/$ARCHIVE_NAME" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=backups \
    --exclude="*.log" \
    -C "$PROJECT_DIR/.." \
    "$(basename $PROJECT_DIR)"

if [ $? -eq 0 ]; then
    log "✅ Compressed backup created: $ARCHIVE_NAME"
else
    warn "Failed to create compressed backup"
fi

# Step 7: Clean old archives (keep only last 14 days)
find "$BACKUP_DIR" -name "thulobazaar_backup_*.tar.gz" -mtime +14 -delete

# Summary
log "🎉 Backup completed successfully!"
log "📊 Database: $(basename $DB_BACKUP_FILE)"
log "📦 Archive: $ARCHIVE_NAME (if created)"
log "🚀 Pushed to GitHub: $(git log -1 --oneline)"

exit 0