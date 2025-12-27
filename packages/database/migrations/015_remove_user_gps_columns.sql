-- Migration: Remove unused GPS coordinate columns from users table
-- Created: 2025-12-10
-- These columns were for "nearby shops" feature which is not being used
-- Note: google_maps_link is KEPT - it's actively used for shop location links

-- Drop the unused columns if they exist
ALTER TABLE users DROP COLUMN IF EXISTS latitude;
ALTER TABLE users DROP COLUMN IF EXISTS longitude;
ALTER TABLE users DROP COLUMN IF EXISTS formatted_address;

-- Drop the index if it exists
DROP INDEX IF EXISTS idx_users_coordinates;
