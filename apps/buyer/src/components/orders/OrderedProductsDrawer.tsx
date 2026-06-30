import React, { useState } from 'react';
import { Share2, Plus, ArrowUpRight, ChevronRight, ChevronLeft, Trash2, Star, RefreshCw, Bookmark, Check, Truck, MapPin, Package, Bike, X } from 'lucide-react';
import { DeliveryTruckBadge } from '../shared/DeliveryTruckBadge';
import Image from 'next/image';
import { useOrders } from '@/hooks/useOrders';

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

  const { data: ordersData } = useOrders({ page: 1, limit: 50 });
  const allOrders = Array.isArray(ordersData) ? ordersData : ((ordersData as any)?.data || (ordersData as any)?.data?.orders || []);

  const items = React.useMemo(() => {
    return allOrders.flatMap((o: any) => {
      const oItems = o.items || o.orderItems || [];
      return oItems.map((item: any) => ({ ...item, order: o }));
    });
  }, [allOrders]);
  
  // We use the first order or the specific orderId for the header info
  const headerOrder = allOrders.find((o: any) => o.id === orderId) || allOrders[0] || {};
  
  // Format Date for Header
  let orderMonth = 'JAN', orderYear = '2026';
  if (headerOrder?.createdAt) {
    const d = new Date(headerOrder.createdAt);
    orderMonth = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    orderYear = d.getFullYear().toString();
  }
  
  // Format Status for Header
  const statusRaw = headerOrder?.orderStatus || headerOrder?.status || 'In transit';
  const displayStatus = normalizeStatus(statusRaw).replace(/_/g, ' ');
  const paymentMethod = headerOrder?.paymentMethod === 'BANK_TRANSFER' ? 'BANK' : headerOrder?.paymentMethod || 'COD';

  if (!isOpen) return null;

  return (
    <>
      {/* Full Page View */}
      <div className={`fixed inset-0 w-full h-full bg-[#fcfcfc] z-[110] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
        <div className="w-full max-w-7xl mx-auto min-h-screen bg-[#fcfcfc] relative flex flex-col px-4 sm:px-6 md:px-8 py-6">
          {/* Close Button */}
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-full z-[80] transition-colors border border-gray-200 shadow-sm">
            <X className="w-6 h-6" />
          </button>
        
        {/* Header */}
        <div className="pr-6 pl-14 py-6 border-b border-gray-100 relative shrink-0">
          <button onClick={onClose} className="absolute left-4 top-6 text-gray-400 hover:text-gray-800 transition-colors p-1.5 z-[80]">
             <ChevronLeft className="w-8 h-8" />
          </button>
          
          <div className="flex justify-between items-start gap-4">
             <h2 className="text-[34px] font-extrabold text-gray-800 leading-tight">Ordered<br/>Products</h2>
             <div className="flex flex-col items-end gap-1.5 mr-12">
               <div className="flex gap-1.5 flex-wrap justify-end">
                 {paymentMethod && <span className="bg-[#8b3dcc] text-white text-[14px] font-bold px-4 py-2 rounded shadow-sm">{paymentMethod}</span>}
                 <span className="bg-[#8b3dcc] text-white text-[14px] font-bold px-4 py-2 rounded shadow-sm capitalize">Status : {displayStatus.toLowerCase()}</span>
                 <span className="bg-[#8b3dcc] text-white text-[14px] font-bold px-4 py-2 rounded shadow-sm">{orderMonth}</span>
                 <span className="bg-[#8b3dcc] text-white text-[14px] font-bold px-4 py-2 rounded shadow-sm">{orderYear}</span>
               </div>
               <span className="bg-[#8b3dcc] text-white text-[14px] font-bold px-4 py-2 rounded shadow-sm">All orders</span>
             </div>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 bg-[#fcfcfc]">
          <div className="flex flex-col gap-3 pb-24">
            
            {items.map((item: any, index: number) => {
              const itemOrder = item.order || {};
              const os = itemOrder?.orderStatus || itemOrder?.status || 'PLACED';
              const isDelivered = os === 'DELIVERED';
              const isOut = isDelivered || os === 'OUT_FOR_DELIVERY';
              const isNear = isOut || os === 'SHIPPED';
              const isShipped = isNear || ['DISPATCHED_FROM_SELLER', 'RECEIVED_AT_WAREHOUSE'].includes(os);
              const isPlaced = true;
              
              const stepCount = isDelivered ? 5 : isOut ? 4 : isNear ? 3 : isShipped ? 2 : 1;
              const progressPercent = ((stepCount - 1) / 4) * 100;

              const isYukiziChoice = false;
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
                  <div className="relative w-[100px] h-[115px] sm:w-[110px] sm:h-[125px] shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center">
                    <img 
                      src={imageUrl} 
                      className="w-full h-full object-cover" 
                      alt={name} 
                    />
                    <button className="absolute bottom-1 left-1 bg-[#f9884e] text-white p-2 rounded-md">
                       <Trash2 className="w-[18px] h-[18px]" />
                    </button>
                  </div>

                  {/* Right: Details */}
                  <div className="flex-1 flex flex-col justify-between pt-0.5 min-w-0">
                    
                    {/* Top Row: Badges & Quantity */}
                    <div className="flex justify-between items-start mb-1.5 gap-1.5">
                      <div className="flex flex-wrap gap-2 items-center">
                        {index === 0 ? (
                          <div className="bg-[#483d8b] text-white px-3 py-1.5 rounded-[8px] flex items-center gap-1 shrink-0 shadow-sm">
                            <span className="text-sm font-bold">Saved</span>
                            <Bookmark className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="bg-[#483d8b] text-white p-1.5 rounded-[8px] shrink-0 shadow-sm">
                            <RefreshCw className="w-4 h-4" />
                          </div>
                        )}
                        <span className="bg-[#c0c0c0] text-white text-[13px] font-bold px-3 py-1.5 rounded-[8px] shadow-sm whitespace-nowrap">Return / Replace</span>
                        <span className="bg-[#c0c0c0] text-white text-[13px] font-bold px-3 py-1.5 rounded-[8px] shadow-sm whitespace-nowrap">Canceled</span>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {hasQuantity ? (
                          <div className="flex items-center gap-2">
                             <RefreshCw className="w-[18px] h-[18px] text-gray-500" />
                             <div className="bg-[#4a345e] text-white text-sm font-bold flex items-center px-4 py-1.5 rounded-[8px] gap-2 shadow-sm">
                               <span>Qty: {item.quantity}</span>
                             </div>
                          </div>
                        ) : (
                          <Plus className="w-6 h-6 text-[#f9884e]" strokeWidth={3} />
                        )}
                        <ArrowUpRight className="w-5 h-5 text-gray-400 mt-0.5" strokeWidth={3} />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-[16px] text-gray-600 font-bold leading-tight mb-1.5 line-clamp-2">
                      {name}
                    </h3>

                    {/* Price and Bottom Row */}
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-[21px] font-black text-gray-800">₹{price.toLocaleString('en-IN')}</span>
                          {discount > 0 && <span className="text-[14px] text-gray-400 line-through">₹{mrp.toLocaleString('en-IN')}</span>}
                        </div>
                        {discount > 0 && <span className="text-sm text-gray-500 font-semibold">{discount}% off</span>}
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1 text-sm font-bold text-gray-700">
                          <Star className="w-4 h-4 fill-[#8b3dcc] text-[#8b3dcc]" />
                          4.5
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[13px] font-bold text-gray-600 underline whitespace-nowrap">Order details</span>
                           <DeliveryTruckBadge text="3 days" className="w-[85px] text-[#9a9a9a]" />
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
                        <div className="absolute top-5 left-[20px] right-[20px] h-[2px] bg-gray-200 z-0"></div>
                        {/* Purple line for completed steps */}
                        <div className="absolute top-5 left-[20px] h-[2px] bg-[#8b3dcc] z-0 transition-all duration-500" style={{ width: `calc(${progressPercent}% - 40px)` }}></div>
                        
                        {/* Step 1 */}
                        <div className="flex flex-col items-center gap-1.5 z-10 w-[56px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ring-[3px] ring-white transition-colors ${isPlaced ? 'bg-[#8b3dcc]' : 'bg-[#b8b8b8]'}`}>
                            <Check className="w-5 h-5" strokeWidth={3} />
                          </div>
                          <div className="text-center w-[70px]">
                            <p className={`text-[11px] font-bold leading-tight ${isPlaced ? 'text-gray-700' : 'text-gray-500'}`}>Placed</p>
                            <p className="text-[9px] text-gray-400 font-medium">{formatDateShort(itemOrder?.createdAt)}</p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center gap-1.5 z-10 w-[56px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ring-[3px] ring-white transition-colors ${isShipped ? 'bg-[#8b3dcc]' : 'bg-[#b8b8b8]'}`}>
                            <Truck className="w-5 h-5" />
                          </div>
                          <div className="text-center w-[70px]">
                            <p className={`text-[11px] font-bold leading-tight ${isShipped ? 'text-gray-700' : 'text-gray-500'}`}>Shipped</p>
                            <p className="text-[9px] text-gray-400 font-medium">{isShipped && tracking?.activities?.length ? 'Updated' : ''}</p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center gap-1.5 z-10 w-[56px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ring-[3px] ring-white transition-colors ${isNear ? 'bg-[#8b3dcc]' : 'bg-[#b8b8b8]'}`}>
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div className="text-center w-[70px]">
                            <p className={`text-[11px] font-bold leading-tight ${isNear ? 'text-gray-700' : 'text-gray-500'}`}>Near you</p>
                            <p className="text-[9px] text-gray-400 font-medium">{isNear && tracking?.current_status ? 'En route' : ''}</p>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex flex-col items-center gap-1.5 z-10 w-[56px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ring-[3px] ring-white transition-colors ${isOut ? 'bg-[#8b3dcc]' : 'bg-[#b8b8b8]'}`}>
                            <Bike className="w-5 h-5" />
                          </div>
                          <div className="text-center w-[75px]">
                            <p className={`text-[11px] font-bold leading-tight ${isOut ? 'text-gray-700' : 'text-gray-500'}`}>Out for delivery</p>
                            <p className="text-[9px] text-gray-400 font-medium">{isOut ? formatDateShort(tracking?.estimated_delivery || order?.updatedAt) : ''}</p>
                          </div>
                        </div>

                        {/* Step 5 */}
                        <div className="flex flex-col items-center gap-1.5 z-10 w-[56px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ring-[3px] ring-white transition-colors ${isDelivered ? 'bg-[#8b3dcc]' : 'bg-[#b8b8b8]'}`}>
                            <Package className="w-5 h-5" />
                          </div>
                          <div className="text-center w-[70px]">
                            <p className={`text-[11px] font-bold leading-tight ${isDelivered ? 'text-gray-700' : 'text-gray-500'}`}>Delivered</p>
                            <p className="text-[9px] text-gray-400 font-medium">{formatDateShort(tracking?.delivered_date)}</p>
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
      </div>
    </>
  );
}
