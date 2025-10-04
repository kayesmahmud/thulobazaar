import PropTypes from 'prop-types';
import { styles, spacing, typography } from '../../styles/theme';

function ReportModal({ isOpen, onClose, formData, onFormChange, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div style={styles.modal.overlay}>
      <div style={styles.modal.container}>
        {/* Close button */}
        <button onClick={onClose} style={styles.modal.closeButton}>
          ×
        </button>

        {/* Header */}
        <div style={{ marginBottom: spacing.xl }}>
          <h2 style={styles.heading.h2}>
            🚩 Report this ad
          </h2>
          <p style={{
            margin: 0,
            color: typography.text.secondary,
            fontSize: typography.fontSize.sm
          }}>
            Help us keep Thulobazaar safe by reporting inappropriate content.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: spacing.xl }}>
            <label style={styles.label.default}>
              Reason for reporting *
            </label>
            <select
              required
              value={formData.reason}
              onChange={(e) => onFormChange('reason', e.target.value)}
              style={{
                ...styles.input.default,
                backgroundColor: 'white'
              }}
            >
              <option value="">Select a reason</option>
              <option value="spam">Spam or fake listing</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="fraud">Suspected fraud or scam</option>
              <option value="duplicate">Duplicate listing</option>
              <option value="wrong_category">Wrong category</option>
              <option value="illegal">Illegal goods or services</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: spacing.xl }}>
            <label style={styles.label.default}>
              Additional details (optional)
            </label>
            <textarea
              value={formData.details}
              onChange={(e) => onFormChange('details', e.target.value)}
              rows={3}
              style={{
                ...styles.input.default,
                resize: 'vertical'
              }}
              placeholder="Please provide any additional information that would help us review this ad..."
            />
          </div>

          <div style={{
            ...styles.alert.info,
            marginBottom: spacing.xl
          }}>
            <div style={{ fontWeight: typography.fontWeight.bold, marginBottom: spacing.xs }}>
              ℹ️ Please note:
            </div>
            <ul style={{ margin: 0, paddingLeft: spacing.lg }}>
              <li>False reports may result in account restrictions</li>
              <li>We review all reports within 24-48 hours</li>
              <li>Your report is anonymous and confidential</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: spacing.md }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...styles.button.ghost,
                flex: 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.button.danger,
                flex: 1
              }}
            >
              🚩 Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ReportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  formData: PropTypes.shape({
    reason: PropTypes.string,
    details: PropTypes.string
  }).isRequired,
  onFormChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default ReportModal;
