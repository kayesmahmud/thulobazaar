-- Migration: Add ad_review_history table and suspended_until column
-- Date: 2025-12-11
-- Description: Implements ad review history tracking and suspension duration feature

-- Add suspended_until column to ads table
ALTER TABLE ads ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP(6);

-- Create ad_review_history table
CREATE TABLE IF NOT EXISTS ad_review_history (
  id SERIAL PRIMARY KEY,
  ad_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  actor_id INT NOT NULL,
  actor_type VARCHAR(20) NOT NULL,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ad_review_history_ad
    FOREIGN KEY (ad_id)
    REFERENCES ads(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_ad_review_history_user
    FOREIGN KEY (actor_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

-- Create indexes for ad_review_history
CREATE INDEX IF NOT EXISTS idx_ad_review_history_ad_id ON ad_review_history(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_review_history_created_at ON ad_review_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_review_history_action ON ad_review_history(action);

-- Add comment to table
COMMENT ON TABLE ad_review_history IS 'Tracks all status changes for ads - submitted, approved, rejected, suspended, unsuspended, deleted, restored, resubmitted';
COMMENT ON COLUMN ad_review_history.action IS 'Action performed: submitted, approved, rejected, suspended, unsuspended, deleted, restored, resubmitted, permanently_deleted';
COMMENT ON COLUMN ad_review_history.actor_type IS 'Type of actor: user, editor, admin, system';
COMMENT ON COLUMN ad_review_history.reason IS 'Reason for rejection, suspension, or deletion';
COMMENT ON COLUMN ad_review_history.notes IS 'Additional notes or context';
