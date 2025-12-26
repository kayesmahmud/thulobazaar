-- Fix promo_code index to match Prisma schema
-- The partial index (WHERE promo_code IS NOT NULL) causes drift detection
-- Replace with standard index to align with Prisma expectations

-- Drop the existing partial index
DROP INDEX IF EXISTS idx_promo_campaigns_code;

-- Create standard index matching Prisma schema
CREATE INDEX idx_promo_campaigns_code ON promotional_campaigns(promo_code);
