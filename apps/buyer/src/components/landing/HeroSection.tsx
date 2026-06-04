'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useCategories } from "@/hooks/useProducts";

interface HeroSectionProps {
  title?: string;
}

export default function HeroSection({ title = 'YUKiZi' }: HeroSectionProps) {
  const { data: categoriesData } = useCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.data ?? [];

  return (
    <div className="w-full bg-white flex flex-col relative z-10">

      {/* Top Main Section */}
      <div className="flex flex-col md:flex-row h-auto md:h-[300px] border-b border-gray-200">

        {/* Left Side: Slanted Banners */}
        <div className="w-full md:w-[60%] relative h-[250px] md:h-full overflow-hidden bg-white">
          <div className="flex w-[120%] h-full -ml-[10%] gap-1.5 bg-white">

            {/* Left Image */}
            <div className="flex-1 relative overflow-hidden -skew-x-[15deg]">
              <div className="absolute inset-0 bg-red-600/10 z-10 mix-blend-color"></div>
              <img
                src="/hero1.jpg"
                alt="Anime character"
                className="w-[150%] h-full object-cover origin-center skew-x-[15deg] -ml-[25%]"
              />
            </div>

            {/* Middle Image */}
            <div className="flex-[1.3] relative overflow-hidden -skew-x-[15deg] border-4 border-[#854cbc] z-20 shadow-xl bg-white mx-1">
              <div className="absolute inset-0 bg-yellow-400/10 z-10 mix-blend-color"></div>
              <img
                src="/hero2.jpg"
                alt="Group of characters"
                className="w-[150%] h-full object-cover origin-center skew-x-[15deg] -ml-[25%]"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 skew-x-[15deg] z-20">
                <button className="bg-[#854cbc] text-white px-8 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-md hover:bg-[#723b9e] transition-colors">
                  Learn more
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="flex-1 relative overflow-hidden -skew-x-[15deg] z-10">
              <div className="absolute inset-0 bg-red-600/10 z-10 mix-blend-color"></div>
              <img
                src="/hero3.jpg"
                alt="Character"
                className="w-[150%] h-full object-cover origin-center skew-x-[15deg] -ml-[25%]"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Text & Tags */}
        <div className="flex w-full md:w-[40%] flex-col justify-center items-center py-6 px-4 bg-white relative z-10 border-t md:border-t-0 border-gray-100">
          
          {/* Text-based Logo Replica */}
          <h1 
            className="text-5xl xs:text-6xl md:text-[6rem] font-black tracking-tighter mb-4 bg-gradient-to-b from-[#a955e8] to-[#6a2ba8] bg-clip-text text-transparent leading-none text-center drop-shadow-sm"
            style={{ fontFamily: '"Faster", Impact, sans-serif', letterSpacing: '-0.05em' }}
          >
            {title}
          </h1>

          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-[13.5px] text-gray-500 text-center font-medium max-w-[380px] mb-4">
            {categories.map((category: any, index: number) => {
              const isHighlighted = index % 4 === 2;
              return (
                <span 
                  key={category.id || index} 
                  className={isHighlighted ? "bg-[#a379cf] text-white px-2.5 py-0.5 rounded-full cursor-pointer hover:bg-[#854cbc] transition-colors shadow-sm" : "cursor-pointer hover:text-gray-800 transition-colors"}
                >
                  {category.name}
                </span>
              );
            })}
            {categories.length === 0 && (
               <span className="text-gray-400 italic">Loading categories...</span>
            )}
          </div>
        </div>
      </div>


      {/* Bottom Slider Section */}
      <div className="bg-[#e2e2e2] py-2 px-4 border-b border-gray-300">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4 md:gap-8">

          {/* Left Arrow */}
          <button className="text-gray-500 hover:text-gray-800 p-1 cursor-pointer transition-colors flex items-center justify-center">
            <ChevronLeft size={20} strokeWidth={4} />
          </button>

          {/* Logos */}
          <div className="flex items-center justify-center gap-6 md:gap-12 flex-wrap">

            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/c9/Naruto_logo.svg"
              alt="Naruto"
              className="h-8 md:h-12 w-auto object-contain cursor-pointer mix-blend-multiply"
            />

            <img
              src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Shingeki_no_Kyojin_logo.svg"
              alt="Attack on Titan"
              className="h-8 md:h-12 w-auto object-contain cursor-pointer mix-blend-multiply filter contrast-125"
            />

            <img
              src="https://upload.wikimedia.org/wikipedia/commons/2/29/One_Piece_Logo.svg"
              alt="One Piece"
              className="h-8 md:h-12 w-auto object-contain cursor-pointer mix-blend-multiply"
            />

            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/05/Bleach_logo.svg"
              alt="Bleach"
              className="h-8 md:h-12 w-auto object-contain cursor-pointer mix-blend-multiply"
            />
          </div>

          {/* Right Arrow */}
          <button className="text-gray-500 hover:text-gray-800 p-1 cursor-pointer transition-colors flex items-center justify-center">
            <ChevronRight size={20} strokeWidth={4} />
          </button>

        </div>
      </div>

      {/* Dots */}
      <div className="bg-white py-2 flex justify-center gap-2 pb-4">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-400 cursor-pointer"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-gray-200 cursor-pointer hover:bg-gray-400 transition-colors"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-gray-200 cursor-pointer hover:bg-gray-400 transition-colors"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-gray-200 cursor-pointer hover:bg-gray-400 transition-colors"></div>
      </div>
    </div>
  );
}
