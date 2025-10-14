import { useState } from 'react';
import PropTypes from 'prop-types';
import { borderRadius, spacing } from '../../styles/theme';
import { UPLOADS_BASE_URL } from '../../config/env.js';

function ImageGallery({ images, title }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        backgroundColor: '#f1f5f9',
        border: '2px dashed #cbd5e1',
        borderRadius: borderRadius.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '48px', marginBottom: spacing.sm }}>
            📦
          </div>
          <p>No image available</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Main Image with Navigation Arrows */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '400px',
        marginBottom: spacing.md,
        borderRadius: borderRadius.lg,
        overflow: 'hidden'
      }}>
        <img
          className="main-ad-image"
          src={`${UPLOADS_BASE_URL}/ads/${images[currentImageIndex].filename}`}
          alt={title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />

        {/* Navigation Arrows - Only show if more than one image */}
        {images.length > 1 && (
          <>
            {/* Previous Arrow */}
            <button
              onClick={handlePrevious}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
              aria-label="Previous image"
            >
              ‹
            </button>

            {/* Next Arrow */}
            <button
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
              aria-label="Next image"
            >
              ›
            </button>

            {/* Image Counter */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500',
              zIndex: 10
            }}>
              {currentImageIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Gallery - Show ALL images */}
      {images.length > 1 && (
        <div style={{
          display: 'flex',
          gap: spacing.sm,
          flexWrap: 'wrap',
          marginTop: spacing.md
        }}>
          {images.map((image, index) => (
            <div
              key={index}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: borderRadius.md,
                overflow: 'hidden',
                cursor: 'pointer',
                border: currentImageIndex === index ? '3px solid #dc1e4a' : '2px solid #e5e7eb',
                transition: 'transform 0.2s, border-color 0.2s',
                opacity: currentImageIndex === index ? 1 : 0.7
              }}
              onClick={() => handleThumbnailClick(index)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                if (currentImageIndex !== index) {
                  e.currentTarget.style.opacity = '1';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                if (currentImageIndex !== index) {
                  e.currentTarget.style.opacity = '0.7';
                }
              }}
            >
              <img
                src={`${UPLOADS_BASE_URL}/ads/${image.filename}`}
                alt={`${title} ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

ImageGallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      filename: PropTypes.string.isRequired
    })
  ),
  title: PropTypes.string.isRequired
};

export default ImageGallery;
