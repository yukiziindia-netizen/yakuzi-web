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
    title: "Dragon Ball / Goku action figurine - original edition...",
    price: 3345.53,
    originalPrice: 5000.00,
    discount: "25% off",
    rating: 4.5,
    quantity: 1,
    image: "https://api.dicebear.com/7.x/bottts/svg?seed=goku",
  },
  {
    id: 2,
    title: "Dragon Ball / Goku action figurine - original edition...",
    price: 3345.53,
    originalPrice: 5000.00,
    discount: "25% off",
    rating: 4.8,
    quantity: 3,
    image: "https://api.dicebear.com/7.x/bottts/svg?seed=goku2",
  },
  {
    id: 3,
    title: "Dragon Ball / Goku action figurine - original edition...",
    price: 3345.53,
    originalPrice: 5000.00,
    discount: "25% off",
    rating: 4.5,
    quantity: 1,
    image: "https://api.dicebear.com/7.x/bottts/svg?seed=goku3",
  },
  {
    id: 4,
    title: "Dragon Ball / Goku action figurine - original edition...",
    price: 3345.53,
    originalPrice: 5000.00,
    discount: "25% off",
    rating: 4.8,
    quantity: 3,
    image: "https://api.dicebear.com/7.x/bottts/svg?seed=goku4",
  }
];

export function SidebarSheet({ view, onClose, onViewChange }: SidebarSheetProps) {
  const isOpen = view !== null;

  // Filter States
  const [priceRange, setPriceRange] = useState([500, 2500]);
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
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {isCart ? "Cart" : "Saved Items"}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Toggle Tab Bar */}
          <div className="flex bg-gray-100/50 p-1 rounded-xl">
            <button 
              onClick={() => onViewChange("cart")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isCart ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Cart
            </button>
            <button 
              onClick={() => onViewChange("wishlist")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isCart ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Saved Items
            </button>
          </div>
        </div>

        {/* Scrollable Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {MOCK_ITEMS.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="bg-white border border-gray-100 rounded-2xl p-3 flex gap-4 shadow-sm hover:shadow-md transition-shadow relative">
              {/* Product Image & Trash */}
              <div className="flex flex-col gap-2">
                <div className="w-20 h-20 bg-[#f8f5fd] rounded-xl flex items-center justify-center overflow-hidden">
                  <img src={item.image} alt="Product" className="w-16 h-16 object-contain mix-blend-multiply" />
                </div>
                <button className="w-20 py-1.5 flex items-center justify-center bg-orange-100 text-orange-500 hover:bg-orange-500 hover:text-white rounded-lg transition-colors group">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Info & Controls */}
              <div className="flex-1 flex flex-col pt-1">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-white bg-[#6342B4] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    YUKIZI CHOICE
                  </span>
                  
                  {/* Move Action Badge */}
                  <button className="flex items-center gap-1.5 text-[11px] font-bold text-[#6342B4] bg-[#6342B4]/10 px-2.5 py-1 rounded-md hover:bg-[#6342B4] hover:text-white transition-colors">
                    <span>{isCart ? "Move to Saved" : "Move to Cart"}</span>
                    {isCart ? <Bookmark className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
                  </button>
                </div>

                <h3 className="text-sm font-bold text-gray-800 leading-tight mb-2 pr-8 truncate w-full max-w-[200px]">
                  {item.title}
                </h3>

                <div className="mt-auto flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-gray-900">₹{item.price}</span>
                      <span className="text-xs font-bold text-gray-400 line-through">₹{item.originalPrice}</span>
                    </div>
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                      {item.discount}
                    </span>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-[#6342B4] text-[#6342B4]" />
                  <span className="text-xs font-bold text-gray-700">{item.rating}</span>
                </div>

                {/* Quantity Block */}
                <div className="absolute right-[-1px] top-1/2 -translate-y-1/2 flex flex-col items-center justify-between bg-[#6342B4] text-white rounded-l-xl py-2 px-1 h-[80px] shadow-lg">
                  <button className="text-white/70 hover:text-white pb-1"><ChevronUp className="w-4 h-4" /></button>
                  <span className="text-sm font-black tracking-tighter">{item.quantity.toString().padStart(2, "0")}</span>
                  <button className="text-white/70 hover:text-white pt-1"><ChevronDown className="w-4 h-4" /></button>
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
      <div className="flex flex-col h-full bg-white text-[#333] p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6 pt-4">
          <h2 className="text-[22px] font-bold">Filters</h2>
          <button onClick={onClose} className="text-gray-500 text-sm hover:text-gray-800 transition-colors">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide pb-24">
          {/* Price Range */}
          <div className="space-y-4">
            <button 
              onClick={() => toggleSection("price")}
              className="flex items-center justify-between w-full font-bold text-gray-900 text-[15px]"
            >
              Price
              {openSections.price ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            <AnimatePresence>
              {openSections.price && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-2 pt-4 pb-2">
                    {/* Mock Range Slider */}
                    <div className="relative w-full h-1.5 bg-gray-200 rounded-full">
                      <div className="absolute left-[20%] right-[20%] h-full bg-[#6342B4] rounded-full" />
                      <div className="absolute left-[20%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-[#6342B4] rounded-full border-2 border-white shadow-md cursor-pointer" />
                      <div className="absolute right-[20%] top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-[#6342B4] rounded-full border-2 border-white shadow-md cursor-pointer" />
                    </div>
                    <div className="flex justify-between mt-4 text-sm font-medium text-gray-500">
                      <span>$500</span>
                      <span>$2500</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-gray-100" />

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.newItems ? "bg-[#6342B4] border-[#6342B4]" : "border-gray-300 group-hover:border-[#6342B4]"}`}>
                {filters.newItems && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </div>
              <span className="text-gray-700 font-medium">New Items</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.bestSelling ? "bg-[#6342B4] border-[#6342B4]" : "border-gray-300 group-hover:border-[#6342B4]"}`}>
                {filters.bestSelling && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </div>
              <span className="text-gray-700 font-medium">Best Selling</span>
            </label>
          </div>

          <div className="border-t border-gray-100" />

          {/* Discount Accordion */}
          <div className="space-y-4">
            <button 
              onClick={() => toggleSection("discount")}
              className="flex items-center justify-between w-full font-bold text-gray-900 text-[15px]"
            >
              Discount
              {openSections.discount ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            <AnimatePresence>
              {openSections.discount && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pt-1">
                    {["<50+", "30-35", "50-90", ">50++"].map(opt => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border-[5px] transition-colors ${filters.discount === opt ? "border-[#6342B4] bg-white" : "border-gray-200 bg-white group-hover:border-[#6342B4]/50"}`} />
                        <span className="text-gray-600 font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-gray-100" />

          {/* Location Accordion */}
          <div className="space-y-4">
            <button 
              onClick={() => toggleSection("location")}
              className="flex items-center justify-between w-full font-bold text-gray-900 text-[15px]"
            >
              Location
              {openSections.location ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            <AnimatePresence>
              {openSections.location && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pt-1">
                    {["All", "Monteria", "Marana", "Pownhon"].map(opt => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border-[5px] transition-colors ${filters.location === opt ? "border-[#6342B4] bg-white" : "border-gray-200 bg-white group-hover:border-[#6342B4]/50"}`} />
                        <span className="text-gray-600 font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-gray-100" />

          {/* Discount Type Accordion */}
          <div className="space-y-4">
            <button 
              onClick={() => toggleSection("discountType")}
              className="flex items-center justify-between w-full font-bold text-gray-900 text-[15px]"
            >
              Discount Type
              {openSections.discountType ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            <AnimatePresence>
              {openSections.discountType && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pt-1">
                    {["All", "Upclom", "Fuill"].map(opt => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border-[5px] transition-colors ${filters.discountType === opt ? "border-[#6342B4] bg-white" : "border-gray-200 bg-white group-hover:border-[#6342B4]/50"}`} />
                        <span className="text-gray-600 font-medium">{opt}</span>
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          
          <motion.div
            key="sidebar-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[400px] bg-white z-[101] shadow-2xl rounded-l-3xl flex flex-col overflow-hidden"
          >
            {view === "filters" ? renderFiltersView() : renderShoppingView()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
