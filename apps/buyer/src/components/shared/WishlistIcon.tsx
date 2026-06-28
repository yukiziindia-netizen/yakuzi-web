import React from 'react';

interface WishlistIconProps extends React.SVGProps<SVGSVGElement> {
  isFilled?: boolean;
  useImage?: boolean;
}

export default function WishlistIcon({ isFilled, useImage, className, ...props }: WishlistIconProps) {
  if (useImage) {
    const src = isFilled ? '/icons/wishlistactive.avif' : '/icons/wishlist.avif';
    const hasTextWhite = className?.includes('text-white');
    const hasSmTextWhite = className?.includes('sm:text-white');

    let filterClass = '';
    if (hasTextWhite) {
      filterClass = 'brightness-0 invert';
    } else if (hasSmTextWhite) {
      filterClass = 'sm:brightness-0 sm:invert';
    }

    return (
      <img
        src={src}
        alt="Wishlist"
        className={`${className || ''} ${filterClass} inline-block object-contain`}
      />
    );
  }

  // If not explicitly set via text classes, we provide default fallback for the stroke behavior
  return (
    <svg
      xmlns="http://w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={isFilled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-[#889096] ${className || ''}`} // default to the gray stroke if no text color is inherited, it can be overridden
      {...(props as any)}
    >
      <path d="M4 4h16v16H4l4-8Z" />
    </svg>
  );
}
