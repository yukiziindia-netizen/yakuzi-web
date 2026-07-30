'use client';

import { useState, useEffect } from 'react';
import { Loader2, Share2, Plus, Minus, RotateCw, ArrowUpRight, Star, Truck, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { getProducts } from '@yukizi/api-client';
import { generateProductSlug, calculatePricing } from '@yukizi/utils';
import QuickReviewModal from './QuickReviewModal';
import { useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
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
  const { data: cartData } = useCart();
  const { mutate: addToCart } = useAddToCart();
  const { mutate: updateCartItem } = useUpdateCartItem();
  const { mutate: removeCartItem } = useRemoveCartItem();
  const { mutate: addToWishlist } = useAddToWishlist();
  const { mutate: removeFromWishlist } = useRemoveFromWishlist();
  const { data: wishlistData } = useWishlist();
  const { toast } = useToast();

  const currentProductId = product?.id || `prod-${index}`;
  const targetProductId = product.bestListingId || currentProductId;

  // Find if this product is in the cart
  const cartItem = cartData?.items?.find(
    (item: any) => item.productId === targetProductId || item.product?.id === targetProductId || item.id === targetProductId
  );
  const cartQuantity = cartItem?.quantity || 0;

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (cartItem) {
      updateCartItem({
        itemId: cartItem.id,
        quantity: cartQuantity + 1,
      });
    } else {
      addToCart(
        { productId: targetProductId, quantity: 1, price: finalPrice, originalPrice: finalOriginalPrice || mrpVal, ...product },
        { onSuccess: () => toast('Added to cart', 'success') }
      );
    }
  };

  const handleMinusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (cartItem) {
      if (cartQuantity > 1) {
        updateCartItem({
          itemId: cartItem.id,
          quantity: cartQuantity - 1,
        });
      } else if (cartQuantity === 1) {
        removeCartItem(cartItem.id);
      }
    }
  };

  const handleResetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (cartItem) {
      removeCartItem(cartItem.id, {
        onSuccess: () => toast('Removed from cart', 'info')
      });
    }
  };
  const isSaved = wishlistData?.items?.some(
    (item: any) => item.productId === currentProductId || item.product?.id === currentProductId || item.id === currentProductId
  );

  const isYukiziChoice = product?.isYukiziChoice !== undefined ? !!product.isYukiziChoice : true;
  const isBestSeller = !!product?.isBestSeller;
  const isAd = isYukiziChoice || isBestSeller;

  // 1. Extract pre-calculated selling price if available
  const rawPrice = product?.price ?? product?.finalCustomerPayable ?? product?.sellingPrice ?? product?.sellerOffers?.[0]?.finalCustomerPayable ?? product?.sellerOffers?.[0]?.mrp;
  const directPrice = (rawPrice != null && !isNaN(Number(rawPrice))) ? Number(rawPrice) : 0;
  
  // 2. Extract MRP / original price from all candidate fields
  const rawMrp = product?.mrp ?? product?.originalPrice ?? product?.sellerOffers?.[0]?.mrp ?? product?.lowestPrice ?? product?.price;
  const mrpVal = (rawMrp != null && !isNaN(Number(rawMrp))) ? Number(rawMrp) : 0;

  // 3. Compute pricing via calculatePricing if MRP is available
  const pricing = mrpVal > 0 ? calculatePricing(
    mrpVal,
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
  ) : null;

  const computedPrice = (pricing?.finalCustomerPayable != null && pricing.finalCustomerPayable > 0) 
    ? Number(pricing.finalCustomerPayable) 
    : 0;

  const finalPrice = directPrice > 0 ? directPrice : (computedPrice > 0 ? computedPrice : mrpVal);
  const finalOriginalPrice = mrpVal > finalPrice ? mrpVal : 0;
  const rating = product?.rating || 4.5;
  const isNotAvailable = (product?.sellerCount === 0 || product?.hasSellers === false) && finalPrice <= 0 && mrpVal <= 0;

  const displayPrice = finalPrice > 0 
    ? `₹${Math.round(finalPrice).toLocaleString('en-IN')}` 
    : (mrpVal > 0 ? `₹${Math.round(mrpVal).toLocaleString('en-IN')}` : 'N/A');

  const displayOriginalPrice = (finalOriginalPrice > 0 && finalOriginalPrice > finalPrice)
    ? `₹${Math.round(finalOriginalPrice).toLocaleString('en-IN')}`
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
    <div className="relative group flex flex-col h-auto w-full max-w-[210px] sm:max-w-none mx-auto">
      {/* Yukizi Choice & Best Seller Tags */}
      <div className="absolute -top-[12px] left-1.5 sm:left-2 flex items-center gap-1.5 z-30">
        {isYukiziChoice && (
          <div className="bg-[#7B2FBE] text-white px-3 py-0.5 rounded-full font-semibold text-[10px] sm:text-[11px] shadow-sm tracking-wide flex items-center justify-center">
            Yukizi Choice
          </div>
        )}
        {isBestSeller && (
          <div className="bg-[#4a4a4a] text-white px-3 py-0.5 rounded-full font-semibold text-[10px] sm:text-[11px] shadow-sm tracking-wide flex items-center justify-center">
            Best Seller
          </div>
        )}
      </div>

      {/* Ad Tag */}
      {isAd && (
        <div className="absolute -top-5 right-0 text-[11px] sm:text-[12px] text-gray-500 font-semibold z-20">
          Ad
        </div>
      )}

      {/* Container - Samplr.in exact 6px border radius, #ddd border, 0 2px 8px shadow */}
      <div 
        className={`bg-white rounded-[6px] hover:shadow-md transition-shadow duration-200 group flex flex-col relative border ${isYukiziChoice ? 'border-[#7B2FBE]/40 shadow-[0_2px_8px_rgba(123,47,190,0.15)]' : 'border-[#ddd] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'} w-full h-auto overflow-hidden`}
      >

        {/* Top Right Plus / Cart Button */}
        {!isNotAvailable && (
          <div className="absolute top-1 right-1 z-20">
            {cartQuantity > 0 ? (
              <div className="flex items-center gap-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                 {/* Reset Button */}
                 <button
                   onClick={handleResetClick}
                   title="Reset quantity"
                   className="text-[#48286b] hover:text-purple-900 transition-all active:scale-90 focus:outline-none p-0.5"
                 >
                   <RotateCw className="w-3.5 h-3.5" strokeWidth={3} />
                 </button>

                 {/* Quantity Control Pill */}
                 <div className="flex items-center bg-[#48286b] rounded-[6px] overflow-hidden h-6 text-white shadow-sm select-none justify-between px-1 gap-1">
                    <button 
                      onClick={handleMinusClick} 
                      className="text-white hover:bg-white/10 w-4.5 h-4.5 flex items-center justify-center rounded transition-colors"
                    >
                      <Minus className="w-2.5 h-2.5" strokeWidth={3} />
                    </button>
                    <span className="text-[10px] font-black tracking-wide min-w-[12px] text-center">
                      {String(cartQuantity).padStart(2, '0')}
                    </span>
                    <button 
                      onClick={handlePlusClick} 
                      className="text-white hover:bg-white/10 w-4.5 h-4.5 flex items-center justify-center rounded transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5" strokeWidth={3} />
                    </button>
                 </div>
              </div>
            ) : (
              <button 
                className="text-orange-500 hover:text-orange-600 transition-all focus:outline-none p-1" 
                onClick={handlePlusClick}
              >
                <Plus className="w-5 h-5" strokeWidth={3} />
              </button>
            )}
          </div>
        )}

        {/* Right Edge Wishlist Ribbon */}
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
            className="w-[28px] h-[24px] text-[#C5A880]" 
          />
        </div>

        {/* Image Container - Fixed 190px/200px height matching Samplr */}
        <Link href={`/products/${generateProductSlug(productName, product?.id || 'prod-' + index)}`} className="relative w-full h-[190px] sm:h-[200px] bg-[#f8f8f8] overflow-hidden flex justify-center items-center shrink-0 border-b border-gray-100">
           <img src={imageUrl} alt={productName} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300 ease-out" />
        </Link>

        {/* Details Section - Compact layout with zero extra vertical spacing */}
        <div className="flex flex-col gap-1.5 p-[8px] sm:p-[10px] bg-white w-full">
           {/* Brand Subtitle & Title Line */}
           <div>
              <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-0.5 truncate leading-none">
                 {product?.brandName || product?.categoryName || product?.brand || 'YUKIZI'}
              </div>
              <div className="flex items-start justify-between w-full gap-1.5">
                 <Link href={`/products/${generateProductSlug(productName, product?.id || 'prod-' + index)}`} className="flex-1">
                   <h3 className="text-[13px] sm:text-[14px] font-medium text-[#333333] leading-snug line-clamp-2 hover:text-[#7B2FBE] transition-colors">
                      {productName}
                   </h3>
                 </Link>
                 <button 
                    onClick={(e) => { e.preventDefault(); onOpenReview(product); }}
                    className="w-5 h-5 bg-[#8c8c8c] rounded-full flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform shadow-sm shrink-0"
                 >
                    <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                 </button>
              </div>
           </div>
           
           {/* Price and Rating Row */}
           <div className="flex justify-between items-center w-full pt-0.5">
              <div className="flex items-baseline gap-1">
                 <span className="text-[14px] sm:text-[15px] font-medium text-[#333333] leading-none">
                    {displayPrice}
                 </span>
                 {displayOriginalPrice && (
                   <span className="text-[11px] sm:text-[12px] text-gray-400 line-through leading-none">{displayOriginalPrice}</span>
                 )}
              </div>
              <div className="flex items-center gap-1">
                 <Star className="w-3.5 h-3.5 text-[#7B2FBE] fill-[#7B2FBE]" />
                 <span className="text-[13px] sm:text-[14px] font-medium text-[#333333] leading-none">{rating}</span>
              </div>
           </div>

           {/* Bottom Badges / Delivery Truck Row */}
           <div className="flex justify-between items-center w-full pt-1 border-t border-gray-100/80">
              <div className="flex items-center gap-1">
                 {renderBuyerOfferBadge(product)}
              </div>
              <div>
                 <DeliveryTruckBadge text={displayDelivery} className="w-[75px] h-auto text-[#8c8c8c]" />
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
    <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto px-6 md:px-10 mb-8 sm:mb-12 pt-4">
      {/* 
        Responsive Grid Layout with increased columns on large screens:
        - Padding: px-6 md:px-10
        - Columns: 2 cols (mobile), 3 cols (sm), 4 cols (md), 5 cols (lg), 6 cols (xl/2xl)
        - Gap: gap-4 (16px)
      */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4">
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


