import React from 'react';

interface WishlistIconProps extends React.SVGProps<SVGSVGElement> {
  isFilled?: boolean;
  useImage?: boolean;
}

export default function WishlistIcon({ isFilled, useImage, className, ...props }: WishlistIconProps) {
  const { preserveAspectRatio, stroke, strokeWidth, strokeLinecap, strokeLinejoin, ...rest } = props as any;
  const src = isFilled ? '/icons/navbar/activesave_trimmed.png' : '/icons/navbar/save_trimmed.png';

  return (
    <img
      src={src}
      alt="Wishlist"
      className={`${className || ''} inline-block object-contain`}
      style={{
        filter: isFilled 
          ? 'brightness(0) invert(24%) sepia(85%) saturate(2375%) hue-rotate(256deg) brightness(88%) contrast(92%)' 
          : 'brightness(0)',
        ...props.style
      }}
      {...rest}
    />
  );
}
