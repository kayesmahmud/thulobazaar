import { prisma } from '@thulobazaar/database';

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
 * Generate a unique slug for an ad
 * Checks for duplicates and appends a counter if necessary
 * @param title - The ad title
 * @param adId - The ad ID (for updates, to exclude self from duplicate check)
 * @returns Unique slug
 */
export async function generateSlug(title: string, adId?: number): Promise<string> {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    // Check if slug exists (excluding current ad if updating)
    const existingAd = await prisma.ads.findFirst({
      where: {
        slug,
        ...(adId ? { NOT: { id: adId } } : {}),
      },
      select: { id: true },
    });

    // If slug doesn't exist, it's unique!
    if (!existingAd) {
      return slug;
    }

    // Slug exists, try with counter
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Generate SEO-friendly slug with location for ad detail pages
 * Format: title-area-district--id
 * Example: iphone-15-pro-thamel-kathmandu--48
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
