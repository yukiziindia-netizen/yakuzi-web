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

        {/* The banner artwork carries its own text, so the category name is
            not painted over it - stamping "Collectables" across a banner that
            already says "Shop Manga, Comics & Collectables" read as a glitch.
            The h1 stays for screen readers and search engines. */}
        <h1 className="sr-only">{title}</h1>
      </div>
    </div>
  );
}
