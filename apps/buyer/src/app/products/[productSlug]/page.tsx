'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Plus, Star, Truck, ChevronDown, Bell, RotateCcw, Minus, Search, User, Bookmark, ShoppingCart, Package, Filter, Menu, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useProductById, useProducts } from '@/hooks/useProducts';
import { useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { useToast } from '@/components/shared/Toast';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import Navbar from '@/components/landing/Navbar';

function Accordion({ title, content, defaultOpen = false }: { title: string, content?: string, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left text-[11px] sm:text-xs font-bold text-gray-600 uppercase tracking-widest"
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
            <p className="pt-3 text-sm text-gray-400 font-medium leading-relaxed whitespace-pre-line">
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: { productSlug: string } }) {
  const [activeImage, setActiveImage] = useState(0);
  const [pendingCartProducts, setPendingCartProducts] = useState<Set<string>>(new Set());

  // Extract ID from slug if it contains one (e.g. resident-evil-leon-12345)
  const productSlugOrId = params.productSlug.split('-').pop() || params.productSlug;
  
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

  const images = product.images && product.images.length > 0 ? product.images.map((img: any) => img.url || img) : ['/products/pharma_bottle.png'];
  const listings = product.listings || [];
  const relatedProducts = relatedProductsData?.data || [];

  return (
    <main className="min-h-screen bg-white pb-32 relative overflow-hidden">
      {/* Background gradients similar to product list page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-cyan-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-[#e6fa64] rounded-full mix-blend-multiply filter blur-[150px] opacity-10 pointer-events-none"></div>
      </div>
      
      <div className="relative z-50">
         <Navbar showUserActions={true} />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 relative z-10">
        
        {/* Responsive Grid/Flex layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-x-20 gap-y-6">
          
          {/* 1. Main Image Block */}
          <div className="order-1 lg:col-start-1 lg:row-start-1 lg:row-end-3">
             <div className="relative bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden flex h-[350px] sm:h-[450px]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
                  {images.map((img: string, i: number) => (
                    <button 
                      key={i} 
                      onClick={() => setActiveImage(i)}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 transition-all ${activeImage === i ? 'border-emerald-500 scale-110' : 'border-gray-100 hover:border-emerald-300'}`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover bg-white" />
                    </button>
                  ))}
                </div>

                <div className="w-full h-full flex items-center justify-center p-8 pl-16 relative z-0">
                   <img src={images[activeImage] || images[0]} alt="Main Product" className="max-h-full object-contain mix-blend-multiply drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
                </div>
             </div>
          </div>

          {/* 2. Title Block */}
          <div className="order-2 lg:col-start-2 lg:row-start-1">
             <h1 className="text-lg sm:text-2xl font-bold text-gray-800 tracking-tight leading-tight border-b border-gray-100 pb-2">
               {product.name}
             </h1>
             <p className="text-sm font-semibold text-gray-500 mt-2">{product.manufacturer}</p>
             {product.chemicalComposition && (
                 <p className="text-xs text-gray-400 mt-1 italic">{product.chemicalComposition}</p>
             )}
          </div>

          {/* 3. Variations List (Seller Offers) */}
          <div className="order-3 lg:col-start-2 lg:row-start-2">
             <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-3">Available Offers</h3>
             <div className="space-y-1.5 sm:space-y-2">
                {listings.length === 0 && (
                  <div className="text-sm text-gray-500 py-4 bg-gray-50 rounded-lg text-center font-medium border border-gray-100">No sellers currently offer this product.</div>
                )}
                {listings.map((listing: any, i: number) => {
                  const cartQty = cartQuantityMap.get(listing.id) || 0;
                  
                  const handleCartChange = (newQty: number) => {
                      if (newQty <= 0) {
                        const cartItem = cartData?.items?.find((item: any) => item.productId === listing.id);
                        if (cartItem) {
                          removeCartItem.mutate(cartItem.id, {
                            onSuccess: () => toast('Removed from bag', 'success'),
                            onError: () => toast('Failed to remove item', 'error')
                          });
                        }
                        return;
                      }

                      if (pendingCartProducts.has(listing.id)) return;
                      setPendingCartProducts(prev => new Set(prev).add(listing.id));
                      const cleanupPending = () => {
                        setPendingCartProducts(prev => {
                          const next = new Set(prev);
                          next.delete(listing.id);
                          return next;
                        });
                      };

                      const cartItemObj = cartData?.items?.find((item: any) => item.productId === listing.id);
                      if (cartItemObj) {
                        updateCartItem.mutate({ itemId: cartItemObj.id, quantity: newQty }, {
                          onSuccess: () => { toast(`Quantity updated to ${newQty}`, 'success'); cleanupPending(); },
                          onError: () => { toast('Failed to update quantity', 'error'); cleanupPending(); }
                        });
                      } else {
                        addToCart.mutate(
                          {
                            productId: listing.id,
                            quantity: newQty,
                            productName: product.name,
                            price: listing.price,
                            mrp: product.mrp,
                            imageUrl: images[0],
                            stock: listing.stock,
                            moq: listing.moq || 1
                          },
                          {
                            onSuccess: () => { toast(`Added to bag!`, 'success'); cleanupPending(); },
                            onError: (err: any) => { toast(err?.message || 'Failed to add to bag', 'error'); cleanupPending(); },
                          }
                        );
                      }
                  };

                  let discountText = "";
                  if (listing.discountType) {
                      const d = listing.discountMeta;
                      if (listing.discountType === "PTR_DISCOUNT" && d?.discountPercent) discountText = `${d.discountPercent}% Off`;
                      else if (listing.discountType === "SAME_PRODUCT_BONUS" && d?.get) discountText = `(${d.buy}+${d.get}) Free`;
                      else discountText = "Special Offer";
                  }

                  return (
                    <div key={listing.id} className="flex items-center bg-white hover:bg-gray-50 transition-colors rounded-xl p-2 sm:p-3 px-3 gap-2 sm:gap-4 border border-gray-200 shadow-sm">
                      {discountText && (
                        <div className="bg-orange-500 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm shrink-0">
                          {discountText}
                        </div>
                      )}
                      
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[11px] sm:text-sm font-black text-gray-900 leading-none truncate">₹{listing.price}</span>
                        <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 truncate mt-0.5">Sold by {listing.seller?.companyName || 'Seller'}</span>
                      </div>

                      <div className="flex items-center gap-0.5 text-orange-400 w-8 sm:w-12 shrink-0">
                         <Star size={10} fill="currentColor" className="sm:w-3 sm:h-3" />
                         <span className="text-[10px] sm:text-xs font-extrabold">{listing.seller?.rating || 5.0}</span>
                      </div>

                      <div className="flex items-center justify-end gap-1 sm:gap-2 w-[70px] sm:w-[100px] shrink-0">
                        {cartQty > 0 ? (
                          <div className="flex items-center bg-emerald-600 text-white rounded-md h-5 sm:h-6 w-14 sm:w-16">
                            <button onClick={() => handleCartChange(cartQty - 1)} disabled={pendingCartProducts.has(listing.id)} className="px-1.5 sm:px-2 font-bold hover:bg-white/10 rounded-l-md h-full text-[10px] sm:text-xs">-</button>
                            <span className="flex-1 text-center text-[9px] sm:text-[10px] font-bold">{pendingCartProducts.has(listing.id) ? '...' : cartQty}</span>
                            <button onClick={() => handleCartChange(cartQty + 1)} disabled={pendingCartProducts.has(listing.id)} className="px-1.5 sm:px-2 font-bold hover:bg-white/10 rounded-r-md h-full text-[10px] sm:text-xs">+</button>
                          </div>
                        ) : (
                          <button onClick={() => handleCartChange(listing.moq || 1)} disabled={pendingCartProducts.has(listing.id) || listing.stock <= 0} className="text-white w-full flex justify-center py-1 sm:py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-md disabled:opacity-50 transition-colors">
                            {listing.stock > 0 ? <Plus size={14} className="sm:w-4 sm:h-4" strokeWidth={3} /> : <span className="text-[9px] text-white font-bold px-1">Out</span>}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>

          {/* 4. Accordions */}
          <div className="order-4 lg:col-start-1 lg:row-start-3 lg:pr-4">
             {product.description && <Accordion title="DESCRIPTION" content={product.description} defaultOpen={true} />}
             {product.directionsForUse && <Accordion title="DIRECTIONS FOR USE" content={product.directionsForUse} />}
             {product.safetyAdvice && <Accordion title="SAFETY ADVICE" content={product.safetyAdvice} />}
             {product.sideEffects && <Accordion title="SIDE EFFECTS" content={product.sideEffects} />}
             <Accordion title="SHIPPING & RETURN INFO" content="Fast shipping. Returns accepted within 7 days of delivery for unopened items." />
          </div>

        </div>

        {/* Related Products Section */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-8 lg:mt-16 grid grid-cols-1 gap-8 lg:gap-12 max-w-2xl mx-auto lg:max-w-none">
            <div>
               <h2 className="text-sm font-semibold text-gray-600 mb-4 tracking-tight">Related Products</h2>
               <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:flex lg:flex-row lg:overflow-x-auto hide-scrollbar">
                  {relatedProducts.map((prod: any, idx: number) => {
                     const prodImg = prod.image || (prod.images?.[0]?.url) || '/products/pharma_bottle.png';
                     return (
                     <div key={idx} onClick={() => window.location.href = `/products/${prod.id}`} className="relative bg-white rounded-[1rem] border border-gray-100 p-2 sm:p-3 flex flex-col hover:shadow-lg transition-all shadow-sm lg:min-w-[200px] cursor-pointer">
                        <div className="h-20 sm:h-28 flex items-center justify-center mb-2 sm:mb-3 group relative">
                           <img src={prodImg} alt={prod.name} className="max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                        </div>
                        
                        <div className="mt-auto">
                           <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                              <h3 className="text-[9px] sm:text-[10px] font-semibold text-gray-800 truncate">{prod.name}</h3>
                           </div>
                           <div className="flex justify-between items-center">
                              <div className="flex flex-col">
                                 <span className="text-[10px] sm:text-[11px] font-black text-gray-900 leading-none">₹{prod.price || prod.mrp || 0}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  )})}
               </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
