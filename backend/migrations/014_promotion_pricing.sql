-- Promotion Pricing Table
-- Stores configurable pricing for ad promotions (managed by super admin)

CREATE TABLE IF NOT EXISTS promotion_pricing (
  id SERIAL PRIMARY KEY,
  promotion_type VARCHAR(50) NOT NULL, -- 'featured', 'urgent', 'sticky'
  duration_days INTEGER NOT NULL,      -- 3, 7, 15, 30
  individual_price DECIMAL(10, 2) NOT NULL DEFAULT 0,  -- Price for individual sellers
  business_price DECIMAL(10, 2) NOT NULL DEFAULT 0,    -- Price for verified businesses
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(promotion_type, duration_days)
);

-- Insert default pricing
INSERT INTO promotion_pricing (promotion_type, duration_days, individual_price, business_price) VALUES
-- Featured Ads (Homepage + Search + Category visibility)
('featured', 3, 500.00, 350.00),
('featured', 7, 1000.00, 700.00),
('featured', 15, 1800.00, 1080.00),
('featured', 30, 3200.00, 1920.00),

-- Urgent Ads (Top of subcategory with priority)
('urgent', 3, 300.00, 210.00),
('urgent', 7, 600.00, 420.00),
('urgent', 15, 1000.00, 600.00),
('urgent', 30, 1800.00, 1080.00),

-- Sticky Ads (Top of subcategory)
('sticky', 3, 150.00, 105.00),
('sticky', 7, 300.00, 210.00),
('sticky', 15, 500.00, 300.00),
('sticky', 30, 900.00, 540.00)
ON CONFLICT (promotion_type, duration_days) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_promotion_pricing_type_duration
ON promotion_pricing(promotion_type, duration_days);

-- Add update trigger for updated_at
CREATE OR REPLACE FUNCTION update_promotion_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER promotion_pricing_updated_at
BEFORE UPDATE ON promotion_pricing
FOR EACH ROW
EXECUTE FUNCTION update_promotion_pricing_updated_at();

-- Add comments
COMMENT ON TABLE promotion_pricing IS 'Configurable pricing for ad promotions (managed by super admin)';
COMMENT ON COLUMN promotion_pricing.promotion_type IS 'Type of promotion: featured, urgent, or sticky';
COMMENT ON COLUMN promotion_pricing.duration_days IS 'Duration in days: 3, 7, 15, or 30';
COMMENT ON COLUMN promotion_pricing.individual_price IS 'Price for individual sellers (NPR)';
COMMENT ON COLUMN promotion_pricing.business_price IS 'Discounted price for verified businesses (NPR)';
