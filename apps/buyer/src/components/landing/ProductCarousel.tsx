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
import WishlistIcon from '@/components/shared/WishlistIcon';
import { DeliveryTruckBadge } from '@/components/shared/DeliveryTruckBadge';

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

  const isYukiziChoice = product?.isYukiziChoice !== undefined ? !!product.isYukiziChoice : true;
  const isBestSeller = !!product?.isBestSeller;
  const isAd = isYukiziChoice || isBestSeller;
  
  const price = product?.price;
  const mrp = product?.mrp || product?.originalPrice;
  const rating = product?.rating || 4.5;
  
  const displayPrice = price != null ? `₹${Number(price).toLocaleString('en-IN')}` : '₹3,345.53';
  const displayOriginalPrice = mrp != null && mrp > (price || 0) 
    ? `₹${Number(mrp).toLocaleString('en-IN')}` 
    : (price != null ? `₹${Math.round(Number(price) * 1.15).toLocaleString('en-IN')}` : '₹3,800.25');
  
  const displayDiscount = (mrp != null && price != null && mrp > price)
    ? `${Math.round(((mrp - price) / mrp) * 100)}% off`
    : '25% off';
  
  const displayDelivery = product?.deliveryTime || '3 days';
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
    <div className="relative mt-3 sm:mt-4 group flex flex-col h-full">
      {/* Yukizi Choice & Best Seller Tags */}
      <div className="absolute -top-[10px] left-2.5 sm:left-3 flex items-center gap-1 sm:gap-1.5 z-30">
        {isYukiziChoice && (
          <div className="bg-[#8b5cf6] text-white px-2 sm:px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-[11px] md:text-[11px] lg:text-[12px] xl:text-[10px] shadow-sm tracking-wide flex items-center justify-center">
            Yukizi Choice
          </div>
        )}
        {isBestSeller && (
          <div className="bg-[#4a4a4a] text-white px-2 sm:px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-[11px] md:text-[11px] lg:text-[12px] xl:text-[10px] shadow-sm tracking-wide flex items-center justify-center">
            Best Seller
          </div>
        )}
      </div>

      {/* Ad Tag */}
      {isAd && (
        <div className="absolute -top-5 right-2 text-[11px] sm:text-[12px] text-gray-500 font-medium z-20">
          Ad
        </div>
      )}

      {/* Container */}
      <div 
        className={`bg-white rounded-[14px] sm:rounded-[16px] p-2.5 sm:p-3 hover:shadow-[0_8px_30px_rgb(133,76,188,0.15)] hover:ring-1 hover:ring-primary/50 transition-all duration-300 group flex flex-col relative border ${isYukiziChoice ? 'border-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.4)]' : 'border-gray-300 shadow-sm'} w-full h-full overflow-hidden`}
      >
        {/* Top action icons */}
        <div className="flex justify-between items-center w-full absolute top-2.5 sm:top-3 left-0 px-2.5 sm:px-3 z-20">
          <button className="text-gray-500 hover:text-gray-700 transition-colors z-10 p-0.5" onClick={(e) => e.preventDefault()}>
             <Share2 className="w-4 h-4 sm:w-4 sm:h-4" strokeWidth={2} />
          </button>
          <button 
            className="text-[#ff8952] hover:text-[#ff7536] transition-colors z-10 p-1 flex items-center justify-center" 
            onClick={(e) => { 
              e.preventDefault(); 
              addToCart(
                { productId: currentProductId, quantity: 1, price, originalPrice: mrp, ...product },
                { onSuccess: () => toast('Added to cart', 'success') }
              );
            }}
          >
             <Plus className="w-5 h-5 sm:w-5 sm:h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Right Edge Ribbon (Wishlist/Save) */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
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
          className="absolute right-0 top-[40%] -translate-y-1/2 z-20 cursor-pointer hover:scale-105 transition-transform"
        >
          <WishlistIcon isFilled={isSaved} className={`w-5 h-7 sm:w-5 sm:h-7 text-[#889096] ${isSaved ? 'fill-[#889096]' : 'fill-none'}`} />
        </div>

        {/* Image Container */}
        <Link href={`/products/${generateProductSlug(productName, product?.id || 'prod-' + index)}`} className="relative w-full aspect-[4/5] mb-[-4px] sm:mb-[-6px] mt-1 sm:mt-1.5 overflow-hidden bg-white flex justify-center items-center border-none">
           <img src={imageUrl} alt={productName} className="max-h-full max-w-full object-contain p-0.5 transform group-hover:scale-105 transition-transform duration-700 ease-out drop-shadow-md" />
        </Link>

        {/* Details Section */}
        <div className="flex-1 flex flex-col z-10 w-full mt-0 pb-0.5">
           {/* Title Line */}
           <div className="flex items-center justify-between mb-1 w-full gap-1 sm:gap-1.5">
              <h3 className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] xl:text-[13px] font-medium text-[#333333] truncate flex-1 text-left tracking-tight leading-tight">
                 {productName}
              </h3>
              <button 
                 onClick={(e) => { e.preventDefault(); onOpenReview(product); }}
                 className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-6 xl:h-6 bg-[#8c8c8c] rounded-full flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform shadow-sm z-20 -mr-1 sm:-mr-1.5 md:-mr-1.5 lg:-mr-2 xl:-mr-1.5"
              >
                 <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 xl:w-3.5 xl:h-3.5 text-white" strokeWidth={2.5} />
              </button>
           </div>
           
           {/* Price and Rating */}
           <div className="flex justify-between items-center w-full mb-1 sm:mb-1.5">
              <div className="flex items-baseline gap-1 sm:gap-1.5">
                 <span className="text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[14px] font-semibold text-[#333333] tracking-tight leading-none">
                    {displayPrice}
                 </span>
                 <span className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] xl:text-[11px] text-gray-400 line-through leading-none">{displayOriginalPrice}</span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 -mr-1 sm:-mr-1.5 md:-mr-1.5 lg:-mr-2 xl:-mr-1.5">
                 <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-4.5 lg:h-4.5 xl:w-3.5 xl:h-3.5 text-[#8b5cf6] fill-[#8b5cf6]" />
                 <span className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] xl:text-[13px] font-medium text-[#333333] leading-none">{rating}</span>
              </div>
           </div>

           {/* Bottom Badges */}
           <div className="flex justify-between items-center w-full mt-auto pt-0.5">
              <span className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] xl:text-[11px] font-bold text-[#333333]">
                 {displayDiscount}
              </span>
              <div className="-mr-1 sm:-mr-1.5 md:-mr-1.5 lg:-mr-2 xl:-mr-1.5">
                 <DeliveryTruckBadge text={displayDelivery} className="w-[55px] sm:w-[60px] md:w-[65px] lg:w-[70px] xl:w-[58px] h-auto text-[#8c8c8c]" />
              </div>
           </div>
        </div>
      </div>
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
        - Tablet (md): 4 columns
        - Large Desktop (lg): 6 columns
        - Extra Large Desktop (xl): 7 columns
      */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-x-2.5 gap-y-[28px] md:gap-3 lg:gap-4">
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


