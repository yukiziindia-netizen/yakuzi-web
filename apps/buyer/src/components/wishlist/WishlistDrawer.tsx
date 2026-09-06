'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Loader2, Star, Eye, Plus, RefreshCw } from 'lucide-react';
import WishlistIcon from '@/components/shared/WishlistIcon';
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/components/shared/Toast';
import { useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { useAuth } from '@yukizi/api-client';
import { useRouter } from 'next/navigation';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { QuickViewModal } from '@/components/products/QuickViewModal';
import { calculatePricing } from '@yukizi/utils';

export default function WishlistDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: wishlist, isLoading, isError } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart = useAddToCart();
  const { data: cartData } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const isDesktop = useIsDesktop();

  useScrollLock(isOpen);

  const items = wishlist?.items ?? [];

  const handleAddToCart = (item: any, finalPrice: number, finalOriginalPrice: number) => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('open-login'));
      return;
    }
    const imgUrl = item.image || item.product?.image || (item.product?.images && (typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0]?.url));
    const targetProductId = item.product?.bestListingId || item.productId || item.product?.id || item.id;
    const cartItem = {
      productId: targetProductId,
      quantity: 1,
      productName: item.productName || item.product?.name,
      price: finalPrice,
      originalPrice: finalOriginalPrice,
      image: imgUrl,
      imageUrl: imgUrl,
      images: imgUrl ? [imgUrl] : [],
      ...(item.product || {}),
    };
    addToCart.mutate(cartItem, {
      onSuccess: () => {
        toast('Added to bag', 'success');
      },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — sits below the floating nav bar's z-[90] so the bar
              stays visible/usable over the full-screen sheet, same trick the
              search panel already uses. */}
          <motion.div
            key="wishlist-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[85]"
          />

          {/* Mobile: full-screen sheet, opens bottom-up (matches the search
              panel's interaction model). Desktop (lg+): a fixed-width panel
              docked to the right edge, sliding in from the right instead -
              full-bleed reads wrong once there's a whole desktop viewport
              behind it. */}
          <motion.div
            key="wishlist-panel"
            initial={isDesktop ? { x: '100%' } : { y: '100%' }}
            animate={isDesktop ? { x: 0 } : { y: 0 }}
            exit={isDesktop ? { x: '100%' } : { y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
 className="fixed inset-0 lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[420px] lg:max-w-[90vw] glass-overlay z-[86] flex flex-col overflow-hidden"
          >
            {/* Custom Scrollbar Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #6342B4;
                border-radius: 10px;
              }
            `}} />

            {/* Hidden Close Button (for accessibility / mobile use) */}
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-white/80 rounded-full z-10 transition-colors">
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="pt-8 px-4 sm:px-6 pb-2">
              <h2 className="text-4xl font-bold text-gray-800">Saved</h2>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 sm:px-6 pb-24 pt-2 space-y-3">
              {isLoading && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="w-10 h-10 text-gray-300 animate-spin" />
                  <p className="text-base font-medium text-gray-400">Loading wishlist...</p>
                </div>
              ) : isError && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p className="text-base font-medium text-red-400">Failed to load wishlist</p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50 mt-10">
                  <p className="text-base font-medium text-gray-400">Your saved items list is empty</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item: any, idx: number) => {
                    const itemName = item.product?.name ?? item.productName ?? item.name ?? 'Product';
                    
                    const productObj = item.product || item;
                    const rawPrice = productObj?.price ?? productObj?.finalCustomerPayable ?? productObj?.sellingPrice ?? productObj?.sellerOffers?.[0]?.finalCustomerPayable ?? productObj?.sellerOffers?.[0]?.mrp;
                    const directPrice = (rawPrice != null && !isNaN(Number(rawPrice))) ? Number(rawPrice) : 0;
                    
                    const rawMrp = productObj?.mrp ?? productObj?.originalPrice ?? productObj?.sellerOffers?.[0]?.mrp ?? productObj?.lowestPrice ?? productObj?.price;
                    const mrpVal = (rawMrp != null && !isNaN(Number(rawMrp))) ? Number(rawMrp) : 0;

                    const pricing = mrpVal > 0 ? calculatePricing(
                      mrpVal,
                      Number(productObj?.gstPercent || 0),
                      {
                        type: productObj?.discountType || (productObj?.discountMeta?.discountPercent ? 'ptr_discount' : 'none'),
                        discountPercent: productObj?.discountMeta?.discountPercent,
                        specialPrice: productObj?.discountMeta?.specialPrice,
                        buy: productObj?.discountMeta?.buy,
                        get: productObj?.discountMeta?.get,
                        bonusProductName: productObj?.discountMeta?.bonusProductName,
                        shippingCharges: productObj?.finalShippingPrice ?? productObj?.shippingCharges ?? 0,
                        shippingGstPercent: 0,
                        isTaxIncluded: true,
                      }
                    ) : null;

                    const computedPrice = (pricing?.finalCustomerPayable != null && pricing.finalCustomerPayable > 0) 
                      ? Number(pricing.finalCustomerPayable) 
                      : 0;

                    const finalPrice = directPrice > 0 ? directPrice : (computedPrice > 0 ? computedPrice : mrpVal);
                    const discountPercent = Number(productObj?.discountMeta?.discountPercent || 0);

                    let finalOriginalPrice = 0;
                    if (discountPercent > 0 && finalPrice > 0) {
                      finalOriginalPrice = Math.round(finalPrice / (1 - discountPercent / 100));
                    } else if (mrpVal > finalPrice) {
                      finalOriginalPrice = mrpVal;
                    }

                    const displayPriceText = finalPrice > 0 ? `₹${Math.round(Number(finalPrice)).toLocaleString('en-IN')}` : 'N/A';
                    const displayOriginalPriceText = (finalOriginalPrice > 0 && Number(finalOriginalPrice) > Number(finalPrice)) 
                      ? `₹${Math.round(Number(finalOriginalPrice)).toLocaleString('en-IN')}` 
                      : '';

                    const displayDiscountPercent = (finalOriginalPrice > finalPrice && finalOriginalPrice > 0)
                      ? Math.round(((finalOriginalPrice - finalPrice) / finalOriginalPrice) * 100)
                      : discountPercent;
                    
                    const titleWords = itemName.trim().split(' ').filter(Boolean);
                    const initials = titleWords.length === 1 
                      ? itemName.trim().substring(0,2).toUpperCase() 
                      : (titleWords[0][0] + titleWords[titleWords.length - 1][0]).toUpperCase();
                    
                    const rawImage = item.product?.images?.[0]?.url || item.product?.images?.[0] || item.product?.image || item.imageUrl || item.image;
                    const resolvedImage = typeof rawImage === 'object' && rawImage?.url ? rawImage.url : rawImage;
                    const itemImage = (typeof resolvedImage === 'string' && resolvedImage && resolvedImage.trim() !== '')
                      ? resolvedImage
                      : `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent(initials)}`;
                    
                    const isYukiziChoice = item.product?.isYukiziChoice === true || item.isYukiziChoice === true;
                    const deliveryTime = item.product?.deliveryTime || item.product?.deliveryText || item.deliveryTime || item.deliveryText || '3 days';
                    const itemRating = item.product?.rating ?? item.product?.averageRating ?? item.rating ?? 'NA';

                    const bestListingId = productObj?.bestListingId;
                    const catalogProductId = productObj?.id || item.productId;
                    
                    const inCartItem = cartData?.items?.find((ci: any) => {
                      const ciProductIds = [
                        ci.productId,
                        ci.product?.id,
                        ci.id,
                        ci.bestListingId,
                        ci.product?.bestListingId
                      ].filter(Boolean);

                      const itemProductIds = [
                        item.productId,
                        item.id,
                        catalogProductId,
                        bestListingId,
                        productObj?.id,
                        productObj?.bestListingId
                      ].filter(Boolean);

                      return ciProductIds.some(id1 => itemProductIds.includes(id1));
                    });
                    const cartQty = inCartItem?.quantity || 0;

                    const handleIncrement = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (inCartItem) {
                        updateCartItem.mutate({
                          itemId: inCartItem.id,
                          quantity: cartQty + 1,
                        });
                      } else {
                        handleAddToCart(item, finalPrice, finalOriginalPrice);
                      }
                    };

                    const handleDecrement = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (inCartItem) {
                        if (cartQty > 1) {
                          updateCartItem.mutate({
                            itemId: inCartItem.id,
                            quantity: cartQty - 1,
                          });
                        } else {
                          removeCartItem.mutate(inCartItem.id);
                        }
                      }
                    };

                    return (
                      <motion.div
                        key={item.id || idx}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="glass-panel relative mt-3 flex gap-3 p-3 transition-all hover:bg-white/70"
                      >
                        {isYukiziChoice && (
                          <span className="absolute -top-[10px] left-3 z-20 flex items-center justify-center rounded-full bg-[#7B2FBE] px-2.5 py-0.5 text-2xs font-semibold tracking-wide text-white shadow-sm">
                            Yukizi Choice
                          </span>
                        )}

                        {/* Remove sits on the image here too, so both drawers
                            read identically. */}
                        <div className="relative flex h-[104px] w-[92px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-white/70 bg-white/55">
                          <img src={itemImage} alt={itemName} loading="lazy" decoding="async" className="h-[84px] w-[84px] object-contain mix-blend-multiply" />
                          <button
                            onClick={() => removeFromWishlist.mutate(item.productId || item.product?.id || item.id, {
                              onSuccess: () => toast('Removed from saved items', 'info'),
                            })}
                            disabled={removeFromWishlist.isPending}
                            title="Remove"
                            aria-label="Remove from saved items"
                            className="absolute bottom-1 left-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/70 bg-white/80 text-gray-500 shadow-sm backdrop-blur-md transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 sm:text-base">{itemName}</h3>

                          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-lg font-bold leading-none text-gray-900">{displayPriceText}</span>
                            {displayOriginalPriceText && (
                              <span className="text-xs font-semibold leading-none text-gray-400 line-through">{displayOriginalPriceText}</span>
                            )}
                            {displayDiscountPercent > 0 && (
                              <span className="text-xs font-bold leading-none text-emerald-600">{displayDiscountPercent}% off</span>
                            )}
                          </div>

                          <div className="mt-1.5 flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-[#f5a623] text-[#f5a623]" />
                            <span className="text-xs font-bold text-gray-700">{itemRating}</span>
                          </div>
                        </div>

                        {/* Quantity on top, reset beneath — the same column the
                            cart drawer uses for quantity + save. */}
                        <div className="flex flex-shrink-0 flex-col items-end gap-2">
                          {cartQty === 0 ? (
                            <button
                              onClick={handleIncrement}
                              aria-label="Add to cart"
                              className="flex h-7 items-center gap-1 rounded-full bg-[linear-gradient(180deg,#8f5ad4_0%,#7745bd_48%,#5f2f9f_100%)] px-2.5 text-2xs font-bold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_4px_12px_-4px_rgba(88,54,150,0.75)] transition-transform active:scale-95"
                            >
                              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                              Add
                            </button>
                          ) : (
                            <>
                              <div className="flex h-7 select-none items-center justify-between gap-0.5 rounded-full bg-[linear-gradient(180deg,#8f5ad4_0%,#7745bd_48%,#5f2f9f_100%)] px-1 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_4px_12px_-4px_rgba(88,54,150,0.75)]">
                                <button
                                  onClick={handleDecrement}
                                  aria-label="Decrease quantity"
                                  className="flex h-5 w-5 items-center justify-center rounded-full text-sm font-bold text-white/90 transition-colors hover:bg-white/20 hover:text-white active:scale-90"
                                >
                                  −
                                </button>
                                <span className="min-w-[16px] text-center text-[11px] font-bold tabular-nums tracking-wide">
                                  {cartQty.toString().padStart(2, '0')}
                                </span>
                                <button
                                  onClick={handleIncrement}
                                  aria-label="Increase quantity"
                                  className="flex h-5 w-5 items-center justify-center rounded-full text-sm font-bold text-white/90 transition-colors hover:bg-white/20 hover:text-white active:scale-90"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (inCartItem) {
                                    removeCartItem.mutate(inCartItem.id, {
                                      onSuccess: () => {
                                        toast('Quantity reset', 'success');
                                      }
                                    });
                                  }
                                }}
                                title="Reset quantity"
                                aria-label="Reset quantity"
                                disabled={removeCartItem.isPending}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/55 text-[#5b3391] transition-colors hover:bg-white/85 disabled:opacity-50"
                              >
                                <RefreshCw className={`h-3.5 w-3.5 ${removeCartItem.isPending ? 'animate-spin' : ''}`} />
                              </button>
                            </>
                          )}

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedProduct(item.product || {
                                id: item.productId || item.id,
                                name: itemName,
                                price: finalPrice,
                                image: itemImage,
                              });
                            }}
                            title="Quick view"
                            aria-label="Quick view"
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/55 text-gray-500 transition-colors hover:bg-white/85 hover:text-gray-700"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            <QuickViewModal
              product={selectedProduct}
              isOpen={!!selectedProduct}
              onClose={() => setSelectedProduct(null)}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
