const pool = require('../config/database');

class Category {
  /**
   * Find all categories (top-level only by default)
   */
  static async findAll(includeSubcategories = false) {
    if (includeSubcategories) {
      // Return FLAT array of ALL categories (both parents and children)
      // This allows frontend to filter by parent_id to get subcategories
      const result = await pool.query(
        `SELECT * FROM categories
         ORDER BY
           CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END,
           parent_id NULLS FIRST,
           name ASC`
      );
      console.log(`🔍 [Category.findAll] Returning ${result.rows.length} categories (flat array)`);
      return result.rows;
    } else {
      // Return only top-level categories
      const result = await pool.query(
        'SELECT * FROM categories WHERE parent_id IS NULL ORDER BY name ASC'
      );
      return result.rows;
    }
  }

  /**
   * Find category by ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Find category by slug
   */
  static async findBySlug(slug) {
    const result = await pool.query(
      'SELECT * FROM categories WHERE slug = $1',
      [slug]
    );
    return result.rows[0];
  }

  /**
   * Create new category
   */
  static async create(categoryData) {
    const { name, slug, description, icon } = categoryData;

    const result = await pool.query(
      'INSERT INTO categories (name, slug, description, icon) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, slug, description, icon]
    );

    return result.rows[0];
  }

  /**
   * Update category
   */
  static async update(id, categoryData) {
    const { name, slug, description, icon } = categoryData;

    const result = await pool.query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           icon = COALESCE($4, icon)
       WHERE id = $5
       RETURNING *`,
      [name, slug, description, icon, id]
    );

    return result.rows[0];
  }

  /**
   * Delete category
   */
  static async delete(id) {
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
  }

  /**
   * Get category with ad count (top-level only)
   */
  static async findAllWithCount() {
    const result = await pool.query(
      `SELECT c.*, COUNT(a.id) as ad_count
       FROM categories c
       LEFT JOIN ads a ON c.id = a.category_id AND a.status = 'approved'
       WHERE c.parent_id IS NULL
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    return result.rows;
  }
}

module.exports = Category;