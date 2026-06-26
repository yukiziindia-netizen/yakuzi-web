'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Loader2, Star, Bookmark, ShoppingBag, ShoppingCart } from 'lucide-react';
import { DeliveryTruckBadge } from '@/components/shared/DeliveryTruckBadge';
import WishlistIcon from '@/components/shared/WishlistIcon';
import { useCart, useUpdateCartItem, useRemoveCartItem, useSyncCart, useClearCart } from '@/hooks/useCart';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { useCreateOrder } from '@/hooks/useOrders';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { useAddToWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/components/shared/Toast';
import { useAuth } from '@yukizi/api-client';
import { useRouter } from 'next/navigation';
import { useScrollLock } from '@/hooks/useScrollLock';



export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: cart, isLoading, isError } = useCart();
  const { data: config } = usePlatformConfig();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const syncCart = useSyncCart();
  const clearCart = useClearCart();
  const createOrder = useCreateOrder();
  const addToWishlist = useAddToWishlist();
  const { data: profileData } = useBuyerProfile();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useScrollLock(isOpen);

  const items = cart?.items ?? [];

  const handleCheckout = async () => {
    if (isAuthenticated) {
      try {
        if (items.length > 0) {
          await syncCart.mutateAsync();
        }
        
        const profile = (profileData as any)?.data || profileData;
        const address = {
          name: profile?.legalName || profile?.name || user?.name || 'Customer',
          phone: profile?.phone || user?.phone || user?.mobile || '0000000000',
          address: profile?.address?.street1 || (typeof profile?.address === 'string' ? profile.address : 'Default Address'),
          city: profile?.address?.city || profile?.city || 'Default City',
          state: profile?.address?.state || profile?.state || 'Default State',
          pincode: profile?.address?.pincode || profile?.pincode || '000000',
        };

        createOrder.mutate(address, {
          onSuccess: (data: any) => {
            const orderId = data?.data?.id || data?.id;
            clearCart.mutate(undefined, {
              onSuccess: () => {
                toast('Order placed successfully!', 'success');
                onClose();
                router.push(`/orders/${orderId}?success=true`);
              }
            });
          },
          onError: (error: any) => {
            toast(error?.message || 'Failed to place order', 'error');
          }
        });
      } catch (e: any) {
        toast(e.message || 'Failed to sync bag with backend', 'error');
      }
    } else {
      window.dispatchEvent(new CustomEvent('open-login'));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#6342B4]/35 z-[100] backdrop-blur-none"
          />

          {/* Drawer Panel */}
          <motion.div
            key="cart-drawer-panel"
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
              <h2 className="text-[34px] font-extrabold text-gray-800">My Cart</h2>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 sm:px-6 pb-4 pt-2 space-y-3">
              {(isLoading || syncCart.isPending) && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="w-10 h-10 text-gray-300 animate-spin" />
                  <p className="text-base font-medium text-gray-400">Loading bag...</p>
                </div>
              ) : isError && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p className="text-base font-medium text-red-400">Failed to load bag</p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50 mt-10">
                  <ShoppingBag className="w-20 h-20 text-gray-300" />
                  <p className="text-base font-medium text-gray-400">Your cart is empty</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item: any, idx: number) => {
                    const itemName = item.product?.name ?? item.productName ?? item.name ?? 'Product';
                  const itemPrice = item.product?.price ?? item.price ?? 3345.53;
                  const itemOriginalPrice = item.product?.originalPrice ?? item.originalPrice ?? 5000.00;
                  const itemImageRaw = item.product?.images?.[0] || item.imageUrl || item.image;
                  const titleWords = itemName.trim().split(' ').filter(Boolean);
                  const initials = titleWords.length === 1 
                    ? itemName.trim().substring(0,2).toUpperCase() 
                    : (titleWords[0][0] + titleWords[titleWords.length - 1][0]).toUpperCase();
                  const resolvedImage = typeof itemImageRaw === 'object' && itemImageRaw?.url ? itemImageRaw.url : itemImageRaw;
                  const itemImage = (!resolvedImage || resolvedImage === '/products/pharma_bottle.png')
                    ? `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent(initials)}`
                    : resolvedImage;
                  const isYukiziChoice = item.isYukiziChoice ?? (idx % 3 === 0);
                  const quantity = item.quantity ?? 1;

                  return (
                    <motion.div
                      key={item.id || idx}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="bg-white rounded-[14px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 p-2 sm:p-3 flex gap-2 sm:gap-3 relative overflow-hidden group"
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
                          onClick={(e) => {
                            e.preventDefault();
                            removeItem.mutate(item.id, {
                              onSuccess: () => toast('Item removed from bag', 'info'),
                            });
                          }}
                          disabled={removeItem.isPending || syncCart.isPending}
                          className="absolute bottom-0 left-0 bg-[#f7941d] text-white p-1.5 sm:p-2 rounded-tr-2xl hover:bg-orange-500 transition-colors z-10 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4 sm:w-[22px] sm:h-[22px]" />
                        </button>
                      </div>

                      {/* Right Content */}
                      <div className="flex-1 min-w-0 pr-1 mt-1 relative">
                        {/* Top Row: Wishlist Badge & Quantity Pill (on mobile) */}
                        <div className="flex items-center justify-between w-full mb-1.5 pr-1">
                          {/* Wishlist Button Badge */}
                          <div className="inline-block">
                            <button 
                              onClick={async (e) => {
                                e.preventDefault();
                                await addToWishlist.mutateAsync({
                                  ...item,
                                  id: item.product?.id || item.productId || item.id,
                                  name: itemName,
                                  price: itemPrice,
                                  originalPrice: itemOriginalPrice,
                                  image: itemImage,
                                });
                                toast('Added to wishlist', 'success');
                              }}
                              className="flex items-center gap-1 sm:gap-1.5 bg-[#562996] text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-[10px] hover:bg-[#432075] transition-colors shadow-sm"
                            >
                              <span className="text-[10px] sm:text-[14px] font-bold tracking-wider">Wishlist</span>
                              <Bookmark className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </button>
                          </div>

                          {/* Quantity Pill (Mobile only) */}
                          <div className="flex sm:hidden items-center bg-[#562996] rounded-lg text-white overflow-hidden shadow-sm h-7 px-1.5">
                            <button 
                              onClick={() => {
                                const moq = item.moq || item.product?.moq || item.product?.minimumOrderQuantity || 1;
                                updateItem.mutate({ itemId: item.id, quantity: Math.max(moq, quantity - 1) });
                              }}
                              disabled={updateItem.isPending || syncCart.isPending || quantity <= (item.moq || item.product?.moq || item.product?.minimumOrderQuantity || 1)}
                              className="px-1.5 h-full hover:bg-black/20 flex items-center justify-center font-bold text-xs transition-colors disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="text-[11px] font-black px-1 tracking-tighter">{quantity.toString().padStart(2, '0')}</span>
                            <button 
                              onClick={() => {
                                const stock = item.stock ?? item.product?.stock ?? 9999;
                                const maxLimit = (item.maximumOrderQuantity || item.product?.maximumOrderQuantity) || stock;
                                const max = Math.min(stock, maxLimit);
                                if (quantity < max) {
                                  updateItem.mutate({ itemId: item.id, quantity: quantity + 1 });
                                } else {
                                  toast(`Only ${max} units available`, 'error');
                                }
                              }}
                              disabled={updateItem.isPending || syncCart.isPending}
                              className="px-1.5 h-full hover:bg-black/20 flex items-center justify-center font-bold text-xs transition-colors disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <h3 className="text-[16px] font-bold text-gray-800 leading-snug truncate pr-6">{itemName}</h3>
                        
                        <div className="flex items-center gap-1.5 mb-1 mt-0.5">
                          <span className="text-[19px] font-black text-gray-900">₹{(itemPrice * quantity).toLocaleString('en-IN')}</span>
                          <span className="text-[14px] font-bold text-gray-400 line-through">₹{(itemOriginalPrice * quantity).toLocaleString('en-IN')}</span>
                        </div>
                        
                        <span className="text-[13px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded inline-block">
                          {item.discount || '25% off'}
                        </span>
                        
                        {/* Rating */}
                        <div className="absolute right-1 bottom-1 flex flex-col items-end gap-0.5 sm:gap-1">
                          <div className="flex items-center gap-[3px] sm:gap-[4px]">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-[#6342B4] text-[#6342B4]" />
                            <span className="text-xs sm:text-[14px] font-bold text-gray-700">{item.rating || 4.5}</span>
                          </div>
                          <DeliveryTruckBadge text="2 days" className="w-[80px] sm:w-[95px] mt-0.5 text-[#9a9a9a]" />
                        </div>

                        {/* Top Right Actions */}
                        <div className="absolute top-0 right-0 flex flex-col items-end gap-2">
                          {/* Quantity Pill (Desktop/Tablet only) */}
                          <div className="hidden sm:flex items-center bg-[#562996] rounded-lg sm:rounded-[10px] text-white overflow-hidden shadow-sm h-8 sm:h-10 px-2 sm:px-3">
                            <button 
                              onClick={() => {
                                const moq = item.moq || item.product?.moq || item.product?.minimumOrderQuantity || 1;
                                updateItem.mutate({ itemId: item.id, quantity: Math.max(moq, quantity - 1) });
                              }}
                              disabled={updateItem.isPending || syncCart.isPending || quantity <= (item.moq || item.product?.moq || item.product?.minimumOrderQuantity || 1)}
                              className="px-2 sm:px-2.5 h-full hover:bg-black/20 flex items-center justify-center font-bold text-xs sm:text-sm transition-colors disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="text-xs sm:text-sm font-black px-1.5 sm:px-2 tracking-tighter">{quantity.toString().padStart(2, '0')}</span>
                            <button 
                              onClick={() => {
                                const stock = item.stock ?? item.product?.stock ?? 9999;
                                const maxLimit = (item.maximumOrderQuantity || item.product?.maximumOrderQuantity) || stock;
                                const max = Math.min(stock, maxLimit);
                                if (quantity < max) {
                                  updateItem.mutate({ itemId: item.id, quantity: quantity + 1 });
                                } else {
                                  toast(`Only ${max} units available`, 'error');
                                }
                              }}
                              disabled={updateItem.isPending || syncCart.isPending}
                              className="px-2 sm:px-2.5 h-full hover:bg-black/20 flex items-center justify-center font-bold text-xs sm:text-sm transition-colors disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-6 pt-3 border-t border-gray-100">
              {/* Subtotal row */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[17px] font-semibold text-gray-400 uppercase tracking-widest">Subtotal</span>
                <span className="text-[28px] font-black text-gray-900">₹{Math.round(cart?.total ?? 0).toLocaleString('en-IN')}</span>
              </div>
              {items.length > 0 && (
                <p className="text-[15px] text-gray-400 mb-4">
                  {items.length} item{items.length > 1 ? 's' : ''} · Shipping calculated at checkout
                </p>
              )}

              {/* Primary: Go to Checkout */}
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    window.dispatchEvent(new CustomEvent('open-login'));
                    return;
                  }
                  onClose();
                  router.push('/checkout');
                }}
                disabled={items.length === 0}
                className="w-full bg-[#854cbc] hover:bg-[#6f3ea5] active:scale-[0.98] text-white rounded-2xl py-5 text-[19px] font-bold shadow-lg transition-all flex justify-center items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed mb-2"
              >
                <ShoppingCart className="w-6 h-6" />
                Order Now
              </button>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
