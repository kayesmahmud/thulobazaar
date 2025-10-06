const pool = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class AdImage {
  /**
   * Find all images for an ad
   */
  static async findByAdId(adId) {
    const result = await pool.query(
      'SELECT * FROM ad_images WHERE ad_id = $1 ORDER BY is_primary DESC, created_at ASC',
      [adId]
    );
    return result.rows;
  }

  /**
   * Find primary image for an ad
   */
  static async findPrimaryByAdId(adId) {
    const result = await pool.query(
      'SELECT * FROM ad_images WHERE ad_id = $1 AND is_primary = true',
      [adId]
    );
    return result.rows[0];
  }

  /**
   * Create new image
   */
  static async create(imageData) {
    const { adId, imageUrl, isPrimary = false } = imageData;

    const result = await pool.query(
      'INSERT INTO ad_images (ad_id, image_url, is_primary) VALUES ($1, $2, $3) RETURNING *',
      [adId, imageUrl, isPrimary]
    );

    return result.rows[0];
  }

  /**
   * Set primary image
   */
  static async setPrimary(id, adId) {
    // First, remove primary status from all images
    await pool.query(
      'UPDATE ad_images SET is_primary = false WHERE ad_id = $1',
      [adId]
    );

    // Then set this image as primary
    const result = await pool.query(
      'UPDATE ad_images SET is_primary = true WHERE id = $1 RETURNING *',
      [id]
    );

    return result.rows[0];
  }

  /**
   * Delete image
   */
  static async delete(id) {
    // Get image info before deleting
    const imageResult = await pool.query(
      'SELECT filename FROM ad_images WHERE id = $1',
      [id]
    );

    const result = await pool.query(
      'DELETE FROM ad_images WHERE id = $1 RETURNING *',
      [id]
    );

    // Delete the actual file from server
    if (imageResult.rows[0]?.filename) {
      const filePath = path.join(__dirname, '../uploads/ads', imageResult.rows[0].filename);
      try {
        await fs.unlink(filePath);
        console.log('✅ Deleted image file:', imageResult.rows[0].filename);
      } catch (err) {
        console.log('⚠️ Image file not found or already deleted:', imageResult.rows[0].filename);
      }
    }

    return result.rows[0];
  }

  /**
   * Delete all images for an ad
   */
  static async deleteByAdId(adId) {
    // Get all image filenames before deleting
    const imagesResult = await pool.query(
      'SELECT filename FROM ad_images WHERE ad_id = $1',
      [adId]
    );

    // Delete from database
    await pool.query('DELETE FROM ad_images WHERE ad_id = $1', [adId]);

    // Delete all actual files from server
    for (const image of imagesResult.rows) {
      if (image.filename) {
        const filePath = path.join(__dirname, '../uploads/ads', image.filename);
        try {
          await fs.unlink(filePath);
          console.log('✅ Deleted image file:', image.filename);
        } catch (err) {
          console.log('⚠️ Image file not found or already deleted:', image.filename);
        }
      }
    }
  }

  /**
   * Get image count for ad
   */
  static async getCountByAdId(adId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM ad_images WHERE ad_id = $1',
      [adId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = AdImage;