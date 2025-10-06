-- =====================================================
-- Shop & Seller Profile Pages Migration
-- Thulobazaar Marketplace
-- Add slug fields and individual verification
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ADD SLUG FIELDS FOR PROFILE URLs
-- =====================================================

-- Shop slug for business accounts (Golden badge)
-- URL: /shop/my-motor-shop
ALTER TABLE users
ADD COLUMN IF NOT EXISTS shop_slug VARCHAR(255) UNIQUE;

-- Seller slug for individual accounts (Blue badge)
-- URL: /seller/john-doe
ALTER TABLE users
ADD COLUMN IF NOT EXISTS seller_slug VARCHAR(255) UNIQUE;

COMMENT ON COLUMN users.shop_slug IS 'URL slug for business shop profile page';
COMMENT ON COLUMN users.seller_slug IS 'URL slug for individual seller profile page';

-- =====================================================
-- 2. ADD INDIVIDUAL VERIFICATION (Blue Badge)
-- =====================================================

-- Individual user verification (for future use)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS individual_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS individual_verified_at TIMESTAMP;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS individual_verified_by INTEGER REFERENCES users(id);

COMMENT ON COLUMN users.individual_verified IS 'Individual seller verification status (blue badge)';

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for shop slug lookups
CREATE INDEX IF NOT EXISTS idx_users_shop_slug
ON users(shop_slug)
WHERE shop_slug IS NOT NULL;

-- Index for seller slug lookups
CREATE INDEX IF NOT EXISTS idx_users_seller_slug
ON users(seller_slug)
WHERE seller_slug IS NOT NULL;

-- Index for verified individuals
CREATE INDEX IF NOT EXISTS idx_users_individual_verified
ON users(individual_verified)
WHERE individual_verified = TRUE;

-- =====================================================
-- 4. CREATE SLUG GENERATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_unique_slug(base_text TEXT, slug_type TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
    slug_exists BOOLEAN;
BEGIN
    -- Convert to lowercase and replace spaces/special chars with hyphens
    base_slug := lower(trim(regexp_replace(base_text, '[^a-zA-Z0-9\s-]', '', 'g')));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);

    -- Start with base slug
    final_slug := base_slug;

    -- Check if slug exists and add counter if needed
    LOOP
        IF slug_type = 'shop' THEN
            SELECT EXISTS(SELECT 1 FROM users WHERE shop_slug = final_slug) INTO slug_exists;
        ELSE
            SELECT EXISTS(SELECT 1 FROM users WHERE seller_slug = final_slug) INTO slug_exists;
        END IF;

        EXIT WHEN NOT slug_exists;

        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_unique_slug(TEXT, TEXT) IS 'Generate unique URL-friendly slug for shop or seller profiles';

-- =====================================================
-- 5. BACKFILL SLUGS FOR EXISTING USERS
-- =====================================================

-- Generate shop slugs for business accounts
UPDATE users
SET shop_slug = generate_unique_slug(
    COALESCE(business_name, full_name, 'shop-' || id::TEXT),
    'shop'
)
WHERE account_type = 'business'
  AND shop_slug IS NULL;

-- Generate seller slugs for individual accounts
UPDATE users
SET seller_slug = generate_unique_slug(
    COALESCE(full_name, 'seller-' || id::TEXT),
    'seller'
)
WHERE account_type = 'individual'
  AND seller_slug IS NULL;

-- =====================================================
-- 6. CREATE TRIGGER FOR AUTO-GENERATING SLUGS
-- =====================================================

CREATE OR REPLACE FUNCTION auto_generate_user_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate shop slug for business accounts
    IF NEW.account_type = 'business' AND NEW.shop_slug IS NULL THEN
        NEW.shop_slug := generate_unique_slug(
            COALESCE(NEW.business_name, NEW.full_name, 'shop-' || NEW.id::TEXT),
            'shop'
        );
    END IF;

    -- Generate seller slug for individual accounts
    IF NEW.account_type = 'individual' AND NEW.seller_slug IS NULL THEN
        NEW.seller_slug := generate_unique_slug(
            COALESCE(NEW.full_name, 'seller-' || NEW.id::TEXT),
            'seller'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_slug ON users;

CREATE TRIGGER trigger_auto_generate_slug
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_user_slug();

COMMENT ON FUNCTION auto_generate_user_slug() IS 'Automatically generate slug when user is created or updated';

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check business shop slugs
-- SELECT id, full_name, business_name, account_type, shop_slug FROM users WHERE account_type = 'business';

-- Check individual seller slugs
-- SELECT id, full_name, account_type, seller_slug FROM users WHERE account_type = 'individual';

-- Test slug generation
-- SELECT generate_unique_slug('My Motor Shop', 'shop');
-- SELECT generate_unique_slug('John Doe', 'seller');

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Shop URLs: /shop/{shop_slug} for business accounts (golden badge)
-- 2. Seller URLs: /seller/{seller_slug} for individual accounts (blue badge)
-- 3. Slugs are auto-generated from business_name or full_name
-- 4. Duplicate slugs get numbered suffix: "my-shop", "my-shop-2", etc.
-- 5. Individual verification (blue badge) will be implemented later
-- =====================================================
