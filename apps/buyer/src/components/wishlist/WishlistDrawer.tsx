'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Loader2, Star, Eye, Plus, RefreshCw } from 'lucide-react';
import WishlistIcon from '@/components/shared/WishlistIcon';
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { DeliveryTruckBadge } from '@/components/shared/DeliveryTruckBadge';
import { useToast } from '@/components/shared/Toast';
import { useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { useAuth } from '@yukizi/api-client';
import { useRouter } from 'next/navigation';
import { useScrollLock } from '@/hooks/useScrollLock';
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
          {/* Backdrop */}
          <motion.div
            key="wishlist-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100]"
          />

          {/* Drawer Panel */}
          <motion.div
            key="wishlist-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-[95%] sm:w-[580px] md:w-[620px] max-w-full bg-white shadow-2xl z-[110] flex flex-col overflow-hidden rounded-l-3xl"
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
              <h2 className="text-[34px] font-extrabold text-gray-800">Saved</h2>
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
                  <WishlistIcon className="w-20 h-20 text-gray-300" />
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
                        className={`bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border p-2 sm:p-3 flex gap-2 sm:gap-3.5 relative overflow-visible mt-3 group transition-all ${
                          isYukiziChoice ? 'border-[#7B2FBE] border-[1.5px]' : 'border-gray-100'
                        }`}
                      >
                        {isYukiziChoice && (
                          <span className="absolute -top-[12px] left-3 bg-[#7B2FBE] text-white px-3 py-0.5 rounded-full font-semibold text-[10px] sm:text-[11px] shadow-sm tracking-wide flex items-center justify-center z-20">
                            Yukizi Choice
                          </span>
                        )}

                        {/* Left Image */}
                        <div className="w-[90px] sm:w-[105px] bg-[#f8f5fd] rounded-xl flex items-center justify-center relative flex-shrink-0 overflow-hidden self-stretch my-1">
                          <img src={itemImage} alt={itemName} className="w-16 h-16 sm:w-20 sm:h-20 object-contain mix-blend-multiply" />
                          <button 
                            onClick={() => removeFromWishlist.mutate(item.productId || item.product?.id || item.id, {
                              onSuccess: () => toast('Removed from saved items', 'info'),
                            })}
                            disabled={removeFromWishlist.isPending}
                            className="absolute bottom-0 left-0 bg-[#f7941d] text-white p-1.5 sm:p-2 rounded-tr-2xl hover:bg-orange-500 transition-colors z-10 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4 sm:w-[22px] sm:h-[22px]" />
                          </button>
                        </div>

                        {/* Middle Content */}
                        <div className="flex-1 min-w-0 mt-1 flex flex-col gap-1.5 justify-between">
                          {/* Row 1: Actions (right-aligned Plus/Quantity Controls) */}
                          <div className="flex justify-end w-full pr-1.5 sm:pr-3">
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {cartQty === 0 ? (
                                <button
                                  onClick={handleIncrement}
                                  className="text-black hover:text-black/80 focus:outline-none transition-transform active:scale-90 p-1"
                                >
                                  <Plus className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                                </button>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  {/* Reset count button */}
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
                                    className="text-[#48286b] hover:text-[#361e51] transition-colors p-1"
                                    title="Reset quantity"
                                    disabled={removeCartItem.isPending}
                                  >
                                    <RefreshCw className={`w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#48286b] ${removeCartItem.isPending ? 'animate-spin' : ''}`} />
                                  </button>

                                  {/* Purple Quantity Selector Pill */}
                                  <div className="flex items-center bg-[#48286b] rounded-lg text-white shadow-sm h-7 sm:h-8 px-2 sm:px-2.5 gap-1.5 sm:gap-2 select-none">
                                    <button 
                                      onClick={handleDecrement}
                                      className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-white hover:bg-white/10 rounded font-bold text-xs sm:text-sm"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs sm:text-xs font-black px-0.5 sm:px-1 tracking-tighter min-w-[14px] sm:min-w-[16px] text-center">
                                      {cartQty.toString().padStart(2, '0')}
                                    </span>
                                    <button 
                                      onClick={handleIncrement}
                                      className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-white hover:bg-white/10 rounded font-bold text-xs sm:text-sm"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Row 2: Product Name (left) & Quickview/Eye Button (right) */}
                          <div className="flex items-center justify-between w-full pr-1.5 sm:pr-3 gap-2">
                            <h3 className="text-[13px] sm:text-[14px] font-medium text-gray-500 leading-snug truncate text-left flex-1">{itemName}</h3>
                            
                            {/* Quickview Button */}
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
                              className="flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
                              title="Quick view"
                            >
                              <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>

                          {/* Row 3: Price & Star Rating */}
                          <div className="flex items-center justify-between w-full pr-1.5 sm:pr-3 gap-2">
                            <div className="flex items-baseline gap-2 text-left">
                              <span className="text-[19px] font-black text-gray-900">{displayPriceText}</span>
                              {displayOriginalPriceText && (
                                <span className="text-[14px] font-bold text-gray-400 line-through">{displayOriginalPriceText}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-[3px] sm:gap-[4px]">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-[#6342B4] text-[#6342B4]" />
                              <span className="text-xs sm:text-[14px] font-bold text-gray-700">{itemRating}</span>
                            </div>
                          </div>

                          {/* Row 4: Discount & Delivery */}
                          <div className="flex items-center justify-between w-full pr-1.5 sm:pr-3 gap-2">
                            <div className="text-left">
                              {displayDiscountPercent > 0 && (
                                <span className="text-xs sm:text-[13px] font-bold text-black">{displayDiscountPercent}% off</span>
                              )}
                            </div>
                            
                            <div className="-mr-[6px] sm:-mr-[8px]">
                              <DeliveryTruckBadge text={deliveryTime} className="w-[52px] sm:w-[75px] h-auto text-[#8c8c8c]" />
                            </div>
                          </div>
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
