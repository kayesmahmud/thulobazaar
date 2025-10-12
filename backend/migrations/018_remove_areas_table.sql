-- Migration: Remove areas table and related structures
-- Purpose: Remove area/place search functionality from the application
-- Date: 2025-10-11

-- Step 1: Drop the foreign key constraint from ads table
ALTER TABLE ads
DROP CONSTRAINT IF EXISTS ads_area_id_fkey;

-- Step 2: Drop the index on area_id
DROP INDEX IF EXISTS idx_ads_area_id;

-- Step 3: Drop the area_id column from ads table
ALTER TABLE ads
DROP COLUMN IF EXISTS area_id;

-- Step 4: Drop the trigger function
DROP FUNCTION IF EXISTS update_areas_updated_at() CASCADE;

-- Step 5: Drop the areas table
DROP TABLE IF EXISTS areas CASCADE;

-- Show confirmation
SELECT 'Areas table and related structures removed successfully' AS status;
