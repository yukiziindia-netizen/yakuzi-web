'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Share2,
  Loader2,
  Bookmark,
  Truck,
  CheckCircle,
  Plus,
  Star,
  Bell,
  Package,
} from 'lucide-react';
import Image from 'next/image';
import { DeliveryTruckBadge } from '@/components/shared/DeliveryTruckBadge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast';
import { ShareButton } from '@/components/shared/ShareButton';
import { NotifyStockAlertModal } from '@/components/shared/NotifyStockAlertModal';
import { CustomOrderModal } from '@/components/shared/CustomOrderModal';
import WishlistIcon from '@/components/shared/WishlistIcon';
import { useAddToCart, useCart } from '@/hooks/useCart';
import { useProductById } from '@/hooks/useProducts';
import {
  calculatePricing,
  getSellingPrice,
  getEffectiveDiscountPercent,
  generateProductSlug,
} from '@yukizi/utils';
import type { Product } from '@yukizi/utils';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { renderBuyerOfferBadge } from '@/components/landing/ProductCarousel';

interface QuickReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export default function QuickReviewModal({ product, isOpen, onClose }: QuickReviewModalProps) {
  const router = useRouter();
  const { data: fullProductRaw, isLoading: isLoadingDetails } = useProductById(product?.id || '', {
    enabled: !!product?.id && isOpen,
  });

  const fullProduct = fullProductRaw as any;
  const displayProduct = fullProduct || (product as any);
  const listings = displayProduct?.listings || [];
  const { toast } = useToast();
  const addToCart = useAddToCart();
  const { data: cartData } = useCart();
  const { data: config } = usePlatformConfig();
  const minOrderAmount = config?.min_order_amount ?? 0;

  const { data: wishlistData } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const [showStockAlert, setShowStockAlert] = useState(false);
  const [showCustomOrder, setShowCustomOrder] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!isOpen || !displayProduct) return null;

  const productImages =
    displayProduct.images && displayProduct.images.length > 0
      ? displayProduct.images.map((img: any) => img.url || img)
      : [
          displayProduct.image ||
            `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent((displayProduct.name || 'PR').trim().split(/\s+/).length === 1 ? (displayProduct.name || 'PR').trim().substring(0, 2).toUpperCase() : ((displayProduct.name || 'PR').trim().split(/\s+/)[0][0] + (displayProduct.name || 'PR').trim().split(/\s+/)[(displayProduct.name || 'PR').trim().split(/\s+/).length - 1][0]).toUpperCase())}`,
        ];

  const activeImage = productImages[activeImageIndex % productImages.length];

  const comparisonListings = listings.filter((l: any) => l.price != null);
  const displayPrice =
    comparisonListings.length > 0
      ? Math.min(...comparisonListings.map((l: any) => l.price))
      : displayProduct.price;

  const wishlistSet = new Set<string>();
  if (wishlistData?.items) {
    wishlistData.items.forEach((item: any) => {
      if (item.productId) wishlistSet.add(item.productId);
    });
  }
  const isBookmarked = wishlistSet.has(displayProduct.id);

  const handleBookmarkToggle = () => {
    if (isBookmarked) {
      removeFromWishlist.mutate(displayProduct.id, {
        onSuccess: () => toast('Removed from wishlist', 'success'),
      });
    } else {
      addToWishlist.mutate(
        {
          productId: displayProduct.id,
          productName: displayProduct.name,
          price: displayPrice || 0,
          originalPrice: displayProduct.mrp || displayProduct.originalPrice || displayPrice,
          image: displayProduct.image || productImages[0],
        },
        {
          onSuccess: () => toast('Added to wishlist!', 'success'),
        },
      );
    }
  };

  const handleAddToCart = (listing: any, quantity: number) => {
    const itemMrp =
      listing.mrp ||
      listing.originalPrice ||
      displayProduct.mrp ||
      displayProduct.originalPrice ||
      listing.price;
    addToCart.mutate({
      productId: listing.id,
      quantity,
      productName: displayProduct.name,
      price: listing.price,
      mrp: itemMrp,
      image: productImages[0],
      imageUrl: productImages[0],
      images: productImages,
    });
  };

  const handleUpdateQty = (listing: any, quantity: number) => {
    addToCart.mutate({
      productId: listing.id,
      quantity,
      replace: true,
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
            onClick={onClose}
          >
            {/* Ambient Backdrop */}
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm backdrop-saturate-[1.8]" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="no-scrollbar relative flex max-h-[90vh] w-full max-w-[95%] xs:max-w-[500px] sm:max-w-[560px] md:max-w-[590px] flex-col gap-4 sm:gap-5 overflow-y-auto rounded-2xl border border-white/40 bg-white/95 p-4 sm:p-6 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.1)] backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header section with Title & Share */}
              <div className="relative flex w-full flex-col pt-3">
                <div className="flex w-full items-start justify-between">
                  <h2 className="max-w-[85%] text-[20px] font-black leading-tight tracking-tight text-gray-500">
                    {displayProduct.name}
                  </h2>
                  <button
                    onClick={onClose}
                    className="self-start rounded-full p-1 transition-colors hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Product Banner Halftone Card */}
              <div
                className="relative flex aspect-[4/3.2] w-full items-center justify-center rounded-xl border border-purple-400/20 bg-gradient-to-br from-[#854dff] via-[#b336e8] to-[#ff2b9a] p-6 shadow-md"
                style={{
                  backgroundImage: `
                    radial-gradient(rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px),
                    linear-gradient(135deg, #854dff 0%, #b336e8 50%, #ff2b9a 100%)
                  `,
                  backgroundSize: '12px 12px, 100% 100%',
                }}
              >
                {/* Abstract slashes for action look */}
                <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-1/3 origin-bottom-right skew-x-12 transform bg-gradient-to-l from-pink-500/20 to-transparent" />
                <div className="pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-pink-500/10 blur-2xl" />

                {/* Share Button on Top Left Corner */}
                <div className="absolute -left-3.5 -top-3.5 z-30">
                  <ShareButton
                    productName={displayProduct.name}
                    productId={displayProduct.id}
                    productPrice={displayProduct.mrp}
                    className="rounded-full border-0 bg-white p-3 text-gray-500 shadow-none transition-transform hover:scale-105 focus:outline-none"
                    iconClassName="w-[18px] h-[18px]"
                  />
                </div>

                {/* Interactive Thumbnail Gallery overlay on the left (aligned bottom-left) */}
                <div className="absolute left-4 bottom-4 z-20 flex flex-col gap-2">
                  {productImages.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`h-14 w-14 overflow-hidden rounded-lg border-2 bg-white/15 shadow-sm backdrop-blur-sm transition-all duration-200 ${
                        activeImageIndex === idx
                          ? 'scale-105 border-orange-500 shadow-md'
                          : 'border-white/30 hover:border-white/60'
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>

                {/* Main Product Image (fills the card, centered) */}
                <div className="absolute inset-0 z-10 flex items-center justify-center p-2">
                  <img
                    src={activeImage}
                    alt={displayProduct.name}
                    className="max-h-full max-w-full object-contain transition-transform duration-500 hover:scale-105"
                  />
                </div>

                {/* Ribbon Bookmark flag on the right edge */}
                <button
                  type="button"
                  onClick={handleBookmarkToggle}
                  className="absolute -right-[10px] top-[45%] z-20 transition-transform hover:scale-105 focus:outline-none"
                >
                  <svg
                    width="44"
                    height="40"
                    viewBox="0 0 44 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="overflow-visible drop-shadow-sm"
                  >
                    <path
                      d="M44 0 H0 L11 20 L0 40 H44 V0 Z"
                      fill={isBookmarked ? '#854cbc' : '#ffffff'}
                      stroke={isBookmarked ? '#854cbc' : '#9ca3af'}
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Marketplace Offers Comparison List */}
              <div className="flex w-full flex-col gap-3">
                {comparisonListings.length > 0 ? (
                  comparisonListings.map((listing: any) => {
                    const inStock = true;
                    const cartItem = cartData?.items?.find(
                      (item: any) => item.productId === listing.id,
                    );
                    const itemQty = cartItem?.quantity || 0;
                    const sellerMoq = listing.moq || listing.minimumOrderQuantity || 1;
                    const minQty = sellerMoq;

                    const itemMrp =
                      listing.mrp ||
                      listing.originalPrice ||
                      displayProduct.mrp ||
                      displayProduct.originalPrice;
                    const discountMeta = listing.discountMeta || {};
                    const discountPercent =
                      itemMrp && listing.price && itemMrp > listing.price
                        ? Math.round(((itemMrp - listing.price) / itemMrp) * 100)
                        : discountMeta.discountPercent || 20;

                    const handleQtyChange = (newQty: number) => {
                      if (itemQty === 0) {
                        if (newQty > 0) {
                          handleAddToCart(listing, newQty);
                        }
                      } else {
                        handleUpdateQty(listing, newQty);
                      }
                    };

                    return (
                      <div
                        key={listing.id}
                        className="flex w-full flex-row items-center justify-between gap-2.5 rounded-xl bg-gray-200 p-2.5 transition-colors hover:bg-gray-300/60 sm:p-3"
                      >
                        {/* 1. Offer Badge */}
                        <div className="flex-shrink-0 select-none">
                          <div className="rounded bg-[#864ac5] px-2 py-1 text-center text-[10px] font-black uppercase leading-none tracking-wider text-white sm:px-2.5 sm:py-1.5 sm:text-[11px]">
                            {discountPercent > 0 
                              ? `${discountPercent}% off` 
                              : (listing.discountType === "SAME_PRODUCT_BONUS" 
                                  ? `Buy ${discountMeta.buy || 0} Get ${discountMeta.get || 0} Free`
                                  : (listing.discountType === "SPECIAL_PRICE"
                                      ? `Special`
                                      : `${discountPercent || 0}% off`
                                    )
                                )
                            }
                          </div>
                        </div>

                        {/* 2. Price */}
                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-xs font-black leading-none text-gray-800 sm:text-[14px]">
                            ₹{Math.round(listing.price || 0).toLocaleString('en-IN')}
                          </span>
                          {listing.moq > 1 && (
                            <span className="mt-1 truncate text-[8px] font-bold leading-none text-gray-400 sm:mt-1.5 sm:text-[9px]">
                              {listing.moq * 10}% off on purchase of {listing.moq}
                            </span>
                          )}
                        </div>

                        {/* 3. Star Rating */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star className="h-3 w-3 fill-[#864ac5] text-[#864ac5] sm:h-3.5 sm:w-3.5" />
                          <span className="text-[10px] font-black leading-none text-gray-800 sm:text-[12px]">
                            {listing.seller?.rating || '4.5'}
                          </span>
                        </div>

                        {/* 4. Delivery badge */}
                        <div className="flex-shrink-0">
                          <DeliveryTruckBadge
                            text={listing.deliveryText || listing.deliveryTime || '3 days'}
                            className="h-auto w-[55px] text-gray-400 sm:w-[65px]"
                          />
                        </div>

                        {/* 5. Actions */}
                        <div className="flex flex-shrink-0 items-center justify-end min-w-[32px]">
                          {inStock ? (
                            itemQty > 0 ? (
                              <div className="flex h-7 w-20 select-none items-center justify-between overflow-hidden rounded-xl bg-[#48286b] text-[10px] font-black text-white shadow-sm sm:h-8">
                                <button
                                  className="h-full px-2 sm:px-2.5 text-xs font-extrabold text-white/80 transition-all hover:bg-black/10 hover:text-white active:scale-95"
                                  onClick={() => handleQtyChange(itemQty - 1)}
                                >
                                  -
                                </button>
                                <span className="px-0.5 font-bold">
                                  {String(itemQty).padStart(2, '0')}
                                </span>
                                <button
                                  className="h-full px-2 sm:px-2.5 text-xs font-extrabold text-white/80 transition-all hover:bg-black/10 hover:text-white active:scale-95"
                                  onClick={() => {
                                    const nextQty = itemQty + 1;
                                    const maxQty = listing.maximumOrderQuantity || listing.maxOrderQty || config?.max_order_qty || 100;
                                    if (nextQty > maxQty) {
                                      handleQtyChange(minQty);
                                    } else {
                                      handleQtyChange(nextQty);
                                    }
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleQtyChange(minQty)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-white shadow-md transition-all hover:bg-orange-600 focus:outline-none active:scale-95 sm:h-8 sm:w-8"
                              >
                                <Plus className="h-4 w-4 sm:h-4.5 sm:w-4.5 stroke-[3]" />
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => setShowStockAlert(true)}
                              className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 flex items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-500 transition-all hover:bg-red-100 focus:outline-none active:scale-95"
                            >
                              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-6 text-center text-xs font-medium text-gray-400">
                    No active offers available for this product.
                  </div>
                )}
              </div>


            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <NotifyStockAlertModal
        isOpen={showStockAlert}
        productName={displayProduct.name}
        productId={displayProduct.id}
        onClose={() => setShowStockAlert(false)}
      />

      <CustomOrderModal
        isOpen={showCustomOrder}
        onClose={() => setShowCustomOrder(false)}
        productName={displayProduct.name}
        productId={displayProduct.id}
      />
    </>
  );
}
