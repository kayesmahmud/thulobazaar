-- Migration: Add user profile fields
-- Date: 2025-10-01
-- Purpose: Add bio, avatar, cover photo, phone, and location to users table

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_photo VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_id INTEGER;

-- Add foreign key constraint for location
ALTER TABLE users
ADD CONSTRAINT fk_user_location
FOREIGN KEY (location_id)
REFERENCES locations(id)
ON DELETE SET NULL;

-- Create index for faster location lookups
CREATE INDEX IF NOT EXISTS idx_users_location_id ON users(location_id);

-- Update existing users with default values (optional)
UPDATE users SET bio = '' WHERE bio IS NULL;
UPDATE users SET phone = '' WHERE phone IS NULL;

COMMENT ON COLUMN users.bio IS 'User biography/description (max 500 characters)';
COMMENT ON COLUMN users.avatar IS 'Path to user avatar image';
COMMENT ON COLUMN users.cover_photo IS 'Path to user cover photo';
COMMENT ON COLUMN users.phone IS 'User contact phone number';
COMMENT ON COLUMN users.location_id IS 'User primary location reference';
