const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { Admin, Editor } = require('../models');
const { catchAsync, ValidationError, AuthenticationError } = require('../middleware/errorHandler');

// Admin/Editor Login (separate from regular users)
router.post('/login', catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  let user = null;
  let userType = null;
  let passwordVerified = false;

  // Check admins table first
  const admin = await Admin.findByEmail(email);
  if (admin) {
    passwordVerified = await Admin.verifyPassword(password, admin.password_hash);
    if (passwordVerified) {
      user = admin;
      userType = 'super_admin';
    }
  }

  // If not found in admins, check editors table
  if (!user) {
    const editor = await Editor.findByEmail(email);
    if (editor) {
      passwordVerified = await Editor.verifyPassword(password, editor.password_hash);
      if (passwordVerified) {
        user = editor;
        userType = 'editor';
      }
    }
  }

  // If user not found or password invalid
  if (!user || !passwordVerified) {
    throw new AuthenticationError('Invalid email or password');
  }

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
