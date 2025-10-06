-- Migration: Add verification expiry tracking
-- Individual and business verifications expire after a set period (configurable)
-- After expiry, users become normal users and can change their display names

-- Add expiry date columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS individual_verification_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS business_verification_expires_at TIMESTAMP;

-- Set expiry date for currently verified individual sellers (3 months from verification date)
UPDATE users
SET individual_verification_expires_at = individual_verified_at + INTERVAL '3 months'
WHERE individual_verified = true AND individual_verified_at IS NOT NULL;

-- Set expiry date for currently verified businesses (3 months from verification date)
UPDATE users
SET business_verification_expires_at = business_verified_at + INTERVAL '3 months'
WHERE business_verification_status = 'approved' AND business_verified_at IS NOT NULL;

-- Create indexes for expiry checks
CREATE INDEX IF NOT EXISTS idx_users_individual_verification_expiry
ON users(individual_verification_expires_at)
WHERE individual_verified = true;

CREATE INDEX IF NOT EXISTS idx_users_business_verification_expiry
ON users(business_verification_expires_at)
WHERE business_verification_status = 'approved';

-- Add comments
COMMENT ON COLUMN users.individual_verification_expires_at IS 'Date when individual seller verification expires. After this date, user becomes normal user.';
COMMENT ON COLUMN users.business_verification_expires_at IS 'Date when business verification expires. After this date, user becomes normal user.';
