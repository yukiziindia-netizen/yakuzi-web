'use client';

import { useState, useEffect, useRef } from 'react';
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
  RotateCw,
  Minus,
  Search,
  User,
  Bookmark,
  ShoppingCart,
  Package,
  Filter,
  Menu,
  Eye,
  Loader2,
  CheckCircle,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { productImageAlt } from '@/lib/seo/image-alt';
import { trackProductView } from '@/lib/analytics/tracker';
import Link from 'next/link';
import { useProductById, useProducts, useWaitlist, useAddToWaitlist, useRemoveFromWaitlist } from '@/hooks/useProducts';
import { useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { useToast } from '@/components/shared/Toast';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useProductReviews, useCreateReview, useReviewEligibility } from '@/hooks/useReviews';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { uploadReviewImage, useAuth } from '@yukizi/api-client';
import Navbar from '@/components/landing/Navbar';
import { generateProductSlug, parseProductIdFromSlug, calculatePricing } from '@yukizi/utils';
import { ShareButton } from '@/components/shared/ShareButton';
import WishlistIcon from '@/components/shared/WishlistIcon';
import { NotifyStockAlertModal } from '@/components/shared/NotifyStockAlertModal';
import { useScrollLock } from '@/hooks/useScrollLock';
import { renderBuyerOfferBadge, GridProductCard } from '@/components/landing/ProductCarousel';

const SHIPPING_RETURN_INFO =
  'Shipping: Orders are shipped within 3–7 business days.\n\n' +
  'Returns/Refunds: Returns or refunds are accepted only if the product delivered is wrong or damaged. A ticket must be raised within 48 hours of delivery, along with a clear unboxing video as proof.';

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
        className="flex w-full items-center justify-between text-left text-xs sm:text-sm xl:text-sm 2xl:text-base font-normal uppercase tracking-wider text-gray-500 focus:outline-none"
      >
        {title}
        {isOpen ? (
          <Minus size={14} className="text-gray-500" strokeWidth={3} />
        ) : (
          <Plus size={14} className="text-gray-500" strokeWidth={3} />
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
            <div className="purple-scroll relative max-h-[70px] overflow-y-auto whitespace-pre-line pr-4 pt-2 text-xs sm:text-sm xl:text-sm 2xl:text-base font-normal leading-relaxed text-gray-500">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// Shared by the mobile and desktop layouts so the two trails can't drift apart.
function ProductBreadcrumbs({
  product,
  className = '',
}: {
  product: any;
  className?: string;
}) {
  const categoryHref = product?.category
    ? `/category/${product.category.slug || product.category.id}`
    : null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`hide-scrollbar flex items-center gap-1 overflow-x-auto whitespace-nowrap font-normal text-gray-600 ${className}`}
    >
      <Link href="/" className="transition-colors hover:text-[#854cbc] text-gray-600">
        Home
      </Link>
      {categoryHref && (
        <>
          <span className="text-gray-400 mx-1">&gt;</span>
          <Link
            href={categoryHref}
            className="transition-colors hover:text-[#854cbc] text-gray-600"
          >
            {product.category.name || 'Category'}
          </Link>
        </>
      )}
      {product?.subCategory?.name && (
        <>
          <span className="text-gray-400 mx-1">&gt;</span>
          {/* Was a plain span, so the middle of the trail was a dead step:
              Home and the category linked, the sub-collection did not. The
              category page reads ?sub= off the query string, so there is a
              real page to point at. */}
          {categoryHref && product.subCategory.slug ? (
            <Link
              href={`${categoryHref}?sub=${product.subCategory.slug}`}
              className="transition-colors hover:text-[#854cbc] text-gray-600"
            >
              {product.subCategory.name}
            </Link>
          ) : (
            <span className="text-gray-600">{product.subCategory.name}</span>
          )}
        </>
      )}
      {product?.name && (
        <>
          <span className="text-gray-400 mx-1">&gt;</span>
          <span className="max-w-[200px] truncate text-gray-700">{product.name}</span>
        </>
      )}
    </nav>
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
  altOverrides,
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
  altOverrides?: Record<string, string>;
}) {
  const activeImage = images[activeImageIndex % images.length];
  const isDesktop = variant === 'desktop';
  const [isZoomed, setIsZoomed] = useState(false);

  useScrollLock(isZoomed);

  useEffect(() => {
    if (!isZoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsZoomed(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isZoomed]);

  return (
    <div className="relative w-full aspect-[4/3] rounded-[24px] bg-transparent flex items-center justify-center p-0 mt-4 lg:mt-0 border border-gray-200/80 shadow-md">
      {/* Share Button on Top Left Corner */}
      <div className="absolute top-4 left-4 z-30">
        <ShareButton
          productName={productName}
          productId={productId}
          productPrice={productPrice}
          className="p-2 bg-white rounded-full text-gray-600 focus:outline-none hover:scale-105 transition-all shadow-md hover:text-purple-600 border-none"
          iconClassName="w-4 h-4"
        />
      </div>

      {/* Vertical Thumbnails at bottom left side */}
      <div className="absolute left-3 lg:left-6 bottom-3 lg:bottom-6 flex flex-col gap-2 z-20">
        {images.slice(0, 3).map((img: string, idx: number) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveImageIndex(idx)}
            className={`rounded-xl overflow-hidden border bg-white/20 backdrop-blur-md shadow-md transition-all duration-200 focus:outline-none w-10 h-10 sm:w-12 sm:h-12 lg:w-[72px] lg:h-[72px] ${activeImageIndex === idx ? 'border-white/90 scale-105 shadow-lg' : 'border-white/30 hover:border-white/60'
              }`}
          >
            <Image
              src={img}
              alt={productImageAlt(productName, altOverrides?.[img], idx)}
              width={72}
              height={72}
              className="w-full h-full object-contain"
            />
          </button>
        ))}
      </div>

      {/* Main Image. Sits under the thumbnails/share/ribbon, which carry their own
          z-index, so clicking those never opens the zoom. */}
      <div className="absolute inset-0 w-full h-full rounded-[24px] overflow-hidden p-4 sm:p-6 bg-white">
        {activeImage && (
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            aria-label="Zoom in on the product image"
            className="relative w-full h-full block cursor-zoom-in focus:outline-none"
          >
            <Image
              src={activeImage}
              alt={productImageAlt(productName, altOverrides?.[activeImage], activeImageIndex % images.length)}
              fill
              className="object-contain hover:scale-105 transition-transform duration-500"
              priority
            />
          </button>
        )}
      </div>

      {/* Ribbon Bookmark flag on the right edge */}
      <button
        type="button"
        onClick={onBookmarkToggle}
        className={`absolute -right-[15px] sm:-right-[15px] ${isDesktop ? 'top-[45%]' : 'top-1/2 -translate-y-1/2'} z-30 focus:outline-none transition-transform hover:scale-105`}
      >
        <svg
          width="30"
          height="24"
          viewBox="0 0 30 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible drop-shadow-md"
        >
          <path
            d="M0 0 H30 V24 H0 L8 12 Z"
            fill={isBookmarked ? "#7B2FBE" : "#ffffff"}
            stroke="#7B2FBE"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Zoomed view. Rendered from inside the card so the mobile and desktop
          layouts both get it without a second copy. */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${productName} enlarged`}
            className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center gap-4 p-4 sm:p-8 cursor-zoom-out"
          >
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              aria-label="Close the enlarged image"
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl flex-1 max-h-[75vh] cursor-default"
            >
              <Image
                src={activeImage}
                alt={productImageAlt(productName, altOverrides?.[activeImage], activeImageIndex % images.length)}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </motion.div>

            {images.length > 1 && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 shrink-0"
              >
                {images.slice(0, 6).map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`Show image ${idx + 1}`}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all focus:outline-none ${
                      activeImageIndex % images.length === idx
                        ? 'border-white scale-105'
                        : 'border-white/30 hover:border-white/60'
                    }`}
                  >
                    <Image
                      src={img}
                      alt=""
                      width={56}
                      height={56}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
  productImage,
  variant = 'mobile',
  productGstPercent,
  productShippingCharges,
  productIsTaxIncluded,
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
  productImage?: string;
  variant?: 'mobile' | 'desktop';
  productGstPercent?: number;
  productShippingCharges?: number;
  productIsTaxIncluded?: boolean;
}) {
  const cartItemMap = new Map<string, any>();
  if (cartData?.items) {
    cartData.items.forEach((item: any) => {
      if (item.productId) cartItemMap.set(item.productId, item);
    });
  }

  const isDesktop = variant === 'desktop';

  // No sellers at all. The page still exists and still ranks — catalog products
  // are never deleted, so a listing that earned its position keeps it while it
  // waits for a seller to return. Give that traffic somewhere to go: joining the
  // waitlist here notifies the buyer the moment any seller lists the product
  // again (products.service notifies waitlisted users on new listing / restock).
  if (!comparisonListings || comparisonListings.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center flex flex-col items-center gap-3">
        <p className="text-xs font-semibold text-gray-400">
          No active Sellers available for this product.
        </p>
        <button
          type="button"
          onClick={() => setShowStockAlert(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-transform active:scale-95 hover:opacity-90"
        >
          <Bell className="w-4 h-4" strokeWidth={2.25} />
          Notify me when available
        </button>
        <p className="text-2xs sm:text-xs text-gray-400 font-medium">
          We&apos;ll email you as soon as a seller lists it again.
        </p>
      </div>
    );
  }

  return (
    <div className={isDesktop ? "flex flex-col gap-2 w-full max-h-[340px] overflow-y-auto overflow-x-hidden pr-1 purple-scrollbar" : "flex flex-col gap-3 w-full"}>
      {comparisonListings.map((listing: any, index: number) => {
        const inStock = (listing.stock ?? 0) > 0;
        const cartItem = cartItemMap.get(listing.id);
        const itemQty = cartItem?.quantity || 0;
        const sellerMoq = listing.moq || listing.minimumOrderQuantity || 1;
        const minQty = sellerMoq;

        // discountPercent not needed here — renderBuyerOfferBadge(listing) handles all discount types correctly

        const pricing = calculatePricing(
          Number(listing.mrp || listing.originalPrice || productMrp || 0),
          Number(listing.gstPercent ?? productGstPercent ?? 0),
          {
            type: listing.discountType || (listing.discountMeta?.discountPercent ? 'ptr_discount' : 'none'),
            discountPercent: listing.discountMeta?.discountPercent,
            specialPrice: listing.discountMeta?.specialPrice,
            buy: listing.discountMeta?.buy,
            get: listing.discountMeta?.get,
            bonusProductName: listing.discountMeta?.bonusProductName,
            shippingCharges: listing.finalShippingPrice ?? listing.shippingCharges ?? productShippingCharges ?? 0,
            shippingGstPercent: 0,
            isTaxIncluded: true,
          }
        );

        const handleQtyChange = (newQty: number) => {
          const stock = listing.stock ?? 9999;
          const maxLimit = listing.maximumOrderQuantity ?? stock;
          const max = Math.min(stock, maxLimit);
          if (newQty > max) {
            toast(`Only ${max} units available`, 'error');
            return;
          }
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
                price: pricing.finalCustomerPayable,
                mrp: listing.mrp || listing.originalPrice || productMrp,
                image: productImage,
                imageUrl: productImage,
                images: productImage ? [productImage] : [],
                // Without these the cart has no idea what the ceiling is and
                // lets the quantity be raised past the stock that exists.
                stock: listing.stock,
                maximumOrderQuantity: listing.maximumOrderQuantity,
              });
            }
          }
        };

        const getListingDiscountText = (listing: any) => {
          const meta = listing.discountMeta || {};
          if (!listing?.discountType) {
            if (meta.discountPercent) {
              return `${meta.discountPercent}% off`;
            }
            return null;
          }
          if (listing.discountType === "PTR_DISCOUNT") {
            return `${meta.discountPercent || 0}% off`;
          }
          if (listing.discountType === "SAME_PRODUCT_BONUS") {
            return `Buy ${meta.buy || 0} Get ${meta.get || 0} Free`;
          }
          if (listing.discountType === "PTR_PLUS_SAME_PRODUCT_BONUS") {
            return `${meta.discountPercent || 0}% off`;
          }
          if (listing.discountType === "DIFFERENT_PRODUCT_BONUS") {
            return `Buy ${meta.buy || 0} Get ${meta.get || 0} Free`;
          }
          if (listing.discountType === "PTR_PLUS_DIFFERENT_PRODUCT_BONUS") {
            return `${meta.discountPercent || 0}% off`;
          }
          if (listing.discountType === "SPECIAL_PRICE") {
            return `Special Price`;
          }
          return listing.discountType.replace(/_/g, ' ');
        };

        const getListingSubtext = (listing: any) => {
          const meta = listing.discountMeta || {};
          if (listing.discountType === "PTR_PLUS_SAME_PRODUCT_BONUS" || listing.discountType === "SAME_PRODUCT_BONUS") {
            return `${meta.discountPercent || 0}% off on purchase of ${meta.buy || 3}`;
          }
          if (listing.moq > 1) {
            return `Min. purchase of ${listing.moq}`;
          }
          return '';
        };

        const discountText = getListingDiscountText(listing);
        const subText = getListingSubtext(listing);

        return (
          <div
            key={listing.id}
            className="transition-colors w-full bg-[#eaeaea] border border-gray-200/60 hover:border-purple-200 shadow-sm flex items-center justify-between py-1 px-2.5 sm:py-1.5 sm:px-4 xl:py-2 xl:px-6 rounded-[6px]"
          >
            {/* 1. Price & Subtext */}
            <div className="flex flex-col items-start justify-center min-w-[40px] sm:min-w-[56px] md:min-w-[64px] xl:min-w-[72px] 2xl:min-w-[80px] text-left">
              <span className="text-xs sm:text-base md:text-lg xl:text-xl 2xl:text-xl font-medium text-gray-800 leading-none tracking-tight">
                ₹{Math.round(pricing.finalCustomerPayable).toLocaleString('en-IN')}
              </span>
              {subText && (
                <span className="text-2xs sm:text-xs xl:text-sm 2xl:text-sm text-gray-500 font-medium mt-1 leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                  {subText}
                </span>
              )}
            </div>

            {/* 2. Star Rating */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 xl:w-5 xl:h-5 2xl:w-5.5 2xl:h-5.5 fill-[#854cbc] text-[#854cbc] flex-shrink-0" />
              <span className="text-gray-800 font-bold text-xs sm:text-sm md:text-base xl:text-lg 2xl:text-xl leading-none">
                {listing.seller?.rating ? listing.seller.rating : 'NA'}
              </span>
            </div>

            {/* 3. Discount Badge */}
            <div className="flex-shrink-0 min-w-0">
              {discountText ? (
                <div className="bg-[#854cbc] text-white px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 xl:px-3 xl:py-1 2xl:px-3.5 2xl:py-1 rounded font-bold tracking-wide whitespace-nowrap flex items-center justify-center gap-0.5 sm:gap-1 shadow-sm">
                  {discountText.split(' ').map((part: string, pIdx: number) => (
                    <span
                      key={pIdx}
                      className={
                        pIdx === 0
                          ? "text-2xs sm:text-sm xl:text-sm 2xl:text-base font-bold"
                          : "text-2xs sm:text-2xs xl:text-xs 2xl:text-xs font-medium opacity-90"
                      }
                    >
                      {part}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="w-[10px]" />
              )}
            </div>

            {/* 4. Actions (Plus / Incremental / Reset) */}
            <div className="flex items-center justify-end flex-shrink-0">
              {inStock ? (
                itemQty === 0 ? (
                  <button
                    onClick={() => handleQtyChange(minQty)}
                    className="text-black hover:text-black/80 focus:outline-none transition-transform active:scale-90 p-0.5"
                  >
                    <Plus className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 xl:w-6.5 xl:h-6.5 2xl:w-7 2xl:h-7" strokeWidth={3} />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 sm:gap-3 xl:gap-4">
                    {/* Reset Button */}
                    <button
                      onClick={() => { handleQtyChange(0); toast('Quantity reset', 'info'); }}
                      title="Reset quantity"
                      className="text-[#48286b] hover:text-purple-900 transition-transform active:scale-90 focus:outline-none p-0.5"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 xl:w-5.5 xl:h-5.5 2xl:w-6 2xl:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85 1.05 6.5 2.5L21 8" />
                        <path d="M21 3v5h-5" />
                      </svg>
                    </button>

                    {/* Quantity Control Pill */}
                    <div className="flex items-center bg-[#48286b] rounded-[8px] overflow-hidden h-6 w-[60px] sm:h-7.5 sm:w-24 md:h-8 md:w-26 xl:h-8.5 xl:w-30 2xl:h-9 2xl:w-34 text-white shadow-sm select-none justify-between px-1 sm:px-2 xl:px-3">
                      <button
                        className="w-4 sm:w-8 h-full flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all text-white font-bold text-2xs sm:text-lg xl:text-xl 2xl:text-2xl pb-0.5"
                        onClick={() => handleQtyChange(itemQty - 1)}
                      >
                        -
                      </button>
                      <span className="font-bold text-2xs sm:text-sm xl:text-base 2xl:text-lg tracking-wide">{String(itemQty).padStart(2, '0')}</span>
                      <button
                        className="w-4 sm:w-8 h-full flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all text-white font-bold text-2xs sm:text-lg xl:text-xl 2xl:text-2xl pb-0.5 disabled:opacity-50"
                        disabled={itemQty >= (listing.stock ?? 9999)}
                        onClick={() => handleQtyChange(itemQty + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              ) : (
                // Out of stock: the bell alone stands in for the label, sized and
                // coloured like the in-stock Plus so the row never shifts.
                <button
                  onClick={() => setShowStockAlert(true)}
                  title="Out of stock — notify me when it is back"
                  aria-label="Out of stock — notify me when it is back"
                  className="text-black hover:text-black/80 focus:outline-none transition-transform active:scale-90 p-0.5"
                >
                  <Bell className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 xl:w-6.5 xl:h-6.5 2xl:w-7 2xl:h-7" strokeWidth={2.25} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const REVIEW_BLOCK_MESSAGE: Record<'NOT_PURCHASED' | 'ALREADY_REVIEWED', string> = {
  NOT_PURCHASED: 'You can only review a product you have purchased.',
  ALREADY_REVIEWED: "You've already reviewed this product.",
};

function ReviewSubmissionForm({
  rating,
  setRating,
  reviewTitle,
  setReviewTitle,
  reviewComment,
  setReviewComment,
  reviewImages,
  setReviewImages,
  onSubmit,
  blockedReason,
}: {
  rating: number;
  setRating: (r: number) => void;
  reviewTitle: string;
  setReviewTitle: (t: string) => void;
  reviewComment: string;
  setReviewComment: (c: string) => void;
  reviewImages: string[];
  setReviewImages: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmit: (e: React.FormEvent) => void;
  blockedReason?: 'NOT_PURCHASED' | 'ALREADY_REVIEWED' | null;
}) {
  const { toast } = useToast();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blockedMessage = blockedReason ? REVIEW_BLOCK_MESSAGE[blockedReason] : null;

  const handleStarClick = (starVal: number) => {
    // Tell them up front, at the point they start rating, rather than only
    // after they've written a whole review and hit submit.
    if (blockedMessage) {
      toast(blockedMessage, 'error');
      return;
    }
    setRating(starVal);
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    try {
      const fileList = Array.from(files);
      for (const file of fileList) {
        if (!file.type.startsWith('image/')) {
          toast('Please select an image file', 'error');
          continue;
        }
        const res = await uploadReviewImage(file);
        const url = res.url;
        if (url) {
          setReviewImages((prev) => [...prev, url]);
          toast('Photo uploaded successfully!', 'success');
        }
      }
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setReviewImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 border border-gray-200 rounded-2xl bg-white p-5 shadow-sm mt-6">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Your overall rating</h3>

      {blockedMessage && (
        <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {blockedMessage}
        </p>
      )}

      {/* Stars selector */}
      <div className="flex gap-1.5 text-gray-300">
        {[1, 2, 3, 4, 5].map((starVal) => (
          <button
            type="button"
            key={starVal}
            onClick={() => handleStarClick(starVal)}
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
        <label className="text-xs font-bold text-gray-500 uppercase">Title of your review</label>
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
        <label className="text-xs font-bold text-gray-500 uppercase">Your review</label>
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
        <label className="text-xs font-bold text-gray-500 uppercase">Do you have photos to share?</label>
        
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
          }}
          className={`border border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            isDragging
              ? 'border-[#854cbc] bg-purple-50/80'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100/70'
          }`}
        >
          {isUploadingImage ? (
            <Loader2 className="w-7 h-7 text-[#854cbc] animate-spin" />
          ) : (
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          <span className="text-2xs text-gray-400 font-bold text-center">
            {isUploadingImage ? (
              <span className="text-[#854cbc]">Uploading photo...</span>
            ) : (
              <>Drag & Drop your picture or <span className="text-[#854cbc] underline">Browse</span></>
            )}
          </span>
        </div>

        {/* Uploaded Image Previews */}
        {reviewImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {reviewImages.map((imgUrl, idx) => (
              <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 group">
                <Image src={imgUrl} alt={`Review photo ${idx + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(idx);
                  }}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!!blockedMessage}
        onClick={(e) => {
          if (blockedMessage) {
            e.preventDefault();
            toast(blockedMessage, 'error');
          }
        }}
        className="w-full bg-[#854cbc] hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl py-3 text-xs font-bold uppercase tracking-wider shadow-sm transition-colors mt-2"
      >
        Submit Review
      </button>
    </form>
  );
}

export default function ProductPageClient({ productSlug, initialProduct, imageAltOverrides }: { productSlug: string; initialProduct?: any; imageAltOverrides?: Record<string, string> }) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantName, setSelectedVariantName] = useState<string>('');

  // Extract ID from slug
  const productSlugOrId = parseProductIdFromSlug(productSlug);

  const { data: productData, isLoading, isError } = useProductById(productSlugOrId, initialProduct ? { initialData: initialProduct } : {});
  const { data: cartData } = useCart();
  const addToCart = useAddToCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();
  const { toast } = useToast();
  const { data: config } = usePlatformConfig();
  const minOrderAmount = config?.min_order_amount ?? 0;

  const { data: wishlistData } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const product = (productData as any)?.data || productData;

  // Analytics: one product_view per product landed on (id, not slug — the
  // admin product reports join on the catalog id).
  useEffect(() => {
    if (product?.id) trackProductView(product.id);
  }, [product?.id]);

  const { data: userProfile } = useBuyerProfile();
  const { isAuthenticated } = useAuth();
  const { data: reviewsData } = useProductReviews(product?.id || '');
  const { mutate: submitReview } = useCreateReview();
  const { data: reviewEligibility } = useReviewEligibility(product?.id || '');

  // Review state
  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showStockAlert, setShowStockAlert] = useState(false);

  // POST /products/:id/notify-me is buyer-authenticated, so a guest submitting
  // the modal would just get a 401 toast. Send them to the login popup instead
  // and let them come back to it.
  const openStockAlert = (open: boolean) => {
    if (open && !isAuthenticated) {
      window.dispatchEvent(new Event('open-login'));
      return;
    }
    setShowStockAlert(open);
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    try {
      const fileList = Array.from(files);
      for (const file of fileList) {
        if (!file.type.startsWith('image/')) {
          toast('Please select an image file', 'error');
          continue;
        }
        const res = await uploadReviewImage(file);
        const url = res.url;
        if (url) {
          setReviewImages((prev) => [...prev, url]);
          toast('Photo uploaded successfully!', 'success');
        }
      }
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setReviewImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

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
      <main className="flex min-h-screen flex-col bg-gray-50 pb-32">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#854cbc]" />
        </div>
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className="flex min-h-screen flex-col bg-gray-50 pb-32">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-xl font-bold text-gray-500">Product not found</div>
        </div>
      </main>
    );
  }

  // Calculated variables safe to declare now that product is guaranteed to exist:
  const isYukiziChoice = !!product.isYukiziChoice || !!product.isNew;
  const isBestSeller = !!product.isBestSeller;
  const isAd = isYukiziChoice || isBestSeller;

  const unwrapImage = (img: any): string => (typeof img === 'string' ? img : img?.url || '');

  const images =
    product.images && product.images.length > 0
      ? product.images.map(unwrapImage).filter(Boolean)
      : [
        `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent((product.name || 'PR').trim().split(/\s+/).length === 1 ? (product.name || 'PR').trim().substring(0, 2).toUpperCase() : ((product.name || 'PR').trim().split(/\s+/)[0][0] + (product.name || 'PR').trim().split(/\s+/)[(product.name || 'PR').trim().split(/\s+/).length - 1][0]).toUpperCase())}`,
      ];

  const selectedVariant = productVariants.find((v: any) => v.name === selectedVariantName);

  const listings = product.listings || product.sellerOffers || product.offers || [];
  const validListings = listings.filter((l: any) => l.price != null || l.mrp != null);
  const relatedProducts = relatedProductsData?.data || [];

  // Filter listings based on the selected variant
  const filteredListings =
    productVariants.length > 0 && selectedVariantName
      ? validListings.filter(
        (l: any) =>
          l.variantName === selectedVariantName ||
          l.name === selectedVariantName ||
          l.name?.includes(selectedVariantName),
      )
      : validListings;

  // Sellers are ordered by their rating, so the best-reviewed one leads the list
  // and is what the page defaults to. Price only separates sellers whose ratings
  // are equal. Unrated sellers (rating 0 or absent — the rows showing NA) sort
  // last rather than being scattered through the list.
  //
  // Copied before sorting: the source array is derived from the product query's
  // cached data, which must not be reordered in place.
  const comparisonListings = [...(filteredListings || [])].sort((a: any, b: any) => {
    const ratingOf = (l: any) => Number(l?.seller?.rating) || 0;
    const priceOf = (l: any) => {
      const value = Number(l?.price ?? l?.mrp);
      return Number.isFinite(value) && value > 0 ? value : Infinity;
    };
    return ratingOf(b) - ratingOf(a) || priceOf(a) - priceOf(b);
  });

  let displayImages = [...images];
  const rawVariantImages = selectedVariant?.images?.length > 0
    ? selectedVariant.images
    : (selectedVariant?.image 
      ? [selectedVariant.image] 
      : (comparisonListings[0]?.images?.length > 0 
        ? comparisonListings[0].images 
        : (comparisonListings[0]?.image ? [comparisonListings[0].image] : [])));

  const variantImages = (rawVariantImages || []).map(unwrapImage).filter(Boolean);
  if (variantImages.length > 0) {
    // A selected variant shows only ITS OWN photos, not the full product
    // gallery — mixing in every other variant's images made the thumbnail
    // rail show pictures that didn't match what was actually selected.
    displayImages = variantImages;
  }

  // A product with one photo used to have it repeated until there were three,
  // which put the same thumbnail in the rail three times and read as three
  // different pictures. Show only the photos that exist.

  // Real reviews only. This used to fall back to getMockReviewsForProduct(),
  // which put two invented reviewers and a 4.5 average on every product that
  // had never been reviewed.
  const reviewsList = reviewsData?.data && reviewsData.data.length > 0
    ? reviewsData.data
    : [];

  const hasReviews = reviewsList.length > 0;

  const averageRating = hasReviews
    ? (reviewsData?.averageRating ||
        reviewsList.reduce((acc: number, curr: any) => acc + curr.rating, 0) / reviewsList.length)
    : 0;

  const totalReviews = hasReviews ? (reviewsData?.total || reviewsList.length) : 0;

  let bestPricing: any = null;
  if (comparisonListings.length > 0) {
    let minPayable = Infinity;
    for (const listing of comparisonListings) {
      const listingMrp = Number(listing.mrp || listing.originalPrice || product.mrp || product.originalPrice || 0);
      if (listingMrp > 0) {
        const pricing = calculatePricing(
          listingMrp,
          Number(listing.gstPercent ?? product.gstPercent ?? 0),
          {
            type: listing.discountType || (listing.discountMeta?.discountPercent ? 'ptr_discount' : 'none'),
            discountPercent: listing.discountMeta?.discountPercent,
            specialPrice: listing.discountMeta?.specialPrice,
            buy: listing.discountMeta?.buy,
            get: listing.discountMeta?.get,
            bonusProductName: listing.discountMeta?.bonusProductName,
            shippingCharges: listing.finalShippingPrice ?? listing.shippingCharges ?? product.shippingCharges ?? 0,
            shippingGstPercent: 0,
            isTaxIncluded: true,
          }
        );
        if (pricing.finalCustomerPayable < minPayable) {
          minPayable = pricing.finalCustomerPayable;
          bestPricing = pricing;
        }
      } else if (listing.price != null && Number(listing.price) > 0 && Number(listing.price) < minPayable) {
        minPayable = Number(listing.price);
        bestPricing = { finalCustomerPayable: Number(listing.price) };
      }
    }
  }

  // If selected variant has no listings, compute overall best price from validListings
  let overallBestPrice = 0;
  if (validListings.length > 0) {
    const candidatePrices = validListings
      .map((l: any) => Number(l.price ?? l.basePrice ?? l.mrp ?? 0))
      .filter((p: number) => !isNaN(p) && p > 0);
    if (candidatePrices.length > 0) {
      overallBestPrice = Math.min(...candidatePrices);
    }
  }

  const rawFallbackPrice = product.price ?? product.finalCustomerPayable ?? product.mrp ?? product.originalPrice ?? overallBestPrice;
  const fallbackPriceVal = Number(rawFallbackPrice);
  const displayPrice = (bestPricing && bestPricing.finalCustomerPayable > 0) 
    ? Number(bestPricing.finalCustomerPayable) 
    : (overallBestPrice > 0 
      ? overallBestPrice 
      : (!isNaN(fallbackPriceVal) && fallbackPriceVal > 0 ? fallbackPriceVal : 0));

  const rawMrp = (comparisonListings.length > 0 ? comparisonListings : validListings).find((l: any) => l.mrp || l.originalPrice)?.mrp ||
    (comparisonListings.length > 0 ? comparisonListings : validListings).find((l: any) => l.mrp || l.originalPrice)?.originalPrice ||
    product.mrp ||
    product.originalPrice;
  let displayMrp = rawMrp ? Number(rawMrp) : 0;
  const discountPercent = product.discountMeta?.discountPercent;
  if ((!displayMrp || displayMrp <= displayPrice) && discountPercent && discountPercent > 0) {
    displayMrp = displayPrice / (1 - discountPercent / 100);
  }

  // Calculate active discount percent dynamically for header badge
  const activeListing = comparisonListings[0];
  const activeDiscountPercent = 
    activeListing?.discountMeta?.discountPercent ??
    product.discountMeta?.discountPercent ??
    (displayMrp > displayPrice && displayMrp > 0 ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : null);

  // Wishlist / Bookmark logic
  const isBookmarked = wishlistSet.has(product.id);
  const handleBookmarkToggle = () => {
    // No toast on either branch: the bookmark icon already flips to show the result.
    if (isBookmarked) {
      removeFromWishlist.mutate(product.id);
    } else {
      // Spread the full product (not just a handful of fields) so the saved
      // item renders correctly in WishlistDrawer/WishlistPage — those read
      // item.product.name/mrp/images/rating/etc., and a partial payload here
      // (previously just productId/productName/price/originalPrice/image)
      // meant items bookmarked from the product page showed up with a
      // generic "Product" label and missing rating/discount, unlike items
      // bookmarked from the grid card ribbon which already passes the whole
      // product object.
      addToWishlist.mutate({
        ...product,
        productId: product.id,
        productName: product.name,
        price: displayPrice || 0,
        originalPrice: product.mrp || product.originalPrice || displayPrice,
        image: product.image || images[0],
      });
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      toast('Please log in to submit a review', 'error');
      // setIsLoginOpen(true); // Uncomment if login modal exists
      return;
    }
    if (reviewEligibility?.canReview === false) {
      toast(REVIEW_BLOCK_MESSAGE[reviewEligibility.reason ?? 'NOT_PURCHASED'], 'error');
      return;
    }
    if (rating === 0) {
      toast('Please select a rating star', 'error');
      return;
    }

    const comment = reviewTitle ? `${reviewTitle}: ${reviewComment}` : reviewComment;

    submitReview({
      catalogProductId: product.id,
      rating,
      comment,
      images: reviewImages,
    }, {
      onSuccess: () => {
        toast('Review submitted successfully!', 'success');
        setRating(0);
        setReviewTitle('');
        setReviewComment('');
        setReviewImages([]);
      },
      onError: (err: any) => {
        const errorMsg = err?.response?.data?.message || err?.message || 'Failed to submit review';
        toast(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg, 'error');
      }
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      {/* The page's single heading. Rendered once and visually hidden so it
          survives whichever layout CSS happens to show — Google indexes
          mobile-first, and the desktop block is display:none there. */}
      <h1 className="sr-only">{product.name}</h1>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .purple-scroll::-webkit-scrollbar { width: 5px; }
        .purple-scroll::-webkit-scrollbar-track { background: transparent; }
        .purple-scroll::-webkit-scrollbar-thumb { background: #854cbc; border-radius: 5px; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />

      <div className="mx-auto w-full max-w-[1400px] lg:max-w-[1600px] xl:max-w-[1800px] 2xl:max-w-[2000px] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-6 xl:px-8">

        {/* MOBILE VIEW LAYOUT */}
        <div className="block lg:hidden flex flex-col gap-5 w-full">
          {/* Breadcrumbs — rendered unconditionally, unlike the tags header below */}
          <ProductBreadcrumbs product={product} className="px-1 text-sm -mb-3" />

          {/* Dynamic Tags Header. The badges deliberately straddle the top edge of
              the image card below: -mb cancels the 20px flex gap, this row's own
              spacing and the card's mt-4, then overlaps a further ~10px. z-10 keeps
              the badge painted over the card, which is a later sibling. */}
          {isAd && (
            <div className="relative z-10 flex items-center justify-between w-full px-1 -mb-[46px]">
              <div className="flex items-center gap-2">
                {isYukiziChoice && (
                  <div className="rounded-full bg-[#7B2FBE] px-4 py-1 text-xs font-bold tracking-wide text-white shadow-sm">
                    Yukizi Choice
                  </div>
                )}
                {isBestSeller && (
                  <div className="rounded-full bg-[#4a4a4a] px-4 py-1 text-xs font-bold tracking-wide text-white shadow-sm">
                    Best Seller
                  </div>
                )}
              </div>
              {isAd && (
                <span className="text-xs text-gray-400 font-semibold select-none">Ad</span>
              )}
            </div>
          )}

          {/* Banner Card */}
          <ProductBannerCard altOverrides={imageAltOverrides}
            images={displayImages}
            activeImageIndex={activeImage}
            setActiveImageIndex={setActiveImage}
            isBookmarked={isBookmarked}
            onBookmarkToggle={handleBookmarkToggle}
            productName={product.name}
            productId={product.id}
            productPrice={displayPrice}
          />

          <hr className="border-gray-100" />

          {/* Product Title. A <p>, not an <h1>: the mobile and desktop layouts
              are both in the DOM at every viewport with only CSS hiding one,
              so two <h1> elements were served on every product page. The one
              real heading is rendered once, screen-reader-only, above. */}
          <p className="text-xl font-medium text-gray-800 leading-tight">
            {product.name}
          </p>

          {/* Variant Selector */}
          {productVariants.length > 0 && (
            <div className="flex flex-col gap-2 mt-1 mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Variant</span>
              <div className="flex flex-wrap gap-2">
                {productVariants.map((v: any) => (
                  <button
                    key={v.id || v.name}
                    type="button"
                    onClick={() => {
                      setSelectedVariantName(v.name);
                      setActiveImage(0);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${selectedVariantName === v.name
                        ? 'bg-[#854cbc] text-white border-[#854cbc] shadow-md scale-105'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    {/* Through the optimiser: this renders at 20px but was
                        fetching the full-resolution source, which for some
                        products is a 2 MB file for a swatch. */}
                    {v.image && (
                      <Image src={v.image} alt={v.name} width={20} height={20} loading="lazy" className="w-5 h-5 rounded-full object-cover" />
                    )}
                    <span>{v.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 8-Row Comparison list */}
          <ComparisonOffersList
            comparisonListings={comparisonListings}
            cartData={cartData}
            minOrderAmount={minOrderAmount}
            addToCart={addToCart}
            updateCartItem={updateCartItem}
            removeCartItem={removeCartItem}
            productName={product.name}
            productMrp={displayMrp || displayPrice}
            toast={toast}
            setShowStockAlert={openStockAlert}
            productImage={displayImages[0]}
            productGstPercent={product.gstPercent}
            productShippingCharges={product.shippingCharges}
            productIsTaxIncluded={product.isTaxIncluded}
          />

          {/* Accordions */}
          <div className="mt-2">
            <Accordion
              title="DESCRIPTION"
              content={product.description || 'No description available.'}
              defaultOpen={true}
            />
            <Accordion
              title="PRODUCT SPECIFICATIONS"
              content={product.specifications || 'No specifications available for this product.'}
            />
            <Accordion title="SHIPPING & RETURN INFO" content={SHIPPING_RETURN_INFO} />
          </div>

          {/* Related Products */}
          <div className="mt-4 border-t border-gray-100 pt-6">
            <h2 className="mb-4 text-base sm:text-lg font-bold text-gray-500">Related Products</h2>
            <div className="grid grid-cols-2 gap-x-3.5 gap-y-[28px] pb-4">
              {relatedProducts.slice(0, 4).map((prod: any, idx: number) => (
                <GridProductCard key={prod.id} product={prod} index={idx} />
              ))}
            </div>
          </div>

          {/* Reviews Summary Section */}
          <div className="mt-4 border-t border-gray-100 pt-6">
            <h2 className="mb-4 text-base font-bold text-gray-600 uppercase tracking-wider">Reviews</h2>
            <div className="mb-5 flex items-center justify-between w-full">
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
                  <span className="text-3xl font-bold leading-none text-gray-800">
                    {hasReviews ? averageRating.toFixed(1) : 'NA'}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-400">
                  {hasReviews
                    ? `${averageRating.toFixed(1)} out of 5 stars (based on ${totalReviews} review${totalReviews !== 1 ? 's' : ''})`
                    : 'No reviews yet'}
                </p>
              </div>

              <button
                type="button"
                className="bg-[#854cbc] hover:bg-[#723eab] text-white rounded-[6px] px-6 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              >
                See all reviews
              </button>
            </div>

            {/* Review Cards Carousel */}
            <div className="hide-scrollbar flex flex-col gap-4 overflow-x-auto pb-2 sm:flex-row">
              {!hasReviews && (
                <p className="py-4 text-sm text-gray-400">No reviews yet. Be the first to review this product.</p>
              )}
              {reviewsList.map((rev: any) => {
                const reviewImagesList = (rev.images && rev.images.length > 0)
                  ? rev.images
                  : (rev.image ? [rev.image] : (rev.imageUrl ? [rev.imageUrl] : []));
                return (
                  <div key={rev.id} className="flex min-w-[280px] flex-1 flex-row justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col justify-between flex-1">
                      <p className="mb-4 text-xs font-medium leading-relaxed text-gray-500">
                        {rev.comment}
                      </p>
                      <div>
                        <div className="mb-1.5 flex gap-0.5 text-[#b165f1]">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} size={14} fill={i <= rev.rating ? "currentColor" : "none"} className={i <= rev.rating ? "text-[#b165f1]" : "text-gray-200"} />
                          ))}
                        </div>
                        <p className="text-2xs font-semibold text-gray-400">
                          - {rev.userName || 'Anonymous'}, {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {reviewImagesList.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap flex-shrink-0 self-center">
                        {reviewImagesList.map((imgUrl: string, idx: number) => (
                          <div key={idx} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-gray-100 bg-white">
                            <Image src={imgUrl} alt={`Review photo ${idx + 1}`} width={80} height={80} loading="lazy" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Review Submission Form */}
            <ReviewSubmissionForm
              rating={rating}
              setRating={setRating}
              reviewTitle={reviewTitle}
              setReviewTitle={setReviewTitle}
              reviewComment={reviewComment}
              setReviewComment={setReviewComment}
              reviewImages={reviewImages}
              setReviewImages={setReviewImages}
              onSubmit={handleReviewSubmit}
              blockedReason={reviewEligibility?.canReview === false ? reviewEligibility.reason : null}
            />
          </div>
        </div>

        {/* DESKTOP VIEW LAYOUT */}
        <div className="hidden lg:flex flex-col gap-6 w-full">
          {/* 2-Column Grid */}
          <div className="grid grid-cols-[1fr_1.25fr] gap-10 items-start">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              {/* Breadcrumbs, with the Ad marker sharing the row */}
              <div className="flex items-center justify-between w-full gap-4 min-h-6">
                <ProductBreadcrumbs
                  product={product}
                  className="text-sm sm:text-sm xl:text-base 2xl:text-base"
                />
                {isAd && (
                  <span className="shrink-0 text-xs text-gray-400 font-semibold select-none">Ad</span>
                )}
              </div>
              {/* Straddles the top edge of the image card below, matching mobile.
                  -mb cancels the column's 24px gap and overlaps a further ~10px;
                  z-10 keeps the badge over the card, which is a later sibling. */}
              {isAd && (isYukiziChoice || isBestSeller) && (
                <div className="relative z-10 flex items-center gap-2 w-full h-6 -mb-[34px]">
                  {isYukiziChoice && (
                    <div className="rounded-full bg-[#7B2FBE] px-4 py-1 text-xs font-bold tracking-wide text-white shadow-sm">
                      Yukizi Choice
                    </div>
                  )}
                  {isBestSeller && (
                    <div className="rounded-full bg-[#4a4a4a] px-4 py-1 text-xs font-bold tracking-wide text-white shadow-sm">
                      Best Seller
                    </div>
                  )}
                </div>
              )}
              {/* Product Image Banner */}
              <ProductBannerCard altOverrides={imageAltOverrides}
                images={displayImages}
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
                <Accordion
                  title="PRODUCT SPECIFICATIONS"
                  content={product.specifications || 'No specifications available for this product.'}
                />
                <Accordion title="SHIPPING & RETURN INFO" content={SHIPPING_RETURN_INFO} />
              </div>

              {/* Related Products - moved inside left column to avoid XL height gaps */}
              <div className="flex flex-col gap-4 border-t border-gray-100 pt-8 mt-6">
                <h2 className="text-xl sm:text-2xl xl:text-2xl 2xl:text-2xl font-bold text-gray-500">Related Products</h2>
                <div className="grid grid-cols-3 gap-5 pb-4">
                  {relatedProducts.map((prod: any, idx: number) => (
                    <GridProductCard key={prod.id} product={prod} index={idx} />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col">
              {/* Title Block */}
              <div className="flex items-start justify-between w-full mb-4">
                <p className="text-2xl sm:text-2xl xl:text-3xl 2xl:text-4xl font-medium text-black tracking-tight leading-tight max-w-[95%]">
                  {product.name}
                </p>
              </div>

              {/* Price & Details Row */}
              <div className="flex items-end justify-between w-full border-b border-gray-100 pb-4 mb-4">
                {/* Left: Price & Discount */}
                <div className="flex flex-col items-start justify-end">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl xl:text-3xl 2xl:text-3xl font-medium text-[#333333] leading-none">
                      {displayPrice > 0 
                        ? `₹${Number(displayPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                        : 'N/A'}
                    </span>
                    {displayMrp && displayMrp > displayPrice ? (
                      <span className="text-xs sm:text-sm xl:text-base 2xl:text-base font-bold text-gray-400 line-through leading-none">
                        ₹{displayMrp ? Number(displayMrp).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Right: Offer & Rating */}
                <div className="flex items-center gap-4 sm:gap-5 xl:gap-6 pb-0.5">
                  {activeDiscountPercent && activeDiscountPercent > 0 ? (
                    <span className="text-sm sm:text-base xl:text-lg 2xl:text-xl font-bold text-gray-800 leading-none whitespace-nowrap">
                      {activeDiscountPercent}% off
                    </span>
                  ) : null}
                  <div className="flex items-center gap-1 xl:gap-1.5">
                    <Star className={`w-5.5 h-5.5 xl:w-6.5 xl:h-6.5 2xl:w-7 2xl:h-7 flex-shrink-0 ${hasReviews ? 'fill-[#7B2FBE] text-[#7B2FBE]' : 'fill-gray-300 text-gray-300'}`} />
                    <span className="text-lg sm:text-xl xl:text-2xl 2xl:text-2xl font-bold text-gray-800 leading-none">
                      {hasReviews ? averageRating.toFixed(1) : 'NA'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Variant Selector */}
              {productVariants.length > 0 && (
                <div className="flex flex-col gap-2 mb-6">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Variant</span>
                  <div className="flex flex-wrap gap-2.5">
                    {productVariants.map((v: any) => (
                      <button
                        key={v.id || v.name}
                        type="button"
                        onClick={() => {
                          setSelectedVariantName(v.name);
                          setActiveImage(0);
                        }}
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${selectedVariantName === v.name
                            ? 'bg-[#854cbc] text-white border-[#854cbc] shadow-md scale-105'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                      >
                        {v.image && (
                          <Image src={v.image} alt={v.name} width={24} height={24} loading="lazy" className="w-6 h-6 rounded-full object-cover" />
                        )}
                        <span>{v.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 8-row comparison list */}
              <ComparisonOffersList
                variant="desktop"
                comparisonListings={comparisonListings}
                cartData={cartData}
                minOrderAmount={minOrderAmount}
                addToCart={addToCart}
                updateCartItem={updateCartItem}
                removeCartItem={removeCartItem}
                productName={product.name}
                productMrp={displayMrp || displayPrice}
                toast={toast}
                setShowStockAlert={openStockAlert}
                productImage={displayImages[0]}
                productGstPercent={product.gstPercent}
                productShippingCharges={product.shippingCharges}
                productIsTaxIncluded={product.isTaxIncluded}
              />

              {/* Reviews - moved inside right column to avoid XL height gaps */}
              <div className="flex flex-col border-t border-gray-100 pt-8 mt-6">
                <h2 className="text-xl sm:text-2xl xl:text-2xl 2xl:text-2xl font-bold text-gray-500 mb-4">Reviews</h2>

                <div className="mb-6 flex items-center justify-between w-full">
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
                      <span className="text-3xl font-bold leading-none text-gray-800">
                        {hasReviews ? averageRating.toFixed(1) : 'NA'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-400">
                      {hasReviews
                    ? `${averageRating.toFixed(1)} out of 5 stars (based on ${totalReviews} review${totalReviews !== 1 ? 's' : ''})`
                    : 'No reviews yet'}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="bg-[#854cbc] hover:bg-[#723eab] text-white rounded-[6px] px-6 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    See all reviews
                  </button>
                </div>

                {/* Review Cards Carousel */}
                <div className="hide-scrollbar flex flex-col gap-4 overflow-x-auto pb-2 sm:flex-row">
                  {!hasReviews && (
                    <p className="py-4 text-sm text-gray-400">No reviews yet. Be the first to review this product.</p>
                  )}
                  {reviewsList.map((rev: any) => {
                    const reviewImagesList = (rev.images && rev.images.length > 0)
                      ? rev.images
                      : (rev.image ? [rev.image] : (rev.imageUrl ? [rev.imageUrl] : []));
                    return (
                      <div key={rev.id} className="flex min-w-[280px] flex-1 flex-row justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col justify-between flex-1">
                          <p className="mb-4 text-xs font-medium leading-relaxed text-gray-500">
                            {rev.comment}
                          </p>
                          <div>
                            <div className="mb-1.5 flex gap-0.5 text-[#b165f1]">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} size={14} fill={i <= rev.rating ? "currentColor" : "none"} className={i <= rev.rating ? "text-[#b165f1]" : "text-gray-200"} />
                              ))}
                            </div>
                            <p className="text-2xs font-semibold text-gray-400">
                              - {rev.userName || 'Anonymous'}, {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        {reviewImagesList.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap flex-shrink-0 self-center">
                            {reviewImagesList.map((imgUrl: string, idx: number) => (
                              <div key={idx} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-gray-100 bg-white">
                                <Image src={imgUrl} alt={`Review photo ${idx + 1}`} width={80} height={80} loading="lazy" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Review Submission Form */}
                <ReviewSubmissionForm
                  rating={rating}
                  setRating={setRating}
                  reviewTitle={reviewTitle}
                  setReviewTitle={setReviewTitle}
                  reviewComment={reviewComment}
                  setReviewComment={setReviewComment}
                  reviewImages={reviewImages}
                  setReviewImages={setReviewImages}
                  onSubmit={handleReviewSubmit}
                  blockedReason={reviewEligibility?.canReview === false ? reviewEligibility.reason : null}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
      <Navbar />

      {/* Stock alert. The bell on out-of-stock listings and the no-seller block
          both set showStockAlert; until now nothing rendered the modal, so both
          were dead clicks. The waitlist is keyed on the catalog product, not a
          seller offer, so it works even with zero sellers. */}
      <NotifyStockAlertModal
        isOpen={showStockAlert}
        productName={product?.name || 'This product'}
        productId={product.id}
        onClose={() => setShowStockAlert(false)}
      />
    </main>
  );
}
