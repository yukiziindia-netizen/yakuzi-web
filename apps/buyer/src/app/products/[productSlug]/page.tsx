'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Plus, Star, Truck, ChevronDown, ChevronUp, Bell, RotateCcw, Minus, Search, User, Bookmark, ShoppingCart, Package, Filter, Menu, ArrowUpRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useProductById, useProducts } from '@/hooks/useProducts';
import { useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { useToast } from '@/components/shared/Toast';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import Navbar from '@/components/landing/Navbar';
import { generateProductSlug, parseProductIdFromSlug } from '@yukizi/utils';

function Accordion({ title, content, defaultOpen = false }: { title: string, content?: string, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-3">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide"
      >
        {title}
        {isOpen ? <Minus size={14} className="text-gray-400" /> : <Plus size={14} className="text-gray-400" />}
      </button>
      <AnimatePresence>
        {isOpen && content && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2 pr-4 text-[10px] sm:text-[11px] text-gray-400 font-medium leading-relaxed max-h-[70px] overflow-y-auto purple-scroll relative">
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
    <div className={`relative bg-white rounded-xl border ${isYukiziChoice ? 'border-[#e2cbf5] shadow-[0_2px_15px_rgba(133,76,188,0.12)]' : 'border-gray-200'} p-3 flex flex-col hover:shadow-lg transition-all min-w-[160px] w-[180px]`}>
      
      {/* Top Badges */}
      <div className="flex justify-between items-start mb-1 relative z-10">
         {isYukiziChoice && <div className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-[#854cbc] text-white pointer-events-none">Yukizi Choice</div>}
         {hasTimer && <div className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 ml-auto bg-white pointer-events-none">1:52:10</div>}
      </div>
      
      {isYukiziChoice && <div className="absolute -top-2 right-2 text-[9px] text-gray-400 font-medium pointer-events-none">Ad</div>}
      
      <div className="absolute top-7 left-2 text-gray-300 z-10 cursor-pointer hover:text-gray-500"><Share2 size={12} strokeWidth={2.5}/></div>
      {index === 0 && <div className="absolute top-7 right-2 text-orange-400 z-10 cursor-pointer hover:text-orange-500"><Plus size={14} strokeWidth={3}/></div>}
      {index === 2 && <div className="absolute top-7 right-2 text-red-500 z-10 cursor-pointer hover:text-red-600"><Bell size={12} strokeWidth={3} /></div>}

      {/* Right Edge Ribbon */}
      <div 
        className={`absolute top-[45%] right-0 w-2 h-4 ${index === 1 ? 'bg-[#854cbc]' : 'bg-[#e5e7eb]'} z-10`} 
        style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 25% 50%, 0 0)' }} 
      />

      <Link href={`/products/${generateProductSlug(prod.name || 'Product', prod.id || 'prod-' + index)}`} className="w-full h-28 flex items-center justify-center mb-3 mt-4 relative group-hover:scale-105 transition-transform z-0">
         <img src={prod.image || (prod.images && prod.images[0]) || `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent((prod.name || 'PR').trim().split(/\s+/).length === 1 ? (prod.name || 'PR').trim().substring(0,2).toUpperCase() : ((prod.name || 'PR').trim().split(/\s+/)[0][0] + (prod.name || 'PR').trim().split(/\s+/)[(prod.name || 'PR').trim().split(/\s+/).length - 1][0]).toUpperCase())}`} alt={prod.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
      </Link>

      <div className="mt-auto flex flex-col gap-1.5">
         <div className="flex justify-between items-center gap-1">
            <h3 className="text-[11px] font-medium text-gray-500 truncate flex-1">{prod.name}</h3>
            <div className="bg-gray-400 rounded-full p-[2px] flex-shrink-0 cursor-pointer hover:bg-gray-500 transition-colors"><ArrowUpRight size={10} className="text-white" strokeWidth={3} /></div>
         </div>
         
         <div className="flex justify-between items-center mt-1">
            <div className="flex items-baseline gap-1">
               <span className="text-[12px] font-bold text-gray-400">₹{prod.price}</span>
               <span className="text-[9px] text-gray-300 line-through">₹{prod.mrp || prod.originalPrice || prod.price}</span>
            </div>
            <div className="flex items-center gap-0.5">
               <Star size={10} className="fill-[#854cbc] text-[#854cbc]" />
               <span className="text-[10px] font-bold text-gray-600">{prod.rating || '4.5'}</span>
            </div>
         </div>

         {index !== 2 && <div className="text-[8px] font-bold text-gray-300 mt-0.5">25% off</div>}
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

  const cartQuantityMap = new Map<string, number>();
  if (cartData?.items) {
    cartData.items.forEach((item: any) => {
      if (item.productId) cartQuantityMap.set(item.productId, item.quantity);
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
      <main className="min-h-screen bg-white pb-32 flex flex-col">
         <Navbar />
         <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#854cbc]" />
         </div>
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className="min-h-screen bg-white pb-32 flex flex-col">
         <Navbar />
         <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 font-bold text-xl">Product not found</div>
         </div>
      </main>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images.map((img: any) => img.url || img) : [`https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent((product.name || 'PR').trim().split(/\s+/).length === 1 ? (product.name || 'PR').trim().substring(0,2).toUpperCase() : ((product.name || 'PR').trim().split(/\s+/)[0][0] + (product.name || 'PR').trim().split(/\s+/)[(product.name || 'PR').trim().split(/\s+/).length - 1][0]).toUpperCase())}`];
  const listings = product.listings || [];
  const validListings = listings.filter((l: any) => l.price != null);
  const displayPrice = validListings.length > 0 ? Math.min(...validListings.map((l: any) => l.price)) : product.price;
  const displayMrp = validListings.find((l: any) => l.mrp || l.originalPrice)?.mrp || validListings.find((l: any) => l.mrp || l.originalPrice)?.originalPrice || product.mrp || product.originalPrice;
  const relatedProducts = relatedProductsData?.data || [];

  // Filter listings based on the selected variant
  const filteredListings = productVariants.length > 0 && selectedVariantName
    ? listings.filter((l: any) => l.variantName === selectedVariantName || l.name === selectedVariantName || l.name?.includes(selectedVariantName))
    : listings;

  const currentVariant = productVariants.find((v: any) => v.name === selectedVariantName);

  return (
    <main className="min-h-screen bg-white pb-32">
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .purple-scroll::-webkit-scrollbar { width: 5px; }
        .purple-scroll::-webkit-scrollbar-track { background: transparent; }
        .purple-scroll::-webkit-scrollbar-thumb { background: #854cbc; border-radius: 5px; }
      `}} />

      <div className="max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-4 sm:pt-6">
        
        {/* Top Badges (Desktop layout simulation) */}
        <div className="flex justify-between items-end mb-3 max-w-[48%]">
          <div className="bg-[#854cbc] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm tracking-wide">Yukizi Choice</div>
          <div className="text-[11px] font-semibold text-gray-500">Ad</div>
        </div>

        {/* 2-Column Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-x-12 gap-y-8">
          
          {/* LEFT COLUMN */}
          <div className="flex flex-col">
            
            {/* Image block */}
            <div className="relative rounded-2xl overflow-hidden h-[340px] sm:h-[420px] lg:h-[500px] xl:h-[600px] 2xl:h-[650px] mb-6 shadow-sm"
                 style={{
                   background: 'repeating-linear-gradient(45deg, #a75ee7, #a75ee7 20px, #c084f5 20px, #c084f5 40px)',
                 }}>
              
              {/* Share icon */}
              <div className="absolute top-4 left-4 z-20 bg-white/95 p-2 rounded-full shadow-md cursor-pointer hover:bg-white transition-colors">
                  <Share2 size={16} className="text-gray-500" />
              </div>

              {/* Right ribbon */}
              <div 
                className="absolute top-[25%] right-0 w-6 h-8 bg-white border-l-[3px] border-[#854cbc] z-20 shadow-sm" 
                style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 40% 50%, 0 0)' }} 
              />

              {/* Thumbnails */}
              <div className="absolute left-4 top-[55%] -translate-y-1/2 flex flex-col gap-3 z-20">
                {images.map((img: string, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImage(i)}
                    className={`w-12 h-12 rounded-lg overflow-hidden bg-[#ffb74d] border-2 transition-all ${activeImage === i ? 'border-orange-500 shadow-md scale-105' : 'border-transparent hover:scale-105'}`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-contain mix-blend-multiply opacity-90" />
                  </button>
                ))}
              </div>

              {/* Main Image display */}
              <div className="w-full h-full flex items-center justify-center p-6 relative z-10">
                  <img src={images[activeImage] || images[0]} alt="Main Product" className="max-h-full max-w-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)]" />
              </div>
            </div>

            {/* Accordions */}
            <div className="pr-4 lg:pr-10">
                <Accordion title="DESCRIPTION" content={product.description || 'No description available.'} defaultOpen={true} />
                <Accordion title="PRODUCT SPECIFICATIONS" />
                <Accordion title="SHIPPING & RETURN INFO" />
                <Accordion title="ADDITIONAL INFO" />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col pt-1">
            
            {/* Breadcrumbs */}
            <div className="text-[11px] text-gray-500 font-semibold mb-4 tracking-wide flex items-center gap-1.5 overflow-x-auto whitespace-nowrap hide-scrollbar">
              <Link href="/" className="hover:text-[#854cbc] transition-colors">Home</Link>
              <span className="text-gray-300">&gt;</span>
              
              {product.category && (
                <>
                  <Link href={`/category/${product.category.slug || product.category.id}`} className="hover:text-[#854cbc] transition-colors">
                    {product.category.name || 'Category'}
                  </Link>
                  <span className="text-gray-300">&gt;</span>
                </>
              )}
              
              {product.subCategory && (
                <>
                  <span className="hover:text-[#854cbc] transition-colors cursor-pointer">
                    {product.subCategory.name}
                  </span>
                  <span className="text-gray-300">&gt;</span>
                </>
              )}
              
              <span className="text-gray-700 truncate max-w-[150px] sm:max-w-[200px]">{product.name}</span>
            </div>

            {/* Title block */}
            <div className="flex justify-between items-start mb-2 gap-4">
              <h1 className="text-2xl sm:text-[26px] font-bold text-gray-500 tracking-tight leading-tight">
                {product.name}
              </h1>
              <button className="text-orange-400 hover:text-orange-500 mt-1 shrink-0 transition-colors">
                 <Plus size={32} strokeWidth={2.5} />
              </button>
            </div>

            {/* Price Row */}
            <div className="flex items-end gap-3 mb-4">
              {displayPrice ? <span className="text-[26px] sm:text-3xl font-extrabold text-gray-700 leading-none tracking-tighter">₹{displayPrice}</span> : null}
              {displayMrp && displayPrice && displayMrp > displayPrice && (
                <span className="text-[13px] font-bold text-gray-400 line-through leading-none mb-1">₹{displayMrp}</span>
              )}
            </div>

            {/* Discount & Rating row */}
            <div className="flex items-center justify-between mb-8 pr-4">
              <span className="text-[15px] font-black text-gray-700">
                {displayMrp && displayPrice && displayMrp > displayPrice 
                  ? `${Math.round(((displayMrp - displayPrice) / displayMrp) * 100)}% off` 
                  : (product.discount ? `${product.discount}% off` : 'Special')}
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-[#9ca3af] text-white rounded-md px-2 py-0.5">
                  <Truck size={14} strokeWidth={2.5} className="text-white" />
                  <span className="text-[12px] font-bold italic tracking-wide pt-[1px]">3 days</span>
                </div>
                <div className="flex items-center gap-2 text-[#854cbc]">
                  <Star size={20} fill="currentColor" />
                  <span className="text-xl font-medium text-gray-800 leading-none">4.5</span>
                </div>
              </div>
            </div>

            {/* Variant Selector */}
            {productVariants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Available Variants</h3>
                <div className="flex flex-wrap gap-2">
                  {productVariants.map((variant: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariantName(variant.name)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
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
              <div className="space-y-2 pr-4 max-h-[380px] overflow-y-auto purple-scroll">
                {(filteredListings.length > 0 ? filteredListings : (productVariants.length > 0 ? [{ ...product, price: currentVariant?.price || product.price, isNotAvailable: true, sellerName: 'No Sellers Available' }] : [product])).map((listing: any, idx: number) => {
                  const itemQty = cartQuantityMap.get(product.id) || 0;
                  const showAdd = itemQty === 0;
                  const price = listing.price || product.price;
                  const discountStr = listing.discount ? `${listing.discount}% off` : 'Special';
                  const sellerName = listing.sellerName || 'Verified Seller';
                  
                  return (
                    <div key={listing.id || idx} className="flex items-center bg-[#e9e9e9] rounded-md p-2.5 px-4 gap-4 sm:gap-6 shadow-sm border border-[#e5e7eb]/50">
                      {/* Left Badge */}
                      <div className="bg-[#854cbc] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm shrink-0 flex items-center">
                        {discountStr}
                      </div>
                      {/* Center-left Text */}
                      <div className="flex flex-col flex-1 min-w-[100px]">
                        <span className="text-[14px] sm:text-[15px] font-bold text-gray-800 leading-none">₹{price}</span>
                        <span className="text-[9px] font-medium text-gray-400 mt-1">{sellerName}</span>
                      </div>
                      {/* Center Rating */}
                      <div className="flex items-center gap-1.5 text-[#854cbc] shrink-0 w-12 sm:w-16">
                          <Star size={14} fill="currentColor" />
                          <span className="text-[13px] font-medium text-gray-800">{listing.rating || '4.5'}</span>
                      </div>
                      {/* Center-right Delivery */}
                      <div className="flex items-center shrink-0 w-16 sm:w-20">
                          <div className="flex items-center gap-1 bg-[#d1d1d1] rounded px-2 py-0.5 relative">
                            <span className="text-[9px] font-bold text-gray-600 italic tracking-wide">3 days</span>
                            <Truck size={12} className="text-gray-500" strokeWidth={3} />
                          </div>
                      </div>
                      {/* Right Action */}
                      <div className="flex items-center justify-end w-[80px] sm:w-[90px] shrink-0">
                        {listing.isNotAvailable ? (
                          <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded shadow-sm border border-red-100">N/A</span>
                        ) : showAdd ? (
                          <button onClick={() => addToCart.mutate({ 
                            productId: product.id, 
                            quantity: 1,
                            listingId: listing.id,
                            productName: product.name,
                            price: price,
                            originalPrice: product.mrp || product.originalPrice || (price * 1.2),
                            discount: discountStr,
                            rating: listing.rating || '4.5',
                            image: product.image || (product.images && product.images[0]),
                            isYukiziChoice: idx === 0,
                            sellerName: sellerName
                          })} className="text-orange-400 hover:text-orange-500 transition-colors w-full flex justify-center">
                            <Plus size={22} strokeWidth={3} />
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-[#6a34a8] text-white rounded-md px-2 py-1 w-full shadow-sm text-xs font-bold">
                            <Minus 
                              size={12} 
                              className="text-white cursor-pointer hover:opacity-80" 
                              strokeWidth={3} 
                              onClick={() => {
                                if (itemQty > 1) {
                                  updateCartItem.mutate({ productId: product.id, quantity: itemQty - 1 });
                                } else {
                                  removeCartItem.mutate(product.id);
                                }
                              }}
                            />
                            <span className="mx-2 font-semibold text-[13px]">{itemQty < 10 ? `0${itemQty}` : itemQty}</span>
                            <Plus 
                              size={12} 
                              className="text-white cursor-pointer hover:opacity-80" 
                              strokeWidth={3} 
                              onClick={() => updateCartItem.mutate({ productId: product.id, quantity: itemQty + 1 })}
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
        <div className="mt-12 flex flex-col lg:flex-row gap-8 lg:gap-10 pt-8 border-t border-gray-100">
          
          {/* Left: Related Products */}
          <div className="flex-1 lg:max-w-[45%] lg:pr-8 lg:border-r border-gray-100">
            <h2 className="text-xl font-bold text-gray-500 mb-5">Related Products</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
               {relatedProducts.map((prod: any, idx: number) => (
                  <RelatedProductCard key={prod.id} prod={prod} index={idx} />
               ))}
            </div>
          </div>

          {/* Right: Reviews */}
          <div className="flex-[1.2] lg:pl-2">
            <h2 className="text-xl font-bold text-gray-500 mb-5">Reviews</h2>
            
            {/* Review Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
               <div>
                 <div className="flex items-center gap-3 mb-1">
                   <div className="flex text-[#854cbc] gap-1">
                     {[1,2,3,4,5].map((_, i) => (
                        <div key={i} className="relative w-6 h-6">
                           {i < 4 ? <Star size={24} fill="currentColor" /> : (
                             <>
                               <Star size={24} fill="none" stroke="currentColor" className="absolute text-[#854cbc]" />
                               <div className="absolute inset-0 overflow-hidden w-[80%]">
                                 <Star size={24} fill="currentColor" className="text-[#854cbc]" />
                               </div>
                             </>
                           )}
                        </div>
                     ))}
                   </div>
                   <span className="text-[28px] font-black text-gray-800 leading-none">4.5</span>
                 </div>
                 <p className="text-[13px] font-medium text-gray-400">4.8 out of 5 stars (based on 6 reviews)</p>
               </div>
               <button className="bg-[#854cbc] hover:bg-purple-800 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors shadow-sm">
                 See all reviews
               </button>
            </div>

            {/* Review Cards */}
            <div className="flex flex-col sm:flex-row gap-4 overflow-x-auto hide-scrollbar pb-2">
               {/* Card 1 */}
               <div className="min-w-[200px] flex-1 border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between">
                 <p className="text-[11px] text-gray-500 font-medium mb-4 leading-relaxed">I gifted this shirt to my friend and he love it so much ! Thank you CS 💖?</p>
                 <div>
                    <div className="flex text-[#b165f1] mb-1.5 gap-0.5">
                      {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                    </div>
                    <p className="text-[10px] text-gray-400 font-semibold">- Kshitij, January 24, 2024</p>
                 </div>
               </div>

               {/* Card 2 */}
               <div className="min-w-[280px] flex-[1.5] border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex gap-4">
                 <div className="flex flex-col justify-between flex-1">
                   <p className="text-[11px] text-gray-500 font-medium mb-4 leading-relaxed pr-2">
                     nice printing excellent product, but fade as get washed ... <span className="font-bold text-gray-700 cursor-pointer hover:text-black">See more</span>
                   </p>
                   <div>
                      <div className="flex text-[#b165f1] mb-1.5 gap-0.5">
                        {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                      </div>
                      <p className="text-[10px] text-gray-400 font-semibold">- DJD, April 29, 2023</p>
                   </div>
                 </div>
                 <div className="w-16 h-20 sm:w-[72px] sm:h-[88px] rounded-lg overflow-hidden shrink-0 border border-gray-100">
                    <img src={images[2] || images[0]} alt="review" className="w-full h-full object-cover" />
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
