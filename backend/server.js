const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const contentFilter = require('./utils/contentFilter');
const { rateLimiters } = require('./utils/rateLimiter');
const duplicateDetector = require('./utils/duplicateDetector');
const { calculateDistance, formatDistance, generateStaticMapUrl } = require('./utils/locationUtils');
const { MobileLocationService } = require('./utils/mobileLocationUtils');
const profileRoutes = require('./routes/profileRoutes');
const { upload, validateFileType } = require('./middleware/secureFileUpload');
const { SECURITY, FILE_LIMITS, AD_STATUS, PAGINATION, LOCATION } = require('./config/constants');
const { initializeSocketIO } = require('./socket/socketHandler');
require('dotenv').config();

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO with CORS - 2025 Best Practices
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3333', 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
    methods: ['GET', 'POST']
  },
  // Connection timeout settings
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Security middleware - Helmet for HTTP headers (2025 best practice)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:3000", "http://localhost:5000", "http://localhost:5173"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded from different origins (localhost:3000 -> localhost:5000)
}));
const PORT = process.env.PORT || 5000;

// Security: JWT_SECRET must be set in environment variables (2025 best practice)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('🚨 FATAL: JWT_SECRET environment variable is not set!');
  console.error('Please set JWT_SECRET in your .env file before starting the server.');
  process.exit(1);
}

// Database connection - Using environment variables (2025 best practice)
const pool = new Pool({
  user: process.env.DB_USER || 'elw',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'thulobazaar',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// Initialize mobile location service
global.mobileLocationService = new MobileLocationService(pool);

// Make pool available globally
global.pool = pool;

// File upload is now handled by secure middleware in ./middleware/secureFileUpload.js

// Middleware
app.use(cors({
  origin: ['http://localhost:3333', 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json());

// Serve uploaded files statically with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  next();
}, express.static('uploads'));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔑 Auth middleware - Token present:', !!token);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    console.log('✅ Token verified - User:', user);
    req.user = user;
    next();
  });
};

// Admin authentication middleware - REMOVED (now in routes/admin.js)

// User registration
app.post('/api/auth/register', rateLimiters.auth, async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and full name are required'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = SECURITY.BCRYPT_SALT_ROUNDS;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate shop_slug from full name (all users get a shop page)
    const generateSlug = (name) => {
      return name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    };

    let shopSlug = generateSlug(fullName);

    // Check if slug already exists and make it unique
    const existingSlug = await pool.query('SELECT id FROM users WHERE shop_slug = $1 OR seller_slug = $1', [shopSlug]);
    if (existingSlug.rows.length > 0) {
      shopSlug = `${shopSlug}-${Date.now()}`;
    }

    // Insert user with shop_slug (all users use /shop/:slug route)
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, shop_slug, seller_slug)
       VALUES ($1, $2, $3, $4, $5, $5)
       RETURNING id, email, full_name, phone, created_at, account_type, shop_slug, seller_slug, business_verification_status, individual_verified`,
      [email, passwordHash, fullName, phone, shopSlug]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ User registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          createdAt: user.created_at,
          account_type: user.account_type,
          shop_slug: user.shop_slug,
          seller_slug: user.seller_slug,
          business_verification_status: user.business_verification_status,
          individual_verified: user.individual_verified
        },
        token
      }
    });
  } catch (error) {
    console.error('❌ Error registering user:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
});

// User login
app.post('/api/auth/login', rateLimiters.auth, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, phone, location_id, is_active, role, account_type, shop_slug, seller_slug, business_verification_status, individual_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ User logged in: ${user.email} (userId: ${user.id})`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          locationId: user.location_id,
          role: user.role,
          account_type: user.account_type,
          shop_slug: user.shop_slug,
          seller_slug: user.seller_slug,
          business_verification_status: user.business_verification_status,
          individual_verified: user.individual_verified
        },
        token
      }
    });
  } catch (error) {
    console.error('❌ Error logging in user:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in user',
      error: error.message
    });
  }
});

// Token refresh endpoint for messaging (no password required, uses existing NextAuth session)
app.post('/api/auth/refresh-token', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const result = await pool.query(
      'SELECT id, email, role FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Generate fresh JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`🔄 Token refreshed for: ${user.email} (userId: ${user.id})`);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token
      }
    });
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: error.message
    });
  }
});

// The routes for getting and updating user profiles have been moved to /routes/profile.js
// and are mounted via app.use('/api/profile', ...);

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Thulobazaar API is working!',
    timestamp: new Date().toISOString()
  });
});

// Use the proper routes/ads.js with AdController for /api/ads endpoint
app.use('/api/ads', require('./routes/ads'));

// Get nearby ads endpoint
app.get('/api/ads/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 25, limit = 20, category, minPrice, maxPrice } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    console.log('📍 Nearby ads request:', { lat, lng, radius, limit, category });

    let queryConditions = ['a.status = $1'];
    let queryParams = ['approved'];
    let paramCount = 1;

    // Add category filter
    if (category && category !== 'all') {
      paramCount++;
      if (!isNaN(parseInt(category))) {
        queryConditions.push(`a.category_id = $${paramCount}`);
        queryParams.push(parseInt(category));
      } else {
        queryConditions.push(`(c.name ILIKE $${paramCount} OR c.slug ILIKE $${paramCount})`);
        queryParams.push(category);
      }
    }

    // Add price filters
    if (minPrice && !isNaN(minPrice)) {
      paramCount++;
      queryConditions.push(`a.price >= $${paramCount}`);
      queryParams.push(parseFloat(minPrice));
    }

    if (maxPrice && !isNaN(maxPrice)) {
      paramCount++;
      queryConditions.push(`a.price <= $${paramCount}`);
      queryParams.push(parseFloat(maxPrice));
    }

    // Add lat, lng, radius, and limit as parameterized values (SQL injection protection)
    const latParam = paramCount + 1;
    const lngParam = paramCount + 2;
    const radiusParam = paramCount + 3;
    const limitParam = paramCount + 4;

    queryParams.push(parseFloat(lat), parseFloat(lng), parseFloat(radius), parseInt(limit));

    const query = `
      SELECT *
      FROM (
        SELECT
          a.id, a.title, a.description, a.price, a.condition, a.view_count,
          a.seller_name, a.seller_phone, a.created_at, a.is_featured,
          a.latitude, a.longitude,
          c.name as category_name, c.icon as category_icon,
          l.name as location_name, l.latitude as location_latitude, l.longitude as location_longitude,
          u.business_verification_status, u.individual_verified,
          (SELECT filename FROM ad_images WHERE ad_id = a.id AND is_primary = true LIMIT 1) as primary_image,
          (6371 * acos(
            cos(radians($${latParam})) *
            cos(radians(COALESCE(a.latitude, l.latitude))) *
            cos(radians(COALESCE(a.longitude, l.longitude)) - radians($${lngParam})) +
            sin(radians($${latParam})) *
            sin(radians(COALESCE(a.latitude, l.latitude)))
          )) AS distance
        FROM ads a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN locations l ON a.location_id = l.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE ${queryConditions.join(' AND ')}
          AND ((a.latitude IS NOT NULL AND a.longitude IS NOT NULL)
           OR (l.latitude IS NOT NULL AND l.longitude IS NOT NULL))
      ) ads_with_distance
      WHERE distance <= $${radiusParam}
      ORDER BY distance ASC, is_featured DESC, created_at DESC
      LIMIT $${limitParam}
    `;

    const result = await pool.query(query, queryParams);

    // Add formatted distance to each result
    const adsWithDistance = result.rows.map(ad => ({
      ...ad,
      formatted_distance: formatDistance(ad.distance)
    }));

    console.log(`📍 Found ${result.rows.length} nearby ads within ${radius}km`);

    res.json({
      success: true,
      data: adsWithDistance,
      searchParams: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius: parseFloat(radius)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching nearby ads:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby ads',
      error: error.message
    });
  }
});

// Get single ad
app.get('/api/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { generateSeoSlug } = require('./utils/slugUtils');

    const query = `
      SELECT
        a.id, a.title, a.description, a.price, a.condition, a.view_count,
        a.seller_name, a.seller_phone, a.created_at, a.is_featured, a.user_id,
        a.category_id, a.location_id,
        a.is_urgent, a.urgent_until, a.is_sticky, a.sticky_until,
        c.name as category_name, c.icon as category_icon, c.parent_id as category_parent_id,
        parent_c.name as parent_category_name, parent_c.id as parent_category_id,
        -- Location hierarchy (4 levels: Area -> Ward -> Municipality -> District -> Province)
        area.name as area_name,
        ward.name as ward_name,
        m.name as municipality_name,
        m.id as municipality_id,
        d.name as district_name,
        d.id as district_id,
        p.name as province_name,
        p.id as province_id,
        -- User info
        u.business_verification_status, u.business_name, u.avatar as seller_avatar,
        u.account_type, u.shop_slug, u.seller_slug, u.individual_verified
      FROM ads a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN categories parent_c ON c.parent_id = parent_c.id
      -- Join location hierarchy (area -> ward -> municipality -> district -> province)
      LEFT JOIN locations area ON a.location_id = area.id
      LEFT JOIN locations ward ON area.parent_id = ward.id
      LEFT JOIN locations m ON ward.parent_id = m.id
      LEFT JOIN locations d ON m.parent_id = d.id
      LEFT JOIN locations p ON d.parent_id = p.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = $1 AND a.status = 'approved'
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Increment view count
    await pool.query('UPDATE ads SET view_count = view_count + 1 WHERE id = $1', [id]);

    // Get images for this ad
    const imagesQuery = 'SELECT filename, original_name, is_primary FROM ad_images WHERE ad_id = $1 ORDER BY is_primary DESC, created_at ASC';
    const imagesResult = await pool.query(imagesQuery, [id]);

    const adRow = result.rows[0];

    // Generate SEO-friendly slug with location
    const seoSlug = generateSeoSlug(
      adRow.id,
      adRow.title,
      adRow.area_name,
      adRow.district_name
    );

    const adData = {
      ...adRow,
      images: imagesResult.rows,
      seo_slug: seoSlug
    };

    console.log(`✅ Found ad: ${adData.title} with ${imagesResult.rows.length} images`);

    res.json({
      success: true,
      data: adData
    });
  } catch (error) {
    console.error('❌ Error fetching ad:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ad',
      error: error.message
    });
  }
});

// Get categories
app.get('/api/categories', async (req, res) => {
  try {
    const { includeSubcategories } = req.query;

    console.log(`🔍 [server.js] GET /api/categories - includeSubcategories:`, includeSubcategories);

    let result;
    if (includeSubcategories === 'true') {
      // Return FLAT array of ALL categories (both parents and children)
      // This allows frontend to filter by parent_id to get subcategories
      result = await pool.query(`
        SELECT * FROM categories
        ORDER BY
          CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END,
          parent_id NULLS FIRST,
          name ASC
      `);
    } else {
      // Fetch only top-level categories
      result = await pool.query('SELECT * FROM categories WHERE parent_id IS NULL ORDER BY id');
    }

    console.log(`✅ [server.js] Returning ${result.rows.length} categories${includeSubcategories === 'true' ? ' (flat array with all)' : ' (parents only)'}`);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// Get locations (supports hierarchical filtering with parent_id)
// DEPRECATED: This route has been moved to routes/locationRoutes.js
// Commented out to avoid conflicts with the new location routes
/*
app.get('/api/locations', async (req, res) => {
  try {
    const { parent_id } = req.query;

    let query;
    let params = [];

    if (parent_id !== undefined) {
      // Fetch children of specific parent (or provinces if parent_id is null/empty)
      if (parent_id === '' || parent_id === 'null') {
        query = 'SELECT * FROM locations WHERE parent_id IS NULL ORDER BY name';
      } else {
        query = 'SELECT * FROM locations WHERE parent_id = $1 ORDER BY name';
        params = [parseInt(parent_id)];
      }
    } else {
      // Fetch all locations (backward compatibility)
      query = 'SELECT * FROM locations ORDER BY name';
    }

    const result = await pool.query(query, params);
    console.log(`✅ Found ${result.rows.length} locations${parent_id !== undefined ? ` (parent_id: ${parent_id || 'NULL'})` : ''}`);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching locations',
      error: error.message
    });
  }
});
*/

// OLD Location search endpoint - Replaced by /api/locations/search route in locationRoutes.js
// This searched locations table only - new endpoint searches areas table with full hierarchy
// Commented out to use new areas-based search
/*
app.get('/api/locations/search', async (req, res) => {
  try {
    const { q, lat, lng, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    let query = `
      SELECT l.*,
        CASE
          WHEN $2::decimal IS NOT NULL AND $3::decimal IS NOT NULL THEN
            (6371 * acos(
              cos(radians($2)) *
              cos(radians(l.latitude)) *
              cos(radians(l.longitude) - radians($3)) +
              sin(radians($2)) *
              sin(radians(l.latitude))
            ))
          ELSE NULL
        END AS distance
      FROM locations l
      WHERE LOWER(l.name) LIKE LOWER($1)
        AND l.latitude IS NOT NULL
        AND l.longitude IS NOT NULL
    `;

    const params = [`%${q}%`];

    if (lat && lng) {
      params.push(parseFloat(lat), parseFloat(lng));
      query += ' ORDER BY distance ASC, l.name ASC';
    } else {
      params.push(null, null);
      query += ' ORDER BY l.name ASC';
    }

    query += ` LIMIT $4`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    console.log(`🔍 Location search for "${q}" found ${result.rows.length} results`);

    res.json({
      success: true,
      data: result.rows.map(location => ({
        id: location.id,
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        distance: location.distance ? `${location.distance.toFixed(1)}km` : null
      })),
      query: q,
      userLocation: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
    });
  } catch (error) {
    console.error('❌ Error in location search:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching locations',
      error: error.message
    });
  }
});
*/

// Reverse geocoding - get location info from coordinates
app.get('/api/locations/reverse', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    const query = `
      SELECT * FROM (
        SELECT l.*,
          (6371 * acos(
            cos(radians($1)) *
            cos(radians(l.latitude)) *
            cos(radians(l.longitude) - radians($2)) +
            sin(radians($1)) *
            sin(radians(l.latitude))
          )) AS distance
        FROM locations l
        WHERE l.latitude IS NOT NULL
          AND l.longitude IS NOT NULL
      ) locations_with_distance
      WHERE distance <= $3
      ORDER BY distance ASC
      LIMIT 5
    `;

    const result = await pool.query(query, [latitude, longitude, parseFloat(radius)]);

    console.log(`📍 Reverse geocoding for (${lat}, ${lng}) found ${result.rows.length} locations`);

    res.json({
      success: true,
      data: result.rows.map(location => ({
        id: location.id,
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        distance: `${location.distance.toFixed(1)}km`
      })),
      coordinates: { lat: latitude, lng: longitude },
      searchRadius: `${radius}km`
    });
  } catch (error) {
    console.error('❌ Error in reverse geocoding:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding nearby locations',
      error: error.message
    });
  }
});

// Get popular locations with ads count (for mobile quick access)
app.get('/api/locations/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const query = `
      SELECT l.*, COUNT(a.id) as ad_count
      FROM locations l
      LEFT JOIN ads a ON l.id = a.location_id
      WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
      GROUP BY l.id, l.name, l.latitude, l.longitude
      ORDER BY ad_count DESC, l.name ASC
      LIMIT $1
    `;

    const result = await pool.query(query, [parseInt(limit)]);

    console.log(`🏙️ Found ${result.rows.length} popular locations`);

    res.json({
      success: true,
      data: result.rows.map(location => ({
        id: location.id,
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        adCount: parseInt(location.ad_count)
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching popular locations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular locations',
      error: error.message
    });
  }
});

// Location suggestions based on user activity (future: user preferences)
app.get('/api/locations/suggestions', async (req, res) => {
  try {
    const { lat, lng, limit = 5 } = req.query;

    let query, params;

    if (lat && lng) {
      // Location-based suggestions
      query = `
        SELECT l.*, COUNT(a.id) as ad_count,
          (6371 * acos(
            cos(radians($1)) *
            cos(radians(l.latitude)) *
            cos(radians(l.longitude) - radians($2)) +
            sin(radians($1)) *
            sin(radians(l.latitude))
          )) AS distance
        FROM locations l
        LEFT JOIN ads a ON l.id = a.location_id
        WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
        GROUP BY l.id, l.name, l.latitude, l.longitude
        HAVING distance <= 100
        ORDER BY ad_count DESC, distance ASC
        LIMIT $3
      `;
      params = [parseFloat(lat), parseFloat(lng), parseInt(limit)];
    } else {
      // Popular locations fallback
      query = `
        SELECT l.*, COUNT(a.id) as ad_count
        FROM locations l
        LEFT JOIN ads a ON l.id = a.location_id
        WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
        GROUP BY l.id, l.name, l.latitude, l.longitude
        ORDER BY ad_count DESC, l.name ASC
        LIMIT $1
      `;
      params = [parseInt(limit)];
    }

    const result = await pool.query(query, params);

    console.log(`💡 Generated ${result.rows.length} location suggestions`);

    res.json({
      success: true,
      data: result.rows.map(location => ({
        id: location.id,
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        adCount: parseInt(location.ad_count),
        distance: location.distance ? `${location.distance.toFixed(1)}km` : null
      })),
      userLocation: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
    });
  } catch (error) {
    console.error('❌ Error generating location suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating location suggestions',
      error: error.message
    });
  }
});


// Get user's ads (protected route)
app.get('/api/user/ads', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = `
      SELECT
        a.id, a.title, a.description, a.price, a.condition, a.view_count,
        a.seller_name, a.seller_phone, a.created_at, a.is_featured, a.status,
        c.name as category_name, c.icon as category_icon,
        l.name as location_name
      FROM ads a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    console.log(`✅ Found ${result.rows.length} ads for user ${userId}`);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching user ads:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user ads',
      error: error.message
    });
  }
});

// Delete ad (protected route)
app.delete('/api/ads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // First check if the ad belongs to the user
    const checkQuery = 'SELECT user_id, title FROM ads WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    const ad = checkResult.rows[0];
    if (ad.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own ads'
      });
    }

    // Delete the ad
    await pool.query('DELETE FROM ads WHERE id = $1', [id]);

    console.log(`✅ Ad deleted: ${ad.title} (ID: ${id}) by user ${userId}`);

    res.json({
      success: true,
      message: 'Ad deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting ad:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting ad',
      error: error.message
    });
  }
});

// REMOVED: Conflicting route that prevented image uploads from working
// This route was intercepting PUT /api/ads/:id requests BEFORE they could reach
// the proper handler in /routes/ads.js (line 502) which has upload.array() middleware.
// The route below had NO image handling - it only updated text fields.
// Proper handler location: /routes/ads.js line 502 with full image support

/*
// Update ad (protected route) - DISABLED - USE /routes/ads.js INSTEAD
app.put('/api/ads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, condition, categoryId, locationId, sellerName, sellerPhone } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!title || !description || !price || !condition || !categoryId || !locationId || !sellerName || !sellerPhone) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate price
    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    // First check if the ad exists and belongs to the user
    const checkQuery = 'SELECT user_id, title FROM ads WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    const ad = checkResult.rows[0];
    if (ad.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own ads'
      });
    }

    // Update the ad
    const updateQuery = `
      UPDATE ads
      SET title = $1, description = $2, price = $3, condition = $4,
          category_id = $5, location_id = $6, seller_name = $7,
          seller_phone = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, title, price, updated_at
    `;

    const result = await pool.query(updateQuery, [
      title, description, price, condition, categoryId, locationId,
      sellerName, sellerPhone, id
    ]);

    const updatedAd = result.rows[0];

    console.log(`✅ Ad updated: ${updatedAd.title} (ID: ${id}) by user ${userId}`);

    res.json({
      success: true,
      message: 'Ad updated successfully',
      data: {
        id: updatedAd.id,
        title: updatedAd.title,
        price: updatedAd.price,
        updatedAt: updatedAd.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Error updating ad:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating ad',
      error: error.message
    });
  }
});
*/

// Admin API Routes - MOVED TO routes/admin.js

/*
// Get admin dashboard stats
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const queries = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM ads'),
      pool.query('SELECT COUNT(*) as pending FROM ads WHERE status = $1', ['pending']),
      pool.query('SELECT COUNT(*) as approved FROM ads WHERE status = $1', ['approved']),
      pool.query('SELECT COUNT(*) as total FROM users WHERE role = $1', ['user']),
      pool.query('SELECT COUNT(*) as today FROM ads WHERE DATE(created_at) = CURRENT_DATE'),
      pool.query('SELECT SUM(view_count) as total_views FROM ads'),
      pool.query(`
        SELECT c.name, COUNT(a.id) as count
        FROM categories c
        LEFT JOIN ads a ON c.id = a.category_id AND a.status = 'approved'
        GROUP BY c.id, c.name
        ORDER BY count DESC
        LIMIT 5
      `)
    ]);

    const stats = {
      totalAds: parseInt(queries[0].rows[0].total),
      pendingAds: parseInt(queries[1].rows[0].pending),
      approvedAds: parseInt(queries[2].rows[0].approved),
      totalUsers: parseInt(queries[3].rows[0].total),
      todayAds: parseInt(queries[4].rows[0].today),
      totalViews: parseInt(queries[5].rows[0].total_views || 0),
      topCategories: queries[6].rows
    };

    console.log('✅ Admin stats retrieved');

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin stats',
      error: error.message
    });
  }
});

// Get all ads for admin management
app.get('/api/admin/ads', authenticateAdmin, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let whereClause = '';
    let queryParams = [];

    if (status && status !== 'all') {
      whereClause = 'WHERE a.status = $1';
      queryParams.push(status);
    }

    const query = `
      SELECT
        a.id, a.title, a.description, a.price, a.condition, a.view_count,
        a.seller_name, a.seller_phone, a.created_at, a.is_featured, a.status,
        a.status_reason, a.reviewed_at,
        c.name as category_name, c.icon as category_icon,
        l.name as location_name,
        u.email as user_email,
        reviewer.full_name as reviewed_by_name,
        (SELECT filename FROM ad_images WHERE ad_id = a.id AND is_primary = true LIMIT 1) as primary_image
      FROM ads a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN users reviewer ON a.reviewed_by = reviewer.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, queryParams);

    console.log(`✅ Found ${result.rows.length} ads for admin`);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching admin ads:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ads',
      error: error.message
    });
  }
});

// Update ad status (approve/reject)
app.put('/api/admin/ads/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const adminId = req.admin.id;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved, rejected, or pending'
      });
    }

    const result = await pool.query(
      `UPDATE ads
       SET status = $1, status_reason = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING title, status`,
      [status, reason, adminId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    const ad = result.rows[0];

    console.log(`✅ Ad "${ad.title}" status updated to ${ad.status} by admin ${req.admin.email}`);

    res.json({
      success: true,
      message: `Ad ${status} successfully`,
      data: {
        id: parseInt(id),
        status: ad.status,
        title: ad.title
      }
    });
  } catch (error) {
    console.error('❌ Error updating ad status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating ad status',
      error: error.message
    });
  }
});

// Get all users for admin management
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const query = `
      SELECT
        u.id, u.email, u.full_name, u.phone, u.role, u.is_active, u.created_at,
        l.name as location_name,
        COUNT(a.id) as total_ads,
        COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as approved_ads
      FROM users u
      LEFT JOIN locations l ON u.location_id = l.id
      LEFT JOIN ads a ON u.id = a.user_id
      WHERE u.role = 'user'
      GROUP BY u.id, u.email, u.full_name, u.phone, u.role, u.is_active, u.created_at, l.name
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [parseInt(limit), parseInt(offset)]);

    console.log(`✅ Found ${result.rows.length} users for admin`);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});
*/

// Contact seller endpoint
app.post('/api/contact-seller', rateLimiters.messaging, authenticateToken, async (req, res) => {
  try {
    const { adId, name, email, phone, message } = req.body;
    const buyerId = req.user.userId;

    // Validate required fields
    if (!adId || !name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Ad ID, name, email, and message are required'
      });
    }

    // Content filtering for contact messages
    console.log('🔍 Validating contact message for inappropriate content...');
    const messageValidation = contentFilter.validateMessage({
      name,
      message
    });

    if (!messageValidation.isValid) {
      console.log('❌ Contact message validation failed:', messageValidation.errors);

      // Get the most severe error for the main message (prioritize by severity: high > medium > low)
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const primaryError = messageValidation.errors.sort((a, b) =>
        severityOrder[b.severity] - severityOrder[a.severity]
      )[0];

      return res.status(400).json({
        success: false,
        message: primaryError.message,
        error: {
          type: primaryError.type,
          title: primaryError.title,
          message: primaryError.message,
          suggestion: primaryError.suggestion,
          severity: primaryError.severity,
          field: primaryError.field
        }
      });
    }

    console.log('✅ Contact message passed validation checks');

    // Get ad and seller details
    const adQuery = `
      SELECT
        a.id, a.title, a.user_id as seller_id,
        u.full_name as seller_name, u.email as seller_email
      FROM ads a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = $1 AND a.status = 'approved'
    `;

    const adResult = await pool.query(adQuery, [adId]);

    if (adResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found or not approved'
      });
    }

    const ad = adResult.rows[0];

    // Store contact message in database
    const insertQuery = `
      INSERT INTO contact_messages (ad_id, buyer_id, seller_id, buyer_name, buyer_email, buyer_phone, message, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `;

    const result = await pool.query(insertQuery, [
      adId, buyerId, ad.seller_id, name, email, phone || null, message
    ]);

    console.log(`✅ Contact message saved with ID: ${result.rows[0].id}`);

    // TODO: Send email notification to seller
    // For now, we'll just log the email that would be sent
    console.log(`📧 Email would be sent to: ${ad.seller_email}`);
    console.log(`📧 From: ${name} (${email})`);
    console.log(`📧 Subject: Interest in your ad: ${ad.title}`);
    console.log(`📧 Message: ${message}`);

    res.json({
      success: true,
      message: 'Message sent successfully! The seller will be notified.',
      data: {
        contactId: result.rows[0].id
      }
    });

  } catch (error) {
    console.error('❌ Error sending contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
});

// Report ad endpoint
app.post('/api/report-ad', authenticateToken, async (req, res) => {
  try {
    const { adId, reason, details } = req.body;
    const reporterId = req.user.userId;

    // Validate required fields
    if (!adId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Ad ID and reason are required'
      });
    }

    // Check if ad exists
    const adQuery = 'SELECT id, title, user_id FROM ads WHERE id = $1';
    const adResult = await pool.query(adQuery, [adId]);

    if (adResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    const ad = adResult.rows[0];

    // Prevent users from reporting their own ads
    if (ad.user_id === reporterId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report your own ad'
      });
    }

    // Check if user has already reported this ad
    const existingReportQuery = 'SELECT id FROM ad_reports WHERE ad_id = $1 AND reporter_id = $2';
    const existingReport = await pool.query(existingReportQuery, [adId, reporterId]);

    if (existingReport.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this ad'
      });
    }

    // Store report in database
    const insertQuery = `
      INSERT INTO ad_reports (ad_id, reporter_id, reason, details, status, created_at)
      VALUES ($1, $2, $3, $4, 'pending', NOW())
      RETURNING id
    `;

    const result = await pool.query(insertQuery, [adId, reporterId, reason, details || null]);

    console.log(`🚩 Ad report saved with ID: ${result.rows[0].id}`);
    console.log(`🚩 Ad "${ad.title}" reported for: ${reason}`);

    res.json({
      success: true,
      message: 'Thank you for your report. We will review this ad and take appropriate action.',
      data: {
        reportId: result.rows[0].id
      }
    });

  } catch (error) {
    console.error('❌ Error reporting ad:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting report',
      error: error.message
    });
  }
});

// Get user's contact messages (for dashboard)
app.get('/api/user/contact-messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type = 'received' } = req.query; // 'sent' or 'received'

    let query;
    if (type === 'sent') {
      // Messages sent by user to other sellers
      query = `
        SELECT
          cm.id, cm.ad_id, cm.buyer_name, cm.buyer_email, cm.buyer_phone,
          cm.message, cm.created_at,
          a.title as ad_title,
          u.full_name as seller_name
        FROM contact_messages cm
        JOIN ads a ON cm.ad_id = a.id
        JOIN users u ON cm.seller_id = u.id
        WHERE cm.buyer_id = $1
        ORDER BY cm.created_at DESC
      `;
    } else {
      // Messages received by user as seller
      query = `
        SELECT
          cm.id, cm.ad_id, cm.buyer_name, cm.buyer_email, cm.buyer_phone,
          cm.message, cm.created_at,
          a.title as ad_title
        FROM contact_messages cm
        JOIN ads a ON cm.ad_id = a.id
        WHERE cm.seller_id = $1
        ORDER BY cm.created_at DESC
      `;
    }

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching contact messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
});

// Reply to contact message endpoint
app.post('/api/reply-message', rateLimiters.messaging, authenticateToken, async (req, res) => {
  try {
    const { originalMessageId, replyMessage } = req.body;
    const sellerId = req.user.userId;

    // Validate required fields
    if (!originalMessageId || !replyMessage) {
      return res.status(400).json({
        success: false,
        message: 'Original message ID and reply message are required'
      });
    }

    // Content filtering for reply messages
    console.log('🔍 Validating reply message for inappropriate content...');
    const replyValidation = contentFilter.validateMessage({
      message: replyMessage
    });

    if (!replyValidation.isValid) {
      console.log('❌ Reply message validation failed:', replyValidation.errors);

      // Get the most severe error for the main message (prioritize by severity: high > medium > low)
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const primaryError = replyValidation.errors.sort((a, b) =>
        severityOrder[b.severity] - severityOrder[a.severity]
      )[0];

      return res.status(400).json({
        success: false,
        message: primaryError.message,
        error: {
          type: primaryError.type,
          title: primaryError.title,
          message: primaryError.message,
          suggestion: primaryError.suggestion,
          severity: primaryError.severity,
          field: primaryError.field
        }
      });
    }

    console.log('✅ Reply message passed validation checks');

    // Get original message details to ensure seller owns the ad
    const originalQuery = `
      SELECT
        cm.id, cm.ad_id, cm.buyer_id, cm.buyer_name, cm.buyer_email,
        a.title as ad_title, a.user_id as ad_owner_id
      FROM contact_messages cm
      JOIN ads a ON cm.ad_id = a.id
      WHERE cm.id = $1
    `;

    const originalResult = await pool.query(originalQuery, [originalMessageId]);

    if (originalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Original message not found'
      });
    }

    const originalMessage = originalResult.rows[0];

    // Verify that the current user owns the ad
    if (originalMessage.ad_owner_id !== sellerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only reply to messages about your own ads'
      });
    }

    // Store reply message
    const insertQuery = `
      INSERT INTO contact_messages (
        ad_id, buyer_id, seller_id, buyer_name, buyer_email,
        message, is_reply, reply_to_message_id, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id
    `;

    // For replies, we swap the roles - seller becomes the "buyer" in the new message
    const result = await pool.query(insertQuery, [
      originalMessage.ad_id,
      sellerId, // seller becomes the sender
      originalMessage.buyer_id, // original buyer becomes the recipient
      'Seller Reply', // sender name
      req.user.email, // seller email
      replyMessage,
      true, // is_reply flag
      originalMessageId
    ]);

    console.log(`✅ Reply message saved with ID: ${result.rows[0].id}`);

    res.json({
      success: true,
      message: 'Reply sent successfully! The buyer will be notified.',
      data: {
        replyId: result.rows[0].id
      }
    });

  } catch (error) {
    console.error('❌ Error sending reply:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending reply',
      error: error.message
    });
  }
});

// Search routes (Typesense integration)
app.use('/api/search', require('./routes/search'));

// Location routes (areas search, hierarchy)
app.use('/api/locations', require('./routes/locationRoutes'));

// Areas routes (ward-level areas with search)
app.use('/api/areas', require('./routes/areas'));

// Profile routes
app.use('/api/profile', require('./routes/profile'));

// Messages routes (real-time messaging system)
app.use('/api/messages', require('./routes/messages'));
console.log('💬 Messaging routes registered at /api/messages');

// Shop routes (custom shop URL management)
app.use('/api/shop', require('./routes/shop'));

// User authentication routes (login, register)
app.use('/api/auth', require('./routes/authRoutes'));

// Super Admin/Editor authentication routes (no auth required for login)
app.use('/api/super-admin/auth', require('./routes/adminAuth'));
app.use('/api/admin/auth', require('./routes/adminAuth')); // Alias for admin login
app.use('/api/editor/auth', require('./routes/adminAuth')); // Alias for editor login

// Super Admin panel routes
app.use('/api/super-admin', require('./routes/admin'));

// Editor panel routes
app.use('/api/editor', require('./routes/editor'));

// Admin panel routes (alias for editor routes - super admin uses same endpoints)
app.use('/api/admin', require('./routes/editor'));

// Editor dashboard extensions (user reports, notifications, alerts)
app.use('/api/editor', require('./routes/editor_dashboard_extensions'));

// Business verification routes
app.use('/api/business', require('./routes/business'));

// Shop and Seller profile routes
app.use('/api', require('./routes/profiles'));

// Individual seller verification routes
app.use('/api/individual-verification', require('./routes/individualVerification'));

// Unified verification routes (Business + Individual)
app.use('/api/verification', require('./routes/verification'));

// Mock Payment routes (FOR TESTING ONLY - Remove in production)
app.use('/api/mock-payment', require('./routes/mockPayment'));
console.log('🎭 MOCK PAYMENT: Routes registered at /api/mock-payment');
console.log('⚠️  WARNING: This is for testing only. Replace with real payment gateway in production.');

// Promotion Pricing routes
app.use('/api/promotion-pricing', require('./routes/promotionPricing'));
console.log('💰 Promotion pricing routes registered at /api/promotion-pricing');

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Global Error Handler:');
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Error Message:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message,
    path: req.path
  });
});

// Initialize Socket.IO with JWT authentication and event handlers
initializeSocketIO(io);

// Start HTTP server (replaces app.listen for Socket.IO compatibility)
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - http://localhost:${PORT}/api/test`);
  console.log(`   - http://localhost:${PORT}/api/ads`);
  console.log(`   - http://localhost:${PORT}/api/categories`);
  console.log(`   - http://localhost:${PORT}/api/search (Typesense powered)`);
  console.log(`💬 Socket.IO messaging ready on ws://localhost:${PORT}`);
});