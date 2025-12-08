'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface AdDetailClientProps {
  images: string[];
  lang: string;
}

export default function AdDetailClient({ images, lang }: AdDetailClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fallback if no images
  const displayImages = images.length > 0 ? images : ['/placeholder-ad.png'];

  const handleImageChange = useCallback((newIndex: number) => {
    if (newIndex === selectedImageIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedImageIndex(newIndex);
      setIsTransitioning(false);
    }, 150);
  }, [selectedImageIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleImageChange(selectedImageIndex === 0 ? displayImages.length - 1 : selectedImageIndex - 1);
      } else if (e.key === 'ArrowRight') {
        handleImageChange(selectedImageIndex === displayImages.length - 1 ? 0 : selectedImageIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [displayImages.length, handleImageChange, selectedImageIndex]);

  const goToPrevious = () => {
    handleImageChange(selectedImageIndex === 0 ? displayImages.length - 1 : selectedImageIndex - 1);
  };

  const goToNext = () => {
    handleImageChange(selectedImageIndex === displayImages.length - 1 ? 0 : selectedImageIndex + 1);
  };

  return (
    <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
      {/* Main Image Container */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden mb-4">
        {/* Main Image */}
        <div className="relative h-[450px] sm:h-[500px] flex items-center justify-center">
          {displayImages[selectedImageIndex] === '/placeholder-ad.png' ? (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <svg className="w-24 h-24 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">No image available</span>
            </div>
          ) : (
            <Image
              src={displayImages[selectedImageIndex] || '/placeholder-ad.png'}
              alt={`Image ${selectedImageIndex + 1}`}
              fill
              sizes="(min-width: 1024px) 800px, (min-width: 640px) 600px, 100vw"
              className={`object-contain transition-opacity duration-150 ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
              priority
            />
          )}
        </div>

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 border-none rounded-full w-11 h-11 cursor-pointer flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 border-none rounded-full w-11 h-11 cursor-pointer flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter Badge */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
            {selectedImageIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery - Bottom */}
      {displayImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto p-2 -mx-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => handleImageChange(index)}
              className={`relative flex-shrink-0 w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 snap-start ${
                selectedImageIndex === index
                  ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {image === '/placeholder-ad.png' ? (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              ) : (
                <Image
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Active indicator overlay */}
              {selectedImageIndex === index && (
                <div className="absolute inset-0 bg-rose-500/10 pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
