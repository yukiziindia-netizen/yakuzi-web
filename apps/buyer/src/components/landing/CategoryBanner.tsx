import React from 'react';

interface CategoryBannerProps {
  title: string;
  imageUrl?: string;
  /** Portrait-friendly banner for phones. Falls back to imageUrl when absent. */
  mobileImageUrl?: string;
}

const PLACEHOLDER =
  'https://placehold.co/1920x1080/f3f4f6/9ca3af?text=Category+Banner';

export default function CategoryBanner({ title, imageUrl, mobileImageUrl }: CategoryBannerProps) {
  const desktopImage = imageUrl || PLACEHOLDER;
  const mobileImage = mobileImageUrl || desktopImage;

  return (
    <div className="relative w-full h-[250px] md:h-[350px] lg:h-[450px] overflow-hidden group">
      <div className="relative w-full h-full overflow-hidden">
        {/* Two layers rather than a <picture>: the artwork is a background so it
            can be cropped to the band height at every width. Only one is ever
            visible, and the hidden one is display:none so it is not fetched. */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 sm:hidden"
          style={{ backgroundImage: `url(${mobileImage})` }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 hidden sm:block"
          style={{ backgroundImage: `url(${desktopImage})` }}
        />

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Centered Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1
            className="text-white text-5xl sm:text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-tight drop-shadow-md text-center px-4"
            style={{ textShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
          >
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
