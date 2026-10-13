import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  iconSize?: 'sm' | 'md' | 'lg';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = 'w-full h-full',
  imgClassName = 'w-full h-full object-contain p-2',
  iconSize = 'md'
}) => {
  const [hasError, setHasError] = useState(false);

  const isValidSrc = Boolean(src && typeof src === 'string' && src.trim().length > 0);

  if (!isValidSrc || hasError) {
    const iconDimensions = iconSize === 'sm' ? 'w-5 h-5' : iconSize === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
    return (
      <div
        className={`bg-slate-100 text-slate-400 flex flex-col items-center justify-center select-none ${className}`}
        title={alt}
      >
        <Package className={`${iconDimensions} stroke-[1.5] text-slate-400 mb-0.5`} />
        <span className="text-[10px] text-slate-400 font-medium tracking-tight">No image</span>
      </div>
    );
  }

  return (
    <div className={`bg-slate-50 relative overflow-hidden flex items-center justify-center ${className}`}>
      <img
        src={src!}
        alt={alt}
        className={imgClassName}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
};

export default ProductImage;
