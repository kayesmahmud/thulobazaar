-- =====================================================
-- Payment Transactions Table Migration
-- For Mock Payment System (and future real payments)
-- =====================================================

BEGIN;

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Payment details
    payment_type VARCHAR(50) NOT NULL,
    -- Values: 'individual_verification', 'business_verification', 'ad_promotion'

    payment_gateway VARCHAR(20) NOT NULL,
    -- Values: 'mock', 'esewa', 'khalti'

    amount DECIMAL(10,2) NOT NULL,

    -- Transaction identifiers
    transaction_id VARCHAR(255) NOT NULL UNIQUE,
    reference_id VARCHAR(255),

    -- Related entity (ad_id, verification_request_id, etc.)
    related_id INTEGER,

    -- Payment status
    status VARCHAR(20) DEFAULT 'pending',
    -- Values: 'pending', 'verified', 'failed', 'refunded'

    -- Additional data (promotion details, verification details, etc.)
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,

    -- Optional fields
    payment_url TEXT,
    failure_reason TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id
ON payment_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_txn_id
ON payment_transactions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status
ON payment_transactions(status);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_type
ON payment_transactions(payment_type);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway
ON payment_transactions(payment_gateway);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_created
ON payment_transactions(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE payment_transactions IS 'All payment transactions (mock and real)';
COMMENT ON COLUMN payment_transactions.payment_type IS 'Type of payment: individual_verification, business_verification, ad_promotion';
COMMENT ON COLUMN payment_transactions.payment_gateway IS 'Payment gateway used: mock, esewa, khalti';
COMMENT ON COLUMN payment_transactions.status IS 'Payment status: pending, verified, failed, refunded';
COMMENT ON COLUMN payment_transactions.metadata IS 'Additional data in JSON format';

COMMIT;

-- =====================================================
-- Verification queries
-- =====================================================

-- Check if table exists
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables
--   WHERE table_name = 'payment_transactions'
-- );

-- Check table structure
-- \d payment_transactions

-- Sample queries
-- SELECT * FROM payment_transactions ORDER BY created_at DESC LIMIT 10;
-- SELECT COUNT(*) FROM payment_transactions WHERE status = 'verified';
-- SELECT SUM(amount) FROM payment_transactions WHERE status = 'verified';
