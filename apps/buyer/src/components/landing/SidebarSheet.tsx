"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Trash2, Bookmark, ShoppingCart, Star, 
  ChevronDown, ChevronUp, Check
} from "lucide-react";

export type SidebarView = "cart" | "wishlist" | "filters" | null;

interface SidebarSheetProps {
  view: SidebarView;
  onClose: () => void;
  onViewChange: (view: SidebarView) => void;
}

// Mock Data
const MOCK_ITEMS = [
  {
    id: 1,
    title: "Dragon Ball / Goku action figurine...",
    price: 3345.53,
    originalPrice: 3800.25,
    discount: "26% off",
    rating: 4.5,
    quantity: null,
    isYukiziChoice: true,
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&q=80",
  },
  {
    id: 2,
    title: "Dragon Ball / Goku action figurine...",
    price: 3345.53,
    originalPrice: 3800.25,
    discount: "26% off",
    rating: 4.5,
    quantity: 1,
    isYukiziChoice: false,
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&q=80",
  },
  {
    id: 3,
    title: "Dragon Ball / Goku action figurine...",
    price: 3345.53,
    originalPrice: 3800.25,
    discount: "26% off",
    rating: 4.5,
    quantity: 3,
    isYukiziChoice: false,
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&q=80",
  },
  {
    id: 4,
    title: "Dragon Ball / Goku action figurine...",
    price: 3345.53,
    originalPrice: 3800.25,
    discount: "26% off",
    rating: 4.5,
    quantity: 2,
    isYukiziChoice: true,
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&q=80",
  },
  {
    id: 5,
    title: "Dragon Ball / Goku action figurine...",
    price: 3345.53,
    originalPrice: 3800.25,
    discount: "26% off",
    rating: 4.5,
    quantity: 5,
    isYukiziChoice: false,
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&q=80",
  },
  {
    id: 6,
    title: "Dragon Ball / Goku action figurine...",
    price: 3345.53,
    originalPrice: 3800.25,
    discount: "26% off",
    rating: 4.5,
    quantity: 1,
    isYukiziChoice: false,
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&q=80",
  }
];

export function SidebarSheet({ view, onClose, onViewChange }: SidebarSheetProps) {
  const isOpen = view !== null;

  // Filter States
  const [filters, setFilters] = useState({
    newItems: true,
    bestSelling: false,
    discount: "<50+",
    location: "All",
    discountType: "All",
  });

  // Accordion States
  const [openSections, setOpenSections] = useState({
    price: true,
    discount: true,
    location: true,
    discountType: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderShoppingView = () => {
    const isCart = view === "cart";

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="p-6 pt-10 pb-4">
          <h2 className="text-[22px] font-bold text-gray-800">
            {isCart ? "My Cart" : "Saved"}
          </h2>
        </div>

        {/* Scrollable Items */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4 scrollbar-hide pb-24 relative">
          {/* Subtle purple shadow glow effect on the left container side */}
          <div className="absolute top-0 bottom-0 left-2 w-[20px] bg-[#854cbc]/10 blur-xl pointer-events-none" />

          {MOCK_ITEMS.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="bg-white rounded-[12px] border border-[#e2cbf5] p-2 flex gap-3 shadow-sm hover:shadow-md transition-shadow relative">
              {item.isYukiziChoice && (
                <div className="absolute top-0 left-2 px-2 py-[2px] rounded-b-md text-[8px] font-bold bg-[#854cbc] text-white z-20 pointer-events-none">
                  Yukizi Choice
                </div>
              )}
              
              {/* Left Image & Trash */}
              <div className="w-[85px] h-[85px] bg-[#f2f2f2] rounded-lg overflow-hidden relative flex-shrink-0 mt-1">
                <img src={item.image} alt="Product" className="w-full h-full object-cover mix-blend-multiply" />
                <button className="absolute bottom-1 left-1 w-7 h-7 flex items-center justify-center bg-orange-400 text-white rounded-[6px] hover:bg-orange-500 transition-colors shadow-sm">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Middle Info */}
              <div className="flex-1 flex flex-col justify-center min-w-0 pr-10">
                {isCart && (
                  <button className="flex items-center gap-1 bg-[#562996] text-white px-2 py-0.5 rounded text-[9px] font-bold w-fit mb-1 shadow-sm mt-1">
                    Wishlist <Bookmark className="w-2.5 h-2.5" />
                  </button>
                )}
                <h3 className="text-[11px] font-medium text-gray-600 truncate mb-0.5 mt-1">
                  {item.title}
                </h3>
                <div className="flex items-end gap-1.5 leading-none mb-1">
                  <span className="text-[15px] font-medium text-gray-800">₹{item.price}</span>
                  <span className="text-[9px] text-gray-400 line-through pb-0.5">₹{item.originalPrice}</span>
                </div>
                <span className="text-[9px] font-bold text-gray-800">
                  {item.discount}
                </span>
              </div>

              {/* Right Column Icons */}
              <div className="absolute right-2 top-2 bottom-2 flex flex-col items-end justify-between">
                <div className="flex flex-col items-end gap-1.5 mt-1">
                   {/* In Cart, we don't have the save icon image, we have quantity at top */}
                   {!isCart && (
                     <img src="/save icon.jpg" alt="save" className="w-[18px] h-[18px] object-contain mix-blend-multiply cursor-pointer" />
                   )}
                   
                   <div className="flex items-center gap-1.5">
                     {/* Share/Network abstract icon */}
                     <img src="/whislist icon.jpg" alt="network" className="w-[18px] h-[18px] object-contain cursor-pointer opacity-80" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                     
                     {/* Quantity pill */}
                     {item.quantity !== null && (
                       <div className="flex items-center bg-[#562996] text-white rounded-md overflow-hidden h-5 shadow-sm">
                          <button className="px-1.5 h-full flex items-center justify-center hover:bg-white/20 transition-colors text-[10px]">-</button>
                          <span className="text-[10px] font-bold px-0.5 tracking-tighter">{String(item.quantity).padStart(2, '0')}</span>
                          <button className="px-1.5 h-full flex items-center justify-center hover:bg-white/20 transition-colors text-[10px]">+</button>
                       </div>
                     )}
                   </div>
                </div>

                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-[#854cbc] text-[#854cbc]" />
                    <span className="text-[11px] font-bold text-gray-700">{item.rating}</span>
                  </div>
                  <div className="flex items-center gap-0.5 bg-gray-100 rounded px-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-600">
                       <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/>
                       <path d="M14 9h4l4 4v5c0 .6-.4 1-1 1h-2"/>
                       <circle cx="7" cy="18" r="2"/>
                       <circle cx="17" cy="18" r="2"/>
                    </svg>
                    <span className="text-[8px] font-bold text-gray-600">3 days</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFiltersView = () => {
    return (
      <div className="flex flex-col h-full bg-white text-[#333] p-6 pr-8">
        <div className="mb-6 pt-2">
          <h2 className="text-lg font-bold">Filters</h2>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 pr-4">
          {/* Price Range */}
          <div className="space-y-4 mb-6">
            <button 
              onClick={() => toggleSection("price")}
              className="flex items-center justify-between w-full font-bold text-gray-800 text-[13px]"
            >
              Price
              {openSections.price ? <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={3} /> : <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={3} />}
            </button>
            <AnimatePresence>
              {openSections.price && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-1 pt-3 pb-2">
                    {/* Mock Range Slider */}
                    <div className="relative w-full h-1 bg-gray-200 rounded-full flex items-center">
                      <div className="absolute left-0 right-0 h-full bg-[#854cbc] rounded-full" />
                      <div className="absolute left-0 w-3 h-3 bg-[#854cbc] rounded-full -translate-x-1/2 cursor-pointer" />
                      <div className="absolute right-0 w-3 h-3 bg-[#854cbc] rounded-full translate-x-1/2 cursor-pointer" />
                    </div>
                    <div className="flex justify-between mt-2 text-[12px] text-gray-500">
                      <span>$500</span>
                      <span>$2500</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-gray-200 mb-4" />

          {/* Checkboxes */}
          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                 <path d="M4 14v6h6M20 10V4h-6M4 10V4h6M20 14v6h-6" />
                 <rect x="4" y="4" width="4" height="4" fill="currentColor"/>
                 <rect x="16" y="16" width="4" height="4" fill="currentColor"/>
              </svg>
              <span className="text-gray-700 text-[13px]">New Items</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="w-3.5 h-3.5 rounded-[3px] border border-gray-300 flex items-center justify-center bg-white" />
              <span className="text-gray-700 text-[13px]">Best Selling</span>
            </label>
          </div>

          <div className="border-t border-gray-200 mb-4" />

          {/* Discount Accordion */}
          <div className="space-y-4 mb-6">
            <button 
              onClick={() => toggleSection("discount")}
              className="flex items-center justify-between w-full font-bold text-gray-800 text-[13px]"
            >
              Discount
              {openSections.discount ? <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={3} /> : <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={3} />}
            </button>
            <AnimatePresence>
              {openSections.discount && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2.5 pt-1">
                    {["<50+", "30-35", "50-90", ">50++"].map(opt => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer group" onClick={() => setFilters(f => ({...f, discount: opt}))}>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${filters.discount === opt ? "border-[#854cbc]" : "border-gray-200 group-hover:border-[#854cbc]/50"}`}>
                           {filters.discount === opt && <div className="w-1.5 h-1.5 rounded-full bg-[#854cbc]" />}
                        </div>
                        <span className="text-[13px] text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-gray-200 mb-4" />

          {/* Location Accordion */}
          <div className="space-y-4 mb-6">
            <button 
              onClick={() => toggleSection("location")}
              className="flex items-center justify-between w-full font-bold text-gray-800 text-[13px]"
            >
              Location
              {openSections.location ? <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={3} /> : <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={3} />}
            </button>
            <AnimatePresence>
              {openSections.location && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2.5 pt-1">
                    {["All", "Monteria", "Marana", "Pownhon"].map(opt => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer group" onClick={() => setFilters(f => ({...f, location: opt}))}>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${filters.location === opt ? "border-[#854cbc]" : "border-gray-200 group-hover:border-[#854cbc]/50"}`}>
                           {filters.location === opt && <div className="w-1.5 h-1.5 rounded-full bg-[#854cbc]" />}
                        </div>
                        <span className="text-[13px] text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-gray-200 mb-4" />

          {/* Discount Type Accordion */}
          <div className="space-y-4">
            <button 
              onClick={() => toggleSection("discountType")}
              className="flex items-center justify-between w-full font-bold text-gray-800 text-[13px]"
            >
              Discount Type
              {openSections.discountType ? <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={3} /> : <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={3} />}
            </button>
            <AnimatePresence>
              {openSections.discountType && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2.5 pt-1">
                    {["All", "Upclom", "Fuill"].map(opt => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer group" onClick={() => setFilters(f => ({...f, discountType: opt}))}>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${filters.discountType === opt ? "border-[#854cbc]" : "border-gray-200 group-hover:border-[#854cbc]/50"}`}>
                           {filters.discountType === opt && <div className="w-1.5 h-1.5 rounded-full bg-[#854cbc]" />}
                        </div>
                        <span className="text-[13px] text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          
          <motion.div
            key="sidebar-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[400px] bg-white z-50 shadow-2xl rounded-l-3xl flex flex-col overflow-hidden"
          >
            {view === "filters" ? renderFiltersView() : renderShoppingView()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
