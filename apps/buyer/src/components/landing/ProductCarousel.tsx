'use client';

import { useState, useEffect } from 'react';
import { Loader2, Share2, Plus, ArrowUpRight, Star, Truck, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { getProducts } from '@yukizi/api-client';
import { generateProductSlug, calculatePricing } from '@yukizi/utils';
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

export const renderBuyerOfferBadge = (p: any) => {
  const meta = p.discountMeta || {};
  if (!p?.discountType) {
    if (meta.discountPercent) {
      return <span className="text-[#333333] text-[15px] sm:text-[16px] font-medium tracking-wide whitespace-nowrap">{meta.discountPercent}% off</span>;
    }
    return null;
  }
  if (p.discountType === "PTR_DISCOUNT") {
    return <span className="text-[#333333] text-[15px] sm:text-[16px] font-medium tracking-wide whitespace-nowrap">{meta.discountPercent || 0}% off</span>;
  }
  if (p.discountType === "SAME_PRODUCT_BONUS") {
    return <span className="text-[#333333] text-[15px] sm:text-[16px] font-medium tracking-wide whitespace-nowrap">Buy {meta.buy || 0} Get {meta.get || 0} Free</span>;
  }
  if (p.discountType === "PTR_PLUS_SAME_PRODUCT_BONUS") {
    return <div className="flex flex-col gap-0.5"><span className="text-[#333333] text-[15px] sm:text-[16px] font-medium tracking-wide whitespace-nowrap">{meta.discountPercent || 0}% off</span><span className="text-[#333333] text-[15px] sm:text-[16px] font-medium tracking-wide whitespace-nowrap">Buy {meta.buy || 0} Get {meta.get || 0} Free</span></div>;
  }
  if (p.discountType === "DIFFERENT_PRODUCT_BONUS") {
    return <span className="text-[#333333] text-[15px] sm:text-[16px] font-medium tracking-wide whitespace-nowrap">Buy {meta.buy || 0} Get {meta.get || 0} {meta.bonusProductName}</span>;
  }
  if (p.discountType === "PTR_PLUS_DIFFERENT_PRODUCT_BONUS") {
    return <div className="flex flex-col gap-0.5"><span className="text-[#333333] text-[15px] sm:text-[16px] font-medium tracking-wide whitespace-nowrap">{meta.discountPercent || 0}% off</span><span className="text-[#333333] text-[15px] sm:text-[16px] font-medium tracking-wide whitespace-nowrap">Buy {meta.buy || 0} Get {meta.get || 0} {meta.bonusProductName}</span></div>;
  }
  if (p.discountType === "SPECIAL_PRICE") {
    return <span className="text-emerald-600 text-[15px] sm:text-[16px] font-medium tracking-wide whitespace-nowrap">Special Price: ₹{Math.round(Number(meta.specialPrice) || 0)}</span>;
  }
  return <span className="text-[#333333] text-[15px] sm:text-[16px] font-medium tracking-wide whitespace-nowrap">{p.discountType.replace(/_/g, ' ')}</span>;
};

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
  
  const pricing = calculatePricing(
    Number(product?.mrp || product?.originalPrice || 0),
    Number(product?.gstPercent || 0),
    {
      type: product?.discountType || (product?.discountMeta?.discountPercent ? 'ptr_discount' : 'none'),
      discountPercent: product?.discountMeta?.discountPercent,
      specialPrice: product?.discountMeta?.specialPrice,
      buy: product?.discountMeta?.buy,
      get: product?.discountMeta?.get,
      bonusProductName: product?.discountMeta?.bonusProductName,
      shippingCharges: product?.finalShippingPrice ?? product?.shippingCharges ?? 0,
      shippingGstPercent: 0,
      isTaxIncluded: true,
    }
  );

  const price = pricing.finalCustomerPayable;
  const mrp = product?.mrp || product?.originalPrice;
  const rating = product?.rating || 4.5;
  
  const isNotAvailable = product?.sellerCount === 0 || product?.sellerOffers?.length === 0 || price == null || price === 0;
  const displayPrice = isNotAvailable ? 'N/A' : `₹${Math.round(Number(price)).toLocaleString('en-IN')}`;
  const grossTotal = pricing?.grossTotal ?? (mrp != null ? Number(mrp) : 0);
  const displayOriginalPrice = grossTotal > Number(price || 0) 
    ? `₹${Math.round(Number(grossTotal)).toLocaleString('en-IN')}` 
    : '';
  
  const displayDelivery = product?.deliveryText || product?.deliveryTime || '3 days';
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
      <div className="absolute -top-[12px] left-1.5 sm:left-2 flex items-center gap-1.5 z-30">
        {isYukiziChoice && (
          <div className="bg-[#7B2FBE] text-white px-3.5 py-0.5 rounded-full font-semibold text-[11px] sm:text-[12px] md:text-[13px] shadow-sm tracking-wide flex items-center justify-center">
            Yukizi Choice
          </div>
        )}
        {isBestSeller && (
          <div className="bg-[#4a4a4a] text-white px-3.5 py-0.5 rounded-full font-semibold text-[11px] sm:text-[12px] md:text-[13px] shadow-sm tracking-wide flex items-center justify-center">
            Best Seller
          </div>
        )}
      </div>

      {/* Ad Tag */}
      {isAd && (
        <div className="absolute -top-5 right-0 text-[12px] sm:text-[13px] text-gray-500 font-semibold z-20">
          Ad
        </div>
      )}

      {/* Container */}
      <div 
        className={`bg-white rounded-[12px] sm:rounded-[12px] p-3 sm:p-3.5 hover:shadow-[0_8px_30px_rgb(133,76,188,0.15)] hover:ring-1 hover:ring-primary/50 transition-all duration-300 group flex flex-col relative border ${isYukiziChoice ? 'border-[#7B2FBE]/30 shadow-[0_0_12px_rgba(123,47,190,0.15)]' : 'border-gray-300 shadow-sm'} w-full h-full overflow-hidden`}
      >
        {/* Top action icons */}
        {!isNotAvailable && (
          <div className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1 z-20">
            <button 
              className="text-[#ff8952] hover:text-[#ff7536] transition-colors p-0.5 flex items-center justify-center" 
              onClick={(e) => { 
                e.preventDefault(); 
                const targetProductId = product.bestListingId || currentProductId;
                addToCart(
                  { productId: targetProductId, quantity: 1, price, originalPrice: mrp, ...product },
                  { onSuccess: () => toast('Added to cart', 'success') }
                );
              }}
            >
               <Plus className="w-4.5 h-4.5 sm:w-5 sm:h-5" strokeWidth={2.5} />
            </button>
          </div>
        )}

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
          <WishlistIcon 
            isFilled={isSaved} 
            preserveAspectRatio="none" 
            fill={isSaved ? '#C5A880' : '#FAF5EB'} 
            className="w-[32px] h-[28px] xs:w-[32px] xs:h-[28px] sm:w-[32px] sm:h-[28px] text-[#C5A880]" 
          />
        </div>

        {/* Image Container */}
        <Link href={`/products/${generateProductSlug(productName, product?.id || 'prod-' + index)}`} className="relative w-full aspect-[4/5] mt-[-12px] sm:mt-[-14px] mb-[-4px] sm:mb-[-6px] overflow-hidden bg-white flex justify-center items-center border-none">
           <img src={imageUrl} alt={productName} className="max-h-full max-w-full object-contain p-0.5 transform scale-[1.18] group-hover:scale-[1.25] transition-transform duration-700 ease-out drop-shadow-md" />
        </Link>

        {/* Details Section */}
        <div className="flex-1 flex flex-col justify-end gap-2 sm:gap-2.5 z-10 w-full mt-0 pb-0.5">
           {/* Title Line */}
           <div className="flex items-center justify-between w-full gap-2">
              <h3 className="text-[17px] sm:text-[18px] md:text-[19px] lg:text-[20px] xl:text-[18px] font-medium text-[#333333] truncate flex-1 text-left tracking-tight leading-tight">
                 {productName}
              </h3>
              <button 
                 onClick={(e) => { e.preventDefault(); onOpenReview(product); }}
                 className="w-4.5 h-4.5 sm:w-5 sm:h-5 bg-[#8c8c8c] rounded-full flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform shadow-sm z-20 -mr-1 sm:-mr-1.5"
              >
                 <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" strokeWidth={2.5} />
              </button>
           </div>
           
           {/* Price and Rating */}
           <div className="flex justify-between items-center w-full">
              <div className="flex items-baseline gap-1 sm:gap-1.5">
                 <span className="text-[17px] sm:text-[18px] md:text-[19px] lg:text-[20px] xl:text-[18px] font-medium text-[#333333] tracking-tight leading-none">
                    {displayPrice}
                 </span>
                 <span className="text-[12px] sm:text-[13px] md:text-[14px] text-gray-400 line-through leading-none">{displayOriginalPrice}</span>
              </div>
              <div className="flex items-center gap-1 -mr-1 sm:-mr-1.5">
                 <Star className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#7B2FBE] fill-[#7B2FBE]" />
                 <span className="text-[14px] sm:text-[15px] md:text-[16px] font-medium text-[#333333] leading-none">{rating}</span>
              </div>
           </div>

           {/* Bottom Badges */}
           <div className="flex justify-between items-center w-full mt-1">
              <div className="flex items-center gap-1">
                 {renderBuyerOfferBadge(product)}
              </div>
              <div className="-mr-1 sm:-mr-1.5">
                 <DeliveryTruckBadge text={displayDelivery} className="w-[85px] sm:w-[90px] md:w-[95px] h-auto text-[#8c8c8c]" />
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
      <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto px-4 py-16 text-center text-gray-400 font-medium border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
        No products available.
      </div>
    );
  }

  const slicedProducts = [...products];

  return (
    <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto px-2 sm:px-4 lg:px-6 mb-8 sm:mb-12 pt-4">
      {/* 
        Grid Setup:
        - Mobile (sm/xs): 2 columns
        - Tablet (md): 4 columns
        - Large Desktop (lg): 6 columns
        - Extra Large Desktop (xl): 7 columns
      */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-8 md:gap-6 lg:gap-7">
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


