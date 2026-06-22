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
  const minOrderAmount = config?.min_order_amount ?? 20000;

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
          image: displayProduct.image || productImages[0],
        },
        {
          onSuccess: () => toast('Added to wishlist!', 'success'),
        },
      );
    }
  };

  const handleAddToCart = (listing: any, quantity: number) => {
    addToCart.mutate({
      productId: listing.id,
      quantity,
      productName: displayProduct.name,
      price: listing.price,
      mrp: displayProduct.mrp,
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Ambient Backdrop */}
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm backdrop-saturate-[1.8]" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="no-scrollbar relative flex max-h-[90vh] w-full max-w-[500px] flex-col gap-5 overflow-y-auto rounded-[32px] border border-white/40 bg-white/95 p-6 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.1)] backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header section with Title & Share */}
              <div className="relative flex w-full flex-col pt-3">
                <div className="flex w-full items-start justify-between">
                  <h2 className="max-w-[85%] text-[20px] font-black leading-tight tracking-tight text-gray-800">
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
                className="relative flex aspect-[4/3] w-full items-center justify-center rounded-[24px] border border-purple-400/20 bg-gradient-to-br from-[#854dff] via-[#b336e8] to-[#ff2b9a] p-6 shadow-md"
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

                {/* Interactive Thumbnail Gallery overlay on the left */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
                  {productImages.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`h-11 w-11 overflow-hidden rounded-lg border-2 bg-white/15 shadow-sm backdrop-blur-sm transition-all duration-200 ${
                        activeImageIndex === idx
                          ? 'scale-105 border-orange-500 shadow-md'
                          : 'border-white/30 hover:border-white/60'
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>

                {/* Main Product Image */}
                <div className="relative flex h-[80%] w-[80%] items-center justify-center">
                  <img
                    src={activeImage}
                    alt={displayProduct.name}
                    className="max-h-full max-w-full object-contain p-2 transition-transform duration-500 hover:scale-105"
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
                    const inStock = (listing.stock ?? 0) > 0;
                    const cartItem = cartData?.items?.find(
                      (item: any) => item.productId === listing.id,
                    );
                    const itemQty = cartItem?.quantity || 0;
                    const sellerMoq = listing.moq || listing.minimumOrderQuantity || 1;
                    const minQty =
                      listing.price > 0
                        ? Math.max(sellerMoq, Math.ceil(minOrderAmount / listing.price))
                        : sellerMoq;

                    const itemMrp =
                      listing.mrp ||
                      listing.originalPrice ||
                      displayProduct.mrp ||
                      displayProduct.originalPrice;
                    const discountPercent =
                      itemMrp && listing.price && itemMrp > listing.price
                        ? Math.round(((itemMrp - listing.price) / itemMrp) * 100)
                        : listing.discountMeta?.discountPercent || 20;

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
                        className="flex w-full flex-row items-center justify-between gap-3 rounded-2xl border border-gray-100/80 bg-gray-50 p-3.5 transition-colors hover:bg-gray-100/70"
                      >
                        {/* Left: Discount Badge & Price */}
                        <div className="flex min-w-[155px] items-center gap-3.5">
                          <div className="min-w-[66px] select-none rounded-lg bg-[#854cbc] px-2 py-1.5 text-center text-[9px] font-black uppercase leading-none tracking-wider text-white">
                            {discountPercent}% off
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[15px] font-black leading-none text-gray-800">
                              ₹
                              {listing.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="mt-1.5 text-[9px] font-bold leading-none text-gray-400">
                              {listing.moq > 1
                                ? `${listing.moq * 10}% off on purchase of ${listing.moq}`
                                : 'MOQ: 1'}
                            </span>
                          </div>
                        </div>

                        {/* Middle: Star Rating & Delivery badge */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-[#854cbc] text-[#854cbc]" />
                            <span className="text-[12px] font-black leading-none text-gray-800">
                              {listing.seller?.rating || '4.5'}
                            </span>
                          </div>

                          <DeliveryTruckBadge
                            text={listing.deliveryText || listing.deliveryTime || '3 days'}
                            className="h-auto w-[72px] text-gray-400"
                          />
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3">
                          {inStock ? (
                            itemQty > 0 ? (
                              <div className="flex h-8 w-24 select-none items-center justify-between overflow-hidden rounded-full bg-[#48286b] text-[11px] font-black text-white shadow-sm">
                                <button
                                  className="h-full px-3 text-sm font-extrabold text-white/80 transition-all hover:bg-black/10 hover:text-white active:scale-95"
                                  onClick={() => handleQtyChange(itemQty - 1)}
                                >
                                  -
                                </button>
                                <span className="px-1 font-bold">
                                  {String(itemQty).padStart(2, '0')}
                                </span>
                                <button
                                  className="h-full px-3 text-sm font-extrabold text-white/80 transition-all hover:bg-black/10 hover:text-white active:scale-95"
                                  onClick={() => handleQtyChange(itemQty + 1)}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleQtyChange(minQty)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-md transition-all hover:bg-orange-600 focus:outline-none active:scale-95"
                              >
                                <Plus className="w-4.5 h-4.5 stroke-[3]" />
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => setShowStockAlert(true)}
                              className="w-8.5 h-8.5 flex items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-500 transition-all hover:bg-red-100 focus:outline-none active:scale-95"
                            >
                              <Bell className="h-4 w-4" />
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
