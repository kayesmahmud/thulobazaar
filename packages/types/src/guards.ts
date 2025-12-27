/**
 * Type Guards for Runtime Type Checking
 * 2025 Best Practice: Use type guards instead of type assertions
 */

import type { User, Ad, Category, Location, ApiResponse } from './api';

// ============================================
// USER TYPE GUARDS
// ============================================

export function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as User).id === 'number' &&
    'email' in data &&
    typeof (data as User).email === 'string' &&
    'fullName' in data &&
    typeof (data as User).fullName === 'string'
  );
}

export function isUserArray(data: unknown): data is User[] {
  return Array.isArray(data) && data.every(isUser);
}

// ============================================
// AD TYPE GUARDS
// ============================================

export function isAd(data: unknown): data is Ad {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as Ad).id === 'number' &&
    'title' in data &&
    typeof (data as Ad).title === 'string' &&
    'price' in data &&
    typeof (data as Ad).price === 'number' &&
    'slug' in data &&
    typeof (data as Ad).slug === 'string'
  );
}

export function isAdArray(data: unknown): data is Ad[] {
  return Array.isArray(data) && data.every(isAd);
}

// ============================================
// CATEGORY TYPE GUARDS
// ============================================

export function isCategory(data: unknown): data is Category {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as Category).id === 'number' &&
    'name' in data &&
    typeof (data as Category).name === 'string' &&
    'slug' in data &&
    typeof (data as Category).slug === 'string'
  );
}

export function isCategoryArray(data: unknown): data is Category[] {
  return Array.isArray(data) && data.every(isCategory);
}

// ============================================
// LOCATION TYPE GUARDS
// ============================================

export function isLocation(data: unknown): data is Location {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as Location).id === 'number' &&
    'name' in data &&
    typeof (data as Location).name === 'string' &&
    'type' in data &&
    typeof (data as Location).type === 'string'
  );
}

export function isLocationArray(data: unknown): data is Location[] {
  return Array.isArray(data) && data.every(isLocation);
}

// ============================================
// API RESPONSE TYPE GUARDS
// ============================================

export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is { success: true; data: T } {
  return response.success === true;
}

export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is { success: false; error: string; message?: string } {
  return response.success === false;
}

/**
 * Generic API response validator
 * Usage:
 * const response = await fetch(...);
 * const data = await response.json();
 * if (isApiResponse(data, isUser)) {
 *   // data is ApiResponse<User>
 * }
 */
export function isApiResponse<T>(
  data: unknown,
  validator: (item: unknown) => item is T
): data is ApiResponse<T> {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as any;

  if (typeof obj.success !== 'boolean') {
    return false;
  }

  if (obj.success === true) {
    return 'data' in obj && validator(obj.data);
  } else {
    return 'error' in obj && typeof obj.error === 'string';
  }
}

// ============================================
// UTILITY TYPE GUARDS
// ============================================

/**
 * Check if value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is a valid email
 */
export function isEmail(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

/**
 * Check if value is a valid phone number (Nepali format)
 */
export function isPhone(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^9[0-9]{9}$/.test(value.replace(/[\s-]/g, ''))
  );
}

/**
 * Check if value is a valid slug
 */
export function isSlug(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  );
}

/**
 * Check if value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

/**
 * Check if value is a valid date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

// ============================================
// USAGE EXAMPLES
// ============================================

/**
 * Example 1: Safe API response handling
 *
 * const response = await fetch('/api/users/1');
 * const data = await response.json();
 *
 * if (isApiResponse(data, isUser)) {
 *   if (isSuccessResponse(data)) {
 *     console.log(data.data.fullName); // Type-safe!
 *   } else {
 *     console.error(data.error); // Type-safe!
 *   }
 * }
 */

/**
 * Example 2: Validate user input
 *
 * function processUser(data: unknown) {
 *   if (!isUser(data)) {
 *     throw new Error('Invalid user data');
 *   }
 *
 *   // Now TypeScript knows data is User
 *   console.log(data.fullName);
 * }
 */

/**
 * Example 3: Validate form data
 *
 * function validateForm(formData: FormData) {
 *   const email = formData.get('email');
 *   const phone = formData.get('phone');
 *
 *   if (!isEmail(email)) {
 *     return { error: 'Invalid email' };
 *   }
 *
 *   if (!isPhone(phone)) {
 *     return { error: 'Invalid phone' };
 *   }
 *
 *   return { success: true };
 * }
 */
