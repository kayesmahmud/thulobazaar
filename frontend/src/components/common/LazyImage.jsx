import { useState, useEffect, useRef } from 'react';
import { colors } from '../../styles/theme';

function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  style,
  placeholder = 'blur',
  onLoad,
  onError
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setError(true);
    if (onError) onError();
  };

  const placeholderStyle = {
    backgroundColor: colors.background.tertiary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: width || '100%',
    height: height || '100%',
    ...style
  };

  const imageStyle = {
    ...style,
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out'
  };

  if (error) {
    return (
      <div
        ref={imgRef}
        style={{
          ...placeholderStyle,
          fontSize: '48px'
        }}
        className={className}
      >
        📦
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      style={{
        position: 'relative',
        width: width || '100%',
        height: height || '100%'
      }}
      className={className}
    >
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div style={placeholderStyle}>
          {placeholder === 'blur' ? (
            <div style={{
              fontSize: '24px',
              color: colors.text.muted,
              animation: 'pulse 1.5s ease-in-out infinite'
            }}>
              ⏳
            </div>
          ) : (
            <div style={{ fontSize: '48px' }}>📦</div>
          )}
        </div>
      )}

      {/* Actual image - only load when in viewport */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export default LazyImage;
