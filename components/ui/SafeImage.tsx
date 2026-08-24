import React, { useState, useCallback } from 'react';
import { ImageOff } from 'lucide-react';
import { FALLBACK_IMAGES } from '../../utils/constants';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string;
  alt: string;
}

/**
 * Image component with graceful fallback chain:
 * 1. Tries src
 * 2. On error, tries fallbackSrc
 * 3. On second error, shows placeholder with icon
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  fallbackSrc = FALLBACK_IMAGES.general,
  alt,
  className = '',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  const handleError = useCallback(() => {
    if (!fallbackAttempted && fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      setFallbackAttempted(true);
    } else {
      setHasError(true);
    }
  }, [fallbackSrc, fallbackAttempted, imgSrc]);

  // Update src when prop changes
  React.useEffect(() => {
    if (src) {
      setImgSrc(src);
      setHasError(false);
      setFallbackAttempted(false);
    }
  }, [src]);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-800/50 ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="text-center p-4">
          <ImageOff className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-xs text-slate-500 line-clamp-2">{alt}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleError}
    />
  );
};
