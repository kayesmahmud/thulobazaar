-- Migration: Add 'suspended' and 'deleted' to ads status constraint
-- Date: 2024-12-12
-- Description: Updates the ads_status_valid check constraint to include 'suspended' and 'deleted' statuses

-- Drop existing constraint
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_status_valid;

-- Recreate with additional statuses
ALTER TABLE ads ADD CONSTRAINT ads_status_valid
CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'expired', 'sold', 'suspended', 'deleted'));

-- Verify the constraint was created
-- Expected result: Should show the new constraint with all 8 statuses
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'ads_status_valid';
