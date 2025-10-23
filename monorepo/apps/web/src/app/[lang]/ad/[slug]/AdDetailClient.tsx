'use client';

import { useState } from 'react';

interface AdDetailClientProps {
  images: string[];
  lang: string;
}

export default function AdDetailClient({ images, lang }: AdDetailClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fallback if no images
  const displayImages = images.length > 0 ? images : ['/placeholder-ad.png'];

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1rem',
      marginBottom: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Main Image */}
      <div style={{
        background: '#f3f4f6',
        height: '400px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {displayImages[selectedImageIndex] === '/placeholder-ad.png' ? (
          <span style={{ fontSize: '4rem', color: '#9ca3af' }}>📷</span>
        ) : (
          <img
            src={displayImages[selectedImageIndex]}
            alt={`Image ${selectedImageIndex + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        )}

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              ‹
            </button>
            <button
              onClick={() => setSelectedImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              ›
            </button>
          </>
        )}

        {/* Image Counter */}
        {displayImages.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '4px',
            fontSize: '0.875rem'
          }}>
            {selectedImageIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {displayImages.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory'
        }}>
          {displayImages.map((image, index) => (
            <div
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              style={{
                background: '#f3f4f6',
                minWidth: '80px',
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: selectedImageIndex === index ? '2px solid #667eea' : '2px solid transparent',
                overflow: 'hidden',
                scrollSnapAlign: 'start'
              }}
            >
              {image === '/placeholder-ad.png' ? (
                <span style={{ fontSize: '2rem' }}>📷</span>
              ) : (
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
