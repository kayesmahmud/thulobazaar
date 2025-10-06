-- Migration: Generate missing shop_slug and seller_slug for existing verified users
-- Date: 2025-10-06

-- Generate seller_slug for individual verified users who don't have one
UPDATE users
SET seller_slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(full_name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE individual_verified = true
  AND (seller_slug IS NULL OR seller_slug = '');

-- Generate shop_slug for business verified users who don't have one
UPDATE users
SET shop_slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(business_name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE business_verification_status = 'approved'
  AND (shop_slug IS NULL OR shop_slug = '');

-- Handle duplicate slugs by adding user id
UPDATE users u1
SET seller_slug = seller_slug || '-' || id
WHERE individual_verified = true
  AND seller_slug IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users u2
    WHERE u2.seller_slug = u1.seller_slug
      AND u2.id < u1.id
  );

UPDATE users u1
SET shop_slug = shop_slug || '-' || id
WHERE business_verification_status = 'approved'
  AND shop_slug IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users u2
    WHERE u2.shop_slug = u1.shop_slug
      AND u2.id < u1.id
  );
