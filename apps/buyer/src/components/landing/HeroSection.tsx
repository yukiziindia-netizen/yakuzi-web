'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCategories, useBrands, useBanners } from '@/hooks/useProducts';

interface HeroSectionProps {
  title?: string;
}

export default function HeroSection({ title = 'YUKiZi' }: HeroSectionProps) {
  const { data: categoriesData } = useCategories();
  const { data: brandsData, isLoading: isLoadingBrands } = useBrands();
  const { data: bannersData } = useBanners();

  const banners = Array.isArray(bannersData) ? bannersData.filter((b) => b.isActive !== false) : [];
  const displayHeroBanners = [
    banners[0]?.imageUrl || 'https://placehold.co/800x600/f3f4f6/9ca3af?text=Banner+1',
    banners[1]?.imageUrl || 'https://placehold.co/800x600/f3f4f6/9ca3af?text=Banner+2',
    banners[2]?.imageUrl || 'https://placehold.co/800x600/f3f4f6/9ca3af?text=Banner+3',
  ];

  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : ((categoriesData as any)?.data ?? []);
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
      {/* Top Main Section */}
      <div className="flex h-auto flex-col border-b border-gray-200 md:h-[300px] md:flex-row">
        {/* Left Side: Slanted Banners */}
        <div className="relative h-[250px] w-full overflow-hidden bg-white md:h-full md:w-[60%]">
          <div className="-ml-[10%] flex h-full w-[120%] gap-1.5 bg-white">
            {/* Left Image */}
            <div className="relative flex-1 -skew-x-[15deg] overflow-hidden">
              <div className="absolute inset-0 z-10 bg-red-600/10 mix-blend-color"></div>
              {banners[0]?.link ? (
                <a href={banners[0].link} target="_blank" rel="noopener noreferrer">
                  <img
                    src={displayHeroBanners[0]}
                    alt={banners[0]?.title || "Anime character"}
                    className="-ml-[40%] h-full w-[180%] origin-center skew-x-[15deg] object-cover scale-[1.1]"
                  />
                </a>
              ) : (
                <img
                  src={displayHeroBanners[0]}
                  alt="Anime character"
                  className="-ml-[40%] h-full w-[180%] origin-center skew-x-[15deg] object-cover scale-[1.1]"
                />
              )}
              {(banners[0] as any)?.isAd && (
                <div className="absolute top-3 left-4 z-20 skew-x-[15deg] bg-white/80 backdrop-blur-sm text-gray-700 px-1.5 py-0.5 rounded text-[11px] sm:text-[12px] font-medium shadow-sm">
                  Ad
                </div>
              )}
            </div>

            {/* Middle Image */}
            <div className="relative z-20 mx-1 flex-[1.3] -skew-x-[15deg] overflow-hidden border-4 border-[#854cbc] bg-white shadow-xl">
              <div className="absolute inset-0 z-10 bg-yellow-400/10 mix-blend-color"></div>
              {banners[1]?.link ? (
                <a href={banners[1].link} target="_blank" rel="noopener noreferrer">
                  <img
                    src={displayHeroBanners[1]}
                    alt={banners[1]?.title || "Group of characters"}
                    className="-ml-[40%] h-full w-[180%] origin-center skew-x-[15deg] object-cover scale-[1.1]"
                  />
                </a>
              ) : (
                <img
                  src={displayHeroBanners[1]}
                  alt="Group of characters"
                  className="-ml-[40%] h-full w-[180%] origin-center skew-x-[15deg] object-cover scale-[1.1]"
                />
              )}
              <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 skew-x-[15deg]">
                {banners[1]?.link ? (
                  <a
                    href={banners[1].link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whitespace-nowrap rounded-full bg-[#854cbc] px-8 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-[#723b9e] inline-block"
                  >
                    {banners[1]?.title || 'Learn more'}
                  </a>
                ) : (
                  <button className="whitespace-nowrap rounded-full bg-[#854cbc] px-8 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-[#723b9e]">
                    {banners[1]?.title || 'Learn more'}
                  </button>
                )}
              </div>
              {(banners[1] as any)?.isAd && (
                <div className="absolute top-3 left-4 z-20 skew-x-[15deg] bg-white/80 backdrop-blur-sm text-gray-700 px-1.5 py-0.5 rounded text-[11px] sm:text-[12px] font-medium shadow-sm">
                  Ad
                </div>
              )}
            </div>

            {/* Right Image */}
            <div className="relative z-10 flex-1 -skew-x-[15deg] overflow-hidden">
              <div className="absolute inset-0 z-10 bg-red-600/10 mix-blend-color"></div>
              {banners[2]?.link ? (
                <a href={banners[2].link} target="_blank" rel="noopener noreferrer">
                  <img
                    src={displayHeroBanners[2]}
                    alt={banners[2]?.title || "Character"}
                    className="-ml-[40%] h-full w-[180%] origin-center skew-x-[15deg] object-cover scale-[1.1]"
                  />
                </a>
              ) : (
                <img
                  src={displayHeroBanners[2]}
                  alt="Character"
                  className="-ml-[40%] h-full w-[180%] origin-center skew-x-[15deg] object-cover scale-[1.1]"
                />
              )}
              {(banners[2] as any)?.isAd && (
                <div className="absolute top-3 left-4 z-20 skew-x-[15deg] bg-white/80 backdrop-blur-sm text-gray-700 px-1.5 py-0.5 rounded text-[11px] sm:text-[12px] font-medium shadow-sm">
                  Ad
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Text & Tags */}
        <div className="hidden md:flex relative z-10 w-full flex-col items-center justify-center border-t border-gray-100 bg-white px-4 py-6 md:w-[40%] md:border-t-0">
          {/* Image-based Logo */}
          <Image
            src="/YukiziLogo.png"
            alt={title || 'YUKiZi Logo'}
            width={400}
            height={120}
            className="mb-4 h-14 w-auto object-contain drop-shadow-sm md:h-[6rem]"
            priority
          />

          <div className="mb-4 flex max-w-[380px] flex-wrap justify-center gap-x-3 gap-y-2 text-center text-[13.5px] font-medium text-gray-500">
            {categories.map((category: any, index: number) => {
              const isHighlighted = index % 4 === 2;
              return (
                <Link
                  key={category.id || index}
                  href={`/category/${category.slug || category.id}`}
                  className={
                    isHighlighted
                      ? 'cursor-pointer rounded-full bg-[#a379cf] px-2.5 py-0.5 text-white shadow-sm transition-colors hover:bg-[#854cbc]'
                      : 'cursor-pointer transition-colors hover:text-gray-800'
                  }
                >
                  {category.name}
                </Link>
              );
            })}
            {categories.length === 0 && (
              <span className="italic text-gray-400">Loading categories...</span>
            )}
          </div>
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
