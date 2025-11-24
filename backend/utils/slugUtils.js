const pool = require('../config/database');

/**
 * Generate a URL-friendly slug from text
 * @param {string} text - The text to convert to slug
 * @returns {string} - URL-friendly slug
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars except hyphens
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

/**
 * Generate a unique slug for an ad
 * Checks for duplicates and appends a counter if necessary
 * @param {string} title - The ad title
 * @param {number|null} adId - The ad ID (for updates, to exclude self from duplicate check)
 * @returns {Promise<string>} - Unique slug
 */
async function generateSlug(title, adId = null) {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    // Check if slug exists (excluding current ad if updating)
    const query = adId
      ? 'SELECT id FROM ads WHERE slug = $1 AND id != $2 LIMIT 1'
      : 'SELECT id FROM ads WHERE slug = $1 LIMIT 1';

    const params = adId ? [slug, adId] : [slug];
    const result = await pool.query(query, params);

    // If slug doesn't exist, it's unique!
    if (result.rows.length === 0) {
      return slug;
    }

    // Slug exists, try with counter
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Generate slug from title for existing ads (backfill)
 * @param {number} adId - The ad ID
 * @param {string} title - The ad title
 * @returns {Promise<string>} - Generated slug
 */
async function generateSlugForExistingAd(adId, title) {
  return generateSlug(title, adId);
}

/**
 * Generate SEO-friendly slug with location for ad detail pages
 * Format: title-area-district OR title-area-district-1, title-area-district-2, etc.
 * Example: iphone-15-pro-thamel OR iphone-15-pro-thamel-1
 *
 * @param {number} adId - The ad ID
 * @param {string} title - The ad title
 * @param {string|null} areaName - Area name (e.g., "Thamel")
 * @param {string|null} districtName - District name (e.g., "Kathmandu")
 * @returns {Promise<string>} - SEO-friendly slug with location (and counter if duplicate)
 */
async function generateSeoSlug(adId, title, areaName = null, districtName = null) {
  const parts = [title];

  // Add area if available (area takes priority over district)
  if (areaName) {
    parts.push(areaName);
  } else if (districtName) {
    // Only add district if no area is available
    parts.push(districtName);
  }

  // Slugify the combined parts
  const baseSlug = slugify(parts.join(' '));
  let slug = baseSlug;
  let counter = 0;

  // Check for duplicates (excluding current ad)
  while (true) {
    const query = 'SELECT id FROM ads WHERE slug = $1 AND id != $2 LIMIT 1';
    const result = await pool.query(query, [slug, adId]);

    // If slug doesn't exist, it's unique!
    if (result.rows.length === 0) {
      return slug;
    }

    // Slug exists, try with counter
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

module.exports = {
  slugify,
  generateSlug,
  generateSlugForExistingAd,
  generateSeoSlug
};
