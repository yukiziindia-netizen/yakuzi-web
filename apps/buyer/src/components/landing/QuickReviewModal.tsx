import React, { useState } from 'react';
import { Share2, Star, Plus, Bell, Minus, X } from 'lucide-react';
import { DeliveryTruckBadge } from '@/components/shared/DeliveryTruckBadge';
import { ShareButton } from '@/components/shared/ShareButton';
import { useToast } from '@/components/shared/Toast';

interface QuickReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export default function QuickReviewModal({ isOpen, onClose, product }: QuickReviewModalProps) {
  const { toast } = useToast();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!isOpen || !product) return null;

  const productName = product.name || 'Product Name';
  const listings = product.listings || [];
  
  // Populate up to 4 comparison rows to match the mockup screenshot
  const baseListings = listings.length > 0 ? listings : [
    { id: 'l1', price: product.price || 3345.53, stock: 10, moq: 3, seller: { rating: 4.5 }, deliveryText: '3 days' }
  ];

  const comparisonListings = [...baseListings];
  if (comparisonListings.length < 4) {
    const diff = 4 - comparisonListings.length;
    for (let i = 0; i < diff; i++) {
      const mockPrices = [
        (product.price || 3345.53),
        (product.price || 3345.53) * 0.4,
        (product.price || 3345.53)
      ];
      // Row index 2 (mock-l-0 is Row 2, mock-l-1 is Row 3, mock-l-2 is Row 4)
      // Row 3 should be out of stock:
      const mockStock = i === 1 ? 0 : 5;
      comparisonListings.push({
        id: `mock-l-${i}`,
        price: parseFloat(mockPrices[i % mockPrices.length].toFixed(2)),
        stock: mockStock,
        moq: 3,
        seller: { rating: 4.5 },
        deliveryText: '3 days',
        isMock: true,
      });
    }
  }

  // Seed default quantities for Row 1 and Row 4 to match the screenshot
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const firstId = comparisonListings[0]?.id || 'l1';
    return {
      [firstId]: 2,
      'mock-l-2': 2
    };
  });

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleBookmarkToggle = () => {
    setIsBookmarked(!isBookmarked);
    toast(isBookmarked ? 'Removed from saved items' : 'Added to saved items!', 'success');
  };

  const getInitials = (name: string) => {
    if (!name) return 'PR';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const fallbackImage = `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent(getInitials(productName))}`;
  const productImages = product.images && product.images.length > 0
    ? product.images.map((img: any) => img.url || img)
    : [product.image || fallbackImage];

  const activeImage = productImages[activeImageIndex % productImages.length];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden relative shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-2 flex items-start justify-between w-full">
          <h2 className="text-[20px] font-black text-gray-800 tracking-tight leading-tight max-w-[85%]">
            {productName}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5">
          
          {/* Main Image Section (Halftone card) */}
          <div 
            className="relative w-full aspect-[4/3] rounded-[24px] bg-gradient-to-br from-[#854dff] via-[#b336e8] to-[#ff2b9a] border border-purple-400/20 shadow-md flex items-center justify-center p-6"
            style={{
              backgroundImage: `
                radial-gradient(rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px),
                linear-gradient(135deg, #854dff 0%, #b336e8 50%, #ff2b9a 100%)
              `,
              backgroundSize: '12px 12px, 100% 100%',
            }}
          >
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-pink-500/20 to-transparent skew-x-12 transform origin-bottom-right pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-pink-500/10 blur-2xl pointer-events-none" />

            {/* Share Button on Top Left Corner */}
            <div className="absolute -top-3.5 -left-3.5 z-30">
              <ShareButton 
                productName={productName}
                productId={product.id || 'p1'}
                productPrice={product.price || 3345.53}
                className="p-3 bg-white rounded-full border border-gray-300 shadow-md hover:bg-gray-50 text-gray-500 hover:text-purple-600 focus:outline-none hover:scale-105 transition-transform"
                iconClassName="w-[18px] h-[18px]"
              />
            </div>

            {/* Interactive Thumbnail Gallery overlay on the left */}
            <div className="absolute left-4 bottom-4 flex flex-col gap-2 z-20">
              {productImages.slice(0, 3).map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-11 h-11 rounded-lg overflow-hidden border-2 bg-white/15 backdrop-blur-sm shadow-sm transition-all duration-200 focus:outline-none ${
                    activeImageIndex === idx ? 'border-orange-500 scale-105 shadow-md' : 'border-white/30 hover:border-white/60'
                  }`}
                >
                  <img 
                    src={img} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                </button>
              ))}
            </div>

            {/* Main Product Image */}
            <div className="relative w-[80%] h-[80%] flex items-center justify-center">
              <img
                src={activeImage}
                alt={productName}
                className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-500 p-2"
              />
            </div>

            {/* Ribbon Bookmark flag on the right edge */}
            <button
              type="button"
              onClick={handleBookmarkToggle}
              className="absolute right-0 top-[45%] z-20 focus:outline-none transition-transform hover:scale-105"
            >
              <svg
                width="32"
                height="40"
                viewBox="0 0 32 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="overflow-visible drop-shadow-sm"
              >
                <path
                  d="M32 0 H0 L8 20 L0 40 H32 V0 Z"
                  fill={isBookmarked ? "#854cbc" : "#ffffff"}
                  stroke={isBookmarked ? "#854cbc" : "#9ca3af"}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Marketplace Offers Comparison List */}
          <div className="flex flex-col gap-3 w-full">
            {comparisonListings.map((listing: any, index: number) => {
              const listId = listing.id;
              const inStock = (listing.stock ?? 0) > 0 || listing.isMock;
              const itemQty = quantities[listId] || 0;
              const showAdd = itemQty === 0;
              
              const discountPercent = listing.isMock
                ? 1.99
                : (listing.discount || 25);

              return (
                <div 
                  key={listId} 
                  className="flex flex-row items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100/80 hover:border-purple-200 transition-colors gap-3 w-full"
                >
                  {/* Left: Discount Badge & Price */}
                  <div className="flex items-center gap-3.5 min-w-[155px]">
                    <div className="bg-[#854cbc] text-white px-2 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase leading-none min-w-[66px] text-center select-none">
                      {discountPercent}% off
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-black text-gray-800 leading-none">
                        ₹{listing.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] text-gray-400 font-bold mt-1.5 leading-none">
                        25% off on purchase of 3
                      </span>
                    </div>
                  </div>

                  {/* Middle: Star Rating & Delivery badge */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-[#854cbc] text-[#854cbc]" />
                      <span className="text-gray-800 font-black text-[12px] leading-none">{listing.seller?.rating || '4.5'}</span>
                    </div>

                    <DeliveryTruckBadge text={listing.deliveryText || '3 days'} className="w-[72px] h-auto text-gray-400" />
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3">
                    {inStock ? (
                      !showAdd ? (
                        <>
                          {/* Refresh offer */}
                          <button 
                            onClick={() => toast('Offer details refreshed!', 'success')}
                            className="p-1.5 rounded-full hover:bg-gray-200/50 text-gray-400 hover:text-purple-600 transition-colors focus:outline-none"
                          >
                            <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                            </svg>
                          </button>
                          
                          {/* Quantity Control Pill */}
                          <div className="flex items-center bg-[#48286b] rounded-full overflow-hidden h-8 w-24 text-white shadow-sm font-black text-[11px] select-none justify-between">
                            <button 
                              className="px-3 h-full hover:bg-black/10 active:scale-95 transition-all text-white/80 hover:text-white font-extrabold text-sm"
                              onClick={() => updateQuantity(listId, -1)}
                            >
                              -
                            </button>
                            <span className="px-1 font-bold">{String(itemQty).padStart(2, '0')}</span>
                            <button 
                              className="px-3 h-full hover:bg-black/10 active:scale-95 transition-all text-white/80 hover:text-white font-extrabold text-sm"
                              onClick={() => updateQuantity(listId, 1)}
                            >
                              +
                            </button>
                          </div>
                        </>
                      ) : (
                        <button 
                          onClick={() => updateQuantity(listId, 3)}
                          className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-all focus:outline-none"
                        >
                          <Plus className="w-4.5 h-4.5 stroke-[3]" />
                        </button>
                      )
                    ) : (
                      <button 
                        onClick={() => toast('Stock notification request registered!', 'success')}
                        className="w-8.5 h-8.5 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center border border-red-100 active:scale-95 transition-all focus:outline-none"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #854cbc; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6a3a9a; }
      `}} />
    </div>
  );
}
