import { colors, spacing, borderRadius, typography } from '../../styles/theme';

function AdFormFields({ formData, categories, locations, onInputChange }) {
  return (
    <>
      {/* Title */}
      <div style={{ marginBottom: spacing[6] }}>
        <label style={{
          display: 'block',
          marginBottom: spacing[2],
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary
        }}>
          Ad Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => onInputChange('title', e.target.value)}
          style={{
            width: '100%',
            padding: spacing[3],
            border: `2px solid ${colors.border.default}`,
            borderRadius: borderRadius.md,
            fontSize: typography.fontSize.base,
            outline: 'none',
            fontFamily: typography.fontFamily.base
          }}
          placeholder="e.g., iPhone 14 Pro Max 256GB"
          maxLength="100"
        />
        <small style={{
          color: colors.text.secondary,
          fontSize: typography.fontSize.sm
        }}>
          {formData.title.length}/100 characters
        </small>
      </div>

      {/* Description */}
      <div style={{ marginBottom: spacing[6] }}>
        <label style={{
          display: 'block',
          marginBottom: spacing[2],
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary
        }}>
          Description *
        </label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          style={{
            width: '100%',
            padding: spacing[3],
            border: `2px solid ${colors.border.default}`,
            borderRadius: borderRadius.md,
            fontSize: typography.fontSize.base,
            outline: 'none',
            minHeight: '120px',
            resize: 'vertical',
            fontFamily: typography.fontFamily.base
          }}
          placeholder="Describe your item in detail..."
          maxLength="1000"
        />
        <small style={{
          color: colors.text.secondary,
          fontSize: typography.fontSize.sm
        }}>
          {formData.description.length}/1000 characters
        </small>
      </div>

      {/* Price and Condition Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: spacing[5],
        marginBottom: spacing[6]
      }}>
        {/* Price */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: spacing[2],
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary
          }}>
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
              width: '100%',
              padding: spacing[3],
              border: `2px solid ${colors.border.default}`,
              borderRadius: borderRadius.md,
              fontSize: typography.fontSize.base,
              outline: 'none',
              fontFamily: typography.fontFamily.base
            }}
            placeholder="e.g., 150000"
          />
        </div>

        {/* Condition */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: spacing[2],
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary
          }}>
            Condition *
          </label>
          <select
            required
            value={formData.condition}
            onChange={(e) => onInputChange('condition', e.target.value)}
            style={{
              width: '100%',
              padding: spacing[3],
              border: `2px solid ${colors.border.default}`,
              borderRadius: borderRadius.md,
              fontSize: typography.fontSize.base,
              outline: 'none',
              fontFamily: typography.fontFamily.base
            }}
          >
            <option value="">Select Condition</option>
            <option value="new">Brand New</option>
            <option value="used">Used</option>
          </select>
        </div>
      </div>

      {/* Category and Location Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: spacing[5],
        marginBottom: spacing[6]
      }}>
        {/* Category */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: spacing[2],
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary
          }}>
            Category *
          </label>
          <select
            required
            value={formData.categoryId}
            onChange={(e) => onInputChange('categoryId', e.target.value)}
            style={{
              width: '100%',
              padding: spacing[3],
              border: `2px solid ${colors.border.default}`,
              borderRadius: borderRadius.md,
              fontSize: typography.fontSize.base,
              outline: 'none',
              fontFamily: typography.fontFamily.base
            }}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: spacing[2],
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary
          }}>
            Location *
          </label>
          <select
            required
            value={formData.locationId}
            onChange={(e) => onInputChange('locationId', e.target.value)}
            style={{
              width: '100%',
              padding: spacing[3],
              border: `2px solid ${colors.border.default}`,
              borderRadius: borderRadius.md,
              fontSize: typography.fontSize.base,
              outline: 'none',
              fontFamily: typography.fontFamily.base
            }}
          >
            <option value="">Select Location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Seller Information */}
      <div style={{ marginBottom: spacing[8] }}>
        <h3 style={{
          margin: `0 0 ${spacing[4]} 0`,
          color: colors.text.primary,
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold
        }}>
          Contact Information
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: spacing[5]
        }}>
          {/* Seller Name */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: spacing[2],
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary
            }}>
              Your Name *
            </label>
            <input
              type="text"
              required
              value={formData.sellerName}
              onChange={(e) => onInputChange('sellerName', e.target.value)}
              style={{
                width: '100%',
                padding: spacing[3],
                border: `2px solid ${colors.border.default}`,
                borderRadius: borderRadius.md,
                fontSize: typography.fontSize.base,
                outline: 'none',
                fontFamily: typography.fontFamily.base
              }}
              placeholder="Your full name"
            />
          </div>

          {/* Seller Phone */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: spacing[2],
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary
            }}>
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.sellerPhone}
              onChange={(e) => onInputChange('sellerPhone', e.target.value)}
              style={{
                width: '100%',
                padding: spacing[3],
                border: `2px solid ${colors.border.default}`,
                borderRadius: borderRadius.md,
                fontSize: typography.fontSize.base,
                outline: 'none',
                fontFamily: typography.fontFamily.base
              }}
              placeholder="+977-9800000000"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default AdFormFields;
