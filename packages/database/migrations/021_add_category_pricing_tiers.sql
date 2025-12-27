-- Migration: Add Category-Based Pricing Tiers
-- Description: Add pricing_tier column to promotion_pricing and create category tier mapping table

-- Step 1: Add pricing_tier column to promotion_pricing
ALTER TABLE promotion_pricing
ADD COLUMN IF NOT EXISTS pricing_tier VARCHAR(20) DEFAULT 'default';

-- Step 2: Drop existing unique constraint
ALTER TABLE promotion_pricing
DROP CONSTRAINT IF EXISTS promotion_pricing_promotion_type_duration_days_account_type_key;

-- Step 3: Create new unique constraint including pricing_tier
ALTER TABLE promotion_pricing
ADD CONSTRAINT promotion_pricing_unique_key
UNIQUE (promotion_type, duration_days, account_type, pricing_tier);

-- Step 4: Create category pricing tiers mapping table
CREATE TABLE IF NOT EXISTS category_pricing_tiers (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL,
    pricing_tier VARCHAR(20) NOT NULL DEFAULT 'default',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_pricing_tier CHECK (pricing_tier IN ('default', 'electronics', 'vehicles', 'property'))
);

-- Step 5: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_category_pricing_tiers_category_id ON category_pricing_tiers(category_id);
CREATE INDEX IF NOT EXISTS idx_category_pricing_tiers_pricing_tier ON category_pricing_tiers(pricing_tier);
CREATE INDEX IF NOT EXISTS idx_promotion_pricing_tier ON promotion_pricing(pricing_tier);

-- Step 6: Add constraint to promotion_pricing for valid tiers
ALTER TABLE promotion_pricing
ADD CONSTRAINT valid_promotion_pricing_tier CHECK (pricing_tier IN ('default', 'electronics', 'vehicles', 'property'));

-- Step 7: Insert default category-to-tier mappings
-- Electronics tier (Mobiles, Electronics)
INSERT INTO category_pricing_tiers (category_name, pricing_tier)
VALUES
    ('Mobiles', 'electronics'),
    ('Electronics', 'electronics')
ON CONFLICT DO NOTHING;

-- Vehicles tier
INSERT INTO category_pricing_tiers (category_name, pricing_tier)
VALUES ('Vehicles', 'vehicles')
ON CONFLICT DO NOTHING;

-- Property tier
INSERT INTO category_pricing_tiers (category_name, pricing_tier)
VALUES ('Property', 'property')
ON CONFLICT DO NOTHING;

-- Note: All other categories will use 'default' tier (no explicit mapping needed)
