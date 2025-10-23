/**
 * Verification Status TypeScript Enums
 *
 * Centralized verification status types and enums to ensure type safety
 * and prevent typos across the frontend application.
 *
 * IMPORTANT: These values must match backend constants and database enum types
 */

/**
 * Business Verification Status Enum
 * Matches database column: users.business_verification_status
 */
export enum BusinessVerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

/**
 * Account Type Enum
 * Matches database column: users.account_type
 */
export enum AccountType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business'
}

/**
 * Ad Status Enum
 * Matches database column: ads.status
 */
export enum AdStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

/**
 * Badge Type for Verification Display
 */
export enum BadgeType {
  GOLDEN = 'golden',
  BLUE = 'blue'
}

/**
 * TypeScript Types for Verification
 */
export type BusinessVerificationStatusType = BusinessVerificationStatus | null;
export type IndividualVerifiedType = boolean;
export type AccountTypeType = AccountType;
export type AdStatusType = AdStatus;

/**
 * User Verification Interface
 */
export interface UserVerification {
  business_verification_status: BusinessVerificationStatusType;
  individual_verified: IndividualVerifiedType;
  account_type?: AccountTypeType;
}

/**
 * Ad with Seller Verification Interface
 */
export interface AdWithVerification {
  id: number;
  title: string;
  seller_name: string;
  business_verification_status: BusinessVerificationStatusType;
  individual_verified: IndividualVerifiedType;
  // ... other ad fields
}

/**
 * Helper function to check if a business is verified
 */
export function isBusinessVerified(
  businessVerificationStatus: BusinessVerificationStatusType
): boolean {
  return businessVerificationStatus === BusinessVerificationStatus.APPROVED;
}

/**
 * Helper function to check if an individual is verified
 */
export function isIndividualVerified(individualVerified: IndividualVerifiedType): boolean {
  return individualVerified === true;
}

/**
 * Helper function to get verification display text
 */
export function getVerificationDisplayText(
  businessVerificationStatus: BusinessVerificationStatusType,
  individualVerified: IndividualVerifiedType
): string {
  if (isBusinessVerified(businessVerificationStatus)) {
    return 'Verified Business Account';
  }
  if (isIndividualVerified(individualVerified)) {
    return 'Verified Individual Seller';
  }
  return 'Seller';
}

/**
 * Helper function to get verification badge type
 */
export function getVerificationBadgeType(
  businessVerificationStatus: BusinessVerificationStatusType,
  individualVerified: IndividualVerifiedType
): BadgeType | null {
  if (isBusinessVerified(businessVerificationStatus)) {
    return BadgeType.GOLDEN;
  }
  if (isIndividualVerified(individualVerified)) {
    return BadgeType.BLUE;
  }
  return null;
}

/**
 * Helper function to get badge image path
 */
export function getVerificationBadgeImagePath(
  businessVerificationStatus: BusinessVerificationStatusType,
  individualVerified: IndividualVerifiedType
): string | null {
  const badgeType = getVerificationBadgeType(businessVerificationStatus, individualVerified);

  if (badgeType === BadgeType.GOLDEN) {
    return '/golden-badge.png';
  }
  if (badgeType === BadgeType.BLUE) {
    return '/blue-badge.png';
  }
  return null;
}

/**
 * Helper function to get badge alt text
 */
export function getVerificationBadgeAltText(
  businessVerificationStatus: BusinessVerificationStatusType,
  individualVerified: IndividualVerifiedType
): string | null {
  if (isBusinessVerified(businessVerificationStatus)) {
    return 'Verified Business';
  }
  if (isIndividualVerified(individualVerified)) {
    return 'Verified Seller';
  }
  return null;
}

/**
 * Helper function to get badge title (tooltip)
 */
export function getVerificationBadgeTitle(
  businessVerificationStatus: BusinessVerificationStatusType,
  individualVerified: IndividualVerifiedType
): string | null {
  return getVerificationDisplayText(businessVerificationStatus, individualVerified);
}
