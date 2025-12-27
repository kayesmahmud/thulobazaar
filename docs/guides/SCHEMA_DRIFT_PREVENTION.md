# Schema Drift Prevention Guide

## 🚨 The Problem

**What happened:** ThulobaBazaar homepage crashed because the database was missing critical columns:
- `categories.form_template`
- `ads.custom_fields`
- `user_favorites` table

**Root cause:** The `_prisma_migrations` table doesn't exist, so Prisma never tracked schema changes. When the database was restored from backup, it lost columns that were added later.

## 🎯 Solution Overview

We've implemented a **comprehensive schema drift prevention system** based on 2025 best practices:

### 1. **Migration Tracking** (`_prisma_migrations` table)
### 2. **Automated Drift Detection** (runs before deployment)
### 3. **Strict Migration Workflow** (never edit DB directly)
### 4. **CI/CD Integration** (GitHub Actions)

---

## 📦 New Tools & Scripts

### Drift Detection Script
```bash
cd packages/database
npm run db:check-drift          # Check for drift
npm run db:check-drift -- --fix # Auto-generate migration to fix drift
```

**What it checks:**
- ✅ `_prisma_migrations` table exists
- ✅ No unapplied migrations
- ✅ Critical columns exist (form_template, custom_fields)
- ✅ Database schema matches Prisma schema

### Migration Initialization Script
```bash
cd packages/database
npm run db:init-migrations  # One-time setup to create _prisma_migrations
```

**What it does:**
1. Creates `_prisma_migrations` table
2. Baselines existing migrations
3. Marks all historical migrations as applied

---

## 🔄 The New Workflow

### ❌ OLD WAY (Causes Drift)
```bash
# Direct SQL changes
psql -U elw -d thulobazaar -c "ALTER TABLE categories ADD COLUMN form_template JSONB;"

# Or using db push (doesn't track migrations)
npx prisma db push
```

### ✅ NEW WAY (Prevents Drift)
```bash
# 1. Edit schema.prisma
# 2. Create migration
cd packages/database
npm run db:migrate

# 3. Prisma generates SQL and tracks it
# 4. Migration file created in migrations/
```

---

## 📋 Best Practices (2025)

Based on research from:
- [Prisma Migration Drift Guide](https://medium.com/@sivasaravanan101004/prisma-migration-drift-the-silent-schema-killer-and-how-to-stop-it-076a5d756b1a)
- [Prisma Troubleshooting Docs](https://www.prisma.io/docs/orm/prisma-migrate/workflows/troubleshooting)
- [Liquibase Database Drift Guide](https://www.liquibase.com/blog/database-drift)
- [Atlas Schema Drift Detection](https://atlasgo.io/monitoring/drift-detection)

### 1. **Always Use Migrations**
- ✅ Use `npm run db:migrate` for ALL schema changes
- ❌ NEVER run raw SQL to change schema
- ❌ NEVER use `db push` in production

### 2. **Never Modify Applied Migrations**
- ✅ Create new migration for changes
- ❌ Don't edit files in `migrations/` folder
- ❌ Don't delete migration files

### 3. **Check Drift Regularly**
```bash
# Before deployment
npm run db:check-drift

# Check migration status
npm run db:migrate:status
```

### 4. **Production Deployments**
```bash
# Use deploy, NOT migrate dev
npm run db:migrate:deploy
```

### 5. **Database Backups**
When restoring from backup:
1. Run `npm run db:check-drift` immediately
2. Apply missing migrations with `npm run db:migrate:deploy`
3. NEVER restore `_prisma_migrations` table from old backup

---

## 🛠️ Available Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run db:migrate` | Create & apply migration | After editing schema.prisma |
| `npm run db:migrate:deploy` | Apply migrations (prod) | CI/CD deployment |
| `npm run db:migrate:status` | Check migration state | Before deployment |
| `npm run db:check-drift` | Detect schema drift | Pre-deployment check |
| `npm run db:init-migrations` | Initialize tracking | One-time setup |
| `npm run db:generate` | Regenerate Prisma client | After schema changes |

---

## 🚦 CI/CD Integration (GitHub Actions)

Create `.github/workflows/check-schema-drift.yml`:

```yaml
name: Schema Drift Check

on:
  pull_request:
    paths:
      - 'packages/database/prisma/schema.prisma'
      - 'packages/database/migrations/**'
  push:
    branches: [main]

jobs:
  check-drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Check schema drift
        run: |
          cd packages/database
          npm run db:check-drift
```

---

## 🔍 How Schema Drift Happens

### Scenario 1: Direct SQL Changes
```sql
-- Someone runs this directly
ALTER TABLE categories ADD COLUMN form_template JSONB;
```
❌ **Problem:** Prisma doesn't know about this change. On next deployment, column is missing.

### Scenario 2: Using `db push`
```bash
npx prisma db push
```
❌ **Problem:** Pushes schema changes BUT doesn't create migration files. Not tracked in version control.

### Scenario 3: Old Database Restore
```bash
pg_restore -d thulobazaar backup_from_oct_2025.sql
```
❌ **Problem:** Backup doesn't include recent columns. Migrations weren't tracked, so no way to know what's missing.

---

## ✅ The Fix: Migration Workflow

### Step 1: Edit Schema
```prisma
// packages/database/prisma/schema.prisma
model categories {
  id            Int     @id @default(autoincrement())
  name          String
  form_template Json?   // ← Add new column
}
```

### Step 2: Create Migration
```bash
cd packages/database
npm run db:migrate
# Prisma prompts: "Name of migration:"
# Enter: add_form_template_to_categories
```

### Step 3: Review Generated SQL
```sql
-- migrations/20241211_add_form_template_to_categories/migration.sql
ALTER TABLE "categories" ADD COLUMN "form_template" JSONB;
```

### Step 4: Commit to Git
```bash
git add packages/database/migrations/
git add packages/database/prisma/schema.prisma
git commit -m "Add form_template column to categories"
```

### Step 5: Deploy
```bash
# On production server
npm run db:migrate:deploy
```

---

## 🔥 Emergency: Schema Drift Detected

If `npm run db:check-drift` shows drift:

### Option 1: Auto-Fix (Small Drift)
```bash
npm run db:check-drift -- --fix
# Review generated migration
npm run db:migrate:deploy
```

### Option 2: Manual Fix (Complex Drift)
```bash
# Generate diff
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma \
  --script > fix-drift.sql

# Review the SQL
cat fix-drift.sql

# Apply manually
psql -U elw -d thulobazaar < fix-drift.sql

# Mark as resolved
npx prisma migrate resolve --applied <migration_name>
```

---

## 📊 Monitoring

### Health Check Endpoint
Add to your API:

```typescript
import { checkDatabaseHealth } from '@thulobazaar/database';

app.get('/health/db', async (req, res) => {
  const health = await checkDatabaseHealth();

  if (!health.healthy) {
    return res.status(500).json(health);
  }

  res.json(health);
});
```

### Daily Drift Check (Cron)
```bash
# Add to crontab
0 9 * * * cd /path/to/monorepo/packages/database && npm run db:check-drift
```

---

## 🎓 Team Training

### For Developers
1. ✅ ALWAYS edit `schema.prisma`, NEVER edit DB directly
2. ✅ Run `npm run db:migrate` after schema changes
3. ✅ Commit migration files to git
4. ✅ Run `npm run db:check-drift` before PR

### For DevOps
1. ✅ Use `npm run db:migrate:deploy` for production
2. ✅ NEVER use `npm run db:migrate` in production
3. ✅ Check drift before deployments
4. ✅ Backup `_prisma_migrations` table separately

---

## 📚 Additional Resources

- [Syncing Prisma Migrations Guide](https://medium.com/@siddharthpradhan2004/syncing-prisma-migrations-aligning-your-schema-drift-and-manual-sql-changes-in-postgresql-89c5c8c61181)
- [Prisma Mental Model](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/mental-model)
- [Zero Downtime Migrations](https://xata.io/blog/zero-downtime-schema-migrations-postgresql)
- [Database CI/CD Tools 2025](https://www.dbvis.com/thetable/top-database-cicd-and-schema-change-tools-in-2025/)

---

## 🏁 Quick Start

1. **Initialize migrations** (one-time):
```bash
cd packages/database
npm run db:init-migrations
```

2. **Check current status**:
```bash
npm run db:check-drift
npm run db:migrate:status
```

3. **From now on, for ALL schema changes**:
```bash
# Edit schema.prisma
npm run db:migrate
git add migrations/ prisma/schema.prisma
git commit -m "Add new column"
```

**Never again will you have schema drift incidents!** 🎉
