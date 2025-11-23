-- Migration: Add user favorites table
-- Created: 2025-10-28

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraint: user can only favorite an ad once
  UNIQUE(user_id, ad_id)
);

-- Create index for faster lookups
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_ad_id ON user_favorites(ad_id);
CREATE INDEX idx_user_favorites_created_at ON user_favorites(created_at DESC);

-- Add comment
COMMENT ON TABLE user_favorites IS 'Stores user favorited/bookmarked ads';
