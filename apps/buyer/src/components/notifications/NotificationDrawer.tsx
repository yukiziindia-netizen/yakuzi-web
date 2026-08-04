'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Trash2, Star, Eye, Plus } from 'lucide-react';
import { DeliveryTruckBadge } from '@/components/shared/DeliveryTruckBadge';
import { useScrollLock } from '@/hooks/useScrollLock';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'promo', text: '20% off on Dragon Ball Z products.\nUse promo code 6256' },
  { id: 2, type: 'promo', text: '20% off on Dragon Ball Z products.\nUse promo code 6256' },
  { id: 3, type: 'promo', text: '20% off on Dragon Ball Z products.\nUse promo code 6256' },
  {
    id: 4,
    type: 'product',
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=goku',
    title: 'Dragon Ball / Goku action figurine - original edition...',
    price: 3345.53,
    originalPrice: 5000.00,
    
    rating: 4.5,
  },
  { id: 5, type: 'promo', text: '20% off on Dragon Ball Z products.\nUse promo code 6256' },
];

const MOCK_NOTIFY_ME = [
  {
    id: 1,
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=goku',
    title: 'Dragon Ball / Goku action figurine - original edition...',
    price: 3345.53,
    originalPrice: 5000.00,
    
    rating: 4.5,
    timer: '1:20:35',
    isYukiziChoice: true,
  },
  {
    id: 2,
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=goku2',
    title: 'Dragon Ball / Goku action figurine - original edition...',
    price: 3345.53,
    originalPrice: 5000.00,
    
    rating: 4.5,
    timer: '7:25:52',
    isYukiziChoice: false,
  },
  {
    id: 3,
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=goku3',
    title: 'Dragon Ball / Goku action figurine - original edition...',
    price: 3345.53,
    originalPrice: 5000.00,
    
    rating: 4.5,
    timer: '7 Days',
    isYukiziChoice: false,
  },
];

import { useNotifications, useDeleteNotification } from '@/hooks/useNotifications';
import { useWaitlist, useRemoveFromWaitlist } from '@/hooks/useProducts';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { generateProductSlug } from '@yukizi/utils';

export default function NotificationDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useScrollLock(isOpen);

  const { data: notificationsData, isLoading: isNotificationsLoading } = useNotifications();
  const { data: waitlistData, isLoading: isWaitlistLoading } = useWaitlist();
  const { mutate: deleteNotification } = useDeleteNotification();
  const { mutate: removeFromWaitlist } = useRemoveFromWaitlist();

  const notifications = notificationsData?.data ?? [];
  const waitlistItems = waitlistData ?? [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="notification-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100]"
          />

          {/* Drawer Panel */}
          <motion.div
            key="notification-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-[92%] sm:w-[500px] md:w-[520px] max-w-full bg-white shadow-2xl z-[110] flex flex-col overflow-hidden rounded-l-3xl"
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

            {/* Section 1: Notification */}
            <div className="flex-1 flex flex-col min-h-0 pt-8 px-6">
              <h2 className="text-[22px] font-bold text-gray-800 mb-4">Notification</h2>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-3 pb-4">
                {isNotificationsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm font-medium">No new notifications</div>
                ) : notifications.map((item: any) => {
                  if (item.type !== 'PRODUCT_ALERT') {
                    return (() => {
                      // Split message into two lines: first line light, second line bold
                      const rawText = item.message || item.title || '';
                      const lines = rawText.split('\n');
                      const firstLine = lines[0] || '';
                      const secondLine = lines.slice(1).join(' ');

                      return (
                        <div key={`notif-${item.id}`} className="bg-white rounded-2xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.10)] border border-gray-100/80 px-5 py-4 relative pr-10">
                          <p className="text-[13.5px] text-gray-400 font-normal leading-snug mb-0.5">
                            {firstLine}
                          </p>
                          {secondLine && (
                            <p className="text-[14px] font-bold text-gray-600 leading-snug">
                              {secondLine}
                            </p>
                          )}
                          <button
                            onClick={() => deleteNotification(item.id)}
                            className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-300 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })();
                  }

                  const product = item.metadata?.product;
                  if (!product) return null;

                  return (
                    <div key={`notif-${item.id}`} className="bg-white rounded-[14px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 p-3 flex gap-3 relative group">
                      {/* Left Image */}
                      <div className="w-[72px] h-[72px] bg-[#f8f5fd] rounded-xl flex items-center justify-center relative flex-shrink-0 overflow-hidden">
                        <img src={product.image || (product.images && product.images[0])} alt="Product" className="w-12 h-12 object-contain mix-blend-multiply" />
                        <button 
                          onClick={() => deleteNotification(item.id)}
                          className="absolute bottom-0 left-0 bg-[#f7941d] text-white p-1 rounded-tr-lg hover:bg-orange-500 transition-colors"
                        >
                          <Trash2 className="w-[14px] h-[14px]" />
                        </button>
                      </div>

                      {/* Right Content */}
                      <div className="flex-1 min-w-0 pr-8">
                        <h3 className="text-[11px] font-bold text-gray-800 leading-snug truncate mb-1.5">{item.message}</h3>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[13px] font-black text-gray-900">₹{product.price || product.mrp}</span>
                        </div>
                        <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          Back in Stock!
                        </span>
                        
                        {/* Top Right Action */}
                        <div className="absolute top-2 right-2 flex flex-col items-center gap-1">
                          <Link href={`/products/${generateProductSlug(product.name, product.id)}`}>
                             <button className="text-gray-400 hover:text-gray-600" title="Quick view">
                               <Eye className="w-5 h-5" />
                             </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 my-2" />

            {/* Section 2: Notify me */}
            <div className="flex-1 flex flex-col min-h-0 px-6 pb-6 pt-2">
              <h2 className="text-[22px] font-bold text-gray-800 mb-4">Notify me</h2>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-3">
                {isWaitlistLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : waitlistItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm font-medium">Your waitlist is empty</div>
                ) : waitlistItems.map((item: any) => {
                  const product = item.catalogProduct;
                  if (!product) return null;
                  
                  const productImage = (product.images && product.images[0]?.url) || (product.image) || 'https://placehold.co/400x400/854cbc/ffffff';
                  const productPrice = product.price || product.mrp;
                  const productMrp = product.mrp || product.originalPrice;
                  const hasDiscount = productMrp && productPrice && productMrp > productPrice;
                  const discountPct = hasDiscount ? Math.round(((productMrp - productPrice) / productMrp) * 100) : null;

                  return (
                  <div key={`notify-${item.id}`} className="bg-white rounded-2xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.10)] border border-gray-100/80 p-3 flex gap-3 relative overflow-hidden">

                    {/* Left: Image block */}
                    <div className="w-[80px] h-[80px] bg-gray-100 rounded-xl flex items-center justify-center relative flex-shrink-0 overflow-hidden">
                      <img
                        src={productImage}
                        alt={product.name}
                        className="w-[68px] h-[68px] object-contain mix-blend-multiply"
                      />
                      {/* Orange trash button at bottom-left of image */}
                      <button
                        onClick={() => removeFromWaitlist(product.id)}
                        className="absolute bottom-0 left-0 bg-[#f7941d] text-white p-1.5 rounded-tr-xl hover:bg-orange-500 active:scale-90 transition-all z-10"
                      >
                        <Trash2 className="w-[13px] h-[13px]" />
                      </button>
                    </div>

                    {/* Center: Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">


                      {/* Product name */}
                      <p className="text-[12px] text-gray-400 font-normal leading-snug truncate">{product.name}</p>

                      {/* Price row */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-[16px] font-extrabold text-gray-800 leading-none">
                          {productPrice ? `₹${Math.round(Number(productPrice)).toLocaleString('en-IN')}` : 'N/A'}
                        </span>
                        {hasDiscount && (
                          <span className="text-[11px] text-gray-400 line-through leading-none">
                            ₹{productMrp}
                          </span>
                        )}
                      </div>

                      {/* Discount tag */}
                      {discountPct && (
                        <p className="text-[12px] font-bold text-gray-700">{discountPct}% off</p>
                      )}
                    </div>

                    {/* Right: Actions column */}
                    <div className="flex flex-col items-center justify-between py-1 flex-shrink-0 gap-1">
                      {/* Red bell — filled */}
                      <button className="text-red-500 cursor-default" title="Waitlisted">
                        <Bell className="w-[22px] h-[22px] fill-red-500" />
                      </button>

                      {/* Grey circular navigate button */}
                      <Link href={`/products/${generateProductSlug(product.name, product.id)}`}>
                        <button className="flex items-center justify-center hover:scale-110 transition-transform text-gray-400 hover:text-gray-600" title="Quick view">
                          <Eye className="w-5 h-5" />
                        </button>
                      </Link>

                      {/* Star + rating */}
                      <div className="flex items-center gap-0.5">
                        <Star className="w-[13px] h-[13px] fill-[#854cbc] text-[#854cbc]" />
                        <span className="text-[12px] font-bold text-gray-700">{product.rating || '4.5'}</span>
                      </div>

                      {/* Delivery badge */}
                      <DeliveryTruckBadge text="3 days" className="w-[60px] text-[#9a9a9a] scale-90" />
                    </div>

                  </div>
                )})}
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
