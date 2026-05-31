import React, { useState } from 'react';
import { Share2, Star, Truck, Plus, Bell, Minus, X } from 'lucide-react';

interface QuickReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export default function QuickReviewModal({ isOpen, onClose, product }: QuickReviewModalProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  if (!isOpen || !product) return null;

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const listings = product.listings && product.listings.length > 0 ? product.listings : [product];
  const productName = product.name || 'Product Name';
  
  const getInitials = (name: string) => {
    if (!name) return 'PR';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };
  const fallbackImage = `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent(getInitials(productName))}`;
  const imageUrl = product.images?.[0]?.url || product.images?.[0] || product.image || fallbackImage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <Share2 size={20} />
            </button>
            <h2 className="text-lg font-bold text-gray-500 truncate max-w-[200px]">{productName}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-4 overflow-y-auto custom-scrollbar pr-2">
          {/* Main Image Section */}
          <div className="relative rounded-2xl overflow-hidden mb-4 bg-[#c892f6]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#c892f6] to-[#df64db] opacity-80" />
            
            {/* Special Offer Ribbon */}
            <div className="absolute top-4 left-4 z-10 -rotate-6">
              <div className="bg-orange-500 text-white font-bold px-4 py-1.5 rounded-lg shadow-lg">
                SPECIAL OFFER
              </div>
            </div>

            {/* Main Image */}
            <div className="relative z-10 flex justify-center py-4">
              <img 
                src={imageUrl} 
                alt={productName}
                className="h-64 object-cover drop-shadow-xl mix-blend-multiply"
              />
            </div>

            {/* Thumbnails */}
            <div className="absolute left-3 top-24 flex flex-col gap-2 z-10">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="w-12 h-12 rounded-lg border-2 border-orange-400 overflow-hidden bg-white">
                  <img 
                    src={product.images?.[i]?.url || product.images?.[i] || imageUrl} 
                    alt="thumb" 
                    className="w-full h-full object-cover mix-blend-multiply opacity-80"
                  />
                </div>
              ))}
            </div>
            
            <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white px-2 py-3 rounded-l-md shadow-md z-10">
               <div className="w-0 h-0 border-t-4 border-t-transparent border-l-[6px] border-l-gray-400 border-b-4 border-b-transparent"></div>
            </div>
          </div>

          {/* Pricing Rows / Sellers */}
          <div className="space-y-2 relative">
             <div className="absolute right-[-10px] top-0 bottom-0 w-1.5 bg-[#854cbc] rounded-full"></div>
            {listings.map((listing: any, i: number) => {
              const listId = listing.id || String(i);
              const companyName = listing.seller?.companyName || 'Yakuzi';
              const rating = listing.seller?.rating || '4.5';
              const price = listing.price || listing.mrp || product.price || product.mrp || 3345.53;
              const isAdded = quantities[listId] > 0;

              return (
                <div key={listId} className="flex items-center justify-between bg-gray-100 rounded-lg p-2.5 pr-4 mr-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#854cbc] text-white text-[10px] font-bold px-2 py-1 rounded max-w-[80px] truncate">
                      {companyName}
                    </div>
                    <div>
                      <div className="font-bold text-gray-700 leading-tight">₹{price}</div>
                      <div className="text-[9px] text-gray-400">
                        {listing.moq ? `MOQ: ${listing.moq}` : '20% off on purchase of 3'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-[#854cbc] text-[#854cbc]" />
                    <span className="font-bold text-gray-600 text-sm">{rating}</span>
                  </div>

                  <div className="flex items-center gap-1 text-gray-500">
                    <Truck size={14} />
                    <span className="text-[10px] font-bold">{i === 0 ? 'Tomorrow' : '3 days'}</span>
                  </div>

                  <div className="w-20 flex justify-end">
                    {isAdded ? (
                      <div className="flex items-center bg-[#4a3463] text-white rounded-md overflow-hidden">
                         <button className="px-2 py-1 bg-white/20" onClick={() => updateQuantity(listId, -1)}>
                           <Minus size={12} />
                         </button>
                         <span className="px-2 text-xs font-bold">{String(quantities[listId]).padStart(2, '0')}</span>
                         <button className="px-2 py-1 bg-white/20" onClick={() => updateQuantity(listId, 1)}>
                           <Plus size={12} />
                         </button>
                      </div>
                    ) : (
                      <button className="text-orange-500" onClick={() => updateQuantity(listId, 1)}>
                        <Plus size={20} strokeWidth={3} />
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
