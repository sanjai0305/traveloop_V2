import React, { useState, useEffect } from "react";

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  placeholderSrc?: string;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  fallbackSrc = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80", // beautiful placeholder beach
  placeholderSrc = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjMiIHZpZXdCb3g9IjAgMCA0IDMiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjMiIGZpbGw9IiMxZTI5M2IiLz48L3N2Zz4=", // tiny dark slate svg
  className = "",
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      setCurrentSrc(fallbackSrc);
      setIsLoaded(true);
    };
  }, [src, fallbackSrc]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-cover transition-all duration-700 ${
          isLoaded ? "blur-0 scale-100" : "blur-md scale-105"
        }`}
        {...props}
      />
    </div>
  );
};

export default ResponsiveImage;
