import React, { useState, useEffect } from 'react';
import { Share2, Plus, ArrowUpRight, ChevronRight, ChevronLeft, Filter, X, User, Package, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { OrderFilterDrawer } from './OrderFilterDrawer';
import { OrderedProductsDrawer } from './OrderedProductsDrawer';
import { useOrderById, useOrders } from '@/hooks/useOrders';
import { useAuth } from '@yukizi/api-client';
import type { OrderFilters } from './OrderFilterDrawer';
import { useAddToWishlist, useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/components/shared/Toast';
import WishlistIcon from '@/components/shared/WishlistIcon';


function formatImageUrl(url: any): string | undefined {
  if (!url) return undefined;
  const path = typeof url === 'string' ? url : (url.url || url.path || (Array.isArray(url) ? url[0] : undefined));
  if (!path || typeof path !== 'string') return undefined;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const env = (typeof process !== 'undefined' ? process.env : {}) as any;
  const baseURL = env.NEXT_PUBLIC_API_BASE_URL || env.NEXT_PUBLIC_API_URL || '';
  const cleanBase = baseURL.replace(/\/api\/?$/, '');
  return `${cleanBase}${path.startsWith('/') ? '' : '/'}${path}`;
}

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string | null;
  onLoginClick?: () => void;
}

export function OrderDrawer({ isOpen, onClose, orderId, onLoginClick }: OrderDrawerProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isOrderedProductsOpen, setIsOrderedProductsOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: wishlistData } = useWishlist();
  const { mutate: addToWishlist } = useAddToWishlist();
  const { mutate: removeFromWishlist } = useRemoveFromWishlist();
  const { toast } = useToast();


  useEffect(() => {
    setSelectedOrderId(null);
  }, [orderId]);

  const { isAuthenticated } = useAuth();
  const { data: allOrdersData, isLoading: isLoadingAllOrders } = useOrders({ page: 1, limit: 50 });
  const allOrders = Array.isArray(allOrdersData) ? allOrdersData : ((allOrdersData as any)?.data || (allOrdersData as any)?.data?.orders || []);

  const effectiveOrderId = selectedOrderId || orderId || (allOrders.length > 0 ? allOrders[0].id : '');

  const { data: orderData } = useOrderById(effectiveOrderId || '');
  const order = (orderData as any)?.data || orderData;

  const os = order?.orderStatus || order?.status || 'PLACED';
  const displayStatus = os.replace(/_/g, ' ');

  let orderMonth = 'JAN', orderYear = '2026';
  if (order?.createdAt) {
    const d = new Date(order.createdAt);
    orderMonth = d.toLocaleString('default', { month: 'short' }).toUpperCase();
    orderYear = d.getFullYear().toString();
  }

  const [filters, setFilters] = useState<OrderFilters>({
    paymentStatus: 'All',
    orderStatus: 'All orders',
    year: '2026',
    month: 'All'
  });

  const filteredOrders = React.useMemo(() => {
    return allOrders.filter((o: any) => {
      // Payment Status
      if (filters.paymentStatus !== 'All') {
        const pm = (o.paymentMethod || 'COD').toUpperCase();
        if (pm !== filters.paymentStatus.toUpperCase()) return false;
      }
      
      // Order Status
      if (filters.orderStatus !== 'All orders') {
        const os = (o.status || o.orderStatus || 'PLACED').toUpperCase();
        const target = filters.orderStatus.toUpperCase();
        if (target === 'IN TRANSIT / PLACED') {
           if (os !== 'PLACED' && os !== 'PENDING' && os !== 'IN TRANSIT') return false;
        } else if (os !== target) return false;
      }

      const d = new Date(o.createdAt || new Date());
      
      // Year
      if (filters.year !== 'All') {
        if (d.getFullYear().toString() !== filters.year) return false;
      }
      
      // Month
      if (filters.month !== 'All') {
        const mNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        if (mNames[d.getMonth()] !== filters.month) return false;
      }
      
      return true;
    });
  }, [allOrders, filters]);

  const allOrderedItems = React.useMemo(() => {
    const all = filteredOrders.flatMap((o: any) => o.items || o.orderItems || []);
    return all;
  }, [filteredOrders]);

  const items = allOrderedItems;

  return (
    <>
      {/* Full Page View */}
      <div 
        className={`fixed inset-0 w-full h-full bg-[#fcfcfc] z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}
      >
        <div className="w-full max-w-7xl mx-auto min-h-screen bg-[#fcfcfc] relative flex flex-col px-4 sm:px-6 md:px-8 py-6">
          {/* Close Button */}
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-full z-50 transition-colors border border-gray-200 shadow-sm">
            <X className="w-6 h-6" />
          </button>

        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center h-[80vh] px-6 text-center">
            <User className="w-16 h-16 text-purple-200 mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">Login to View Orders</h3>
            <p className="text-sm text-gray-400 max-w-[280px] mb-6">
              Please sign in to your account to view and track your orders.
            </p>
            <button 
              onClick={() => {
                onClose();
                onLoginClick?.();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm uppercase tracking-wider px-8 py-4 rounded-xl shadow-sm transition-colors"
            >
              Sign In
            </button>
          </div>
        ) : isLoadingAllOrders ? (
          <div className="flex flex-col items-center justify-center h-[80vh] px-6 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-2" />
            <p className="text-sm text-gray-400 font-medium">Loading orders...</p>
          </div>
        ) : allOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[80vh] px-6 text-center">
            <Package className="w-16 h-16 text-purple-200 mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Orders Yet</h3>
            <p className="text-sm text-gray-400 max-w-[280px]">
              You haven't placed any orders yet. Once you place an order, it will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="pr-6 pl-14 py-6 border-b border-gray-100 relative">
              {/* Back Button on Left */}
              <button onClick={onClose} className="absolute left-4 top-6 text-gray-400 hover:text-gray-800 transition-colors p-1.5 z-[80]">
                <ChevronLeft className="w-8 h-8" />
              </button>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[34px] font-extrabold text-gray-800 mr-2">Orders</h2>
                  {filters.paymentStatus !== 'All' && <span className="bg-purple-600 text-white text-[14px] px-4 py-2 rounded shadow-sm font-bold uppercase">{filters.paymentStatus}</span>}
                  {filters.orderStatus !== 'All orders' && <span className="bg-purple-600 text-white text-[14px] px-4 py-2 rounded shadow-sm font-bold capitalize">Status : {filters.orderStatus.toLowerCase()}</span>}
                  {filters.month !== 'All' && <span className="bg-purple-600 text-white text-[14px] px-4 py-2 rounded shadow-sm font-bold uppercase">{filters.month}</span>}
                  {filters.year !== 'All' && <span className="bg-purple-600 text-white text-[14px] px-4 py-2 rounded shadow-sm font-bold">{filters.year}</span>}
                </div>
                
                <div className="flex items-center gap-3.5 mr-12">
                  <span className="bg-purple-600 text-white text-[14px] px-4 py-2 rounded shadow-sm font-bold">All orders</span>
                  <button 
                    onClick={() => setIsFilterOpen(true)}
                    className="text-gray-400 hover:text-purple-600 transition-colors p-2"
                  >
                    <Filter className="w-7 h-7" />
                  </button>
                </div>
              </div>
            </div>

            {/* Ordered Products Section */}
            <div className="px-6 py-4">
              <div 
                className="flex justify-between items-center mb-4 cursor-pointer group"
                onClick={() => setIsOrderedProductsOpen(true)}
              >
                <h3 className="text-[24px] font-extrabold text-gray-700">Ordered Products</h3>
                <ChevronRight className="w-7 h-7 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-2 px-2 snap-x">
                {items.map((item: any, index: number) => {
                  const product = item.sellerOffer || item.product || {};
                  const name = product.name || product.variant?.catalogProduct?.name || 'Unknown Product';
                  const fallbackImage = `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent((name || 'PR').trim().split(/\s+/).length === 1 ? (name || 'PR').trim().substring(0,2).toUpperCase() : ((name || 'PR').trim().split(/\\s+/)[0][0] + (name || 'PR').trim().split(/\\s+/)[(name || 'PR').trim().split(/\\s+/).length - 1][0]).toUpperCase())}`;
                  const imageUrl = formatImageUrl(product.variant?.catalogProduct?.images?.[0]) || product?.images?.[0]?.url || product?.images?.[0] || product?.image || fallbackImage;
                  
                  const currentProductId = product?.id || item?.productId || `prod-${index}`;
                  const isSaved = wishlistData?.items?.some(
                    (wItem: any) => wItem.productId === currentProductId || wItem.product?.id === currentProductId || wItem.id === currentProductId
                  );
                  
                  return (
                    <div key={item.id || index} onClick={() => setIsOrderedProductsOpen(true)} className="min-w-[150px] border border-gray-100 rounded-xl p-3 relative shadow-sm hover:shadow-md transition-shadow bg-white snap-center cursor-pointer">
                      <div className="flex justify-end items-start mb-2">
                        <button className="text-orange-400 hover:text-orange-500" onClick={(e) => e.stopPropagation()}>
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="h-28 flex items-center justify-center mb-2 overflow-hidden">
                         <img 
                            src={imageUrl} 
                            className="h-full object-contain" 
                            alt={name} 
                         />
                      </div>
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
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
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 cursor-pointer hover:scale-105 transition-transform"
                      >
                        <WishlistIcon 
                          isFilled={isSaved} 
                          preserveAspectRatio="none" 
                          className={`w-[24px] h-[18px] text-[#7B2FBE] ${isSaved ? 'fill-[#7B2FBE]' : 'fill-none'}`} 
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2 border-t border-gray-50 pt-2">
                         <span className="text-xs text-gray-500 font-medium truncate w-20">{name}</span>
                         <button className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                           <ArrowUpRight className="w-3 h-3 text-gray-500" />
                         </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My Orders Section (Grouped) */}
            <div className="px-6 py-2 pb-8">
              <div className="flex justify-between items-center mb-4 cursor-pointer group">
                <h3 className="text-[24px] font-extrabold text-gray-700">My Orders</h3>
                <ChevronRight className="w-7 h-7 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-2 px-2 snap-x">
                
                {(() => {
                  const groups: Record<string, { dateString: string; orderIds: string[]; images: string[]; dateObj: Date }> = {};
                  filteredOrders.forEach((o: any) => {
                    const date = new Date(o.createdAt);
                    const dateString = date.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
                    
                    if (!groups[dateString]) {
                      groups[dateString] = { dateString, orderIds: [], images: [], dateObj: date };
                    }
                    
                    groups[dateString].orderIds.push(o.id);
                    
                    const oItems = o.items || o.orderItems || [];
                    const itemImages = oItems.map((item: any) => {
                      const product = item.sellerOffer || item.product || {};
                      const name = product.name || product.variant?.catalogProduct?.name || 'Unknown Product';
                      const fallbackImage = `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent((name || 'PR').trim().split(/\\s+/).length === 1 ? (name || 'PR').trim().substring(0,2).toUpperCase() : ((name || 'PR').trim().split(/\\s+/)[0][0] + (name || 'PR').trim().split(/\\s+/)[(name || 'PR').trim().split(/\\s+/).length - 1][0]).toUpperCase())}`;
                      return formatImageUrl(product.variant?.catalogProduct?.images?.[0]) || product?.images?.[0]?.url || product?.images?.[0] || product?.image || fallbackImage;
                    }).filter(Boolean);
                    groups[dateString].images.push(...itemImages);
                  });
                  
                  const groupedOrders = Object.values(groups).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

                  return groupedOrders.map((group, idx) => {
                    const images = [...group.images];
                    
                    if (images.length === 0) {
                      images.push("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=150&auto=format&fit=crop");
                    }

                    const isSelected = group.orderIds.includes(effectiveOrderId);

                    return (
                      <div key={group.dateString + idx} onClick={() => setSelectedOrderId(group.orderIds[0])} className={`min-w-[220px] max-w-[220px] border ${isSelected ? 'border-purple-600 ring-2 ring-purple-600 shadow-md' : 'border-gray-200'} rounded-xl p-3 shadow-sm bg-white snap-center cursor-pointer hover:shadow-md transition-all`}>
                        <div className="flex justify-between items-center mb-3">
                           <span className={`text-[15px] font-black ${isSelected ? 'text-purple-600' : 'text-gray-500'}`}>{group.dateString}</span>
                           <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 h-[160px]">
                           <div className="flex flex-col gap-1.5 h-full min-h-0">
                              <div className="bg-gray-50 rounded flex-1 relative flex items-center justify-center overflow-hidden">
                                 <img src={images[0] || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=150&auto=format&fit=crop"} className="absolute inset-0 w-full h-full object-contain p-1" alt="" />
                              </div>
                              <div className="bg-gray-50 rounded flex-1 relative flex items-center justify-center overflow-hidden">
                                 {images.length > 1 ? (
                                   <img src={images[1] || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=150&auto=format&fit=crop"} className="absolute inset-0 w-full h-full object-contain p-1" alt="" />
                                 ) : (
                                   <div className="absolute inset-0 bg-gray-100/50"></div>
                                 )}
                              </div>
                           </div>
                           <div className="flex flex-col gap-1.5 h-full min-h-0">
                               <div className="bg-gray-50 rounded flex-[2] relative flex items-center justify-center overflow-hidden">
                                 {images.length > 2 ? (
                                   <img src={images[2] || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=150&auto=format&fit=crop"} className="absolute inset-0 w-full h-full object-contain p-1" alt="" />
                                 ) : (
                                   <div className="absolute inset-0 bg-gray-100/50"></div>
                                 )}
                              </div>
                               <div className="bg-gray-50 rounded flex-1 relative flex items-center justify-center overflow-hidden">
                                 {images.length > 3 ? (
                                   <img src={images[3] || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=150&auto=format&fit=crop"} className="absolute inset-0 w-full h-full object-contain p-1" alt="" />
                                 ) : (
                                   <div className="absolute inset-0 bg-gray-100/50"></div>
                                 )}
                              </div>
                           </div>
                        </div>
                      </div>
                    );
                  });
                })()}

                {allOrders.length === 0 && (
                  <div className="w-full text-center py-6 text-sm text-gray-400">
                    No recent orders found.
                  </div>
                )}

              </div>
            </div>
          </>
        )}

        {/* CSS for hiding scrollbar but keeping functionality */}
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}} />
        </div>
      </div>

      {/* Render the inner filter drawer */}
      <OrderFilterDrawer 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
        filters={filters}
        onApplyFilters={(f) => setFilters(f)}
      />
      
      {/* Render the ordered products drawer */}
      <OrderedProductsDrawer 
        isOpen={isOrderedProductsOpen} 
        onClose={() => setIsOrderedProductsOpen(false)} 
        orderId={effectiveOrderId}
      />
    </>
  );
}
