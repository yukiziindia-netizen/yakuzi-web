import React, { useState, useEffect } from 'react';
import { Share2, Plus, ArrowUpRight, ChevronRight, Filter, X } from 'lucide-react';
import Image from 'next/image';
import { OrderFilterDrawer } from './OrderFilterDrawer';
import { OrderedProductsDrawer } from './OrderedProductsDrawer';
import { useOrderById, useOrders } from '@/hooks/useOrders';

function formatImageUrl(url: any): string | undefined {
  if (!url) return undefined;
  const urlStr = typeof url === 'string' ? url : url.url;
  if (!urlStr || typeof urlStr !== 'string') return undefined;
  if (urlStr.startsWith('http')) return urlStr;
  return `http://localhost:3000${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
}

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string | null;
}

export function OrderDrawer({ isOpen, onClose, orderId }: OrderDrawerProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isOrderedProductsOpen, setIsOrderedProductsOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOrderId(null);
  }, [orderId]);

  const { data: allOrdersData } = useOrders({ page: 1, limit: 10 });
  const allOrders = Array.isArray(allOrdersData) ? allOrdersData : (allOrdersData?.data || allOrdersData?.data?.orders || []);

  const effectiveOrderId = selectedOrderId || orderId || (allOrders.length > 0 ? allOrders[0].id : '');

  const { data: orderData } = useOrderById(effectiveOrderId || '');
  const order = orderData?.data || orderData;
  const items = order?.items || order?.orderItems || [];
  console.log("OrderDrawer DEBUG:", { orderId, effectiveOrderId, orderData, itemsLength: items?.length });

  const os = order?.orderStatus || order?.status || 'PLACED';
  const displayStatus = os.replace(/_/g, ' ');

  let orderMonth = 'JAN', orderYear = '2026';
  if (order?.createdAt) {
    const d = new Date(order.createdAt);
    orderMonth = d.toLocaleString('default', { month: 'short' }).toUpperCase();
    orderYear = d.getFullYear().toString();
  }

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[65] transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-[85%] max-w-[400px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto rounded-l-3xl`}
      >
        {/* Hidden Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-white/80 rounded-full z-[80] transition-colors">
          <X className="w-5 h-5" />
        </button>
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-100 relative">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-800 mr-2">Orders</h2>
            <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm">{order?.paymentMethod === 'COD' ? 'COD' : 'PREPAID'}</span>
            <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm capitalize">Status : {displayStatus.toLowerCase()}</span>
            <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm">{orderMonth}</span>
            <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm">{orderYear}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 absolute right-6 bottom-4">
            <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm">All orders</span>
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="text-gray-400 hover:text-purple-600 transition-colors"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ordered Products Section */}
        <div className="px-6 py-4">
          <div 
            className="flex justify-between items-center mb-4 cursor-pointer group"
            onClick={() => setIsOrderedProductsOpen(true)}
          >
            <h3 className="text-[17px] font-bold text-gray-700">Ordered Products</h3>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-2 px-2 snap-x">
            {items.map((item: any, index: number) => {
              const product = item.sellerOffer || {};
              const imageUrl = formatImageUrl(product.variant?.catalogProduct?.images?.[0]) || 'https://images.unsplash.com/photo-1534996858220-e80315df5fad?q=80&w=200&auto=format&fit=crop';
              const name = product.name || 'Unknown Product';
              
              return (
                <div key={item.id || index} onClick={() => setIsOrderedProductsOpen(true)} className="min-w-[150px] border border-gray-100 rounded-xl p-3 relative shadow-sm hover:shadow-md transition-shadow bg-white snap-center cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <button className="text-gray-400 hover:text-gray-600">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="text-orange-400 hover:text-orange-500">
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
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                     <div className="bg-purple-600 w-1.5 h-4 rounded-l-sm"></div>
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
            <h3 className="text-[17px] font-bold text-gray-700">My Orders</h3>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-2 px-2 snap-x">
            
            {allOrders.map((o: any) => {
              const oItems = o.items || o.orderItems || [];
              const images = oItems.map((item: any) => formatImageUrl(item.sellerOffer?.variant?.catalogProduct?.images?.[0])).filter(Boolean);
              
              if (images.length === 0) return null;

              const date = new Date(o.createdAt);
              const dateString = date.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });

              return (
                <div key={o.id} onClick={() => setSelectedOrderId(o.id)} className={`min-w-[220px] max-w-[220px] border ${effectiveOrderId === o.id ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-100'} rounded-xl p-3 shadow-sm bg-white snap-center cursor-pointer hover:shadow-md transition-shadow`}>
                  <div className="flex justify-between items-center mb-3">
                     <span className={`text-[11px] font-medium ${effectiveOrderId === o.id ? 'text-purple-600' : 'text-gray-500'}`}>{dateString}</span>
                     <ChevronRight className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 h-[160px]">
                     <div className="flex flex-col gap-1.5">
                        <div className="bg-gray-50 rounded flex-1 flex items-center justify-center overflow-hidden">
                           <img src={images[0] || "https://images.unsplash.com/photo-1534996858220-e80315df5fad?q=80&w=150&auto=format&fit=crop"} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="bg-gray-50 rounded flex-1 flex items-center justify-center overflow-hidden">
                           {images.length > 1 ? (
                             <img src={images[1] || "https://images.unsplash.com/photo-1534996858220-e80315df5fad?q=80&w=150&auto=format&fit=crop"} className="w-full h-full object-cover" alt="" />
                           ) : (
                             <div className="w-full h-full bg-gray-100/50"></div>
                           )}
                        </div>
                     </div>
                     <div className="flex flex-col gap-1.5">
                         <div className="bg-gray-50 rounded flex-[2] flex items-center justify-center overflow-hidden">
                           {images.length > 2 ? (
                             <img src={images[2] || "https://images.unsplash.com/photo-1534996858220-e80315df5fad?q=80&w=150&auto=format&fit=crop"} className="w-full h-full object-cover" alt="" />
                           ) : (
                             <div className="w-full h-full bg-gray-100/50"></div>
                           )}
                        </div>
                        <div className="bg-gray-50 rounded flex-1 flex items-center justify-center overflow-hidden">
                           {images.length > 3 ? (
                             <img src={images[3] || "https://images.unsplash.com/photo-1534996858220-e80315df5fad?q=80&w=150&auto=format&fit=crop"} className="w-full h-full object-cover" alt="" />
                           ) : (
                             <div className="w-full h-full bg-gray-100/50"></div>
                           )}
                        </div>
                     </div>
                  </div>
                </div>
              );
            })}

            {allOrders.length === 0 && (
              <div className="w-full text-center py-6 text-sm text-gray-400">
                No recent orders found.
              </div>
            )}

          </div>
        </div>

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

      {/* Render the inner filter drawer */}
      <OrderFilterDrawer 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
        onApplyFilters={() => setIsOrderedProductsOpen(true)}
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
