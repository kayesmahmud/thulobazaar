-- =====================================================
-- Editor System Migration
-- Thulobazaar Marketplace
-- Two-tier admin system: Editor + Super Admin
-- =====================================================

BEGIN;

-- =====================================================
-- 1. UPDATE USERS TABLE - Add Editor System Fields
-- =====================================================

-- Add role enum if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'editor', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop default constraint first
ALTER TABLE users
ALTER COLUMN role DROP DEFAULT;

-- Update existing 'admin' role to 'super_admin' before enum conversion
UPDATE users SET role = 'super_admin' WHERE role = 'admin';

-- Update role column to use enum (if it's currently varchar)
ALTER TABLE users
ALTER COLUMN role TYPE user_role USING role::user_role;

-- Set default role
ALTER TABLE users
ALTER COLUMN role SET DEFAULT 'user';

-- Add verification status
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(id);

-- Add suspension fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS suspended_by INTEGER REFERENCES users(id);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- =====================================================
-- 2. UPDATE ADS TABLE - Add Soft Delete
-- =====================================================

-- Add soft delete fields
ALTER TABLE ads
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

ALTER TABLE ads
ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);

ALTER TABLE ads
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Add reviewed by editor field
ALTER TABLE ads
ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id);

ALTER TABLE ads
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- =====================================================
-- 3. CREATE ADMIN_ACTIVITY_LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'approve_ad', 'reject_ad', 'delete_ad', 'suspend_user', etc.
    target_type VARCHAR(50) NOT NULL, -- 'ad', 'user', 'category', etc.
    target_id INTEGER NOT NULL,
    details JSONB, -- Store additional context
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_id
ON admin_activity_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type
ON admin_activity_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_activity_logs_target
ON admin_activity_logs(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
ON admin_activity_logs(created_at DESC);

-- =====================================================
-- 4. CREATE EDITOR_PERMISSIONS TABLE (for future fine-grained control)
-- =====================================================

CREATE TABLE IF NOT EXISTS editor_permissions (
    id SERIAL PRIMARY KEY,
    editor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL, -- 'approve_ads', 'delete_ads', 'suspend_users', etc.
    granted_by INTEGER REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(editor_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_editor_permissions_editor_id
ON editor_permissions(editor_id);

-- =====================================================
-- 5. UPDATE INDEXES FOR SOFT DELETE QUERIES
-- =====================================================

-- Index for active (not deleted) ads
CREATE INDEX IF NOT EXISTS idx_ads_deleted_at
ON ads(deleted_at)
WHERE deleted_at IS NULL;

-- Index for suspended users
CREATE INDEX IF NOT EXISTS idx_users_suspended
ON users(is_suspended, suspended_until)
WHERE is_suspended = TRUE;

-- Index for verified users
CREATE INDEX IF NOT EXISTS idx_users_verified
ON users(is_verified)
WHERE is_verified = TRUE;

-- =====================================================
-- 6. CREATE DEFAULT SUPER ADMIN (if not exists)
-- =====================================================

-- Note: Already updated 'admin' to 'super_admin' in step 1
-- This section is for creating new super admin if needed

-- Create super admin if doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@thulobazaar.com') THEN
        INSERT INTO users (email, password_hash, full_name, role, is_active, created_at)
        VALUES (
            'admin@thulobazaar.com',
            '$2b$10$YourHashedPasswordHere', -- Replace with actual hashed password
            'Super Administrator',
            'super_admin',
            TRUE,
            CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- =====================================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN users.role IS 'User role: user, editor, super_admin';
COMMENT ON COLUMN users.is_verified IS 'Whether user is verified by an editor';
COMMENT ON COLUMN users.is_suspended IS 'Whether user is currently suspended/banned';
COMMENT ON COLUMN users.suspended_until IS 'Suspension end date (NULL for permanent)';

COMMENT ON COLUMN ads.deleted_at IS 'Soft delete timestamp (NULL = not deleted)';
COMMENT ON COLUMN ads.deleted_by IS 'Editor/Admin who deleted this ad';

COMMENT ON TABLE admin_activity_logs IS 'Audit trail for all admin/editor actions';

-- =====================================================
-- 8. GRANT PERMISSIONS (adjust based on your DB setup)
-- =====================================================

-- Grant permissions to your application user
-- GRANT ALL PRIVILEGES ON admin_activity_logs TO your_app_user;
-- GRANT ALL PRIVILEGES ON editor_permissions TO your_app_user;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check roles
-- SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check activity logs table
-- SELECT COUNT(*) FROM admin_activity_logs;

-- Check soft deleted ads
-- SELECT COUNT(*) FROM ads WHERE deleted_at IS NOT NULL;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Soft delete: ads.deleted_at IS NULL means active
-- 2. User suspension: Check is_suspended AND (suspended_until IS NULL OR suspended_until > NOW())
-- 3. Activity logs: Store all editor actions for audit trail
-- 4. Verification: is_verified flag for future verified badge
-- =====================================================
