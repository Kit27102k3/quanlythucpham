import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Component ảnh với placeholder khi ảnh không tải được
 * Cải thiện Cumulative Layout Shift (CLS) và trải nghiệm người dùng
 */
const ImageWithFallback = ({ 
  src, 
  alt, 
  fallbackSrc = 'https://bizweb.dktcdn.net/thumb/large/100/360/151/products/5-fc8bf88b-59ce-4bb7-8b57-1e9cc2c5bfdb.jpg?v=1625689306000', 
  width, 
  height, 
  className, 
  loading = 'lazy',
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    setImgSrc(src);
  }, [src]);
  
  const onError = () => {
    setImgSrc(fallbackSrc);
  };
  
  const onLoad = () => {
    setHasLoaded(true);
  };
  
  return (
    <div className={`relative ${className || ''}`} style={{ aspectRatio: width && height ? `${width}/${height}` : 'auto' }}>
      {!hasLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
      )}
      
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onError={onError}
        onLoad={onLoad}
        className={`${className || ''} ${hasLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        {...props}
      />
    </div>
  );
};

ImageWithFallback.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  fallbackSrc: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  loading: PropTypes.oneOf(['lazy', 'eager']),
};

export default ImageWithFallback; 