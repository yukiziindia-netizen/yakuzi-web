'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Loader2, Star, ArrowUpRight, Plus, ShoppingBag } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/components/shared/Toast';
import { useAddToCart } from '@/hooks/useCart';
import { useAuth } from '@pharmabag/api-client';
import { useRouter } from 'next/navigation';
import { useScrollLock } from '@/hooks/useScrollLock';

const MOCK_WISH_ITEMS = [
  {
    id: 'm1',
    name: 'Dragon Ball / Goku action figurine - original edition...',
    price: 3345.53,
    originalPrice: 5000.00,
    discount: '25% off',
    rating: 4.6,
    quantity: 0,
    isYukiziChoice: true,
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=goku',
  },
  {
    id: 'm2',
    name: 'Dragon Ball / Goku action figurine - original edition...',
    price: 3345.53,
    originalPrice: 5000.00,
    discount: '25% off',
    rating: 4.6,
    quantity: 1,
    isYukiziChoice: false,
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=goku2',
  },
  {
    id: 'm3',
    name: 'Dragon Ball / Goku action figurine - original edition...',
    price: 3345.53,
    originalPrice: 5000.00,
    discount: '25% off',
    rating: 4.6,
    quantity: 3,
    isYukiziChoice: false,
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=goku3',
  },
  {
    id: 'm4',
    name: 'Dragon Ball / Goku action figurine - original edition...',
    price: 3345.53,
    originalPrice: 5000.00,
    discount: '25% off',
    rating: 4.6,
    quantity: 2,
    isYukiziChoice: true,
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=goku4',
  },
  {
    id: 'm5',
    name: 'Dragon Ball / Goku action figurine - original edition...',
    price: 3345.53,
    originalPrice: 5000.00,
    discount: '25% off',
    rating: 4.6,
    quantity: 5,
    isYukiziChoice: false,
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=goku5',
  },
  {
    id: 'm6',
    name: 'Dragon Ball / Goku action figurine - original edition...',
    price: 3345.53,
    originalPrice: 5000.00,
    discount: '25% off',
    rating: 4.6,
    quantity: 1,
    isYukiziChoice: false,
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=goku6',
  },
];

export default function WishlistDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: wishlist, isLoading, isError } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart = useAddToCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useScrollLock(isOpen);

  const realItems = wishlist?.items ?? [];
  const items = realItems.length > 0 ? realItems : MOCK_WISH_ITEMS;

  const handleAddToCart = (item: any) => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('open-login'));
      return;
    }
    const cartItem = {
      productId: item.productId || item.product?.id || item.id,
      quantity: 1, // Or whatever quantity is selected
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            key="wishlist-panel"
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
              <h2 className="text-[22px] font-bold text-gray-800">Saved</h2>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-24 pt-2 space-y-3">
              {isLoading && realItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                  <p className="text-sm font-medium text-gray-400">Loading wishlist...</p>
                </div>
              ) : isError && realItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p className="text-sm font-medium text-red-400">Failed to load wishlist</p>
                </div>
              ) : (
                items.map((item: any, idx: number) => {
                  const itemName = item.product?.name ?? item.productName ?? item.name ?? 'Product';
                  const itemPrice = item.product?.price ?? item.price ?? 3345.53;
                  const itemOriginalPrice = item.product?.originalPrice ?? item.originalPrice ?? 5000.00;
                  const itemImage = item.product?.images?.[0] || item.imageUrl || item.image || '/product_placeholder.png';
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
                          onClick={() => removeFromWishlist.mutate(item.productId || item.product?.id || item.id, {
                            onSuccess: () => toast('Removed from saved items', 'info'),
                          })}
                          disabled={removeFromWishlist.isPending}
                          className="absolute bottom-0 left-0 bg-[#f7941d] text-white p-1 rounded-tr-lg hover:bg-orange-500 transition-colors z-10 disabled:opacity-50"
                        >
                          <Trash2 className="w-[14px] h-[14px]" />
                        </button>
                      </div>

                      {/* Right Content */}
                      <div className="flex-1 min-w-0 pr-8 mt-1">
                        <h3 className="text-[11px] font-bold text-gray-800 leading-snug truncate mb-1.5">{itemName}</h3>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[13px] font-black text-gray-900">₹{itemPrice.toLocaleString('en-IN')}</span>
                          <span className="text-[9px] font-bold text-gray-400 line-through">₹{itemOriginalPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {item.discount || '25% off'}
                        </span>
                        
                        {/* Rating */}
                        <div className="absolute right-3 bottom-3 flex flex-col items-center">
                          <div className="flex items-center gap-[2px]">
                            <Star className="w-3 h-3 fill-[#6342B4] text-[#6342B4]" />
                            <span className="text-[10px] font-bold text-gray-700">{item.rating || 4.6}</span>
                          </div>
                          <span className="text-[7px] text-gray-400 font-bold bg-gray-100 px-1 rounded mt-0.5">2 days</span>
                        </div>

                        {/* Top Right Actions */}
                        <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
                          {quantity > 0 ? (
                            <div className="flex items-center bg-[#562996] rounded-full text-white overflow-hidden shadow-sm h-5">
                               <button 
                                 onClick={() => handleAddToCart(item)}
                                 className="px-1.5 h-full hover:bg-black/20 flex items-center justify-center transition-colors"
                               >
                                 <ShoppingBag className="w-2.5 h-2.5" />
                               </button>
                               <div className="w-px h-full bg-white/20" />
                               <button className="px-1.5 h-full hover:bg-black/20 flex items-center justify-center font-bold text-[10px] transition-colors">-</button>
                               <span className="text-[9px] font-black px-0.5 tracking-tighter">{quantity.toString().padStart(2, '0')}</span>
                               <button className="px-1.5 h-full hover:bg-black/20 flex items-center justify-center font-bold text-[10px] transition-colors">+</button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleAddToCart(item)}
                              className="text-orange-400 hover:text-orange-500 mt-1 mr-1"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                          <button className="text-gray-400 hover:text-gray-600 mr-1">
                            <ArrowUpRight className="w-4 h-4 bg-gray-100 rounded-full p-0.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
