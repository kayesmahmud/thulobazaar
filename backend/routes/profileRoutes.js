const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { catchAsync, NotFoundError } = require('../middleware/errorHandler');

// Helper function to convert slug to name
const slugToName = (slug) => {
  if (!slug) return '';
  return slug.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// GET /api/profiles/seller/:sellerSlug - Fetch individual seller profile and their ads
router.get('/seller/:sellerSlug', catchAsync(async (req, res) => {
  const { sellerSlug } = req.params;
  const sellerName = slugToName(sellerSlug);

  // Fetch seller (user) details
  const sellerResult = await pool.query(
    `SELECT
       id, full_name, email, phone, avatar, cover_photo, created_at,
       is_verified, account_type
     FROM users
     WHERE LOWER(full_name) = LOWER($1) AND account_type = 'individual'`,
    [sellerName]
  );

  if (sellerResult.rows.length === 0) {
    throw new NotFoundError('Individual seller not found');
  }

  const seller = sellerResult.rows[0];

  // Fetch active ads by this seller
  const adsResult = await pool.query(
    `SELECT
       a.id, a.title, a.price, a.location_name, a.category_name, a.primary_image, a.created_at,
       a.is_featured, a.condition, a.view_count,
       u.full_name as seller_name, u.avatar as seller_avatar, u.account_type as seller_account_type,
       u.is_verified as seller_verified, u.business_verification_status as seller_business_verified
     FROM ads a
     JOIN users u ON a.user_id = u.id
     WHERE a.user_id = $1 AND a.status = 'approved' AND a.deleted_at IS NULL
     ORDER BY a.created_at DESC`,
    [seller.id]
  );

  res.json({
    success: true,
    data: {
      profile: seller,
      ads: adsResult.rows
    }
  });
}));

// GET /api/profiles/shop/:shopSlug - Fetch business shop profile and their ads
router.get('/shop/:shopSlug', catchAsync(async (req, res) => {
  const { shopSlug } = req.params;
  const businessName = slugToName(shopSlug);

  // Fetch business (user) details
  const shopResult = await pool.query(
    `SELECT
       id, full_name, email, phone, avatar, cover_photo, created_at,
       business_name, business_category, business_description, business_website,
       business_phone as business_contact_phone, business_address, business_verification_status
     FROM users
     WHERE LOWER(business_name) = LOWER($1) AND account_type = 'business'`,
    [businessName]
  );

  if (shopResult.rows.length === 0) {
    throw new NotFoundError('Business shop not found');
  }

  const shop = shopResult.rows[0];

  // Fetch active ads by this business with location hierarchy
  const adsResult = await pool.query(
    `WITH ad_locations AS (
       SELECT DISTINCT a.location_id
       FROM ads a
       WHERE a.user_id = $1 AND a.status = 'approved' AND a.deleted_at IS NULL
     ),
     location_hierarchy AS (
       SELECT
         id, name, type, parent_id, 0 as level, id as base_location_id
       FROM locations
       WHERE id IN (SELECT location_id FROM ad_locations)

       UNION ALL

       SELECT
         l.id, l.name, l.type, l.parent_id, lh.level + 1, lh.base_location_id
       FROM locations l
       INNER JOIN location_hierarchy lh ON l.id = lh.parent_id
     )
     SELECT
       a.id, a.title, a.price, a.category_name, a.primary_image, a.created_at,
       a.is_featured, a.condition, a.view_count,
       l.name as location_name,
       (SELECT name FROM location_hierarchy WHERE base_location_id = a.location_id AND type = 'area' LIMIT 1) as area_name,
       (SELECT name FROM location_hierarchy WHERE base_location_id = a.location_id AND type = 'district' LIMIT 1) as district_name,
       u.full_name as seller_name, u.avatar as seller_avatar, u.account_type as seller_account_type,
       u.is_verified as seller_verified, u.business_verification_status as seller_business_verified
     FROM ads a
     JOIN users u ON a.user_id = u.id
     LEFT JOIN locations l ON a.location_id = l.id
     WHERE a.user_id = $1 AND a.status = 'approved' AND a.deleted_at IS NULL
     ORDER BY a.created_at DESC`,
    [shop.id]
  );

  res.json({
    success: true,
    data: {
      profile: shop,
      ads: adsResult.rows
    }
  });
}));

module.exports = router;