'use client';

import { useState, useEffect } from 'react';
import { Loader2, Share2, Plus, ArrowRightCircle, Star, Truck } from 'lucide-react';
import Link from 'next/link';
import { getFeaturedProducts } from '@pharmabag/api-client';

interface ProductCarouselProps {
  reverse?: boolean;
  slot?: 'HOMEPAGE_CAROUSEL' | 'LOGIN_CAROUSEL';
}

function GridProductCard({ product, index }: { product: any; index: number }) {
  const isYukiziChoice = index % 2 === 0;
  const isSteal = index % 4 === 2;
  
  // Provide realistic fallbacks for anime figures if no image exists
  const defaultImages = [
    "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?w=300&q=80",
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&q=80",
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80"
  ];
  
  const imageUrl = product.images?.[0]?.url || product.image || defaultImages[index % 3];

  return (
    <Link href={`/products/${product.id || 'prod-' + index}`} className={`relative bg-white rounded-[1rem] border ${isYukiziChoice ? 'border-[#e2cbf5] shadow-[0_4px_25px_rgba(133,76,188,0.15)]' : 'border-gray-100 shadow-sm'} p-2.5 sm:p-3 flex flex-col hover:shadow-lg transition-all duration-300 w-full group overflow-hidden block`}>
      
      {/* Top Badges */}
      <div className="flex justify-between items-start mb-1 relative z-10">
         <div className={`text-[8px] sm:text-[9px] font-extrabold px-2.5 py-0.5 rounded-full tracking-tight ${isYukiziChoice ? 'bg-[#854cbc] text-white' : 'bg-[#222] text-white'}`}>
            {isYukiziChoice ? 'Yukizi Choice' : 'BestSeller'}
         </div>
         <div className="flex flex-col items-end gap-0.5 sm:gap-1">
            <span className="text-[8px] text-gray-400 font-medium leading-none">Ad</span>
            <button className="text-orange-400 hover:text-orange-500 transition-colors">
               <Plus size={14} strokeWidth={3} />
            </button>
         </div>
      </div>

      {/* Share Icon */}
      <div className="absolute top-9 left-2.5 text-gray-300 hover:text-gray-500 cursor-pointer z-10 transition-colors">
         <Share2 size={13} strokeWidth={2.5} />
      </div>

      {/* Purple Ribbon on Right Edge */}
      <div 
        className="absolute top-[45%] right-0 w-2.5 sm:w-3 h-4 sm:h-5 bg-[#854cbc] z-10 opacity-90" 
        style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 35% 50%, 0 0)' }} 
      />

      {/* Image Container */}
      <div className="w-full h-[120px] sm:h-[140px] md:h-[150px] flex items-center justify-center mb-3 mt-1 relative group-hover:scale-105 transition-transform duration-500">
         <img src={imageUrl} alt={product.name || 'Product'} className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-sm" />
      </div>

      {/* Details Section */}
      <div className="mt-auto flex flex-col gap-1.5">
         {/* Title Line */}
         <div className="flex justify-between items-center gap-1">
            <h3 className="text-[11px] sm:text-xs font-semibold text-gray-800 truncate flex-1 leading-tight">
               {product.name || 'Anime Figure Collectible'}
            </h3>
            <ArrowRightCircle size={15} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" strokeWidth={2} />
         </div>
         
         {/* Price and Rating */}
         <div className="flex justify-between items-center">
            <div className="flex items-baseline gap-1.5">
               <span className="text-[11px] sm:text-[13px] font-black text-gray-900 leading-none tracking-tight">₹3345.53</span>
               <span className="text-[9px] sm:text-[10px] text-gray-400 line-through leading-none">₹3800.26</span>
            </div>
            <div className="flex items-center gap-0.5 text-[#854cbc]">
               <Star size={11} fill="currentColor" />
               <span className="text-[10px] font-extrabold text-gray-700">4.5</span>
            </div>
         </div>

         {/* Bottom Badges */}
         <div className="flex justify-between items-center mt-1">
            <div className={`text-[8px] font-black tracking-tight px-1.5 py-0.5 rounded-[4px] uppercase ${isSteal ? 'bg-[#854cbc] text-white' : 'bg-gray-100 text-gray-700'}`}>
               {isSteal ? 'STEAL 66% off' : '26% off'}
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5 text-gray-500 border border-gray-200">
               <Truck size={9} strokeWidth={2.5} className="text-gray-400" />
               <span className="text-[8px] font-bold">3 days</span>
            </div>
         </div>
      </div>
    </Link>
  );
}

export default function ProductCarousel({ slot = 'HOMEPAGE_CAROUSEL' }: ProductCarouselProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getFeaturedProducts(slot);
        if (data && Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to load featured products', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slot]);

  if (loading) return <div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#854cbc]" /></div>;
  
  // We want to guarantee 14 items to fill a 7x2 grid on large screens.
  // If the API returns fewer products, we pad the array.
  const displayProducts = [...products];
  if (displayProducts.length > 0) {
    while (displayProducts.length < 14) {
      displayProducts.push(...products);
    }
  } else {
    // If absolutely no products from API, generate 14 empty mock items
    for (let i = 0; i < 14; i++) displayProducts.push({ id: `mock-${i}` });
  }
  
  // Slice to exactly 14 items
  const slicedProducts = displayProducts.slice(0, 14);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 mb-8 sm:mb-12 pt-2 lg:pt-4">
      {/* 
        Grid Setup:
        - Mobile (sm/xs): 2 columns
        - Tablet (md): 4 columns
        - Desktop (lg): 7 columns (which creates exactly 2 rows for 14 items)
      */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
        {slicedProducts.map((product, index) => (
          <GridProductCard 
            key={`${product.id || 'prod'}-${index}`} 
            product={product} 
            index={index} 
          />
        ))}
      </div>
    </div>
  );
}
