-- Add Data Integrity Constraints
-- Based on DATABASE_GUIDELINES.md recommendations
-- These constraints prevent common issues like 404 errors and bad data

-- 1. Make ads.slug NOT NULL (no NULL slugs exist, safe to apply)
ALTER TABLE ads ALTER COLUMN slug SET NOT NULL;

-- 2. Prevent empty slug strings
ALTER TABLE ads ADD CONSTRAINT ads_slug_not_empty CHECK (slug != '');

-- 3. Prevent negative prices (data integrity)
ALTER TABLE ads ADD CONSTRAINT ads_price_non_negative CHECK (price IS NULL OR price >= 0);

-- 4. Prevent empty title strings
ALTER TABLE ads ADD CONSTRAINT ads_title_not_empty CHECK (trim(title) != '');

-- 5. Email format validation (allow NULL for phone-only users)
-- This constraint allows NULL email (phone-only registration) OR valid email format
ALTER TABLE users ADD CONSTRAINT users_email_format
  CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- 6. Unique primary image per ad (only one image can be primary)
CREATE UNIQUE INDEX IF NOT EXISTS ad_images_one_primary_per_ad
  ON ad_images (ad_id) WHERE is_primary = true;
