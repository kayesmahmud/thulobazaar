/**
 * Verification Status Constants
 *
 * Centralized verification status values to prevent typos and ensure consistency
 * across the application.
 *
 * IMPORTANT: These values must match the database enum types
 */

/**
 * Business Verification Status
 * Database column: users.business_verification_status
 * Type: VARCHAR(20)
 */
const BUSINESS_VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NULL: null  // For individual accounts or accounts that haven't applied
};

/**
 * Individual Verification Status
 * Database column: users.individual_verified
 * Type: BOOLEAN
 */
const INDIVIDUAL_VERIFICATION_STATUS = {
  VERIFIED: true,
  NOT_VERIFIED: false
};

/**
 * Account Types
 * Database column: users.account_type
 * Type: VARCHAR(20)
 */
const ACCOUNT_TYPE = {
  INDIVIDUAL: 'individual',
  BUSINESS: 'business'
};

/**
 * Ad Status
 * Database column: ads.status
 * Type: VARCHAR(20)
 */
const AD_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

/**
 * Helper function to check if a business is verified
 * @param {string|null} businessVerificationStatus
 * @returns {boolean}
 */
function isBusinessVerified(businessVerificationStatus) {
  return businessVerificationStatus === BUSINESS_VERIFICATION_STATUS.APPROVED;
}

/**
 * Helper function to check if an individual is verified
 * @param {boolean} individualVerified
 * @returns {boolean}
 */
function isIndividualVerified(individualVerified) {
  return individualVerified === INDIVIDUAL_VERIFICATION_STATUS.VERIFIED;
}

/**
 * Helper function to get verification display text
 * @param {string|null} businessVerificationStatus
 * @param {boolean} individualVerified
 * @returns {string}
 */
function getVerificationDisplayText(businessVerificationStatus, individualVerified) {
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
 * @param {string|null} businessVerificationStatus
 * @param {boolean} individualVerified
 * @returns {'golden'|'blue'|null}
 */
function getVerificationBadgeType(businessVerificationStatus, individualVerified) {
  if (isBusinessVerified(businessVerificationStatus)) {
    return 'golden';
  }
  if (isIndividualVerified(individualVerified)) {
    return 'blue';
  }
  return null;
}

module.exports = {
  BUSINESS_VERIFICATION_STATUS,
  INDIVIDUAL_VERIFICATION_STATUS,
  ACCOUNT_TYPE,
  AD_STATUS,
  // Helper functions
  isBusinessVerified,
  isIndividualVerified,
  getVerificationDisplayText,
  getVerificationBadgeType
};
