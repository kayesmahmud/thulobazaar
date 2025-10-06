// SEO-friendly URL generation utilities

export const createCategorySlug = (categoryName) => {
  return categoryName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-'); // Remove leading/trailing hyphens
};

export const createLocationSlug = (locationName) => {
  return locationName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-'); // Remove leading/trailing hyphens
};

// Bikroy-style URL generation
export const generateBikroyStyleURL = (category = null, location = 'nepal') => {
  const locationSlug = createLocationSlug(location);

  if (category) {
    const categorySlug = createCategorySlug(category);
    return `/ads/${locationSlug}/${categorySlug}`;
  }

  return `/ads/${locationSlug}`;
};

// Parse Bikroy-style URLs back to category/location
export const parseBikroyStyleURL = (pathname) => {
  const parts = pathname.split('/').filter(Boolean);

  if (parts[0] !== 'ads') {
    return { isValid: false };
  }

  if (parts.length === 2) {
    // /ads/nepal
    return {
      isValid: true,
      location: parts[1],
      category: null
    };
  } else if (parts.length === 3) {
    // /ads/nepal/vehicles
    return {
      isValid: true,
      location: parts[1],
      category: parts[2]
    };
  }

  return { isValid: false };
};

// Category name mappings for better SEO
export const categoryMappings = {
  'Mobiles': 'mobiles',
  'Electronics': 'electronics',
  'Vehicles': 'vehicles',
  'Home & Living': 'home-living',
  'Property': 'property',
  'Pets & Animals': 'pets-animals',
  'Men\'s Fashion & Grooming': 'mens-fashion-grooming',
  'Women\'s Fashion & Beauty': 'womens-fashion-beauty',
  'Hobbies, Sports & Kids': 'hobbies-sports-kids',
  'Business & Industry': 'business-industry',
  'Education': 'education',
  'Essentials': 'essentials',
  'Jobs': 'jobs',
  'Services': 'services',
  'Agriculture': 'agriculture',
  'Overseas Jobs': 'overseas-jobs'
};

// Reverse mapping for URL parsing
export const reverseCategoryMappings = Object.fromEntries(
  Object.entries(categoryMappings).map(([key, value]) => [value, key])
);

export const getCategorySlug = (categoryName) => {
  return categoryMappings[categoryName] || createCategorySlug(categoryName);
};

export const getCategoryFromSlug = (slug) => {
  return reverseCategoryMappings[slug] || slug;
};