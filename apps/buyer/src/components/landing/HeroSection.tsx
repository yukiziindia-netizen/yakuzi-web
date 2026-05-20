'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <div className="w-full bg-white flex flex-col relative z-10">

      {/* Top Main Section */}
      <div className="flex flex-col md:flex-row h-auto md:h-[300px]">

        {/* Left Side: Slanted Banners */}
        <div className="w-full md:w-[50%] relative h-[250px] md:h-full overflow-hidden bg-white">
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
            <div className="flex-[1.5] relative overflow-hidden -skew-x-[15deg]">
              <div className="absolute inset-0 bg-yellow-400/10 z-10 mix-blend-color"></div>
              <img
                src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80"
                alt="Group of characters"
                className="w-[150%] h-full object-cover origin-center skew-x-[15deg] -ml-[25%]"
              />
              <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 skew-x-[15deg] z-20">
                <button className="bg-[#854cbc] text-white px-6 md:px-8 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap shadow-md hover:bg-[#723b9e] transition-colors">
                  Learn more
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="flex-1 relative overflow-hidden -skew-x-[15deg]">
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
        <div className="hidden md:flex w-full md:w-[50%] flex-col justify-center items-center py-8 px-6 bg-white relative z-10 border-t md:border-t-0 border-gray-100">
          <h1 className="text-7xl  md:text-[5.5rem] font-black text-[#854cbc] tracking-tighter mb-4 md:mb-6 uppercase" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
            YUKIZI
          </h1>

          <div className="flex flex-wrap justify-center gap-x-1 gap-y-2 text-[16px] md:text-[16px] text-gray-500 text-center font-semibold max-w-[400px] mb-10">
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
      <div className="bg-[#e9e9e9] py-3 px-4 mt-auto">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-4 md:gap-8">

          {/* Left Arrow */}
          <button className="text-gray-500 hover:text-gray-800 p-2 cursor-pointer transition-colors flex items-center justify-center">
            <ChevronLeft size={24} strokeWidth={3} />
          </button>

          {/* Logos */}
          <div className="flex items-center justify-center gap-4  md:gap-10 flex-wrap">

            <Image
              src="https://cdn.worldvectorlogo.com/logos/netflix-3.svg"
              alt="Netflix"
              width={100}
              height={40}
              className="h-6 md:h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            />

            <Image
              src="https://cdn.worldvectorlogo.com/logos/spotify-2.svg"
              alt="Spotify"
              width={120}
              height={50}
              className="h-8 md:h-10 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            />

            <Image
              src="https://cdn.worldvectorlogo.com/logos/discord-6.svg"
              alt="Discord"
              width={110}
              height={45}
              className="h-7 md:h-9 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            />

            <Image
              src="https://cdn.worldvectorlogo.com/logos/github-icon-1.svg"
              alt="GitHub"
              width={90}
              height={40}
              className="h-6 md:h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            />
          </div>

          {/* Right Arrow */}
          <button className="text-gray-500 hover:text-gray-800 p-2 cursor-pointer transition-colors flex items-center justify-center">
            <ChevronRight size={24} strokeWidth={3} />
          </button>

        </div>
      </div>

      {/* Dots */}
      <div className="bg-[#e9e9e9] pb-3 md:pb-4 flex justify-center gap-2">
        <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gray-400 cursor-pointer"></div>
        <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gray-300 cursor-pointer hover:bg-gray-400 transition-colors"></div>
        <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gray-300 cursor-pointer hover:bg-gray-400 transition-colors"></div>
        <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gray-300 cursor-pointer hover:bg-gray-400 transition-colors"></div>
      </div>
    </div>
  );
}
