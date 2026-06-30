'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Loader2, Bookmark, Truck, CheckCircle, Plus, Star, Bell, Package } from 'lucide-react';
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
import { calculatePricing, getSellingPrice, getEffectiveDiscountPercent, generateProductSlug } from '@yukizi/utils';
import type { Product } from '@yukizi/utils';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const router = useRouter();
  const { data: fullProductRaw, isLoading: isLoadingDetails } = useProductById(product?.id || '', {
    enabled: !!product?.id && isOpen
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

  if (!displayProduct) return null;

  const productImages = displayProduct.images && displayProduct.images.length > 0
    ? displayProduct.images.map((img: any) => img.url || img)
    : [
        displayProduct.image ||
          `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent((displayProduct.name || 'PR').trim().split(/\s+/).length === 1 ? (displayProduct.name || 'PR').trim().substring(0, 2).toUpperCase() : ((displayProduct.name || 'PR').trim().split(/\s+/)[0][0] + (displayProduct.name || 'PR').trim().split(/\s+/)[(displayProduct.name || 'PR').trim().split(/\s+/).length - 1][0]).toUpperCase())}`,
      ];

  const activeImage = productImages[activeImageIndex % productImages.length];

  const comparisonListings = listings.filter((l: any) => l.price != null);
  const displayPrice = comparisonListings.length > 0 ? Math.min(...comparisonListings.map((l: any) => l.price)) : displayProduct.price;

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
      addToWishlist.mutate({
        productId: displayProduct.id,
        productName: displayProduct.name,
        price: displayPrice || 0,
        image: displayProduct.image || productImages[0],
      }, {
        onSuccess: () => toast('Added to wishlist!', 'success'),
      });
    }
  };

  const handleAddToCart = (listing: any, quantity: number) => {
    addToCart.mutate({
      productId: listing.id,
      quantity,
      productName: displayProduct.name,
      price: listing.price,
      mrp: displayProduct.mrp,
      image: productImages[0],
      imageUrl: productImages[0],
      images: productImages,
    });
  };

  const handleUpdateQty = (listing: any, quantity: number) => {
    addToCart.mutate({
      productId: listing.id,
      quantity,
      replace: true
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
              className="relative w-full max-w-[500px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm rounded-[32px] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.1)] border border-white/40 no-scrollbar p-6 flex flex-col gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header section with Title & Share */}
              <div className="flex flex-col relative w-full pt-3">
                <div className="flex items-start justify-between w-full">
                  <h2 className="text-[20px] font-black text-gray-800 tracking-tight leading-tight max-w-[85%]">
                    {displayProduct.name}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors self-start"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                
              </div>

              {/* Product Banner Halftone Card */}
              <div 
                className="relative w-full aspect-[4/3] rounded-[24px] bg-gradient-to-br from-[#854dff] via-[#b336e8] to-[#ff2b9a] border border-purple-400/20 shadow-md flex items-center justify-center p-6"
                style={{
                  backgroundImage: `
                    radial-gradient(rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px),
                    linear-gradient(135deg, #854dff 0%, #b336e8 50%, #ff2b9a 100%)
                  `,
                  backgroundSize: '12px 12px, 100% 100%',
                }}
              >
                {/* Abstract slashes for action look */}
                <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-pink-500/20 to-transparent skew-x-12 transform origin-bottom-right pointer-events-none" />
                <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-pink-500/10 blur-2xl pointer-events-none" />

                {/* Share Button on Top Left Corner */}
                <div className="absolute -top-3.5 -left-3.5 z-30">
                  <ShareButton 
                    productName={displayProduct.name}
                    productId={displayProduct.id}
                    productPrice={displayProduct.mrp}
                    className="p-3 bg-white rounded-full border-0 shadow-none text-gray-500 focus:outline-none hover:scale-105 transition-transform"
                    iconClassName="w-[18px] h-[18px]"
                  />
                </div>

                {/* Interactive Thumbnail Gallery overlay on the left */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
                  {productImages.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-11 h-11 rounded-lg overflow-hidden border-2 bg-white/15 backdrop-blur-sm shadow-sm transition-all duration-200 ${
                        activeImageIndex === idx ? 'border-orange-500 scale-105 shadow-md' : 'border-white/30 hover:border-white/60'
                      }`}
                    >
                      <Image 
                        src={img} 
                        alt="" 
                        width={44}
                        height={44}
                        className="w-full h-full object-cover" 
                      />
                    </button>
                  ))}
                </div>

                {/* Main Product Image */}
                <div className="relative w-[80%] h-[80%] flex items-center justify-center">
                  <Image
                    src={activeImage}
                    alt={displayProduct.name}
                    fill
                    className="object-contain hover:scale-105 transition-transform duration-500 p-2"
                    priority
                  />
                </div>

                {/* Ribbon Bookmark flag on the right edge */}
                <button
                  type="button"
                  onClick={handleBookmarkToggle}
                  className="absolute -right-[10px] top-[45%] z-20 focus:outline-none transition-transform hover:scale-105"
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
                      fill={isBookmarked ? "#854cbc" : "#ffffff"}
                      stroke={isBookmarked ? "#854cbc" : "#9ca3af"}
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Marketplace Offers Comparison List */}
              <div className="flex flex-col gap-3 w-full">
                {comparisonListings.length > 0 ? (
                  comparisonListings.map((listing: any) => {
                    const inStock = true; // accept even if stock is 0
                    const cartItem = cartData?.items?.find((item: any) => item.productId === listing.id);
                    const itemQty = cartItem?.quantity || 0;
                    const sellerMoq = listing.moq || listing.minimumOrderQuantity || 1;
                    const minQty = sellerMoq;
                    
                    const itemMrp = listing.mrp || listing.originalPrice || displayProduct.mrp || displayProduct.originalPrice;
                    const discountPercent = itemMrp && listing.price && itemMrp > listing.price
                      ? Math.round(((itemMrp - listing.price) / itemMrp) * 100)
                      : (listing.discountMeta?.discountPercent || 20);

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
                        className="flex flex-row items-center justify-between p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100/70 border border-gray-100/80 transition-colors gap-3 w-full"
                      >
                        {/* Left: Discount Badge & Price */}
                        <div className="flex items-center gap-3.5 min-w-[155px]">
                          <div className="bg-[#854cbc] text-white px-2 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase leading-none min-w-[66px] text-center select-none">
                            {discountPercent}% off
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[15px] font-black text-gray-800 leading-none">
                              ₹{listing.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold mt-1.5 leading-none">
                              {listing.moq > 1 ? `${listing.moq * 10}% off on purchase of ${listing.moq}` : 'MOQ: 1'}
                            </span>
                          </div>
                        </div>

                        {/* Middle: Star Rating & Delivery badge */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-[#854cbc] text-[#854cbc]" />
                            <span className="text-gray-800 font-black text-[12px] leading-none">{listing.seller?.rating || '4.5'}</span>
                          </div>

                          <DeliveryTruckBadge text={listing.deliveryText || listing.deliveryTime || '3 days'} className="w-[72px] h-auto text-gray-400" />
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3">
                          {inStock ? (
                            itemQty > 0 ? (
                              <div className="flex items-center bg-[#48286b] rounded-full overflow-hidden h-8 w-24 text-white shadow-sm font-black text-[11px] select-none justify-between">
                                <button 
                                  className="px-3 h-full hover:bg-black/10 active:scale-95 transition-all text-white/80 hover:text-white font-extrabold text-sm"
                                  onClick={() => handleQtyChange(itemQty - 1)}
                                >
                                  -
                                </button>
                                <span className="px-1 font-bold">{String(itemQty).padStart(2, '0')}</span>
                                <button 
                                  className="px-3 h-full hover:bg-black/10 active:scale-95 transition-all text-white/80 hover:text-white font-extrabold text-sm"
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
                                className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-all focus:outline-none"
                              >
                                <Plus className="w-4.5 h-4.5 stroke-[3]" />
                              </button>
                            )
                          ) : (
                            <button 
                              onClick={() => setShowStockAlert(true)}
                              className="w-8.5 h-8.5 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center border border-red-100 active:scale-95 transition-all focus:outline-none"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-gray-400 font-medium border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
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
