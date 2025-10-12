-- Migration: Prevent duplicate areas
-- Description: Add unique constraint to prevent duplicate areas with same name, ward, and municipality
-- Date: 2025-10-12

-- Add unique constraint to areas table
-- This ensures that no two areas can have the same name in the same ward of the same municipality
ALTER TABLE areas
ADD CONSTRAINT unique_area_per_ward
UNIQUE (name, ward_number, municipality_id);

-- Add comment to document the constraint
COMMENT ON CONSTRAINT unique_area_per_ward ON areas IS
'Ensures each area name is unique within a ward of a municipality. Prevents duplicate entries like "Thamel, Ward 1, Kathmandu" appearing twice.';

-- Verify the constraint was added
SELECT
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'areas'
  AND constraint_name = 'unique_area_per_ward';
