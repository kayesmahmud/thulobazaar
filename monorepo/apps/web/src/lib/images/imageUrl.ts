/**
 * Centralized Image URL Utilities
 *
 * Handles all uploaded images consistently:
 * - Avatars
 * - Cover photos
 * - Ad images
 * - Any other uploads
 *
 * Supports:
 * - External URLs (Google, Facebook OAuth avatars)
 * - Local uploads (stored on API server)
 * - Both full paths and filenames
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Get the full URL for any uploaded image
 *
 * @param imagePath - The image path from database (can be filename or full path or external URL)
 * @param folder - The folder where the image is stored (default: 'avatars')
 * @returns Full URL to the image or null if no image
 *
 * @example
 * // External URL (OAuth avatar)
 * getImageUrl('https://lh3.googleusercontent.com/...')
 * // Returns: 'https://lh3.googleusercontent.com/...'
 *
 * @example
 * // Full path already in DB
 * getImageUrl('uploads/avatars/avatar-123.jpg')
 * // Returns: 'http://localhost:5000/uploads/avatars/avatar-123.jpg'
 *
 * @example
 * // Just filename (old format)
 * getImageUrl('avatar-123.jpg', 'avatars')
 * // Returns: 'http://localhost:5000/uploads/avatars/avatar-123.jpg'
 *
 * @example
 * // Cover photo
 * getImageUrl('cover-123.jpg', 'avatars')
 * // Returns: 'http://localhost:5000/uploads/avatars/cover-123.jpg'
 *
 * @example
 * // Ad image
 * getImageUrl('uploads/ads/image-123.webp')
 * // Returns: 'http://localhost:5000/uploads/ads/image-123.webp'
 */
export function getImageUrl(
  imagePath: string | null | undefined,
  folder: 'avatars' | 'ads' | 'covers' = 'avatars'
): string | null {
  if (!imagePath) return null;

  // External URL (Google, Facebook, etc.) - return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Already has full path with 'uploads/' prefix
  if (imagePath.startsWith('uploads/')) {
    return `${API_URL}/${imagePath}`;
  }

  // Just filename - construct full path
  return `${API_URL}/uploads/${folder}/${imagePath}`;
}

/**
 * Get avatar URL (convenience wrapper)
 */
export function getAvatarUrl(avatar: string | null | undefined): string | null {
  return getImageUrl(avatar, 'avatars');
}

/**
 * Get cover photo URL (convenience wrapper)
 */
export function getCoverUrl(cover: string | null | undefined): string | null {
  return getImageUrl(cover, 'covers');
}

/**
 * Get ad image URL (convenience wrapper)
 */
export function getAdImageUrl(imagePath: string | null | undefined): string | null {
  return getImageUrl(imagePath, 'ads');
}

/**
 * Check if image URL is external (OAuth provider)
 */
export function isExternalImage(imagePath: string | null | undefined): boolean {
  if (!imagePath) return false;
  return imagePath.startsWith('http://') || imagePath.startsWith('https://');
}

/**
 * Get the API base URL (useful for other API calls)
 */
export function getApiUrl(): string {
  return API_URL;
}
