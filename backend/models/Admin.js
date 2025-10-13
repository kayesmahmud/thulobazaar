const pool = global.pool;
const bcrypt = require('bcrypt');

class Admin {
  /**
   * Find admin by email
   */
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM admins WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return result.rows[0];
  }

  /**
   * Find admin by ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT id, email, full_name, role, is_active, last_login, created_at FROM admins WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = Admin;
