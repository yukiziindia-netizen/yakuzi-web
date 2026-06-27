'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Plus,
  Star,
  Truck,
  ChevronDown,
  ChevronUp,
  Bell,
  RotateCcw,
  Minus,
  Search,
  User,
  Bookmark,
  ShoppingCart,
  Package,
  Filter,
  Menu,
  ArrowUpRight,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import Image from 'next/image';
import { DeliveryTruckBadge } from '@/components/shared/DeliveryTruckBadge';
import Link from 'next/link';
import { useProductById, useProducts, useWaitlist, useAddToWaitlist, useRemoveFromWaitlist } from '@/hooks/useProducts';
import { useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { useToast } from '@/components/shared/Toast';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useProductReviews, useCreateReview } from '@/hooks/useReviews';
import Navbar from '@/components/landing/Navbar';
import { generateProductSlug, parseProductIdFromSlug } from '@yukizi/utils';
import { ShareButton } from '@/components/shared/ShareButton';
import WishlistIcon from '@/components/shared/WishlistIcon';

function Accordion({
  title,
  content,
  defaultOpen = false,
}: {
  title: string;
  content?: string;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-gray-700 focus:outline-none"
      >
        {title}
        {isOpen ? (
          <Minus size={14} className="text-gray-500" strokeWidth={3} />
        ) : (
          <Plus size={14} className="text-gray-500" strokeWidth={3} />
        )}
      </button>
      <AnimatePresence>
        {isOpen && content && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="purple-scroll relative max-h-[70px] overflow-y-auto pr-4 pt-2 text-xs sm:text-[13px] font-semibold leading-relaxed text-gray-600">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RelatedProductCard({ prod, index }: { prod: any; index: number }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { mutate: addToCart } = useAddToCart();
  const { mutate: addToWishlist } = useAddToWishlist();
  const { mutate: removeFromWishlist } = useRemoveFromWishlist();
  const { data: wishlistData } = useWishlist();
  const { toast } = useToast();

  const currentProductId = prod?.id || `prod-${index}`;
  const isSaved = wishlistData?.items?.some(
    (item: any) => item.productId === currentProductId || item.product?.id === currentProductId || item.id === currentProductId
  );

  const isYukiziChoice = !!prod.isYukiziChoice || !!prod.isNew;
  const isBestSeller = !!prod.isBestSeller;
  const isAd = isYukiziChoice || isBestSeller;

  const price = prod.price;
  const mrp = prod.mrp || prod.originalPrice;
  const rating = prod.rating || 4.5;

  const displayPrice = price != null ? `₹${Number(price).toLocaleString('en-IN')}` : '₹3,345.53';
  const displayOriginalPrice = mrp != null && mrp > (price || 0) 
    ? `₹${Number(mrp).toLocaleString('en-IN')}` 
    : (price != null ? `₹${Math.round(Number(price) * 1.15).toLocaleString('en-IN')}` : '₹3,800.25');
  
  const displayDiscount = (mrp != null && price != null && mrp > price)
    ? `${Math.round(((mrp - price) / mrp) * 100)}% off`
    : '25% off';

  const displayDelivery = prod.deliveryTime || '3 days';
  const productName = prod.name || 'Product';

  const getInitials = (name: string) => {
    if (!name) return 'PR';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };
  const fallbackImage = `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent(getInitials(productName))}`;
  const imageUrl = prod.images?.[0]?.url || prod.images?.[0] || prod.image || fallbackImage;

  return (
    <div className={`relative mt-3 sm:mt-4 group flex flex-col h-full ${isMenuOpen ? 'z-50' : 'z-auto'}`}>
      {/* Yukizi Choice & Best Seller Tags */}
      <div className="absolute -top-[10px] left-2.5 sm:left-3 flex items-center gap-1 sm:gap-1.5 z-30">
        {isYukiziChoice && (
          <div className="bg-[#8b5cf6] text-white px-2 sm:px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-[11px] md:text-[11px] lg:text-[12px] xl:text-[10px] shadow-sm tracking-wide flex items-center justify-center">
            Yukizi Choice
          </div>
        )}
        {isBestSeller && (
          <div className="bg-[#4a4a4a] text-white px-2 sm:px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-[11px] md:text-[11px] lg:text-[12px] xl:text-[10px] shadow-sm tracking-wide flex items-center justify-center">
            Best Seller
          </div>
        )}
      </div>

      {/* Ad Tag */}
      {isAd && (
        <div className="absolute -top-5 right-2 text-[11px] sm:text-[12px] text-gray-500 font-medium z-20">
          Ad
        </div>
      )}

      {/* Container */}
      <div 
        className={`bg-white rounded-[14px] sm:rounded-[16px] p-2.5 sm:p-3 hover:shadow-[0_8px_30px_rgb(133,76,188,0.15)] hover:ring-1 hover:ring-primary/50 transition-all duration-300 group flex flex-col relative border ${isYukiziChoice ? 'border-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.4)]' : 'border-gray-300 shadow-sm'} w-full h-full overflow-hidden`}
      >
        {/* Top action icons */}
        <div className="flex justify-between items-center w-full absolute top-2.5 sm:top-3 left-0 px-2.5 sm:px-3 z-20">
          <div className="w-7 h-7 flex items-center justify-center">
            <ShareButton 
              productName={productName}
              productPrice={Number(price)}
              productImage={imageUrl}
              productId={currentProductId}
              className="p-1 opacity-70 hover:opacity-100 border-0 shadow-none bg-transparent"
              onOpenChange={setIsMenuOpen}
            />
          </div>
          {price != null && (
            <button 
              className="text-[#ff8952] hover:text-[#ff7536] transition-colors z-10 p-1 flex items-center justify-center" 
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                addToCart(
                  { productId: currentProductId, quantity: 1, price, originalPrice: mrp, ...prod },
                  { onSuccess: () => toast('Added to cart', 'success') }
                );
              }}
            >
               <Plus className="w-5 h-5 sm:w-5 sm:h-5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Right Edge Ribbon (Wishlist/Save) */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation();
            if (isSaved) {
              removeFromWishlist(currentProductId, {
                onSuccess: () => toast('Removed from wishlist', 'info')
              });
            } else {
              addToWishlist(prod, {
                onSuccess: () => toast('Added to wishlist', 'success')
              });
            }
          }}
          className="absolute right-0 top-[40%] -translate-y-1/2 z-20 cursor-pointer hover:scale-105 transition-transform"
        >
          <WishlistIcon isFilled={isSaved} className={`w-5 h-7 sm:w-5 sm:h-7 text-[#889096] ${isSaved ? 'fill-[#889096]' : 'fill-none'}`} />
        </div>

        {/* Image Container */}
        <Link href={`/products/${generateProductSlug(productName, prod.id || 'prod-' + index)}`} className="relative w-full aspect-[4/5] mb-[-4px] sm:mb-[-6px] mt-1 sm:mt-1.5 overflow-hidden bg-white flex justify-center items-center border-none">
           <img src={imageUrl} alt={productName} className="max-h-full max-w-full object-contain p-0.5 transform group-hover:scale-105 transition-transform duration-700 ease-out drop-shadow-md" />
        </Link>

        {/* Details Section */}
        <div className="flex-1 flex flex-col z-10 w-full mt-0 pb-0.5">
           {/* Title Line */}
           <div className="flex items-center justify-between mb-1 w-full gap-1 sm:gap-1.5">
              <h3 className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] xl:text-[13px] font-medium text-[#333333] truncate flex-1 text-left tracking-tight leading-tight">
                 {productName}
              </h3>
              <Link 
                 href={`/products/${generateProductSlug(productName, prod.id || 'prod-' + index)}`}
                 className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-6 xl:h-6 bg-[#8c8c8c] rounded-full flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform shadow-sm z-20 -mr-1 sm:-mr-1.5 md:-mr-1.5 lg:-mr-2 xl:-mr-1.5"
              >
                 <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 xl:w-3.5 xl:h-3.5 text-white" strokeWidth={2.5} />
              </Link>
           </div>
           
           {/* Price and Rating */}
           <div className="flex justify-between items-center w-full mb-1 sm:mb-1.5">
              <div className="flex items-baseline gap-1 sm:gap-1.5">
                 <span className="text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[14px] font-semibold text-[#333333] tracking-tight leading-none">
                    {displayPrice}
                 </span>
                 <span className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] xl:text-[11px] text-gray-400 line-through leading-none">{displayOriginalPrice}</span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 -mr-1 sm:-mr-1.5 md:-mr-1.5 lg:-mr-2 xl:-mr-1.5">
                 <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-4.5 lg:h-4.5 xl:w-3.5 xl:h-3.5 text-[#8b5cf6] fill-[#8b5cf6]" />
                 <span className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] xl:text-[13px] font-medium text-[#333333] leading-none">{rating}</span>
              </div>
           </div>

           {/* Bottom Badges */}
           <div className="flex justify-between items-center w-full mt-auto pt-0.5">
              <span className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] xl:text-[11px] font-bold text-[#333333]">
                 {displayDiscount}
              </span>
              <div className="-mr-1 sm:-mr-1.5 md:-mr-1.5 lg:-mr-2 xl:-mr-1.5">
                 <DeliveryTruckBadge text={displayDelivery} className="w-[55px] sm:w-[60px] md:w-[65px] lg:w-[70px] xl:w-[58px] h-auto text-[#8c8c8c]" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function ProductBannerCard({
  images,
  activeImageIndex,
  setActiveImageIndex,
  isBookmarked,
  onBookmarkToggle,
  productName,
  productId = '',
  productPrice = 0,
  variant = 'mobile',
}: {
  images: string[];
  activeImageIndex: number;
  setActiveImageIndex: (idx: number) => void;
  isBookmarked: boolean;
  onBookmarkToggle: () => void;
  productName: string;
  productId?: string;
  productPrice?: number;
  variant?: 'mobile' | 'desktop';
}) {
  const activeImage = images[activeImageIndex % images.length];
  const isDesktop = variant === 'desktop';

  return (
    <div className="relative w-full aspect-[4/3] rounded-[24px] bg-transparent flex items-center justify-center p-0 mt-4 lg:mt-0">
      {/* Share Button on Top Left Corner */}
      <div className="absolute top-4 left-4 z-30">
        <ShareButton 
          productName={productName}
          productId={productId}
          productPrice={productPrice}
          className="p-2.5 sm:p-3 bg-white rounded-full text-gray-600 focus:outline-none hover:scale-105 transition-all shadow-md hover:text-purple-600 border-none"
          iconClassName="w-5 h-5"
        />
      </div>

      {/* Vertical Thumbnails */}
      <div className="absolute left-4 lg:left-6 bottom-8 lg:bottom-14 flex flex-col gap-3.5 lg:gap-5 z-20">
        {images.slice(0, 3).map((img: string, idx: number) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveImageIndex(idx)}
            className={`w-12 h-12 lg:w-16 lg:h-16 rounded-xl overflow-hidden border bg-white/20 backdrop-blur-md shadow-md transition-all duration-200 focus:outline-none ${
              activeImageIndex === idx ? 'border-white/90 scale-105 shadow-lg' : 'border-white/30 hover:border-white/60'
            }`}
          >
            <Image 
              src={img} 
              alt="" 
              width={64}
              height={64}
              className="w-full h-full object-cover" 
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="absolute inset-0 w-full h-full rounded-[24px] overflow-hidden">
        {activeImage && (
          <Image
            src={activeImage}
            alt={productName}
            fill
            className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
            priority
          />
        )}
      </div>

      {/* Ribbon Bookmark flag on the right edge */}
      <button
        type="button"
        onClick={onBookmarkToggle}
        className="absolute -right-[10px] sm:-right-[12px] top-[45%] z-30 focus:outline-none transition-transform hover:scale-105"
      >
        <svg
          width="44"
          height="40"
          viewBox="0 0 44 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible drop-shadow-md"
        >
          <path
            d="M0 0 H44 V40 H0 L12 20 Z"
            fill={isBookmarked ? "#854cbc" : "#ffffff"}
            stroke="#854cbc"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

function ComparisonOffersList({
  comparisonListings,
  cartData,
  minOrderAmount,
  addToCart,
  updateCartItem,
  removeCartItem,
  productName,
  productMrp,
  toast,
  setShowStockAlert,
}: {
  comparisonListings: any[];
  cartData: any;
  minOrderAmount: number;
  addToCart: any;
  updateCartItem: any;
  removeCartItem: any;
  productName: string;
  productMrp: number;
  toast: any;
  setShowStockAlert: (val: boolean) => void;
}) {
  const cartItemMap = new Map<string, any>();
  if (cartData?.items) {
    cartData.items.forEach((item: any) => {
      if (item.productId) cartItemMap.set(item.productId, item);
    });
  }

  if (!comparisonListings || comparisonListings.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center text-xs font-semibold text-gray-400">
        No active offers available for this product.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {comparisonListings.map((listing: any, index: number) => {
        const inStock = (listing.stock ?? 0) > 0;
        const cartItem = cartItemMap.get(listing.id);
        const itemQty = cartItem?.quantity || 0;
        const sellerMoq = listing.moq || listing.minimumOrderQuantity || 1;
        const minQty = listing.price > 0
          ? Math.max(sellerMoq, Math.ceil(minOrderAmount / listing.price))
          : sellerMoq;

        const discountPercent = listing.discount || 1.99;

        const handleQtyChange = (newQty: number) => {
          if (cartItem) {
            if (newQty > 0) {
              updateCartItem.mutate({
                itemId: cartItem.id,
                quantity: newQty,
              });
            } else {
              removeCartItem.mutate(cartItem.id);
            }
          } else {
            if (newQty > 0) {
              addToCart.mutate({
                productId: listing.id,
                quantity: newQty,
                productName: productName,
                price: listing.price,
                mrp: productMrp,
              });
            }
          }
        };

        return (
          <div 
            key={listing.id} 
            className="flex flex-row items-center justify-between py-2 px-3 sm:py-2.5 sm:px-6 rounded-2xl bg-[#eaeaea] border border-gray-200/60 hover:border-purple-200 transition-colors w-full gap-2 sm:gap-4 shadow-sm"
          >
            {/* 1. Discount Badge */}
            <div className="flex-1 flex justify-start">
              <div className="bg-[#854cbc] text-white px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-[13px] font-bold tracking-wide select-none shadow-sm whitespace-nowrap">
                {discountPercent}% <span className="text-[8px] sm:text-[10px]">off</span>
              </div>
            </div>

            {/* 2. Price & Subtext */}
            <div className="flex-1 flex flex-col items-center text-center">
              <span className="text-[15px] sm:text-[18px] lg:text-[22px] font-bold text-gray-800 leading-none tracking-tight">
                ₹{listing.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] sm:text-[11px] text-gray-500 font-medium mt-1 leading-none whitespace-nowrap">
                {listing.moq > 1 ? `${listing.moq * 10}% off on purchase of ${listing.moq}` : '25%off on purchase of 3'}
              </span>
            </div>

            {/* 3. Star Rating */}
            <div className="flex-1 flex items-center justify-center gap-1 sm:gap-2">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 fill-[#854cbc] text-[#854cbc] flex-shrink-0" />
              <span className="text-gray-800 font-bold text-[14px] sm:text-[18px] lg:text-[22px] leading-none">{listing.seller?.rating || '4.5'}</span>
            </div>

            {/* 4. Delivery badge */}
            <div className="flex-1 flex items-center justify-center">
              <DeliveryTruckBadge text={listing.deliveryText || '3 days'} className="w-[55px] sm:w-[70px] lg:w-[84px] h-auto text-gray-500 flex-shrink-0" />
            </div>

            {/* 5. Actions (Plus / Incremental / Reset) */}
            <div className="flex-1 flex items-center justify-end gap-1 sm:gap-3">
              {inStock ? (
                itemQty === 0 ? (
                  <button 
                    onClick={() => handleQtyChange(minQty)}
                    className="text-orange-500 hover:text-orange-600 focus:outline-none transition-transform active:scale-90 p-1 sm:p-2"
                  >
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 stroke-[2.5] lg:stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4">
                    {/* Reset Button */}
                    <button 
                      onClick={() => { handleQtyChange(0); toast('Quantity reset', 'info'); }}
                      title="Reset quantity"
                      className="text-[#48286b] hover:text-purple-900 transition-transform active:scale-90 focus:outline-none p-0.5 sm:p-1"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85 1.05 6.5 2.5L21 8" />
                        <path d="M21 3v5h-5" />
                      </svg>
                    </button>
                    
                    {/* Quantity Control Pill */}
                    <div className="flex items-center bg-[#48286b] rounded-xl sm:rounded-2xl overflow-hidden h-8 w-20 sm:h-9 sm:w-28 lg:h-11 lg:w-36 text-white shadow-sm select-none justify-between px-1 sm:px-2">
                      <button 
                        className="w-5 sm:w-8 lg:w-10 h-full flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all text-white font-bold text-base sm:text-xl lg:text-2xl pb-0.5 sm:pb-1"
                        onClick={() => handleQtyChange(itemQty - 1)}
                      >
                        -
                      </button>
                      <span className="font-black text-xs sm:text-base lg:text-xl tracking-wide">{String(itemQty).padStart(2, '0')}</span>
                      <button 
                        className="w-5 sm:w-8 lg:w-10 h-full flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all text-white font-bold text-base sm:text-xl lg:text-2xl pb-0.5 sm:pb-1"
                        onClick={() => handleQtyChange(itemQty + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <>
                  <span className="text-[10px] sm:text-[11px] font-bold text-red-500 whitespace-nowrap">Out of Stock</span>
                  <button 
                    onClick={() => setShowStockAlert(true)}
                    className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center border border-red-100 active:scale-95 transition-all focus:outline-none flex-shrink-0"
                  >
                    <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReviewSubmissionForm({
  rating,
  setRating,
  reviewTitle,
  setReviewTitle,
  reviewComment,
  setReviewComment,
  onSubmit,
}: {
  rating: number;
  setRating: (r: number) => void;
  reviewTitle: string;
  setReviewTitle: (t: string) => void;
  reviewComment: string;
  setReviewComment: (c: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 border border-gray-200 rounded-2xl bg-white p-5 shadow-sm mt-6">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Your overall rating</h3>
      
      {/* Stars selector */}
      <div className="flex gap-1.5 text-gray-300">
        {[1, 2, 3, 4, 5].map((starVal) => (
          <button
            type="button"
            key={starVal}
            onClick={() => setRating(starVal)}
            className="focus:outline-none transition-transform active:scale-90"
          >
            <Star 
              size={28} 
              className={`transition-colors ${starVal <= rating ? 'fill-[#854cbc] text-[#854cbc]' : 'text-gray-300'}`} 
            />
          </button>
        ))}
      </div>

      {/* Review Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-gray-500 uppercase">Title of your review</label>
        <input
          type="text"
          value={reviewTitle}
          onChange={(e) => setReviewTitle(e.target.value)}
          placeholder="Summarize your review or highlight an interesting detail"
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-[#854cbc] focus:outline-none"
        />
      </div>

      {/* Review Comment */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-gray-500 uppercase">Your review</label>
        <textarea
          rows={3}
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          placeholder="Share your genuine thought about the product..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-[#854cbc] focus:outline-none resize-none"
        />
      </div>

      {/* Dropzone Photo Uploader */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-gray-500 uppercase">Do you have photos to share?</label>
        <div className="border border-dashed border-gray-300 rounded-xl bg-gray-50 p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100/70 transition-colors">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] text-gray-400 font-bold text-center">
            Drag & Drop your picture or <span className="text-[#854cbc] underline">Browse</span>
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <button 
        type="submit"
        className="w-full bg-[#854cbc] hover:bg-purple-800 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-wider shadow-sm transition-colors mt-2"
      >
        Submit Review
      </button>
    </form>
  );
}

const getMockReviewsForProduct = (productName: string, categoryName?: string, productImage?: string) => {
  const cleanName = productName || 'product';
  const cleanCategory = categoryName || 'items';
  
  return [
    {
      id: 'mock-rev-1',
      userName: 'Amit Sharma',
      rating: 5,
      comment: `Extremely satisfied with the ${cleanName}! The quality is superb and it matches the description perfectly. Highly recommended if you are looking for reliable ${cleanCategory}.`,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-rev-2',
      userName: 'Priya Patel',
      rating: 4,
      comment: `Good purchase. The ${cleanName} works exactly as expected. Quick delivery and secure packaging. Will definitely buy more from this category.`,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      image: productImage || null,
    }
  ];
};

export default function AnimeProductPage({ params }: { params: { productSlug: string } }) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantName, setSelectedVariantName] = useState<string>('');

  // Extract ID from slug
  const productSlugOrId = parseProductIdFromSlug(params.productSlug);

  const { data: productData, isLoading, isError } = useProductById(productSlugOrId);
  const { data: cartData } = useCart();
  const addToCart = useAddToCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();
  const { toast } = useToast();

  const { data: wishlistData } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const product = (productData as any)?.data || productData;

  const { data: reviewsData } = useProductReviews(product?.id || '');
  const { mutate: submitReview } = useCreateReview();

  // Review state
  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [showStockAlert, setShowStockAlert] = useState(false);

  const { data: relatedProductsData } = useProducts({
    categoryId: product?.category?.id,
    limit: 6,
  });

  const productVariants = product?.variants || [];

  // Ensure first variant is selected by default
  useEffect(() => {
    if (productVariants.length > 0 && !selectedVariantName) {
      setSelectedVariantName(productVariants[0].name);
    }
  }, [productVariants, selectedVariantName]);

  const wishlistSet = new Set<string>();
  if (wishlistData?.items) {
    wishlistData.items.forEach((item: any) => {
      if (item.productId) wishlistSet.add(item.productId);
    });
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col bg-white pb-32">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#854cbc]" />
        </div>
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className="flex min-h-screen flex-col bg-white pb-32">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-xl font-bold text-gray-500">Product not found</div>
        </div>
      </main>
    );
  }

  // Calculated variables safe to declare now that product is guaranteed to exist:
  const isYukiziChoice = !!product.isYukiziChoice || !!product.isNew;
  const isBestSeller = !!product.isBestSeller;
  const isAd = isYukiziChoice || isBestSeller;

  const images =
    product.images && product.images.length > 0
      ? product.images.map((img: any) => img.url || img)
      : [
          `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent((product.name || 'PR').trim().split(/\s+/).length === 1 ? (product.name || 'PR').trim().substring(0, 2).toUpperCase() : ((product.name || 'PR').trim().split(/\s+/)[0][0] + (product.name || 'PR').trim().split(/\s+/)[(product.name || 'PR').trim().split(/\s+/).length - 1][0]).toUpperCase())}`,
        ];

  const displayImages = [...images];
  while (displayImages.length < 3 && displayImages.length > 0) {
    displayImages.push(images[0]);
  }

  const reviewsList = reviewsData?.data && reviewsData.data.length > 0
    ? reviewsData.data
    : getMockReviewsForProduct(product?.name || 'Product', product?.category?.name || 'Item', images[0]);

  const averageRating = reviewsData?.averageRating || (reviewsData?.data && reviewsData.data.length > 0
    ? (reviewsData.data.reduce((acc: number, curr: any) => acc + curr.rating, 0) / reviewsData.data.length)
    : 4.5);

  const totalReviews = reviewsData?.total || (reviewsData?.data && reviewsData.data.length > 0 ? reviewsData.data.length : reviewsList.length);

  const listings = product.listings || [];
  const validListings = listings.filter((l: any) => l.price != null);
  const displayPrice =
    validListings.length > 0 ? Math.min(...validListings.map((l: any) => l.price)) : product.price;
  const displayMrp =
    validListings.find((l: any) => l.mrp || l.originalPrice)?.mrp ||
    validListings.find((l: any) => l.mrp || l.originalPrice)?.originalPrice ||
    product.mrp ||
    product.originalPrice;
  const relatedProducts = relatedProductsData?.data || [];

  // Filter listings based on the selected variant
  const filteredListings =
    productVariants.length > 0 && selectedVariantName
      ? listings.filter(
          (l: any) =>
            l.variantName === selectedVariantName ||
            l.name === selectedVariantName ||
            l.name?.includes(selectedVariantName),
        )
      : listings;

  const comparisonListings = filteredListings || [];

  // Wishlist / Bookmark logic
  const isBookmarked = wishlistSet.has(product.id);
  const handleBookmarkToggle = () => {
    if (isBookmarked) {
      removeFromWishlist.mutate(product.id, {
        onSuccess: () => toast('Removed from wishlist', 'success'),
      });
    } else {
      addToWishlist.mutate({
        productId: product.id,
        productName: product.name,
        price: displayPrice || 0,
        image: product.image || images[0],
      }, {
        onSuccess: () => toast('Added to wishlist!', 'success'),
      });
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast('Please select a rating star', 'error');
      return;
    }
    
    const comment = reviewTitle ? `${reviewTitle}: ${reviewComment}` : reviewComment;
    
    submitReview({
      productId: product.id,
      rating,
      comment,
    }, {
      onSuccess: () => {
        toast('Review submitted successfully!', 'success');
        setRating(0);
        setReviewTitle('');
        setReviewComment('');
      },
      onError: () => {
        toast('Failed to submit review', 'error');
      }
    });
  };

  return (
    <main className="min-h-screen bg-white pb-32">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .purple-scroll::-webkit-scrollbar { width: 5px; }
        .purple-scroll::-webkit-scrollbar-track { background: transparent; }
        .purple-scroll::-webkit-scrollbar-thumb { background: #854cbc; border-radius: 5px; }
      `,
        }}
      />

      <div className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 xl:px-12 2xl:max-w-[1600px]">
        
        {/* MOBILE VIEW LAYOUT */}
        <div className="block lg:hidden flex flex-col gap-5 w-full">
          {/* Dynamic Tags Header */}
          <div className="flex items-center justify-between w-full px-1 mb-1">
            <div className="flex items-center gap-2">
              {isYukiziChoice && (
                <div className="rounded-full bg-[#854cbc] px-4 py-1 text-[12px] font-bold tracking-wide text-white shadow-sm">
                  Yukizi Choice
                </div>
              )}
              {isBestSeller && (
                <div className="rounded-full bg-[#4a4a4a] px-4 py-1 text-[12px] font-bold tracking-wide text-white shadow-sm">
                  Best Seller
                </div>
              )}
            </div>
            {isAd && (
              <span className="text-[13px] text-gray-400 font-bold select-none">Ad</span>
            )}
          </div>

          {/* Banner Card */}
          <ProductBannerCard 
            images={displayImages}
            activeImageIndex={activeImage}
            setActiveImageIndex={setActiveImage}
            isBookmarked={isBookmarked}
            onBookmarkToggle={handleBookmarkToggle}
            productName={product.name}
            productId={product.id}
            productPrice={displayPrice}
          />

          <hr className="border-gray-100" />

          {/* Product Title */}
          <h1 className="text-xl font-bold text-gray-800 leading-tight">
            {product.name}
          </h1>

          {/* 8-Row Comparison list */}
          <ComparisonOffersList 
            comparisonListings={comparisonListings}
            cartData={cartData}
            minOrderAmount={20000}
            addToCart={addToCart}
            updateCartItem={updateCartItem}
            removeCartItem={removeCartItem}
            productName={product.name}
            productMrp={displayMrp || displayPrice}
            toast={toast}
            setShowStockAlert={setShowStockAlert}
          />

          {/* Accordions */}
          <div className="mt-2">
            <Accordion
              title="OFFERS"
              content={product.offers || 'No offers available at this moment.'}
            />
            <Accordion
              title="DESCRIPTION"
              content={product.description || 'No description available.'}
              defaultOpen={true}
            />
            <Accordion title="SHIPPING & RETURN INFO" />
            <Accordion title="ADDITIONAL INFO" />
          </div>

          {/* Related Products */}
          <div className="mt-4 border-t border-gray-100 pt-6">
            <h2 className="mb-4 text-base font-bold text-gray-600 uppercase tracking-wider">Related Products</h2>
            <div className="grid grid-cols-2 gap-x-3.5 gap-y-[28px] pb-4">
              {relatedProducts.slice(0, 4).map((prod: any, idx: number) => (
                <RelatedProductCard key={prod.id} prod={prod} index={idx} />
              ))}
            </div>
          </div>

          {/* Reviews Summary Section */}
          <div className="mt-4 border-t border-gray-100 pt-6">
            <h2 className="mb-4 text-base font-bold text-gray-600 uppercase tracking-wider">Reviews</h2>
            <div className="mb-5 flex items-center justify-between w-full">
              <div>
                <div className="mb-1 flex items-center gap-3">
                  <div className="flex gap-1 text-[#854cbc]">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const fillPercent = Math.max(0, Math.min(100, (averageRating - (starVal - 1)) * 100));
                      return (
                        <div key={starVal} className="relative h-6 w-6">
                          <Star
                            size={24}
                            fill="none"
                            stroke="currentColor"
                            className="absolute text-[#854cbc]"
                          />
                          {fillPercent > 0 && (
                            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                              <Star size={24} fill="currentColor" className="text-[#854cbc]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[28px] font-black leading-none text-gray-800">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
                <p className="text-[13px] font-medium text-gray-400">
                  {averageRating.toFixed(1)} out of 5 stars (based on {totalReviews} review{totalReviews !== 1 ? 's' : ''})
                </p>
              </div>

              <button
                type="button"
                className="bg-[#854cbc] hover:bg-purple-800 text-white rounded-xl px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
              >
                See all reviews
              </button>
            </div>

            {/* Review Cards Carousel */}
            <div className="hide-scrollbar flex flex-col gap-4 overflow-x-auto pb-2 sm:flex-row">
              {reviewsList.map((rev: any) => {
                const reviewImage = rev.image || rev.imageUrl;
                return (
                  <div key={rev.id} className="flex min-w-[280px] flex-1 flex-row justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col justify-between flex-1">
                      <p className="mb-4 text-[11px] font-medium leading-relaxed text-gray-500">
                        {rev.comment}
                      </p>
                      <div>
                        <div className="mb-1.5 flex gap-0.5 text-[#b165f1]">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} size={14} fill={i <= rev.rating ? "currentColor" : "none"} className={i <= rev.rating ? "text-[#b165f1]" : "text-gray-200"} />
                          ))}
                        </div>
                        <p className="text-[10px] font-semibold text-gray-400">
                          - {rev.userName || 'Anonymous'}, {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {reviewImage && (
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 self-center border border-gray-100 bg-white">
                        <img src={reviewImage} alt="Review attachment" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Review Submission Form */}
            <ReviewSubmissionForm 
              rating={rating}
              setRating={setRating}
              reviewTitle={reviewTitle}
              setReviewTitle={setReviewTitle}
              reviewComment={reviewComment}
              setReviewComment={setReviewComment}
              onSubmit={handleReviewSubmit}
            />
          </div>
        </div>

        {/* DESKTOP VIEW LAYOUT */}
        <div className="hidden lg:flex flex-col gap-6 w-full">
          {/* Header Row */}
          <div className="grid grid-cols-[1.15fr_1fr] gap-10 items-center mt-6">
            {/* Left Header */}
            <div className="flex items-center justify-between w-full mb-2">
              <div className="flex items-center gap-2">
                {isYukiziChoice && (
                  <div className="rounded-full bg-[#854cbc] px-4 py-1 text-[12px] font-bold tracking-wide text-white shadow-sm">
                    Yukizi Choice
                  </div>
                )}
                {isBestSeller && (
                  <div className="rounded-full bg-[#4a4a4a] px-4 py-1 text-[12px] font-bold tracking-wide text-white shadow-sm">
                    Best Seller
                  </div>
                )}
              </div>
              {isAd && (
                <span className="text-[13px] text-gray-400 font-bold select-none">Ad</span>
              )}
            </div>

            {/* Right Header */}
            <div className="hide-scrollbar flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-gray-400">
              <Link href="/" className="transition-colors hover:text-[#854cbc]">
                Home
              </Link>
              <span>&gt;</span>
              {product.category && (
                <>
                  <Link
                    href={`/category/${product.category.slug || product.category.id}`}
                    className="transition-colors hover:text-[#854cbc]"
                  >
                    {product.category.name || 'Category'}
                  </Link>
                  <span>&gt;</span>
                </>
              )}
              {product.subCategory && (
                <>
                  <span className="cursor-pointer transition-colors hover:text-[#854cbc]">
                    {product.subCategory.name}
                  </span>
                  <span>&gt;</span>
                </>
              )}
              <span className="max-w-[200px] truncate text-gray-700">
                {product.name}
              </span>
            </div>
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-[1.15fr_1fr] gap-10 items-start">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              {/* Product Image Banner */}
              <ProductBannerCard 
                images={displayImages}
                activeImageIndex={activeImage}
                setActiveImageIndex={setActiveImage}
                isBookmarked={isBookmarked}
                onBookmarkToggle={handleBookmarkToggle}
                productName={product.name}
                productId={product.id}
                productPrice={displayPrice}
                variant="desktop"
              />

              {/* Accordions */}
              <div className="pr-2">
                <Accordion
                  title="DESCRIPTION"
                  content={product.description || 'No description available.'}
                  defaultOpen={true}
                />
                <Accordion title="PRODUCT SPECIFICATIONS" />
                <Accordion title="SHIPPING & RETURN INFO" />
                <Accordion title="ADDITIONAL INFO" />
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col">
              {/* Title Block */}
              <div className="flex items-start justify-between w-full mb-3">
                <h1 className="text-2xl font-semibold text-gray-500 tracking-tight leading-tight max-w-[85%]">
                  {product.name}
                </h1>
              </div>

              {/* Price details */}
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-[26px] font-semibold text-gray-700 leading-none">
                  ₹{displayPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                {displayMrp && displayMrp > displayPrice && (
                  <span className="text-[13px] font-bold text-gray-400 line-through leading-none">
                    ₹{displayMrp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>

              {/* Discount / rating line */}
              <div className="flex items-center justify-between w-full border-b border-gray-100 pb-5 mb-5">
                <span className="text-[14px] font-semibold text-gray-700 select-none">
                  {displayMrp && displayPrice && displayMrp > displayPrice
                    ? `${Math.round(((displayMrp - displayPrice) / displayMrp) * 100)}% off`
                    : '25% off'}
                </span>
                
                <div className="flex items-center gap-4">
                  <DeliveryTruckBadge text="3 days" className="w-[72px] h-auto text-gray-400" />
                  <div className="flex items-center gap-1">
                    <Star className="w-4.5 h-4.5 fill-[#854cbc] text-[#854cbc]" />
                    <span className="text-[15px] font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* 8-row comparison list */}
              <ComparisonOffersList 
                comparisonListings={comparisonListings}
                cartData={cartData}
                minOrderAmount={20000}
                addToCart={addToCart}
                updateCartItem={updateCartItem}
                removeCartItem={removeCartItem}
                productName={product.name}
                productMrp={displayMrp || displayPrice}
                toast={toast}
                setShowStockAlert={setShowStockAlert}
              />
            </div>
          </div>

          {/* Bottom Section: Related Products & Reviews */}
          <div className="grid grid-cols-[1.15fr_1fr] gap-10 border-t border-gray-100 pt-8 mt-6">
            {/* Left: Related Products */}
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wider">Related Products</h2>
              <div className="grid grid-cols-3 gap-5 pb-4">
                {relatedProducts.map((prod: any, idx: number) => (
                  <RelatedProductCard key={prod.id} prod={prod} index={idx} />
                ))}
              </div>
            </div>

            {/* Right: Reviews */}
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wider mb-4">Reviews</h2>
              
              <div className="mb-6 flex items-center justify-between w-full">
                <div>
                  <div className="mb-1 flex items-center gap-3">
                    <div className="flex gap-1 text-[#854cbc]">
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const fillPercent = Math.max(0, Math.min(100, (averageRating - (starVal - 1)) * 100));
                        return (
                          <div key={starVal} className="relative h-6 w-6">
                            <Star
                              size={24}
                              fill="none"
                              stroke="currentColor"
                              className="absolute text-[#854cbc]"
                            />
                            {fillPercent > 0 && (
                              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                                <Star size={24} fill="currentColor" className="text-[#854cbc]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-[28px] font-black leading-none text-gray-800">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-gray-400">
                    {averageRating.toFixed(1)} out of 5 stars (based on {totalReviews} review{totalReviews !== 1 ? 's' : ''})
                  </p>
                </div>

                <button
                  type="button"
                  className="bg-[#854cbc] hover:bg-purple-800 text-white rounded-xl px-5 py-2.5 text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
                >
                  See all reviews
                </button>
              </div>

              {/* Review Cards Carousel */}
              <div className="hide-scrollbar flex flex-col gap-4 overflow-x-auto pb-2 sm:flex-row">
                {reviewsList.map((rev: any) => {
                  const reviewImage = rev.image || rev.imageUrl;
                  return (
                    <div key={rev.id} className="flex min-w-[280px] flex-1 flex-row justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col justify-between flex-1">
                        <p className="mb-4 text-[11px] font-medium leading-relaxed text-gray-500">
                          {rev.comment}
                        </p>
                        <div>
                          <div className="mb-1.5 flex gap-0.5 text-[#b165f1]">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star key={i} size={14} fill={i <= rev.rating ? "currentColor" : "none"} className={i <= rev.rating ? "text-[#b165f1]" : "text-gray-200"} />
                            ))}
                          </div>
                          <p className="text-[10px] font-semibold text-gray-400">
                            - {rev.userName || 'Anonymous'}, {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      {reviewImage && (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 self-center border border-gray-100 bg-white">
                          <img src={reviewImage} alt="Review attachment" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Review Submission Form */}
              <ReviewSubmissionForm 
                rating={rating}
                setRating={setRating}
                reviewTitle={reviewTitle}
                setReviewTitle={setReviewTitle}
                reviewComment={reviewComment}
                setReviewComment={setReviewComment}
                onSubmit={handleReviewSubmit}
              />
            </div>
          </div>
        </div>

      </div>
      <Navbar />
    </main>
  );
}
