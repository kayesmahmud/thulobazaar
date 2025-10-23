'use client';

import { useState, useRef } from 'react';

interface ImageUploadProps {
  images: File[];
  onChange: (images: File[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  existingImages?: string[];
  onRemoveExisting?: (index: number) => void;
}

export default function ImageUpload({
  images,
  onChange,
  maxImages = 10,
  maxSizeMB = 5,
  existingImages = [],
  onRemoveExisting,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Only image files are allowed';
    }

    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    setError('');
    const newFiles: File[] = [];
    const errors: string[] = [];

    // Convert FileList to array and validate
    Array.from(files).forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        newFiles.push(file);
      }
    });

    // Check total count (including existing images)
    const totalImages = existingImages.length + images.length + newFiles.length;
    if (totalImages > maxImages) {
      const remaining = maxImages - existingImages.length - images.length;
      setError(`Maximum ${maxImages} images allowed. You tried to add ${newFiles.length} but only ${remaining} slots remaining.`);
      return;
    }

    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    // Add new files to existing images
    onChange([...images, ...newFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
    setError('');
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div>
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        style={{
          border: dragActive ? '2px solid #667eea' : '2px dashed #d1d5db',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragActive ? '#f0f4ff' : 'white',
          transition: 'all 0.2s',
          marginBottom: images.length > 0 ? '1.5rem' : '0'
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          {dragActive ? '📥' : '📷'}
        </div>

        <p style={{
          fontSize: '1rem',
          fontWeight: '500',
          color: '#1f2937',
          marginBottom: '0.5rem'
        }}>
          {dragActive ? 'Drop images here' : 'Click to upload or drag and drop'}
        </p>

        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          PNG, JPG, GIF up to {maxSizeMB}MB (Max {maxImages} images)
        </p>

        <p style={{
          fontSize: '0.875rem',
          color: '#667eea',
          marginTop: '0.5rem',
          fontWeight: '500'
        }}>
          {existingImages.length + images.length}/{maxImages} images total
          {existingImages.length > 0 && ` (${existingImages.length} saved, ${images.length} new)`}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          color: '#dc2626',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Existing Images (from server) */}
      {existingImages.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Current Images ({existingImages.length})
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '1rem'
          }}>
            {existingImages.map((imageUrl, index) => (
              <div
                key={`existing-${index}`}
                style={{
                  position: 'relative',
                  paddingBottom: '100%',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '2px solid #10b981',
                  background: '#f9fafb'
                }}
              >
                {/* Image */}
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${imageUrl}`}
                  alt={`Existing ${index + 1}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

                {/* First Image Badge */}
                {index === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    left: '0.5rem',
                    background: '#10b981',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    Main
                  </div>
                )}

                {/* Remove Button */}
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveExisting(index);
                    }}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      cursor: 'pointer',
                      fontSize: '18px',
                      lineHeight: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                    title="Remove image"
                  >
                    ×
                  </button>
                )}

                {/* Saved Badge */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(16, 185, 129, 0.9)',
                  color: 'white',
                  padding: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  ✓ Saved
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Uploaded Images */}
      {images.length > 0 && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              New Images ({images.length})
            </h3>
            {images.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Clear All
              </button>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '1rem'
          }}>
            {images.map((image, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  paddingBottom: '100%',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '2px solid #e5e7eb',
                  background: '#f9fafb'
                }}
              >
                {/* Image */}
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

                {/* First Image Badge - only show if no existing images */}
                {index === 0 && existingImages.length === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    left: '0.5rem',
                    background: '#667eea',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    Main
                  </div>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    lineHeight: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                  title="Remove image"
                >
                  ×
                </button>

                {/* File Info */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '0.5rem',
                  fontSize: '0.75rem'
                }}>
                  {(image.size / 1024).toFixed(0)} KB
                </div>
              </div>
            ))}
          </div>

          {/* Helper Text */}
          <p style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            marginTop: '1rem',
            fontStyle: 'italic'
          }}>
            💡 Tip: The first image will be used as the main photo for your ad
          </p>
        </div>
      )}
    </div>
  );
}
