import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { colors, spacing, borderRadius, typography, shadows, transitions } from '../../styles/theme';

/**
 * ImageUploader - Drag-and-drop image upload component
 * Supports multiple images, preview, and progress tracking
 */
function ImageUploader({
  images = [],
  onUpload,
  onRemove,
  maxImages = 5
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (images.length + imageFiles.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`);
      return;
    }

    // Simulate upload progress
    imageFiles.forEach((file, index) => {
      const fileId = `${file.name}-${Date.now()}-${index}`;

      // Start progress
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileId] || 0;
          if (currentProgress >= 100) {
            clearInterval(interval);
            return prev;
          }
          return { ...prev, [fileId]: currentProgress + 10 };
        });
      }, 100);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setTimeout(() => {
          onUpload({
            id: fileId,
            file,
            preview: e.target.result,
            name: file.name,
            size: file.size
          });
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }, 1000);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (imageId) => {
    onRemove(imageId);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const dropzoneStyle = {
    border: `2px dashed ${isDragging ? colors.primary : colors.border.default}`,
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: isDragging ? colors.primaryLight : colors.background.secondary,
    transition: transitions.normal,
    marginBottom: spacing.lg
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <label style={{
        display: 'block',
        marginBottom: spacing.md,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary
      }}>
        Images ({images.length}/{maxImages})
      </label>

      {/* Drop Zone */}
      <div
        style={dropzoneStyle}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing.md }}>
          📷
        </div>
        <div style={{
          fontSize: typography.fontSize.base,
          color: colors.text.primary,
          marginBottom: spacing.xs,
          fontWeight: typography.fontWeight.medium
        }}>
          {isDragging ? 'Drop images here' : 'Drag and drop images here'}
        </div>
        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary
        }}>
          or click to browse
        </div>
        <div style={{
          fontSize: typography.fontSize.xs,
          color: colors.text.muted,
          marginTop: spacing.sm
        }}>
          Supports: JPG, PNG, GIF (Max {maxImages} images)
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Image Previews */}
      {images.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: spacing.md,
          marginTop: spacing.lg
        }}>
          {images.map((image) => (
            <div
              key={image.id}
              style={{
                position: 'relative',
                borderRadius: borderRadius.md,
                overflow: 'hidden',
                backgroundColor: colors.background.tertiary,
                border: `1px solid ${colors.border.default}`,
                aspectRatio: '1'
              }}
            >
              <img
                src={image.preview}
                alt={image.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(image.id);
                }}
                style={{
                  position: 'absolute',
                  top: spacing.xs,
                  right: spacing.xs,
                  backgroundColor: colors.danger,
                  color: colors.text.inverse,
                  border: 'none',
                  borderRadius: borderRadius.full,
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.bold,
                  boxShadow: shadows.md,
                  transition: transitions.fast
                }}
                aria-label="Remove image"
              >
                ×
              </button>

              {/* Image Info Overlay */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: colors.text.inverse,
                padding: spacing.xs,
                fontSize: typography.fontSize.xs
              }}>
                <div style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {image.name}
                </div>
                <div style={{ color: colors.gray300 }}>
                  {formatFileSize(image.size)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div style={{
          marginTop: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.md,
          border: `1px solid ${colors.border.default}`
        }}>
          <div style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            marginBottom: spacing.sm
          }}>
            Uploading images...
          </div>
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} style={{ marginBottom: spacing.sm }}>
              <div style={{
                height: '8px',
                backgroundColor: colors.gray200,
                borderRadius: borderRadius.full,
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: colors.primary,
                  transition: transitions.fast
                }} />
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
                marginTop: spacing.xs
              }}>
                {progress}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {images.length === 0 && (
        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          marginTop: spacing.md,
          textAlign: 'center'
        }}>
          Add at least one image to make your ad more attractive
        </div>
      )}

      {images.length >= maxImages && (
        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.warning,
          marginTop: spacing.md,
          textAlign: 'center',
          fontWeight: typography.fontWeight.medium
        }}>
          Maximum number of images reached ({maxImages})
        </div>
      )}
    </div>
  );
}

ImageUploader.propTypes = {
  images: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    file: PropTypes.object,
    preview: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired
  })),
  onUpload: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  maxImages: PropTypes.number
};

export default ImageUploader;
