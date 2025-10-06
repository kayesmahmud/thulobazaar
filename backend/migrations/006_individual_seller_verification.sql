-- Migration: Individual Seller Verification System
-- Description: Add table and columns for individual seller verification with blue badge

-- Create individual_verification_requests table
CREATE TABLE IF NOT EXISTS individual_verification_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Document information
  id_document_type VARCHAR(50) NOT NULL, -- 'citizenship', 'passport', 'driving_license'
  id_document_number VARCHAR(100) NOT NULL,
  id_document_front VARCHAR(255), -- filename for front image
  id_document_back VARCHAR(255),  -- filename for back image (optional for passport)

  -- Selfie with ID
  selfie_with_id VARCHAR(255),

  -- Verification status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'

  -- Editor information
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT unique_user_pending_request UNIQUE (user_id, status)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_individual_verification_status ON individual_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_individual_verification_user_id ON individual_verification_requests(user_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_individual_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_individual_verification_updated_at
  BEFORE UPDATE ON individual_verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_individual_verification_updated_at();

-- Add individual_verified column if not exists (already exists from previous migration)
-- Just ensuring it's there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'individual_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN individual_verified BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'individual_verified_at'
  ) THEN
    ALTER TABLE users ADD COLUMN individual_verified_at TIMESTAMP;
  END IF;
END $$;

COMMENT ON TABLE individual_verification_requests IS 'Stores verification requests for individual sellers (blue badge)';
COMMENT ON COLUMN individual_verification_requests.id_document_type IS 'Type of ID: citizenship, passport, or driving_license';
COMMENT ON COLUMN individual_verification_requests.status IS 'Verification status: pending, approved, rejected';
