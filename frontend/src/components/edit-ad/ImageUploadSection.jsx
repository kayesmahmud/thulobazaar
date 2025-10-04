import { colors, spacing, borderRadius, typography, shadows } from '../../styles/theme';

function ImageUploadSection({ images, onImageUpload, onImageDelete, onSetPrimary }) {
  return (
    <div style={{ marginBottom: spacing[8] }}>
      <h3 style={{
        margin: `0 0 ${spacing[4]} 0`,
        color: colors.text.primary,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold
      }}>
        Product Images
      </h3>

      {/* Upload Area */}
      <div style={{
        border: `2px dashed ${colors.border.default}`,
        borderRadius: borderRadius.md,
        padding: spacing[6],
        textAlign: 'center',
        marginBottom: spacing[4],
        backgroundColor: colors.background.secondary,
        cursor: 'pointer'
      }}>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onImageUpload}
          style={{ display: 'none' }}
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          style={{
            cursor: 'pointer',
            display: 'block'
          }}
        >
          <div style={{
            fontSize: typography.fontSize['3xl'],
            marginBottom: spacing[2],
            color: colors.text.secondary
          }}>
            +
          </div>
          <p style={{
            margin: 0,
            color: colors.text.secondary,
            fontSize: typography.fontSize.sm
          }}>
            Click to upload images
          </p>
          <p style={{
            margin: `${spacing[1]} 0 0 0`,
            color: colors.text.muted,
            fontSize: typography.fontSize.xs
          }}>
            Upload up to 5 images
          </p>
        </label>
      </div>

      {/* Image Previews */}
      {images && images.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: spacing[3]
        }}>
          {images.map((image, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                paddingTop: '100%',
                borderRadius: borderRadius.md,
                overflow: 'hidden',
                border: image.isPrimary
                  ? `3px solid ${colors.primary}`
                  : `1px solid ${colors.border.default}`,
                boxShadow: shadows.sm
              }}
            >
              <img
                src={image.url || image.preview}
                alt={`Product ${index + 1}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

              {/* Image Actions Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                display: 'flex',
                gap: spacing[1],
                padding: spacing[1]
              }}>
                {/* Set as Primary Button */}
                {!image.isPrimary && (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(index)}
                    style={{
                      backgroundColor: colors.background.primary,
                      border: 'none',
                      borderRadius: borderRadius.sm,
                      padding: spacing[1],
                      cursor: 'pointer',
                      fontSize: typography.fontSize.xs,
                      boxShadow: shadows.sm
                    }}
                    title="Set as primary image"
                  >
                    ⭐
                  </button>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => onImageDelete(index)}
                  style={{
                    backgroundColor: colors.danger,
                    color: colors.text.inverse,
                    border: 'none',
                    borderRadius: borderRadius.sm,
                    padding: spacing[1],
                    cursor: 'pointer',
                    fontSize: typography.fontSize.xs,
                    boxShadow: shadows.sm
                  }}
                  title="Delete image"
                >
                  ×
                </button>
              </div>

              {/* Primary Badge */}
              {image.isPrimary && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(220, 30, 74, 0.9)',
                  color: colors.text.inverse,
                  padding: spacing[1],
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                  textAlign: 'center'
                }}>
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      <p style={{
        marginTop: spacing[3],
        color: colors.text.muted,
        fontSize: typography.fontSize.xs,
        textAlign: 'center'
      }}>
        First image will be the primary image. You can change it by clicking the star icon.
      </p>
    </div>
  );
}

export default ImageUploadSection;
