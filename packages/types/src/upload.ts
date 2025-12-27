/**
 * @thulobazaar/types - Upload Types & Constants
 *
 * Platform-agnostic upload types that work on both Web and React Native.
 * These types abstract away the differences between:
 * - Web: File object
 * - React Native: expo-image-picker result
 */

// ============================================================================
// UPLOAD CONSTANTS
// ============================================================================

/**
 * Maximum file sizes in bytes
 */
export const UPLOAD_LIMITS = {
  AVATAR: 5 * 1024 * 1024, // 5MB
  COVER: 10 * 1024 * 1024, // 10MB
  AD_IMAGE: 10 * 1024 * 1024, // 10MB per image
  AD_IMAGES_COUNT: 10, // Max 10 images per ad
  MESSAGE_IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB (verification docs)
  VERIFICATION_DOC: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * Allowed MIME types by upload category
 */
export const ALLOWED_MIME_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  IMAGE_WITH_HEIC: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
  ],
  DOCUMENT: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
  ],
} as const;

/**
 * Upload folder paths (relative to uploads directory)
 */
export const UPLOAD_FOLDERS = {
  AVATARS: 'uploads/avatars',
  COVERS: 'uploads/covers',
  ADS: 'uploads/ads',
  MESSAGES: 'uploads/messages',
  DOCUMENTS: 'uploads/documents',
  BUSINESS_VERIFICATION: 'uploads/business_verification',
  INDIVIDUAL_VERIFICATION: 'uploads/individual_verification',
} as const;

/**
 * Human-readable file size limits for UI
 */
export const UPLOAD_LIMITS_DISPLAY = {
  AVATAR: '5MB',
  COVER: '10MB',
  AD_IMAGE: '10MB',
  MESSAGE_IMAGE: '5MB',
  DOCUMENT: '10MB',
  VERIFICATION_DOC: '5MB',
} as const;

// ============================================================================
// PLATFORM-AGNOSTIC FILE TYPES
// ============================================================================

/**
 * Cross-platform file representation
 * Works with both Web File API and React Native image picker
 */
export interface CrossPlatformFile {
  /** File name with extension */
  name: string;
  /** MIME type (e.g., 'image/jpeg') */
  type: string;
  /** File size in bytes */
  size: number;
  /**
   * File URI/path
   * - Web: blob URL or data URL
   * - React Native: file:// URI from image picker
   */
  uri: string;
  /**
   * Original file object (platform-specific)
   * - Web: File object
   * - React Native: undefined (use uri instead)
   */
  file?: File;
}

/**
 * Image dimensions
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Extended file info with image metadata
 */
export interface CrossPlatformImage extends CrossPlatformFile {
  /** Image dimensions (if available) */
  dimensions?: ImageDimensions;
  /** Base64 encoded data (optional, for preview) */
  base64?: string;
}

// ============================================================================
// UPLOAD REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Upload progress callback
 */
export type UploadProgressCallback = (progress: UploadProgress) => void;

/**
 * Upload progress information
 */
export interface UploadProgress {
  /** Bytes uploaded so far */
  loaded: number;
  /** Total bytes to upload */
  total: number;
  /** Progress percentage (0-100) */
  percentage: number;
}

/**
 * Upload result
 */
export interface UploadResult {
  success: boolean;
  /** Uploaded file path/URL (relative or absolute) */
  url?: string;
  /** Original filename */
  filename?: string;
  /** Error message if upload failed */
  error?: string;
}

/**
 * Multiple files upload result
 */
export interface MultiUploadResult {
  success: boolean;
  /** Array of uploaded file URLs */
  urls?: string[];
  /** Array of uploaded filenames */
  filenames?: string[];
  /** Partial success - some files failed */
  partialSuccess?: boolean;
  /** Failed file indices and their errors */
  failures?: Array<{ index: number; error: string }>;
  /** Overall error message */
  error?: string;
}

// ============================================================================
// UPLOAD CONFIGURATION TYPES
// ============================================================================

/**
 * Upload configuration options
 */
export interface UploadConfig {
  /** Maximum file size in bytes */
  maxSize: number;
  /** Allowed MIME types */
  allowedTypes: readonly string[];
  /** Maximum number of files (for multi-upload) */
  maxFiles?: number;
  /** Enable image compression before upload */
  compress?: boolean;
  /** Compression quality (0-1, default 0.8) */
  compressionQuality?: number;
  /** Maximum image dimension (will resize if larger) */
  maxDimension?: number;
}

/**
 * Predefined upload configurations
 */
export const UPLOAD_CONFIGS: Record<string, UploadConfig> = {
  avatar: {
    maxSize: UPLOAD_LIMITS.AVATAR,
    allowedTypes: ALLOWED_MIME_TYPES.IMAGE,
    maxFiles: 1,
    compress: true,
    compressionQuality: 0.8,
    maxDimension: 500,
  },
  cover: {
    maxSize: UPLOAD_LIMITS.COVER,
    allowedTypes: ALLOWED_MIME_TYPES.IMAGE,
    maxFiles: 1,
    compress: true,
    compressionQuality: 0.85,
    maxDimension: 1920,
  },
  adImage: {
    maxSize: UPLOAD_LIMITS.AD_IMAGE,
    allowedTypes: ALLOWED_MIME_TYPES.IMAGE,
    maxFiles: UPLOAD_LIMITS.AD_IMAGES_COUNT,
    compress: true,
    compressionQuality: 0.85,
    maxDimension: 1920,
  },
  messageImage: {
    maxSize: UPLOAD_LIMITS.MESSAGE_IMAGE,
    allowedTypes: ALLOWED_MIME_TYPES.IMAGE,
    maxFiles: 1,
    compress: true,
    compressionQuality: 0.8,
    maxDimension: 1200,
  },
  verificationDoc: {
    maxSize: UPLOAD_LIMITS.VERIFICATION_DOC,
    allowedTypes: ALLOWED_MIME_TYPES.DOCUMENT,
    maxFiles: 1,
    compress: false, // Don't compress documents
  },
} as const;

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validation error codes
 */
export const VALIDATION_ERRORS = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_TYPE: 'INVALID_TYPE',
  TOO_MANY_FILES: 'TOO_MANY_FILES',
  NO_FILE: 'NO_FILE',
  INVALID_DIMENSIONS: 'INVALID_DIMENSIONS',
} as const;

export type ValidationErrorCode = (typeof VALIDATION_ERRORS)[keyof typeof VALIDATION_ERRORS];
