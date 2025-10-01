const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT id, email, full_name, phone, role, is_active, location_id, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Create new user
   */
  static async create(userData) {
    const { email, password, fullName, phone, locationId } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, location_id, role, is_active)
       VALUES ($1, $2, $3, $4, $5, 'user', true)
       RETURNING id, email, full_name, phone, role, is_active, location_id, created_at`,
      [email, hashedPassword, fullName, phone || null, locationId || null]
    );

    return result.rows[0];
  }

  /**
   * Update user
   */
  static async update(id, userData) {
    const { fullName, phone, locationId } = userData;

    const result = await pool.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           location_id = COALESCE($3, location_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, email, full_name, phone, role, is_active, location_id, created_at, updated_at`,
      [fullName, phone, locationId, id]
    );

    return result.rows[0];
  }

  /**
   * Update user password
   */
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, id]
    );
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Check if user is admin
   */
  static async isAdmin(userId) {
    const result = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.role === 'admin';
  }

  /**
   * Get all users (admin only)
   */
  static async findAll(filters = {}) {
    const { limit = 50, offset = 0, role, isActive } = filters;

    let query = 'SELECT id, email, full_name, phone, role, is_active, location_id, created_at FROM users WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (role) {
      query += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      params.push(isActive);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Toggle user active status
   */
  static async toggleActive(id) {
    const result = await pool.query(
      `UPDATE users
       SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING is_active`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Delete user
   */
  static async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

module.exports = User;