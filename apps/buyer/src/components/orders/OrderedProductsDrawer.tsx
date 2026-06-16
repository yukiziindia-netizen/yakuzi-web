import React, { useState } from 'react';
import { Share2, Plus, ArrowUpRight, ChevronRight, ChevronLeft, Trash2, Star, RefreshCw, Bookmark, Check, Truck, MapPin, Package, Bike, X } from 'lucide-react';
import { DeliveryTruckBadge } from '../shared/DeliveryTruckBadge';
import Image from 'next/image';
import { useOrderById, useOrderTracking } from '@/hooks/useOrders';

function formatDateShort(dStr: string | null | undefined) {
  if (!dStr) return '';
  return new Date(dStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' });
}

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

function normalizeStatus(s: string | undefined): string {
  const status = (s || '').toUpperCase();
  const map: Record<string, string> = {
    CONFIRMED: 'ACCEPTED', PROCESSING: 'ACCEPTED',
    TRANSIT: 'SHIPPED', READY_FOR_PICKUP: 'SHIPPED',
    COMPLETED: 'DELIVERED',
  };
  return map[status] ?? status;
}

interface OrderedProductsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string | null;
}

export function OrderedProductsDrawer({ isOpen, onClose, orderId }: OrderedProductsDrawerProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const { data: orderData, isLoading } = useOrderById(orderId || '');
  const order = orderData?.data || orderData;
  const items = order?.items || order?.orderItems || [];
  
  const { data: trackingResp } = useOrderTracking(orderId || '');
  const tracking = trackingResp?.data;

  // Determine Timeline Progress
  const os = order?.orderStatus || order?.status || 'PLACED';
  const isDelivered = os === 'DELIVERED';
  const isOut = isDelivered || os === 'OUT_FOR_DELIVERY';
  const isNear = isOut || os === 'SHIPPED';
  const isShipped = isNear || ['DISPATCHED_FROM_SELLER', 'RECEIVED_AT_WAREHOUSE'].includes(os);
  const isPlaced = true;
  
  const stepCount = isDelivered ? 5 : isOut ? 4 : isNear ? 3 : isShipped ? 2 : 1;
  const progressPercent = ((stepCount - 1) / 4) * 100;
  
  // Format Date
  let orderMonth = 'JAN', orderYear = '2026';
  if (order?.createdAt) {
    const d = new Date(order.createdAt);
    orderMonth = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    orderYear = d.getFullYear().toString();
  }
  
  // Format Status
  const statusRaw = order?.orderStatus || order?.status || 'In transit';
  const displayStatus = normalizeStatus(statusRaw).replace(/_/g, ' ');
  const paymentMethod = order?.paymentMethod === 'BANK_TRANSFER' ? 'BANK' : order?.paymentMethod || 'COD';

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[65] transition-opacity rounded-l-3xl" 
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-[85%] max-w-[400px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto rounded-l-3xl`}>
        {/* Hidden Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-white/80 rounded-full z-[80] transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        {/* Header */}
        <div className="pr-6 pl-12 py-6 border-b border-gray-100 relative shrink-0">
          <button onClick={onClose} className="absolute left-4 top-6 text-gray-400 hover:text-gray-800 transition-colors">
             <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex justify-between items-start">
             <h2 className="text-2xl font-bold text-gray-800 leading-tight">Ordered<br/>Products</h2>
             <div className="flex flex-col items-end gap-1.5">
               <div className="flex gap-1.5 flex-wrap justify-end">
                 {paymentMethod && <span className="bg-[#8b3dcc] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">{paymentMethod}</span>}
                 <span className="bg-[#8b3dcc] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm capitalize">Status : {displayStatus.toLowerCase()}</span>
                 <span className="bg-[#8b3dcc] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">{orderMonth}</span>
                 <span className="bg-[#8b3dcc] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">{orderYear}</span>
               </div>
               <span className="bg-[#8b3dcc] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">All orders</span>
             </div>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 bg-[#fcfcfc]">
          <div className="flex flex-col gap-3 pb-24">
            
            {items.map((item: any, index: number) => {
              const isYukiziChoice = false; // Add real logic here if needed
              const hasQuantity = item.quantity > 1;
              const product = item.sellerOffer || {};
              const imageUrl = formatImageUrl(product.variant?.catalogProduct?.images?.[0]) || 'https://images.unsplash.com/photo-1534996858220-e80315df5fad?q=80&w=200&auto=format&fit=crop';
              const name = product.name || 'Unknown Product';
              const price = item.unitPrice || 0;
              const mrp = product.mrp || price;
              const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

              return (
                <div 
                  key={item.id || index} 
                  className={`relative bg-white rounded-xl shadow-sm border ${isYukiziChoice ? 'border-purple-200 shadow-purple-100' : 'border-gray-100'} p-3 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-md`}
                  onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                >
                  <div className="flex gap-3">
                  
                  {isYukiziChoice && (
                    <div className="absolute -top-2.5 left-4 bg-[#8b3dcc] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full z-10">
                      Yukizi Choice
                    </div>
                  )}

                  {/* Left: Image */}
                  <div className="relative w-[75px] h-[90px] sm:w-[85px] sm:h-[100px] shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center">
                    <img 
                      src={imageUrl} 
                      className="w-full h-full object-cover" 
                      alt={name} 
                    />
                    <button className="absolute bottom-1 left-1 bg-[#f9884e] text-white p-1 rounded">
                       <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Right: Details */}
                  <div className="flex-1 flex flex-col justify-between pt-0.5 min-w-0">
                    
                    {/* Top Row: Badges & Quantity */}
                    <div className="flex justify-between items-start mb-1.5 gap-1">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {index === 0 ? (
                          <div className="bg-[#483d8b] text-white px-2 py-0.5 rounded-sm flex items-center gap-1 shrink-0 shadow-sm">
                            <span className="text-[9px] font-bold">Saved</span>
                            <Bookmark className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="bg-[#483d8b] text-white p-0.5 rounded-sm shrink-0 shadow-sm">
                            <RefreshCw className="w-3 h-3" />
                          </div>
                        )}
                        <span className="bg-[#c0c0c0] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm whitespace-nowrap">Return / Replace</span>
                        <span className="bg-[#c0c0c0] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm whitespace-nowrap">Canceled</span>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {hasQuantity ? (
                          <div className="flex items-center gap-2">
                             <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                             <div className="bg-[#4a345e] text-white text-[11px] font-bold flex items-center px-2 py-0.5 rounded-md gap-2 shadow-sm">
                               <span>Qty: {item.quantity}</span>
                             </div>
                          </div>
                        ) : (
                          <Plus className="w-4 h-4 text-[#f9884e]" strokeWidth={3} />
                        )}
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 mt-0.5" strokeWidth={3} />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-[11px] text-gray-500 font-medium leading-tight mb-1 line-clamp-2">
                      {name}
                    </h3>

                    {/* Price and Bottom Row */}
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[15px] font-bold text-gray-800">₹{price.toLocaleString('en-IN')}</span>
                          {discount > 0 && <span className="text-[9px] text-gray-400 line-through">₹{mrp.toLocaleString('en-IN')}</span>}
                        </div>
                        {discount > 0 && <span className="text-[10px] text-gray-500">{discount}% off</span>}
                      </div>
                      
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-700">
                          <Star className="w-3 h-3 fill-[#8b3dcc] text-[#8b3dcc]" />
                          4.5
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                           <span className="text-[9px] font-bold text-gray-600 underline whitespace-nowrap">Order details</span>
                           <DeliveryTruckBadge text="3 days" className="w-[65px] text-[#9a9a9a]" />
                        </div>
                      </div>
                    </div>

                  </div>
                  </div>

                  {/* Tracking Timeline (Expanded State) */}
                  {expandedItem === item.id && (
                    <div className="mt-3 pt-4 border-t border-gray-100 px-1 pb-1 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="relative flex justify-between items-start">
                        {/* Background Line */}
                        <div className="absolute top-4 left-[16px] right-[16px] h-[2px] bg-gray-200 z-0"></div>
                        {/* Purple line for completed steps */}
                        <div className="absolute top-4 left-[16px] h-[2px] bg-[#8b3dcc] z-0 transition-all duration-500" style={{ width: `calc(${progressPercent}% - 32px)` }}></div>
                        
                        {/* Step 1 */}
                        <div className="flex flex-col items-center gap-1.5 z-10 w-[48px]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ring-[3px] ring-white transition-colors ${isPlaced ? 'bg-[#8b3dcc]' : 'bg-[#b8b8b8]'}`}>
                            <Check className="w-4 h-4" strokeWidth={3} />
                          </div>
                          <div className="text-center w-[60px]">
                            <p className={`text-[9px] font-medium leading-tight ${isPlaced ? 'text-gray-700' : 'text-gray-500'}`}>Placed</p>
                            <p className="text-[7px] text-gray-400">{formatDateShort(order?.createdAt)}</p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center gap-1.5 z-10 w-[48px]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ring-[3px] ring-white transition-colors ${isShipped ? 'bg-[#8b3dcc]' : 'bg-[#b8b8b8]'}`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <div className="text-center w-[60px]">
                            <p className={`text-[9px] font-medium leading-tight ${isShipped ? 'text-gray-700' : 'text-gray-500'}`}>Shipped</p>
                            <p className="text-[7px] text-gray-400">{isShipped && tracking?.activities?.length ? 'Updated' : ''}</p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center gap-1.5 z-10 w-[48px]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ring-[3px] ring-white transition-colors ${isNear ? 'bg-[#8b3dcc]' : 'bg-[#b8b8b8]'}`}>
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="text-center w-[60px]">
                            <p className={`text-[9px] font-medium leading-tight ${isNear ? 'text-gray-700' : 'text-gray-500'}`}>Near you</p>
                            <p className="text-[7px] text-gray-400">{isNear && tracking?.current_status ? 'En route' : ''}</p>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex flex-col items-center gap-1.5 z-10 w-[48px]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ring-[3px] ring-white transition-colors ${isOut ? 'bg-[#8b3dcc]' : 'bg-[#b8b8b8]'}`}>
                            <Bike className="w-4 h-4" />
                          </div>
                          <div className="text-center w-[65px]">
                            <p className={`text-[9px] font-medium leading-tight ${isOut ? 'text-gray-700' : 'text-gray-500'}`}>Out for delivery</p>
                            <p className="text-[7px] text-gray-400">{isOut ? formatDateShort(tracking?.estimated_delivery || order?.updatedAt) : ''}</p>
                          </div>
                        </div>

                        {/* Step 5 */}
                        <div className="flex flex-col items-center gap-1.5 z-10 w-[48px]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ring-[3px] ring-white transition-colors ${isDelivered ? 'bg-[#8b3dcc]' : 'bg-[#b8b8b8]'}`}>
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="text-center w-[60px]">
                            <p className={`text-[9px] font-medium leading-tight ${isDelivered ? 'text-gray-700' : 'text-gray-500'}`}>Delivered</p>
                            <p className="text-[7px] text-gray-400">{formatDateShort(tracking?.delivered_date)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
