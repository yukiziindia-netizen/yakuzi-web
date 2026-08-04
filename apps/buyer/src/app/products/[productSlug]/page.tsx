'use client';

import { useState, useEffect, useRef } from 'react';
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
  RotateCw,
  Minus,
  Search,
  User,
  Bookmark,
  ShoppingCart,
  Package,
  Filter,
  Menu,
  Eye,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import Image from 'next/image';
import { DeliveryTruckBadge } from '@/components/shared/DeliveryTruckBadge';
import Link from 'next/link';
import { useProductById, useProducts, useWaitlist, useAddToWaitlist, useRemoveFromWaitlist } from '@/hooks/useProducts';
import { useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { useToast } from '@/components/shared/Toast';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useProductReviews, useCreateReview } from '@/hooks/useReviews';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { uploadReviewImage } from '@yukizi/api-client';
import Navbar from '@/components/landing/Navbar';
import { generateProductSlug, parseProductIdFromSlug, calculatePricing } from '@yukizi/utils';
import { ShareButton } from '@/components/shared/ShareButton';
import WishlistIcon from '@/components/shared/WishlistIcon';
import { renderBuyerOfferBadge } from '@/components/landing/ProductCarousel';

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
        className="flex w-full items-center justify-between text-left text-xs sm:text-[13px] xl:text-[14px] 2xl:text-[15px] font-normal uppercase tracking-wider text-gray-500 focus:outline-none"
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
            <div className="purple-scroll relative max-h-[70px] overflow-y-auto pr-4 pt-2 text-xs sm:text-[13px] xl:text-[14px] 2xl:text-[15px] font-normal leading-relaxed text-gray-500">
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
  const { data: waitlistData } = useWaitlist();
  const { mutate: addToWaitlist } = useAddToWaitlist();
  const { mutate: removeFromWaitlist } = useRemoveFromWaitlist();
  const { toast } = useToast();

  const currentProductId = prod?.id || `prod-${index}`;
  const isSaved = wishlistData?.items?.some(
    (item: any) => item.productId === currentProductId || item.product?.id === currentProductId || item.id === currentProductId
  );

  const isYukiziChoice = !!prod.isYukiziChoice || !!prod.isNew;
  const isBestSeller = !!prod.isBestSeller;
  const isAd = isYukiziChoice || isBestSeller;

  // 1. Extract pre-calculated selling price if available
  const rawPrice = prod?.price ?? prod?.finalCustomerPayable ?? prod?.sellingPrice ?? prod?.sellerOffers?.[0]?.finalCustomerPayable ?? prod?.sellerOffers?.[0]?.mrp;
  const directPrice = (rawPrice != null && !isNaN(Number(rawPrice))) ? Number(rawPrice) : 0;
  
  // 2. Extract MRP / original price from all candidate fields
  const rawMrp = prod?.mrp ?? prod?.originalPrice ?? prod?.sellerOffers?.[0]?.mrp ?? prod?.lowestPrice ?? prod?.price;
  const mrpVal = (rawMrp != null && !isNaN(Number(rawMrp))) ? Number(rawMrp) : 0;

  // 3. Compute pricing via calculatePricing if MRP is available
  const pricing = mrpVal > 0 ? calculatePricing(
    mrpVal,
    Number(prod?.gstPercent || 0),
    {
      type: prod?.discountType || (prod?.discountMeta?.discountPercent ? 'ptr_discount' : 'none'),
      discountPercent: prod?.discountMeta?.discountPercent,
      specialPrice: prod?.discountMeta?.specialPrice,
      buy: prod?.discountMeta?.buy,
      get: prod?.discountMeta?.get,
      bonusProductName: prod?.discountMeta?.bonusProductName,
      shippingCharges: prod?.finalShippingPrice ?? prod?.shippingCharges ?? 0,
      shippingGstPercent: 0,
      isTaxIncluded: true,
    }
  ) : null;

  const computedPrice = (pricing?.finalCustomerPayable != null && pricing.finalCustomerPayable > 0) 
    ? Number(pricing.finalCustomerPayable) 
    : 0;

  const finalPrice = directPrice > 0 ? directPrice : (computedPrice > 0 ? computedPrice : mrpVal);
  const discountPercent = Number(prod?.discountMeta?.discountPercent || 0);
  let finalOriginalPrice = mrpVal > finalPrice ? mrpVal : 0;
  if (finalOriginalPrice === 0 && discountPercent > 0 && finalPrice > 0) {
    finalOriginalPrice = Math.round(finalPrice / (1 - discountPercent / 100));
  }
  const rating = prod?.rating || 4.5;
  const hasNoSellers = prod?.sellerCount === 0 || prod?.hasSellers === false;
  const isNotAvailable = hasNoSellers && finalPrice <= 0 && mrpVal <= 0;
  const showBellIcon = hasNoSellers || (prod?.stock !== undefined && prod.stock <= 0);

  const isWaitlisted = waitlistData?.some((item: any) => item.productId === currentProductId) || false;

  const handleToggleWaitlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isWaitlisted) {
      removeFromWaitlist(currentProductId, {
        onSuccess: () => toast('Removed from waitlist', 'info')
      });
    } else {
      addToWaitlist(currentProductId, {
        onSuccess: () => toast('Added to waitlist', 'success')
      });
    }
  };

  const displayPrice = finalPrice > 0 
    ? `₹${Math.round(finalPrice)}` 
    : (mrpVal > 0 ? `₹${Math.round(mrpVal)}` : 'N/A');

  const displayOriginalPrice = (finalOriginalPrice > 0 && finalOriginalPrice > finalPrice)
    ? `₹${Math.round(finalOriginalPrice)}`
    : '';

  const displayDelivery = prod.deliveryText || prod.deliveryTime || '3 days';
  const productName = prod.name || 'Product';

  const getInitials = (name: string) => {
    if (!name) return 'PR';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };
  const fallbackImage = `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent(getInitials(productName))}`;
  const imageUrl = prod.images?.[0]?.url || prod.images?.[0] || prod.image || fallbackImage;

  const { data: cartData, isLoading: isLoadingCart } = useCart();
  const { mutate: updateCartItem } = useUpdateCartItem();
  const { mutate: removeCartItem } = useRemoveCartItem();

  const targetProductId = prod.bestListingId || currentProductId;
  const cartItem = cartData?.items?.find(
    (item: any) => item.productId === targetProductId || item.product?.id === targetProductId || item.id === targetProductId
  );
  const cartQuantity = cartItem?.quantity || 0;

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isLoadingCart) return;
    if (cartItem) {
      updateCartItem({
        itemId: cartItem.id,
        quantity: cartQuantity + 1,
      });
    } else {
      addToCart(
        { productId: targetProductId, quantity: 1, price: finalPrice, originalPrice: finalOriginalPrice || mrpVal, ...prod },
        { onSuccess: () => toast('Added to cart', 'success') }
      );
    }
  };

  const handleMinusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isLoadingCart) return;
    if (cartItem) {
      if (cartQuantity > 1) {
        updateCartItem({
          itemId: cartItem.id,
          quantity: cartQuantity - 1,
        });
      } else if (cartQuantity === 1) {
        removeCartItem(cartItem.id);
      }
    }
  };

  const handleResetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isLoadingCart) return;
    if (cartItem) {
      removeCartItem(cartItem.id, {
        onSuccess: () => toast('Removed from cart', 'info')
      });
    }
  };

  return (
    <div className={`relative mt-3 sm:mt-4 group flex flex-col h-full ${isMenuOpen ? 'z-50' : 'z-auto'}`}>
      {/* Yukizi Choice & Best Seller Tags */}
      <div className="absolute -top-[8px] left-2 sm:left-2 flex items-center gap-1 z-30">
        {isYukiziChoice && (
          <div className="bg-[#8b5cf6] text-white px-1.5 sm:px-2 py-0.5 rounded-full font-semibold text-[9px] sm:text-[10px] shadow-sm tracking-wide flex items-center justify-center">
            Yukizi Choice
          </div>
        )}
        {isBestSeller && (
          <div className="bg-[#4a4a4a] text-white px-1.5 sm:px-2 py-0.5 rounded-full font-semibold text-[9px] sm:text-[10px] shadow-sm tracking-wide flex items-center justify-center">
            Best Seller
          </div>
        )}
      </div>

      {/* Ad Tag */}
      {isAd && (
        <div className="absolute -top-4 right-2 text-[10px] sm:text-[11px] text-gray-500 font-medium z-20">
          Ad
        </div>
      )}

      {/* Container */}
      <div
        className={`bg-white rounded-[6px] sm:rounded-[6px] p-2.5 sm:p-3 hover:shadow-[0_8px_30px_rgb(133,76,188,0.15)] hover:ring-1 hover:ring-primary/50 transition-all duration-300 group flex flex-col relative border ${isYukiziChoice ? 'border-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.4)]' : 'border-gray-300 shadow-sm'} w-full h-full overflow-hidden`}
      >
           {/* Top action icons */}
        <div className="flex justify-end items-center w-full absolute top-1 sm:top-1.5 left-0 pl-2.5 sm:pl-3 pr-0 sm:pr-0.5 z-20">
          {showBellIcon ? (
            <button 
              onClick={handleToggleWaitlist}
              className={`transition-colors p-1 rounded-full ${isWaitlisted ? 'text-red-500 bg-red-50' : 'text-black hover:text-black/80 hover:bg-black/5'}`}
              title={isWaitlisted ? "Remove from waitlist" : "Notify me when available"}
            >
              <Bell className="w-5 h-5" fill={isWaitlisted ? "currentColor" : "none"} strokeWidth={2.5} />
            </button>
          ) : cartQuantity && cartQuantity > 0 ? (
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
                  <button onClick={handleMinusClick} className="text-white hover:bg-white/10 w-4.5 h-4.5 flex items-center justify-center rounded transition-colors disabled:opacity-50" disabled={isLoadingCart}>
                    <Minus className="w-2.5 h-2.5" strokeWidth={3} />
                  </button>
                  <span className="text-[10px] font-black tracking-wide min-w-[12px] text-center">
                    {isLoadingCart ? <Loader2 className="w-2.5 h-2.5 animate-spin mx-auto" /> : String(cartQuantity).padStart(2, '0')}
                  </span>
                  <button onClick={handlePlusClick} className="text-white hover:bg-white/10 w-4.5 h-4.5 flex items-center justify-center rounded transition-colors disabled:opacity-50" disabled={isLoadingCart || cartQuantity >= (prod.stock || 999)}>
                    <Plus className="w-2.5 h-2.5" strokeWidth={3} />
                  </button>
               </div>
            </div>
          ) : (
            <button
              className="text-black hover:text-black/80 transition-colors z-10 p-1 flex items-center justify-center"
              disabled={isLoadingCart}
              onClick={handlePlusClick}
            >
              {isLoadingCart ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} /> : <Plus className="w-5 h-5 sm:w-5 sm:h-5" strokeWidth={2.5} />}
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
          <WishlistIcon isFilled={isSaved} preserveAspectRatio="none" className="w-[24px] h-[24px]" />
        </div>

        {/* Image Container */}
        <Link href={`/products/${generateProductSlug(productName, prod.id || 'prod-' + index)}`} className="relative w-full aspect-[4/5] mb-[-8px] sm:mb-[-10px] mt-[-10px] sm:mt-[-12px] overflow-hidden bg-white flex justify-center items-center border-none">
          <img src={imageUrl} alt={productName} className="max-h-full max-w-full object-contain p-0.5 transform group-hover:scale-105 transition-transform duration-700 ease-out drop-shadow-md" />
        </Link>

        {/* Details Section */}
        <div className="flex-1 flex flex-col justify-end gap-0.5 sm:gap-0.5 z-10 w-full mt-0 pb-0.5">
          {/* Title Line */}
          <div className="flex items-center justify-between w-full gap-1 sm:gap-1.5">
            <h3 className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] xl:text-[13px] font-medium text-gray-500 truncate flex-1 text-left tracking-tight leading-tight">
              {productName}
            </h3>
            <Link
              href={`/products/${generateProductSlug(productName, prod.id || 'prod-' + index)}`}
              className="flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform z-20 -mr-2 sm:-mr-2.5 md:-mr-2.5 lg:-mr-3 xl:-mr-2.5"
              title="Quick view"
            >
              <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </Link>
          </div>

          {/* Price and Rating */}
          <div className="flex justify-between items-center w-full">
            <div className="flex items-baseline gap-1 sm:gap-1.5">
              <span className="text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[14px] font-semibold text-gray-500 tracking-tight leading-none">
                {displayPrice}
              </span>
              <span className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] xl:text-[11px] text-gray-400 line-through leading-none">{displayOriginalPrice}</span>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 -mr-1 sm:-mr-1.5 md:-mr-1.5 lg:-mr-2 xl:-mr-1.5">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4 xl:w-3.5 xl:h-3.5 text-[#8b5cf6] fill-[#8b5cf6]" />
              <span className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] xl:text-[13px] font-medium text-gray-500 leading-none">{rating}</span>
            </div>
          </div>

          {/* Bottom Badges */}
          <div className="flex justify-between items-center w-full mt-1">
            <div className="flex items-center gap-1">
              {renderBuyerOfferBadge(prod)}
            </div>
            <div className="-mr-[6px] sm:-mr-[8px]">
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
    <div className="relative w-full aspect-[4/3] rounded-[24px] bg-transparent flex items-center justify-center p-0 mt-4 lg:mt-0 border border-gray-200/80 shadow-md">
      {/* Share Button on Top Left Corner */}
      <div className="absolute top-4 left-4 z-30">
        <ShareButton
          productName={productName}
          productId={productId}
          productPrice={productPrice}
          className="p-2 bg-white rounded-full text-gray-600 focus:outline-none hover:scale-105 transition-all shadow-md hover:text-purple-600 border-none"
          iconClassName="w-4 h-4"
        />
      </div>

      {/* Vertical Thumbnails at bottom left side */}
      <div className="absolute left-3 lg:left-6 bottom-3 lg:bottom-6 flex flex-col gap-2 z-20">
        {images.slice(0, 3).map((img: string, idx: number) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveImageIndex(idx)}
            className={`rounded-xl overflow-hidden border bg-white/20 backdrop-blur-md shadow-md transition-all duration-200 focus:outline-none w-10 h-10 sm:w-12 sm:h-12 lg:w-[72px] lg:h-[72px] ${activeImageIndex === idx ? 'border-white/90 scale-105 shadow-lg' : 'border-white/30 hover:border-white/60'
              }`}
          >
            <Image
              src={img}
              alt=""
              width={72}
              height={72}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="absolute inset-0 w-full h-full rounded-[24px] overflow-hidden p-4 sm:p-6 bg-white">
        {activeImage && (
          <div className="relative w-full h-full">
            <Image
              src={activeImage}
              alt={productName}
              fill
              className="object-contain hover:scale-105 transition-transform duration-500"
              priority
            />
          </div>
        )}
      </div>

      {/* Ribbon Bookmark flag on the right edge */}
      <button
        type="button"
        onClick={onBookmarkToggle}
        className={`absolute -right-[15px] sm:-right-[15px] ${isDesktop ? 'top-[45%]' : 'top-1/2 -translate-y-1/2'} z-30 focus:outline-none transition-transform hover:scale-105`}
      >
        <svg
          width="30"
          height="24"
          viewBox="0 0 30 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible drop-shadow-md"
        >
          <path
            d="M0 0 H30 V24 H0 L8 12 Z"
            fill={isBookmarked ? "#7B2FBE" : "#ffffff"}
            stroke="#7B2FBE"
            strokeWidth="1.5"
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
  productImage,
  variant = 'mobile',
  productGstPercent,
  productShippingCharges,
  productIsTaxIncluded,
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
  productImage?: string;
  variant?: 'mobile' | 'desktop';
  productGstPercent?: number;
  productShippingCharges?: number;
  productIsTaxIncluded?: boolean;
}) {
  const cartItemMap = new Map<string, any>();
  if (cartData?.items) {
    cartData.items.forEach((item: any) => {
      if (item.productId) cartItemMap.set(item.productId, item);
    });
  }

  const isDesktop = variant === 'desktop';

  if (!comparisonListings || comparisonListings.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center text-xs font-semibold text-gray-400">
        No active offers available for this product.
      </div>
    );
  }

  return (
    <div className={isDesktop ? "flex flex-col gap-2 w-full max-h-[340px] overflow-y-auto overflow-x-hidden pr-1 purple-scrollbar" : "flex flex-col gap-3 w-full"}>
      {comparisonListings.map((listing: any, index: number) => {
        const inStock = (listing.stock ?? 0) > 0;
        const cartItem = cartItemMap.get(listing.id);
        const itemQty = cartItem?.quantity || 0;
        const sellerMoq = listing.moq || listing.minimumOrderQuantity || 1;
        const minQty = sellerMoq;

        // discountPercent not needed here — renderBuyerOfferBadge(listing) handles all discount types correctly

        const pricing = calculatePricing(
          Number(listing.mrp || listing.originalPrice || productMrp || 0),
          Number(listing.gstPercent ?? productGstPercent ?? 0),
          {
            type: listing.discountType || (listing.discountMeta?.discountPercent ? 'ptr_discount' : 'none'),
            discountPercent: listing.discountMeta?.discountPercent,
            specialPrice: listing.discountMeta?.specialPrice,
            buy: listing.discountMeta?.buy,
            get: listing.discountMeta?.get,
            bonusProductName: listing.discountMeta?.bonusProductName,
            shippingCharges: listing.finalShippingPrice ?? listing.shippingCharges ?? productShippingCharges ?? 0,
            shippingGstPercent: 0,
            isTaxIncluded: true,
          }
        );

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
                price: pricing.finalCustomerPayable,
                mrp: listing.mrp || listing.originalPrice || productMrp,
                image: productImage,
                imageUrl: productImage,
                images: productImage ? [productImage] : [],
              });
            }
          }
        };

        const getListingDiscountText = (listing: any) => {
          const meta = listing.discountMeta || {};
          if (!listing?.discountType) {
            if (meta.discountPercent) {
              return `${meta.discountPercent}% off`;
            }
            return null;
          }
          if (listing.discountType === "PTR_DISCOUNT") {
            return `${meta.discountPercent || 0}% off`;
          }
          if (listing.discountType === "SAME_PRODUCT_BONUS") {
            return `Buy ${meta.buy || 0} Get ${meta.get || 0} Free`;
          }
          if (listing.discountType === "PTR_PLUS_SAME_PRODUCT_BONUS") {
            return `${meta.discountPercent || 0}% off`;
          }
          if (listing.discountType === "DIFFERENT_PRODUCT_BONUS") {
            return `Buy ${meta.buy || 0} Get ${meta.get || 0} Free`;
          }
          if (listing.discountType === "PTR_PLUS_DIFFERENT_PRODUCT_BONUS") {
            return `${meta.discountPercent || 0}% off`;
          }
          if (listing.discountType === "SPECIAL_PRICE") {
            return `Special Price`;
          }
          return listing.discountType.replace(/_/g, ' ');
        };

        const getListingSubtext = (listing: any) => {
          const meta = listing.discountMeta || {};
          if (listing.discountType === "PTR_PLUS_SAME_PRODUCT_BONUS" || listing.discountType === "SAME_PRODUCT_BONUS") {
            return `${meta.discountPercent || 0}% off on purchase of ${meta.buy || 3}`;
          }
          if (listing.moq > 1) {
            return `Min. purchase of ${listing.moq}`;
          }
          return '';
        };

        const discountText = getListingDiscountText(listing);
        const subText = getListingSubtext(listing);

        return (
          <div
            key={listing.id}
            className="transition-colors w-full bg-[#eaeaea] border border-gray-200/60 hover:border-purple-200 shadow-sm flex items-center justify-between py-1 px-2.5 sm:py-1.5 sm:px-4 xl:py-2 xl:px-6 rounded-[6px]"
          >
            {/* 1. Discount Badge */}
            <div className="flex-shrink-0 min-w-0">
              {discountText ? (
                <div className="bg-[#854cbc] text-white px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 xl:px-3 xl:py-1 2xl:px-3.5 2xl:py-1 rounded font-bold tracking-wide whitespace-nowrap flex items-center justify-center gap-0.5 sm:gap-1 shadow-sm">
                  {discountText.split(' ').map((part: string, pIdx: number) => (
                    <span
                      key={pIdx}
                      className={
                        pIdx === 0
                          ? "text-[10px] sm:text-[13.5px] xl:text-[14.5px] 2xl:text-[16.5px] font-bold"
                          : "text-[7.5px] sm:text-[10.5px] xl:text-[11.5px] 2xl:text-[12.5px] font-medium opacity-90"
                      }
                    >
                      {part}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="w-[10px]" />
              )}
            </div>

            {/* 2. Price & Subtext */}
            <div className="flex flex-col items-start justify-center min-w-0 text-left">
              <span className="text-[11px] sm:text-[15px] md:text-[17px] xl:text-[19px] 2xl:text-[21px] font-medium text-gray-800 leading-none tracking-tight">
                ₹{Math.round(pricing.finalCustomerPayable).toLocaleString('en-IN')}
              </span>
              {subText && (
                <span className="text-[8px] sm:text-[11px] xl:text-[13px] 2xl:text-[14px] text-gray-500 font-medium mt-1 leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                  {subText}
                </span>
              )}
            </div>

            {/* 3. Star Rating */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 xl:w-5 xl:h-5 2xl:w-5.5 2xl:h-5.5 fill-[#854cbc] text-[#854cbc] flex-shrink-0" />
              <span className="text-gray-800 font-bold text-[11px] sm:text-[14px] md:text-[16px] xl:text-[18px] 2xl:text-[20px] leading-none">
                {listing.seller?.rating || '4.5'}
              </span>
            </div>

            {/* 4. Delivery badge */}
            <div className="flex items-center flex-shrink-0">
              <DeliveryTruckBadge
                text={listing.deliveryText || '3 days'}
                className="w-[48px] sm:w-[62px] md:w-[70px] xl:w-[78px] 2xl:w-[88px] h-auto text-gray-500 flex-shrink-0"
              />
            </div>

            {/* 5. Actions (Plus / Incremental / Reset) */}
            <div className="flex items-center justify-end flex-shrink-0">
              {inStock ? (
                itemQty === 0 ? (
                  <button
                    onClick={() => handleQtyChange(minQty)}
                    className="text-black hover:text-black/80 focus:outline-none transition-transform active:scale-90 p-0.5"
                  >
                    <Plus className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 xl:w-6.5 xl:h-6.5 2xl:w-7 2xl:h-7" strokeWidth={3} />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 sm:gap-3 xl:gap-4">
                    {/* Reset Button */}
                    <button
                      onClick={() => { handleQtyChange(0); toast('Quantity reset', 'info'); }}
                      title="Reset quantity"
                      className="text-[#48286b] hover:text-purple-900 transition-transform active:scale-90 focus:outline-none p-0.5"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 xl:w-5.5 xl:h-5.5 2xl:w-6 2xl:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85 1.05 6.5 2.5L21 8" />
                        <path d="M21 3v5h-5" />
                      </svg>
                    </button>

                    {/* Quantity Control Pill */}
                    <div className="flex items-center bg-[#48286b] rounded-[8px] overflow-hidden h-6 w-[60px] sm:h-7.5 sm:w-24 md:h-8 md:w-26 xl:h-8.5 xl:w-30 2xl:h-9 2xl:w-34 text-white shadow-sm select-none justify-between px-1 sm:px-2 xl:px-3">
                      <button
                        className="w-4 sm:w-8 h-full flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all text-white font-bold text-[10px] sm:text-lg xl:text-xl 2xl:text-2xl pb-0.5"
                        onClick={() => handleQtyChange(itemQty - 1)}
                      >
                        -
                      </button>
                      <span className="font-bold text-[9px] sm:text-sm xl:text-base 2xl:text-lg tracking-wide">{String(itemQty).padStart(2, '0')}</span>
                      <button
                        className="w-4 sm:w-8 h-full flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all text-white font-bold text-[10px] sm:text-lg xl:text-xl 2xl:text-2xl pb-0.5"
                        onClick={() => handleQtyChange(itemQty + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-3">
                  <span className="text-[10px] sm:text-[13px] xl:text-[14px] 2xl:text-[16px] font-bold text-red-500 whitespace-nowrap">Out of Stock</span>
                  <button
                    onClick={() => setShowStockAlert(true)}
                    className="w-6 h-6 sm:w-8.5 sm:h-8.5 xl:w-9 xl:h-9 2xl:w-10 2xl:h-10 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center border border-red-100 active:scale-95 transition-all focus:outline-none flex-shrink-0"
                  >
                    <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 xl:w-4.5 xl:h-4.5 2xl:w-5 2xl:h-5" />
                  </button>
                </div>
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
  reviewImages,
  setReviewImages,
  onSubmit,
}: {
  rating: number;
  setRating: (r: number) => void;
  reviewTitle: string;
  setReviewTitle: (t: string) => void;
  reviewComment: string;
  setReviewComment: (c: string) => void;
  reviewImages: string[];
  setReviewImages: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const { toast } = useToast();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    try {
      const fileList = Array.from(files);
      for (const file of fileList) {
        if (!file.type.startsWith('image/')) {
          toast('Please select an image file', 'error');
          continue;
        }
        const res = await uploadReviewImage(file);
        const url = res.url;
        if (url) {
          setReviewImages((prev) => [...prev, url]);
          toast('Photo uploaded successfully!', 'success');
        }
      }
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setReviewImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

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
        
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
          }}
          className={`border border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            isDragging
              ? 'border-[#854cbc] bg-purple-50/80'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100/70'
          }`}
        >
          {isUploadingImage ? (
            <Loader2 className="w-7 h-7 text-[#854cbc] animate-spin" />
          ) : (
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          <span className="text-[10px] text-gray-400 font-bold text-center">
            {isUploadingImage ? (
              <span className="text-[#854cbc]">Uploading photo...</span>
            ) : (
              <>Drag & Drop your picture or <span className="text-[#854cbc] underline">Browse</span></>
            )}
          </span>
        </div>

        {/* Uploaded Image Previews */}
        {reviewImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {reviewImages.map((imgUrl, idx) => (
              <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 group">
                <Image src={imgUrl} alt={`Review photo ${idx + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(idx);
                  }}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
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
  const { data: config } = usePlatformConfig();
  const minOrderAmount = config?.min_order_amount ?? 0;

  const { data: wishlistData } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const product = (productData as any)?.data || productData;

  const { data: userProfile } = useBuyerProfile();
  const { data: reviewsData } = useProductReviews(product?.id || '');
  const { mutate: submitReview } = useCreateReview();

  // Review state
  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showStockAlert, setShowStockAlert] = useState(false);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    try {
      const fileList = Array.from(files);
      for (const file of fileList) {
        if (!file.type.startsWith('image/')) {
          toast('Please select an image file', 'error');
          continue;
        }
        const res = await uploadReviewImage(file);
        const url = res.url;
        if (url) {
          setReviewImages((prev) => [...prev, url]);
          toast('Photo uploaded successfully!', 'success');
        }
      }
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setReviewImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

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

  const unwrapImage = (img: any): string => (typeof img === 'string' ? img : img?.url || '');

  const images =
    product.images && product.images.length > 0
      ? product.images.map(unwrapImage).filter(Boolean)
      : [
        `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent((product.name || 'PR').trim().split(/\s+/).length === 1 ? (product.name || 'PR').trim().substring(0, 2).toUpperCase() : ((product.name || 'PR').trim().split(/\s+/)[0][0] + (product.name || 'PR').trim().split(/\s+/)[(product.name || 'PR').trim().split(/\s+/).length - 1][0]).toUpperCase())}`,
      ];

  const selectedVariant = productVariants.find((v: any) => v.name === selectedVariantName);

  const listings = product.listings || product.sellerOffers || product.offers || [];
  const validListings = listings.filter((l: any) => l.price != null || l.mrp != null);
  const relatedProducts = relatedProductsData?.data || [];

  // Filter listings based on the selected variant
  const filteredListings =
    productVariants.length > 0 && selectedVariantName
      ? validListings.filter(
        (l: any) =>
          l.variantName === selectedVariantName ||
          l.name === selectedVariantName ||
          l.name?.includes(selectedVariantName),
      )
      : validListings;

  const comparisonListings = filteredListings || [];

  let displayImages = [...images];
  const rawVariantImages = selectedVariant?.images?.length > 0
    ? selectedVariant.images
    : (selectedVariant?.image 
      ? [selectedVariant.image] 
      : (comparisonListings[0]?.images?.length > 0 
        ? comparisonListings[0].images 
        : (comparisonListings[0]?.image ? [comparisonListings[0].image] : [])));

  const variantImages = (rawVariantImages || []).map(unwrapImage).filter(Boolean);
  if (variantImages.length > 0) {
    displayImages = [...variantImages, ...images.filter((img: string) => !variantImages.includes(img))];
  }

  while (displayImages.length < 3 && displayImages.length > 0) {
    displayImages.push(displayImages[0]);
  }

  const reviewsList = reviewsData?.data && reviewsData.data.length > 0
    ? reviewsData.data
    : getMockReviewsForProduct(product?.name || 'Product', product?.category?.name || 'Item', images[0]);

  const averageRating = reviewsData?.averageRating || (reviewsData?.data && reviewsData.data.length > 0
    ? (reviewsData.data.reduce((acc: number, curr: any) => acc + curr.rating, 0) / reviewsData.data.length)
    : 4.5);

  const totalReviews = reviewsData?.total || (reviewsData?.data && reviewsData.data.length > 0 ? reviewsData.data.length : reviewsList.length);

  let bestPricing: any = null;
  if (comparisonListings.length > 0) {
    let minPayable = Infinity;
    for (const listing of comparisonListings) {
      const listingMrp = Number(listing.mrp || listing.originalPrice || product.mrp || product.originalPrice || 0);
      if (listingMrp > 0) {
        const pricing = calculatePricing(
          listingMrp,
          Number(listing.gstPercent ?? product.gstPercent ?? 0),
          {
            type: listing.discountType || (listing.discountMeta?.discountPercent ? 'ptr_discount' : 'none'),
            discountPercent: listing.discountMeta?.discountPercent,
            specialPrice: listing.discountMeta?.specialPrice,
            buy: listing.discountMeta?.buy,
            get: listing.discountMeta?.get,
            bonusProductName: listing.discountMeta?.bonusProductName,
            shippingCharges: listing.finalShippingPrice ?? listing.shippingCharges ?? product.shippingCharges ?? 0,
            shippingGstPercent: 0,
            isTaxIncluded: true,
          }
        );
        if (pricing.finalCustomerPayable < minPayable) {
          minPayable = pricing.finalCustomerPayable;
          bestPricing = pricing;
        }
      } else if (listing.price != null && Number(listing.price) > 0 && Number(listing.price) < minPayable) {
        minPayable = Number(listing.price);
        bestPricing = { finalCustomerPayable: Number(listing.price) };
      }
    }
  }

  // If selected variant has no listings, compute overall best price from validListings
  let overallBestPrice = 0;
  if (validListings.length > 0) {
    const candidatePrices = validListings
      .map((l: any) => Number(l.price ?? l.basePrice ?? l.mrp ?? 0))
      .filter((p: number) => !isNaN(p) && p > 0);
    if (candidatePrices.length > 0) {
      overallBestPrice = Math.min(...candidatePrices);
    }
  }

  const rawFallbackPrice = product.price ?? product.finalCustomerPayable ?? product.mrp ?? product.originalPrice ?? overallBestPrice;
  const fallbackPriceVal = Number(rawFallbackPrice);
  const displayPrice = (bestPricing && bestPricing.finalCustomerPayable > 0) 
    ? Number(bestPricing.finalCustomerPayable) 
    : (overallBestPrice > 0 
      ? overallBestPrice 
      : (!isNaN(fallbackPriceVal) && fallbackPriceVal > 0 ? fallbackPriceVal : 0));

  const rawMrp = (comparisonListings.length > 0 ? comparisonListings : validListings).find((l: any) => l.mrp || l.originalPrice)?.mrp ||
    (comparisonListings.length > 0 ? comparisonListings : validListings).find((l: any) => l.mrp || l.originalPrice)?.originalPrice ||
    product.mrp ||
    product.originalPrice;
  let displayMrp = rawMrp ? Number(rawMrp) : 0;
  const discountPercent = product.discountMeta?.discountPercent;
  if ((!displayMrp || displayMrp <= displayPrice) && discountPercent && discountPercent > 0) {
    displayMrp = displayPrice / (1 - discountPercent / 100);
  }

  // Calculate active discount percent dynamically for header badge
  const activeListing = comparisonListings[0];
  const activeDiscountPercent = 
    activeListing?.discountMeta?.discountPercent ??
    product.discountMeta?.discountPercent ??
    (displayMrp > displayPrice && displayMrp > 0 ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : null);

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
        originalPrice: product.mrp || product.originalPrice || displayPrice,
        image: product.image || images[0],
      }, {
        onSuccess: () => toast('Added to wishlist!', 'success'),
      });
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      toast('Please log in to submit a review', 'error');
      // setIsLoginOpen(true); // Uncomment if login modal exists
      return;
    }
    if (rating === 0) {
      toast('Please select a rating star', 'error');
      return;
    }

    const comment = reviewTitle ? `${reviewTitle}: ${reviewComment}` : reviewComment;

    submitReview({
      catalogProductId: product.id,
      rating,
      comment,
      images: reviewImages,
    }, {
      onSuccess: () => {
        toast('Review submitted successfully!', 'success');
        setRating(0);
        setReviewTitle('');
        setReviewComment('');
        setReviewImages([]);
      },
      onError: (err: any) => {
        const errorMsg = err?.response?.data?.message || err?.message || 'Failed to submit review';
        toast(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg, 'error');
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

      <div className="mx-auto w-full max-w-[1400px] lg:max-w-[1600px] xl:max-w-[1800px] 2xl:max-w-[2000px] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-6 xl:px-8">

        {/* MOBILE VIEW LAYOUT */}
        <div className="block lg:hidden flex flex-col gap-5 w-full">
          {/* Dynamic Tags Header */}
          <div className="flex items-center justify-between w-full px-1 mb-1">
            <div className="flex items-center gap-2">
              {isYukiziChoice && (
                <div className="rounded-full bg-[#7B2FBE] px-4 py-1 text-[12px] font-bold tracking-wide text-white shadow-sm">
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
              <span className="text-[11px] text-gray-400 font-semibold select-none">Ad</span>
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
          <h1 className="text-xl font-medium text-gray-800 leading-tight">
            {product.name}
          </h1>

          {/* Variant Selector */}
          {productVariants.length > 0 && (
            <div className="flex flex-col gap-2 mt-1 mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Variant</span>
              <div className="flex flex-wrap gap-2">
                {productVariants.map((v: any) => (
                  <button
                    key={v.id || v.name}
                    type="button"
                    onClick={() => {
                      setSelectedVariantName(v.name);
                      setActiveImage(0);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${selectedVariantName === v.name
                        ? 'bg-[#854cbc] text-white border-[#854cbc] shadow-md scale-105'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    {v.image && (
                      <img src={v.image} alt={v.name} className="w-5 h-5 rounded-full object-cover" />
                    )}
                    <span>{v.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 8-Row Comparison list */}
          <ComparisonOffersList
            comparisonListings={comparisonListings}
            cartData={cartData}
            minOrderAmount={minOrderAmount}
            addToCart={addToCart}
            updateCartItem={updateCartItem}
            removeCartItem={removeCartItem}
            productName={product.name}
            productMrp={displayMrp || displayPrice}
            toast={toast}
            setShowStockAlert={setShowStockAlert}
            productImage={displayImages[0]}
            productGstPercent={product.gstPercent}
            productShippingCharges={product.shippingCharges}
            productIsTaxIncluded={product.isTaxIncluded}
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
            <h2 className="mb-4 text-[16px] sm:text-[18px] font-bold text-gray-500">Related Products</h2>
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
                className="bg-[#854cbc] hover:bg-[#723eab] text-white rounded-[6px] px-6 py-2 text-[12px] sm:text-[13px] font-medium transition-colors whitespace-nowrap"
              >
                See all reviews
              </button>
            </div>

            {/* Review Cards Carousel */}
            <div className="hide-scrollbar flex flex-col gap-4 overflow-x-auto pb-2 sm:flex-row">
              {reviewsList.map((rev: any) => {
                const reviewImagesList = (rev.images && rev.images.length > 0)
                  ? rev.images
                  : (rev.image ? [rev.image] : (rev.imageUrl ? [rev.imageUrl] : []));
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
                    {reviewImagesList.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap flex-shrink-0 self-center">
                        {reviewImagesList.map((imgUrl: string, idx: number) => (
                          <div key={idx} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-gray-100 bg-white">
                            <img src={imgUrl} alt={`Review photo ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
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
              reviewImages={reviewImages}
              setReviewImages={setReviewImages}
              onSubmit={handleReviewSubmit}
            />
          </div>
        </div>

        {/* DESKTOP VIEW LAYOUT */}
        <div className="hidden lg:flex flex-col gap-6 w-full">
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_1.25fr] gap-10 items-center mt-6">
            {/* Left Header */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {isYukiziChoice && (
                  <div className="rounded-full bg-[#7B2FBE] px-4 py-1 text-[12px] font-bold tracking-wide text-white shadow-sm">
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
                <span className="text-[11px] text-gray-400 font-semibold select-none">Ad</span>
              )}
            </div>

            {/* Right Header - Breadcrumbs */}
            <div className="hide-scrollbar flex items-center gap-1 text-[13px] sm:text-[14px] xl:text-[15px] 2xl:text-[16px] font-normal text-gray-600">
              <Link href="/" className="transition-colors hover:text-[#854cbc] text-gray-600">
                Home
              </Link>
              <span className="text-gray-400 mx-1">&gt;</span>
              {product.category && (
                <>
                  <Link
                    href={`/category/${product.category.slug || product.category.id}`}
                    className="transition-colors hover:text-[#854cbc] text-gray-600"
                  >
                    {product.category.name || 'Category'}
                  </Link>
                  <span className="text-gray-400 mx-1">&gt;</span>
                </>
              )}
              {product.subCategory && (
                <>
                  <span className="cursor-pointer transition-colors hover:text-[#854cbc] text-gray-600">
                    {product.subCategory.name}
                  </span>
                  <span className="text-gray-400 mx-1">&gt;</span>
                </>
              )}
              <span className="max-w-[200px] truncate text-gray-700">
                {product.name}
              </span>
            </div>
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-[1fr_1.25fr] gap-10 items-start">
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

              {/* Related Products - moved inside left column to avoid XL height gaps */}
              <div className="flex flex-col gap-4 border-t border-gray-100 pt-8 mt-6">
                <h2 className="text-[20px] sm:text-[22px] xl:text-[24px] 2xl:text-[26px] font-bold text-gray-500">Related Products</h2>
                <div className="grid grid-cols-3 gap-5 pb-4">
                  {relatedProducts.map((prod: any, idx: number) => (
                    <RelatedProductCard key={prod.id} prod={prod} index={idx} />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col">
              {/* Title Block */}
              <div className="flex items-start justify-between w-full mb-4">
                <h1 className="text-[22px] sm:text-[26px] xl:text-[30px] 2xl:text-[34px] font-medium text-gray-500 tracking-tight leading-tight max-w-[95%]">
                  {product.name}
                </h1>
              </div>

              {/* Price & Details Row */}
              <div className="flex items-end justify-between w-full border-b border-gray-100 pb-4 mb-4">
                {/* Left: Price & Discount */}
                <div className="flex flex-col items-start justify-end">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-[24px] sm:text-[28px] xl:text-[30px] 2xl:text-[32px] font-medium text-[#333333] leading-none">
                      {displayPrice > 0 
                        ? `₹${Number(displayPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                        : 'N/A'}
                    </span>
                    {displayMrp && displayMrp > displayPrice ? (
                      <span className="text-[12px] sm:text-[14px] xl:text-[15px] 2xl:text-[16px] font-bold text-gray-400 line-through leading-none">
                        ₹{displayMrp ? Number(displayMrp).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </span>
                    ) : null}
                  </div>
                  {activeDiscountPercent && activeDiscountPercent > 0 ? (
                    <span className="text-[14px] sm:text-[16px] xl:text-[18px] 2xl:text-[20px] font-bold text-gray-800 mt-2 leading-none">
                      {activeDiscountPercent}% off
                    </span>
                  ) : null}
                </div>

                {/* Right: Truck & Rating */}
                <div className="flex items-center gap-4 sm:gap-5 xl:gap-6 pb-0.5">
                  <DeliveryTruckBadge
                    text={product.deliveryText || "3 days"}
                    className="w-[85px] sm:w-[95px] xl:w-[110px] 2xl:w-[125px] h-auto text-gray-500 flex-shrink-0"
                  />
                  <div className="flex items-center gap-1 xl:gap-1.5">
                    <Star className="w-5.5 h-5.5 xl:w-6.5 xl:h-6.5 2xl:w-7 2xl:h-7 fill-[#7B2FBE] text-[#7B2FBE] flex-shrink-0" />
                    <span className="text-[18px] sm:text-[20px] xl:text-[22px] 2xl:text-[24px] font-bold text-gray-800 leading-none">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Variant Selector */}
              {productVariants.length > 0 && (
                <div className="flex flex-col gap-2 mb-6">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Variant</span>
                  <div className="flex flex-wrap gap-2.5">
                    {productVariants.map((v: any) => (
                      <button
                        key={v.id || v.name}
                        type="button"
                        onClick={() => {
                          setSelectedVariantName(v.name);
                          setActiveImage(0);
                        }}
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${selectedVariantName === v.name
                            ? 'bg-[#854cbc] text-white border-[#854cbc] shadow-md scale-105'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                      >
                        {v.image && (
                          <img src={v.image} alt={v.name} className="w-6 h-6 rounded-full object-cover" />
                        )}
                        <span>{v.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 8-row comparison list */}
              <ComparisonOffersList
                variant="desktop"
                comparisonListings={comparisonListings}
                cartData={cartData}
                minOrderAmount={minOrderAmount}
                addToCart={addToCart}
                updateCartItem={updateCartItem}
                removeCartItem={removeCartItem}
                productName={product.name}
                productMrp={displayMrp || displayPrice}
                toast={toast}
                setShowStockAlert={setShowStockAlert}
                productImage={displayImages[0]}
                productGstPercent={product.gstPercent}
                productShippingCharges={product.shippingCharges}
                productIsTaxIncluded={product.isTaxIncluded}
              />

              {/* Reviews - moved inside right column to avoid XL height gaps */}
              <div className="flex flex-col border-t border-gray-100 pt-8 mt-6">
                <h2 className="text-[20px] sm:text-[22px] xl:text-[24px] 2xl:text-[26px] font-bold text-gray-500 mb-4">Reviews</h2>

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
                    className="bg-[#854cbc] hover:bg-[#723eab] text-white rounded-[6px] px-6 py-2 text-[12px] sm:text-[13px] font-medium transition-colors whitespace-nowrap"
                  >
                    See all reviews
                  </button>
                </div>

                {/* Review Cards Carousel */}
                <div className="hide-scrollbar flex flex-col gap-4 overflow-x-auto pb-2 sm:flex-row">
                  {reviewsList.map((rev: any) => {
                    const reviewImagesList = (rev.images && rev.images.length > 0)
                      ? rev.images
                      : (rev.image ? [rev.image] : (rev.imageUrl ? [rev.imageUrl] : []));
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
                        {reviewImagesList.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap flex-shrink-0 self-center">
                            {reviewImagesList.map((imgUrl: string, idx: number) => (
                              <div key={idx} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-gray-100 bg-white">
                                <img src={imgUrl} alt={`Review photo ${idx + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
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
                  reviewImages={reviewImages}
                  setReviewImages={setReviewImages}
                  onSubmit={handleReviewSubmit}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
      <Navbar />
    </main>
  );
}
