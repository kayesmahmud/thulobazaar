/**
 * Client-safe slug utility functions
 * These functions do NOT require Prisma and can be used in client components
 *
 * For server-side slug generation that requires database lookups,
 * use ./slug.ts instead (server-only)
 */

/**
 * Generate a URL-friendly slug from text
 * @param text - The text to convert to slug
 * @returns URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars except hyphens
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Generate SEO-friendly slug with location for ad detail pages
 * Format: title-area-district--id
 * Example: iphone-15-pro-thamel-kathmandu--48
 *
 * This is a pure function that doesn't require database access.
 *
 * @param adId - The ad ID
 * @param title - The ad title
 * @param areaName - Area name (e.g., "Thamel")
 * @param districtName - District name (e.g., "Kathmandu")
 * @returns SEO-friendly slug with location and ID
 */
export function generateSeoSlug(
  adId: number,
  title: string,
  areaName?: string | null,
  districtName?: string | null
): string {
  const parts = [title];

  // Add area if available
  if (areaName) {
    parts.push(areaName);
  }

  // Add district if available (and different from area)
  if (districtName && districtName !== areaName) {
    parts.push(districtName);
  }

  // Slugify the combined parts
  const slugPart = slugify(parts.join(' '));

  // Return slug with ID at the end: title-area-district--id
  return `${slugPart}--${adId}`;
}
