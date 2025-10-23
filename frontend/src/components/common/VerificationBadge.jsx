import PropTypes from 'prop-types';
import {
  BusinessVerificationStatus,
  getVerificationBadgeImagePath,
  getVerificationBadgeAltText,
  getVerificationBadgeTitle,
  isBusinessVerified,
  isIndividualVerified
} from '../../constants/verificationStatus.ts';

/**
 * VerificationBadge Component
 *
 * Displays verification badge (golden for business, blue for individual)
 * with proper alt text and tooltip.
 *
 * @param {Object} props
 * @param {string|null} props.businessVerificationStatus - Business verification status
 * @param {boolean} props.individualVerified - Individual verification status
 * @param {number} props.size - Badge size in pixels (default: 16)
 * @param {Object} props.style - Additional inline styles
 */
function VerificationBadge({
  businessVerificationStatus,
  individualVerified,
  size = 16,
  style = {}
}) {
  // Don't render anything if not verified
  if (!isBusinessVerified(businessVerificationStatus) && !isIndividualVerified(individualVerified)) {
    return null;
  }

  const imagePath = getVerificationBadgeImagePath(businessVerificationStatus, individualVerified);
  const altText = getVerificationBadgeAltText(businessVerificationStatus, individualVerified);
  const title = getVerificationBadgeTitle(businessVerificationStatus, individualVerified);

  if (!imagePath) {
    return null;
  }

  return (
    <img
      src={imagePath}
      alt={altText}
      title={title}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        ...style
      }}
    />
  );
}

VerificationBadge.propTypes = {
  businessVerificationStatus: PropTypes.oneOf([
    BusinessVerificationStatus.PENDING,
    BusinessVerificationStatus.APPROVED,
    BusinessVerificationStatus.REJECTED,
    null
  ]),
  individualVerified: PropTypes.bool.isRequired,
  size: PropTypes.number,
  style: PropTypes.object
};

export default VerificationBadge;
