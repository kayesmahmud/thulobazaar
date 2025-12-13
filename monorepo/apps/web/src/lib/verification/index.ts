/**
 * Verification module - Verification status and utility functions
 */

export {
  isIndividualVerificationActive,
  isBusinessVerificationActive,
  getUserBadgeType,
  getDaysUntilExpiry,
  isVerificationExpiringSoon,
  formatDurationLabel,
  type UserVerificationInfo,
} from './verificationUtils';
