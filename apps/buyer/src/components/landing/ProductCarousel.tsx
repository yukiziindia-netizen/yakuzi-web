'use client';

import { useState, useEffect } from 'react';
import { Loader2, Share2, Plus, ArrowUpRight, Star, Truck, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { getProducts } from '@yukizi/api-client';
import { generateProductSlug } from '@yukizi/utils';
import QuickReviewModal from './QuickReviewModal';
import { useAddToCart } from '@/hooks/useCart';
import { useAddToWishlist, useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/components/shared/Toast';

interface ProductCarouselProps {
  reverse?: boolean;
  slot?: 'HOMEPAGE_CAROUSEL' | 'LOGIN_CAROUSEL';
  categoryId?: string;
  initialProducts?: any[];
}

function GridProductCard({ product, index, onOpenReview }: { product: any; index: number; onOpenReview: (p: any) => void }) {
  const { mutate: addToCart } = useAddToCart();
  const { mutate: addToWishlist } = useAddToWishlist();
  const { mutate: removeFromWishlist } = useRemoveFromWishlist();
  const { data: wishlistData } = useWishlist();
  const { toast } = useToast();
  
  const currentProductId = product?.id || `prod-${index}`;
  const isSaved = wishlistData?.items?.some(
    (item: any) => item.productId === currentProductId || item.product?.id === currentProductId || item.id === currentProductId
  );

  const isYukiziChoice = !!product?.isYukiziChoice;
  const isBestSeller = !!product?.isBestSeller;
  const isAd = !!product?.isAd;
  
  const price = product?.price;
  const mrp = product?.mrp || product?.originalPrice;
  
  const rating = product?.rating || null;
  
  const discountText = mrp != null && price != null && mrp > price
    ? `${Math.round(((mrp - price) / mrp) * 100)}% off`
    : null;
  
  const deliveryText = product?.deliveryTime || null;
  const productName = product?.name || 'Product';
  
  const getInitials = (name: string) => {
    if (!name) return 'PR';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };
  const fallbackImage = `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent(getInitials(productName))}`;
  
  const imageUrl = product?.images?.[0]?.url || product?.images?.[0] || product?.image || fallbackImage;

  return (
    <div className="relative mt-3 group flex flex-col h-full">
      {/* Container with relative positioning for absolute badges */}
      <div 
        className={`block bg-white rounded-xl border ${
          isYukiziChoice 
            ? 'border-[#cdaef1] shadow-[0_0_15px_rgba(133,76,188,0.2)]' 
            : 'border-gray-200 shadow-sm'
        } p-2.5 pb-3 flex flex-col hover:shadow-lg transition-all duration-300 w-full h-full relative overflow-hidden`}
      >
        
        {/* Top Icons */}
        <div className="flex justify-between items-start">
          <button className="text-gray-400 hover:text-gray-600 transition-colors z-10 p-0.5" onClick={(e) => e.preventDefault()}>
             <Share2 size={16} strokeWidth={2} className="opacity-80" />
          </button>
          {price != null && (
            <button 
              className="text-[#f97316] hover:text-orange-600 transition-colors z-10 p-0.5" 
              onClick={(e) => { 
                e.preventDefault(); 
                addToCart(
                  { productId: currentProductId, quantity: 1, price, originalPrice: mrp, ...product },
                  { onSuccess: () => toast('Added to cart', 'success') }
                );
              }}
            >
               <Plus size={20} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Right Edge Ribbon (Wishlist/Save) */}
        <button 
          className="absolute top-[30%] -right-[1px] z-20 cursor-pointer"
          onClick={(e) => { 
            e.preventDefault(); 
            if (isSaved) {
              removeFromWishlist(currentProductId, {
                onSuccess: () => toast('Removed from wishlist', 'info')
              });
            } else {
              addToWishlist(product, {
                onSuccess: () => toast('Added to wishlist', 'success')
              });
            }
          }}
        >
          <Bookmark 
            className={`w-[28px] h-[40px] stroke-[1] rotate-90 transition-colors ${isSaved ? 'fill-[#854cbc] text-[#854cbc]' : 'fill-[#FAF6EB] text-[#e8dfd5] hover:brightness-95'}`}
          />
        </button>

        {/* Image Container */}
        <Link href={`/products/${generateProductSlug(productName, product?.id || 'prod-' + index)}`} className="w-full h-[140px] sm:h-[150px] flex items-center justify-center mb-3 mt-1 relative group-hover:scale-105 transition-transform duration-500 block z-10">
           <img src={imageUrl} alt={productName} className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-sm" />
        </Link>

        {/* Details Section */}
        <div className="mt-auto flex flex-col gap-1 px-0.5">
           {/* Title Line */}
           <div className="flex justify-between items-center gap-1.5 mb-1">
              <h3 className="text-[14px] font-medium text-gray-700 truncate flex-1">
                 {productName}
              </h3>
              <button 
                 onClick={(e) => { e.preventDefault(); onOpenReview(product); }}
                 className="bg-gray-400 hover:bg-gray-500 transition-colors rounded-full p-[3px] flex-shrink-0 z-10"
              >
                 <ArrowUpRight size={12} className="text-white" strokeWidth={3} />
              </button>
           </div>
           
           {/* Price and Rating */}
           <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-baseline gap-1.5">
                 <span className="text-[15px] font-semibold text-gray-700 tracking-tight">
                    {price != null ? `₹${Number(price).toLocaleString('en-IN')}` : 'N/A'}
                 </span>
                 {mrp != null && mrp > (price || 0) && (
                    <span className="text-[10px] text-gray-400 line-through">₹{Number(mrp).toLocaleString('en-IN')}</span>
                 )}
              </div>
              {rating !== null && (
                <div className="flex items-center gap-0.5">
                   <Star size={13} className="fill-[#854cbc] text-[#854cbc]" />
                   <span className="text-[13px] font-medium text-gray-600">{rating}</span>
                </div>
              )}
           </div>

           {/* Bottom Badges */}
           <div className="flex justify-between items-center h-[20px] mt-0.5">
              {discountText ? (
                <span className="text-[10px] font-bold text-gray-700">
                   {discountText}
                </span>
              ) : <span />}
              
              {deliveryText && (
                <div className="flex items-center gap-1 bg-[#f0f0f0] rounded px-1.5 py-[3px]">
                   <Truck size={10} strokeWidth={2.5} className="text-gray-500" />
                   <span className="text-[9px] font-bold text-gray-600 leading-none">{deliveryText}</span>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Overlapping Badges - Rendered outside the border but positioned over it */}
      {isYukiziChoice && (
        <div className="absolute -top-2 left-3 px-2.5 py-[2px] rounded-full text-[9px] tracking-wide font-bold bg-[#854cbc] text-white z-20 pointer-events-none border-[1.5px] border-white">
          Yukizi Choice
        </div>
      )}
      {isBestSeller && (
        <div className="absolute -top-2 left-3 px-2.5 py-[2px] rounded-full text-[9px] tracking-wide font-bold bg-[#4a4a4a] text-white z-20 pointer-events-none border-[1.5px] border-white">
          Best Seller
        </div>
      )}
      {isAd && (
        <div className="absolute -top-2 right-4 px-1 text-[9px] font-medium text-gray-400 bg-white z-20 pointer-events-none">
          Ad
        </div>
      )}
    </div>
  );
}

export default function ProductCarousel({ slot = 'HOMEPAGE_CAROUSEL', categoryId, initialProducts }: ProductCarouselProps) {
  const [products, setProducts] = useState<any[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);
  const [reviewProduct, setReviewProduct] = useState<any | null>(null);

  useEffect(() => {
    if (initialProducts) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }
    
    async function load() {
      try {
        const res = await getProducts({ limit: 24, categoryId });
        if (res && res.data && Array.isArray(res.data)) {
          setProducts(res.data);
        }
      } catch (err) {
        console.error('Failed to load featured products', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slot, categoryId, initialProducts]);

  if (loading) return <div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#854cbc]" /></div>;
  
  if (!products || products.length === 0) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-4 py-16 text-center text-gray-400 font-medium border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
        No products available.
      </div>
    );
  }

  const slicedProducts = [...products];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 mb-8 sm:mb-12 pt-4">
      {/* 
        Grid Setup:
        - Mobile (sm/xs): 2 columns
        - Tablet (md): 3 columns, lg: 4 columns
        - Desktop (xl): 6 columns to perfectly match the screenshot layout
      */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-4">
        {slicedProducts.map((product, index) => (
          <GridProductCard 
            key={`${product?.id || 'prod'}-${index}`} 
            product={product} 
            index={index} 
            onOpenReview={setReviewProduct}
          />
        ))}
      </div>

      {reviewProduct && (
        <QuickReviewModal 
          isOpen={!!reviewProduct} 
          onClose={() => setReviewProduct(null)} 
          product={reviewProduct} 
        />
      )}
    </div>
  );
}


