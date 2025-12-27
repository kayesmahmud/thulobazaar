-- Migration: Add payment-related columns to verification tables
-- Reason: Schema drift from database backup restoration
-- Schema.prisma already has these fields, database needs to catch up

-- Add payment columns to individual_verification_requests
ALTER TABLE individual_verification_requests
  ADD COLUMN duration_days INT DEFAULT 365,
  ADD COLUMN payment_amount DECIMAL(10, 2),
  ADD COLUMN payment_reference VARCHAR(255),
  ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';

-- Add payment columns to business_verification_requests
ALTER TABLE business_verification_requests
  ADD COLUMN duration_days INT DEFAULT 365,
  ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';

-- Create indexes as defined in schema.prisma
CREATE INDEX idx_individual_verification_payment
  ON individual_verification_requests(payment_status);

CREATE INDEX idx_business_verification_payment
  ON business_verification_requests(payment_status);
