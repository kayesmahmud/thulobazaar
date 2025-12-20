/**
 * File Validation Utilities
 *
 * Platform-agnostic validation that works on both Web and React Native.
 */

import type {
  CrossPlatformFile,
  UploadConfig,
  FileValidationResult,
  ValidationErrorCode,
} from '@thulobazaar/types';
import {
  UPLOAD_CONFIGS,
  UPLOAD_LIMITS,
  UPLOAD_LIMITS_DISPLAY,
  VALIDATION_ERRORS,
} from '@thulobazaar/types';

/**
 * Format bytes to human-readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate a single file against upload configuration
 */
export function validateFile(
  file: CrossPlatformFile,
  config: UploadConfig
): FileValidationResult {
  const errors: string[] = [];

  // Check file size
  if (file.size > config.maxSize) {
    errors.push(
      `File size (${formatFileSize(file.size)}) exceeds maximum allowed (${formatFileSize(config.maxSize)})`
    );
  }

  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    errors.push(
      `File type "${file.type}" is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: CrossPlatformFile[],
  config: UploadConfig
): FileValidationResult {
  const errors: string[] = [];

  // Check file count
  if (config.maxFiles && files.length > config.maxFiles) {
    errors.push(
      `Too many files. Maximum allowed: ${config.maxFiles}, received: ${files.length}`
    );
  }

  // Validate each file
  files.forEach((file, index) => {
    const result = validateFile(file, config);
    if (!result.valid) {
      errors.push(`File ${index + 1} (${file.name}): ${result.errors.join(', ')}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get validation error code from error message
 */
export function getValidationErrorCode(error: string): ValidationErrorCode {
  if (error.includes('size') || error.includes('exceeds')) {
    return VALIDATION_ERRORS.FILE_TOO_LARGE;
  }
  if (error.includes('type') || error.includes('allowed')) {
    return VALIDATION_ERRORS.INVALID_TYPE;
  }
  if (error.includes('many') || error.includes('maximum')) {
    return VALIDATION_ERRORS.TOO_MANY_FILES;
  }
  return VALIDATION_ERRORS.INVALID_TYPE;
}

/**
 * Validate file for avatar upload
 */
export function validateAvatarFile(file: CrossPlatformFile): FileValidationResult {
  return validateFile(file, UPLOAD_CONFIGS.avatar);
}

/**
 * Validate file for cover upload
 */
export function validateCoverFile(file: CrossPlatformFile): FileValidationResult {
  return validateFile(file, UPLOAD_CONFIGS.cover);
}

/**
 * Validate files for ad image upload
 */
export function validateAdImages(files: CrossPlatformFile[]): FileValidationResult {
  return validateFiles(files, UPLOAD_CONFIGS.adImage);
}

/**
 * Validate file for message image upload
 */
export function validateMessageImage(file: CrossPlatformFile): FileValidationResult {
  return validateFile(file, UPLOAD_CONFIGS.messageImage);
}

/**
 * Validate file for verification document upload
 */
export function validateVerificationDoc(file: CrossPlatformFile): FileValidationResult {
  return validateFile(file, UPLOAD_CONFIGS.verificationDoc);
}

/**
 * Check if file is an image based on MIME type
 */
export function isImageFile(file: CrossPlatformFile): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if file is a PDF
 */
export function isPdfFile(file: CrossPlatformFile): boolean {
  return file.type === 'application/pdf';
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    pdf: 'application/pdf',
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

// Re-export constants for convenience
export {
  UPLOAD_LIMITS,
  UPLOAD_LIMITS_DISPLAY,
  UPLOAD_CONFIGS,
  VALIDATION_ERRORS,
};
