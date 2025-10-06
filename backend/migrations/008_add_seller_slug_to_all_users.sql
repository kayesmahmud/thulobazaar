-- Migration: Add seller_slug to all existing users who don't have one
-- This ensures all users have a seller profile page

-- Generate seller_slug for users without one (based on their full_name)
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
WHERE seller_slug IS NULL OR seller_slug = '';

-- Handle duplicate slugs by appending user ID
UPDATE users u1
SET seller_slug = seller_slug || '-' || id
WHERE (seller_slug IS NOT NULL AND seller_slug != '')
AND EXISTS (
  SELECT 1 FROM users u2
  WHERE u2.seller_slug = u1.seller_slug
  AND u2.id < u1.id
);

-- Verify the update
SELECT COUNT(*) as total_users,
       COUNT(seller_slug) as users_with_seller_slug
FROM users;
