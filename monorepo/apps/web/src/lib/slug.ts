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

/**
 * Generate a unique shop slug from user's full name
 * Checks for duplicates and appends incremental counter if necessary
 * Examples: "Rohit Thapa" -> "rohit-thapa", "rohit-thapa-1", "rohit-thapa-2", etc.
 *
 * @param fullName - The user's full name
 * @param userId - The user ID (for updates, to exclude self from duplicate check)
 * @returns Unique shop slug
 */
export async function generateUniqueShopSlug(
  fullName: string,
  userId?: number
): Promise<string> {
  const baseSlug = slugify(fullName);

  // Handle empty or invalid names
  if (!baseSlug) {
    return `user-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 0;

  while (true) {
    // Check if slug exists in shop_slug or custom_shop_slug (excluding current user if updating)
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [{ shop_slug: slug }, { custom_shop_slug: slug }],
        ...(userId ? { NOT: { id: userId } } : {}),
      },
      select: { id: true },
    });

    // If slug doesn't exist, it's unique!
    if (!existingUser) {
      return slug;
    }

    // Slug exists, try with counter
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}
