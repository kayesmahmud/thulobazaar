/**
 * Verification Status Utilities
 * Helpers to check verification status considering expiration dates
 */

export interface UserVerificationInfo {
  individual_verified: boolean | null;
  individual_verification_expires_at: Date | null;
  business_verification_status: string | null;
  business_verification_expires_at: Date | null;
  account_type: string | null;
}

/**
 * Check if individual verification is currently active (verified and not expired)
 */
export function isIndividualVerificationActive(user: UserVerificationInfo | null): boolean {
  if (!user) return false;
  if (!user.individual_verified) return false;

  // If no expiry date is set, consider it active (legacy data)
  if (!user.individual_verification_expires_at) return true;

  const expiryDate = new Date(user.individual_verification_expires_at);
  return expiryDate > new Date();
}

/**
 * Check if business verification is currently active (verified and not expired)
 */
export function isBusinessVerificationActive(user: UserVerificationInfo | null): boolean {
  if (!user) return false;

  const verifiedStatuses = ['approved', 'verified'];
  if (!verifiedStatuses.includes(user.business_verification_status || '')) return false;

  // If no expiry date is set, consider it active (legacy data)
  if (!user.business_verification_expires_at) return true;

  const expiryDate = new Date(user.business_verification_expires_at);
  return expiryDate > new Date();
}

/**
 * Get the appropriate badge type for a user
 * Returns 'gold' for verified business, 'blue' for verified individual, or null for no badge
 */
export function getUserBadgeType(user: UserVerificationInfo | null): 'gold' | 'blue' | null {
  if (!user) return null;

  // Business verification takes priority (gold badge)
  if (isBusinessVerificationActive(user)) {
    return 'gold';
  }

  // Individual verification (blue badge)
  if (isIndividualVerificationActive(user)) {
    return 'blue';
  }

  return null;
}

/**
 * Get days remaining until verification expires
 * Returns null if verification is not active or already expired
 */
export function getDaysUntilExpiry(
  user: UserVerificationInfo | null,
  type: 'individual' | 'business'
): number | null {
  if (!user) return null;

  const expiryDate = type === 'individual'
    ? user.individual_verification_expires_at
    : user.business_verification_expires_at;

  if (!expiryDate) return null;

  const expiry = new Date(expiryDate);
  const now = new Date();

  if (expiry <= now) return null;

  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if verification is expiring soon (within 30 days)
 */
export function isVerificationExpiringSoon(
  user: UserVerificationInfo | null,
  type: 'individual' | 'business'
): boolean {
  const daysRemaining = getDaysUntilExpiry(user, type);
  if (daysRemaining === null) return false;
  return daysRemaining <= 30;
}

/**
 * Format duration label for display
 */
export function formatDurationLabel(days: number): string {
  switch (days) {
    case 30:
      return '1 Month';
    case 90:
      return '3 Months';
    case 180:
      return '6 Months';
    case 365:
      return '1 Year';
    default:
      return `${days} Days`;
  }
}
