'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Share2, Plus, Minus, RotateCw, Eye, Star, Truck, Bookmark, Bell } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getProducts, useAuth } from '@yukizi/api-client';
import { trackProductImpression, trackProductClick } from '@/lib/analytics/tracker';
import { generateProductSlug, calculatePricing } from '@yukizi/utils';
import QuickReviewModal from './QuickReviewModal';
import { useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { useAddToWishlist, useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useWaitlist, useAddToWaitlist, useRemoveFromWaitlist } from '@/hooks/useProducts';
import { useToast } from '@/components/shared/Toast';
import WishlistIcon from '@/components/shared/WishlistIcon';
import { NotifyStockAlertModal } from '@/components/shared/NotifyStockAlertModal';

interface ProductCarouselProps {
  reverse?: boolean;
  slot?: 'HOMEPAGE_CAROUSEL' | 'LOGIN_CAROUSEL';
  categoryId?: string;
  initialProducts?: any[];
}

// overflow-hidden + text-ellipsis (instead of wrapping callers in their own
// "truncate" span) so the truncation lives on the element that actually has
// the right font-size/line-height. A wrapping span with no size classes of
// its own inherits the ambient 16px/24px line box as an invisible "strut",
// which made offer badges taller than the rest of the price row and threw
// off row-height matching between grid cards.
const OFFER_TEXT = "text-[#333333] text-2xs sm:text-base font-medium tracking-wide whitespace-nowrap overflow-hidden text-ellipsis";
const PERCENT_OFF_TEXT_GREEN = "text-green-600 text-2xs sm:text-base font-semibold tracking-wide whitespace-nowrap overflow-hidden text-ellipsis";

// Rishi: a product with nothing on offer should render nothing at all, not
// a "No offers" label. Covers both no discount configured and a discount
// type with no usable numbers behind it (e.g. "0% off", "Buy 0 Get 0 Free").
const noOfferLabel = () => null;

// accentGreen: was used to color the homepage grid card's offer text green;
// Rishi asked for it back to the neutral color, so no caller currently
// passes true. Left in place in case a future card wants the accent again.
// compact: the PTR_PLUS_* combo types normally stack percent+bonus on two
// lines, which made cards with a combo offer taller than every other card
// in the grid. The homepage grid opts into a single joined line instead so
// every card's price row is exactly one line tall, regardless of discount
// type. Other callers keep the richer two-line stack by leaving this false.
export const renderBuyerOfferBadge = (p: any, accentGreen = false, compact = false) => {
  const meta = p?.discountMeta || {};
  const percent = Number(meta.discountPercent) || 0;
  const specialPrice = Number(meta.specialPrice) || 0;
  const getQty = Number(meta.get) || 0;
  const buyQty = Number(meta.buy) || 0;
  const type = typeof p?.discountType === 'string' ? p.discountType.toUpperCase() : '';

  const percentOff = <span className={accentGreen ? PERCENT_OFF_TEXT_GREEN : OFFER_TEXT}>{percent}% off</span>;
  const sameBonus = <span className={OFFER_TEXT}>Buy {buyQty} Get {getQty} Free</span>;
  const otherBonus = <span className={OFFER_TEXT}>Buy {buyQty} Get {getQty} {meta.bonusProductName}</span>;
  const percentText = `${percent}% off`;
  const sameBonusText = `Buy ${buyQty} Get ${getQty} Free`;
  const otherBonusText = `Buy ${buyQty} Get ${getQty} ${meta.bonusProductName}`;

  if (!type || type === 'NONE') {
    return percent > 0 ? percentOff : noOfferLabel();
  }

  if (type === 'PTR_DISCOUNT') {
    return percent > 0 ? percentOff : noOfferLabel();
  }

  if (type === 'SAME_PRODUCT_BONUS') {
    return getQty > 0 ? sameBonus : noOfferLabel();
  }

  if (type === 'DIFFERENT_PRODUCT_BONUS') {
    return getQty > 0 && meta.bonusProductName ? otherBonus : noOfferLabel();
  }

  if (type === 'PTR_PLUS_SAME_PRODUCT_BONUS') {
    if (percent <= 0 && getQty <= 0) return noOfferLabel();
    if (compact) {
      const parts = [percent > 0 && percentText, getQty > 0 && sameBonusText].filter(Boolean);
      return <span className={accentGreen ? PERCENT_OFF_TEXT_GREEN : OFFER_TEXT}>{parts.join(' + ')}</span>;
    }
    return (
      <div className="flex flex-col gap-0.5">
        {percent > 0 && percentOff}
        {getQty > 0 && sameBonus}
      </div>
    );
  }

  if (type === 'PTR_PLUS_DIFFERENT_PRODUCT_BONUS') {
    const hasBonus = getQty > 0 && meta.bonusProductName;
    if (percent <= 0 && !hasBonus) return noOfferLabel();
    if (compact) {
      const parts = [percent > 0 && percentText, hasBonus && otherBonusText].filter(Boolean);
      return <span className={accentGreen ? PERCENT_OFF_TEXT_GREEN : OFFER_TEXT}>{parts.join(' + ')}</span>;
    }
    return (
      <div className="flex flex-col gap-0.5">
        {percent > 0 && percentOff}
        {hasBonus && otherBonus}
      </div>
    );
  }

  if (type === 'SPECIAL_PRICE') {
    return specialPrice > 0 ? (
      <span className="text-emerald-600 text-2xs sm:text-base font-medium tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">Special Price: ₹{Math.round(specialPrice)}</span>
    ) : noOfferLabel();
  }

  // Unknown type: show the humanised name rather than "No offers", so a new
  // server-side discount type is never mislabelled as nothing on offer.
  return <span className={OFFER_TEXT}>{p.discountType.replace(/_/g, ' ')}</span>;
};

export function GridProductCard({ product, index, onOpenReview, showFullTitle }: { product: any; index: number; onOpenReview?: (p: any) => void; showFullTitle?: boolean }) {
  const { data: cartData } = useCart();
  const { mutate: addToCart } = useAddToCart();
  const { mutate: updateCartItem } = useUpdateCartItem();
  const { mutate: removeCartItem } = useRemoveCartItem();
  const { mutate: addToWishlist } = useAddToWishlist();
  const { mutate: removeFromWishlist } = useRemoveFromWishlist();
  const { data: wishlistData } = useWishlist();
  const { isAuthenticated, user } = useAuth();
  const { data: waitlistData } = useWaitlist();
  const { mutate: addToWaitlist } = useAddToWaitlist();
  const { mutate: removeFromWaitlist } = useRemoveFromWaitlist();
  const { toast } = useToast();
  const [isNotifyEmailModalOpen, setIsNotifyEmailModalOpen] = useState(false);

  const currentProductId = product?.id || `prod-${index}`;

  // Listing analytics: one impression per card per pageview (IntersectionObserver,
  // idle-cost only, deduped in the tracker), and a click on every navigation
  // into the product.
  const impressionRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = impressionRef.current;
    if (!el || !product?.id || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          trackProductImpression(product.id, index);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [product?.id, index]);
  const handleCardNav = () => {
    if (product?.id) trackProductClick(product.id, index);
  };
  const targetProductId = product.bestListingId || currentProductId;

  // Find if this product is in the cart
  const cartItem = cartData?.items?.find(
    (item: any) => item.productId === targetProductId || item.product?.id === targetProductId || item.id === targetProductId
  );
  const cartQuantity = cartItem?.quantity || 0;

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const stock = product?.stock ?? 9999;
    const maxLimit = product?.maximumOrderQuantity ?? stock;
    const max = Math.min(stock, maxLimit);
    if (cartQuantity >= max) {
      toast(`Only ${max} units available`, 'error');
      return;
    }
    if (cartItem) {
      updateCartItem({
        itemId: cartItem.id,
        quantity: cartQuantity + 1,
      });
    } else {
      // No toast: the button turning into the quantity stepper is already
      // the confirmation, and the toast used to cover the top-left cards.
      addToCart(
        { productId: targetProductId, quantity: 1, price: finalPrice, originalPrice: finalOriginalPrice || mrpVal, ...product }
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
      // No toast: the stepper collapsing back to the cart icon is already
      // the confirmation, and the toast covered the top-left cards (same
      // reasoning as dropping the "Added to cart" toast above).
      removeCartItem(cartItem.id);
    }
  };
  const isSaved = wishlistData?.items?.some(
    (item: any) => item.productId === currentProductId || item.product?.id === currentProductId || item.id === currentProductId || (product?.id && (item.productId === product.id || item.product?.id === product.id))
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
  const discountPercent = Number(product?.discountMeta?.discountPercent || 0);
  // finalPrice includes discounted shipping; mrp does not. Comparing them makes
  // a real 10% discount look like 0.6% off. Derive the pre-discount figure from
  // the displayed price whenever a discount exists, so the strike-through and
  // the "N% off" badge describe the same number.
  let finalOriginalPrice = 0;
  if (discountPercent > 0 && finalPrice > 0) {
    finalOriginalPrice = Math.round(finalPrice / (1 - discountPercent / 100));
  } else if (mrpVal > finalPrice) {
    finalOriginalPrice = mrpVal;
  }
  // No invented rating: unrated products render "NA" rather than a default 4.5.
  const numRating = Number(product?.rating);
  const hasRating = product?.rating != null && !isNaN(numRating) && numRating > 0;
  const rating = hasRating ? product.rating : null;
  const hasNoSellers = product?.sellerCount === 0 || product?.hasSellers === false;
  const isNotAvailable = hasNoSellers && finalPrice <= 0 && mrpVal <= 0;
  const showBellIcon = hasNoSellers || (product?.stock !== undefined && product.stock <= 0);

  const isWaitlisted = waitlistData?.some((item: any) => item.productId === currentProductId) || false;

  const handleToggleWaitlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Signed-out shoppers used to tap the bell and get nothing at all: the
    // request went out without a session, failed, and the icon never changed.
    // Send them to sign in first, the same way the cart and wishlist do.
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('open-login'));
      return;
    }
    if (isWaitlisted) {
      removeFromWaitlist(currentProductId, {
        onSuccess: () => toast('Removed from notify me', 'info')
      });
    } else if (!user?.email) {
      // The API requires an email on the account before it can waitlist -
      // this project logs in by phone/OTP, so plenty of accounts have none.
      // Collect it here instead of letting the request fail.
      setIsNotifyEmailModalOpen(true);
    } else {
      addToWaitlist({ productId: currentProductId }, {
        onSuccess: () => toast('Added to notify me', 'success')
      });
    }
  };

  const displayPrice = finalPrice > 0 
    ? `₹${Math.round(finalPrice)}` 
    : (mrpVal > 0 ? `₹${Math.round(mrpVal)}` : 'N/A');

  const displayOriginalPrice = (finalOriginalPrice > 0 && finalOriginalPrice > finalPrice)
    ? `₹${Math.round(finalOriginalPrice)}`
    : '';

  const productName = product?.name || 'Product';

  const getInitials = (name: string) => {
    if (!name) return 'PR';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };
  // /png because placehold.co defaults to SVG, which the image optimizer
  // refuses to process.
  const fallbackImage = `https://placehold.co/400x400/10b981/ffffff/png?text=${encodeURIComponent(getInitials(productName))}`;
  const imageUrl = product?.images?.[0]?.url || product?.images?.[0] || product?.image || fallbackImage;

  return (
    <>
    <div ref={impressionRef} className="relative mt-3 group flex flex-col h-auto w-full max-w-[210px] sm:max-w-none mx-auto">
      {/* Yukizi Choice & Best Seller Tags */}
      <div className="absolute -top-[12px] left-1.5 sm:left-2 flex items-center gap-1.5 z-30">
        {isYukiziChoice && (
          <div className="bg-[#7B2FBE] text-white px-3 py-0.5 rounded-full font-semibold text-2xs sm:text-xs shadow-sm tracking-wide flex items-center justify-center">
            Yukizi Choice
          </div>
        )}
        {isBestSeller && (
          <div className="bg-[#4a4a4a] text-white px-3 py-0.5 rounded-full font-semibold text-2xs sm:text-xs shadow-sm tracking-wide flex items-center justify-center">
            Best Seller
          </div>
        )}
      </div>

      {/* Ad Tag */}
      {isAd && (
        <div className="absolute -top-4 right-0 text-2xs sm:text-2xs text-gray-400 font-normal z-20">
          Ad
        </div>
      )}

      <div
        // The purple ring that outlined every Yukizi Choice card is gone. The
        // "Yukizi Choice" pill sitting on the card already says so in words,
        // so the ring repeated it — and a hard tinted outline on a translucent
        // panel reads as a border stuck onto the card rather than part of it.
        //
        // The waitlisted ring stays: that one carries state a shopper has no
        // other way to see at a glance in the grid.
        className={`glass-panel rounded-[18px] transition-shadow duration-200 group flex flex-col relative ${
          isWaitlisted ? 'ring-1 ring-gray-900' : ''
        } w-full h-auto overflow-hidden hover:shadow-[0_10px_28px_-12px_rgba(88,54,150,0.38)]`}
      >
           {/* Top Right Plus / Cart Button / Waitlist Bell */}
        <div className="absolute top-1 right-0.5 z-20">
          {showBellIcon ? (
            <button 
              onClick={handleToggleWaitlist}
              className={`transition-colors p-1 rounded-full ${isWaitlisted ? 'bg-gray-900 text-white hover:bg-gray-800' : 'text-black hover:text-black/80 hover:bg-black/5'}`}
              title={isWaitlisted ? "Remove from notify me" : "Notify me when available"}
              aria-pressed={isWaitlisted}
            >
              <Bell className="w-5 h-5" fill={isWaitlisted ? "currentColor" : "none"} strokeWidth={2.5} />
            </button>
          ) : cartQuantity > 0 ? (
            <div className="flex items-center gap-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
               {/* Reset. Was a bare 14px glyph with no surface, so it read as a
                   stray mark next to the stepper rather than a control. Now a
                   glass chip matching the stepper's height. */}
               <button
                 onClick={handleResetClick}
                 title="Reset quantity"
                 aria-label="Reset quantity"
                 className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/60 text-[#5b3391] shadow-[0_2px_8px_-3px_rgba(88,54,150,0.45)] backdrop-blur-md transition-all hover:bg-white/85 active:scale-90 focus:outline-none"
               >
                 <RotateCw className="w-3 h-3" strokeWidth={2.75} />
               </button>

               {/* Quantity stepper.
                   Was 24px tall with 10px icons on a flat #48286b block — the
                   tap targets were under half the 44px guideline and it read as
                   a tiny dark slab pasted onto a light card. Now 28px, pill
                   shaped, on the same violet gradient as the nav bar, with an
                   inner top highlight so it belongs to the same material. The
                   quantity uses tabular figures so the pill does not resize as
                   the number changes. Behaviour is untouched. */}
               <div className="flex items-center h-7 select-none justify-between gap-0.5 rounded-full px-1 text-white bg-[linear-gradient(180deg,#8f5ad4_0%,#7745bd_48%,#5f2f9f_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_4px_12px_-4px_rgba(88,54,150,0.75)]">
                  <button
                    onClick={handleMinusClick}
                    aria-label="Decrease quantity"
                    className="text-white/90 hover:text-white hover:bg-white/20 w-5 h-5 flex items-center justify-center rounded-full transition-colors active:scale-90"
                  >
                    <Minus className="w-3 h-3" strokeWidth={3} />
                  </button>
                  <span className="text-[11px] font-bold tabular-nums tracking-wide min-w-[16px] text-center">
                    {String(cartQuantity).padStart(2, '0')}
                  </span>
                  <button
                    onClick={handlePlusClick}
                    aria-label="Increase quantity"
                    className="text-white/90 hover:text-white hover:bg-white/20 w-5 h-5 flex items-center justify-center rounded-full transition-colors active:scale-90 disabled:opacity-40 disabled:hover:bg-transparent"
                    disabled={cartQuantity >= (product?.stock ?? 9999)}
                  >
                    <Plus className="w-3 h-3" strokeWidth={3} />
                  </button>
               </div>
            </div>
          ) : (
            // The resting state of the same control, so it gets the same
            // 28px box as the stepper it turns into — the row no longer
            // reflows when you tap it. Surface only appears on hover, so the
            // card stays as clean as it was.
            <button
              aria-label="Add to cart"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#2f1b4d] transition-all hover:bg-[#854cbc]/12 hover:text-[#854cbc] active:scale-90 focus:outline-none"
              onClick={handlePlusClick}
            >
              <Plus className="w-5 h-5" strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Right Edge Wishlist Ribbon */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { 
            e.preventDefault(); 
            // No toast: the ribbon icon already fills/empties to show the result.
            if (isSaved) {
              removeFromWishlist(currentProductId);
            } else {
              addToWishlist(product);
            }
          }}
          className="absolute right-0 top-[44%] -translate-y-1/2 z-20 cursor-pointer hover:scale-105 transition-transform"
        >
          <WishlistIcon
            isFilled={isSaved}
            preserveAspectRatio="none"
            className="w-[21px] h-[21px]"
          />
        </div>

        {/* Image Container - Fixed 190px/200px height matching Samplr */}
        <Link onClick={handleCardNav} href={`/products/${generateProductSlug(productName, product?.id || 'prod-' + index, product?.slug)}`} className="relative w-full h-[160px] sm:h-[200px] overflow-hidden flex justify-center items-center shrink-0">
           {/* next/image so the ~1MB seller uploads are resized/re-encoded to
               the card's actual rendered width (the grid is 2-7 columns) —
               measured 65MB of card images on one homepage load without it. */}
           <Image src={imageUrl} alt={`${productName} - Yukizi`} fill sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 15vw" className="object-contain p-3 sm:p-2 group-hover:scale-105 transition-transform duration-300 ease-out" />
        </Link>

         <div className="flex flex-col gap-1 p-[8px] sm:p-[10px] w-full border-t border-white/70">
            {/* Brand Subtitle & Title Line */}
            <div>
               <div className="flex items-start justify-between w-full gap-1.5">
                  <Link onClick={handleCardNav} href={`/products/${generateProductSlug(productName, product?.id || 'prod-' + index, product?.slug)}`} className="flex-1">
                    <h3 className={`text-xs sm:text-sm font-medium text-[#333333] leading-snug hover:text-[#7B2FBE] transition-colors ${showFullTitle ? '' : 'line-clamp-1'}`}>
                       {productName}
                    </h3>
                  </Link>
                  {onOpenReview ? (
                    <button
                       onClick={(e) => { e.preventDefault(); onOpenReview(product); }}
                       className="flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform shrink-0"
                       title="Quick view"
                    >
                       <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  ) : (
                    <Link
                       onClick={handleCardNav}
                       href={`/products/${generateProductSlug(productName, product?.id || 'prod-' + index, product?.slug)}`}
                       className="flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform shrink-0"
                       title="Quick view"
                    >
                       <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </Link>
                  )}
              </div>
           </div>
           
           {/* Price, Offer and Rating Row */}
           <div className="flex justify-between items-center w-full gap-1">
              <div className="flex items-baseline gap-1 min-w-0 overflow-hidden">
                 <span className="text-xs sm:text-base font-medium text-[#333333] leading-none shrink-0">
                    {displayPrice}
                 </span>
                 {displayOriginalPrice && (
                    <span className="text-2xs sm:text-xs text-gray-400 line-through leading-none shrink-0">{displayOriginalPrice}</span>
                 )}
                 {renderBuyerOfferBadge(product, false, true)}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                 <Star className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#f5a623] fill-[#f5a623]" />
                 <span className="text-2xs sm:text-sm font-medium leading-none text-[#333333]">{hasRating ? rating : 'NA'}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
    <NotifyStockAlertModal
      isOpen={isNotifyEmailModalOpen}
      productName={product?.name || 'This product'}
      productId={currentProductId}
      onClose={() => setIsNotifyEmailModalOpen(false)}
    />
    </>
  );
}

/** Params the storefront filters on — used to tell "no results" apart from
 *  "empty shop" when the grid comes back with nothing. */
const filterKeys = [
  'isNew', 'isBestSelling', 'isYukiziChoice', 'discountRange',
  'location', 'manufacturer', 'minPrice', 'maxPrice', 'search',
  // A sub-collection narrows the view exactly like a filter does, and it is
  // the commonest way to land on an empty page: seven of the eight Books
  // sub-collections hold nothing, so picking Manga or Comics from the menu
  // showed the Books banner over "No products available" with no way back.
  'sub', 'subCategoryId',
];

export default function ProductCarousel({ slot = 'HOMEPAGE_CAROUSEL', categoryId, initialProducts }: ProductCarouselProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
    // A filtered view with no matches is not the same as an empty shop, and
    // it must never be a dead end. "Best Sellers" and "Yukizi Choice" filter
    // on admin flags that may not be set on anything yet, so the honest
    // message is "nothing matches these filters", with one tap back out.
    const hasFilters = filterKeys.some((k) => searchParams.get(k));
    return (
      <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto px-4 py-16 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
        <p className="text-gray-500 font-medium">
          {hasFilters ? 'Nothing here yet.' : 'No products available.'}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push(pathname, { scroll: false })}
            className="mt-3 inline-flex rounded-full bg-[#854cbc] px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            View everything in this category
          </button>
        )}
      </div>
    );
  }

  const slicedProducts = [...products];

  return (
    <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto px-4 sm:px-8 mb-8 sm:mb-12 pt-4">
      {/*
        Responsive Grid Layout with increased columns on large screens:
        - Padding: none from sm up, so the row fills the container edge to edge
          like the banner. A small px-2.5 stays on mobile, where the container is
          the screen and cards would otherwise touch both edges.
        - Columns: 2 cols (mobile), 3 cols (sm), 4 cols (md), 5 cols (lg), 6 cols (xl/2xl)
        - Gap: gap-4 (16px)
      */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-7 gap-x-3.5 gap-y-3 sm:gap-x-4 sm:gap-y-3">
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


