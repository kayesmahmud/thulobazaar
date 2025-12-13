/**
 * Server-side slug generation utilities
 * These functions require Prisma and should only be used in server components/API routes
 *
 * For client-safe slug utilities (slugify, generateSeoSlug), use ./slug-utils.ts
 */

import { prisma } from '@thulobazaar/database';

// Re-export client-safe functions for convenience in server code
export { slugify, generateSeoSlug } from './slug-utils';

/**
 * Generate a unique SEO-friendly slug for an ad
 * Format: title-location-counter (e.g., "iphone-15-pro-thamel-1")
 * Includes location (area or district) and auto-increments counter for duplicates
 *
 * @param title - The ad title
 * @param locationId - The location ID (to get area/district name)
 * @param adId - The ad ID (for updates, to exclude self from duplicate check)
 * @returns Unique slug with location and counter (e.g., "apartment-for-rent-kathmandu-1")
 */
export async function generateSlug(
  title: string,
  locationId?: number,
  adId?: number
): Promise<string> {
  const titleSlug = slugify(title);

  // Get location name (prefer area over district for more specific SEO)
  let locationName = '';
  if (locationId) {
    const location = await prisma.locations.findUnique({
      where: { id: locationId },
      select: { name: true, type: true, parent_id: true },
    });

    if (location) {
      locationName = slugify(location.name);
    }
  }

  // Build base slug: title-location or just title if no location
  const baseSlug = locationName ? `${titleSlug}-${locationName}` : titleSlug;

  // Find the highest counter for slugs with this base
  // Pattern: baseSlug-1, baseSlug-2, etc.
  const existingSlugs = await prisma.ads.findMany({
    where: {
      slug: {
        startsWith: `${baseSlug}-`,
      },
      ...(adId ? { NOT: { id: adId } } : {}),
    },
    select: { slug: true },
  });

  // Extract counters from existing slugs
  let maxCounter = 0;
  const counterRegex = new RegExp(`^${baseSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`);

  for (const ad of existingSlugs) {
    if (!ad.slug) continue;
    const match = ad.slug.match(counterRegex);
    if (match?.[1]) {
      const counter = parseInt(match[1], 10);
      if (counter > maxCounter) {
        maxCounter = counter;
      }
    }
  }

  // Next available counter
  const nextCounter = maxCounter + 1;
  const finalSlug = `${baseSlug}-${nextCounter}`;

  // Database constraint requires ending with numbers, which we have!
  return finalSlug;
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
