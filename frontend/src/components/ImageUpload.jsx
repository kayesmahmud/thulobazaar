import { useState, useRef } from 'react';
import PropTypes from 'prop-types';

function ImageUpload({ onImagesChange, maxImages = 5 }) {
  const [selectedImages, setSelectedImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));

    // Check file size (5MB limit per file)
    const validFiles = imageFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 5MB.`);
        return false;
      }
      return true;
    });

    // Limit total number of images
    const totalImages = selectedImages.length + validFiles.length;
    if (totalImages > maxImages) {
      alert(`You can only upload a maximum of ${maxImages} images.`);
      return;
    }

    // Create preview URLs
    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));

    const updatedImages = [...selectedImages, ...newImages];
    setSelectedImages(updatedImages);
    onImagesChange(updatedImages.map(img => img.file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
    onImagesChange(updatedImages.map(img => img.file));

    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(selectedImages[index].preview);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontSize: '16px',
        fontWeight: '600',
        color: '#374151'
      }}>
        Upload Images ({selectedImages.length}/{maxImages})
      </label>

      {/* Upload Area */}
      <div
        onClick={openFileDialog}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${dragActive ? '#3b82f6' : '#d1d5db'}`,
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragActive ? '#eff6ff' : '#f9fafb',
          transition: 'all 0.2s ease',
          marginBottom: '16px'
        }}
      >
        <div style={{
          fontSize: '48px',
          marginBottom: '8px',
          color: '#9ca3af'
        }}>
          📷
        </div>
        <p style={{
          margin: '0 0 8px 0',
          color: '#374151',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          Click to upload or drag and drop
        </p>
        <p style={{
          margin: 0,
          color: '#6b7280',
          fontSize: '14px'
        }}>
          PNG, JPG, GIF up to 5MB each (max {maxImages} images)
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Image Previews */}
      {selectedImages.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '12px',
          marginTop: '16px'
        }}>
          {selectedImages.map((image, index) => (
            <div key={index} style={{
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#f3f4f6',
              aspectRatio: '1/1'
            }}>
              <img
                src={image.preview}
                alt={`Preview ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

              {/* Primary Image Badge */}
              {index === 0 && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: '4px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  PRIMARY
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                ×
              </button>

              {/* File Name */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '4px',
                fontSize: '10px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {image.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      <div style={{
        marginTop: '8px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <p style={{ margin: '4px 0' }}>
          • First image will be used as the primary image for your ad
        </p>
        <p style={{ margin: '4px 0' }}>
          • Supported formats: JPEG, PNG, GIF
        </p>
        <p style={{ margin: '4px 0' }}>
          • Maximum file size: 5MB per image
        </p>
      </div>
    </div>
  );
}

ImageUpload.propTypes = {
  onImagesChange: PropTypes.func.isRequired,
  maxImages: PropTypes.number
};

ImageUpload.defaultProps = {
  maxImages: 5
};

export default ImageUpload;