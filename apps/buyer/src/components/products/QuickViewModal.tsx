'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Share2,
  Loader2,
  Bookmark,
  Truck,
  CheckCircle,
  Plus,
  Star,
  Bell,
  Package,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast';
import { ShareButton } from '@/components/shared/ShareButton';
import { NotifyStockAlertModal } from '@/components/shared/NotifyStockAlertModal';
import { CustomOrderModal } from '@/components/shared/CustomOrderModal';
import WishlistIcon from '@/components/shared/WishlistIcon';
import { useAddToCart, useCart } from '@/hooks/useCart';
import { useProductById } from '@/hooks/useProducts';
import {
  calculatePricing,
  getSellingPrice,
  getEffectiveDiscountPercent,
  generateProductSlug,
} from '@yukizi/utils';
import { renderBuyerOfferBadge } from '@/components/landing/ProductCarousel';
import type { Product } from '@yukizi/utils';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const router = useRouter();
  const { data: fullProductRaw, isLoading: isLoadingDetails } = useProductById(product?.id || '', {
    enabled: !!product?.id && isOpen,
  });

  const fullProduct = fullProductRaw as any;
  const displayProduct = fullProduct || (product as any);
  const listings = displayProduct?.listings || [];
  const { toast } = useToast();
  const addToCart = useAddToCart();
  const { data: cartData } = useCart();
  const { data: config } = usePlatformConfig();
  const minOrderAmount = config?.min_order_amount ?? 0;

  const { data: wishlistData } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const [showStockAlert, setShowStockAlert] = useState(false);
  const [showCustomOrder, setShowCustomOrder] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariantName, setSelectedVariantName] = useState('');

  const productVariants = displayProduct?.variants || [];

  useEffect(() => {
    if (productVariants.length > 0 && !selectedVariantName) {
      setSelectedVariantName(productVariants[0].name);
    }
  }, [productVariants, selectedVariantName]);

  if (!displayProduct) return null;

  const selectedVariant = productVariants.find((v: any) => v.name === selectedVariantName);

  let productImages = displayProduct.images && displayProduct.images.length > 0
    ? displayProduct.images.map((img: any) => img.url || img)
    : [displayProduct.image || `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent((displayProduct.name || 'PR').trim().split(/\s+/).length === 1 ? (displayProduct.name || 'PR').trim().substring(0, 2).toUpperCase() : ((displayProduct.name || 'PR').trim().split(/\s+/)[0][0] + (displayProduct.name || 'PR').trim().split(/\s+/)[(displayProduct.name || 'PR').trim().split(/\s+/).length - 1][0]).toUpperCase())}`];

  if (selectedVariant) {
    const variantImages = selectedVariant.images?.length > 0 
      ? selectedVariant.images 
      : (selectedVariant.image ? [selectedVariant.image] : []);
      
    if (variantImages.length > 0) {
      productImages = [...variantImages, ...productImages.filter((img: string) => !variantImages.includes(img))];
    }
  }

  const activeImage = productImages[activeImageIndex % productImages.length];

  const filteredListings = productVariants.length > 0 && selectedVariantName
    ? listings.filter((l: any) => l.variantName === selectedVariantName || l.name === selectedVariantName || l.name?.includes(selectedVariantName))
    : listings;

  const comparisonListings = filteredListings.filter((l: any) => l.price != null);
  const displayPrice =
    comparisonListings.length > 0
      ? Math.min(...comparisonListings.map((l: any) => l.price))
      : displayProduct.price;

  const wishlistSet = new Set<string>();
  if (wishlistData?.items) {
    wishlistData.items.forEach((item: any) => {
      if (item.productId) wishlistSet.add(item.productId);
    });
  }
  const isBookmarked = wishlistSet.has(displayProduct.id);

  const handleBookmarkToggle = () => {
    // No toast on either branch: the bookmark icon already flips to show the result.
    if (isBookmarked) {
      removeFromWishlist.mutate(displayProduct.id);
    } else {
      addToWishlist.mutate({
        productId: displayProduct.id,
        productName: displayProduct.name,
        price: displayPrice || 0,
        originalPrice: displayProduct.mrp || displayProduct.originalPrice || displayPrice,
        image: displayProduct.image || productImages[0],
      });
    }
  };

  const handleAddToCart = (listing: any, quantity: number) => {
    const itemMrp =
      listing.mrp ||
      listing.originalPrice ||
      displayProduct.mrp ||
      displayProduct.originalPrice ||
      listing.price;
    addToCart.mutate({
      productId: listing.id,
      quantity,
      productName: displayProduct.name,
      price: listing.price,
      mrp: itemMrp,
      image: productImages[0],
      imageUrl: productImages[0],
      images: productImages,
      // Without these the cart has no idea what the ceiling is and lets the
      // quantity be raised past the stock that exists.
      stock: listing.stock,
      maximumOrderQuantity: listing.maximumOrderQuantity,
    });
  };

  const handleUpdateQty = (listing: any, quantity: number) => {
    addToCart.mutate({
      productId: listing.id,
      quantity,
      replace: true,
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4"
            onClick={onClose}
          >
            {/* Ambient Backdrop */}
            {/* Blurred scrim rather than a flat 50% black: the modal is frosted,
                so the page behind it needs to be genuinely out of focus or the
                glass has nothing to be glass against. */}
            <div className="absolute inset-0 bg-[#1b0f2e]/55 backdrop-blur-md" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-overlay no-scrollbar relative flex max-h-[90vh] w-full max-w-[95%] xs:max-w-[500px] sm:max-w-[560px] md:max-w-[590px] flex-col gap-4 overflow-y-auto p-4 sm:gap-5 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header section with Title & Share */}
              <div className="relative flex w-full flex-col gap-2 pt-3">
                <div className="flex w-full items-start justify-between">
                  {/* was text-gray-500 — the product name is the heading of this
                      sheet and was rendering lighter than the prices under it */}
                  <h2 className="max-w-[85%] text-xl font-bold leading-tight tracking-tight text-gray-900">
                    {displayProduct.name}
                  </h2>
                  <button
                    onClick={onClose}
                    className="self-start rounded-full border border-white/60 bg-white/50 p-1.5 backdrop-blur-md transition-colors hover:bg-white/80"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                {/* Share Button Row */}
                <div className="flex justify-start">
                  <ShareButton
                    productName={displayProduct.name}
                    productId={displayProduct.id}
                    productPrice={displayProduct.mrp}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/55 p-0 text-gray-500 backdrop-blur-md transition-transform hover:scale-105 hover:bg-white/75 focus:outline-none"
                    iconClassName="w-[18px] h-[18px]"
                  />
                </div>
              </div>

              {/* The image stage. Was a solid #562996 slab, which fought the
                  artwork it was supposed to present and was the one opaque
                  block left in the sheet. Now a soft purple-tinted glass panel:
                  it still frames the image, but the product is the brightest
                  thing in the modal instead of the box around it. */}
              <div
                className="relative flex aspect-[4/3.2] w-full items-center justify-center overflow-hidden rounded-[var(--r-surface)] border border-white/50 bg-[linear-gradient(160deg,rgba(133,76,188,0.16),rgba(86,41,150,0.10)_55%,rgba(255,255,255,0.35))] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_10px_30px_-16px_rgba(88,54,150,0.45)]"
              >
                {/* Interactive Thumbnail Gallery overlay on the left (aligned bottom-left) */}
                <div className="absolute left-4 bottom-4 z-20 flex flex-col gap-2">
                  {productImages.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      // selected state was orange — the mascot's colour, not a
                      // selection colour anywhere else on the site. Purple ring
                      // matches every other active state.
                      className={`h-14 w-14 overflow-hidden rounded-[10px] border bg-white/50 shadow-sm backdrop-blur-md transition-all duration-200 ${
                        activeImageIndex === idx
                          ? 'scale-105 border-[#854cbc] ring-2 ring-[#854cbc]/45 shadow-md'
                          : 'border-white/60 hover:border-white/90 hover:scale-[1.03]'
                      }`}
                    >
                      <Image
                        src={img}
                        alt=""
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                {/* Main Product Image (fills the card container exactly, with overflow-hidden to respect rounded corners) */}
                <div className="absolute inset-0 z-10 rounded-xl overflow-hidden p-4">
                  <div className="relative w-full h-full">
                    <Image
                      src={activeImage}
                      alt={displayProduct.name}
                      fill
                      className="object-contain transition-transform duration-500 hover:scale-105"
                      priority
                    />
                  </div>
                </div>

                {/* Ribbon Bookmark flag on the right edge */}
                {/* Ribbon Bookmark flag on the right edge (half inside, half outside) */}
                <button
                  type="button"
                  onClick={handleBookmarkToggle}
                  className="absolute -right-[18px] top-[45%] z-20 transition-transform hover:scale-105 focus:outline-none"
                >
                  <svg
                    width="36"
                    height="32"
                    viewBox="0 0 36 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="overflow-visible drop-shadow-sm"
                  >
                    <path
                      d="M36 0 H0 L9 16 L0 32 H36 Z"
                      fill={isBookmarked ? '#854cbc' : '#ffffff'}
                      stroke="#854cbc"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Variants Selector */}
              {productVariants.length > 0 && (
                <div className="flex flex-col gap-2 w-full pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Select Variant</span>
                  <div className="flex flex-wrap gap-2">
                    {productVariants.map((v: any) => (
                      <button
                        key={v.id || v.name}
                        onClick={() => setSelectedVariantName(v.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border ${
                          selectedVariantName === v.name
                            ? 'bg-[#854cbc] text-white border-[#854cbc] shadow-[0_4px_12px_rgba(133,76,188,0.2)]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#854cbc] hover:text-[#854cbc]'
                        }`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Marketplace Offers Comparison List */}
              <div className="flex w-full flex-col gap-3">
                {comparisonListings.length > 0 ? (
                  comparisonListings.map((listing: any) => {
                    const inStock = (listing.stock ?? 9999) > 0;
                    const cartItem = cartData?.items?.find(
                      (item: any) => item.productId === listing.id,
                    );
                    const itemQty = cartItem?.quantity || 0;
                    const sellerMoq = listing.moq || listing.minimumOrderQuantity || 1;
                    const minQty = sellerMoq;

                    const itemMrp =
                      listing.mrp ||
                      listing.originalPrice ||
                      displayProduct.mrp ||
                      displayProduct.originalPrice;
                    // Read PTR discount % directly from discountMeta — do NOT recalculate as simple (MRP-price)/MRP
                    // which would show incorrect simple discount % instead of PTR discount %
                    const discountMeta = listing.discountMeta || {};
                    const discountPercent =
                      discountMeta.discountPercent
                        ? discountMeta.discountPercent
                        : 0;

                    const handleQtyChange = (newQty: number) => {
                      const stock = listing.stock ?? 9999;
                      const maxLimit =
                        listing.maximumOrderQuantity ||
                        listing.maxOrderQty ||
                        config?.max_order_qty ||
                        100;
                      const max = Math.min(stock, maxLimit);
                      if (newQty > max) {
                        toast(`Only ${max} units available`, 'error');
                        return;
                      }
                      if (itemQty === 0) {
                        if (newQty > 0) {
                          handleAddToCart(listing, newQty);
                        }
                      } else {
                        handleUpdateQty(listing, newQty);
                      }
                    };

                    return (
                      <div
                        key={listing.id}
                        className="glass-panel flex w-full flex-row items-center justify-between gap-2.5 p-2.5 transition-all duration-200 hover:bg-white/70 hover:shadow-[0_10px_26px_-14px_rgba(88,54,150,0.38)] sm:p-3"
                      >
                        {/* 1. Price - leads the row, as on the product page */}
                        <div className="flex min-w-0 flex-col items-start justify-center">
                          <span className="truncate text-sm font-medium leading-none tracking-tight text-gray-800 sm:text-base">
                            ₹{Math.round(listing.price || 0).toLocaleString('en-IN')}
                          </span>
                          {listing.moq > 1 && (
                            <span className="mt-1 truncate text-2xs font-medium leading-none text-gray-500 sm:text-xs">
                              {listing.moq * 10}% off on purchase of {listing.moq}
                            </span>
                          )}
                        </div>

                        {/* 2. Seller rating */}
                        <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1">
                          <Star className="h-3.5 w-3.5 flex-shrink-0 fill-[#f5a623] text-[#f5a623] sm:h-4 sm:w-4" />
                          <span className="text-xs font-bold leading-none text-gray-800 sm:text-sm">
                            {listing.seller?.rating ? listing.seller.rating : 'NA'}
                          </span>
                        </div>

                        {/* 3. Discount badge */}
                        <div className="min-w-0 flex-shrink-0">
                          <div className="flex items-center justify-center gap-0.5 whitespace-nowrap rounded bg-[#854cbc] px-1.5 py-0.5 font-bold tracking-wide text-white shadow-sm sm:gap-1 sm:px-2.5">
                            <span className="text-2xs font-bold sm:text-sm">
                              {discountPercent > 0
                                ? `${discountPercent}%`
                                : (listing.discountType === "SAME_PRODUCT_BONUS"
                                    ? `Buy ${discountMeta.buy || 0} Get ${discountMeta.get || 0}`
                                    : (listing.discountType === "SPECIAL_PRICE" ? `Special` : `${discountPercent || 0}%`))}
                            </span>
                            {(discountPercent > 0 || !listing.discountType) && (
                              <span className="text-2xs font-medium opacity-90">off</span>
                            )}
                          </div>
                        </div>

                        {/* 5. Actions */}
                        <div className="flex flex-shrink-0 items-center justify-end min-w-[32px]">
                          {inStock ? (
                            itemQty > 0 ? (
                              <div className="flex h-7 w-20 select-none items-center justify-between overflow-hidden rounded-[8px] bg-[#48286b] text-2xs font-bold text-white shadow-sm sm:h-8">
                                <button
                                  className="h-full px-2 sm:px-2.5 text-xs font-bold text-white/80 transition-all hover:bg-black/10 hover:text-white active:scale-95"
                                  onClick={() => handleQtyChange(itemQty - 1)}
                                >
                                  -
                                </button>
                                <span className="px-0.5 font-bold">
                                  {String(itemQty).padStart(2, '0')}
                                </span>
                                <button
                                  className="h-full px-2 sm:px-2.5 text-xs font-bold text-white/80 transition-all hover:bg-black/10 hover:text-white active:scale-95 disabled:opacity-50"
                                  disabled={itemQty >= (listing.stock ?? 9999)}
                                  onClick={() => {
                                    handleQtyChange(itemQty + 1);
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleQtyChange(minQty)}
                                className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#854cbc] text-white shadow-[0_6px_16px_-8px_rgba(88,54,150,0.9)] transition-all hover:bg-[#743fa8] focus:outline-none active:scale-95 sm:h-8 sm:w-8"
                              >
                                <Plus className="h-4 w-4 sm:h-4.5 sm:w-4.5 stroke-[3]" />
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => setShowStockAlert(true)}
                              className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 flex items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-500 transition-all hover:bg-red-100 focus:outline-none active:scale-95"
                            >
                              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-6 text-center text-xs font-medium text-gray-400">
                    No active Sellers available for this product.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <NotifyStockAlertModal
        isOpen={showStockAlert}
        productName={displayProduct.name}
        productId={displayProduct.id}
        onClose={() => setShowStockAlert(false)}
      />

      <CustomOrderModal
        isOpen={showCustomOrder}
        onClose={() => setShowCustomOrder(false)}
        productName={displayProduct.name}
        productId={displayProduct.id}
      />
    </>
  );
}
