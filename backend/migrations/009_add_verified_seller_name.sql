-- Migration: Add verified_seller_name column to lock seller name when individual verified
-- This ensures the displayed name on seller pages doesn't change even if user updates their profile name

-- Add verified_seller_name column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS verified_seller_name VARCHAR(255);

-- Populate verified_seller_name for already verified individual sellers
UPDATE users
SET verified_seller_name = full_name
WHERE individual_verified = true AND verified_seller_name IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_verified_seller_name
ON users(verified_seller_name)
WHERE individual_verified = true;

-- Add comment
COMMENT ON COLUMN users.verified_seller_name IS 'Locked seller name displayed on seller page after individual verification. Does not change even if user updates full_name.';
