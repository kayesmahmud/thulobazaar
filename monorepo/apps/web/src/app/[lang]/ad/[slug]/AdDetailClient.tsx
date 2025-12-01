'use client';

import { useState, useEffect } from 'react';

interface AdDetailClientProps {
  images: string[];
  lang: string;
}

export default function AdDetailClient({ images, lang }: AdDetailClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fallback if no images
  const displayImages = images.length > 0 ? images : ['/placeholder-ad.png'];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [displayImages.length]);

  return (
    <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
      {/* Main Image */}
      <div className="bg-gray-100 h-[400px] rounded-lg flex items-center justify-center mb-4 overflow-hidden relative">
        {displayImages[selectedImageIndex] === '/placeholder-ad.png' ? (
          <span className="text-6xl text-gray-400">📷</span>
        ) : (
          <img
            src={displayImages[selectedImageIndex] || '/placeholder-ad.png'}
            alt={`Image ${selectedImageIndex + 1}`}
            className="w-full h-full object-contain"
          />
        )}

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white border-none rounded-full w-10 h-10 cursor-pointer text-2xl flex items-center justify-center p-0 hover:bg-black/70 transition-colors duration-200"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              onClick={() => setSelectedImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white border-none rounded-full w-10 h-10 cursor-pointer text-2xl flex items-center justify-center p-0 hover:bg-black/70 transition-colors duration-200"
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}

        {/* Image Counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
            {selectedImageIndex + 1} / {displayImages.length}
          </div>
        )}

        {/* Keyboard Navigation Hint */}
        {displayImages.length > 1 && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
            Use ← → arrow keys
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {displayImages.map((image, index) => (
            <div
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`bg-gray-100 min-w-[80px] w-20 h-20 rounded-lg flex items-center justify-center cursor-pointer border overflow-hidden snap-start transition-all ${
                selectedImageIndex === index
                  ? 'border-rose-400 shadow-[0_0_0_2px_rgba(244,63,94,0.12)]'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              {image === '/placeholder-ad.png' ? (
                <span className="text-3xl">📷</span>
              ) : (
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
