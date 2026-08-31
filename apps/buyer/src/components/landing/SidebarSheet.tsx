"use client";

import React from "react";
import Link from 'next/link';
import Image from 'next/image';
import { DeliveryTruckBadge } from '../shared/DeliveryTruckBadge';
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Trash2, ShoppingCart, Star,
  ShoppingBag, Loader2
} from "lucide-react";
import WishlistIcon from "@/components/shared/WishlistIcon";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/hooks/useCart";
import { useToast } from "@/components/shared/Toast";
import { useIsDesktop } from "@/hooks/useIsDesktop";

// "filters" was removed: page-aware filters now live in
// components/filters/FilterPanel.tsx, driven by lib/filters/registry.ts.
export type SidebarView = "cart" | "wishlist" | null;

interface SidebarSheetProps {
  view: SidebarView;
  onClose: () => void;
  onViewChange: (view: SidebarView) => void;
}



export function SidebarSheet({ view, onClose, onViewChange }: SidebarSheetProps) {
  const isOpen = view !== null;
  const isDesktop = useIsDesktop();

  const { data: cart, isLoading, isError } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const { toast } = useToast();

  const renderShoppingView = () => {
    const isCart = view === "cart";
    
    // For now we only hook up cart items dynamically
    const displayItems = isCart ? (cart?.items ?? []) : [];
    
    if (isCart && isLoading) {
      return (
        <div className="flex flex-col h-full bg-white items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        </div>
      );
    }
    
    if (isCart && displayItems.length === 0) {
      return (
        <div className="flex flex-col h-full bg-white p-6 pt-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-20">My Cart</h2>
          <div className="flex flex-col items-center justify-center flex-1 opacity-50 pb-20">
            <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-sm font-medium text-gray-400">Your cart is empty</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="p-6 pt-10 pb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {isCart ? "My Cart" : "Saved"}
          </h2>
        </div>

        {/* Scrollable Items */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4 scrollbar-hide pb-24 relative">
          {/* Subtle purple shadow glow effect on the left container side */}
          <div className="absolute top-0 bottom-0 left-2 w-[20px] bg-[#854cbc]/10 blur-xl pointer-events-none" />

          {displayItems.map((item: any, idx: number) => {
            const title = isCart ? (item.product?.name ?? item.productName ?? item.name ?? "Product") : item.title;
            const rawPrice = isCart ? (item.product?.price ?? item.price) : item.price;
            const rawOriginalPrice = isCart ? (item.product?.originalPrice ?? item.product?.mrp ?? item.originalPrice ?? item.mrp) : (item.originalPrice ?? item.mrp);
            const price = rawPrice != null ? rawPrice : 0;
            const originalPrice = rawOriginalPrice != null ? rawOriginalPrice : 0;
            const isNotAvailable = item.product?.sellerCount === 0 || item.product?.sellerOffers?.length === 0 || rawPrice == null;

            const fallbackPrice = item.product?.price || item.product?.mrp || item.product?.originalPrice || item.price || item.mrp || 0;
            const fallbackOriginalPrice = (item.product?.price && item.product?.mrp && Number(item.product.mrp) > Number(item.product.price)) ? item.product.mrp : 0;
            
            const hasVariantPrice = !isNotAvailable && price > 0;
            const finalPrice = hasVariantPrice ? price : fallbackPrice;
            const finalOriginalPrice = hasVariantPrice ? originalPrice : fallbackOriginalPrice;
            
            const displayPriceText = finalPrice > 0 ? `₹${Math.round(Number(finalPrice)).toLocaleString('en-IN')}` : 'N/A';
            const displayOriginalPriceText = (finalOriginalPrice > 0 && Number(finalOriginalPrice) > Number(finalPrice)) ? `₹${Math.round(Number(finalOriginalPrice)).toLocaleString('en-IN')}` : '';
            const discount = item.discount;
            const rating = item.rating;
            const quantity = isCart ? (item.quantity ?? 1) : item.quantity;
            const isYukiziChoice = isCart ? (item.isYukiziChoice ?? (idx % 3 === 0)) : item.isYukiziChoice;
            const imageRaw = isCart ? (item.product?.images?.[0] || item.imageUrl || item.image) : item.image;
            const titleWords = title.trim().split(' ').filter(Boolean);
            const initials = titleWords.length === 1 
              ? title.trim().substring(0,2).toUpperCase() 
              : (titleWords[0][0] + titleWords[titleWords.length - 1][0]).toUpperCase();
            const image = (!imageRaw || imageRaw === '/products/pharma_bottle.png')
              ? `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent(initials)}`
              : imageRaw;

            return (
            <div key={`${item.id}-${idx}`} className="bg-white rounded-[12px] border border-[#e2cbf5] p-2 flex gap-3 shadow-sm hover:shadow-md transition-shadow relative">
              {isYukiziChoice && (
                <div className="absolute top-0 left-2 px-2 py-[2px] rounded-b-md text-2xs font-bold bg-[#854cbc] text-white z-20 pointer-events-none">
                  Yukizi Choice
                </div>
              )}
              
              {/* Left Image & Trash */}
              <div className="w-[85px] h-[85px] bg-[#f2f2f2] rounded-lg overflow-hidden relative flex-shrink-0 mt-1">
                <img src={image} alt={title ?? 'Product'} loading="lazy" decoding="async" className="w-full h-full object-cover mix-blend-multiply" />
                {isCart && (
                  <button 
                    onClick={() => {
                      removeItem.mutate(item.id, {
                        onSuccess: () => toast('Item removed from bag', 'info'),
                      });
                    }}
                    disabled={removeItem.isPending}
                    className="absolute bottom-1 left-1 w-7 h-7 flex items-center justify-center bg-orange-400 text-white rounded-[6px] hover:bg-orange-500 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Middle Info */}
              <div className="flex-1 flex flex-col justify-center min-w-0 pr-10">
                {isCart && (
                  <button className="flex items-center gap-1 bg-[#562996] text-white px-2 py-0.5 rounded text-2xs font-bold w-fit mb-1 shadow-sm mt-1">
                    Wishlist <WishlistIcon className="w-2.5 h-2.5 text-white" />
                  </button>
                )}
                <h3 className="text-xs font-medium text-gray-600 truncate mb-0.5 mt-1">
                  {title}
                </h3>
                <div className="flex items-end gap-1.5 leading-none mb-1">
                  <span className="text-base font-medium text-gray-800">{displayPriceText}</span>
                  <span className="text-2xs text-gray-400 line-through pb-0.5">{displayOriginalPriceText}</span>
                </div>
                <span className="text-2xs font-bold text-gray-800">
                  {discount}
                </span>
              </div>

              {/* Right Column Icons */}
              <div className="absolute right-2 top-2 bottom-2 flex flex-col items-end justify-between">
                <div className="flex flex-col items-end gap-1.5 mt-1">
                   {/* In Cart, we don't have the save icon image, we have quantity at top */}
                   {!isCart && (
                     <img src="/save icon.jpg" alt="save" loading="lazy" decoding="async" className="w-[18px] h-[18px] object-contain mix-blend-multiply cursor-pointer" />
                   )}
                   
                   <div className="flex items-center gap-1.5">
                     {/* Share/Network abstract icon */}
                     <img src="/whislist icon.jpg" alt="network" loading="lazy" decoding="async" className="w-[18px] h-[18px] object-contain cursor-pointer opacity-80" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                     
                     {/* Quantity pill */}
                     {quantity !== null && (
                       <div className="flex items-center bg-[#562996] text-white rounded-md overflow-hidden h-5 shadow-sm">
                          <button 
                            onClick={() => {
                              if (quantity > 1) {
                                updateItem.mutate({ itemId: item.id, quantity: quantity - 1 });
                              }
                            }}
                            disabled={updateItem.isPending}
                            className="px-1.5 h-full flex items-center justify-center hover:bg-white/20 transition-colors text-2xs"
                          >-</button>
                          <span className="text-2xs font-bold px-0.5 tracking-tighter">{String(quantity).padStart(2, '0')}</span>
                          <button 
                            onClick={() => {
                              updateItem.mutate({ itemId: item.id, quantity: quantity + 1 });
                            }}
                            disabled={updateItem.isPending}
                            className="px-1.5 h-full flex items-center justify-center hover:bg-white/20 transition-colors text-2xs"
                          >+</button>
                       </div>
                     )}
                   </div>
                </div>

                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-[#854cbc] text-[#854cbc]" />
                    <span className="text-xs font-bold text-gray-700">{rating}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <DeliveryTruckBadge text="3 days" className="w-[75px] text-[#9a9a9a]" />
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Sits below the floating nav bar's z-[90] so the bar stays
              visible/usable over the full-screen sheet, same trick the
              search panel already uses. */}
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[85]"
          />

          {/* Mobile: full-screen sheet, opens bottom-up (matches the search
              panel's interaction model). Desktop (lg+): a fixed-width panel
              docked to the right edge, sliding in from the right instead -
              full-bleed reads wrong once there's a whole desktop viewport
              behind it. */}
          <motion.div
            key="sidebar-panel"
            initial={isDesktop ? { x: "100%" } : { y: "100%" }}
            animate={isDesktop ? { x: 0 } : { y: 0 }}
            exit={isDesktop ? { x: "100%" } : { y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[420px] lg:max-w-[90vw] bg-white z-[86] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Hidden Close Button */}
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-white/80 rounded-full z-[80] transition-colors">
              <X className="w-5 h-5" />
            </button>
            {renderShoppingView()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
