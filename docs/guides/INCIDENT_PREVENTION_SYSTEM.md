# Incident Prevention System

## 🚨 Analysis of Past Incidents

### Incident 1: Homepage Crash (Schema Drift)
**What happened:** Database missing `categories.form_template`, `ads.custom_fields`, `user_favorites` table
**Root cause:** No `_prisma_migrations` table → schema changes not tracked → DB restore lost columns
**Impact:** Homepage completely broken, unable to load categories

### Incident 2: Ad 404s (Missing Slugs)
**What happened:** Recent ads had `slug = NULL` or empty → `/ad/...` lookups failed
**Root cause:** Slug generation logic not enforced at database level
**Impact:** Users can't view ad detail pages, SEO broken, broken links everywhere

### Incident 3: Missing Images (File/DB Mismatch)
**What happened:** DB references `ad-1759979208010-*.webp` but files don't exist in `public/uploads/ads/`
**Root cause:** Different backup timepoints for database vs filesystem
**Impact:** All ad images show fallback/broken, poor user experience

---

## 🛡️ Prevention Strategy

### 1. Schema Drift Prevention (✅ IMPLEMENTED)

**What We Did:**
- ✅ Created drift detection script (`check-schema-drift.sh`)
- ✅ Migration initialization script (`init-migrations.sh`)
- ✅ NPM commands for migrations
- ✅ Comprehensive documentation

**What's Still Needed:**
```bash
# Add to package.json (monorepo root)
"scripts": {
  "pre-deploy": "cd packages/database && npm run db:check-drift",
  "test:schema": "cd packages/database && npm run db:migrate:status"
}
```

**CI/CD Integration:**
```yaml
# .github/workflows/schema-validation.yml
- name: Validate Schema
  run: |
    cd packages/database
    npm run db:check-drift
    npm run db:migrate:status
```

---

### 2. Data Integrity Validation (NEW)

**Problem:** No validation that critical data exists and is valid

**Solution: Health Check System**

#### A. Database Constraints (Immediate Fix)
```sql
-- Enforce slugs are never NULL
ALTER TABLE ads
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT ads_slug_not_empty CHECK (slug != ''),
  ADD CONSTRAINT ads_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*-[0-9]+$');

-- Enforce categories have valid data
ALTER TABLE categories
  ALTER COLUMN name SET NOT NULL,
  ADD CONSTRAINT categories_name_not_empty CHECK (name != '');

-- Image paths must be valid
ALTER TABLE ad_images
  ALTER COLUMN file_path SET NOT NULL,
  ADD CONSTRAINT ad_images_path_not_empty CHECK (file_path != '');
```

#### B. Application-Level Validation
```typescript
// packages/database/src/validators.ts
export const validateAd = (ad: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!ad.slug || ad.slug === '') {
    errors.push('Ad slug is required');
  }

  if (!ad.slug?.match(/^[a-z0-9]+(-[a-z0-9]+)*-\d+$/)) {
    errors.push(`Invalid slug format: ${ad.slug}`);
  }

  if (!ad.title || ad.title.trim() === '') {
    errors.push('Ad title is required');
  }

  return { valid: errors.length === 0, errors };
};
```

#### C. Data Integrity Check Script
```bash
#!/bin/bash
# packages/database/scripts/check-data-integrity.sh

echo "🔍 Checking data integrity..."

# Check for NULL slugs
NULL_SLUGS=$(psql -U elw -d thulobazaar -tAc "SELECT COUNT(*) FROM ads WHERE slug IS NULL OR slug = '';")
if [ "$NULL_SLUGS" -gt 0 ]; then
  echo "❌ Found $NULL_SLUGS ads with NULL/empty slugs"
  exit 1
fi

# Check for orphaned ad_images (file doesn't exist)
echo "🔍 Checking for orphaned ad images..."
psql -U elw -d thulobazaar -tAc "
  SELECT file_path FROM ad_images
" | while read filepath; do
  if [ ! -f "../../apps/web/public/$filepath" ]; then
    echo "❌ Missing file: $filepath"
  fi
done

echo "✅ Data integrity check passed"
```

---

### 3. Backup/Restore Strategy (NEW)

**Problem:** DB and filesystem restored from different timepoints

**Solution: Atomic Backups**

#### A. Unified Backup Script
```bash
#!/bin/bash
# scripts/backup-atomic.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/thulobazaar/$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

echo "📦 Creating atomic backup at $TIMESTAMP..."

# 1. Dump database
echo "  → Database..."
PGPASSWORD=postgres pg_dump -U elw -d thulobazaar \
  -F c -f "$BACKUP_DIR/database.dump"

# 2. Copy uploads directory
echo "  → Upload files..."
rsync -av --delete \
  apps/web/public/uploads/ \
  "$BACKUP_DIR/uploads/"

# 3. Save migration state
echo "  → Migration state..."
PGPASSWORD=postgres psql -U elw -d thulobazaar -c \
  "COPY _prisma_migrations TO '$BACKUP_DIR/migrations.csv' CSV HEADER;"

# 4. Create manifest
cat > "$BACKUP_DIR/manifest.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "database_size": "$(du -sh $BACKUP_DIR/database.dump | cut -f1)",
  "uploads_count": "$(find $BACKUP_DIR/uploads -type f | wc -l)",
  "git_commit": "$(git rev-parse HEAD)",
  "schema_hash": "$(sha256sum packages/database/prisma/schema.prisma | cut -d' ' -f1)"
}
EOF

echo "✅ Atomic backup complete: $BACKUP_DIR"
echo "📊 Manifest:"
cat "$BACKUP_DIR/manifest.json"
```

#### B. Restore Validation Script
```bash
#!/bin/bash
# scripts/restore-validate.sh

BACKUP_DIR="$1"

echo "🔍 Validating backup before restore..."

# Check manifest exists
if [ ! -f "$BACKUP_DIR/manifest.json" ]; then
  echo "❌ No manifest.json found"
  exit 1
fi

# Check all components exist
MISSING=0
[ ! -f "$BACKUP_DIR/database.dump" ] && echo "❌ Missing database.dump" && MISSING=1
[ ! -d "$BACKUP_DIR/uploads" ] && echo "❌ Missing uploads directory" && MISSING=1
[ ! -f "$BACKUP_DIR/migrations.csv" ] && echo "❌ Missing migrations.csv" && MISSING=1

if [ $MISSING -eq 1 ]; then
  exit 1
fi

echo "✅ Backup validation passed"
cat "$BACKUP_DIR/manifest.json"
```

---

### 4. File Sync Validation (NEW)

**Problem:** ad_images table references files that don't exist

**Solution: File Sync Check**

```bash
#!/bin/bash
# packages/database/scripts/check-file-sync.sh

echo "🔍 Checking file synchronization..."

UPLOADS_DIR="../../apps/web/public/uploads/ads"
ORPHANED=0
MISSING=0

# Check DB → Filesystem (orphaned DB records)
psql -U elw -d thulobazaar -tAc "
  SELECT file_path FROM ad_images
" | while read filepath; do
  FULL_PATH="../../apps/web/public/$filepath"
  if [ ! -f "$FULL_PATH" ]; then
    echo "❌ DB orphan: $filepath (file doesn't exist)"
    ((ORPHANED++))
  fi
done

# Check Filesystem → DB (orphaned files)
find "$UPLOADS_DIR" -type f -name "*.webp" | while read file; do
  FILENAME=$(basename "$file")
  COUNT=$(psql -U elw -d thulobazaar -tAc "
    SELECT COUNT(*) FROM ad_images WHERE filename = '$FILENAME'
  ")

  if [ "$COUNT" -eq 0 ]; then
    echo "⚠️  Filesystem orphan: $FILENAME (not in DB)"
    ((MISSING++))
  fi
done

if [ $ORPHANED -gt 0 ] || [ $MISSING -gt 0 ]; then
  echo ""
  echo "❌ File sync issues found:"
  echo "   DB orphans: $ORPHANED"
  echo "   Filesystem orphans: $MISSING"
  exit 1
fi

echo "✅ File sync check passed"
```

---

### 5. Pre-Deployment Checklist (NEW)

**Automated Pre-Deploy Validation**

```bash
#!/bin/bash
# scripts/pre-deploy.sh

set -e

echo "🚀 Pre-Deployment Validation"
echo "=============================="
echo ""

FAILED=0

# 1. Schema Drift Check
echo "1️⃣  Checking schema drift..."
cd packages/database
if ! npm run db:check-drift; then
  echo "❌ Schema drift detected"
  FAILED=1
else
  echo "✅ Schema is in sync"
fi
echo ""

# 2. Data Integrity Check
echo "2️⃣  Checking data integrity..."
if ! ./scripts/check-data-integrity.sh; then
  echo "❌ Data integrity issues found"
  FAILED=1
else
  echo "✅ Data integrity validated"
fi
echo ""

# 3. File Sync Check
echo "3️⃣  Checking file synchronization..."
if ! ./scripts/check-file-sync.sh; then
  echo "❌ File sync issues found"
  FAILED=1
else
  echo "✅ Files are synchronized"
fi
echo ""

# 4. Run Tests
echo "4️⃣  Running tests..."
cd ../..
if ! npm test; then
  echo "❌ Tests failed"
  FAILED=1
else
  echo "✅ Tests passed"
fi
echo ""

# 5. Database Health Check
echo "5️⃣  Checking database health..."
cd packages/database
DB_HEALTH=$(node -e "
  import { checkDatabaseHealth } from './src/index.ts';
  const health = await checkDatabaseHealth();
  if (!health.healthy) process.exit(1);
")
if [ $? -ne 0 ]; then
  echo "❌ Database unhealthy"
  FAILED=1
else
  echo "✅ Database healthy"
fi
echo ""

# Final result
echo "=============================="
if [ $FAILED -eq 1 ]; then
  echo "❌ PRE-DEPLOYMENT VALIDATION FAILED"
  echo "   Fix the issues above before deploying"
  exit 1
else
  echo "✅ PRE-DEPLOYMENT VALIDATION PASSED"
  echo "   Safe to deploy!"
fi
```

---

## 📋 Implementation Checklist

### Phase 1: Immediate (Today)
- [x] Schema drift prevention scripts
- [x] Migration initialization
- [ ] Add database constraints (slugs, NOT NULL)
- [ ] Create data integrity check script
- [ ] Create file sync check script

### Phase 2: This Week
- [ ] Implement atomic backup script
- [ ] Create restore validation script
- [ ] Add pre-deployment validation script
- [ ] Update CI/CD with validation steps
- [ ] Create monitoring dashboards

### Phase 3: This Month
- [ ] Automated daily backups (with verification)
- [ ] Slack/email alerts for integrity issues
- [ ] Add application-level validators
- [ ] Document recovery procedures
- [ ] Team training on new processes

---

## 🎯 NPM Scripts to Add

### Monorepo Root (package.json)
```json
{
  "scripts": {
    "backup": "./scripts/backup-atomic.sh",
    "restore": "./scripts/restore.sh",
    "pre-deploy": "./scripts/pre-deploy.sh",
    "validate": "./scripts/pre-deploy.sh",
    "health-check": "cd packages/database && npm run db:health"
  }
}
```

### Database Package (packages/database/package.json)
```json
{
  "scripts": {
    "db:check-integrity": "./scripts/check-data-integrity.sh",
    "db:check-files": "./scripts/check-file-sync.sh",
    "db:health": "node -e \"import {checkDatabaseHealth} from './src/index.ts'; console.log(await checkDatabaseHealth())\"",
    "db:constraints": "./scripts/add-constraints.sql"
  }
}
```

---

## 🔄 New Workflow

### Before Making Changes
```bash
# Check current state
npm run validate

# Make changes...
# Edit code, schema, etc.

# Validate before commit
npm run validate
git commit
```

### Before Deployment
```bash
# Full validation
npm run pre-deploy

# If passed, deploy
npm run deploy
```

### After Deployment
```bash
# Create atomic backup
npm run backup

# Verify health
npm run health-check
```

---

## 📊 Monitoring & Alerts

### Daily Automated Checks (Cron)
```bash
# /etc/cron.d/thulobazaar-checks
0 2 * * * cd /path/to/monorepo && npm run backup >> /var/log/thulobazaar-backup.log 2>&1
0 9 * * * cd /path/to/monorepo/packages/database && npm run db:check-drift >> /var/log/thulobazaar-drift.log 2>&1
0 10 * * * cd /path/to/monorepo/packages/database && npm run db:check-integrity >> /var/log/thulobazaar-integrity.log 2>&1
```

### Slack Webhook Integration
```bash
# Add to scripts
if [ $FAILED -eq 1 ]; then
  curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
    -H 'Content-Type: application/json' \
    -d '{
      "text": "⚠️ ThulobaBazaar: Data integrity check failed",
      "attachments": [{
        "color": "danger",
        "fields": [
          {"title": "Environment", "value": "Production"},
          {"title": "Issue", "value": "Schema drift detected"}
        ]
      }]
    }'
fi
```

---

## 🎓 Team Training

### Developer Responsibilities
1. ✅ NEVER edit database directly
2. ✅ Run `npm run validate` before committing
3. ✅ Always create migrations for schema changes
4. ✅ Check logs if validation fails
5. ✅ Don't commit if pre-deploy fails

### DevOps Responsibilities
1. ✅ Run `npm run backup` before deployments
2. ✅ Verify backup manifest
3. ✅ Run `npm run pre-deploy` before deploying
4. ✅ Monitor Slack alerts
5. ✅ Test restore process monthly

---

## 🔥 Emergency Procedures

### Scenario 1: Schema Drift Detected in Production
```bash
# 1. Generate diff
cd packages/database
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > emergency-fix.sql

# 2. Review SQL
cat emergency-fix.sql

# 3. Create backup FIRST
npm run backup

# 4. Apply fix
psql -U elw -d thulobazaar < emergency-fix.sql

# 5. Validate
npm run db:check-drift
```

### Scenario 2: Missing Ad Images
```bash
# 1. Identify scope
cd packages/database
npm run db:check-files > missing-files.log

# 2. Restore files from backup
rsync -av /backups/thulobazaar/LATEST/uploads/ \
  ../../apps/web/public/uploads/

# 3. Verify
npm run db:check-files
```

### Scenario 3: Data Corruption
```bash
# 1. Stop application
pm2 stop all

# 2. Create emergency backup
npm run backup

# 3. Restore from last known good backup
./scripts/restore.sh /backups/thulobazaar/20241210_090000/

# 4. Validate
npm run validate

# 5. Restart application
pm2 start all
```

---

## 📈 Success Metrics

Track these weekly:
- ✅ Schema drift incidents: **Target 0**
- ✅ 404 errors on ad pages: **< 0.1%**
- ✅ Missing image ratio: **< 0.5%**
- ✅ Backup success rate: **100%**
- ✅ Pre-deploy validation pass rate: **> 95%**

---

## 🎯 Summary

**Root Causes Identified:**
1. No migration tracking → schema drift
2. No data validation → NULL slugs
3. Separate backup timepoints → file/DB mismatch

**Solutions Implemented:**
1. ✅ Migration tracking system
2. ⏳ Database constraints (in progress)
3. ⏳ Atomic backups (in progress)
4. ⏳ Pre-deploy validation (in progress)

**Next Steps:**
1. Run `npm run db:init-migrations` (one-time)
2. Add database constraints
3. Implement atomic backup script
4. Set up CI/CD validation
5. Train team on new processes

**Never again will you have:**
- Homepage crashes from schema drift
- 404s from missing slugs
- Broken images from file/DB mismatch

🎉 **Prevention is better than cure!**
