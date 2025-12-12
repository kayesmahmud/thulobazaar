-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string',
  description TEXT,
  created_at TIMESTAMP(6) DEFAULT NOW(),
  updated_at TIMESTAMP(6) DEFAULT NOW()
);

-- Create verification_pricing table
CREATE TABLE IF NOT EXISTS verification_pricing (
  id SERIAL PRIMARY KEY,
  verification_type VARCHAR(20) NOT NULL,
  duration_days INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  discount_percentage INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP(6) DEFAULT NOW(),
  updated_at TIMESTAMP(6) DEFAULT NOW(),
  UNIQUE(verification_type, duration_days)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_verification_pricing_type ON verification_pricing(verification_type);

-- Insert site settings for free verification
INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
  ('free_verification_enabled', 'true', 'boolean', 'Enable free verification promotion for new users'),
  ('free_verification_duration_days', '180', 'number', 'Duration in days for free verification (6 months)'),
  ('free_verification_types', '["individual","business"]', 'json', 'Verification types eligible for free promotion')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert verification pricing for Individual verification
-- 1 month = 30 days
-- 3 months = 90 days
-- 6 months = 180 days
-- 12 months = 365 days

INSERT INTO verification_pricing (verification_type, duration_days, price, discount_percentage, is_active) VALUES
  ('individual', 30, 500, 0, true),
  ('individual', 90, 1200, 20, true),
  ('individual', 180, 2000, 33, true),
  ('individual', 365, 3500, 42, true)
ON CONFLICT (verification_type, duration_days) DO NOTHING;

-- Insert verification pricing for Business verification
INSERT INTO verification_pricing (verification_type, duration_days, price, discount_percentage, is_active) VALUES
  ('business', 30, 1000, 0, true),
  ('business', 90, 2500, 17, true),
  ('business', 180, 4000, 33, true),
  ('business', 365, 7000, 42, true)
ON CONFLICT (verification_type, duration_days) DO NOTHING;
