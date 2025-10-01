const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/env');
const { AuthenticationError, ValidationError } = require('../middleware/errorHandler');

class AuthController {
  /**
   * Register new user
   */
  static async register(req, res) {
    const { email, password, fullName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      fullName,
      phone
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  }

  /**
   * Login user
   */
  static async login(req, res) {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  }

  /**
   * Get current user profile
   */
  static async getProfile(req, res) {
    const user = await User.findById(req.user.userId);

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    res.json({
      success: true,
      user
    });
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    const { fullName, phone, locationId } = req.body;

    const user = await User.update(req.user.userId, {
      fullName,
      phone,
      locationId
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  }

  /**
   * Change password
   */
  static async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;

    // Get user with password hash
    const user = await User.findByEmail(req.user.email);

    // Verify current password
    const isValidPassword = await User.verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Update password
    await User.updatePassword(req.user.userId, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  }
}

module.exports = AuthController;