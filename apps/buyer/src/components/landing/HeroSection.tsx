'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBrands, useBanners } from '@/hooks/useProducts';

export default function HeroSection() {
  const { data: brandsData, isLoading: isLoadingBrands } = useBrands();
  const { data: bannersData } = useBanners();

  // The API sorts by `order`, but the admin form does not set it, so every
  // banner currently comes back with the same value and the tie is broken
  // arbitrarily by Postgres. Sort defensively so the sequence is stable across
  // requests: by `order`, then oldest first.
  const banners = React.useMemo(() => {
    const list = Array.isArray(bannersData)
      ? bannersData.filter((b) => b.isActive !== false)
      : [];
    return [...list].sort((a, b) => {
      const orderDiff = (a.order ?? 0) - (b.order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return (
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      );
    });
  }, [bannersData]);

  // The hero cycles through every active banner the admin has uploaded, in the
  // order the API returns them (it already sorts by `order` and filters out
  // inactive ones). With a single banner this renders exactly as before: no
  // dots, no arrows, no auto-advance.
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isBannerPaused, setIsBannerPaused] = useState(false);

  const hasBannerSlideshow = banners.length > 1;

  // Guard against the index dangling past the end when banners are added or
  // removed while the page is open.
  useEffect(() => {
    if (bannerIndex > banners.length - 1) {
      setBannerIndex(0);
    }
  }, [banners.length, bannerIndex]);

  useEffect(() => {
    if (!hasBannerSlideshow || isBannerPaused) return;
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [hasBannerSlideshow, isBannerPaused, banners.length]);

  const goToPrevBanner = useCallback(() => {
    setBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToNextBanner = useCallback(() => {
    setBannerIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const heroBanner = banners[bannerIndex];
  const heroBannerImage =
    heroBanner?.imageUrl || 'https://placehold.co/1600x300/f3f4f6/9ca3af?text=Banner';

  const brands = Array.isArray(brandsData) ? brandsData.filter((b) => b.isActive !== false) : [];

  // Fallback images if no brands exist in the database yet
  const fallbackBrands = [
    {
      id: '1',
      name: 'Naruto',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Naruto_logo.svg',
    },
    {
      id: '2',
      name: 'Attack on Titan',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Attack_on_Titan_logo.png',
    },
    {
      id: '3',
      name: 'One Piece',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/29/One_Piece_Logo.svg',
    },
    {
      id: '4',
      name: 'Demon Slayer',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/9/91/Demon_Slayer_Kimetsu_no_Yaiba_logo.svg',
    },
  ];

  const displayBrands = brands.length > 0 ? brands : fallbackBrands;

  const [desiredVisibleCount, setDesiredVisibleCount] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // The strip spans the full width of the bar, so wider screens show more
      // logos rather than stretching four of them across the whole page.
      if (width < 480) {
        setDesiredVisibleCount(2);
      } else if (width < 768) {
        setDesiredVisibleCount(3);
      } else if (width < 1024) {
        setDesiredVisibleCount(4);
      } else if (width < 1440) {
        setDesiredVisibleCount(5);
      } else {
        setDesiredVisibleCount(6);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Never ask for more slots than there are logos, or the row would occupy only
  // part of its track and bunch up against the left edge.
  const visibleCount = Math.max(
    1,
    Math.min(desiredVisibleCount, displayBrands.length),
  );

  const handlePrev = () => {
    setCurrentIndex((prev) => {
      if (prev === 0) {
        return displayBrands.length - visibleCount;
      }
      return prev - 1;
    });
  };

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= displayBrands.length - visibleCount) {
        return 0;
      }
      return prev + 1;
    });
  }, [displayBrands.length, visibleCount]);

  useEffect(() => {
    if (displayBrands.length <= visibleCount) return;
    const interval = setInterval(() => {
      handleNext();
    }, 3500);
    return () => clearInterval(interval);
  }, [handleNext, displayBrands.length, visibleCount]);

  useEffect(() => {
    if (currentIndex > displayBrands.length - visibleCount) {
      setCurrentIndex(Math.max(0, displayBrands.length - visibleCount));
    }
  }, [visibleCount, displayBrands.length, currentIndex]);

  return (
    <div className="relative z-10 flex w-full flex-col bg-white">
      {/* Top Main Section: full-width banner, cycling when there is more than one */}
      <div className="border-b border-gray-200">
        <div
          className="relative h-[250px] w-full overflow-hidden bg-white md:h-[300px]"
          onMouseEnter={() => setIsBannerPaused(true)}
          onMouseLeave={() => setIsBannerPaused(false)}
          role={hasBannerSlideshow ? 'region' : undefined}
          aria-label={hasBannerSlideshow ? 'Featured banners' : undefined}
          aria-roledescription={hasBannerSlideshow ? 'carousel' : undefined}
        >
          {banners.length === 0 ? (
            <img
              src={heroBannerImage}
              alt="Featured"
              className="h-full w-full object-cover"
            />
          ) : (
            banners.map((banner, index) => {
              const isCurrent = index === bannerIndex;
              const image = banner?.imageUrl || heroBannerImage;
              const slide = (
                <img
                  src={image}
                  alt={banner?.title || 'Featured'}
                  className="h-full w-full object-cover"
                />
              );

              return (
                <div
                  key={banner?.id ?? index}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    isCurrent ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                  aria-hidden={!isCurrent}
                >
                  {banner?.link ? (
                    <a
                      href={banner.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full w-full"
                      tabIndex={isCurrent ? undefined : -1}
                    >
                      {slide}
                    </a>
                  ) : (
                    slide
                  )}
                </div>
              );
            })
          )}

          {(heroBanner as any)?.isAd && (
            <div className="absolute top-3 left-4 z-20 bg-white/80 backdrop-blur-sm text-gray-700 px-1.5 py-0.5 rounded text-[11px] sm:text-[12px] font-medium shadow-sm">
              Ad
            </div>
          )}

          {hasBannerSlideshow && (
            <>
              <button
                type="button"
                onClick={goToPrevBanner}
                aria-label="Previous banner"
                className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/70 p-2 text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white focus:outline-none sm:flex"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={goToNextBanner}
                aria-label="Next banner"
                className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/70 p-2 text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white focus:outline-none sm:flex"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={3} />
              </button>

              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
                {banners.map((banner, index) => (
                  <button
                    key={banner?.id ?? index}
                    type="button"
                    onClick={() => setBannerIndex(index)}
                    aria-label={`Go to banner ${index + 1}`}
                    aria-current={index === bannerIndex}
                    className={`h-2 rounded-full transition-all ${
                      index === bannerIndex
                        ? 'w-5 bg-white'
                        : 'w-2 bg-white/60 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {/* Bottom Slider Section */}
      <div className="border-b border-gray-300 bg-[#e2e2e2] px-4 py-1.5 sm:py-2">
        <div className="flex w-full items-center gap-3 xs:gap-3 md:gap-6">
          {/* Left Arrow */}
          {displayBrands.length > visibleCount && (
            <button 
              onClick={handlePrev}
              className="flex cursor-pointer items-center justify-center p-1 text-[#8c8c8c] transition-colors hover:text-gray-800 focus:outline-none"
            >
              <ChevronLeft className="h-[20px] w-[20px] xs:h-[24px] xs:w-[24px] md:h-[28px] md:w-[28px]" strokeWidth={4.5} />
            </button>
          )}

          {/* Logos Slider Container */}
          <div className="relative flex-1 overflow-hidden">
            {isLoadingBrands ? (
              <div className="flex justify-center">
                <span className="text-sm italic text-gray-400">Loading brands...</span>
              </div>
            ) : (
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`
                }}
              >
                {displayBrands.map((brand: any) => (
                  <div 
                    key={brand.id}
                    className="flex-shrink-0 flex justify-center items-center px-2 xs:px-4"
                    style={{ width: `${100 / visibleCount}%` }}
                  >
                    <img
                      src={brand.imageUrl}
                      alt={brand.name}
                      className="h-[24px] xs:h-[36px] md:h-[54px] cursor-pointer object-contain mix-blend-multiply transition-transform hover:scale-110"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Arrow */}
          {displayBrands.length > visibleCount && (
            <button 
              onClick={handleNext}
              className="flex cursor-pointer items-center justify-center p-1 text-[#8c8c8c] transition-colors hover:text-gray-800 focus:outline-none"
            >
              <ChevronRight className="h-[20px] w-[20px] xs:h-[24px] xs:w-[24px] md:h-[28px] md:w-[28px]" strokeWidth={4.5} />
            </button>
          )}
        </div>
      </div>

      {/* Dots */}
      {displayBrands.length > visibleCount && (
        <div className="flex justify-center gap-2 bg-white pt-5 pb-1">
          {Array.from({ length: displayBrands.length - visibleCount + 1 }).map((_, idx) => (
            <div 
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 w-2.5 cursor-pointer rounded-full transition-colors duration-300 ${
                currentIndex === idx ? 'bg-purple-600' : 'bg-gray-400 hover:bg-gray-500'
              }`}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
}
