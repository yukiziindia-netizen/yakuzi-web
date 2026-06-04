import React from 'react';

interface WishlistIconProps extends React.SVGProps<SVGSVGElement> {
  isFilled?: boolean;
}

export default function WishlistIcon({ isFilled, className, ...props }: WishlistIconProps) {
  // If not explicitly set via text classes, we provide default fallback for the stroke behavior
  return (
    <svg 
      xmlns="http://w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill={isFilled ? "currentColor" : "none"} 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={`text-[#8b5cf6] ${className || ''}`} // default to the purple stroke if no text color is inherited, it can be overridden
      {...props}
    >
      <path d="M4 4h16v16H4l4-8Z" />
    </svg>
  );
}
