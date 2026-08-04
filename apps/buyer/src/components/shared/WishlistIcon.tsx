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
        filter: 'brightness(0)',
        ...props.style
      }}
      {...rest}
    />
  );
}
