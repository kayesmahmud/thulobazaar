// URL and slug generation utilities for SEO-friendly URLs

/**
 * Generate a URL-friendly slug from text
 * @param {string} text - The text to convert to slug
 * @returns {string} - URL-friendly slug
 */
export const generateSlug = (text) => {
  if (!text) return '';

  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generate SEO-friendly ad URL following Bikroy pattern
 * @param {Object} ad - Ad object with title, location info, and id
 * @returns {string} - SEO-friendly URL path
 */
export const generateAdUrl = (ad) => {
  if (!ad || !ad.id) return '/';

  const titleSlug = generateSlug(ad.title);
  const locationSlug = ad.location_slug || generateSlug(ad.location_name);

  // Pattern: /ad/[product-description]-[location]-[id]
  return `/ad/${titleSlug}-${locationSlug}-${ad.id}`;
};

/**
 * Generate browse URL for category/location combinations
 * @param {string} locationSlug - Location slug
 * @param {string} categorySlug - Category slug (optional)
 * @returns {string} - Browse URL path
 */
export const generateBrowseUrl = (locationSlug, categorySlug = null) => {
  if (!locationSlug) return '/ads';

  if (categorySlug) {
    // Pattern: /ads/[location]/[category]
    return `/ads/${locationSlug}/${categorySlug}`;
  }

  // Pattern: /ads/[location]
  return `/ads/${locationSlug}`;
};

/**
 * Generate category browse URL
 * @param {string} categorySlug - Category slug
 * @returns {string} - Category browse URL path
 */
export const generateCategoryUrl = (categorySlug) => {
  if (!categorySlug) return '/ads';

  // Pattern: /ads/category/[category]
  return `/ads/category/${categorySlug}`;
};

/**
 * Parse SEO-friendly ad URL to extract ID
 * @param {string} urlPath - URL path like "/ad/wooden-bed-4x5-feet-kathmandu-21"
 * @returns {number|null} - Extracted ad ID or null if not found
 */
export const extractAdIdFromUrl = (urlPath) => {
  if (!urlPath) return null;

  // Extract ID from end of URL (after last hyphen)
  const matches = urlPath.match(/-(\d+)$/);
  return matches ? parseInt(matches[1], 10) : null;
};

/**
 * Parse browse URL to extract location and category slugs
 * @param {string} urlPath - URL path like "/ads/kathmandu/electronics"
 * @returns {Object} - {locationSlug, categorySlug}
 */
export const parseBrowseUrl = (urlPath) => {
  if (!urlPath) return { locationSlug: null, categorySlug: null };

  const parts = urlPath.split('/').filter(part => part);

  if (parts[0] !== 'ads') {
    return { locationSlug: null, categorySlug: null };
  }

  if (parts.length === 2) {
    // /ads/[location] or /ads/category
    if (parts[1] === 'category') {
      return { locationSlug: null, categorySlug: null };
    }
    return { locationSlug: parts[1], categorySlug: null };
  }

  if (parts.length === 3) {
    if (parts[1] === 'category') {
      // /ads/category/[category]
      return { locationSlug: null, categorySlug: parts[2] };
    }
    // /ads/[location]/[category]
    return { locationSlug: parts[1], categorySlug: parts[2] };
  }

  return { locationSlug: null, categorySlug: null };
};

/**
 * Generate breadcrumb items for SEO and navigation
 * @param {Object} params - {categoryName, locationName, adTitle}
 * @returns {Array} - Breadcrumb items
 */
export const generateBreadcrumbs = ({ categoryName, locationName, adTitle }) => {
  const breadcrumbs = [
    { label: 'Home', url: '/', active: false }
  ];

  if (locationName && categoryName) {
    breadcrumbs.push(
      { label: locationName, url: `/ads/${generateSlug(locationName)}`, active: false },
      { label: categoryName, url: `/ads/${generateSlug(locationName)}/${generateSlug(categoryName)}`, active: false }
    );
  } else if (locationName) {
    breadcrumbs.push(
      { label: locationName, url: `/ads/${generateSlug(locationName)}`, active: false }
    );
  } else if (categoryName) {
    breadcrumbs.push(
      { label: categoryName, url: `/ads/category/${generateSlug(categoryName)}`, active: false }
    );
  }

  if (adTitle) {
    breadcrumbs.push(
      { label: adTitle, url: '', active: true }
    );
  }

  return breadcrumbs;
};

/**
 * Generate meta title for SEO
 * @param {Object} params - {adTitle, categoryName, locationName, siteName}
 * @returns {string} - SEO meta title
 */
export const generateMetaTitle = ({ adTitle, categoryName, locationName, siteName = 'Thulobazaar' }) => {
  if (adTitle) {
    const parts = [adTitle];
    if (locationName) parts.push(locationName);
    parts.push(siteName);
    return parts.join(' - ');
  }

  if (categoryName && locationName) {
    return `${categoryName} in ${locationName} - ${siteName}`;
  }

  if (categoryName) {
    return `${categoryName} - ${siteName}`;
  }

  if (locationName) {
    return `Buy, Sell in ${locationName} - ${siteName}`;
  }

  return siteName;
};

/**
 * Generate meta description for SEO
 * @param {Object} params - {adDescription, categoryName, locationName, count}
 * @returns {string} - SEO meta description
 */
export const generateMetaDescription = ({ adDescription, categoryName, locationName, count }) => {
  if (adDescription) {
    return adDescription.substring(0, 155) + (adDescription.length > 155 ? '...' : '');
  }

  if (categoryName && locationName) {
    const countText = count ? `${count} ads` : 'ads';
    return `Find ${countText} for ${categoryName} in ${locationName}. Buy, sell, rent on Nepal's largest marketplace.`;
  }

  if (categoryName) {
    const countText = count ? `${count} ads` : 'ads';
    return `Browse ${countText} in ${categoryName} category. Buy, sell, rent across Nepal.`;
  }

  if (locationName) {
    const countText = count ? `${count} ads` : 'ads';
    return `Find ${countText} in ${locationName}. Buy, sell, rent on Nepal's largest marketplace.`;
  }

  return 'Buy, sell, rent across Nepal. Find anything on Nepal\'s largest marketplace.';
};