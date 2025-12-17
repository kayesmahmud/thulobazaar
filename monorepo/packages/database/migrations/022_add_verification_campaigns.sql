-- Migration: Add verification_campaigns table
-- Date: 2025-12-17
-- Description: Add promotional campaigns for verification discounts (similar to promotional_campaigns)

CREATE TABLE IF NOT EXISTS verification_campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_percentage INTEGER NOT NULL DEFAULT 0,
    promo_code VARCHAR(50),
    banner_text VARCHAR(255),
    banner_emoji VARCHAR(10) DEFAULT '🎉',
    start_date TIMESTAMP(6) NOT NULL,
    end_date TIMESTAMP(6) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    applies_to_types TEXT[] DEFAULT '{}',
    min_duration_days INTEGER,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id) ON UPDATE NO ACTION,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_verif_campaigns_active ON verification_campaigns(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_verif_campaigns_code ON verification_campaigns(promo_code);

COMMENT ON TABLE verification_campaigns IS 'Promotional campaigns for verification discounts';
