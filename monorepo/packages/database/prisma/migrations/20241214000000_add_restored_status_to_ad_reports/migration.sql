-- Add 'restored' status to ad_reports status check constraint
-- This allows reports to be marked as 'restored' when a deleted ad is restored

-- Drop the existing constraint
ALTER TABLE ad_reports DROP CONSTRAINT IF EXISTS ad_reports_status_check;

-- Recreate with the new 'restored' status included
ALTER TABLE ad_reports ADD CONSTRAINT ad_reports_status_check
  CHECK (status::text = ANY (ARRAY['pending'::character varying, 'reviewed'::character varying, 'resolved'::character varying, 'dismissed'::character varying, 'restored'::character varying]::text[]));
