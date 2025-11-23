/**
 * Generate JSON-LD structured data for SEO
 * https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */

interface ProductStructuredDataProps {
  name: string;
  description: string;
  image: string[];
  price: number;
  currency: string;
  condition: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition';
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  url: string;
  seller: {
    name: string;
    type: 'Person' | 'Organization';
  };
  category?: string;
  location?: string;
}

export function generateProductStructuredData(props: ProductStructuredDataProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: props.name,
    description: props.description,
    image: props.image,
    offers: {
      '@type': 'Offer',
      price: props.price,
      priceCurrency: props.currency,
      itemCondition: `https://schema.org/${props.condition}`,
      availability: `https://schema.org/${props.availability}`,
      url: props.url,
      seller: {
        '@type': props.seller.type,
        name: props.seller.name,
      },
    },
    ...(props.category && { category: props.category }),
    ...(props.location && { locationCreated: props.location }),
  };
}

interface BreadcrumbStructuredDataProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function generateBreadcrumbStructuredData(props: BreadcrumbStructuredDataProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: props.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface OrganizationStructuredDataProps {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[]; // Social media profiles
}

export function generateOrganizationStructuredData(props: OrganizationStructuredDataProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: props.name,
    url: props.url,
    logo: props.logo,
    description: props.description,
    ...(props.sameAs && { sameAs: props.sameAs }),
  };
}

interface WebsiteStructuredDataProps {
  name: string;
  url: string;
  description: string;
  searchUrl: string; // e.g., "https://thulobazaar.com/search?q={search_term_string}"
}

export function generateWebsiteStructuredData(props: WebsiteStructuredDataProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: props.name,
    url: props.url,
    description: props.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: props.searchUrl,
      'query-input': 'required name=search_term_string',
    },
  };
}
