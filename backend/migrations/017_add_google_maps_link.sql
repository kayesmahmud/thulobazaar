-- Migration: Add google_maps_link column to users table
-- Purpose: Store Google Maps share link for shop locations (100% FREE approach)
-- Date: 2025-10-11

-- Add google_maps_link column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.google_maps_link IS 'Google Maps share link for shop location (e.g., https://maps.google.com/?q=...)';

-- Show confirmation
SELECT 'google_maps_link column added successfully' AS status;
