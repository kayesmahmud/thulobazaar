-- =====================================================
-- Business Accounts & Ad Promotions Migration
-- Thulobazaar Marketplace
-- Individual → Verified Business + Ad Promotion System
-- =====================================================

BEGIN;

-- =====================================================
-- 1. UPDATE USERS TABLE - Business Account Fields
-- =====================================================

-- Account type: individual or business
ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'individual';

COMMENT ON COLUMN users.account_type IS 'Account type: individual or business';

-- Business details
ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_license_document VARCHAR(255);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_verification_status VARCHAR(20) DEFAULT NULL;
-- Values: NULL, 'pending', 'approved', 'rejected'

ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_verified_at TIMESTAMP;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_verified_by INTEGER REFERENCES users(id);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_rejection_reason TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_payment_reference VARCHAR(255);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_payment_amount DECIMAL(10,2);

-- Optional business information
ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_category VARCHAR(100);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_description TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_website VARCHAR(255);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_phone VARCHAR(20);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_address TEXT;

-- Business subscription
ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_subscription_start TIMESTAMP;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_subscription_end TIMESTAMP;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_subscription_status VARCHAR(20);
-- Values: 'active', 'expired', 'cancelled'

-- Update is_verified to work with both individual and business
-- Keep existing is_verified for individual users (blue checkmark)
-- business_verification_status = 'approved' gives golden checkmark

-- =====================================================
-- 2. UPDATE ADS TABLE - Add Promotion Fields
-- =====================================================

-- Promotion types: bump_up, sticky, urgent
ALTER TABLE ads
ADD COLUMN IF NOT EXISTS is_bumped BOOLEAN DEFAULT FALSE;

ALTER TABLE ads
ADD COLUMN IF NOT EXISTS bump_expires_at TIMESTAMP;

ALTER TABLE ads
ADD COLUMN IF NOT EXISTS is_sticky BOOLEAN DEFAULT FALSE;

ALTER TABLE ads
ADD COLUMN IF NOT EXISTS sticky_expires_at TIMESTAMP;

ALTER TABLE ads
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;

ALTER TABLE ads
ADD COLUMN IF NOT EXISTS urgent_expires_at TIMESTAMP;

-- Track promotion history
ALTER TABLE ads
ADD COLUMN IF NOT EXISTS total_promotions INTEGER DEFAULT 0;

ALTER TABLE ads
ADD COLUMN IF NOT EXISTS last_promoted_at TIMESTAMP;

-- =====================================================
-- 3. CREATE AD_PROMOTIONS TABLE (Transaction History)
-- =====================================================

CREATE TABLE IF NOT EXISTS ad_promotions (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    promotion_type VARCHAR(20) NOT NULL, -- 'bump_up', 'sticky', 'urgent'
    duration_days INTEGER NOT NULL, -- 3, 7, or 15
    price_paid DECIMAL(10,2) NOT NULL,
    account_type VARCHAR(20) NOT NULL, -- 'individual' or 'business' (for pricing reference)
    payment_reference VARCHAR(255),
    payment_method VARCHAR(50), -- 'khalti', 'esewa', 'manual', 'free' (for business perks)
    starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_promotions_ad_id ON ad_promotions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_promotions_user_id ON ad_promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_promotions_expires_at ON ad_promotions(expires_at);
CREATE INDEX IF NOT EXISTS idx_ad_promotions_active ON ad_promotions(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE ad_promotions IS 'Ad promotion purchase history and tracking';

-- =====================================================
-- 4. CREATE PROMOTION_PRICING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS promotion_pricing (
    id SERIAL PRIMARY KEY,
    promotion_type VARCHAR(20) NOT NULL, -- 'bump_up', 'sticky', 'urgent'
    duration_days INTEGER NOT NULL, -- 3, 7, 15
    account_type VARCHAR(20) NOT NULL, -- 'individual' or 'business'
    price DECIMAL(10,2) NOT NULL,
    discount_percentage INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(promotion_type, duration_days, account_type)
);

-- Insert default pricing (you can adjust these later)
INSERT INTO promotion_pricing (promotion_type, duration_days, account_type, price, discount_percentage) VALUES
-- Bump Up Pricing
('bump_up', 3, 'individual', 100.00, 0),
('bump_up', 7, 'individual', 200.00, 0),
('bump_up', 15, 'individual', 350.00, 0),
('bump_up', 3, 'business', 70.00, 30),   -- 30% discount
('bump_up', 7, 'business', 140.00, 30),  -- 30% discount
('bump_up', 15, 'business', 245.00, 30), -- 30% discount

-- Sticky Pricing (Premium)
('sticky', 3, 'individual', 300.00, 0),
('sticky', 7, 'individual', 600.00, 0),
('sticky', 15, 'individual', 1050.00, 0),
('sticky', 3, 'business', 180.00, 40),   -- 40% discount
('sticky', 7, 'business', 360.00, 40),   -- 40% discount
('sticky', 15, 'business', 630.00, 40),  -- 40% discount

-- Urgent Pricing
('urgent', 3, 'individual', 150.00, 0),
('urgent', 7, 'individual', 300.00, 0),
('urgent', 15, 'individual', 525.00, 0),
('urgent', 3, 'business', 90.00, 40),    -- 40% discount
('urgent', 7, 'business', 180.00, 40),   -- 40% discount
('urgent', 15, 'business', 315.00, 40)   -- 40% discount
ON CONFLICT (promotion_type, duration_days, account_type) DO NOTHING;

COMMENT ON TABLE promotion_pricing IS 'Pricing for ad promotions with discounts for business accounts';

-- =====================================================
-- 5. CREATE BUSINESS_VERIFICATION_REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS business_verification_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_license_document VARCHAR(255) NOT NULL,
    business_category VARCHAR(100),
    business_description TEXT,
    business_website VARCHAR(255),
    business_phone VARCHAR(20),
    business_address TEXT,
    payment_reference VARCHAR(255),
    payment_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_business_requests_user_id ON business_verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_business_requests_status ON business_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_business_requests_created_at ON business_verification_requests(created_at DESC);

COMMENT ON TABLE business_verification_requests IS 'Business account verification requests from users';

-- =====================================================
-- 6. CREATE BUSINESS_SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS business_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL, -- 'monthly', 'quarterly', 'annual'
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_reference VARCHAR(255),
    payment_method VARCHAR(50),
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'cancelled'
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_business_subs_user_id ON business_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_business_subs_status ON business_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_business_subs_end_date ON business_subscriptions(end_date);

COMMENT ON TABLE business_subscriptions IS 'Business account subscription payments and renewals';

-- =====================================================
-- 7. ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for business verification status queries
CREATE INDEX IF NOT EXISTS idx_users_business_status
ON users(business_verification_status)
WHERE business_verification_status = 'pending';

-- Index for active business accounts
CREATE INDEX IF NOT EXISTS idx_users_business_accounts
ON users(account_type, business_verification_status)
WHERE account_type = 'business' AND business_verification_status = 'approved';

-- Index for promoted ads queries
CREATE INDEX IF NOT EXISTS idx_ads_bumped
ON ads(is_bumped, bump_expires_at)
WHERE is_bumped = TRUE;

CREATE INDEX IF NOT EXISTS idx_ads_sticky
ON ads(is_sticky, sticky_expires_at)
WHERE is_sticky = TRUE;

CREATE INDEX IF NOT EXISTS idx_ads_urgent
ON ads(is_urgent, urgent_expires_at)
WHERE is_urgent = TRUE;

-- =====================================================
-- 8. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN users.account_type IS 'Account type: individual or business';
COMMENT ON COLUMN users.business_verification_status IS 'Status: NULL, pending, approved, rejected';
COMMENT ON COLUMN ads.is_bumped IS 'Ad is bumped to top of listings';
COMMENT ON COLUMN ads.is_sticky IS 'Ad stays at top (premium promotion)';
COMMENT ON COLUMN ads.is_urgent IS 'Ad marked as urgent sale';

-- =====================================================
-- 9. CREATE FUNCTION TO AUTO-EXPIRE PROMOTIONS
-- =====================================================

-- Function to check and expire old promotions
CREATE OR REPLACE FUNCTION expire_old_promotions()
RETURNS void AS $$
BEGIN
    -- Expire bumped ads
    UPDATE ads
    SET is_bumped = FALSE
    WHERE is_bumped = TRUE
    AND bump_expires_at < CURRENT_TIMESTAMP;

    -- Expire sticky ads
    UPDATE ads
    SET is_sticky = FALSE
    WHERE is_sticky = TRUE
    AND sticky_expires_at < CURRENT_TIMESTAMP;

    -- Expire urgent ads
    UPDATE ads
    SET is_urgent = FALSE
    WHERE is_urgent = TRUE
    AND urgent_expires_at < CURRENT_TIMESTAMP;

    -- Update promotion records
    UPDATE ad_promotions
    SET is_active = FALSE
    WHERE is_active = TRUE
    AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_old_promotions() IS 'Auto-expire promotions that have passed their expiry date';

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check business accounts
-- SELECT id, full_name, account_type, business_name, business_verification_status FROM users WHERE account_type = 'business';

-- Check promotion pricing
-- SELECT * FROM promotion_pricing ORDER BY promotion_type, duration_days, account_type;

-- Check active promotions
-- SELECT * FROM ad_promotions WHERE is_active = TRUE;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Business accounts get 30-40% discount on ad promotions
-- 2. Call expire_old_promotions() periodically via cron job
-- 3. Pricing can be updated in promotion_pricing table
-- 4. Business verification workflow: request → pending → approved/rejected
-- 5. Golden checkmark: business_verification_status = 'approved'
-- 6. Blue checkmark: is_verified = TRUE (individual users)
-- =====================================================
