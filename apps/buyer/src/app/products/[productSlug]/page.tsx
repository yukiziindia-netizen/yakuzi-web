'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Plus,
  Star,
  Truck,
  ChevronDown,
  ChevronUp,
  Bell,
  RotateCcw,
  Minus,
  Search,
  User,
  Bookmark,
  ShoppingCart,
  Package,
  Filter,
  Menu,
  ArrowUpRight,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import Image from 'next/image';
import { DeliveryTruckBadge } from '@/components/shared/DeliveryTruckBadge';
import Link from 'next/link';
import { useProductById, useProducts, useWaitlist, useAddToWaitlist, useRemoveFromWaitlist } from '@/hooks/useProducts';
import { useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { useToast } from '@/components/shared/Toast';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useProductReviews, useCreateReview } from '@/hooks/useReviews';
import Navbar from '@/components/landing/Navbar';
import { generateProductSlug, parseProductIdFromSlug } from '@yukizi/utils';
import { ShareButton } from '@/components/shared/ShareButton';
import WishlistIcon from '@/components/shared/WishlistIcon';

function Accordion({
  title,
  content,
  defaultOpen = false,
}: {
  title: string;
  content?: string;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 focus:outline-none"
      >
        {title}
        {isOpen ? (
          <Minus size={14} className="text-gray-400" />
        ) : (
          <Plus size={14} className="text-gray-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && content && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="purple-scroll relative max-h-[70px] overflow-y-auto pr-4 pt-2 text-[10px] font-medium leading-relaxed text-gray-400 sm:text-[11px]">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RelatedProductCard({ prod, index }: { prod: any; index: number }) {
  const isYukiziChoice = !!prod.isNew;
  
  const price = prod.price;
  const mrp = prod.mrp || prod.originalPrice;
  const discountText = mrp != null && price != null && mrp > price
    ? `${Math.round(((mrp - price) / mrp) * 100)}% off`
    : null;

  return (
    <div
      className={`relative rounded-xl border bg-white ${isYukiziChoice ? 'border-[#e2cbf5] shadow-[0_2px_15px_rgba(133,76,188,0.12)]' : 'border-gray-200'} flex w-[180px] min-w-[160px] flex-col p-3 transition-all hover:shadow-lg`}
    >
      {/* Top Badges */}
      <div className="relative z-10 mb-1 flex items-start justify-between">
        {isYukiziChoice && (
          <div className="pointer-events-none rounded-full bg-[#854cbc] px-2 py-0.5 text-[8px] font-bold text-white">
            New Arrival
          </div>
        )}
      </div>

      <div className="absolute left-2 top-7 z-10 cursor-pointer text-gray-300 hover:text-gray-500">
        <Share2 size={12} strokeWidth={2.5} />
      </div>

      <Link
        href={`/products/${generateProductSlug(prod.name || 'Product', prod.id || 'prod-' + index)}`}
        className="relative z-0 mb-3 mt-4 flex h-28 w-full items-center justify-center transition-transform group-hover:scale-105 block"
      >
        <img
          src={
            prod.image ||
            (prod.images && (typeof prod.images[0] === 'string' ? prod.images[0] : prod.images[0]?.url)) ||
            `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent((prod.name || 'PR').trim().split(/\s+/).length === 1 ? (prod.name || 'PR').trim().substring(0, 2).toUpperCase() : ((prod.name || 'PR').trim().split(/\s+/)[0][0] + (prod.name || 'PR').trim().split(/\s+/)[(prod.name || 'PR').trim().split(/\s+/).length - 1][0]).toUpperCase())}`
          }
          alt={prod.name}
          className="max-h-full max-w-full object-contain mix-blend-multiply"
        />
      </Link>

      <div className="mt-auto flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-1">
          <h3 className="flex-1 truncate text-[11px] font-medium text-gray-500">{prod.name}</h3>
          <div className="flex-shrink-0 cursor-pointer rounded-full bg-gray-400 p-[2px] transition-colors hover:bg-gray-500">
            <ArrowUpRight size={10} className="text-white" strokeWidth={3} />
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-[12px] font-bold text-gray-700">₹{prod.price}</span>
            {mrp && mrp > (price || 0) && (
              <span className="text-[9px] text-gray-300 line-through">
                ₹{mrp}
              </span>
            )}
          </div>
          {prod.rating && (
            <div className="flex items-center gap-0.5">
              <Star size={10} className="fill-[#854cbc] text-[#854cbc]" />
              <span className="text-[10px] font-bold text-gray-600">{prod.rating}</span>
            </div>
          )}
        </div>

        {discountText && <div className="mt-0.5 text-[8px] font-bold text-gray-400">{discountText}</div>}
      </div>
    </div>
  );
}

function ProductBannerCard({
  images,
  activeImageIndex,
  setActiveImageIndex,
  isBookmarked,
  onBookmarkToggle,
  productName,
  productId = '',
  productPrice = 0,
  variant = 'mobile',
}: {
  images: string[];
  activeImageIndex: number;
  setActiveImageIndex: (idx: number) => void;
  isBookmarked: boolean;
  onBookmarkToggle: () => void;
  productName: string;
  productId?: string;
  productPrice?: number;
  variant?: 'mobile' | 'desktop';
}) {
  const activeImage = images[activeImageIndex % images.length];
  const isDesktop = variant === 'desktop';

  return (
    <div 
      className="relative w-full aspect-[4/3] rounded-[24px] bg-gradient-to-br from-[#854dff] via-[#b336e8] to-[#ff2b9a] border border-purple-400/20 shadow-md flex items-center justify-center p-6 mt-4 lg:mt-0"
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
      <div className={`absolute ${isDesktop ? 'top-4 left-4' : '-top-3.5 -left-3.5'} z-30`}>
        <ShareButton 
          productName={productName}
          productId={productId}
          productPrice={productPrice}
          className={`p-3 bg-white rounded-full text-gray-500 focus:outline-none hover:scale-105 transition-transform ${
            isDesktop 
              ? "border border-gray-300 shadow-md hover:bg-gray-50 hover:text-purple-600" 
              : "border-0 shadow-none"
          }`}
          iconClassName="w-[18px] h-[18px]"
        />
      </div>

      {/* Vertical Thumbnails */}
      <div className={`absolute left-4 ${isDesktop ? 'top-1/2 -translate-y-1/2' : 'bottom-4'} flex flex-col gap-2 z-20`}>
        {images.slice(0, 3).map((img: string, idx: number) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveImageIndex(idx)}
            className={`w-11 h-11 rounded-lg overflow-hidden border-2 bg-white/15 backdrop-blur-sm shadow-sm transition-all duration-200 focus:outline-none ${
              activeImageIndex === idx ? 'border-orange-500 scale-105 shadow-md' : 'border-white/30 hover:border-white/60'
            }`}
          >
            <Image 
              src={img} 
              alt="" 
              width={44}
              height={44}
              className="w-full h-full object-cover" 
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="relative w-[80%] h-[80%] flex items-center justify-center">
        {activeImage && (
          <Image
            src={activeImage}
            alt={productName}
            fill
            className="object-contain hover:scale-105 transition-transform duration-500 p-2"
            priority
          />
        )}
      </div>

      {/* Ribbon Bookmark flag on the right edge */}
      <button
        type="button"
        onClick={onBookmarkToggle}
        className="absolute -right-[10px] top-[45%] z-20 focus:outline-none transition-transform hover:scale-105"
      >
        <svg
          width="44"
          height="40"
          viewBox="0 0 44 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible drop-shadow-sm"
        >
          <path
            d="M44 0 H0 L11 20 L0 40 H44 V0 Z"
            fill={isBookmarked ? "#854cbc" : "#ffffff"}
            stroke={isBookmarked ? "#854cbc" : "#9ca3af"}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

function ComparisonOffersList({
  comparisonListings,
  cartData,
  minOrderAmount,
  addToCart,
  updateCartItem,
  removeCartItem,
  productName,
  productMrp,
  toast,
  setShowStockAlert,
}: {
  comparisonListings: any[];
  cartData: any;
  minOrderAmount: number;
  addToCart: any;
  updateCartItem: any;
  removeCartItem: any;
  productName: string;
  productMrp: number;
  toast: any;
  setShowStockAlert: (val: boolean) => void;
}) {
  const cartItemMap = new Map<string, any>();
  if (cartData?.items) {
    cartData.items.forEach((item: any) => {
      if (item.productId) cartItemMap.set(item.productId, item);
    });
  }

  if (!comparisonListings || comparisonListings.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center text-xs font-semibold text-gray-400">
        No active offers available for this product.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {comparisonListings.map((listing: any, index: number) => {
        const inStock = (listing.stock ?? 0) > 0;
        const cartItem = cartItemMap.get(listing.id);
        const itemQty = cartItem?.quantity || 0;
        const sellerMoq = listing.moq || listing.minimumOrderQuantity || 1;
        const minQty = listing.price > 0
          ? Math.max(sellerMoq, Math.ceil(minOrderAmount / listing.price))
          : sellerMoq;

        const discountPercent = listing.discount || 25;

        const handleQtyChange = (newQty: number) => {
          if (cartItem) {
            if (newQty > 0) {
              updateCartItem.mutate({
                itemId: cartItem.id,
                quantity: newQty,
              });
            } else {
              removeCartItem.mutate(cartItem.id);
            }
          } else {
            if (newQty > 0) {
              addToCart.mutate({
                productId: listing.id,
                quantity: newQty,
                productName: productName,
                price: listing.price,
                mrp: productMrp,
              });
            }
          }
        };

        return (
          <div 
            key={listing.id} 
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100/80 hover:border-purple-200 transition-colors gap-3 w-full"
          >
            {/* Left: Discount Badge & Price */}
            <div className="flex items-center gap-3.5 min-w-0 sm:min-w-[155px] w-full sm:w-auto justify-between sm:justify-start">
              <div className="bg-[#854cbc] text-white px-2 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase leading-none min-w-[66px] text-center select-none">
                {discountPercent}% off
              </div>
              <div className="flex flex-col text-right sm:text-left">
                <span className="text-[15px] font-black text-gray-800 leading-none">
                  ₹{listing.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-gray-400 font-bold mt-1.5 leading-none">
                  {listing.moq > 1 ? `${listing.moq * 10}% off on purchase of ${listing.moq}` : 'MOQ: 1'}
                </span>
              </div>
            </div>

            {/* Middle: Star Rating & Delivery badge */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start border-t border-b border-gray-100/50 py-2 sm:border-0 sm:py-0">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#854cbc] text-[#854cbc]" />
                <span className="text-gray-800 font-black text-[12px] leading-none">{listing.seller?.rating || '4.5'}</span>
              </div>

              <DeliveryTruckBadge text={listing.deliveryText || '3 days'} className="w-[72px] h-auto text-gray-400" />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {inStock ? (
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
                      className={`px-3 h-full hover:bg-black/10 active:scale-95 transition-all text-white/80 hover:text-white font-extrabold text-sm ${itemQty === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                      onClick={() => itemQty > 0 && handleQtyChange(itemQty - 1)}
                      disabled={itemQty === 0}
                    >
                      -
                    </button>
                    <span className="px-1 font-bold">{String(itemQty).padStart(2, '0')}</span>
                    <button 
                      className="px-3 h-full hover:bg-black/10 active:scale-95 transition-all text-white/80 hover:text-white font-extrabold text-sm"
                      onClick={() => handleQtyChange(itemQty === 0 ? minQty : itemQty + 1)}
                    >
                      +
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[11px] font-bold text-red-500">Out of Stock</span>
                  <button 
                    onClick={() => setShowStockAlert(true)}
                    className="w-8.5 h-8.5 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center border border-red-100 active:scale-95 transition-all focus:outline-none"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReviewSubmissionForm({
  rating,
  setRating,
  reviewTitle,
  setReviewTitle,
  reviewComment,
  setReviewComment,
  onSubmit,
}: {
  rating: number;
  setRating: (r: number) => void;
  reviewTitle: string;
  setReviewTitle: (t: string) => void;
  reviewComment: string;
  setReviewComment: (c: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 border border-gray-200 rounded-2xl bg-white p-5 shadow-sm mt-6">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Your overall rating</h3>
      
      {/* Stars selector */}
      <div className="flex gap-1.5 text-gray-300">
        {[1, 2, 3, 4, 5].map((starVal) => (
          <button
            type="button"
            key={starVal}
            onClick={() => setRating(starVal)}
            className="focus:outline-none transition-transform active:scale-90"
          >
            <Star 
              size={28} 
              className={`transition-colors ${starVal <= rating ? 'fill-[#854cbc] text-[#854cbc]' : 'text-gray-300'}`} 
            />
          </button>
        ))}
      </div>

      {/* Review Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-gray-500 uppercase">Title of your review</label>
        <input
          type="text"
          value={reviewTitle}
          onChange={(e) => setReviewTitle(e.target.value)}
          placeholder="Summarize your review or highlight an interesting detail"
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-[#854cbc] focus:outline-none"
        />
      </div>

      {/* Review Comment */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-gray-500 uppercase">Your review</label>
        <textarea
          rows={3}
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          placeholder="Share your genuine thought about the product..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-[#854cbc] focus:outline-none resize-none"
        />
      </div>

      {/* Dropzone Photo Uploader */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-gray-500 uppercase">Do you have photos to share?</label>
        <div className="border border-dashed border-gray-300 rounded-xl bg-gray-50 p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100/70 transition-colors">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] text-gray-400 font-bold text-center">
            Drag & Drop your picture or <span className="text-[#854cbc] underline">Browse</span>
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <button 
        type="submit"
        className="w-full bg-[#854cbc] hover:bg-purple-800 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-wider shadow-sm transition-colors mt-2"
      >
        Submit Review
      </button>
    </form>
  );
}

const getMockReviewsForProduct = (productName: string, categoryName?: string) => {
  const cleanName = productName || 'product';
  const cleanCategory = categoryName || 'items';
  
  return [
    {
      id: 'mock-rev-1',
      userName: 'Amit Sharma',
      rating: 5,
      comment: `Extremely satisfied with the ${cleanName}! The quality is superb and it matches the description perfectly. Highly recommended if you are looking for reliable ${cleanCategory}.`,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-rev-2',
      userName: 'Priya Patel',
      rating: 4,
      comment: `Good purchase. The ${cleanName} works exactly as expected. Quick delivery and secure packaging. Will definitely buy more from this category.`,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];
};

export default function AnimeProductPage({ params }: { params: { productSlug: string } }) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantName, setSelectedVariantName] = useState<string>('');

  // Extract ID from slug
  const productSlugOrId = parseProductIdFromSlug(params.productSlug);

  const { data: productData, isLoading, isError } = useProductById(productSlugOrId);
  const { data: cartData } = useCart();
  const addToCart = useAddToCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();
  const { toast } = useToast();

  const { data: wishlistData } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const product = (productData as any)?.data || productData;

  const { data: reviewsData } = useProductReviews(product?.id || '');
  const { mutate: submitReview } = useCreateReview();

  const reviewsList = reviewsData?.data && reviewsData.data.length > 0
    ? reviewsData.data
    : getMockReviewsForProduct(product?.name || 'Product', product?.category?.name || 'Item');

  const averageRating = reviewsData?.averageRating || (reviewsData?.data && reviewsData.data.length > 0
    ? (reviewsData.data.reduce((acc: number, curr: any) => acc + curr.rating, 0) / reviewsData.data.length)
    : 4.5);

  const totalReviews = reviewsData?.total || (reviewsData?.data && reviewsData.data.length > 0 ? reviewsData.data.length : reviewsList.length);

  // Review state
  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [showStockAlert, setShowStockAlert] = useState(false);

  const { data: relatedProductsData } = useProducts({
    categoryId: product?.category?.id,
    limit: 6,
  });

  const productVariants = product?.variants || [];

  // Ensure first variant is selected by default
  useEffect(() => {
    if (productVariants.length > 0 && !selectedVariantName) {
      setSelectedVariantName(productVariants[0].name);
    }
  }, [productVariants, selectedVariantName]);

  const wishlistSet = new Set<string>();
  if (wishlistData?.items) {
    wishlistData.items.forEach((item: any) => {
      if (item.productId) wishlistSet.add(item.productId);
    });
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col bg-white pb-32">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#854cbc]" />
        </div>
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className="flex min-h-screen flex-col bg-white pb-32">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-xl font-bold text-gray-500">Product not found</div>
        </div>
      </main>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images.map((img: any) => img.url || img)
      : [
          `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent((product.name || 'PR').trim().split(/\s+/).length === 1 ? (product.name || 'PR').trim().substring(0, 2).toUpperCase() : ((product.name || 'PR').trim().split(/\s+/)[0][0] + (product.name || 'PR').trim().split(/\s+/)[(product.name || 'PR').trim().split(/\s+/).length - 1][0]).toUpperCase())}`,
        ];
  const listings = product.listings || [];
  const validListings = listings.filter((l: any) => l.price != null);
  const displayPrice =
    validListings.length > 0 ? Math.min(...validListings.map((l: any) => l.price)) : product.price;
  const displayMrp =
    validListings.find((l: any) => l.mrp || l.originalPrice)?.mrp ||
    validListings.find((l: any) => l.mrp || l.originalPrice)?.originalPrice ||
    product.mrp ||
    product.originalPrice;
  const relatedProducts = relatedProductsData?.data || [];

  // Filter listings based on the selected variant
  const filteredListings =
    productVariants.length > 0 && selectedVariantName
      ? listings.filter(
          (l: any) =>
            l.variantName === selectedVariantName ||
            l.name === selectedVariantName ||
            l.name?.includes(selectedVariantName),
        )
      : listings;

  const comparisonListings = filteredListings || [];

  // Wishlist / Bookmark logic
  const isBookmarked = wishlistSet.has(product.id);
  const handleBookmarkToggle = () => {
    if (isBookmarked) {
      removeFromWishlist.mutate(product.id, {
        onSuccess: () => toast('Removed from wishlist', 'success'),
      });
    } else {
      addToWishlist.mutate({
        productId: product.id,
        productName: product.name,
        price: displayPrice || 0,
        image: product.image || images[0],
      }, {
        onSuccess: () => toast('Added to wishlist!', 'success'),
      });
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast('Please select a rating star', 'error');
      return;
    }
    
    const comment = reviewTitle ? `${reviewTitle}: ${reviewComment}` : reviewComment;
    
    submitReview({
      productId: product.id,
      rating,
      comment,
    }, {
      onSuccess: () => {
        toast('Review submitted successfully!', 'success');
        setRating(0);
        setReviewTitle('');
        setReviewComment('');
      },
      onError: () => {
        toast('Failed to submit review', 'error');
      }
    });
  };

  return (
    <main className="min-h-screen bg-white pb-32">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .purple-scroll::-webkit-scrollbar { width: 5px; }
        .purple-scroll::-webkit-scrollbar-track { background: transparent; }
        .purple-scroll::-webkit-scrollbar-thumb { background: #854cbc; border-radius: 5px; }
      `,
        }}
      />

      <div className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 xl:px-12 2xl:max-w-[1600px]">
        
        {/* MOBILE VIEW LAYOUT */}
        <div className="block lg:hidden flex flex-col gap-5 w-full">
          {/* Banner Card */}
          <ProductBannerCard 
            images={images}
            activeImageIndex={activeImage}
            setActiveImageIndex={setActiveImage}
            isBookmarked={isBookmarked}
            onBookmarkToggle={handleBookmarkToggle}
            productName={product.name}
            productId={product.id}
            productPrice={displayPrice}
          />

          <hr className="border-gray-100" />

          {/* Product Title */}
          <h1 className="text-xl font-bold text-gray-800 leading-tight">
            {product.name}
          </h1>

          {/* 8-Row Comparison list */}
          <ComparisonOffersList 
            comparisonListings={comparisonListings}
            cartData={cartData}
            minOrderAmount={20000}
            addToCart={addToCart}
            updateCartItem={updateCartItem}
            removeCartItem={removeCartItem}
            productName={product.name}
            productMrp={displayMrp || displayPrice}
            toast={toast}
            setShowStockAlert={setShowStockAlert}
          />

          {/* Accordions */}
          <div className="mt-2">
            <Accordion
              title="DETAILS"
              content={product.description || 'No description available.'}
              defaultOpen={true}
            />
            <Accordion title="DESCRIPTION" />
            <Accordion title="SHIPPING & RETURN INFO" />
            <Accordion title="ADDITIONAL INFO" />
          </div>

          {/* Related Products */}
          <div className="mt-4 border-t border-gray-100 pt-6">
            <h2 className="mb-4 text-base font-bold text-gray-600 uppercase tracking-wider">Related Products</h2>
            <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-4">
              {relatedProducts.map((prod: any, idx: number) => (
                <RelatedProductCard key={prod.id} prod={prod} index={idx} />
              ))}
            </div>
          </div>

          {/* Reviews Summary Section */}
          <div className="mt-4 border-t border-gray-100 pt-6">
            <h2 className="mb-4 text-base font-bold text-gray-600 uppercase tracking-wider">Reviews</h2>
            <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="mb-1 flex items-center gap-3">
                  <div className="flex gap-1 text-[#854cbc]">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const fillPercent = Math.max(0, Math.min(100, (averageRating - (starVal - 1)) * 100));
                      return (
                        <div key={starVal} className="relative h-6 w-6">
                          <Star
                            size={24}
                            fill="none"
                            stroke="currentColor"
                            className="absolute text-[#854cbc]"
                          />
                          {fillPercent > 0 && (
                            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                              <Star size={24} fill="currentColor" className="text-[#854cbc]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[28px] font-black leading-none text-gray-800">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
                <p className="text-[13px] font-medium text-gray-400">
                  {averageRating.toFixed(1)} out of 5 stars (based on {totalReviews} review{totalReviews !== 1 ? 's' : ''})
                </p>
              </div>
            </div>

            {/* Review Cards Carousel */}
            <div className="hide-scrollbar flex flex-col gap-4 overflow-x-auto pb-2 sm:flex-row">
              {reviewsList.map((rev: any) => (
                <div key={rev.id} className="flex min-w-[240px] flex-1 flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="mb-4 text-[11px] font-medium leading-relaxed text-gray-500">
                    {rev.comment}
                  </p>
                  <div>
                    <div className="mb-1.5 flex gap-0.5 text-[#b165f1]">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={14} fill={i <= rev.rating ? "currentColor" : "none"} className={i <= rev.rating ? "text-[#b165f1]" : "text-gray-200"} />
                      ))}
                    </div>
                    <p className="text-[10px] font-semibold text-gray-400">
                      - {rev.userName || 'Anonymous'}, {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Review Submission Form */}
            <ReviewSubmissionForm 
              rating={rating}
              setRating={setRating}
              reviewTitle={reviewTitle}
              setReviewTitle={setReviewTitle}
              reviewComment={reviewComment}
              setReviewComment={setReviewComment}
              onSubmit={handleReviewSubmit}
            />
          </div>
        </div>

        {/* DESKTOP VIEW LAYOUT */}
        <div className="hidden lg:flex flex-col gap-6 w-full">
          {/* Header Row */}
          <div className="grid grid-cols-[1.15fr_1fr] gap-10 items-center mt-6">
            {/* Left Header */}
            <div className="flex items-center justify-between w-full">
              <div className="rounded-full bg-[#854cbc] px-4 py-1.5 text-[11px] font-bold tracking-wide text-white shadow-sm">
                Yukizi Choice
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase select-none">Ad</span>
            </div>

            {/* Right Header */}
            <div className="hide-scrollbar flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-gray-400">
              <Link href="/" className="transition-colors hover:text-[#854cbc]">
                Home
              </Link>
              <span>&gt;</span>
              {product.category && (
                <>
                  <Link
                    href={`/category/${product.category.slug || product.category.id}`}
                    className="transition-colors hover:text-[#854cbc]"
                  >
                    {product.category.name || 'Category'}
                  </Link>
                  <span>&gt;</span>
                </>
              )}
              {product.subCategory && (
                <>
                  <span className="cursor-pointer transition-colors hover:text-[#854cbc]">
                    {product.subCategory.name}
                  </span>
                  <span>&gt;</span>
                </>
              )}
              <span className="max-w-[200px] truncate text-gray-700">
                {product.name}
              </span>
            </div>
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-[1.15fr_1fr] gap-10 items-start">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              {/* Product Image Banner */}
              <ProductBannerCard 
                images={images}
                activeImageIndex={activeImage}
                setActiveImageIndex={setActiveImage}
                isBookmarked={isBookmarked}
                onBookmarkToggle={handleBookmarkToggle}
                productName={product.name}
                productId={product.id}
                productPrice={displayPrice}
                variant="desktop"
              />

              {/* Accordions */}
              <div className="pr-2">
                <Accordion
                  title="DESCRIPTION"
                  content={product.description || 'No description available.'}
                  defaultOpen={true}
                />
                <Accordion title="PRODUCT SPECIFICATIONS" />
                <Accordion title="SHIPPING & RETURN INFO" />
                <Accordion title="ADDITIONAL INFO" />
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col">
              {/* Title Block */}
              <div className="flex items-start justify-between w-full mb-3">
                <h1 className="text-2xl font-semibold text-gray-500 tracking-tight leading-tight max-w-[85%]">
                  {product.name}
                </h1>
              </div>

              {/* Price details */}
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-[26px] font-semibold text-gray-700 leading-none">
                  ₹{displayPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                {displayMrp && displayMrp > displayPrice && (
                  <span className="text-[13px] font-bold text-gray-400 line-through leading-none">
                    ₹{displayMrp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>

              {/* Discount / rating line */}
              <div className="flex items-center justify-between w-full border-b border-gray-100 pb-5 mb-5">
                <span className="text-[14px] font-semibold text-gray-700 select-none">
                  {displayMrp && displayPrice && displayMrp > displayPrice
                    ? `${Math.round(((displayMrp - displayPrice) / displayMrp) * 100)}% off`
                    : '25% off'}
                </span>
                
                <div className="flex items-center gap-4">
                  <DeliveryTruckBadge text="3 days" className="w-[72px] h-auto text-gray-400" />
                  <div className="flex items-center gap-1">
                    <Star className="w-4.5 h-4.5 fill-[#854cbc] text-[#854cbc]" />
                    <span className="text-[13px] font-semibold text-gray-800">{averageRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* 8-row comparison list */}
              <ComparisonOffersList 
                comparisonListings={comparisonListings}
                cartData={cartData}
                minOrderAmount={20000}
                addToCart={addToCart}
                updateCartItem={updateCartItem}
                removeCartItem={removeCartItem}
                productName={product.name}
                productMrp={displayMrp || displayPrice}
                toast={toast}
                setShowStockAlert={setShowStockAlert}
              />
            </div>
          </div>

          {/* Bottom Section: Related Products & Reviews */}
          <div className="grid grid-cols-[1.15fr_1fr] gap-10 border-t border-gray-100 pt-8 mt-6">
            {/* Left: Related Products */}
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wider">Related Products</h2>
              <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-4">
                {relatedProducts.map((prod: any, idx: number) => (
                  <RelatedProductCard key={prod.id} prod={prod} index={idx} />
                ))}
              </div>
            </div>

            {/* Right: Reviews */}
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wider mb-4">Reviews</h2>
              
              <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="mb-1 flex items-center gap-3">
                    <div className="flex gap-1 text-[#854cbc]">
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const fillPercent = Math.max(0, Math.min(100, (averageRating - (starVal - 1)) * 100));
                        return (
                          <div key={starVal} className="relative h-6 w-6">
                            <Star
                              size={24}
                              fill="none"
                              stroke="currentColor"
                              className="absolute text-[#854cbc]"
                            />
                            {fillPercent > 0 && (
                              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                                <Star size={24} fill="currentColor" className="text-[#854cbc]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-[28px] font-black leading-none text-gray-800">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-gray-400">
                    {averageRating.toFixed(1)} out of 5 stars (based on {totalReviews} review{totalReviews !== 1 ? 's' : ''})
                  </p>
                </div>
              </div>

              {/* Review Cards Carousel */}
              <div className="hide-scrollbar flex flex-col gap-4 overflow-x-auto pb-2 sm:flex-row">
                {reviewsList.map((rev: any) => (
                  <div key={rev.id} className="flex min-w-[240px] flex-1 flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="mb-4 text-[11px] font-medium leading-relaxed text-gray-500">
                      {rev.comment}
                    </p>
                    <div>
                      <div className="mb-1.5 flex gap-0.5 text-[#b165f1]">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} size={14} fill={i <= rev.rating ? "currentColor" : "none"} className={i <= rev.rating ? "text-[#b165f1]" : "text-gray-200"} />
                        ))}
                      </div>
                      <p className="text-[10px] font-semibold text-gray-400">
                        - {rev.userName || 'Anonymous'}, {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Review Submission Form */}
              <ReviewSubmissionForm 
                rating={rating}
                setRating={setRating}
                reviewTitle={reviewTitle}
                setReviewTitle={setReviewTitle}
                reviewComment={reviewComment}
                setReviewComment={setReviewComment}
                onSubmit={handleReviewSubmit}
              />
            </div>
          </div>
        </div>

      </div>
      <Navbar />
    </main>
  );
}
