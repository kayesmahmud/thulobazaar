# Prisma Migrations - Quick Reference

## 🚀 Common Commands

```bash
# From packages/database directory
cd /Users/elw/Documents/Web/thulobazaar/monorepo/packages/database

# Check migration status
npm run db:migrate:status

# Create new migration (after editing schema.prisma)
npm run db:migrate

# Deploy migrations (production)
npm run db:migrate:deploy

# Check for schema drift
npm run db:check-drift

# Regenerate Prisma client
npm run db:generate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## 📝 Making Schema Changes

### 1. Edit Schema
```bash
# Edit the file
nano prisma/schema.prisma
```

### 2. Create Migration
```bash
npm run db:migrate
# Prisma will prompt: "Name of migration:"
# Enter descriptive name: add_user_avatar_column
```

### 3. Review & Commit
```bash
# Check generated SQL
cat migrations/20241211_add_user_avatar_column/migration.sql

# Commit to git
git add migrations/ prisma/schema.prisma
git commit -m "Add avatar column to users"
```

## 🔍 Checking for Drift

```bash
# Quick check
npm run db:check-drift

# See what Prisma thinks is wrong
npm run db:migrate:status

# Compare schema vs DB
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma
```

## 🆘 Emergency Fixes

### Schema Drift Detected
```bash
# Auto-generate fix
npm run db:check-drift -- --fix

# Review the migration
ls -lt migrations/ | head -5

# Apply it
npm run db:migrate:deploy
```

### Migration Failed
```bash
# Check what went wrong
npm run db:migrate:status

# Rollback manually (if needed)
psql -U elw -d thulobazaar < migrations/rollback.sql

# Mark as rolled back
npx prisma migrate resolve --rolled-back <migration_name>

# Fix the issue and try again
npm run db:migrate
```

## ⚠️ DO NOT

- ❌ Edit applied migration files
- ❌ Delete migration files
- ❌ Run `db push` in production
- ❌ Make direct SQL schema changes
- ❌ Use `migrate dev` in production (use `migrate deploy`)

## ✅ DO

- ✅ Always use `npm run db:migrate` for schema changes
- ✅ Commit migration files to git
- ✅ Run `db:check-drift` before deployments
- ✅ Use `migrate deploy` in production
- ✅ Review generated SQL before applying

## 🎯 Workflow Cheatsheet

| Task | Command |
|------|---------|
| Add column to table | Edit schema.prisma → `npm run db:migrate` |
| Remove column | Edit schema.prisma → `npm run db:migrate` |
| Add new table | Add model to schema.prisma → `npm run db:migrate` |
| Check if DB is in sync | `npm run db:migrate:status` |
| Fix drift automatically | `npm run db:check-drift -- --fix` |
| Deploy to production | `npm run db:migrate:deploy` |

## 🔒 Production Deployment

```bash
# 1. Check drift locally
npm run db:check-drift

# 2. Run tests
npm test

# 3. Deploy (on production server)
npm run db:migrate:deploy

# 4. Verify
npm run db:migrate:status
```

## 📊 Database Health

```bash
# Check connection
psql -U elw -d thulobazaar -c "SELECT 1;"

# View migrations
psql -U elw -d thulobazaar -c "SELECT * FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5;"

# Check table exists
psql -U elw -d thulobazaar -c "\dt"

# Check column exists
psql -U elw -d thulobazaar -c "\d+ users"
```
