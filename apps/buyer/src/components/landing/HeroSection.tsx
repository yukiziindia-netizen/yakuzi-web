'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBrands, useBanners } from '@/hooks/useProducts';

export default function HeroSection() {
  const { data: brandsData, isLoading: isLoadingBrands } = useBrands();
  const { data: bannersData } = useBanners();

  const banners = Array.isArray(bannersData) ? bannersData.filter((b) => b.isActive !== false) : [];

  // The hero shows a single banner. It used to render three side by side, which
  // made it look as though the admin was meant to supply exactly three; it is an
  // ordered list, so the hero takes the first active one.
  const heroBanner = banners[0];
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

  const [visibleCount, setVisibleCount] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 480) {
        setVisibleCount(2);
      } else if (window.innerWidth < 768) {
        setVisibleCount(3);
      } else {
        setVisibleCount(4);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      {/* Top Main Section: one banner, spanning the full width */}
      <div className="border-b border-gray-200">
        <div className="relative h-[250px] w-full overflow-hidden bg-white md:h-[300px]">
          {heroBanner?.link ? (
            <a
              href={heroBanner.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full w-full"
            >
              <img
                src={heroBannerImage}
                alt={heroBanner?.title || 'Featured'}
                className="h-full w-full object-cover"
              />
            </a>
          ) : (
            <img
              src={heroBannerImage}
              alt={heroBanner?.title || 'Featured'}
              className="h-full w-full object-cover"
            />
          )}
          {(heroBanner as any)?.isAd && (
            <div className="absolute top-3 left-4 z-20 bg-white/80 backdrop-blur-sm text-gray-700 px-1.5 py-0.5 rounded text-[11px] sm:text-[12px] font-medium shadow-sm">
              Ad
            </div>
          )}
        </div>
      </div>
      {/* Bottom Slider Section */}
      <div className="border-b border-gray-300 bg-[#e2e2e2] px-4 py-1.5 sm:py-2">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 xs:gap-3 md:gap-6">
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
          <div className="relative flex-1 overflow-hidden max-w-3xl">
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
