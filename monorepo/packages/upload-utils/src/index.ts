/**
 * @thulobazaar/upload-utils
 *
 * Platform-agnostic upload utilities for ThuluBazaar.
 *
 * Usage:
 * - Import from '@thulobazaar/upload-utils' for common utilities
 * - Import from '@thulobazaar/upload-utils/web' for web-specific (File API)
 * - Import from '@thulobazaar/upload-utils/native' for React Native (expo-image-picker)
 *
 * @example Web usage:
 * ```typescript
 * import { validateFile, createAvatarFormData } from '@thulobazaar/upload-utils';
 * import { fileToUploadFile } from '@thulobazaar/upload-utils/web';
 *
 * const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *   const file = e.target.files?.[0];
 *   if (!file) return;
 *
 *   const uploadFile = fileToUploadFile(file);
 *   const validation = validateAvatarFile(uploadFile);
 *
 *   if (!validation.valid) {
 *     alert(validation.errors.join('\n'));
 *     return;
 *   }
 *
 *   const formData = createAvatarFormData(uploadFile);
 *   // Upload formData...
 * };
 * ```
 *
 * @example React Native usage:
 * ```typescript
 * import { validateFile, createAvatarFormData } from '@thulobazaar/upload-utils';
 * import {
 *   imagePickerResultToSingleFile,
 *   getAvatarPickerOptions
 * } from '@thulobazaar/upload-utils/native';
 * import * as ImagePicker from 'expo-image-picker';
 *
 * const pickAvatar = async () => {
 *   const result = await ImagePicker.launchImageLibraryAsync(getAvatarPickerOptions());
 *   const uploadFile = imagePickerResultToSingleFile(result);
 *
 *   if (!uploadFile) return; // User cancelled
 *
 *   const validation = validateAvatarFile(uploadFile);
 *   if (!validation.valid) {
 *     Alert.alert('Error', validation.errors.join('\n'));
 *     return;
 *   }
 *
 *   const formData = createAvatarFormData(uploadFile);
 *   // Upload formData...
 * };
 * ```
 */

// Export validation utilities
export {
  validateFile,
  validateFiles,
  validateAvatarFile,
  validateCoverFile,
  validateAdImages,
  validateMessageImage,
  validateVerificationDoc,
  formatFileSize,
  getValidationErrorCode,
  isImageFile,
  isPdfFile,
  getFileExtension,
  getMimeTypeFromExtension,
  UPLOAD_LIMITS,
  UPLOAD_LIMITS_DISPLAY,
  UPLOAD_CONFIGS,
  VALIDATION_ERRORS,
} from './validation';

// Export FormData utilities
export {
  isReactNative,
  isWeb,
  appendFileToFormData,
  appendFilesToFormData,
  createAvatarFormData,
  createCoverFormData,
  createAdImagesFormData,
  createMessageImageFormData,
  createBusinessVerificationFormData,
  createIndividualVerificationFormData,
  appendDataToFormData,
} from './formData';

// Re-export types from @thulobazaar/types for convenience
export type {
  CrossPlatformFile,
  CrossPlatformImage,
  ImageDimensions,
  UploadProgress,
  UploadProgressCallback,
  UploadResult,
  MultiUploadResult,
  UploadConfig,
  FileValidationResult,
  ValidationErrorCode,
} from '@thulobazaar/types';

export {
  UPLOAD_FOLDERS,
  ALLOWED_MIME_TYPES,
} from '@thulobazaar/types';
