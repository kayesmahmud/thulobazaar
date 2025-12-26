-- Fix Schema Drift
-- Aligns database with Prisma schema for promotional_campaigns and verification_campaigns

-- 1. Add foreign key for promotional_campaigns.created_by -> users.id
ALTER TABLE promotional_campaigns
  ADD CONSTRAINT promotional_campaigns_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE SET NULL;

-- 2. Add foreign key for verification_campaigns.created_by -> users.id
ALTER TABLE verification_campaigns
  ADD CONSTRAINT verification_campaigns_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE SET NULL;
