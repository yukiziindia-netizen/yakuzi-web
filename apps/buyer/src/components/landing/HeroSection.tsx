'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

export default function HeroSection() {
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
                src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&q=80"
                alt="Anime character"
                className="w-[150%] h-full object-cover origin-center skew-x-[15deg] -ml-[25%]"
              />
            </div>

            {/* Middle Image */}
            <div className="flex-[1.3] relative overflow-hidden -skew-x-[15deg] border-4 border-[#854cbc] z-20 shadow-xl bg-white mx-1">
              <div className="absolute inset-0 bg-yellow-400/10 z-10 mix-blend-color"></div>
              <img
                src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80"
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
                src="https://images.unsplash.com/photo-1542451313056-b7c8e626645f?w=500&q=80"
                alt="Character"
                className="w-[150%] h-full object-cover origin-center skew-x-[15deg] -ml-[25%]"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Text & Tags */}
        <div className="hidden md:flex w-full md:w-[40%] flex-col justify-center items-center py-6 px-4 bg-white relative z-10 border-t md:border-t-0 border-gray-100">
          
          {/* Text-based Logo Replica */}
          <h1 
            className="text-7xl md:text-[6rem] font-black tracking-[-0.08em] mb-4 bg-gradient-to-b from-[#a459d1] to-[#723b9e] bg-clip-text text-transparent leading-none"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            YUKiZi
          </h1>

          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-[13.5px] text-gray-500 text-center font-medium max-w-[380px] mb-4">
            <span className="cursor-pointer hover:text-gray-800 transition-colors">Comic stores</span>
            <span className="cursor-pointer hover:text-gray-800 transition-colors">Manga</span>
            <span className="bg-[#a379cf] text-white px-2.5 py-0.5 rounded-full cursor-pointer hover:bg-[#854cbc] transition-colors shadow-sm">Merch</span>
            <span className="cursor-pointer hover:text-gray-800 transition-colors">Comic books</span>

            <span className="cursor-pointer hover:text-gray-800 transition-colors">Events</span>
            <span className="bg-[#a379cf] text-white px-2.5 py-0.5 rounded-full cursor-pointer hover:bg-[#854cbc] transition-colors shadow-sm">Cosplay</span>
            <span className="cursor-pointer hover:text-gray-800 transition-colors">Bookstores</span>
            <span className="cursor-pointer hover:text-gray-800 transition-colors">MangStores</span>

            <span className="cursor-pointer hover:text-gray-800 transition-colors">Animation</span>
            <span className="cursor-pointer hover:text-gray-800 transition-colors">Art institutes</span>
            <span className="cursor-pointer hover:text-gray-800 transition-colors">posters</span>
            <span className="cursor-pointer hover:text-gray-800 transition-colors">Others</span>

            <span className="cursor-pointer hover:text-gray-800 transition-colors">Comic stores</span>
            <span className="cursor-pointer hover:text-gray-800 transition-colors">Manga</span>
            <span className="cursor-pointer hover:text-gray-800 transition-colors">Merch</span>
            <span className="cursor-pointer hover:text-gray-800 transition-colors">Comic books</span>
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

            <Image
              src="https://upload.wikimedia.org/wikipedia/commons/c/c9/Naruto_logo.svg"
              alt="Naruto"
              width={80}
              height={32}
              className="h-5 md:h-8 w-auto object-contain cursor-pointer mix-blend-multiply"
            />

            <Image
              src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Shingeki_no_Kyojin_logo.svg"
              alt="Attack on Titan"
              width={100}
              height={40}
              className="h-5 md:h-8 w-auto object-contain cursor-pointer mix-blend-multiply filter contrast-125"
            />

            <Image
              src="https://upload.wikimedia.org/wikipedia/commons/2/29/One_Piece_Logo.svg"
              alt="One Piece"
              width={90}
              height={36}
              className="h-5 md:h-8 w-auto object-contain cursor-pointer mix-blend-multiply"
            />

            <Image
              src="https://upload.wikimedia.org/wikipedia/commons/0/05/Bleach_logo.svg"
              alt="Bleach"
              width={75}
              height={32}
              className="h-5 md:h-8 w-auto object-contain cursor-pointer mix-blend-multiply"
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
