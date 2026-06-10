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
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useProductById, useProducts } from '@/hooks/useProducts';
import { useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { useToast } from '@/components/shared/Toast';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import Navbar from '@/components/landing/Navbar';
import { generateProductSlug, parseProductIdFromSlug } from '@yukizi/utils';

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
        className="flex w-full items-center justify-between text-left text-[11px] font-bold uppercase tracking-wide text-gray-500"
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
  const isYukiziChoice = index === 0;
  const hasTimer = index === 1;

  return (
    <div
      className={`relative rounded-xl border bg-white ${isYukiziChoice ? 'border-[#e2cbf5] shadow-[0_2px_15px_rgba(133,76,188,0.12)]' : 'border-gray-200'} flex w-[180px] min-w-[160px] flex-col p-3 transition-all hover:shadow-lg`}
    >
      {/* Top Badges */}
      <div className="relative z-10 mb-1 flex items-start justify-between">
        {isYukiziChoice && (
          <div className="pointer-events-none rounded-full bg-[#854cbc] px-2 py-0.5 text-[8px] font-bold text-white">
            Yukizi Choice
          </div>
        )}
        {hasTimer && (
          <div className="pointer-events-none ml-auto rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[8px] font-bold text-gray-500">
            1:52:10
          </div>
        )}
      </div>

      {isYukiziChoice && (
        <div className="pointer-events-none absolute -top-2 right-2 text-[9px] font-medium text-gray-400">
          Ad
        </div>
      )}

      <div className="absolute left-2 top-7 z-10 cursor-pointer text-gray-300 hover:text-gray-500">
        <Share2 size={12} strokeWidth={2.5} />
      </div>
      {index === 0 && (
        <div className="absolute right-2 top-7 z-10 cursor-pointer text-orange-400 hover:text-orange-500">
          <Plus size={14} strokeWidth={3} />
        </div>
      )}
      {index === 2 && (
        <div className="absolute right-2 top-7 z-10 cursor-pointer text-red-500 hover:text-red-600">
          <Bell size={12} strokeWidth={3} />
        </div>
      )}

      {/* Right Edge Ribbon */}
      <div
        className={`absolute right-0 top-[45%] h-4 w-2 ${index === 1 ? 'bg-[#854cbc]' : 'bg-[#e5e7eb]'} z-10`}
        style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 25% 50%, 0 0)' }}
      />

      <Link
        href={`/products/${generateProductSlug(prod.name || 'Product', prod.id || 'prod-' + index)}`}
        className="relative z-0 mb-3 mt-4 flex h-28 w-full items-center justify-center transition-transform group-hover:scale-105"
      >
        <img
          src={
            prod.image ||
            (prod.images && prod.images[0]) ||
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
            <span className="text-[12px] font-bold text-gray-400">₹{prod.price}</span>
            <span className="text-[9px] text-gray-300 line-through">
              ₹{prod.mrp || prod.originalPrice || prod.price}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Star size={10} className="fill-[#854cbc] text-[#854cbc]" />
            <span className="text-[10px] font-bold text-gray-600">{prod.rating || '4.5'}</span>
          </div>
        </div>

        {index !== 2 && <div className="mt-0.5 text-[8px] font-bold text-gray-300">25% off</div>}
      </div>
    </div>
  );
}

export default function AnimeProductPage({ params }: { params: { productSlug: string } }) {
  const [activeImage, setActiveImage] = useState(0);
  const [pendingCartProducts, setPendingCartProducts] = useState<Set<string>>(new Set());
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

  const { data: relatedProductsData } = useProducts({
    categoryId: product?.category?.id,
    limit: 6,
  });

  const productOptions = product?.options || [];
  const productVariants = product?.variants || [];

  // Ensure first variant is selected by default
  useEffect(() => {
    if (productVariants.length > 0 && !selectedVariantName) {
      setSelectedVariantName(productVariants[0].name);
    }
  }, [productVariants, selectedVariantName]);

  const cartItemMap = new Map<string, any>();
  if (cartData?.items) {
    cartData.items.forEach((item: any) => {
      if (item.productId) cartItemMap.set(item.productId, item);
    });
  }

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

  const currentVariant = productVariants.find((v: any) => v.name === selectedVariantName);

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
        {/* Top Badges (Desktop layout simulation) */}
        <div className="mb-3 flex max-w-[48%] items-end justify-between">
          <div className="rounded-full bg-[#854cbc] px-3 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm">
            Yukizi Choice
          </div>
          <div className="text-[11px] font-semibold text-gray-500">Ad</div>
        </div>

        {/* 2-Column Main Layout */}
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-[1.1fr_1fr]">
          {/* LEFT COLUMN */}
          <div className="flex flex-col">
            {/* Image block */}
            <div
              className="relative mb-6 h-[340px] overflow-hidden rounded-2xl shadow-sm sm:h-[420px] lg:h-[500px] xl:h-[600px] 2xl:h-[650px]"
              style={{
                background:
                  'repeating-linear-gradient(45deg, #a75ee7, #a75ee7 20px, #c084f5 20px, #c084f5 40px)',
              }}
            >
              {/* Share icon */}
              <div className="absolute left-4 top-4 z-20 cursor-pointer rounded-full bg-white/95 p-2 shadow-md transition-colors hover:bg-white">
                <Share2 size={16} className="text-gray-500" />
              </div>

              {/* Right ribbon */}
              <div
                className="absolute right-0 top-[25%] z-20 h-8 w-6 border-l-[3px] border-[#854cbc] bg-white shadow-sm"
                style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 40% 50%, 0 0)' }}
              />

              {/* Thumbnails */}
              <div className="absolute left-4 top-[55%] z-20 flex -translate-y-1/2 flex-col gap-3">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`h-12 w-12 overflow-hidden rounded-lg border-2 bg-[#ffb74d] transition-all ${activeImage === i ? 'scale-105 border-orange-500 shadow-md' : 'border-transparent hover:scale-105'}`}
                  >
                    <img
                      src={img}
                      alt="thumb"
                      className="h-full w-full object-contain opacity-90 mix-blend-multiply"
                    />
                  </button>
                ))}
              </div>

              {/* Main Image display */}
              <div className="relative z-10 flex h-full w-full items-center justify-center p-6">
                <img
                  src={images[activeImage] || images[0]}
                  alt="Main Product"
                  className="max-h-full max-w-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)]"
                />
              </div>
            </div>

            {/* Accordions */}
            <div className="pr-4 lg:pr-10">
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

          {/* RIGHT COLUMN */}
          <div className="flex flex-col pt-1">
            {/* Breadcrumbs */}
            <div className="hide-scrollbar mb-4 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[11px] font-semibold tracking-wide text-gray-500">
              <Link href="/" className="transition-colors hover:text-[#854cbc]">
                Home
              </Link>
              <span className="text-gray-300">&gt;</span>

              {product.category && (
                <>
                  <Link
                    href={`/category/${product.category.slug || product.category.id}`}
                    className="transition-colors hover:text-[#854cbc]"
                  >
                    {product.category.name || 'Category'}
                  </Link>
                  <span className="text-gray-300">&gt;</span>
                </>
              )}

              {product.subCategory && (
                <>
                  <span className="cursor-pointer transition-colors hover:text-[#854cbc]">
                    {product.subCategory.name}
                  </span>
                  <span className="text-gray-300">&gt;</span>
                </>
              )}

              <span className="max-w-[150px] truncate text-gray-700 sm:max-w-[200px]">
                {product.name}
              </span>
            </div>

            {/* Title block */}
            <div className="mb-2">
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-500 sm:text-[26px]">
                {product.name}
              </h1>
            </div>

            {/* Price Row */}
            <div className="mb-4 flex items-end gap-3">
              {displayPrice ? (
                <span className="text-[26px] font-extrabold leading-none tracking-tighter text-gray-700 sm:text-3xl">
                  ₹{displayPrice}
                </span>
              ) : null}
              {displayMrp && displayPrice && displayMrp > displayPrice && (
                <span className="mb-1 text-[13px] font-bold leading-none text-gray-400 line-through">
                  ₹{displayMrp}
                </span>
              )}
            </div>

            {/* Discount & Rating row */}
            <div className="mb-8 flex items-center justify-between pr-4">
              <span className="text-[15px] font-black text-gray-700">
                {displayMrp && displayPrice && displayMrp > displayPrice
                  ? `${Math.round(((displayMrp - displayPrice) / displayMrp) * 100)}% off`
                  : product.discount
                    ? `${product.discount}% off`
                    : 'Special'}
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 rounded-md bg-[#9ca3af] px-2 py-0.5 text-white">
                  <Truck size={14} strokeWidth={2.5} className="text-white" />
                  <span className="pt-[1px] text-[12px] font-bold italic tracking-wide">
                    3 days
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#854cbc]">
                  <Star size={20} fill="currentColor" />
                  <span className="text-xl font-medium leading-none text-gray-800">4.5</span>
                </div>
              </div>
            </div>

            {/* Variant Selector */}
            {productVariants.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-bold text-gray-700">Available Variants</h3>
                <div className="flex flex-wrap gap-2">
                  {productVariants.map((variant: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariantName(variant.name)}
                      className={`rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all ${
                        selectedVariantName === variant.name
                          ? 'border-[#854cbc] bg-[#854cbc]/10 text-[#854cbc]'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variations List */}
            <div className="relative">
              <div className="purple-scroll max-h-[380px] space-y-2 overflow-y-auto pr-4">
                {(filteredListings.length > 0
                  ? filteredListings
                  : productVariants.length > 0
                    ? [
                        {
                          ...product,
                          price: currentVariant?.price || product.price,
                          isNotAvailable: true,
                          sellerName: 'No Sellers Available',
                        },
                      ]
                    : [product]
                ).map((listing: any, idx: number) => {
                  const cartItem = cartItemMap.get(product.id);
                  const itemQty = cartItem?.quantity || 0;
                  const showAdd = itemQty === 0;
                  const price = listing.price || product.price;
                  const discountStr = listing.discount ? `${listing.discount}% off` : 'Special';
                  const sellerName = listing.sellerName || 'Verified Seller';

                  return (
                    <div
                      key={listing.id || idx}
                      className="flex items-center gap-4 rounded-md border border-[#e5e7eb]/50 bg-[#e9e9e9] p-2.5 px-4 shadow-sm sm:gap-6"
                    >
                      {/* Left Badge */}
                      <div className="flex shrink-0 items-center rounded bg-[#854cbc] px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                        {discountStr}
                      </div>
                      {/* Center-left Text */}
                      <div className="flex min-w-[100px] flex-1 flex-col">
                        <span className="text-[14px] font-bold leading-none text-gray-800 sm:text-[15px]">
                          ₹{price}
                        </span>
                        <span className="mt-1 text-[9px] font-medium text-gray-400">
                          {sellerName}
                        </span>
                      </div>
                      {/* Center Rating */}
                      <div className="flex w-12 shrink-0 items-center gap-1.5 text-[#854cbc] sm:w-16">
                        <Star size={14} fill="currentColor" />
                        <span className="text-[13px] font-medium text-gray-800">
                          {listing.rating || '4.5'}
                        </span>
                      </div>
                      {/* Center-right Delivery */}
                      <div className="flex w-16 shrink-0 items-center sm:w-20">
                        <div className="relative flex items-center gap-1 rounded bg-[#d1d1d1] px-2 py-0.5">
                          <span className="text-[9px] font-bold italic tracking-wide text-gray-600">
                            3 days
                          </span>
                          <Truck size={12} className="text-gray-500" strokeWidth={3} />
                        </div>
                      </div>
                      {/* Right Action */}
                      <div className="flex w-[80px] shrink-0 items-center justify-end sm:w-[90px]">
                        {listing.isNotAvailable ? (
                          <span className="rounded border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-500 shadow-sm">
                            N/A
                          </span>
                        ) : showAdd ? (
                          <button
                            onClick={() =>
                              addToCart.mutate({
                                productId: product.id,
                                quantity: 1,
                                listingId: listing.id,
                                productName: product.name,
                                price: price,
                                originalPrice: product.mrp || product.originalPrice || price * 1.2,
                                discount: discountStr,
                                rating: listing.rating || '4.5',
                                image: product.image || (product.images && product.images[0]),
                                isYukiziChoice: idx === 0,
                                sellerName: sellerName,
                              })
                            }
                            className="flex w-full justify-center text-orange-400 transition-colors hover:text-orange-500"
                          >
                            <Plus size={22} strokeWidth={3} />
                          </button>
                        ) : (
                          <div className="flex w-full items-center justify-between rounded-md bg-[#6a34a8] px-2 py-1 text-xs font-bold text-white shadow-sm">
                            <Minus
                              size={12}
                              className="cursor-pointer text-white hover:opacity-80"
                              strokeWidth={3}
                              onClick={() => {
                                if (itemQty > 1 && cartItem) {
                                  updateCartItem.mutate({
                                    itemId: cartItem.id,
                                    quantity: itemQty - 1,
                                  });
                                } else if (cartItem) {
                                  removeCartItem.mutate(cartItem.id);
                                }
                              }}
                            />
                            <span className="mx-2 text-[13px] font-semibold">
                              {itemQty < 10 ? `0${itemQty}` : itemQty}
                            </span>
                            <Plus
                              size={12}
                              className="cursor-pointer text-white hover:opacity-80"
                              strokeWidth={3}
                              onClick={() => {
                                if (cartItem) {
                                  updateCartItem.mutate({
                                    itemId: cartItem.id,
                                    quantity: itemQty + 1,
                                  });
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Related Products & Reviews */}
        <div className="mt-12 flex flex-col gap-8 border-t border-gray-100 pt-8 lg:flex-row lg:gap-10">
          {/* Left: Related Products */}
          <div className="flex-1 border-gray-100 lg:max-w-[45%] lg:border-r lg:pr-8">
            <h2 className="mb-5 text-xl font-bold text-gray-500">Related Products</h2>
            <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-4">
              {relatedProducts.map((prod: any, idx: number) => (
                <RelatedProductCard key={prod.id} prod={prod} index={idx} />
              ))}
            </div>
          </div>

          {/* Right: Reviews */}
          <div className="flex-[1.2] lg:pl-2">
            <h2 className="mb-5 text-xl font-bold text-gray-500">Reviews</h2>

            {/* Review Header */}
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="mb-1 flex items-center gap-3">
                  <div className="flex gap-1 text-[#854cbc]">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <div key={i} className="relative h-6 w-6">
                        {i < 4 ? (
                          <Star size={24} fill="currentColor" />
                        ) : (
                          <>
                            <Star
                              size={24}
                              fill="none"
                              stroke="currentColor"
                              className="absolute text-[#854cbc]"
                            />
                            <div className="absolute inset-0 w-[80%] overflow-hidden">
                              <Star size={24} fill="currentColor" className="text-[#854cbc]" />
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="text-[28px] font-black leading-none text-gray-800">4.5</span>
                </div>
                <p className="text-[13px] font-medium text-gray-400">
                  4.8 out of 5 stars (based on 6 reviews)
                </p>
              </div>
              <button className="rounded-lg bg-[#854cbc] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-purple-800">
                See all reviews
              </button>
            </div>

            {/* Review Cards */}
            <div className="hide-scrollbar flex flex-col gap-4 overflow-x-auto pb-2 sm:flex-row">
              {/* Card 1 */}
              <div className="flex min-w-[200px] flex-1 flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="mb-4 text-[11px] font-medium leading-relaxed text-gray-500">
                  I gifted this shirt to my friend and he love it so much ! Thank you CS 💖?
                </p>
                <div>
                  <div className="mb-1.5 flex gap-0.5 text-[#b165f1]">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-[10px] font-semibold text-gray-400">
                    - Kshitij, January 24, 2024
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="flex min-w-[280px] flex-[1.5] gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-1 flex-col justify-between">
                  <p className="mb-4 pr-2 text-[11px] font-medium leading-relaxed text-gray-500">
                    nice printing excellent product, but fade as get washed ...{' '}
                    <span className="cursor-pointer font-bold text-gray-700 hover:text-black">
                      See more
                    </span>
                  </p>
                  <div>
                    <div className="mb-1.5 flex gap-0.5 text-[#b165f1]">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-[10px] font-semibold text-gray-400">- DJD, April 29, 2023</p>
                  </div>
                </div>
                <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-100 sm:h-[88px] sm:w-[72px]">
                  <img
                    src={images[2] || images[0]}
                    alt="review"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Navbar />
    </main>
  );
}
