# Database, Prisma & Schema Guidelines

**Last Updated:** December 2024
**Purpose:** Prevent homepage crashes, 404 errors, and data integrity issues

---

## 🎯 The Golden Rules

### Rule #1: NEVER Edit the Database Directly
```bash
# ❌ WRONG - Direct SQL changes
psql -U elw -d thulobazaar -c "ALTER TABLE categories ADD COLUMN form_template JSONB;"

# ✅ CORRECT - Use migrations
cd packages/database
# Edit schema.prisma first
npm run db:migrate
```

**Why?** Direct changes aren't tracked in version control. Next deployment = missing columns = crashes.

### Rule #2: ALWAYS Use Migrations for Schema Changes
```bash
# ✅ CORRECT workflow:
1. Edit packages/database/prisma/schema.prisma
2. cd packages/database && npm run db:migrate
3. Git commit the migration files
4. Deploy with npm run db:migrate:deploy
```

### Rule #3: Check for Drift Before Every Deployment
```bash
# ✅ MUST DO before deploying:
cd packages/database
npm run db:check-drift

# If drift detected:
npm run db:check-drift -- --fix
```

### Rule #4: Use Atomic Backups
```bash
# ✅ CORRECT - Database + files together
npm run backup

# ❌ WRONG - Separate backups
pg_dump ... # Database only
cp -r uploads/ ... # Files only (different time = mismatch)
```

### Rule #5: Validate Data Integrity
```bash
# ✅ MUST DO regularly:
cd packages/database
npm run db:check-integrity  # Check for NULL slugs, invalid data
npm run db:check-files      # Verify DB ↔ filesystem sync
```

---

## 📋 Daily Workflows

### Making Schema Changes

#### Step 1: Edit schema.prisma
```prisma
// packages/database/prisma/schema.prisma

model ads {
  id          Int      @id @default(autoincrement())
  title       String   // ← Edit/add fields here
  slug        String   @unique  // ← New field
  price       Decimal  @db.Decimal(10, 2)
  // ...
}
```

#### Step 2: Create Migration
```bash
cd packages/database
npm run db:migrate

# Prisma asks: "Name of migration:"
# Enter: add_slug_to_ads
```

#### Step 3: Review Generated SQL
```bash
# Check what Prisma generated:
cat migrations/20241211_add_slug_to_ads/migration.sql

# Should look like:
# ALTER TABLE "ads" ADD COLUMN "slug" TEXT;
# CREATE UNIQUE INDEX "ads_slug_key" ON "ads"("slug");
```

#### Step 4: Test Locally
```bash
# Migration already applied by db:migrate
# Test your application works
npm run dev:web
npm run dev:api
```

#### Step 5: Commit to Git
```bash
git add packages/database/migrations/
git add packages/database/prisma/schema.prisma
git commit -m "Add slug column to ads table"
git push
```

#### Step 6: Deploy to Production
```bash
# On production server:
cd packages/database
npm run db:migrate:deploy  # NOT db:migrate!

# Verify:
npm run db:migrate:status
```

---

## 🚨 What NOT to Do

### ❌ Don't Use db:push in Production
```bash
# ❌ NEVER DO THIS:
npx prisma db push

# Why? It doesn't create migration files!
# Next deployment = schema drift = crashes
```

### ❌ Don't Edit Applied Migrations
```bash
# ❌ NEVER DO THIS:
nano migrations/20241210_add_column/migration.sql  # Don't edit!

# ✅ INSTEAD: Create a new migration
npm run db:migrate
```

### ❌ Don't Delete Migration Files
```bash
# ❌ NEVER DO THIS:
rm migrations/20241210_add_column/

# Why? Breaks migration history!
# Other developers won't be able to sync
```

### ❌ Don't Mix Migration Tools
```bash
# ❌ WRONG - Mixing db:push and db:migrate
npx prisma db push           # Uses one system
npx prisma migrate dev       # Uses another system

# ✅ CORRECT - Pick ONE and stick with it
# We use: npm run db:migrate (always)
```

### ❌ Don't Skip Pre-Deployment Checks
```bash
# ❌ WRONG - Deploy without checking
git push
# ... deploy script runs ...
# 💥 CRASH! Missing columns!

# ✅ CORRECT - Check first
npm run db:check-drift
npm run validate
# ... then deploy ...
```

---

## ✅ Best Practices Checklist

### Before Starting Work
```bash
□ Pull latest code: git pull
□ Check migration status: cd packages/database && npm run db:migrate:status
□ Apply pending migrations: npm run db:migrate:deploy
□ Verify no drift: npm run db:check-drift
```

### When Making Schema Changes
```bash
□ Edit schema.prisma (NOT database directly)
□ Run npm run db:migrate to create migration
□ Review generated SQL file
□ Test locally (run dev servers)
□ Check for data integrity issues
□ Commit migration files to git
```

### Before Committing
```bash
□ Run npm run validate
□ Ensure all tests pass
□ Check no schema drift exists
□ Verify migration files are in git
□ Write clear commit message
```

### Before Deploying
```bash
□ Run npm run backup (create backup first!)
□ Run npm run db:check-drift
□ Run npm run db:check-integrity
□ Run npm run db:check-files
□ Have rollback plan ready
```

### After Deploying
```bash
□ Run npm run db:migrate:status (verify applied)
□ Check application works
□ Create new backup
□ Monitor logs for errors
```

---

## 🔧 Common Tasks

### Add a New Column
```prisma
// 1. Edit schema.prisma
model users {
  id       Int     @id @default(autoincrement())
  avatar   String? // ← Add this
}

// 2. Create migration
// npm run db:migrate
// Enter name: add_avatar_to_users

// 3. Commit and deploy
```

### Make a Column Required (NOT NULL)
```prisma
// ⚠️ WARNING: Only do this if NO existing rows have NULL!

// 1. First, check for NULLs
// SELECT COUNT(*) FROM users WHERE avatar IS NULL;

// 2. If there are NULLs, fill them first:
// UPDATE users SET avatar = 'default.jpg' WHERE avatar IS NULL;

// 3. Then edit schema:
model users {
  avatar String  // Removed the '?' (was String?)
}

// 4. Create migration
// npm run db:migrate
```

### Rename a Column (Expand & Contract Pattern)
```prisma
// Step 1: Add new column (EXPAND)
model users {
  old_name String  // Keep this
  new_name String? // Add this
}
// npm run db:migrate

// Step 2: Copy data
// UPDATE users SET new_name = old_name;

// Step 3: Update application code to use new_name

// Step 4: Deploy and verify

// Step 5: Remove old column (CONTRACT)
model users {
  new_name String  // Only this now
}
// npm run db:migrate
```

### Add a Constraint
```sql
-- Create migration file manually:
-- migrations/016_add_slug_constraint.sql

ALTER TABLE ads
  ADD CONSTRAINT ads_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*-[0-9]+$');

-- Then apply:
-- psql -U elw -d thulobazaar < migrations/016_add_slug_constraint.sql

-- Mark as applied:
-- npx prisma migrate resolve --applied 016_add_slug_constraint
```

---

## 🐛 Troubleshooting

### Problem: Schema Drift Detected

**Symptoms:**
```bash
$ npm run db:check-drift
❌ Schema drift detected!
Database schema is out of sync with Prisma schema
```

**Solution:**
```bash
# Option 1: Auto-fix (for small drift)
npm run db:check-drift -- --fix

# Option 2: Manual fix (for complex drift)
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > fix-drift.sql

# Review the SQL
cat fix-drift.sql

# Apply it
psql -U elw -d thulobazaar < fix-drift.sql

# Mark as resolved
npx prisma migrate resolve --applied <migration_name>
```

### Problem: Migration Failed

**Symptoms:**
```bash
$ npm run db:migrate:deploy
Error: Migration failed to apply
```

**Solution:**
```bash
# 1. Check what went wrong
npm run db:migrate:status

# 2. Check logs
tail -f /var/log/postgresql/postgresql.log

# 3. If migration partially applied:
npx prisma migrate resolve --rolled-back <migration_name>

# 4. Fix the issue (edit migration file or schema)

# 5. Try again
npm run db:migrate:deploy
```

### Problem: NULL Slugs in Database

**Symptoms:**
```bash
404 errors on ad pages
Database has rows with slug = NULL
```

**Solution:**
```bash
# 1. Find affected rows
psql -U elw -d thulobazaar -c "SELECT id, title FROM ads WHERE slug IS NULL;"

# 2. Generate slugs for them
psql -U elw -d thulobazaar -c "
  UPDATE ads
  SET slug = CONCAT(
    regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'),
    '-',
    id
  )
  WHERE slug IS NULL;
"

# 3. Add constraint to prevent future NULLs
psql -U elw -d thulobazaar -c "
  ALTER TABLE ads ALTER COLUMN slug SET NOT NULL;
  ALTER TABLE ads ADD CONSTRAINT ads_slug_not_empty CHECK (slug != '');
"
```

### Problem: Missing Images

**Symptoms:**
```bash
Ads show broken image icons
DB references files that don't exist
```

**Solution:**
```bash
# 1. Check sync status
cd packages/database
npm run db:check-files > missing-files.log

# 2. Restore from backup
rsync -av /path/to/backup/uploads/ ../../apps/web/public/uploads/

# 3. Or remove orphaned DB records
psql -U elw -d thulobazaar -c "
  DELETE FROM ad_images
  WHERE NOT EXISTS (
    SELECT 1 FROM ads WHERE ads.id = ad_images.ad_id
  );
"
```

### Problem: _prisma_migrations Table Missing

**Symptoms:**
```bash
$ npm run db:check-drift
❌ _prisma_migrations table does NOT exist!
```

**Solution:**
```bash
# Initialize migration tracking (one-time)
cd packages/database
npm run db:init-migrations

# This will:
# 1. Create _prisma_migrations table
# 2. Baseline existing migrations
# 3. Mark all as applied
```

---

## 📊 Data Integrity Constraints

### Essential Constraints to Add

Based on past incidents, these constraints prevent crashes:

```sql
-- 1. Prevent NULL slugs (caused 404 errors)
ALTER TABLE ads
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT ads_slug_not_empty CHECK (slug != ''),
  ADD CONSTRAINT ads_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*-[0-9]+$');

-- 2. Prevent empty titles
ALTER TABLE ads
  ALTER COLUMN title SET NOT NULL,
  ADD CONSTRAINT ads_title_not_empty CHECK (trim(title) != '');

-- 3. Prevent negative prices
ALTER TABLE ads
  ADD CONSTRAINT ads_price_non_negative CHECK (price >= 0);

-- 4. Prevent NULL category names (caused homepage crash)
ALTER TABLE categories
  ALTER COLUMN name SET NOT NULL,
  ADD CONSTRAINT categories_name_not_empty CHECK (trim(name) != '');

-- 5. Ensure valid email format
ALTER TABLE users
  ADD CONSTRAINT users_email_format
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- 6. Ensure image paths exist (prevents broken images)
ALTER TABLE ad_images
  ALTER COLUMN file_path SET NOT NULL,
  ADD CONSTRAINT ad_images_path_not_empty CHECK (file_path != '');

-- 7. Only one primary image per ad
CREATE UNIQUE INDEX ad_images_one_primary_per_ad
  ON ad_images (ad_id) WHERE is_primary = true;
```

### How to Apply Constraints Safely

```bash
# 1. Check for violations FIRST
psql -U elw -d thulobazaar -c "
  SELECT id, slug FROM ads WHERE slug IS NULL OR slug = '';
"

# 2. Fix violations
# (Update rows to have valid data)

# 3. Apply constraint
psql -U elw -d thulobazaar -f migrations/016_add_data_integrity_constraints.sql

# 4. Verify
psql -U elw -d thulobazaar -c "\d+ ads"
```

---

## 🔄 Backup & Restore

### Creating Atomic Backups

**Why Atomic?** Database and files backed up at the same time = no mismatch

```bash
# Create backup (DB + uploads + migrations + config)
npm run backup

# What it backs up:
# ✅ PostgreSQL database dump
# ✅ apps/web/public/uploads/ directory
# ✅ _prisma_migrations table
# ✅ schema.prisma
# ✅ package.json files
# ✅ Manifest with metadata

# Output:
# /Users/elw/backups/thulobazaar/20241211_143022/
#   ├── database.dump          (PostgreSQL custom format)
#   ├── migrations.csv         (_prisma_migrations data)
#   ├── uploads/               (all uploaded files)
#   ├── schema.prisma          (Prisma schema)
#   ├── manifest.json          (metadata)
#   └── env.template           (env without secrets)
```

### Restoring from Backup

```bash
# 1. List available backups
ls -lt /Users/elw/backups/thulobazaar/

# 2. Validate backup integrity
./scripts/restore-validate.sh /path/to/backup/20241211_143022

# 3. Stop application (important!)
npm run dev:stop

# 4. Create safety backup
npm run backup

# 5. Restore
./scripts/restore.sh /path/to/backup/20241211_143022

# 6. Verify
npm run db:check-drift
npm run db:check-integrity

# 7. Restart application
npm run dev:web-safe  # Terminal 1
npm run dev:api-safe  # Terminal 2
```

### Backup Best Practices

```bash
# ✅ DO: Backup before deployments
npm run backup
npm run deploy

# ✅ DO: Schedule daily backups
# Add to crontab:
# 0 2 * * * cd /path/to/monorepo && npm run backup

# ✅ DO: Test restores monthly
# Practice restoring to a test database

# ✅ DO: Keep multiple backup generations
# Script automatically keeps last 7 backups

# ❌ DON'T: Backup DB and files separately
# They must be from the same point in time!

# ❌ DON'T: Skip verification
# Always check backup manifest after creating
```

---

## 🎓 Team Guidelines

### For Developers

1. **Schema Changes**
   - ✅ ALWAYS edit `schema.prisma`, NEVER the database directly
   - ✅ Run `npm run db:migrate` after schema changes
   - ✅ Commit migration files to git
   - ✅ Test locally before pushing

2. **Before Committing**
   - ✅ Run `npm run validate`
   - ✅ Check `npm run db:check-drift`
   - ✅ Ensure tests pass
   - ✅ Write descriptive commit messages

3. **Code Reviews**
   - ✅ Review migration SQL files carefully
   - ✅ Check for data loss risks
   - ✅ Verify constraints won't break existing data
   - ✅ Ensure rollback plan exists

### For DevOps

1. **Before Deployments**
   - ✅ Run `npm run backup` (create backup first!)
   - ✅ Run `npm run db:check-drift`
   - ✅ Run `npm run validate`
   - ✅ Have rollback plan ready

2. **During Deployments**
   - ✅ Use `npm run db:migrate:deploy` (NOT `db:migrate`)
   - ✅ Monitor logs for errors
   - ✅ Verify migration applied: `npm run db:migrate:status`
   - ✅ Check application works after deploy

3. **After Deployments**
   - ✅ Create new backup
   - ✅ Monitor error rates
   - ✅ Verify data integrity
   - ✅ Document any issues

### For QA

1. **Testing Database Changes**
   - ✅ Test with fresh migration (not db:push)
   - ✅ Test with realistic data volumes
   - ✅ Test edge cases (NULL, empty strings, etc.)
   - ✅ Verify constraints work as expected

2. **Regression Testing**
   - ✅ Test existing features still work
   - ✅ Check for broken queries
   - ✅ Verify no data loss
   - ✅ Test rollback procedure

---

## 📈 Monitoring & Alerts

### Health Checks to Monitor

```bash
# 1. Schema Drift Check (daily)
0 9 * * * cd /path/to/monorepo/packages/database && npm run db:check-drift

# 2. Data Integrity Check (daily)
0 10 * * * cd /path/to/monorepo/packages/database && npm run db:check-integrity

# 3. File Sync Check (weekly)
0 11 * * 0 cd /path/to/monorepo/packages/database && npm run db:check-files

# 4. Backup (daily at 2 AM)
0 2 * * * cd /path/to/monorepo && npm run backup
```

### Key Metrics to Track

| Metric | Target | Alert If |
|--------|--------|----------|
| Schema drift incidents | 0/month | > 0 |
| Migration failures | 0/month | > 0 |
| 404 errors (missing slugs) | < 0.1% | > 1% |
| Broken images | < 0.5% | > 5% |
| Backup success rate | 100% | < 100% |
| Backup size growth | +10%/month | > 50%/month |
| Database connection errors | < 0.01% | > 1% |

### Setting Up Slack Alerts

```bash
# Add to scripts/check-drift.sh:
if [ $DRIFT_DETECTED -eq 1 ]; then
  curl -X POST $SLACK_WEBHOOK_URL \
    -H 'Content-Type: application/json' \
    -d '{
      "text": "⚠️ Schema Drift Detected!",
      "attachments": [{
        "color": "danger",
        "fields": [
          {"title": "Environment", "value": "Production"},
          {"title": "Action", "value": "Run npm run db:check-drift --fix"}
        ]
      }]
    }'
fi
```

---

## 🚀 Quick Reference Commands

### Daily Commands
```bash
# Start servers safely (checks for duplicates)
npm run dev:web-safe
npm run dev:api-safe

# Check health
cd packages/database && npm run db:migrate:status

# Regenerate Prisma client (after schema changes)
npm run db:generate
```

### Schema Change Commands
```bash
# Create migration
npm run db:migrate

# Apply migrations (production)
npm run db:migrate:deploy

# Check migration status
npm run db:migrate:status
```

### Validation Commands
```bash
# Check for schema drift
npm run db:check-drift

# Check data integrity
npm run db:check-integrity

# Check file sync
npm run db:check-files

# Full pre-deploy validation
npm run validate
```

### Backup Commands
```bash
# Create atomic backup
npm run backup

# List backups
ls -lt /Users/elw/backups/thulobazaar/

# Restore from backup
./scripts/restore.sh /path/to/backup/
```

### Emergency Commands
```bash
# Stop all dev servers
npm run dev:stop

# Fix schema drift automatically
npm run db:check-drift -- --fix

# Connect to database
psql -U elw -d thulobazaar

# View migration history
psql -U elw -d thulobazaar -c "SELECT * FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5;"
```

---

## 📚 Additional Resources

### Official Documentation
- [Prisma Migrate Docs](https://www.prisma.io/docs/orm/prisma-migrate)
- [PostgreSQL Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Database Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)

### Internal Documentation
- `SCHEMA_DRIFT_PREVENTION.md` - Complete schema drift guide
- `MIGRATION_QUICK_REFERENCE.md` - Quick migration commands
- `INCIDENT_PREVENTION_SYSTEM.md` - Full incident prevention system
- `packages/database/README.md` - Database package docs

### Team Training Materials
- Schedule: Monthly schema management training
- Location: ThulobaBazaar Notion workspace
- Contact: DevOps team for questions

---

## ✅ Success Checklist

Print this and check off when you've completed setup:

### Initial Setup
- [ ] Run `npm run db:init-migrations` (one-time)
- [ ] Apply integrity constraints (migration 016)
- [ ] Create first atomic backup
- [ ] Set up daily backup cron job
- [ ] Configure Slack webhooks for alerts
- [ ] Train team on new workflows

### Weekly Tasks
- [ ] Review migration history
- [ ] Check backup logs
- [ ] Verify no schema drift
- [ ] Test restore procedure
- [ ] Review error metrics

### Monthly Tasks
- [ ] Full restore test
- [ ] Review and clean old backups
- [ ] Update team on any issues
- [ ] Review and update guidelines
- [ ] Check compliance with best practices

---

## 🎯 Remember

**The Three Incidents We're Preventing:**
1. ✅ Homepage crash (schema drift) → Migration tracking prevents this
2. ✅ Ad 404s (missing slugs) → Database constraints prevent this
3. ✅ Broken images (file/DB mismatch) → Atomic backups prevent this

**The Golden Rule:**
> If it changes the database schema, it MUST go through migrations. No exceptions.

**When in Doubt:**
1. Run `npm run db:check-drift`
2. Create a backup
3. Ask the team
4. Document what you did

---

**Last Updated:** December 11, 2024
**Maintained By:** DevOps Team
**Questions?** Check internal docs or ask in #database-help Slack channel

🎉 **Follow these guidelines and never experience database incidents again!**
