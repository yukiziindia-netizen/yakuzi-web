import React, { useState } from 'react';
import { Share2, Plus, ArrowUpRight, ChevronRight, ChevronLeft, Trash2, Star, RefreshCw, Bookmark, Check, Truck, MapPin, Package, Bike, X, CreditCard, XCircle, FileText } from 'lucide-react';
import { DeliveryTruckBadge } from '../shared/DeliveryTruckBadge';
import Image from 'next/image';
import { useOrders, useOrderTracking } from '@/hooks/useOrders';
import Link from 'next/link';


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

  const { data: trackingResp } = useOrderTracking(orderId || '');
  const tracking = trackingResp?.data;

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
  
  // Format Order Number / ID
  const orderNumber = headerOrder?.orderNumber ?? orderId?.slice(0, 8).toUpperCase() ?? '';

  // Format Date for Header
  const dHeader = headerOrder?.createdAt ? new Date(headerOrder.createdAt) : new Date();
  const orderDateShort = `${dHeader.getDate().toString().padStart(2, '0')}-${(dHeader.getMonth() + 1).toString().padStart(2, '0')}-${dHeader.getFullYear().toString().slice(-2)}`;

  // Format Shipping Address for Header
  const shipHeader = headerOrder?.shippingAddress || {};
  const flattenStr = (val: any) => {
    if (typeof val === 'string') return val;
    if (!val) return '';
    return val.street || val.address || val.name || val.city || val.state || val.pincode || '';
  };
  
  const headerShippingAddress = typeof headerOrder?.shippingAddress === 'string' 
    ? headerOrder.shippingAddress 
    : [
        flattenStr(shipHeader.address || headerOrder?.address), 
        flattenStr(shipHeader.city || headerOrder?.city), 
        flattenStr(shipHeader.state || headerOrder?.state), 
        flattenStr(shipHeader.pincode || headerOrder?.pincode)
      ].filter(Boolean).join(', ');

  const paymentMethod = headerOrder?.paymentMethod === 'BANK_TRANSFER' ? 'BANK' : headerOrder?.paymentMethod || 'COD';

  if (!isOpen) return null;

  return (
    <>
      {/* Full Page View */}
      <div className={`fixed inset-0 w-full h-full bg-[#fcfcfc] z-[110] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
        <div className="w-full min-h-screen bg-[#fcfcfc] relative flex flex-col px-4 sm:px-6 md:px-8 py-6">
          {/* Close Button */}
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-full z-[80] transition-colors border border-gray-200 shadow-sm">
            <X className="w-6 h-6" />
          </button>
        
        {/* Header */}
        <div className="pr-6 pl-14 py-6 border-b border-gray-100 relative shrink-0">
          <button onClick={onClose} className="absolute left-4 top-6 text-gray-400 hover:text-gray-800 transition-colors p-1.5 z-[80]">
             <ChevronLeft className="w-8 h-8" />
          </button>
          
          <div className="flex flex-col gap-4">
            {/* Title Row */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="text-[24px] sm:text-[28px] font-extrabold text-gray-850 leading-none">My Orders</h2>
                <p className="text-[12px] text-gray-400 font-bold mt-1.5">Order Id #{orderNumber}</p>
              </div>
              <div className="flex flex-col items-end gap-2 mr-10">
                <p className="text-xs sm:text-sm font-bold text-gray-500 whitespace-nowrap">Date: {orderDateShort}</p>
                <Link 
                  href="/support"
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors shadow-sm"
                  title="Customer Support"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 14c0-4.97 4.03-9 9-9s9 4.03 9 9" />
                    <rect x="2" y="13" width="3" height="5" rx="1.5" />
                    <rect x="19" y="13" width="3" height="5" rx="1.5" />
                    <path d="M5 17c2 3 12 3 14 0" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-[1px] bg-gray-100"></div>

            {/* Ship to Section */}
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#1e1e1e] mb-1">Ship to</h3>
              <div className="text-[12px] font-bold text-gray-500 leading-relaxed space-y-0.5">
                <p className="text-gray-855 font-black">{(headerOrder as any).user?.name || shipHeader.name || 'Name Surname'}</p>
                {headerShippingAddress ? (
                  headerShippingAddress.split(', ').map((addrPart: string, sIdx: number) => (
                    <p key={sIdx}>{addrPart}</p>
                  ))
                ) : (
                  <>
                    <p>Apt number City, State, Postal Code, Apt</p>
                    <p>number: City, State, Postal Code</p>
                  </>
                )}
              </div>
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

              const row1Steps = [
                { label: 'Placed', icon: <Check className="w-4 h-4" />, isCompleted: true, date: formatDateShort(itemOrder.createdAt) },
                { label: 'Shipped', icon: <Truck className="w-4 h-4" />, isCompleted: isShipped, date: isShipped ? formatDateShort(itemOrder.updatedAt) : '' },
                { label: 'Near you', icon: <MapPin className="w-4 h-4" />, isCompleted: isNear, date: isNear ? formatDateShort(itemOrder.updatedAt) : '' },
                { label: 'Out for delivery', icon: <Bike className="w-4 h-4" />, isCompleted: isOut, date: isOut ? formatDateShort(itemOrder.updatedAt) : '' },
                { label: 'Delivered', icon: <Package className="w-4 h-4" />, isCompleted: isDelivered, date: isDelivered ? formatDateShort(itemOrder.updatedAt) : '' },
              ];

              const isYukiziChoice = false;
              const hasQuantity = item.quantity > 1;
              const product = item.sellerOffer || item.product || {};
              const name = product.name || product.variant?.catalogProduct?.name || 'Unknown Product';
              const fallbackImage = `https://placehold.co/400x400/10b981/ffffff?text=${encodeURIComponent((name || 'PR').trim().split(/\s+/).length === 1 ? (name || 'PR').trim().substring(0,2).toUpperCase() : ((name || 'PR').trim().split(/\s+/)[0][0] + (name || 'PR').trim().split(/\s+/)[(name || 'PR').trim().split(/\s+/).length - 1][0]).toUpperCase())}`;
              const imageUrl = formatImageUrl(product.variant?.catalogProduct?.images?.[0]) || product?.images?.[0]?.url || product?.images?.[0] || product?.image || fallbackImage;
              const price = item.unitPrice || 0;
              const mrp = product.mrp || price;
              const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

               return (
                 <div 
                   key={item.id || index} 
                   className={`relative bg-white rounded-xl shadow-sm border ${isYukiziChoice ? 'border-purple-200 shadow-purple-100' : 'border-gray-100'} p-3 flex flex-col gap-3 transition-all hover:shadow-md`}
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
                           <span className="text-[21px] font-black text-gray-800">₹{Math.round(Number(price)).toLocaleString('en-IN')}</span>
                           {discount > 0 && <span className="text-[14px] text-gray-400 line-through">₹{Math.round(Number(mrp)).toLocaleString('en-IN')}</span>}
                         </div>
                         {discount > 0 && <span className="text-sm text-gray-500 font-semibold">{discount}% off</span>}
                       </div>
                       
                       <div className="flex flex-col items-end gap-1.5">
                         <div className="flex items-center gap-1 text-sm font-bold text-gray-700">
                           <Star className="w-4 h-4 fill-[#8b3dcc] text-[#8b3dcc]" />
                           4.5
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedItem(expandedItem === item.id ? null : item.id);
                              }}
                              className="text-[13px] font-bold text-gray-600 underline whitespace-nowrap hover:text-[#8b3dcc]"
                            >
                              Order details
                            </button>
                            <DeliveryTruckBadge text="3 days" className="w-[85px] text-[#9a9a9a]" />
                         </div>
                       </div>
                     </div>
 
                   </div>
                   </div>
 
                   {/* Shipment Timeline */}
                   {expandedItem === item.id && (
                     <>
                       {/* Divider */}
                       <div className="w-full h-[1px] bg-gray-100 my-1"></div>
                       
                       <div className="relative pt-2 pb-1 animate-in fade-in duration-200">
                         <div className="absolute top-6 left-[20px] right-[20px] h-[2px] bg-gray-200 z-0"></div>
                         <div className="absolute top-6 left-[20px] h-[2px] bg-[#8b3dcc] z-0 transition-all duration-500" style={{ width: `calc(${((stepCount - 1) / 4) * 100}% - 40px)` }}></div>
                         
                         <div className="relative flex justify-between items-start">
                           {row1Steps.map((step, rIdx) => (
                             <div key={rIdx} className="flex flex-col items-center gap-1.5 z-10 w-[56px]">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ring-[3px] ring-white transition-colors ${step.isCompleted ? 'bg-[#8b3dcc]' : 'bg-[#b8b8b8]'}`}>
                                 {step.isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> : step.icon}
                               </div>
                               <div className="text-center w-[70px]">
                                 <p className={`text-[9px] font-bold leading-tight ${step.isCompleted ? 'text-gray-700' : 'text-gray-500'}`}>{step.label}</p>
                                 <p className="text-[8px] text-gray-400 font-medium">{step.date}</p>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     </>
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
