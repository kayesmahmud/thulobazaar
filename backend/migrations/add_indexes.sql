-- =====================================================
-- Database Performance & Security Indexes Migration
-- Thulobazaar Marketplace
-- Created: 2025-09-30
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- 1. ADS TABLE INDEXES
-- =====================================================

-- Index for filtering by status (most common query)
CREATE INDEX IF NOT EXISTS idx_ads_status
ON ads(status)
WHERE status = 'approved';

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_ads_category_id
ON ads(category_id);

-- Index for filtering by location
CREATE INDEX IF NOT EXISTS idx_ads_location_id
ON ads(location_id);

-- Index for price range queries
CREATE INDEX IF NOT EXISTS idx_ads_price
ON ads(price);

-- Index for sorting by created date (most common sort)
CREATE INDEX IF NOT EXISTS idx_ads_created_at
ON ads(created_at DESC);

-- Index for sorting by view count (popular ads)
CREATE INDEX IF NOT EXISTS idx_ads_view_count
ON ads(view_count DESC);

-- Index for featured ads
CREATE INDEX IF NOT EXISTS idx_ads_is_featured
ON ads(is_featured)
WHERE is_featured = true;

-- Index for user's ads lookup
CREATE INDEX IF NOT EXISTS idx_ads_user_id
ON ads(user_id);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_ads_status_category_location
ON ads(status, category_id, location_id);

-- Composite index for status + created_at (for recent approved ads)
CREATE INDEX IF NOT EXISTS idx_ads_status_created
ON ads(status, created_at DESC);

-- Index for geospatial queries (latitude/longitude)
CREATE INDEX IF NOT EXISTS idx_ads_coordinates
ON ads(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Full-text search index for title and description
CREATE INDEX IF NOT EXISTS idx_ads_fulltext_search
ON ads USING gin(to_tsvector('english', title || ' ' || description));

-- =====================================================
-- 2. USERS TABLE INDEXES
-- =====================================================

-- Unique index for email (ensure uniqueness and fast lookup)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
ON users(LOWER(email));

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_users_is_active
ON users(is_active)
WHERE is_active = true;

-- Index for user role
CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

-- Index for location lookup
CREATE INDEX IF NOT EXISTS idx_users_location_id
ON users(location_id);

-- =====================================================
-- 3. AD_IMAGES TABLE INDEXES
-- =====================================================

-- Index for finding ad images
CREATE INDEX IF NOT EXISTS idx_ad_images_ad_id
ON ad_images(ad_id);

-- Index for finding primary image
CREATE INDEX IF NOT EXISTS idx_ad_images_primary
ON ad_images(ad_id, is_primary)
WHERE is_primary = true;

-- Index for created date
CREATE INDEX IF NOT EXISTS idx_ad_images_created_at
ON ad_images(created_at);

-- =====================================================
-- 4. CATEGORIES TABLE INDEXES
-- =====================================================

-- Unique index for category slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug
ON categories(slug);

-- Index for category name lookup
CREATE INDEX IF NOT EXISTS idx_categories_name
ON categories(name);

-- =====================================================
-- 5. LOCATIONS TABLE INDEXES
-- =====================================================

-- Unique index for location slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_slug
ON locations(slug);

-- Index for location name lookup
CREATE INDEX IF NOT EXISTS idx_locations_name
ON locations(name);

-- Index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_locations_coordinates
ON locations(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- =====================================================
-- 6. CONTACT_MESSAGES TABLE INDEXES
-- =====================================================

-- Index for finding messages by ad
CREATE INDEX IF NOT EXISTS idx_contact_messages_ad_id
ON contact_messages(ad_id);

-- Index for buyer's sent messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_buyer_id
ON contact_messages(buyer_id);

-- Index for seller's received messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_seller_id
ON contact_messages(seller_id);

-- Index for reply lookups
CREATE INDEX IF NOT EXISTS idx_contact_messages_reply_to
ON contact_messages(reply_to_message_id)
WHERE reply_to_message_id IS NOT NULL;

-- Index for recent messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
ON contact_messages(created_at DESC);

-- =====================================================
-- 7. AD_REPORTS TABLE INDEXES
-- =====================================================

-- Index for finding reports by ad
CREATE INDEX IF NOT EXISTS idx_ad_reports_ad_id
ON ad_reports(ad_id);

-- Index for finding reports by user
CREATE INDEX IF NOT EXISTS idx_ad_reports_reporter_id
ON ad_reports(reporter_id);

-- Index for pending reports
CREATE INDEX IF NOT EXISTS idx_ad_reports_status
ON ad_reports(status)
WHERE status = 'pending';

-- Index for recent reports
CREATE INDEX IF NOT EXISTS idx_ad_reports_created_at
ON ad_reports(created_at DESC);

-- Composite index to prevent duplicate reports
CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_reports_unique
ON ad_reports(ad_id, reporter_id);

-- =====================================================
-- ANALYZE TABLES FOR QUERY OPTIMIZATION
-- =====================================================

ANALYZE ads;
ANALYZE users;
ANALYZE ad_images;
ANALYZE categories;
ANALYZE locations;
ANALYZE contact_messages;
ANALYZE ad_reports;

-- Commit transaction
COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show all indexes on ads table
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'ads';

-- Show table sizes with indexes
-- SELECT
--     schemaname,
--     tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
--     pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Indexes improve SELECT performance but slightly slow INSERT/UPDATE
-- 2. Monitor index usage with: SELECT * FROM pg_stat_user_indexes;
-- 3. Remove unused indexes periodically
-- 4. Consider REINDEX if data changes significantly
-- 5. For production, schedule VACUUM ANALYZE regularly
-- =====================================================