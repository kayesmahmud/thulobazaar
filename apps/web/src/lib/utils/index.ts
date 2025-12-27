/**
 * General Utilities
 * =================
 * Common utility functions used across the application
 *
 * Usage:
 *   import { formatDate, processMultipleImages } from '@/lib/utils';
 */

// Date utilities
export {
  getRelativeTime,
  formatDate,
  formatDateTime,
  isToday,
  isWithinDays,
} from './date';

// Image processing utilities
export {
  isValidImageType,
  processAndSaveImage,
  processMultipleImages,
  deleteImage,
  deleteMultipleImages,
  type ProcessedImage,
  type ImageProcessingOptions,
} from './image';

// Console filter (dev tools)
export {
  initConsoleFilter,
  removeConsoleFilter,
} from './console';

// Structured data (SEO)
export {
  generateProductStructuredData,
  generateBreadcrumbStructuredData,
  generateOrganizationStructuredData,
  generateWebsiteStructuredData,
} from './structuredData';
