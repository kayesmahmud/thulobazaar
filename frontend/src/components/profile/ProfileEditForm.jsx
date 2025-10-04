import PropTypes from 'prop-types';
import { styles, colors, spacing, typography } from '../../styles/theme';

function ProfileEditForm({ formData, locations, onChange, onSave, onCancel, saving, unsavedChanges }) {
  return (
    <div style={styles.card.default}>
      <h2 style={styles.heading.h2}>Edit Profile</h2>

      <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
        {/* Name Field */}
        <div style={{ marginBottom: spacing.lg }}>
          <label style={styles.label.default}>
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            style={styles.input.default}
            placeholder="Enter your full name"
          />
        </div>

        {/* Bio Field */}
        <div style={{ marginBottom: spacing.lg }}>
          <label style={styles.label.default}>
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => onChange('bio', e.target.value)}
            rows={4}
            maxLength={500}
            style={{
              ...styles.input.default,
              resize: 'vertical'
            }}
            placeholder="Tell us about yourself (max 500 characters)"
          />
          <div style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.muted,
            marginTop: spacing.xs,
            textAlign: 'right'
          }}>
            {formData.bio?.length || 0}/500 characters
          </div>
        </div>

        {/* Phone Field */}
        <div style={{ marginBottom: spacing.lg }}>
          <label style={styles.label.default}>
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            style={styles.input.default}
            placeholder="+977-9800000000"
          />
        </div>

        {/* Location Field */}
        <div style={{ marginBottom: spacing.xl }}>
          <label style={styles.label.default}>
            Location
          </label>
          <select
            value={formData.locationId}
            onChange={(e) => onChange('locationId', e.target.value)}
            style={{
              ...styles.input.default,
              backgroundColor: colors.background.primary
            }}
          >
            <option value="">Select a location</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: spacing.md }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            style={{
              ...styles.button.ghost,
              flex: 1,
              opacity: saving ? 0.5 : 1,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !unsavedChanges}
            style={{
              ...styles.button.primary,
              flex: 1,
              opacity: (saving || !unsavedChanges) ? 0.5 : 1,
              cursor: (saving || !unsavedChanges) ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? '💾 Saving...' : '💾 Save Changes'}
          </button>
        </div>

        {/* Unsaved Changes Warning */}
        {unsavedChanges && (
          <div style={{
            ...styles.alert.warning,
            marginTop: spacing.lg
          }}>
            ⚠️ You have unsaved changes
          </div>
        )}
      </form>
    </div>
  );
}

export default ProfileEditForm;
