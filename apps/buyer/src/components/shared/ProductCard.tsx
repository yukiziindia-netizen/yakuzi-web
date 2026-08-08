'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Share2, Plus, Minus, Star, Truck, Loader2, ArrowUpRight, RotateCw } from 'lucide-react';
import { useState } from 'react';
import { ShareButton } from './ShareButton';
import WishlistIcon from '@/components/shared/WishlistIcon';
import { DeliveryTruckBadge } from '@/components/shared/DeliveryTruckBadge';

interface ProductCardProps {
  name: string;
  price: string | number;
  image: string;
  stock?: number;
  onClick?: () => void;
  originalPrice?: string | number;
  rating?: number;
  discount?: string;
  deliveryTime?: string;

  cartQuantity?: number | null;
  onCartChange?: (quantity: number | null) => void;
  isBookmarked?: boolean;
  onBookmark?: (bookmarked: boolean) => void;
  isLoadingCart?: boolean;
  productId?: string;
  isWaitlisted?: boolean;
  onToggleWaitlist?: (productId: string) => void;
  isYukiziChoice?: boolean;
  isBestSeller?: boolean;
  isAd?: boolean;
  hasSellers?: boolean;
}

export default function ProductCard({
  name,
  price,
  image,
  stock = 999,
  onClick,
  originalPrice,
  rating,
  discount,
  deliveryTime = '2 days',
  cartQuantity = null,
  onCartChange,
  isBookmarked = false,
  onBookmark,
  isLoadingCart = false,
  productId,
  isWaitlisted = false,
  onToggleWaitlist,
  isYukiziChoice = true,
  isBestSeller = false,
  isAd = true,
  hasSellers = true
}: ProductCardProps) {
  const isOutOfStock = stock <= 0 || hasSellers === false;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const numPrice = Number(price);
  const numOriginalPrice = Number(originalPrice);
  
  const displayPrice = !isNaN(numPrice) && numPrice > 0 
    ? `₹${Math.round(numPrice)}` 
    : (typeof price === 'string' && price ? price : 'N/A');
    
  const displayOriginalPrice = !isNaN(numOriginalPrice) && numOriginalPrice > (numPrice || 0)
    ? `₹${Math.round(numOriginalPrice)}`
    : (originalPrice ? String(originalPrice) : '');
    
  const displayDiscount = discount;
  const showAd = isYukiziChoice || isBestSeller;

  const numRating = Number(rating);
  const hasRating = rating != null && !isNaN(numRating) && numRating > 0;

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoadingCart) return;
    onCartChange?.((cartQuantity || 0) + 1);
  };

  const handleMinusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoadingCart) return;
    const newQty = (cartQuantity || 0) - 1;
    onCartChange?.(newQty > 0 ? newQty : null);
  };

  const handleResetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isLoadingCart) return;
    onCartChange?.(null);
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookmark?.(!isBookmarked);
  };

  return (
    <div className="relative mt-3 sm:mt-4 group flex flex-col h-auto w-full max-w-[210px] sm:max-w-none mx-auto">
      {/* Yukizi Choice & Best Seller Tags */}
      <div className="absolute -top-[10px] left-4 sm:left-5 flex items-center gap-1.5 z-30">
        {isYukiziChoice && (
          <div className="bg-[#8b5cf6] text-white px-2 sm:px-2.5 py-0.5 rounded-full font-semibold text-[10px] sm:text-[11px] shadow-sm tracking-wide flex items-center justify-center">
            Yukizi Choice
          </div>
        )}
        {isBestSeller && (
          <div className="bg-[#4a4a4a] text-white px-2 sm:px-2.5 py-0.5 rounded-full font-semibold text-[10px] sm:text-[11px] shadow-sm tracking-wide flex items-center justify-center">
            Best Seller
          </div>
        )}
      </div>

      {/* Ad Tag */}
      {showAd && (
        <div className="absolute -top-5 right-2 text-[11px] sm:text-[12px] text-gray-400 font-normal z-20">
          Ad
        </div>
      )}

      {/* Container */}
      <div
        onClick={onClick}
        className={`bg-white rounded-[6px] hover:shadow-md transition-shadow duration-200 cursor-pointer group flex flex-col relative border ${isYukiziChoice ? 'border-[#7B2FBE]/40 shadow-[0_2px_8px_rgba(123,47,190,0.15)]' : 'border-[#ddd] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'} w-full h-auto overflow-hidden ${isMenuOpen ? 'z-50' : 'z-auto'}`}
      >

      {/* Top action icons (Cart quantity controls / Waitlist / Plus button) */}
      <div className="flex justify-end items-center absolute top-1 right-0.5 z-20">
        {cartQuantity && cartQuantity > 0 ? (
          <div className="flex items-center gap-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
             {/* Reset Button */}
             <button
               onClick={handleResetClick}
               title="Reset quantity"
               className="text-[#48286b] hover:text-purple-900 transition-all active:scale-90 focus:outline-none p-0.5"
               disabled={isLoadingCart}
             >
               <RotateCw className="w-3.5 h-3.5" strokeWidth={3} />
             </button>

             {/* Quantity Control Pill */}
             <div className="flex items-center bg-[#48286b] rounded-[6px] overflow-hidden h-6 text-white shadow-sm select-none justify-between px-1 gap-1">
                <button onClick={handleMinusClick} className="text-white hover:bg-white/10 w-4.5 h-4.5 flex items-center justify-center rounded transition-colors" disabled={isLoadingCart}>
                  <Minus className="w-2.5 h-2.5" strokeWidth={3} />
                </button>
                <span className="text-[10px] font-black tracking-wide min-w-[12px] text-center">
                  {isLoadingCart ? <Loader2 className="w-2.5 h-2.5 animate-spin mx-auto" /> : String(cartQuantity).padStart(2, '0')}
                </span>
                <button onClick={handlePlusClick} className="text-white hover:bg-white/10 w-4.5 h-4.5 flex items-center justify-center rounded transition-colors" disabled={isLoadingCart || cartQuantity >= stock}>
                  <Plus className="w-2.5 h-2.5" strokeWidth={3} />
                </button>
             </div>
          </div>
        ) : isOutOfStock ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (productId && onToggleWaitlist) {
                onToggleWaitlist(productId);
              }
            }} 
            className={`transition-colors p-1 rounded-full ${isWaitlisted ? 'text-red-500 bg-red-50' : 'text-black hover:text-black/80 hover:bg-black/5'}`}
            title={isWaitlisted ? "Remove from notify me" : "Notify me when available"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isWaitlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          </button>
        ) : (
          <button 
            onClick={handlePlusClick} 
            className="text-black hover:text-black/80 transition-all focus:outline-none p-1"
            disabled={isLoadingCart}
          >
            {isLoadingCart ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} /> : <Plus className="w-5 h-5" strokeWidth={3} />}
          </button>
        )}
      </div>

      {/* Bookmark Ribbon */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={handleBookmarkClick}
        className="absolute right-0 top-[40%] -translate-y-1/2 z-20 cursor-pointer hover:scale-105 transition-transform"
      >
        <WishlistIcon isFilled={isBookmarked} preserveAspectRatio="none" className="w-[24px] h-[24px]" />
      </div>

      {/* Product Image - Fixed 190px/200px height matching Samplr */}
      <div className="relative w-full h-[130px] sm:h-[200px] bg-[#f8f8f8] overflow-hidden flex justify-center items-center shrink-0">
        <Image
          src={image}
          alt={name}
          fill
          className={`object-contain p-3 sm:p-2 group-hover:scale-105 transition-transform duration-300 ease-out ${isOutOfStock ? 'grayscale brightness-90 opacity-80' : ''}`}
        />
      </div>

      {/* Details Section - Compact layout with zero extra vertical spacing */}
      <div className="flex flex-col gap-1.5 p-[8px] sm:p-[10px] bg-white w-full">
        <div>
          {/* Title */}
          <h3 className="text-[11px] sm:text-[14px] font-medium text-[#333333] leading-snug line-clamp-2 hover:text-[#7B2FBE] transition-colors">
            {name}
          </h3>
        </div>

        {/* Price and Rating Row */}
        <div className="flex justify-between items-center w-full pt-0.5">
          <div className="flex items-baseline gap-1">
            <span className="text-[11.5px] sm:text-[15px] font-medium text-[#333333] leading-none">
              {displayPrice}
            </span>
            {displayOriginalPrice && (
              <span className="text-[9px] sm:text-[12px] text-gray-400 line-through leading-none">{displayOriginalPrice}</span>
            )}
          </div>
          {/* Only show a rating when the product actually has one. Previously this
              defaulted to 4.5, so every unrated product advertised a review score
              nobody had given it. */}
          <div className="flex items-center gap-1">
            <Star className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ${hasRating ? 'text-[#7B2FBE] fill-[#7B2FBE]' : 'text-gray-300 fill-gray-300'}`} />
            <span className={`text-[10px] sm:text-[14px] font-medium leading-none ${hasRating ? 'text-[#333333]' : 'text-gray-400'}`}>{hasRating ? rating : 'NA'}</span>
          </div>
        </div>

        {/* Bottom Badges / Delivery Truck Row */}
        <div className="flex items-center justify-between w-full pt-1 border-t border-gray-100/80">
          {displayDiscount ? (
            <span className="text-[10px] sm:text-[12px] font-medium text-[#7B2FBE] truncate">
              {displayDiscount}
            </span>
          ) : <div></div>}
          <div className="-mr-[6px] sm:-mr-[8px]">
            <DeliveryTruckBadge text={deliveryTime} className="w-[52px] sm:w-[75px] h-auto text-[#8c8c8c]" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
