import React, { useId } from 'react';

interface DeliveryTruckBadgeProps {
  text?: string;
  className?: string;
}

export function DeliveryTruckBadge({ text = "3 days", className = "w-[80px] h-auto text-[#9a9a9a]" }: DeliveryTruckBadgeProps) {
  const maskId = useId();

  return (
    <svg viewBox="0 0 135 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <mask id={`truck-mask-${maskId}`}>
          <rect x="0" y="0" width="135" height="40" fill="white" />
          <circle cx="40" cy="32" r="6" fill="black" />
          <circle cx="113" cy="32" r="6" fill="black" />
          <path d="M 108 16 L 116 16 L 121 21 L 108 21 Z" fill="black" />
        </mask>
      </defs>

      {/* Speed lines */}
      <path d="M 16 12 L 28 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 5 18 L 24 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 12 24 L 22 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

      {/* Truck Body masked */}
      <path 
        d="M 33 8 L 105 8 L 105 14 L 118 14 L 125 23 L 125 32 L 25 32 Z" 
        fill="currentColor" 
        mask={`url(#truck-mask-${maskId})`}
      />
      
      {/* Wheels */}
      <circle cx="40" cy="32" r="3.5" fill="currentColor" />
      <circle cx="113" cy="32" r="3.5" fill="currentColor" />
      
      {/* Text inside */}
      <text x="67" y="21.5" fill="white" fontSize={text.length > 6 ? "11" : "14"} fontWeight="700" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle">
        {text}
      </text>
    </svg>
  );
}
