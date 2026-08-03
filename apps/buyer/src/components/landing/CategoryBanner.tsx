import React from 'react';

interface CategoryBannerProps {
  title: string;
  imageUrl?: string;
}

export default function CategoryBanner({ title, imageUrl }: CategoryBannerProps) {
  const bgImage = imageUrl || "https://placehold.co/1920x1080/f3f4f6/9ca3af?text=Category+Banner";

  return (
    <div className="relative w-full h-[250px] md:h-[350px] lg:h-[450px] overflow-hidden group mt-4 md:mt-6 px-4 md:px-8 max-w-[1600px] 2xl:max-w-none mx-auto">
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
