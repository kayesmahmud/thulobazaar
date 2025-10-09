-- =====================================================
-- Add Promotion Expiry Columns to Ads Table
-- =====================================================

BEGIN;

-- Add expiry timestamp columns for each promotion type
ALTER TABLE ads ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS urgent_until TIMESTAMP;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS sticky_until TIMESTAMP;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMP;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ads_featured_until
ON ads(featured_until)
WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_ads_urgent_until
ON ads(urgent_until)
WHERE is_urgent = true;

CREATE INDEX IF NOT EXISTS idx_ads_sticky_until
ON ads(sticky_until)
WHERE is_sticky = true;

CREATE INDEX IF NOT EXISTS idx_ads_promoted_at
ON ads(promoted_at DESC)
WHERE is_featured = true OR is_urgent = true OR is_sticky = true;

-- Add comments
COMMENT ON COLUMN ads.featured_until IS 'Featured promotion expires at this timestamp';
COMMENT ON COLUMN ads.urgent_until IS 'Urgent promotion expires at this timestamp';
COMMENT ON COLUMN ads.sticky_until IS 'Sticky promotion expires at this timestamp';
COMMENT ON COLUMN ads.promoted_at IS 'Last time any promotion was activated';

COMMIT;

-- =====================================================
-- Verification
-- =====================================================

-- Check columns were added
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'ads'
-- AND column_name IN ('featured_until', 'urgent_until', 'sticky_until', 'promoted_at')
-- ORDER BY column_name;
