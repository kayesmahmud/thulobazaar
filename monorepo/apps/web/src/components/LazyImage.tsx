'use client';

import { useState, useRef, useEffect, CSSProperties, ReactNode } from 'react';

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  placeholder?: ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

export default function LazyImage({
  src,
  alt = '',
  className = '',
  style = {},
  placeholder = null,
  onLoad = () => {},
  onError = () => {},
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };

  const handleError = () => {
    setHasError(true);
    onError();
  };

  const defaultPlaceholder = (
    <div style={{
      ...style,
      backgroundColor: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#94a3b8',
      fontSize: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {!isInView ? (
        // Loading skeleton
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#e2e8f0'
        }} />
      ) : hasError ? (
        // Error state
        <span>📦</span>
      ) : (
        // Loading state
        <span>⏳</span>
      )}
    </div>
  );

  return (
    <div ref={imgRef} style={{ position: 'relative', ...style }} className={className}>
      {!isInView || (!isLoaded && !hasError) ? (
        placeholder || defaultPlaceholder
      ) : null}

      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            ...style,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            position: isLoaded ? 'static' : 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        />
      )}
    </div>
  );
}
