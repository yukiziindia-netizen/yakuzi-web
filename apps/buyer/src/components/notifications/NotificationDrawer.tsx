'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Trash2, Star, ArrowUpRight, Plus } from 'lucide-react';
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
    discount: '25% off',
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
    discount: '25% off',
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
    discount: '25% off',
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
    discount: '25% off',
    rating: 4.5,
    timer: '7 Days',
    isYukiziChoice: false,
  },
];

export default function NotificationDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useScrollLock(isOpen);

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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            key="notification-panel"
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

            {/* Section 1: Notification */}
            <div className="flex-1 flex flex-col min-h-0 pt-8 px-6">
              <h2 className="text-[22px] font-bold text-gray-800 mb-4">Notification</h2>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-3 pb-4">
                {MOCK_NOTIFICATIONS.map((item) => {
                  if (item.type === 'promo') {
                    return (
                      <div key={`notif-${item.id}`} className="bg-white rounded-[14px] shadow-[0_2px_15px_-4px_rgba(0,0,0,0.1)] border border-gray-100 p-4">
                        <p className="text-[#666] text-xs leading-relaxed font-bold">
                          {item.text}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div key={`notif-${item.id}`} className="bg-white rounded-[14px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 p-3 flex gap-3 relative group">
                      {/* Left Image */}
                      <div className="w-[72px] h-[72px] bg-[#f8f5fd] rounded-xl flex items-center justify-center relative flex-shrink-0 overflow-hidden">
                        <img src={item.image} alt="Product" className="w-12 h-12 object-contain mix-blend-multiply" />
                        <button className="absolute bottom-0 left-0 bg-[#f7941d] text-white p-1 rounded-tr-lg hover:bg-orange-500 transition-colors">
                          <Trash2 className="w-[14px] h-[14px]" />
                        </button>
                      </div>

                      {/* Right Content */}
                      <div className="flex-1 min-w-0 pr-8">
                        <h3 className="text-[11px] font-bold text-gray-800 leading-snug truncate mb-1.5">{item.title}</h3>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[13px] font-black text-gray-900">₹{item.price}</span>
                          <span className="text-[9px] font-bold text-gray-400 line-through">₹{item.originalPrice}</span>
                        </div>
                        <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {item.discount}
                        </span>
                        
                        {/* Rating */}
                        <div className="absolute right-3 bottom-3 flex flex-col items-center">
                          <div className="flex items-center gap-[2px]">
                            <Star className="w-3 h-3 fill-[#6342B4] text-[#6342B4]" />
                            <span className="text-[10px] font-bold text-gray-700">{item.rating}</span>
                          </div>
                          <span className="text-[7px] text-gray-400 font-bold bg-gray-100 px-1 rounded mt-0.5">2 days</span>
                        </div>

                        {/* Top Right Action */}
                        <div className="absolute top-2 right-2 flex flex-col items-center gap-1">
                          <button className="text-orange-400 hover:text-orange-500">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <ArrowUpRight className="w-4 h-4 bg-gray-100 rounded-full p-0.5" />
                          </button>
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
                {MOCK_NOTIFY_ME.map((item) => (
                  <div key={`notify-${item.id}`} className="bg-white rounded-[14px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 p-3 flex gap-3 relative overflow-hidden group">
                    {item.isYukiziChoice && (
                      <span className="absolute top-0 left-0 text-[7px] font-bold text-white bg-[#6342B4] px-1.5 py-0.5 rounded-br-lg z-10 uppercase tracking-wider">
                        YUKIZI CHOICE
                      </span>
                    )}

                    {/* Left Image */}
                    <div className="w-[72px] h-[72px] bg-[#f8f5fd] rounded-xl flex items-center justify-center relative flex-shrink-0 mt-3 overflow-hidden">
                      <img src={item.image} alt="Product" className="w-12 h-12 object-contain mix-blend-multiply" />
                      <button className="absolute bottom-0 left-0 bg-[#f7941d] text-white p-1 rounded-tr-lg hover:bg-orange-500 transition-colors z-10">
                        <Trash2 className="w-[14px] h-[14px]" />
                      </button>
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 min-w-0 pr-8 mt-1">
                      <div className="mb-2">
                         <span className="text-[9px] font-bold text-gray-600 bg-white shadow-sm border border-gray-100 px-2 py-0.5 rounded-md">
                           {item.timer}
                         </span>
                      </div>
                      <h3 className="text-[11px] font-bold text-gray-800 leading-snug truncate mb-1.5">{item.title}</h3>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[13px] font-black text-gray-900">₹{item.price}</span>
                        <span className="text-[9px] font-bold text-gray-400 line-through">₹{item.originalPrice}</span>
                      </div>
                      <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {item.discount}
                      </span>
                      
                      {/* Rating */}
                      <div className="absolute right-3 bottom-3 flex flex-col items-center">
                        <div className="flex items-center gap-[2px]">
                          <Star className="w-3 h-3 fill-[#6342B4] text-[#6342B4]" />
                          <span className="text-[10px] font-bold text-gray-700">{item.rating}</span>
                        </div>
                        <span className="text-[7px] text-gray-400 font-bold bg-gray-100 px-1 rounded mt-0.5">2 days</span>
                      </div>

                      {/* Top Right Actions */}
                      <div className="absolute top-3 right-3 flex flex-col items-center gap-1.5">
                        <button className="text-red-500 hover:scale-110 transition-transform">
                          <Bell className="w-4 h-4 fill-red-500" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 mt-1">
                          <ArrowUpRight className="w-4 h-4 bg-gray-100 rounded-full p-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
