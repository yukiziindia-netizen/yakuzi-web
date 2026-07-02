'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Loader2, Star, ArrowUpRight, Plus, RefreshCw } from 'lucide-react';
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

  const handleAddToCart = (item: any) => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('open-login'));
      return;
    }
    const imgUrl = item.image || item.product?.image || (item.product?.images && (typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0]?.url));
    const cartItem = {
      productId: item.productId || item.product?.id || item.id,
      quantity: 1,
      productName: item.productName || item.product?.name,
      price: item.price || item.product?.price,
      image: imgUrl,
      imageUrl: imgUrl,
      images: imgUrl ? [imgUrl] : [],
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
            className="fixed inset-0 bg-[#6342B4]/35 z-[100] backdrop-blur-none"
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
            <style jsx global>{`
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
            `}</style>

            {/* Hidden Close Button (for accessibility / mobile use) */}
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-white/80 rounded-full z-10 transition-colors">
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="pt-8 px-4 sm:px-6 pb-2">
              <h2 className="text-[34px] font-extrabold text-gray-800">Wishlist</h2>
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
                    const rawPrice = item.product?.price ?? item.price;
                    const rawOriginalPrice = item.product?.originalPrice ?? item.product?.mrp ?? item.originalPrice ?? item.mrp;
                    const itemPrice = rawPrice != null ? rawPrice : 0;
                    const itemOriginalPrice = rawOriginalPrice != null ? rawOriginalPrice : 0;
                    const isNotAvailable = item.product?.sellerCount === 0 || item.product?.sellerOffers?.length === 0 || rawPrice == null;
                    
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
                    
                    const inCartItem = cartData?.items?.find(
                      (ci: any) => ci.productId === (item.productId || item.product?.id || item.id)
                    );
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
                        handleAddToCart(item);
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
                        className={`bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border p-2 sm:p-3 flex gap-2 sm:gap-3.5 relative overflow-hidden group transition-all ${
                          isYukiziChoice ? 'border-[#6342B4] border-[1.5px]' : 'border-gray-100'
                        }`}
                      >
                        {isYukiziChoice && (
                          <span className="absolute top-0 left-0 text-[9px] font-bold text-white bg-[#6342B4] px-2 py-1 rounded-br-lg z-10 uppercase tracking-wider">
                            YUKIZI CHOICE
                          </span>
                        )}

                        {/* Left Image */}
                        <div className="w-[90px] h-[90px] sm:w-[105px] sm:h-[105px] bg-[#f8f5fd] rounded-xl flex items-center justify-center relative flex-shrink-0 mt-1.5 overflow-hidden">
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
                        <div className="flex-1 min-w-0 mt-1 flex flex-col gap-1.5">
                          {/* Row 1: Move to Cart (left) & Refresh + Quantity Selector (right) */}
                          <div className="flex items-center justify-between w-full pr-1.5 sm:pr-3">
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="flex items-center gap-1 bg-[#f7941d] hover:bg-orange-600 text-white p-1.5 px-3 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-xs font-bold transition-all whitespace-nowrap shadow-sm"
                            >
                              <span className="hidden sm:inline">Move to Cart</span>
                              <Plus className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 text-white" strokeWidth={3} />
                            </button>

                            {/* Right actions: Refresh + Quantity Selector */}
                            <div className="flex items-center gap-1 sm:gap-1.5">
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
                                <RefreshCw className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${removeCartItem.isPending ? 'animate-spin' : ''}`} />
                              </button>

                              {/* Purple Quantity Selector Pill */}
                              <div className="flex items-center bg-[#48286b] rounded-lg text-white shadow-sm h-7 sm:h-8 px-2 sm:px-2.5 gap-1.5 sm:gap-2 select-none">
                                <button 
                                  onClick={handleDecrement}
                                  className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-white hover:bg-white/10 rounded font-bold text-xs sm:text-sm"
                                  disabled={cartQty === 0}
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
                          </div>

                          {/* Row 2: Product Name & Arrow Button */}
                          <div className="flex items-center justify-between w-full pr-1.5 sm:pr-3 gap-2">
                            <h3 className="text-[16px] font-bold text-gray-700 leading-snug truncate text-left flex-1">{itemName}</h3>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedProduct(item.product || {
                                  id: item.productId || item.id,
                                  name: itemName,
                                  price: itemPrice,
                                  image: itemImage,
                                });
                              }}
                              className="w-5 h-5 sm:w-6 sm:h-6 bg-[#8c8c8c] rounded-full flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform shadow-sm"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2.5} />
                            </button>
                          </div>

                          {/* Row 3: Price & Rating */}
                          <div className="flex items-center justify-between w-full pr-1.5 sm:pr-3 gap-2">
                            <div className="flex items-baseline gap-2 text-left">
                              <span className="text-[19px] font-black text-gray-900">{isNotAvailable ? 'N/A' : `₹${itemPrice.toLocaleString('en-IN')}`}</span>
                              <span className="text-[14px] font-bold text-gray-400 line-through">{!isNotAvailable && itemOriginalPrice > 0 ? `₹${itemOriginalPrice.toLocaleString('en-IN')}` : ''}</span>
                            </div>
                            <div className="flex items-center gap-[3px] sm:gap-[4px]">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-[#6342B4] text-[#6342B4]" />
                              <span className="text-xs sm:text-[14px] font-bold text-gray-700">{item.rating || 4.5}</span>
                            </div>
                          </div>

                          {/* Row 4: Delivery */}
                          <div className="flex justify-end w-full pr-1.5 sm:pr-3 mt-0.5">
                            <DeliveryTruckBadge text={deliveryTime} className="w-[80px] sm:w-[95px] text-[#9a9a9a]" />
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
