import PropTypes from 'prop-types';
import { borderRadius, spacing } from '../../styles/theme';

function ImageGallery({ images, title }) {
  const handleThumbnailClick = (filename) => {
    const mainImg = document.querySelector('.main-ad-image');
    if (mainImg) {
      mainImg.src = `http://localhost:5000/uploads/ads/${filename}`;
    }
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
      {/* Main Image */}
      <div style={{
        width: '100%',
        height: '400px',
        marginBottom: spacing.md,
        borderRadius: borderRadius.lg,
        overflow: 'hidden'
      }}>
        <img
          className="main-ad-image"
          src={`http://localhost:5000/uploads/ads/${images[0].filename}`}
          alt={title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
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
                border: '2px solid #e5e7eb',
                transition: 'transform 0.2s, border-color 0.2s'
              }}
              onClick={() => handleThumbnailClick(image.filename)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.borderColor = '#dc1e4a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <img
                src={`http://localhost:5000/uploads/ads/${image.filename}`}
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
