'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useCategories, useBrands } from '@/hooks/useProducts';

interface HeroSectionProps {
  title?: string;
}

export default function HeroSection({ title = 'YUKiZi' }: HeroSectionProps) {
  const { data: categoriesData } = useCategories();
  const { data: brandsData, isLoading: isLoadingBrands } = useBrands();

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
              <img
                src="/hero1.jpg"
                alt="Anime character"
                className="-ml-[25%] h-full w-[150%] origin-center skew-x-[15deg] object-cover"
              />
            </div>

            {/* Middle Image */}
            <div className="relative z-20 mx-1 flex-[1.3] -skew-x-[15deg] overflow-hidden border-4 border-[#854cbc] bg-white shadow-xl">
              <div className="absolute inset-0 z-10 bg-yellow-400/10 mix-blend-color"></div>
              <img
                src="/hero2.jpg"
                alt="Group of characters"
                className="-ml-[25%] h-full w-[150%] origin-center skew-x-[15deg] object-cover"
              />
              <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 skew-x-[15deg]">
                <button className="whitespace-nowrap rounded-full bg-[#854cbc] px-8 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-[#723b9e]">
                  Learn more
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative z-10 flex-1 -skew-x-[15deg] overflow-hidden">
              <div className="absolute inset-0 z-10 bg-red-600/10 mix-blend-color"></div>
              <img
                src="/hero3.jpg"
                alt="Character"
                className="-ml-[25%] h-full w-[150%] origin-center skew-x-[15deg] object-cover"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Text & Tags */}
        <div className="relative z-10 flex w-full flex-col items-center justify-center border-t border-gray-100 bg-white px-4 py-6 md:w-[40%] md:border-t-0">
          {/* Text-based Logo Replica */}
          <h1
            className="xs:text-6xl mb-4 bg-gradient-to-b from-[#a955e8] to-[#6a2ba8] bg-clip-text text-center text-5xl font-black leading-none tracking-tighter text-transparent drop-shadow-sm md:text-[6rem]"
            style={{ fontFamily: '"Faster", Impact, sans-serif', letterSpacing: '-0.05em' }}
          >
            {title}
          </h1>

          <div className="mb-4 flex max-w-[380px] flex-wrap justify-center gap-x-3 gap-y-2 text-center text-[13.5px] font-medium text-gray-500">
            {categories.map((category: any, index: number) => {
              const isHighlighted = index % 4 === 2;
              return (
                <span
                  key={category.id || index}
                  className={
                    isHighlighted
                      ? 'cursor-pointer rounded-full bg-[#a379cf] px-2.5 py-0.5 text-white shadow-sm transition-colors hover:bg-[#854cbc]'
                      : 'cursor-pointer transition-colors hover:text-gray-800'
                  }
                >
                  {category.name}
                </span>
              );
            })}
            {categories.length === 0 && (
              <span className="italic text-gray-400">Loading categories...</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Slider Section */}
      <div className="border-b border-gray-300 bg-[#e2e2e2] px-4 py-2">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-4 md:gap-8">
          {/* Left Arrow */}
          <button className="flex cursor-pointer items-center justify-center p-1 text-gray-500 transition-colors hover:text-gray-800">
            <ChevronLeft size={20} strokeWidth={4} />
          </button>

          {/* Logos */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            {isLoadingBrands ? (
              <span className="text-sm italic text-gray-400">Loading brands...</span>
            ) : (
              displayBrands.map((brand: any) => (
                <img
                  key={brand.id}
                  src={brand.imageUrl}
                  alt={brand.name}
                  className="h-8 w-auto cursor-pointer object-contain mix-blend-multiply transition-transform hover:scale-110 md:h-12"
                />
              ))
            )}
          </div>

          {/* Right Arrow */}
          <button className="flex cursor-pointer items-center justify-center p-1 text-gray-500 transition-colors hover:text-gray-800">
            <ChevronRight size={20} strokeWidth={4} />
          </button>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 bg-white py-2 pb-4">
        <div className="h-2.5 w-2.5 cursor-pointer rounded-full bg-gray-400"></div>
        <div className="h-2.5 w-2.5 cursor-pointer rounded-full bg-gray-200 transition-colors hover:bg-gray-400"></div>
        <div className="h-2.5 w-2.5 cursor-pointer rounded-full bg-gray-200 transition-colors hover:bg-gray-400"></div>
        <div className="h-2.5 w-2.5 cursor-pointer rounded-full bg-gray-200 transition-colors hover:bg-gray-400"></div>
      </div>
    </div>
  );
}
