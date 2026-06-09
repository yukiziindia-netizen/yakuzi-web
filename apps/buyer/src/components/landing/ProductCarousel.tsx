'use client';

import { useState, useEffect } from 'react';
import { Loader2, Share2, Plus, ArrowUpRight, Star, Truck, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/shared/Toast';
import { getProducts } from '@yukizi/api-client';
import { generateProductSlug } from '@yukizi/utils';
import QuickReviewModal from './QuickReviewModal';
import { useAddToCart } from '@/hooks/useCart';
import { useAddToWishlist, useWishlist } from '@/hooks/useWishlist';
import WishlistIcon from '@/components/shared/WishlistIcon';

interface ProductCarouselProps {
  reverse?: boolean;
  slot?: 'HOMEPAGE_CAROUSEL' | 'LOGIN_CAROUSEL';
  categoryId?: string;
  initialProducts?: any[];
}

function GridProductCard({ product, index, onOpenReview }: { product: any; index: number; onOpenReview: (p: any) => void }) {
  const { toast } = useToast();
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const { data: wishlistData } = useWishlist();
  
  const isYukiziChoice = index % 3 === 0;
  const isBestSeller = index % 3 === 1;
  const hasAd = isYukiziChoice || isBestSeller;
  const hasBottomRow = index % 3 !== 2;
  
  const discountPercent = product.mrp && product.price && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
  
  const productName = product.name || "Product Name";
  const getInitials = (name: string) => {
    if (!name) return 'PR';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };
  const fallbackImage = `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent(getInitials(productName))}`;
  
  const imageUrl = product.images?.[0]?.url || product.images?.[0] || product.image || fallbackImage;
  const isBookmarked = wishlistData?.items?.some((item: any) => item.id === product.id || item.productId === product.id);

  return (
    <div className="relative mt-3 group">
      <div 
        className={`block bg-white rounded-xl border ${isYukiziChoice ? 'border-[#e2cbf5] shadow-[0_2px_15px_rgba(133,76,188,0.12)]' : 'border-gray-200'} p-3 pb-3 flex flex-col hover:shadow-lg transition-all duration-300 w-full h-full relative overflow-hidden`}
      >
        
        {/* Top Icons */}
        <div className="flex justify-between items-start mb-1">
          <button className="text-gray-400 hover:text-gray-600 transition-colors z-10" onClick={(e) => e.preventDefault()}>
             <Share2 size={16} strokeWidth={2} />
          </button>
          <button className="text-orange-400 hover:text-orange-500 transition-colors z-10 disabled:opacity-50" disabled={addToCart.isPending} onClick={async (e) => {
             e.preventDefault();
             await addToCart.mutateAsync({
               productId: product.id || 'prod-' + index,
               name: productName,
               price: product.price || product.mrp || 0,
               image: imageUrl,
               product
             });
             toast('Added to cart', 'success');
          }}>
             {addToCart.isPending ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} strokeWidth={2.5} />}
          </button>
        </div>

        {/* Wishlist Button */}
        <button 
          className="absolute top-[45%] right-[-1px] z-20 transition-all duration-300 disabled:opacity-50 hover:-translate-x-1"
          disabled={addToWishlist.isPending}
          onClick={async (e) => {
             e.preventDefault();
             await addToWishlist.mutateAsync({
               ...product,
               id: product.id || 'prod-' + index,
               name: productName,
               price: product.price || product.mrp || 0,
               image: imageUrl
             });
             toast(isBookmarked ? 'Removed from wishlist' : 'Added to wishlist', 'success');
          }}
        >
          {addToWishlist.isPending ? (
            <div className="bg-white rounded-l-md border border-r-0 border-gray-200 p-1 shadow-sm">
              <Loader2 size={16} className="animate-spin text-[#8b5cf6]" />
            </div>
          ) : (
            <Bookmark 
              size={28} 
              strokeWidth={1.5}
              className={`-rotate-90 transition-colors duration-300 ${isBookmarked ? 'fill-[#854cbc] text-[#854cbc]' : 'fill-[#fbf9f4] text-[#e2d5c1]'}`} 
            />
          )}
        </button>

        {/* Image Container */}
        <Link href={`/products/${generateProductSlug(productName, product.id || 'prod-' + index)}`} className="w-full h-[120px] sm:h-[140px] flex items-center justify-center mb-4 mt-1 relative group-hover:scale-105 transition-transform duration-500 block z-10">
           <img src={imageUrl} alt={productName} className="max-h-full max-w-full object-contain mix-blend-multiply" />
        </Link>

        {/* Details Section */}
        <div className="mt-auto flex flex-col gap-1.5">
           {/* Title Line */}
           <div className="flex justify-between items-center gap-1">
              <h3 className="text-[13px] font-medium text-gray-800 truncate flex-1">
                 {productName}
              </h3>
              <button 
                 onClick={(e) => { e.preventDefault(); onOpenReview(product); }}
                 className="bg-gray-400 hover:bg-gray-500 transition-colors rounded-full p-[3px] flex-shrink-0 z-10 relative"
              >
                 <ArrowUpRight size={12} className="text-white" strokeWidth={3} />
              </button>
           </div>
           
           {/* Price and Rating */}
           <div className="flex justify-between items-center">
              <div className="flex items-baseline gap-1.5">
                 <span className="text-[14px] font-semibold text-gray-800 tracking-tight">₹{product.price || 0}</span>
                 {product.mrp > product.price && (
                   <span className="text-[10px] text-gray-400 line-through">₹{product.mrp}</span>
                 )}
              </div>
              <div className="flex items-center gap-0.5">
                 <Star size={12} className="fill-[#854cbc] text-[#854cbc]" />
                 <span className="text-[12px] font-medium text-gray-700">4.5</span>
              </div>
           </div>

           {/* Bottom Badges */}
           {hasBottomRow ? (
             <div className="flex justify-between items-center mt-1">
                <div className="text-[10px] font-bold text-gray-600">
                   {discountPercent > 0 ? `${discountPercent}% off` : ''}
                </div>
                <div className="flex items-center gap-1 bg-[#f5f5f5] rounded px-1.5 py-0.5 border border-gray-100">
                   <Truck size={10} strokeWidth={2.5} className="text-gray-500" />
                   <span className="text-[9px] font-bold text-gray-600">{product.deliveryText || (index % 3 === 1 ? 'Tomorrow' : '3 days')}</span>
                </div>
             </div>
           ) : (
             <div className="h-[22px] w-full" /> /* Placeholder to keep alignment if needed, or omit entirely based on screenshot */
           )}
        </div>
      </div>

      {/* Overlapping Badges */}
      {isYukiziChoice && (
        <div className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#854cbc] text-white z-20 pointer-events-none shadow-sm">
          Yukizi Choice
        </div>
      )}
      {isBestSeller && (
        <div className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#333333] text-white z-20 pointer-events-none shadow-sm">
          Best Seller
        </div>
      )}
      {hasAd && (
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
  
  const displayProducts = [...products];
  const slicedProducts = displayProducts;

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
            key={`${product.id || 'prod'}-${index}`} 
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

