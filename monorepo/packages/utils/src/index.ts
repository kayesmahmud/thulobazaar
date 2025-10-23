// ============================================
// DATE UTILITIES
// ============================================

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;

  return formatDate(date);
};

export const isExpired = (expiryDate: Date | string): boolean => {
  return new Date(expiryDate) < new Date();
};

// ============================================
// PRICE UTILITIES
// ============================================

export const formatPrice = (price: number, currency: string = 'Rs.'): string => {
  return `${currency} ${price.toLocaleString('en-NP')}`;
};

export const formatPriceShort = (price: number): string => {
  if (price >= 10000000) return `${(price / 10000000).toFixed(1)}Cr`;
  if (price >= 100000) return `${(price / 100000).toFixed(1)}L`;
  if (price >= 1000) return `${(price / 1000).toFixed(1)}K`;
  return price.toString();
};

// ============================================
// STRING UTILITIES
// ============================================

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const extractFirstImage = (images: string[]): string | null => {
  return images && images.length > 0 ? images[0] : null;
};

// ============================================
// VALIDATION UTILITIES
// ============================================

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Nepali phone number validation (10 digits starting with 9)
  const phoneRegex = /^9[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================
// URL UTILITIES
// ============================================

export const buildUrl = (base: string, params: Record<string, any>): string => {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
};

export const getImageUrl = (imagePath: string, baseUrl?: string): string => {
  if (imagePath.startsWith('http')) return imagePath;
  const base = baseUrl || process.env.NEXT_PUBLIC_API_URL || '';
  return `${base}${imagePath}`;
};

// ============================================
// LOCATION UTILITIES
// ============================================

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const formatDistance = (distanceInKm: number): string => {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)}m away`;
  }
  return `${distanceInKm.toFixed(1)}km away`;
};

// ============================================
// ARRAY UTILITIES
// ============================================

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// ============================================
// STORAGE UTILITIES (works on both web and mobile)
// ============================================

export interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class StorageManager {
  constructor(private storage: Storage) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.storage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await this.storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage error:', error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.storage.removeItem(key);
    } catch (error) {
      console.error('Storage error:', error);
    }
  }
}

// ============================================
// SEO UTILITIES
// ============================================

export const generateAdUrl = (slug: string, lang: string = 'en'): string => {
  return `/${lang}/ad/${slug}`;
};

export const generateBrowseUrl = (
  lang: string = 'en',
  location?: string,
  category?: string,
  subcategory?: string
): string => {
  const parts = [lang, 'ads'];

  if (location) parts.push(location);
  if (category) parts.push(category);
  if (subcategory) parts.push(subcategory);

  return '/' + parts.join('/');
};

export const generateMetaDescription = (ad: {
  title: string;
  price: number;
  description: string;
  location?: string;
}): string => {
  return truncate(
    `${ad.title} - ${formatPrice(ad.price)}. ${ad.description}${
      ad.location ? ` Located in ${ad.location}.` : ''
    }`,
    160
  );
};

// ============================================
// PERFORMANCE UTILITIES
// ============================================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, wait);
    }
  };
}

// ============================================
// ENHANCED DATE UTILITIES
// ============================================

export const formatDateTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const timeString = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago • ${timeString}`;
  if (diffDays === 1) return `Yesterday • ${timeString}`;
  if (diffDays <= 7) return `${diffDays} days ago • ${timeString}`;

  return `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })} • ${timeString}`;
};

export const formatFullDateTime = (dateString: string | Date): string => {
  const date = new Date(dateString);

  return `${date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })} at ${date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })}`;
};

// ============================================
// ENHANCED FORMATTING UTILITIES
// ============================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-NP').format(num);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================
// VALIDATION UTILITIES (ENHANCED)
// ============================================

export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  const regex = /^(98|97)\d{8}$/;
  return regex.test(cleaned);
}

// ============================================
// OBJECT/ARRAY UTILITIES (ENHANCED)
// ============================================

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function isEmpty(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

// ============================================
// URL UTILITIES (ENHANCED)
// ============================================

export function getQueryParams(url: string = typeof window !== 'undefined' ? window.location.href : ''): Record<string, string> {
  if (!url) return {};

  try {
    const params = new URL(url).searchParams;
    const result: Record<string, string> = {};

    for (const [key, value] of params) {
      result[key] = value;
    }

    return result;
  } catch {
    return {};
  }
}

export function buildQueryString(params: Record<string, any>): string {
  return Object.entries(params)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export const extractAdIdFromUrl = (urlPath: string): number | null => {
  if (!urlPath) return null;

  // Extract ID from end of URL (after double dash --)
  const matches = urlPath.match(/--(\d+)$/);

  // Fallback to single dash for backward compatibility
  if (!matches) {
    const fallbackMatches = urlPath.match(/-(\d+)$/);
    return fallbackMatches ? parseInt(fallbackMatches[1], 10) : null;
  }

  return parseInt(matches[1], 10);
};

export const parseBrowseUrl = (urlPath: string): { locationSlug: string | null; categorySlug: string | null; subcategorySlug: string | null } => {
  if (!urlPath) return { locationSlug: null, categorySlug: null, subcategorySlug: null };

  const parts = urlPath.split('/').filter(part => part);

  if (parts[0] !== 'ads') {
    return { locationSlug: null, categorySlug: null, subcategorySlug: null };
  }

  const result = {
    locationSlug: null as string | null,
    categorySlug: null as string | null,
    subcategorySlug: null as string | null
  };

  if (parts.length >= 2) result.locationSlug = parts[1];
  if (parts.length >= 3) result.categorySlug = parts[2];
  if (parts.length >= 4) result.subcategorySlug = parts[3];

  return result;
};

// ============================================
// SEO UTILITIES (ENHANCED)
// ============================================

export const generateBreadcrumbs = (params: {
  categoryName?: string;
  locationName?: string;
  adTitle?: string
}): Array<{ label: string; url: string; active: boolean }> => {
  const breadcrumbs = [
    { label: 'Home', url: '/', active: false }
  ];

  const { categoryName, locationName, adTitle } = params;

  if (locationName && categoryName) {
    breadcrumbs.push(
      { label: locationName, url: `/ads/${slugify(locationName)}`, active: false },
      { label: categoryName, url: `/ads/${slugify(locationName)}/${slugify(categoryName)}`, active: false }
    );
  } else if (locationName) {
    breadcrumbs.push(
      { label: locationName, url: `/ads/${slugify(locationName)}`, active: false }
    );
  } else if (categoryName) {
    breadcrumbs.push(
      { label: categoryName, url: `/ads/category/${slugify(categoryName)}`, active: false }
    );
  }

  if (adTitle) {
    breadcrumbs.push(
      { label: adTitle, url: '', active: true }
    );
  }

  return breadcrumbs;
};

export const generateMetaTitle = (params: {
  adTitle?: string;
  categoryName?: string;
  locationName?: string;
  siteName?: string;
}): string => {
  const { adTitle, categoryName, locationName, siteName = 'Thulobazaar' } = params;

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

// ============================================
// BROWSER/DEVICE UTILITIES (WEB ONLY)
// ============================================

export function isMobile(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

export function downloadFile(url: string, filename: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================
// GEOLOCATION UTILITIES (WEB ONLY)
// ============================================

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const getUserLocation = (): Promise<UserLocation> => {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "User denied the request for Geolocation.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get user location timed out.";
            break;
          default:
            errorMessage = "An unknown error occurred.";
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

// ============================================
// MISC UTILITIES
// ============================================

export function randomId(length: number = 8): string {
  return Math.random().toString(36).substring(2, length + 2);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// RECENTLY VIEWED UTILITIES
// ============================================

const RECENTLY_VIEWED_KEY = 'thulobazaar_recently_viewed';
const MAX_RECENTLY_VIEWED = 10;

export interface RecentlyViewedAd {
  id: number;
  title: string;
  price: number;
  primary_image?: string | null;
  location_name: string;
  created_at: string | Date;
}

export const recentlyViewedUtils = {
  // Add an ad to recently viewed
  addToRecentlyViewed: (ad: RecentlyViewedAd): void => {
    try {
      const existing = recentlyViewedUtils.getRecentlyViewed();

      // Remove if already exists to avoid duplicates
      const filtered = existing.filter(item => item.id !== ad.id);

      // Add to beginning of array
      const updated = [ad, ...filtered];

      // Keep only the most recent MAX_RECENTLY_VIEWED items
      const trimmed = updated.slice(0, MAX_RECENTLY_VIEWED);

      if (typeof window !== 'undefined') {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(trimmed));
      }

      console.log(`✅ Added to recently viewed: ${ad.title}`);
    } catch (error) {
      console.error('❌ Error adding to recently viewed:', error);
    }
  },

  // Get recently viewed ads
  getRecentlyViewed: (): RecentlyViewedAd[] => {
    try {
      if (typeof window === 'undefined') return [];
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error getting recently viewed:', error);
      return [];
    }
  },

  // Remove an ad from recently viewed
  removeFromRecentlyViewed: (adId: number): void => {
    try {
      const existing = recentlyViewedUtils.getRecentlyViewed();
      const filtered = existing.filter(item => item.id !== adId);

      if (typeof window !== 'undefined') {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(filtered));
      }

      console.log(`✅ Removed from recently viewed: ${adId}`);
    } catch (error) {
      console.error('❌ Error removing from recently viewed:', error);
    }
  },

  // Clear all recently viewed
  clearRecentlyViewed: (): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(RECENTLY_VIEWED_KEY);
      }
      console.log('✅ Cleared recently viewed ads');
    } catch (error) {
      console.error('❌ Error clearing recently viewed:', error);
    }
  },

  // Get count of recently viewed
  getRecentlyViewedCount: (): number => {
    return recentlyViewedUtils.getRecentlyViewed().length;
  }
};
