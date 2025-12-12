-- Migration: Fix all schema drift between Prisma schema and database
-- Created: 2025-12-10
-- This adds all missing tables and columns identified by schema comparison

-- ============================================================================
-- PART 1: Missing columns in users table
-- ============================================================================

-- Phone verification columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP;

-- Activity tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Two-factor authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_backup_codes JSONB;

-- Custom shop slug (user-defined shop URL)
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_shop_slug VARCHAR(255) UNIQUE;

-- OAuth provider info
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255);


-- ============================================================================
-- PART 2: Phone OTPs table (for phone verification)
-- ============================================================================

CREATE TABLE IF NOT EXISTS phone_otps (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  purpose VARCHAR(50) DEFAULT 'registration',
  attempts INTEGER DEFAULT 0,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_phone_otps_phone ON phone_otps(phone);
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone_code ON phone_otps(phone, otp_code);
CREATE INDEX IF NOT EXISTS idx_phone_otps_expires ON phone_otps(expires_at);

-- ============================================================================
-- PART 3: Shop Reports table (for reporting shops/sellers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS shop_reports (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  admin_notes TEXT,
  resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shop_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_reports_shop_id ON shop_reports(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_reports_reporter_id ON shop_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_shop_reports_status ON shop_reports(status);
CREATE INDEX IF NOT EXISTS idx_shop_reports_created_at ON shop_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_reports_resolved_by ON shop_reports(resolved_by);

-- ============================================================================
-- PART 4: Messaging System tables
-- ============================================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) DEFAULT 'direct',
  title VARCHAR(255),
  ad_id INTEGER REFERENCES ads(id) ON UPDATE NO ACTION,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_ad_id ON conversations(ad_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_muted BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_unread ON conversation_participants(user_id, last_read_at);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  attachment_url VARCHAR(500),
  attachment_type VARCHAR(50),
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(conversation_id, created_at DESC);

-- Message read receipts
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_user ON message_read_receipts(user_id);

-- Typing indicators (ephemeral, for real-time typing status)
CREATE TABLE IF NOT EXISTS typing_indicators (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_conversation ON typing_indicators(conversation_id);

-- ============================================================================
-- PART 5: Support System tables
-- ============================================================================

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open',
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);

-- Support messages (replies in tickets)
CREATE TABLE IF NOT EXISTS support_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_staff_reply BOOLEAN DEFAULT false,
  attachment_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender ON support_messages(sender_id);

-- ============================================================================
-- PART 6: Announcements System tables
-- ============================================================================

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  target_audience VARCHAR(50) DEFAULT 'all',
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ends_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);

-- Announcement read receipts
CREATE TABLE IF NOT EXISTS announcement_read_receipts (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement ON announcement_read_receipts(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON announcement_read_receipts(user_id);

-- ============================================================================
-- PART 7: Ensure previously missing items from migration 013 exist
-- ============================================================================

-- categories.form_template (for dynamic ad forms)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS form_template VARCHAR(50);

-- ads.custom_fields (for template-specific attributes)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ad_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_ad_id ON user_favorites(ad_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at DESC);

-- ============================================================================
-- Done! Run: npx prisma generate after this migration
-- ============================================================================
