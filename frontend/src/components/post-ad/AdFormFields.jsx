import PropTypes from 'prop-types';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';

/**
 * AdFormFields - Main form fields component for creating/editing ads
 * Handles title, description, price, condition, category, location, and seller info
 */
function AdFormFields({
  formData,
  categories,
  locations,
  onInputChange,
  errors = {}
}) {
  const inputStyle = {
    width: '100%',
    padding: spacing.md,
    border: `2px solid ${colors.border.default}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: typography.fontFamily.base
  };

  const labelStyle = {
    display: 'block',
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary
  };

  const fieldContainerStyle = {
    marginBottom: spacing.xl
  };

  const errorStyle = {
    color: colors.danger,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs
  };

  const helperTextStyle = {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs
  };

  return (
    <div>
      {/* Title */}
      <div style={fieldContainerStyle}>
        <label style={labelStyle}>
          Ad Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => onInputChange('title', e.target.value)}
          style={{
            ...inputStyle,
            borderColor: errors.title ? colors.danger : colors.border.default
          }}
          placeholder="e.g., iPhone 14 Pro Max 256GB"
          maxLength="100"
        />
        <small style={helperTextStyle}>
          {formData.title.length}/100 characters
        </small>
        {errors.title && (
          <div style={errorStyle}>{errors.title}</div>
        )}
      </div>

      {/* Description */}
      <div style={fieldContainerStyle}>
        <label style={labelStyle}>
          Description *
        </label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          style={{
            ...inputStyle,
            minHeight: '120px',
            resize: 'vertical',
            borderColor: errors.description ? colors.danger : colors.border.default
          }}
          placeholder="Describe your item in detail..."
          maxLength="1000"
        />
        <small style={helperTextStyle}>
          {formData.description.length}/1000 characters
        </small>
        {errors.description && (
          <div style={errorStyle}>{errors.description}</div>
        )}
      </div>

      {/* Price and Condition Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: spacing.xl,
        marginBottom: spacing.xl
      }}>
        {/* Price */}
        <div>
          <label style={labelStyle}>
            Price (NPR) *
          </label>
          <input
            type="number"
            required
            min="1"
            step="0.01"
            value={formData.price}
            onChange={(e) => onInputChange('price', e.target.value)}
            style={{
              ...inputStyle,
              borderColor: errors.price ? colors.danger : colors.border.default
            }}
            placeholder="e.g., 150000"
          />
          {errors.price && (
            <div style={errorStyle}>{errors.price}</div>
          )}
        </div>

        {/* Condition */}
        <div>
          <label style={labelStyle}>
            Condition *
          </label>
          <select
            required
            value={formData.condition}
            onChange={(e) => onInputChange('condition', e.target.value)}
            style={{
              ...inputStyle,
              borderColor: errors.condition ? colors.danger : colors.border.default
            }}
          >
            <option value="">Select Condition</option>
            <option value="new">Brand New</option>
            <option value="used">Used</option>
          </select>
          {errors.condition && (
            <div style={errorStyle}>{errors.condition}</div>
          )}
        </div>
      </div>

      {/* Category and Location Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: spacing.xl,
        marginBottom: spacing.xl
      }}>
        {/* Category */}
        <div>
          <label style={labelStyle}>
            Category *
          </label>
          <select
            required
            value={formData.categoryId}
            onChange={(e) => onInputChange('categoryId', e.target.value)}
            style={{
              ...inputStyle,
              borderColor: errors.categoryId ? colors.danger : colors.border.default
            }}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <div style={errorStyle}>{errors.categoryId}</div>
          )}
        </div>

        {/* Location */}
        <div>
          <label style={labelStyle}>
            Location *
          </label>
          <select
            required
            value={formData.locationId}
            onChange={(e) => onInputChange('locationId', e.target.value)}
            style={{
              ...inputStyle,
              borderColor: errors.locationId ? colors.danger : colors.border.default
            }}
          >
            <option value="">Select Location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          {errors.locationId && (
            <div style={errorStyle}>{errors.locationId}</div>
          )}
        </div>
      </div>

      {/* Seller Information */}
      <div style={fieldContainerStyle}>
        <h3 style={{
          margin: `0 0 ${spacing.lg} 0`,
          color: colors.text.primary,
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semibold
        }}>
          Contact Information
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: spacing.xl
        }}>
          {/* Seller Name */}
          <div>
            <label style={labelStyle}>
              Your Name *
            </label>
            <input
              type="text"
              required
              value={formData.sellerName}
              onChange={(e) => onInputChange('sellerName', e.target.value)}
              style={{
                ...inputStyle,
                borderColor: errors.sellerName ? colors.danger : colors.border.default
              }}
              placeholder="Your full name"
            />
            {errors.sellerName && (
              <div style={errorStyle}>{errors.sellerName}</div>
            )}
          </div>

          {/* Seller Phone */}
          <div>
            <label style={labelStyle}>
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.sellerPhone}
              onChange={(e) => onInputChange('sellerPhone', e.target.value)}
              style={{
                ...inputStyle,
                borderColor: errors.sellerPhone ? colors.danger : colors.border.default
              }}
              placeholder="+977-9800000000"
            />
            {errors.sellerPhone && (
              <div style={errorStyle}>{errors.sellerPhone}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

AdFormFields.propTypes = {
  formData: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    condition: PropTypes.string.isRequired,
    categoryId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    locationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    sellerName: PropTypes.string.isRequired,
    sellerPhone: PropTypes.string.isRequired
  }).isRequired,
  categories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string
  })).isRequired,
  locations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  onInputChange: PropTypes.func.isRequired,
  errors: PropTypes.object
};

export default AdFormFields;
