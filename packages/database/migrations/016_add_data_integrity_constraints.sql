-- Migration 016: Add Data Integrity Constraints
-- Purpose: Prevent incidents like missing slugs, NULL values causing crashes
-- Based on PostgreSQL best practices 2025

-- ============================================
-- 1. ADS TABLE CONSTRAINTS
-- ============================================

-- Ensure slugs are never NULL or empty
ALTER TABLE ads
  ALTER COLUMN slug SET NOT NULL;

-- Check slug is not empty string
ALTER TABLE ads
  ADD CONSTRAINT ads_slug_not_empty CHECK (slug != '');

-- Validate slug format: lowercase-with-dashes-123
ALTER TABLE ads
  ADD CONSTRAINT ads_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*-[0-9]+$');

-- Titles must exist and not be empty
ALTER TABLE ads
  ALTER COLUMN title SET NOT NULL,
  ADD CONSTRAINT ads_title_not_empty CHECK (trim(title) != '');

-- Price must be non-negative
ALTER TABLE ads
  ADD CONSTRAINT ads_price_non_negative CHECK (price >= 0);

-- Status must be valid enum value
ALTER TABLE ads
  ADD CONSTRAINT ads_status_valid CHECK (
    status IN ('draft', 'pending', 'approved', 'rejected', 'expired', 'sold')
  );

-- ============================================
-- 2. CATEGORIES TABLE CONSTRAINTS
-- ============================================

-- Category names must exist
ALTER TABLE categories
  ALTER COLUMN name SET NOT NULL,
  ADD CONSTRAINT categories_name_not_empty CHECK (trim(name) != '');

-- Slug must exist and follow format
ALTER TABLE categories
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT categories_slug_not_empty CHECK (slug != ''),
  ADD CONSTRAINT categories_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- ============================================
-- 3. AD_IMAGES TABLE CONSTRAINTS
-- ============================================

-- File paths must exist
ALTER TABLE ad_images
  ALTER COLUMN file_path SET NOT NULL,
  ADD CONSTRAINT ad_images_path_not_empty CHECK (file_path != '');

-- Filename must exist
ALTER TABLE ad_images
  ALTER COLUMN filename SET NOT NULL,
  ADD CONSTRAINT ad_images_filename_not_empty CHECK (filename != '');

-- File size must be positive (if specified)
ALTER TABLE ad_images
  ADD CONSTRAINT ad_images_size_positive CHECK (file_size IS NULL OR file_size > 0);

-- Only one primary image per ad
CREATE UNIQUE INDEX ad_images_one_primary_per_ad
  ON ad_images (ad_id)
  WHERE is_primary = true;

-- ============================================
-- 4. USERS TABLE CONSTRAINTS
-- ============================================

-- Email must be valid format
ALTER TABLE users
  ADD CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Phone number format (Nepali: 10 digits starting with 9)
ALTER TABLE users
  ADD CONSTRAINT users_phone_format CHECK (
    phone_number IS NULL OR
    phone_number ~ '^9[0-9]{9}$'
  );

-- Username: alphanumeric and underscores only, 3-30 chars
ALTER TABLE users
  ADD CONSTRAINT users_username_format CHECK (
    username ~ '^[a-zA-Z0-9_]{3,30}$'
  );

-- Role must be valid
ALTER TABLE users
  ADD CONSTRAINT users_role_valid CHECK (
    role IN ('user', 'editor', 'super_admin')
  );

-- ============================================
-- 5. LOCATIONS TABLE CONSTRAINTS
-- ============================================

-- Name must exist
ALTER TABLE locations
  ALTER COLUMN name SET NOT NULL,
  ADD CONSTRAINT locations_name_not_empty CHECK (trim(name) != '');

-- Type must be valid
ALTER TABLE locations
  ADD CONSTRAINT locations_type_valid CHECK (
    type IN ('province', 'district', 'municipality', 'area')
  );

-- ============================================
-- 6. USER_FAVORITES TABLE (if exists)
-- ============================================

-- Ensure no duplicate favorites
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'user_favorites'
  ) THEN
    EXECUTE '
      CREATE UNIQUE INDEX IF NOT EXISTS user_favorites_unique
        ON user_favorites (user_id, ad_id);
    ';
  END IF;
END $$;

-- ============================================
-- 7. COMMENTS
-- ============================================

COMMENT ON CONSTRAINT ads_slug_not_empty ON ads IS 'Prevents NULL slug incidents that cause 404 errors';
COMMENT ON CONSTRAINT ads_slug_format ON ads IS 'Enforces SEO-friendly slug format';
COMMENT ON CONSTRAINT ad_images_path_not_empty ON ad_images IS 'Prevents missing image incidents';
COMMENT ON INDEX ad_images_one_primary_per_ad IS 'Ensures only one primary image per ad';

-- ============================================
-- VERIFICATION QUERIES (Run after applying)
-- ============================================

-- Check for existing data violations BEFORE applying constraints
-- Uncomment to see violations:

-- SELECT id, slug FROM ads WHERE slug IS NULL OR slug = '' OR slug !~ '^[a-z0-9]+(-[a-z0-9]+)*-[0-9]+$';
-- SELECT id, title FROM ads WHERE title IS NULL OR trim(title) = '';
-- SELECT id, price FROM ads WHERE price < 0;
-- SELECT id, email FROM users WHERE email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$';
