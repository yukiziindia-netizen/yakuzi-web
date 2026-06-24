import React from 'react';

interface CategoryBannerProps {
  title: string;
  imageUrl?: string;
}

export default function CategoryBanner({ title, imageUrl }: CategoryBannerProps) {
  // Using a static image as fallback for now, but accepting a prop for dynamic future use
  const bgImage = imageUrl || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=2000";

  return (
    <div className="relative w-full h-[250px] md:h-[350px] lg:h-[450px] overflow-hidden group mt-4 md:mt-6 px-4 md:px-8 max-w-[1600px] mx-auto">
      <div className="relative w-full h-full rounded-sm overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Centered Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-6xl md:text-8xl lg:text-[10rem] font-extrabold tracking-tight drop-shadow-md text-center px-4" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
            {title}
          </h1>
        </div>

        {/* Bottom Pagination Dots */}
        <div className="absolute bottom-4 md:bottom-8 left-0 right-0 flex justify-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white cursor-pointer shadow-sm"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white/40 cursor-pointer hover:bg-white/80 transition-colors shadow-sm"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white/40 cursor-pointer hover:bg-white/80 transition-colors shadow-sm"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white/40 cursor-pointer hover:bg-white/80 transition-colors shadow-sm"></div>
        </div>
      </div>
    </div>
  );
}
