const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const contentFilter = require('./utils/contentFilter');
const { rateLimiters } = require('./utils/rateLimiter');
const duplicateDetector = require('./utils/duplicateDetector');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'thulobazaar_jwt_secret_key_2024';

// Database connection
const pool = new Pool({
  user: 'elw',
  host: 'localhost',
  database: 'thulobazaar',
  password: '', // Usually no password needed on Mac
  port: 5432,
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

// Make pool available globally
global.pool = pool;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/ads';
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'ad-' + uniqueSuffix + extension);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 images per ad
  },
  fileFilter: fileFilter
});

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if user is admin
    const result = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [decoded.userId]);

    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    req.user = decoded;
    req.admin = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

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
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, phone, created_at`,
      [email, passwordHash, fullName, phone]
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
          createdAt: user.created_at
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
      'SELECT id, email, password_hash, full_name, phone, location_id, is_active, role FROM users WHERE email = $1',
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
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ User logged in: ${user.email}`);

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
          role: user.role
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

// Get current user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.location_id, u.created_at, u.role,
              l.name as location_name
       FROM users u
       LEFT JOIN locations l ON u.location_id = l.id
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        locationId: user.location_id,
        locationName: user.location_name,
        createdAt: user.created_at,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Thulobazaar API is working!',
    timestamp: new Date().toISOString()
  });
});

// Get all ads with search and filtering
app.get('/api/ads', async (req, res) => {
  try {
    const {
      search,
      category,
      location,
      minPrice,
      maxPrice,
      sortBy = 'newest',
      limit = 20,
      offset = 0
    } = req.query;

    console.log('🔍 API Call to /ads with params:', { search, category, location, minPrice, maxPrice, sortBy, limit, offset });

    let queryConditions = ['a.status = $1'];
    let queryParams = ['approved'];
    let paramCount = 1;

    // Add search condition
    if (search && search.trim()) {
      paramCount++;
      queryConditions.push(`(a.title ILIKE $${paramCount} OR a.description ILIKE $${paramCount})`);
      queryParams.push(`%${search.trim()}%`);
    }

    // Add category filter
    if (category && category !== 'all') {
      paramCount++;
      // Check if category is a number (ID) or string (name/slug)
      if (!isNaN(parseInt(category))) {
        queryConditions.push(`a.category_id = $${paramCount}`);
        queryParams.push(parseInt(category));
      } else {
        // Filter by category name or slug
        queryConditions.push(`(c.name ILIKE $${paramCount} OR c.slug ILIKE $${paramCount})`);
        queryParams.push(category);
      }
    }

    // Add location filter
    if (location && location !== 'all') {
      paramCount++;
      // Check if location is a number (ID) or string (name/slug)
      if (!isNaN(parseInt(location))) {
        queryConditions.push(`a.location_id = $${paramCount}`);
        queryParams.push(parseInt(location));
      } else {
        // Filter by location name or slug
        queryConditions.push(`(l.name ILIKE $${paramCount} OR l.slug ILIKE $${paramCount})`);
        queryParams.push(location);
      }
    }

    // Add price range filters
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

    // Determine sorting
    let orderByClause;
    switch (sortBy) {
      case 'price-low':
        orderByClause = 'a.is_featured DESC, a.price ASC, a.created_at DESC';
        break;
      case 'price-high':
        orderByClause = 'a.is_featured DESC, a.price DESC, a.created_at DESC';
        break;
      case 'oldest':
        orderByClause = 'a.is_featured DESC, a.created_at ASC';
        break;
      case 'popular':
        orderByClause = 'a.is_featured DESC, a.view_count DESC, a.created_at DESC';
        break;
      case 'newest':
      default:
        orderByClause = 'a.is_featured DESC, a.created_at DESC';
        break;
    }

    const query = `
      SELECT
        a.id, a.title, a.description, a.price, a.condition, a.view_count,
        a.seller_name, a.seller_phone, a.created_at, a.is_featured,
        c.name as category_name, c.icon as category_icon,
        l.name as location_name,
        (SELECT filename FROM ad_images WHERE ad_id = a.id AND is_primary = true LIMIT 1) as primary_image
      FROM ads a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE ${queryConditions.join(' AND ')}
      ORDER BY ${orderByClause}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ads a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE ${queryConditions.join(' AND ')}
    `;

    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    console.log(`✅ Found ${result.rows.length} ads (${total} total)`);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('❌ Error fetching ads:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ads',
      error: error.message
    });
  }
});

// Get single ad
app.get('/api/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT
        a.id, a.title, a.description, a.price, a.condition, a.view_count,
        a.seller_name, a.seller_phone, a.created_at, a.is_featured,
        c.name as category_name, c.icon as category_icon,
        l.name as location_name
      FROM ads a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
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

    const adData = {
      ...result.rows[0],
      images: imagesResult.rows
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
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    console.log(`✅ Found ${result.rows.length} categories`);

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

// Get locations
app.get('/api/locations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations ORDER BY name');
    console.log(`✅ Found ${result.rows.length} locations`);

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

// Create new ad (protected route)
app.post('/api/ads', rateLimiters.posting, authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, price, condition, categoryId, locationId, sellerName, sellerPhone } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!title || !description || !price || !condition || !categoryId || !locationId || !sellerName || !sellerPhone) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Content filtering for ads
    console.log('🔍 Validating ad content for inappropriate language and spam...');
    const adValidation = contentFilter.validateAd({
      title,
      description,
      price
    });

    if (!adValidation.isValid) {
      console.log('❌ Ad content validation failed:', adValidation.errors);

      // Get the most severe error for the main message (prioritize by severity: high > medium > low)
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const primaryError = adValidation.errors.sort((a, b) =>
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
        },
        allErrors: adValidation.errors // For debugging/detailed view
      });
    }

    // Validate price
    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    console.log('✅ Ad content passed validation checks');

    // Check for duplicate ads by the same user
    console.log('🔍 Checking for duplicate ads by the same user...');
    const duplicateCheck = await duplicateDetector.checkForDuplicates(pool, {
      title,
      description,
      price,
      categoryId,
      locationId
    }, userId, {
      titleSimilarityThreshold: 0.85,    // 85% similar titles
      descriptionSimilarityThreshold: 0.75, // 75% similar descriptions
      priceTolerancePercent: 5,          // 5% price difference
      timeWindowHours: 24 * 7           // Check duplicates within 7 days
    });

    if (duplicateCheck.hasDuplicates) {
      const warning = duplicateDetector.generateDuplicateWarning(duplicateCheck);
      console.log('⚠️  Duplicate ad detected:', warning);

      // For high similarity (90%+), block the ad
      if (warning.severity === 'high') {
        return res.status(400).json({
          success: false,
          message: warning.message,
          error: {
            type: warning.type,
            title: warning.title,
            message: warning.message,
            suggestion: warning.suggestion,
            severity: warning.severity,
            details: warning.details
          }
        });
      }

      // For medium similarity (60-89%), allow but warn
      console.log('⚠️  Similar ad detected, allowing with warning');
    } else {
      console.log('✅ No duplicate ads detected');
    }

    // Insert ad
    const result = await pool.query(
      `INSERT INTO ads (title, description, price, condition, category_id, location_id, seller_name, seller_phone, user_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, title, price, created_at`,
      [title, description, price, condition, categoryId, locationId, sellerName, sellerPhone, userId, 'approved']
    );

    const ad = result.rows[0];

    // Handle image uploads if any
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map((file, index) => {
        return pool.query(
          `INSERT INTO ad_images (ad_id, filename, original_name, file_path, file_size, mime_type, is_primary)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            ad.id,
            file.filename,
            file.originalname,
            file.path,
            file.size,
            file.mimetype,
            index === 0 // First image is primary
          ]
        );
      });

      await Promise.all(imagePromises);
      console.log(`✅ ${req.files.length} images uploaded for ad ${ad.id}`);
    }

    console.log(`✅ Ad created: ${ad.title} by user ${userId}`);

    // Prepare response with potential duplicate warning
    const response = {
      success: true,
      message: 'Ad posted successfully',
      data: {
        id: ad.id,
        title: ad.title,
        price: ad.price,
        createdAt: ad.created_at,
        imageCount: req.files ? req.files.length : 0
      }
    };

    // Add duplicate warning if similar ads were found
    if (duplicateCheck.hasDuplicates) {
      const warning = duplicateDetector.generateDuplicateWarning(duplicateCheck);
      if (warning.severity === 'medium') {
        response.warning = warning;
        response.message = 'Ad posted successfully with similarity warning';
      }
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('❌ Error creating ad:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ad',
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

// Update ad (protected route)
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

// Admin API Routes

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

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - http://localhost:${PORT}/api/test`);
  console.log(`   - http://localhost:${PORT}/api/ads`);
  console.log(`   - http://localhost:${PORT}/api/categories`);
});