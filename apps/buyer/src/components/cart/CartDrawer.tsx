'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Loader2, Star, ArrowUpRight, Bookmark, ShoppingBag } from 'lucide-react';
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            key="cart-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-[85%] max-w-[360px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
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
            <div className="pt-8 px-6 pb-2">
              <h2 className="text-[22px] font-bold text-gray-800">My Cart</h2>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-4 pt-2 space-y-3">
              {(isLoading || syncCart.isPending) && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                  <p className="text-sm font-medium text-gray-400">Loading bag...</p>
                </div>
              ) : isError && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p className="text-sm font-medium text-red-400">Failed to load bag</p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50 mt-10">
                  <ShoppingBag className="w-16 h-16 text-gray-300" />
                  <p className="text-sm font-medium text-gray-400">Your cart is empty</p>
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
                      className="bg-white rounded-[14px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 p-3 flex gap-3 relative overflow-hidden group"
                    >
                      {isYukiziChoice && (
                        <span className="absolute top-0 left-0 text-[7px] font-bold text-white bg-[#6342B4] px-1.5 py-0.5 rounded-br-lg z-10 uppercase tracking-wider">
                          YUKIZI CHOICE
                        </span>
                      )}

                      {/* Left Image */}
                      <div className="w-[72px] h-[72px] bg-[#f8f5fd] rounded-xl flex items-center justify-center relative flex-shrink-0 mt-3 overflow-hidden">
                        <img src={itemImage} alt={itemName} className="w-12 h-12 object-contain mix-blend-multiply" />
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            removeItem.mutate(item.id, {
                              onSuccess: () => toast('Item removed from bag', 'info'),
                            });
                          }}
                          disabled={removeItem.isPending || syncCart.isPending}
                          className="absolute bottom-0 left-0 bg-[#f7941d] text-white p-1 rounded-tr-lg hover:bg-orange-500 transition-colors z-10 disabled:opacity-50"
                        >
                          <Trash2 className="w-[14px] h-[14px]" />
                        </button>
                      </div>

                      {/* Right Content */}
                      <div className="flex-1 min-w-0 pr-1 mt-1 relative">
                        {/* Wishlist Button Badge */}
                        <div className="mb-1.5 inline-block">
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
                            className="flex items-center gap-1 bg-[#562996] text-white px-2 py-[3px] rounded hover:bg-[#432075] transition-colors shadow-sm"
                          >
                            <span className="text-[10px] font-bold tracking-wider">Wishlist1</span>
                            <Bookmark className="w-3 h-3 text-white" />
                          </button>
                        </div>

                        <h3 className="text-[11px] font-bold text-gray-800 leading-snug truncate pr-6">{itemName}</h3>
                        
                        <div className="flex items-center gap-1.5 mb-1 mt-0.5">
                          <span className="text-[13px] font-black text-gray-900">₹{(itemPrice * quantity).toLocaleString('en-IN')}</span>
                          <span className="text-[9px] font-bold text-gray-400 line-through">₹{(itemOriginalPrice * quantity).toLocaleString('en-IN')}</span>
                        </div>
                        
                        <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded inline-block">
                          {item.discount || '25% off'}
                        </span>
                        
                        {/* Rating */}
                        <div className="absolute right-1 bottom-1 flex flex-col items-end">
                          <div className="flex items-center gap-[2px]">
                            <Star className="w-3 h-3 fill-[#6342B4] text-[#6342B4]" />
                            <span className="text-[10px] font-bold text-gray-700">{item.rating || 4.5}</span>
                          </div>
                          <DeliveryTruckBadge text="2 days" className="w-[45px] mt-0.5 text-[#9a9a9a]" />
                        </div>

                        {/* Top Right Actions */}
                        <div className="absolute top-0 right-0 flex flex-col items-end gap-1">
                          {/* Quantity Pill */}
                          <div className="flex items-center bg-[#562996] rounded-full text-white overflow-hidden shadow-sm h-[18px]">
                            <button 
                              onClick={() => {
                                const moq = item.moq || item.product?.moq || item.product?.minimumOrderQuantity || 1;
                                updateItem.mutate({ itemId: item.id, quantity: Math.max(moq, quantity - 1) });
                              }}
                              disabled={updateItem.isPending || syncCart.isPending || quantity <= (item.moq || item.product?.moq || item.product?.minimumOrderQuantity || 1)}
                              className="px-1.5 h-full hover:bg-black/20 flex items-center justify-center font-bold text-[10px] transition-colors disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="text-[9px] font-black px-0.5 tracking-tighter">{quantity.toString().padStart(2, '0')}</span>
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
                              className="px-1.5 h-full hover:bg-black/20 flex items-center justify-center font-bold text-[10px] transition-colors disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                          
                          <button className="text-gray-400 hover:text-gray-600 mt-2 mr-1">
                            <ArrowUpRight className="w-4 h-4 bg-gray-100 rounded-full p-0.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-24 pt-4">
              <div className="flex items-center justify-between mb-4 border-t border-gray-100 pt-4">
                <span className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">Subtotal</span>
                <span className="text-xl font-black text-gray-900">₹{Math.round(cart?.total ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={syncCart.isPending || createOrder.isPending || items.length === 0}
                className="w-full bg-[#854cbc] hover:bg-[#733ea3] text-white rounded-xl py-3.5 text-[15px] font-bold shadow-md transition-all flex justify-center items-center disabled:opacity-50"
              >
                {(syncCart.isPending || createOrder.isPending) ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Order Now'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
