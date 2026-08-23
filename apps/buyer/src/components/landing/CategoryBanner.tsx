'use client';

import { useEffect, useState } from 'react';

export interface CategoryBannerSlide {
  id?: string;
  image: string;
  /** Portrait-friendly image for phones. Falls back to `image` when absent. */
  mobileImage?: string | null;
}

interface CategoryBannerProps {
  title: string;
  /** Ordered slideshow. One slide renders statically; 2+ auto-advance. */
  banners?: CategoryBannerSlide[];
}

const PLACEHOLDER =
  'https://placehold.co/1920x1080/f3f4f6/9ca3af?text=Category+Banner';

export default function CategoryBanner({ title, banners }: CategoryBannerProps) {
  const slides: CategoryBannerSlide[] =
    banners && banners.length > 0 ? banners : [{ image: PLACEHOLDER }];
  const hasSlideshow = slides.length > 1;

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Guard against the index dangling past the end when slides change while
  // the page is open (same convention as HeroSection's banner rotation).
  useEffect(() => {
    if (index > slides.length - 1) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (!hasSlideshow || isPaused) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [hasSlideshow, isPaused, slides.length]);

  return (
    <div
      className="relative w-full h-[250px] md:h-[350px] lg:h-[450px] overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative w-full h-full overflow-hidden">
        {slides.map((slide, slideIndex) => {
          const desktopImage = slide.image || PLACEHOLDER;
          const mobileImage = slide.mobileImage || desktopImage;
          const isCurrent = slideIndex === index;
          return (
            <div
              key={slide.id ?? slideIndex}
              className={`absolute inset-0 transition-opacity duration-700 ${
                isCurrent ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              aria-hidden={!isCurrent}
            >
              {/* Two layers rather than a <picture>: the artwork is a background
                  so it can be cropped to the band height at every width. Only
                  one is ever visible, and the hidden one is display:none so it
                  is not fetched. */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 sm:hidden"
                style={{ backgroundImage: `url(${mobileImage})` }}
              />
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 hidden sm:block"
                style={{ backgroundImage: `url(${desktopImage})` }}
              />
            </div>
          );
        })}

        {/* The banner artwork carries its own text, so the category name is
            not painted over it - stamping "Collectables" across a banner that
            already says "Shop Manga, Comics & Collectables" read as a glitch.
            The h1 stays for screen readers and search engines. */}
        <h1 className="sr-only">{title}</h1>
      </div>

      {hasSlideshow && (
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id ?? slideIndex}
              type="button"
              onClick={() => setIndex(slideIndex)}
              aria-label={`Go to banner ${slideIndex + 1}`}
              aria-current={slideIndex === index}
              className={`h-2 rounded-full transition-all ${
                slideIndex === index
                  ? 'w-5 bg-white'
                  : 'w-2 bg-white/60 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
