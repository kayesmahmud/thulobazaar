/**
 * Client-safe URL building utilities
 * These functions can be used in both server and client components
 * because they don't depend on Node.js modules like Prisma/pg
 */

/**
 * Build SEO-friendly ad browsing URL from location and category
 *
 * @param lang - Language code (e.g., 'en', 'np')
 * @param locationSlug - Location slug (optional)
 * @param categorySlug - Category slug (optional)
 * @param queryParams - Additional query parameters (search, price, etc.)
 * @returns SEO-friendly URL path
 */
export function buildAdUrl(
  lang: string,
  locationSlug?: string | null,
  categorySlug?: string | null,
  queryParams?: Record<string, string | number | boolean | undefined | null>
): string {
  // Build path segments
  const segments = [lang, 'ads'];

  if (locationSlug) {
    segments.push(locationSlug);
  }

  if (categorySlug) {
    segments.push(categorySlug);
  }

  let url = `/${segments.join('/')}`;

  // Add query parameters if provided
  if (queryParams) {
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return url;
}

/**
 * Generate SEO metadata for ad listing pages
 *
 * @param locationName - Location name (e.g., "Kathmandu")
 * @param categoryName - Category name (e.g., "Mobiles")
 * @param searchQuery - Search query if applicable
 * @param totalAds - Total number of ads matching filters
 * @returns Metadata for Next.js generateMetadata
 */
export function generateAdListingMetadata(
  locationName: string | null,
  categoryName: string | null,
  searchQuery: string | null,
  totalAds: number
) {
  let title = '';
  let description = '';

  if (searchQuery) {
    // Search mode
    if (locationName && categoryName) {
      title = `Search "${searchQuery}" in ${categoryName} - ${locationName} | Thulobazaar`;
      description = `Find ${searchQuery} in ${categoryName} category in ${locationName}. Browse ${totalAds.toLocaleString()} ads.`;
    } else if (locationName) {
      title = `Search "${searchQuery}" in ${locationName} | Thulobazaar`;
      description = `Search results for "${searchQuery}" in ${locationName}. ${totalAds.toLocaleString()} ads found.`;
    } else if (categoryName) {
      title = `Search "${searchQuery}" in ${categoryName} | Thulobazaar`;
      description = `Search results for "${searchQuery}" in ${categoryName} category. ${totalAds.toLocaleString()} ads found.`;
    } else {
      title = `Search "${searchQuery}" | Thulobazaar`;
      description = `Search results for "${searchQuery}". ${totalAds.toLocaleString()} ads found across Nepal.`;
    }
  } else {
    // Browse mode
    if (locationName && categoryName) {
      title = `${categoryName} in ${locationName} | Thulobazaar`;
      description = `Browse ${totalAds.toLocaleString()} ${categoryName} ads in ${locationName}. Find the best deals on classified ads in Nepal.`;
    } else if (locationName) {
      title = `Ads in ${locationName} | Thulobazaar`;
      description = `Browse ${totalAds.toLocaleString()} classified ads in ${locationName}. Find electronics, vehicles, property, and more.`;
    } else if (categoryName) {
      title = `${categoryName} Ads in Nepal | Thulobazaar`;
      description = `Browse ${totalAds.toLocaleString()} ${categoryName} ads across Nepal. Find the best deals on classified ads.`;
    } else {
      title = `All Ads in Nepal | Thulobazaar`;
      description = `Browse ${totalAds.toLocaleString()} classified ads across Nepal. Find electronics, vehicles, property, and more.`;
    }
  }

  return {
    title,
    description,
  };
}
