'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Share2, Plus, Minus, Star, Truck, Loader2, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { ShareButton } from './ShareButton';
import WishlistIcon from '@/components/shared/WishlistIcon';

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
  productId
}: ProductCardProps) {
  const isOutOfStock = stock <= 0;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const displayPrice = typeof price === 'number' ? `₹${price.toFixed(2)}` : price;
  const displayOriginalPrice = typeof originalPrice === 'number' ? `₹${originalPrice.toFixed(2)}` : (originalPrice || `₹${(Number(price) * 1.2).toFixed(2)}`);
  const displayDiscount = discount || '15% off';

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
      className={`bg-white rounded-[20px] p-4 shadow-sm hover:shadow-[0_8px_30px_rgb(133,76,188,0.15)] hover:ring-1 hover:ring-primary/50 transition-all duration-300 cursor-pointer group flex flex-col relative border border-gray-200 ${isMenuOpen ? 'z-50' : 'z-auto'}`}
    >
      {/* Top action icons */}
      <div className="flex justify-between items-start w-full absolute top-4 left-0 px-4 z-20">
        <div className="w-6 h-6 flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
          <ShareButton 
            productName={name} 
            productPrice={Number(price)} 
            productImage={image} 
            productId={productId || ''} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-0 border-0 bg-transparent shadow-none w-auto h-auto"
            onOpenChange={setIsMenuOpen}
          />
        </div>
        
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
        ) : (
          <button 
            onClick={handlePlusClick} 
            className="text-secondary hover:text-secondary/80 transition-colors p-1"
            disabled={isLoadingCart || isOutOfStock}
          >
            {isLoadingCart ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} /> : <Plus className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />}
          </button>
        )}
      </div>

      {/* Bookmark Ribbon */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={handleBookmarkClick}
        className="absolute right-3 top-4 z-20 outline-none w-[32px] h-[32px] bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
      >
        <WishlistIcon isFilled={isBookmarked} className="w-[18px] h-[18px] text-[#8b5cf6]" />
      </button>

      <div className="relative w-full aspect-[4/5] mb-2 sm:mb-4 mt-6 overflow-hidden bg-white flex justify-center items-center">
        <Image
          src={image}
          alt={name}
          fill
          className={`object-contain p-2 transform group-hover:scale-105 transition-transform duration-700 ease-out drop-shadow-md ${isOutOfStock ? 'grayscale brightness-90 opacity-80' : ''}`}
        />
      </div>

      <div className="flex items-center justify-between mb-1.5 w-full">
        <h3 className="text-[14px] sm:text-[15px] font-medium text-gray-800 truncate flex-1 text-left">{name}</h3>
        <button
          type="button"
          className="w-[22px] h-[22px] bg-[#999999] rounded-full flex items-center justify-center ml-2 flex-shrink-0 hover:scale-110 transition-transform shadow-sm z-20"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClick?.();
          }}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        </button>
      </div>
      
      <div className="flex justify-between items-center w-full mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] sm:text-[16px] font-medium text-gray-900 tracking-tight">{displayPrice}</span>
          <span className="text-[11px] sm:text-[12px] text-gray-400 line-through">{displayOriginalPrice}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary fill-primary" />
          <span className="text-[13px] sm:text-[14px] font-medium text-gray-700">{rating}</span>
        </div>
      </div>

      <div className="flex justify-between items-center w-full mt-auto">
        <span className="text-[11px] sm:text-[12px] font-bold text-gray-900">{displayDiscount}</span>
        <div className="flex items-center gap-1.5 bg-gray-100/80 px-2.5 py-1 rounded-lg">
          <span className="text-[11px] sm:text-[12px] font-semibold text-gray-600">{deliveryTime}</span>
          <Truck className="w-3.5 h-3.5 text-gray-500" strokeWidth={1.5} />
        </div>
      </div>
    </motion.div>
  );
}
