'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Share2, Plus, Minus, Star, Truck, Loader2, ArrowUpRight } from 'lucide-react';
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
}

export default function ProductCard({ 
  name, 
  price, 
  image, 
  stock = 999, 
  onClick,
  originalPrice,
  rating = 4.5,
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
  isAd = true
}: ProductCardProps) {
  const isOutOfStock = stock <= 0;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const displayPrice = typeof price === 'number' ? `₹${price.toFixed(2)}` : price;
  const displayOriginalPrice = typeof originalPrice === 'number' ? `₹${originalPrice.toFixed(2)}` : (originalPrice || `₹${(Number(price) * 1.2).toFixed(2)}`);
  const displayDiscount = discount;
  const showAd = isYukiziChoice || isBestSeller;

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

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookmark?.(!isBookmarked);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onClick}
      className={`bg-white rounded-[6px] sm:rounded-[6px] p-4 sm:p-5 hover:shadow-[0_8px_30px_rgb(133,76,188,0.15)] hover:ring-1 hover:ring-primary/50 transition-all duration-300 cursor-pointer group flex flex-col relative border ${isYukiziChoice ? 'border-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.4)]' : 'border-gray-300 shadow-sm'} ${isMenuOpen ? 'z-50' : 'z-auto'}`}
    >
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
        <div className="absolute -top-5 right-2 text-[11px] sm:text-[12px] text-gray-500 font-medium z-20">
          Ad
        </div>
      )}

      {/* Top action icons */}
      <div className="flex justify-end items-center w-full absolute top-1 sm:top-1.5 left-0 pl-2.5 sm:pl-3 pr-0.5 sm:pr-1 z-20">
        {cartQuantity && cartQuantity > 0 ? (
          <div className="flex items-center gap-2 bg-primary/10 rounded-full px-2 py-1 border border-primary/20" onClick={(e) => e.stopPropagation()}>
             <button onClick={handleMinusClick} className="text-primary hover:text-primary/80 transition-colors disabled:opacity-50" disabled={isLoadingCart}>
               <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
             </button>
             <span className="text-[12px] font-bold text-primary min-w-[12px] text-center">
               {isLoadingCart ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : cartQuantity}
             </span>
             <button onClick={handlePlusClick} className="text-primary hover:text-primary/80 transition-colors disabled:opacity-50" disabled={isLoadingCart || cartQuantity >= stock}>
               <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
             </button>
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
            className={`transition-colors p-1 rounded-full ${isWaitlisted ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
            title={isWaitlisted ? "Remove from waitlist" : "Notify me when available"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isWaitlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          </button>
        ) : (
          <button 
            onClick={handlePlusClick} 
            className="text-[#ff8952] hover:text-[#ff7536] transition-colors p-1 flex items-center justify-center"
            disabled={isLoadingCart}
          >
            {isLoadingCart ? <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} /> : <Plus className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} />}
          </button>
        )}
      </div>

      {/* Bookmark Ribbon - Positioned on the right edge, middle height of image */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={handleBookmarkClick}
        className="absolute right-0 top-[42%] -translate-y-1/2 z-20 cursor-pointer hover:scale-105 transition-transform"
      >
        <WishlistIcon isFilled={isBookmarked} preserveAspectRatio="none" className={`w-[24px] h-[18px] xs:w-[24px] xs:h-[18px] sm:w-[24px] sm:h-[18px] text-[#7B2FBE] ${isBookmarked ? 'fill-[#7B2FBE]' : 'fill-none'}`} />
      </div>

      {/* Product Image */}
      <div className="relative w-full aspect-[4/5] mb-[-10px] sm:mb-[-14px] mt-[-16px] sm:mt-[-20px] overflow-hidden bg-white flex justify-center items-center border-none">
        <Image
          src={image}
          alt={name}
          fill
          className={`object-contain p-0.5 transform group-hover:scale-105 transition-transform duration-700 ease-out drop-shadow-md ${isOutOfStock ? 'grayscale brightness-90 opacity-80' : ''}`}
        />
      </div>

      {/* Details Section Wrapper for equal reduced spacing */}
      <div className="flex-1 flex flex-col justify-end gap-0.5 sm:gap-1 z-10 w-full mt-0">
        {/* Title & Arrow Button */}
        <div className="flex items-center justify-between w-full gap-2">
          <h3 className="text-[22px] sm:text-[25px] font-normal text-[#333333] truncate flex-1 text-left tracking-tight leading-none">{name}</h3>
          <button
            type="button"
            className="w-8 h-8 sm:w-9 sm:h-9 bg-[#8c8c8c] rounded-full flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform shadow-sm z-20 -mr-3 sm:-mr-3.5"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClick?.();
            }}
          >
            <ArrowUpRight className="w-6 h-6 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Price Section & Rating */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[22px] sm:text-[25px] font-normal text-[#333333] tracking-tight leading-none">{displayPrice}</span>
            <span className="text-[15px] sm:text-[16px] text-gray-400 line-through leading-none">{displayOriginalPrice}</span>
          </div>
          <div className="flex items-center gap-1.5 -mr-2 sm:-mr-2.5">
            <Star className="w-6 h-6 sm:w-7 sm:h-7 text-[#8b5cf6] fill-[#8b5cf6]" />
            <span className="text-[22px] sm:text-[25px] font-normal text-[#333333] leading-none">{rating}</span>
          </div>
        </div>

        {/* Bottom row: Discount & Delivery Truck */}
        <div className={`flex items-center w-full ${displayDiscount ? 'justify-between' : 'justify-end'}`}>
          {displayDiscount && (
            <span className="text-[15px] sm:text-[16px] font-bold text-[#333333]">
              {displayDiscount.toString().replace(/ptr discount/i, 'off')}
            </span>
          )}
          <div className="-mr-2 sm:-mr-2.5">
            <DeliveryTruckBadge text={deliveryTime} className="w-[85px] sm:w-[90px] h-auto text-[#8c8c8c]" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
