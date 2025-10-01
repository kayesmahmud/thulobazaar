const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const config = require('../config/env');
const { catchAsync, ValidationError, AuthenticationError } = require('../middleware/errorHandler');

// Admin/Editor Login (separate from regular users)
router.post('/login', catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  let user = null;
  let userType = null;

  // Check admins table first
  const adminResult = await pool.query(
    'SELECT * FROM admins WHERE email = $1 AND is_active = true',
    [email]
  );

  if (adminResult.rows.length > 0) {
    user = adminResult.rows[0];
    userType = 'super_admin';
  } else {
    // Check editors table
    const editorResult = await pool.query(
      'SELECT * FROM editors WHERE email = $1 AND is_active = true',
      [email]
    );

    if (editorResult.rows.length > 0) {
      user = editorResult.rows[0];
      userType = 'editor';
    }
  }

  // If user not found in either table
  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Update last login
  const tableName = userType === 'super_admin' ? 'admins' : 'editors';
  await pool.query(
    `UPDATE ${tableName} SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
    [user.id]
  );

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: userType
    },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: userType
    }
  });
}));

module.exports = router;
