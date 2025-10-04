/**
 * SEO utility functions for meta tags and structured data
 */

/**
 * Update document title
 * @param {string} title - Page title
 * @param {string} siteName - Site name (default: Thulobazaar)
 */
export function setTitle(title, siteName = 'Thulobazaar') {
  document.title = title ? `${title} | ${siteName}` : siteName;
}

/**
 * Set meta tag
 * @param {string} name - Meta tag name or property
 * @param {string} content - Meta tag content
 * @param {string} type - 'name' or 'property'
 */
export function setMeta(name, content, type = 'name') {
  if (!content) return;

  let meta = document.querySelector(`meta[${type}="${name}"]`);

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(type, name);
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', content);
}

/**
 * Set multiple meta tags
 * @param {Object} tags - Object with meta tag name/content pairs
 */
export function setMetaTags(tags) {
  Object.entries(tags).forEach(([name, content]) => {
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      setMeta(name, content, 'property');
    } else {
      setMeta(name, content, 'name');
    }
  });
}

/**
 * Set page SEO (title, description, keywords, og tags)
 * @param {Object} seo - SEO configuration
 */
export function setPageSEO(seo) {
  const {
    title,
    description,
    keywords,
    image,
    url,
    type = 'website',
    siteName = 'Thulobazaar',
    locale = 'en_NP',
    twitterCard = 'summary_large_image'
  } = seo;

  // Set title
  setTitle(title, siteName);

  // Basic meta tags
  const metaTags = {
    'description': description,
    'keywords': keywords
  };

  // Open Graph tags
  if (title) metaTags['og:title'] = title;
  if (description) metaTags['og:description'] = description;
  if (image) metaTags['og:image'] = image;
  if (url) metaTags['og:url'] = url;
  if (type) metaTags['og:type'] = type;
  if (siteName) metaTags['og:site_name'] = siteName;
  if (locale) metaTags['og:locale'] = locale;

  // Twitter Card tags
  if (twitterCard) metaTags['twitter:card'] = twitterCard;
  if (title) metaTags['twitter:title'] = title;
  if (description) metaTags['twitter:description'] = description;
  if (image) metaTags['twitter:image'] = image;

  setMetaTags(metaTags);
}

/**
 * Generate structured data (JSON-LD) for products
 * @param {Object} product - Product data
 * @returns {Object} - Structured data object
 */
export function generateProductSchema(product) {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    'name': product.title,
    'description': product.description,
    'image': product.image || product.primary_image,
    'offers': {
      '@type': 'Offer',
      'price': product.price,
      'priceCurrency': 'NPR',
      'availability': 'https://schema.org/InStock',
      'seller': {
        '@type': 'Person',
        'name': product.seller_name
      }
    },
    'category': product.category_name
  };
}

/**
 * Generate breadcrumb structured data
 * @param {Array} breadcrumbs - Array of breadcrumb items {name, url}
 * @returns {Object} - Structured data object
 */
export function generateBreadcrumbSchema(breadcrumbs) {
  return {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }))
  };
}

/**
 * Inject structured data into page
 * @param {Object} schema - Structured data object
 * @param {string} id - Script element ID (optional)
 */
export function injectStructuredData(schema, id = 'structured-data') {
  // Remove existing structured data if any
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  // Create script element
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);

  // Append to head
  document.head.appendChild(script);
}

/**
 * Pre-defined SEO configurations for common pages
 */
export const seoConfigs = {
  home: {
    title: 'Buy & Sell in Nepal - Free Classifieds',
    description: 'Thulobazaar is Nepal\'s largest online classifieds marketplace. Buy and sell cars, mobiles, electronics, furniture, and more. Post free ads today!',
    keywords: 'nepal classifieds, buy sell nepal, online marketplace nepal, free ads nepal',
    type: 'website'
  },

  browse: (category) => ({
    title: `${category} for Sale in Nepal`,
    description: `Browse ${category} ads in Nepal. Find great deals on ${category}. Buy and sell ${category} online on Thulobazaar.`,
    keywords: `${category} nepal, buy ${category}, sell ${category}, ${category} classifieds`,
    type: 'website'
  }),

  adDetail: (ad) => ({
    title: ad.title,
    description: ad.description?.substring(0, 160) || ad.title,
    keywords: `${ad.category_name}, ${ad.location_name}, buy, sell, nepal`,
    image: ad.primary_image ? `http://localhost:5000/uploads/ads/${ad.primary_image}` : undefined,
    url: window.location.href,
    type: 'product'
  }),

  postAd: {
    title: 'Post Free Ad',
    description: 'Post your ad on Thulobazaar for free. Sell your products and services to thousands of buyers across Nepal.',
    keywords: 'post ad, free ad, sell online, classifieds nepal',
    type: 'website'
  },

  search: (query) => ({
    title: `Search Results for "${query}"`,
    description: `Find ${query} in Nepal on Thulobazaar. Browse ads, compare prices, and connect with sellers.`,
    keywords: `${query}, search, buy, sell, nepal`,
    type: 'website'
  })
};

/**
 * Hook to set page SEO
 * @param {Object} seo - SEO configuration
 */
export function useSEO(seo) {
  if (typeof window === 'undefined') return;

  setPageSEO(seo);
}

export default {
  setTitle,
  setMeta,
  setMetaTags,
  setPageSEO,
  generateProductSchema,
  generateBreadcrumbSchema,
  injectStructuredData,
  seoConfigs,
  useSEO
};
