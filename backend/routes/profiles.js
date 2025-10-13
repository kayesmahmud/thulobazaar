const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// =====================================================
// GET SHOP PROFILE (Business Account with Golden Badge)
// Route: GET /api/shop/:slug
// =====================================================
router.get('/shop/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Get shop/business details
    const shopQuery = `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.avatar,
        u.cover_photo,
        u.bio,
        u.account_type,
        u.shop_slug,
        u.business_name,
        u.business_category,
        u.business_description,
        u.business_website,
        u.business_phone,
        u.business_address,
        u.business_verification_status,
        u.business_verified_at,
        u.latitude,
        u.longitude,
        u.formatted_address,
        u.google_maps_link,
        u.created_at,
        l.name as location_name,
        l.slug as location_slug
      FROM users u
      LEFT JOIN locations l ON u.location_id = l.id
      WHERE u.shop_slug = $1
        AND u.account_type = 'business'
    `;

    const shopResult = await pool.query(shopQuery, [slug]);

    if (shopResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const shop = shopResult.rows[0];

    // Get all active ads from this shop with location hierarchy
    const adsQuery = `
      WITH RECURSIVE location_hierarchy AS (
        SELECT
          id, name, type, parent_id, 0 as level, id as base_location_id
        FROM locations
        WHERE id IN (
          SELECT DISTINCT location_id FROM ads
          WHERE user_id = $1 AND status = 'approved' AND location_id IS NOT NULL
        )

        UNION ALL

        SELECT
          l.id, l.name, l.type, l.parent_id, lh.level + 1, lh.base_location_id
        FROM locations l
        INNER JOIN location_hierarchy lh ON l.id = lh.parent_id
      )
      SELECT
        a.id,
        a.title,
        a.price,
        a.condition,
        a.description,
        a.created_at,
        a.view_count,
        a.is_featured,
        a.is_bumped,
        a.is_sticky,
        a.is_urgent,
        c.name as category_name,
        l.name as location_name,
        (SELECT name FROM location_hierarchy WHERE base_location_id = a.location_id AND type = 'area' LIMIT 1) as area_name,
        (SELECT name FROM location_hierarchy WHERE base_location_id = a.location_id AND type = 'district' LIMIT 1) as district_name,
        img.filename as primary_image
      FROM ads a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN ad_images img ON a.id = img.ad_id AND img.is_primary = true
      WHERE a.user_id = $1
        AND a.status = 'approved'
      ORDER BY
        a.is_sticky DESC,
        a.is_bumped DESC,
        a.created_at DESC
    `;

    const adsResult = await pool.query(adsQuery, [shop.id]);

    // Get ad statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_ads,
        COUNT(*) FILTER (WHERE is_featured = true) as featured_ads,
        SUM(view_count) as total_views
      FROM ads
      WHERE user_id = $1 AND status = 'approved'
    `;

    const statsResult = await pool.query(statsQuery, [shop.id]);
    const stats = statsResult.rows[0];

    res.json({
      success: true,
      data: {
        shop,
        ads: adsResult.rows,
        stats: {
          total_ads: parseInt(stats.total_ads) || 0,
          featured_ads: parseInt(stats.featured_ads) || 0,
          total_views: parseInt(stats.total_views) || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching shop profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shop profile'
    });
  }
});

// =====================================================
// GET SELLER PROFILE (Individual Account with Blue Badge)
// Route: GET /api/seller/:slug
// =====================================================
router.get('/seller/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Get seller details
    const sellerQuery = `
      SELECT
        u.id,
        u.full_name,
        u.verified_seller_name,
        u.email,
        u.phone,
        u.avatar,
        u.cover_photo,
        u.bio,
        u.account_type,
        u.seller_slug,
        u.individual_verified,
        u.individual_verified_at,
        u.business_verification_status,
        u.business_website,
        u.created_at,
        l.name as location_name,
        l.slug as location_slug
      FROM users u
      LEFT JOIN locations l ON u.location_id = l.id
      WHERE u.seller_slug = $1
    `;

    const sellerResult = await pool.query(sellerQuery, [slug]);

    if (sellerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const seller = sellerResult.rows[0];

    // Get all active ads from this seller with location hierarchy
    const adsQuery = `
      WITH RECURSIVE location_hierarchy AS (
        SELECT
          id, name, type, parent_id, 0 as level, id as base_location_id
        FROM locations
        WHERE id IN (
          SELECT DISTINCT location_id FROM ads
          WHERE user_id = $1 AND status = 'approved' AND location_id IS NOT NULL
        )

        UNION ALL

        SELECT
          l.id, l.name, l.type, l.parent_id, lh.level + 1, lh.base_location_id
        FROM locations l
        INNER JOIN location_hierarchy lh ON l.id = lh.parent_id
      )
      SELECT
        a.id,
        a.title,
        a.price,
        a.condition,
        a.description,
        a.created_at,
        a.view_count,
        a.is_featured,
        a.is_bumped,
        a.is_sticky,
        a.is_urgent,
        c.name as category_name,
        l.name as location_name,
        (SELECT name FROM location_hierarchy WHERE base_location_id = a.location_id AND type = 'area' LIMIT 1) as area_name,
        (SELECT name FROM location_hierarchy WHERE base_location_id = a.location_id AND type = 'district' LIMIT 1) as district_name,
        img.filename as primary_image
      FROM ads a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN ad_images img ON a.id = img.ad_id AND img.is_primary = true
      WHERE a.user_id = $1
        AND a.status = 'approved'
      ORDER BY
        a.is_sticky DESC,
        a.is_bumped DESC,
        a.created_at DESC
    `;

    const adsResult = await pool.query(adsQuery, [seller.id]);

    // Get ad statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_ads,
        COUNT(*) FILTER (WHERE is_featured = true) as featured_ads,
        SUM(view_count) as total_views
      FROM ads
      WHERE user_id = $1 AND status = 'approved'
    `;

    const statsResult = await pool.query(statsQuery, [seller.id]);
    const stats = statsResult.rows[0];

    res.json({
      success: true,
      data: {
        seller,
        ads: adsResult.rows,
        stats: {
          total_ads: parseInt(stats.total_ads) || 0,
          featured_ads: parseInt(stats.featured_ads) || 0,
          total_views: parseInt(stats.total_views) || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching seller profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching seller profile'
    });
  }
});

// =====================================================
// UPDATE SELLER ABOUT (Bio)
// Route: PUT /api/seller/:slug/about
// =====================================================
router.put('/seller/:slug/about', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const { bio } = req.body;
    const userId = req.user.userId || req.user.id;

    // Validate bio length (max 500 characters)
    if (bio && bio.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Bio must be 500 characters or less'
      });
    }

    // Check if the user owns this seller profile
    const checkQuery = 'SELECT id FROM users WHERE seller_slug = $1 AND id = $2';
    const checkResult = await pool.query(checkQuery, [slug, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this profile'
      });
    }

    // Update the bio
    const updateQuery = 'UPDATE users SET bio = $1 WHERE seller_slug = $2 RETURNING bio';
    const result = await pool.query(updateQuery, [bio, slug]);

    res.json({
      success: true,
      message: 'Bio updated successfully',
      data: { bio: result.rows[0].bio }
    });

  } catch (error) {
    console.error('Error updating seller bio:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating bio'
    });
  }
});

// =====================================================
// UPDATE SELLER CONTACT
// Route: PUT /api/seller/:slug/contact
// =====================================================
router.put('/seller/:slug/contact', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const { phone, business_website } = req.body;
    const userId = req.user.userId || req.user.id;

    // Validate inputs
    if (business_website && business_website.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Website URL cannot exceed 200 characters'
      });
    }

    // Check if the user owns this seller profile
    const checkQuery = 'SELECT id FROM users WHERE seller_slug = $1 AND id = $2';
    const checkResult = await pool.query(checkQuery, [slug, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this profile'
      });
    }

    // Update the phone and website
    const updateQuery = 'UPDATE users SET phone = $1, business_website = $2 WHERE seller_slug = $3 RETURNING phone, business_website';
    const result = await pool.query(updateQuery, [phone, business_website, slug]);

    res.json({
      success: true,
      message: 'Contact information updated successfully',
      data: { phone: result.rows[0].phone, business_website: result.rows[0].business_website }
    });

  } catch (error) {
    console.error('Error updating seller contact:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating contact information'
    });
  }
});

// =====================================================
// UPDATE SHOP ABOUT (Business Description)
// Route: PUT /api/shop/:slug/about
// =====================================================
router.put('/shop/:slug/about', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const { business_description } = req.body;

    console.log('📝 Update about request:', { slug, user: req.user });

    const userId = req.user.userId || req.user.id;

    console.log('📝 Using userId:', userId);

    // Validate description length (max 500 characters)
    if (business_description && business_description.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 500 characters'
      });
    }

    // Check if user owns this shop
    const ownerCheck = await pool.query(
      'SELECT id FROM users WHERE shop_slug = $1 AND id = $2 AND account_type = $3',
      [slug, userId, 'business']
    );

    console.log('📝 Owner check result:', ownerCheck.rows.length);

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this shop'
      });
    }

    // Update business description
    const updateResult = await pool.query(
      'UPDATE users SET business_description = $1 WHERE shop_slug = $2 AND id = $3',
      [business_description, slug, userId]
    );

    console.log('✅ About section updated successfully');

    res.json({
      success: true,
      message: 'About section updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating shop about:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating about section'
    });
  }
});

// =====================================================
// UPDATE SHOP CONTACT INFORMATION
// Route: PUT /api/shop/:slug/contact
// =====================================================
router.put('/shop/:slug/contact', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const { business_phone, phone, business_website, google_maps_link } = req.body;

    console.log('📞 Update contact request:', { slug, user: req.user });

    const userId = req.user.userId || req.user.id;

    console.log('📞 Using userId:', userId);

    // Validate inputs
    if (business_website && business_website.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Website URL cannot exceed 200 characters'
      });
    }

    // Check if user owns this shop
    const ownerCheck = await pool.query(
      'SELECT id FROM users WHERE shop_slug = $1 AND id = $2 AND account_type = $3',
      [slug, userId, 'business']
    );

    console.log('📞 Owner check result:', ownerCheck.rows.length);

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this shop'
      });
    }

    // Update contact information
    await pool.query(
      'UPDATE users SET business_phone = $1, phone = $2, business_website = $3, google_maps_link = $4 WHERE shop_slug = $5 AND id = $6',
      [business_phone, phone, business_website, google_maps_link, slug, userId]
    );

    console.log('✅ Contact information updated successfully');

    res.json({
      success: true,
      message: 'Contact information updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating shop contact:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating contact information'
    });
  }
});

// =====================================================
// UPDATE SHOP LOCATION (Latitude, Longitude, Address)
// Route: PUT /api/shop/:slug/location
// =====================================================
router.put('/shop/:slug/location', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const { latitude, longitude, formatted_address } = req.body;

    console.log('📍 Update location request:', { slug, latitude, longitude, user: req.user });

    const userId = req.user.userId || req.user.id;

    // Validate inputs
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180'
      });
    }

    // Check if user owns this shop
    const ownerCheck = await pool.query(
      'SELECT id FROM users WHERE shop_slug = $1 AND id = $2 AND account_type = $3',
      [slug, userId, 'business']
    );

    console.log('📍 Owner check result:', ownerCheck.rows.length);

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this shop'
      });
    }

    // Update location information
    await pool.query(
      'UPDATE users SET latitude = $1, longitude = $2, formatted_address = $3 WHERE shop_slug = $4 AND id = $5',
      [latitude, longitude, formatted_address, slug, userId]
    );

    console.log('✅ Location updated successfully');

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        latitude,
        longitude,
        formatted_address
      }
    });

  } catch (error) {
    console.error('❌ Error updating shop location:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating location'
    });
  }
});

module.exports = router;
