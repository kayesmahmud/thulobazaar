const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config/env');
const pool = require('../config/database');
const { catchAsync, ValidationError, AuthenticationError } = require('../middleware/errorHandler');

// Admin/Editor Login (unified - uses users table only)
router.post('/login', catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  // Query unified users table for editors and super_admins
  const result = await pool.query(
    `SELECT id, email, password_hash, full_name, role, is_active
     FROM users
     WHERE email = $1 AND role IN ('editor', 'super_admin')`,
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if user is active
  if (!user.is_active) {
    throw new AuthenticationError('Account is deactivated');
  }

  // Verify password
  const passwordVerified = await bcrypt.compare(password, user.password_hash);

  if (!passwordVerified) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role
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
      role: user.role
    }
  });
}));

module.exports = router;
