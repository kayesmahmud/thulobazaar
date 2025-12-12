#!/bin/bash

# Schema Drift Detection Script for ThulobaBazaar
# Prevents incidents like the homepage crash caused by missing DB columns
# Usage: ./scripts/check-schema-drift.sh [--fix]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/Users/elw/Documents/Web/thulobazaar/monorepo"
cd "$PROJECT_DIR/packages/database"

echo -e "${BLUE}🔍 ThulobaBazaar Schema Drift Detection${NC}"
echo "=========================================="
echo ""

# Check if _prisma_migrations table exists
echo -e "${BLUE}Step 1: Checking _prisma_migrations table...${NC}"
MIGRATIONS_TABLE_EXISTS=$(PGPASSWORD=postgres psql -U elw -d thulobazaar -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '_prisma_migrations');")

if [ "$MIGRATIONS_TABLE_EXISTS" = "f" ]; then
  echo -e "${RED}❌ CRITICAL: _prisma_migrations table does NOT exist!${NC}"
  echo -e "${YELLOW}   This means Prisma migrations have never been initialized.${NC}"
  echo -e "${YELLOW}   Your database is not tracking schema changes.${NC}"
  echo ""

  if [ "$1" = "--fix" ]; then
    echo -e "${BLUE}💡 Fixing: Running prisma migrate deploy to create migrations table...${NC}"
    npx prisma migrate deploy
    echo -e "${GREEN}✅ Migrations table created${NC}"
  else
    echo -e "${YELLOW}   Run: npm run db:init-migrations (or this script with --fix)${NC}"
  fi
else
  echo -e "${GREEN}✅ _prisma_migrations table exists${NC}"

  # Count applied migrations
  MIGRATION_COUNT=$(PGPASSWORD=postgres psql -U elw -d thulobazaar -tAc "SELECT COUNT(*) FROM _prisma_migrations;")
  echo -e "${GREEN}   Applied migrations: $MIGRATION_COUNT${NC}"
fi

echo ""

# Check for schema drift using Prisma
echo -e "${BLUE}Step 2: Checking for schema drift...${NC}"
if npx prisma migrate status > /tmp/prisma-status.txt 2>&1; then
  echo -e "${GREEN}✅ No schema drift detected${NC}"
  cat /tmp/prisma-status.txt
else
  echo -e "${RED}❌ SCHEMA DRIFT DETECTED!${NC}"
  cat /tmp/prisma-status.txt
  echo ""

  if [ "$1" = "--fix" ]; then
    echo -e "${BLUE}💡 Generating migration to fix drift...${NC}"
    npx prisma migrate diff \
      --from-schema-datamodel prisma/schema.prisma \
      --to-schema-datasource prisma/schema.prisma \
      --script > migrations/$(date +%s)_fix_drift.sql
    echo -e "${GREEN}✅ Migration file generated in migrations/$(date +%s)_fix_drift.sql${NC}"
    echo -e "${YELLOW}   Review the file and apply with: npx prisma migrate resolve --applied$(NC}"
  else
    echo -e "${YELLOW}   Run: npm run db:check-drift --fix (to generate migration)${NC}"
  fi
fi

echo ""

# Compare critical tables and columns
echo -e "${BLUE}Step 3: Validating critical schema elements...${NC}"

# Check categories.form_template (caused the homepage crash)
FORM_TEMPLATE=$(PGPASSWORD=postgres psql -U elw -d thulobazaar -tAc "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'form_template');")
if [ "$FORM_TEMPLATE" = "t" ]; then
  echo -e "${GREEN}✅ categories.form_template exists${NC}"
else
  echo -e "${RED}❌ MISSING: categories.form_template (CRITICAL - causes homepage crash)${NC}"
fi

# Check ads.custom_fields
CUSTOM_FIELDS=$(PGPASSWORD=postgres psql -U elw -d thulobazaar -tAc "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'custom_fields');")
if [ "$CUSTOM_FIELDS" = "t" ]; then
  echo -e "${GREEN}✅ ads.custom_fields exists${NC}"
else
  echo -e "${RED}❌ MISSING: ads.custom_fields${NC}"
fi

# Check user_favorites table
USER_FAVORITES=$(PGPASSWORD=postgres psql -U elw -d thulobazaar -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_favorites');")
if [ "$USER_FAVORITES" = "t" ]; then
  echo -e "${GREEN}✅ user_favorites table exists${NC}"
else
  echo -e "${RED}❌ MISSING: user_favorites table${NC}"
fi

echo ""
echo "=========================================="

# Final summary
if [ "$MIGRATIONS_TABLE_EXISTS" = "f" ]; then
  echo -e "${RED}⚠️  ACTION REQUIRED: Initialize Prisma migrations${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Schema drift check complete${NC}"
  exit 0
fi
