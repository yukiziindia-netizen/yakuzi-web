'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Trash2, Star, Eye, Plus } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useIsDesktop } from '@/hooks/useIsDesktop';

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
import { renderBuyerOfferBadge } from '@/components/landing/ProductCarousel';

const formatRelativeTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs)) return '';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
};

export default function NotificationDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useScrollLock(isOpen);
  const isDesktop = useIsDesktop();

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
            className="fixed inset-0 bg-black/50 z-[85]"
          />

          {/* Drawer Panel. z-[86] deliberately sits below the floating nav
              bar's z-[90] (same trick the Menu drawer uses) so the bar stays
              visible/usable over it, rather than carving a gap out of the
              panel itself. */}
          <motion.div
            key="notification-panel"
            initial={isDesktop ? { x: '100%' } : { y: '100%' }}
            animate={isDesktop ? { x: 0 } : { y: 0 }}
            exit={isDesktop ? { x: '100%' } : { y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
 className="fixed inset-0 lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[500px] lg:max-w-[90vw] glass-overlay z-[86] flex flex-col overflow-hidden lg:rounded-l-3xl"
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
                          <Link href={`/products/${generateProductSlug(product.name, product.id, product.slug)}`}>
                             <button className="text-gray-400 hover:text-gray-600" title="Quick view">
                               <Eye className="w-4 h-4" />
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
                ) : waitlistItems.map((item: any, idx: number) => {
                  const product = item.catalogProduct;
                  if (!product) return null;
                  
                  const productImage = (product.images && product.images[0]?.url) || (product.image) || 'https://placehold.co/400x400/854cbc/ffffff';
                  const productPrice = product.price || product.mrp;
                  const productMrp = product.mrp || product.originalPrice;
                  const hasDiscount = productMrp && productPrice && productMrp > productPrice;
                  const discountPct = hasDiscount ? Math.round(((productMrp - productPrice) / productMrp) * 100) : null;
                  
                  const isYukiziChoice = product.isYukiziChoice !== undefined ? product.isYukiziChoice : (item.isYukiziChoice !== undefined ? item.isYukiziChoice : (idx === 0));
                  const timerText = item.createdAt ? formatRelativeTime(item.createdAt) : (idx === 0 ? '1:10:24' : idx === 1 ? '1:52:10' : '7 Days');

                  return (
                    <div
                      key={`notify-${item.id}`}
                      className={`bg-white rounded-2xl p-3.5 flex gap-4 relative border ${
                        isYukiziChoice
                          ? 'border-[#7B2FBE]/40 shadow-[0_2px_12px_rgba(123,47,190,0.12)]'
                          : 'border-gray-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.10)]'
                      } overflow-visible mt-3`}
                    >
                      {/* Yukizi Choice Badge */}
                      {isYukiziChoice && (
                        <div className="absolute -top-[9.5px] left-3.5 bg-[#7B2FBE] text-white px-2.5 py-0.5 rounded-full font-bold text-[9px] z-20 shadow-sm uppercase tracking-wider scale-[0.95]">
                          Yukizi Choice
                        </div>
                      )}

                      {/* Left: Image block with Trash can overlay (scaled up) */}
                      <div className="w-[96px] h-[115px] bg-[#f8f6fc] border border-gray-50 rounded-xl flex items-center justify-center relative flex-shrink-0 overflow-hidden">
                        <img
                          src={productImage}
                          alt={product.name}
                          className="max-w-[80px] max-h-[90px] object-contain mix-blend-multiply"
                        />
                        <button
                          onClick={() => removeFromWaitlist(product.id)}
                          className="absolute bottom-0 left-0 bg-[#f7941d] hover:bg-orange-500 text-white p-1.5 rounded-tr-xl active:scale-90 transition-all z-10"
                          title="Delete waitlist item"
                        >
                          <Trash2 className="w-[13px] h-[13px]" />
                        </button>
                      </div>

                      {/* Right: Content details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 gap-1.5">
                        {/* Row 1: Timer Badge & Bell Icon */}
                        <div className="flex items-center justify-between w-full">
                          {timerText ? (
                            <span className="px-2.5 py-0.5 border border-gray-200 text-gray-400 rounded-full text-[9.5px] font-medium leading-none">
                              {timerText}
                            </span>
                          ) : (
                            <div />
                          )}
                          <button
                            onClick={() => removeFromWaitlist(product.id)}
                            className="text-[#eb4335] hover:text-red-600 transition-colors shrink-0"
                            title="Stop notification"
                          >
                            <Bell className="w-5 h-5 fill-[#eb4335]" />
                          </button>
                        </div>

                        {/* Row 2: Title & Eye Icon */}
                        <div className="flex items-start justify-between w-full gap-1.5">
                          <Link href={`/products/${generateProductSlug(product.name, product.id, product.slug)}`} className="flex-1 min-w-0 text-left">
                            <h4 className="text-[12px] font-medium text-gray-500 leading-snug truncate hover:text-[#7B2FBE] transition-colors">
                              {product.name}
                            </h4>
                          </Link>
                          <Link href={`/products/${generateProductSlug(product.name, product.id, product.slug)}`} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>

                        {/* Row 3: Price & Rating */}
                        <div className="flex items-baseline justify-between w-full pt-0.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[14px] font-bold text-gray-800 leading-none">
                              {productPrice ? `₹${Math.round(Number(productPrice))}` : 'N/A'}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] text-gray-400 line-through leading-none font-medium">
                                ₹{Math.round(Number(productMrp))}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Star className="w-3.5 h-3.5 text-[#f5a623] fill-[#f5a623]" />
                            <span className="text-[12px] font-bold text-gray-700 leading-none">
                              {product.rating || '4.5'}
                            </span>
                          </div>
                        </div>

                        {/* Row 4: Backend Offers / Discount Tag */}
                        <div className="flex items-center w-full pt-1.5 border-t border-gray-100/80">
                          <div className="text-[11px] sm:text-[12px] font-semibold text-gray-500">
                            {renderBuyerOfferBadge(product)}
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
