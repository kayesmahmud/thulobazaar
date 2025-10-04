import PropTypes from 'prop-types';
import { styles, spacing, typography } from '../../styles/theme';

function ContactModal({ isOpen, onClose, ad, formData, onFormChange, onSubmit }) {
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
            📧 Contact Seller
          </h2>
          <p style={{
            margin: 0,
            color: typography.text.secondary,
            fontSize: typography.fontSize.sm
          }}>
            Send a message to {ad.seller_name} about "{ad.title}"
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: spacing.lg }}>
            <label style={styles.label.default}>
              Your Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => onFormChange('name', e.target.value)}
              style={styles.input.default}
              placeholder="Enter your full name"
            />
          </div>

          <div style={{ marginBottom: spacing.lg }}>
            <label style={styles.label.default}>
              Your Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => onFormChange('email', e.target.value)}
              style={styles.input.default}
              placeholder="Enter your email address"
            />
          </div>

          <div style={{ marginBottom: spacing.lg }}>
            <label style={styles.label.default}>
              Your Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => onFormChange('phone', e.target.value)}
              style={styles.input.default}
              placeholder="+977-9800000000 (optional)"
            />
          </div>

          <div style={{ marginBottom: spacing.xl }}>
            <label style={styles.label.default}>
              Message *
            </label>
            <textarea
              required
              value={formData.message}
              onChange={(e) => onFormChange('message', e.target.value)}
              rows={4}
              style={{
                ...styles.input.default,
                resize: 'vertical'
              }}
              placeholder={`Hi ${ad.seller_name}, I'm interested in your "${ad.title}". Is it still available?`}
            />
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
                ...styles.button.primary,
                flex: 1
              }}
            >
              📧 Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ContactModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  ad: PropTypes.shape({
    title: PropTypes.string.isRequired,
    seller_name: PropTypes.string.isRequired
  }).isRequired,
  formData: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    message: PropTypes.string
  }).isRequired,
  onFormChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default ContactModal;
