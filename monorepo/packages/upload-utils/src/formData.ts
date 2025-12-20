/**
 * FormData Builder Utilities
 *
 * Platform-agnostic FormData construction that works on both Web and React Native.
 */

import type { CrossPlatformFile } from '@thulobazaar/types';

/**
 * Platform detection
 */
export const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
export const isWeb = typeof window !== 'undefined' && !isReactNative;

/**
 * Append a CrossPlatformFile to FormData
 * Handles both Web File objects and React Native file URIs
 */
export function appendFileToFormData(
  formData: FormData,
  fieldName: string,
  file: CrossPlatformFile
): void {
  if (isReactNative) {
    // React Native: Use the file URI format that fetch understands
    formData.append(fieldName, {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
  } else {
    // Web: Use the File object directly if available, otherwise create a Blob
    if (file.file instanceof File) {
      formData.append(fieldName, file.file, file.name);
    } else {
      // Fallback for cases where we only have URI (shouldn't happen on web)
      formData.append(fieldName, new Blob([]), file.name);
    }
  }
}

/**
 * Append multiple files to FormData
 */
export function appendFilesToFormData(
  formData: FormData,
  fieldName: string,
  files: CrossPlatformFile[]
): void {
  files.forEach((file) => {
    appendFileToFormData(formData, fieldName, file);
  });
}

/**
 * Create FormData for avatar upload
 */
export function createAvatarFormData(file: CrossPlatformFile): FormData {
  const formData = new FormData();
  appendFileToFormData(formData, 'avatar', file);
  return formData;
}

/**
 * Create FormData for cover upload
 */
export function createCoverFormData(file: CrossPlatformFile): FormData {
  const formData = new FormData();
  appendFileToFormData(formData, 'cover', file);
  return formData;
}

/**
 * Create FormData for ad images upload
 */
export function createAdImagesFormData(
  files: CrossPlatformFile[],
  existingImages?: string[]
): FormData {
  const formData = new FormData();
  appendFilesToFormData(formData, 'images', files);

  if (existingImages && existingImages.length > 0) {
    formData.append('existingImages', JSON.stringify(existingImages));
  }

  return formData;
}

/**
 * Create FormData for message image upload
 */
export function createMessageImageFormData(
  file: CrossPlatformFile,
  conversationId: number
): FormData {
  const formData = new FormData();
  appendFileToFormData(formData, 'image', file);
  formData.append('conversationId', conversationId.toString());
  return formData;
}

/**
 * Create FormData for business verification
 */
export function createBusinessVerificationFormData(data: {
  businessName: string;
  businessCategory?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessWebsite?: string;
  businessDescription?: string;
  licenseFile: CrossPlatformFile;
  durationDays?: number;
  paymentAmount?: number;
  paymentStatus?: string;
  paymentReference?: string;
}): FormData {
  const formData = new FormData();

  formData.append('business_name', data.businessName.trim());

  if (data.businessCategory) {
    formData.append('business_category', data.businessCategory.trim());
  }
  if (data.businessAddress) {
    formData.append('business_address', data.businessAddress.trim());
  }
  if (data.businessPhone) {
    formData.append('business_phone', data.businessPhone.trim());
  }
  if (data.businessWebsite) {
    formData.append('business_website', data.businessWebsite.trim());
  }
  if (data.businessDescription) {
    formData.append('business_description', data.businessDescription.trim());
  }
  if (data.durationDays !== undefined) {
    formData.append('duration_days', data.durationDays.toString());
  }
  if (data.paymentAmount !== undefined) {
    formData.append('payment_amount', data.paymentAmount.toString());
  }
  if (data.paymentStatus) {
    formData.append('payment_status', data.paymentStatus);
  }
  if (data.paymentReference) {
    formData.append('payment_reference', data.paymentReference);
  }

  appendFileToFormData(formData, 'business_license_document', data.licenseFile);

  return formData;
}

/**
 * Create FormData for individual verification
 */
export function createIndividualVerificationFormData(data: {
  fullName: string;
  verifiedSellerName?: string;
  idDocumentType: string;
  idDocumentNumber: string;
  idFrontFile: CrossPlatformFile;
  idBackFile?: CrossPlatformFile;
  selfieFile: CrossPlatformFile;
  durationDays?: number;
  paymentAmount?: number;
  paymentStatus?: string;
  paymentReference?: string;
}): FormData {
  const formData = new FormData();

  formData.append('full_name', data.fullName.trim());
  formData.append('id_document_type', data.idDocumentType);
  formData.append('id_document_number', data.idDocumentNumber.trim());

  if (data.verifiedSellerName) {
    formData.append('verified_seller_name', data.verifiedSellerName.trim());
  }
  if (data.durationDays !== undefined) {
    formData.append('duration_days', data.durationDays.toString());
  }
  if (data.paymentAmount !== undefined) {
    formData.append('payment_amount', data.paymentAmount.toString());
  }
  if (data.paymentStatus) {
    formData.append('payment_status', data.paymentStatus);
  }
  if (data.paymentReference) {
    formData.append('payment_reference', data.paymentReference);
  }

  appendFileToFormData(formData, 'id_document_front', data.idFrontFile);
  if (data.idBackFile) {
    appendFileToFormData(formData, 'id_document_back', data.idBackFile);
  }
  appendFileToFormData(formData, 'selfie_with_id', data.selfieFile);

  return formData;
}

/**
 * Merge additional data into FormData
 */
export function appendDataToFormData(
  formData: FormData,
  data: Record<string, string | number | boolean | undefined | null>
): void {
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
}
