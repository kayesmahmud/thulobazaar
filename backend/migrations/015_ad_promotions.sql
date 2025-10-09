-- =====================================================
-- Ad Promotions Table Migration
-- For tracking ad promotion history and active promotions
-- =====================================================

BEGIN;

-- Create ad_promotions table
CREATE TABLE IF NOT EXISTS ad_promotions (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Promotion details
    promotion_type VARCHAR(20) NOT NULL,
    -- Values: 'featured', 'urgent', 'sticky'

    duration_days INTEGER NOT NULL,
    -- Values: 3, 7, 15

    amount_paid DECIMAL(10,2) NOT NULL,

    -- Transaction reference
    transaction_id VARCHAR(255) REFERENCES payment_transactions(transaction_id),

    -- Promotion period
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'active',
    -- Values: 'active', 'expired', 'cancelled'

    -- Metadata
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CHECK (promotion_type IN ('featured', 'urgent', 'sticky')),
    CHECK (duration_days IN (3, 7, 15)),
    CHECK (amount_paid >= 0),
    CHECK (status IN ('active', 'expired', 'cancelled'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_promotions_ad_id
ON ad_promotions(ad_id);

CREATE INDEX IF NOT EXISTS idx_ad_promotions_user_id
ON ad_promotions(user_id);

CREATE INDEX IF NOT EXISTS idx_ad_promotions_type
ON ad_promotions(promotion_type);

CREATE INDEX IF NOT EXISTS idx_ad_promotions_status
ON ad_promotions(status);

CREATE INDEX IF NOT EXISTS idx_ad_promotions_expires
ON ad_promotions(expires_at);

CREATE INDEX IF NOT EXISTS idx_ad_promotions_active
ON ad_promotions(ad_id, status, expires_at)
WHERE status = 'active';

-- Add comments for documentation
COMMENT ON TABLE ad_promotions IS 'Tracks all ad promotion history and active promotions';
COMMENT ON COLUMN ad_promotions.promotion_type IS 'Type: featured, urgent, or sticky';
COMMENT ON COLUMN ad_promotions.duration_days IS 'Duration: 3, 7, or 15 days';
COMMENT ON COLUMN ad_promotions.status IS 'Status: active, expired, or cancelled';

COMMIT;

-- =====================================================
-- Verification queries
-- =====================================================

-- Check if table exists
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables
--   WHERE table_name = 'ad_promotions'
-- );

-- Check table structure
-- \d ad_promotions

-- Sample queries
-- SELECT * FROM ad_promotions ORDER BY created_at DESC LIMIT 10;
-- SELECT COUNT(*) FROM ad_promotions WHERE status = 'active';
-- SELECT promotion_type, COUNT(*) FROM ad_promotions GROUP BY promotion_type;
