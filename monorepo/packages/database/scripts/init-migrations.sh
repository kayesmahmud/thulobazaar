#!/bin/bash

# Initialize Prisma Migrations Tracking
# This creates the _prisma_migrations table and baselines your database

set -e

PROJECT_DIR="/Users/elw/Documents/Web/thulobazaar/monorepo"
cd "$PROJECT_DIR/packages/database"

echo "🔧 Initializing Prisma Migrations for ThulobaBazaar"
echo "===================================================="
echo ""

# Check if _prisma_migrations already exists
MIGRATIONS_TABLE_EXISTS=$(PGPASSWORD=postgres psql -U elw -d thulobazaar -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '_prisma_migrations');")

if [ "$MIGRATIONS_TABLE_EXISTS" = "t" ]; then
  echo "✅ _prisma_migrations table already exists"
  echo "   Nothing to do."
  exit 0
fi

echo "⚠️  WARNING: This will create the _prisma_migrations table"
echo "   and mark all existing migrations as applied (baseline)."
echo ""
echo "📋 Existing migration files:"
ls -1 migrations/

echo ""
echo "Continue? (y/n)"
read -r response

if [ "$response" != "y" ]; then
  echo "❌ Aborted"
  exit 1
fi

# Create a baseline migration that matches current DB state
echo ""
echo "🔄 Step 1: Pulling current database schema..."
npx prisma db pull --force

echo ""
echo "🔄 Step 2: Creating baseline migration..."
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migrations/0_baseline.sql

echo ""
echo "🔄 Step 3: Creating _prisma_migrations table..."
PGPASSWORD=postgres psql -U elw -d thulobazaar <<EOF
CREATE TABLE _prisma_migrations (
    id VARCHAR(36) PRIMARY KEY,
    checksum VARCHAR(64) NOT NULL,
    finished_at TIMESTAMPTZ,
    migration_name VARCHAR(255) NOT NULL,
    logs TEXT,
    rolled_back_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    applied_steps_count INTEGER NOT NULL DEFAULT 0
);
EOF

echo ""
echo "🔄 Step 4: Marking existing migrations as applied..."

# Mark baseline
BASELINE_CHECKSUM=$(sha256sum migrations/0_baseline.sql | cut -d' ' -f1)
PGPASSWORD=postgres psql -U elw -d thulobazaar <<EOF
INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, applied_steps_count)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '$BASELINE_CHECKSUM',
    now(),
    '0_baseline',
    1
);
EOF

# Mark other migrations
for migration_file in migrations/*.sql; do
  if [ "$migration_file" = "migrations/0_baseline.sql" ]; then
    continue
  fi

  migration_name=$(basename "$migration_file" .sql)
  checksum=$(sha256sum "$migration_file" | cut -d' ' -f1)

  echo "   Marking $migration_name as applied..."

  PGPASSWORD=postgres psql -U elw -d thulobazaar <<EOF
INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, applied_steps_count)
VALUES (
    gen_random_uuid(),
    '$checksum',
    now(),
    '$migration_name',
    1
)
ON CONFLICT DO NOTHING;
EOF
done

echo ""
echo "✅ SUCCESS: Prisma migrations initialized!"
echo ""
echo "📊 Current migration status:"
npx prisma migrate status

echo ""
echo "🎯 Next steps:"
echo "   1. Always use 'npm run db:migrate' for schema changes"
echo "   2. Never edit the database directly"
echo "   3. Run 'npm run db:check-drift' before deployments"
