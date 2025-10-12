-- Add latitude and longitude columns to users table for precise map location
-- This allows shop owners to set their exact location on a map

ALTER TABLE users
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN formatted_address TEXT;

-- Add index for location-based queries
CREATE INDEX idx_users_coordinates ON users(latitude, longitude);

-- Comments
COMMENT ON COLUMN users.latitude IS 'Latitude coordinate for shop location (-90 to 90)';
COMMENT ON COLUMN users.longitude IS 'Longitude coordinate for shop location (-180 to 180)';
COMMENT ON COLUMN users.formatted_address IS 'Human-readable address from reverse geocoding';
