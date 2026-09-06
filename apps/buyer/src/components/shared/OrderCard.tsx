'use client';

import { motion } from 'framer-motion';
import { Package, ChevronRight, Clock, CheckCircle2, Truck, AlertCircle, CreditCard } from 'lucide-react';

interface OrderCardProps {
  orderId: string;
  date: string;
  status: string;
  total: string;
  itemCount: number;
  productName?: string;
  productImage?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

export default function OrderCard({ orderId, date, status, total, itemCount, productName, productImage, paymentMethod, paymentStatus }: OrderCardProps) {
  const getStatusConfig = (s: string) => {
    switch (s.toUpperCase()) {
      case 'DELIVERED': 
        return { cls: 'bg-lime-100 text-lime-700 border-lime-200', icon: CheckCircle2 };
      case 'ACCEPTED':
      case 'CONFIRMED':
        return { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
      case 'PAYMENT_RECEIVED':
        return { cls: 'bg-primary/10 text-primary border-primary/20', icon: Package };
      case 'READY_TO_SHIP':
        return { cls: 'bg-sky-100 text-sky-700 border-sky-200', icon: Package };
      case 'PENDING': 
      case 'PLACED':
        return { cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
      case 'SHIPPED': 
        return { cls: 'bg-blue-100 text-blue-700 border-blue-200', icon: Truck };
      case 'CANCELLED':
        return { cls: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle };
      default: 
        return { cls: 'bg-gray-100 text-gray-700 border-gray-200', icon: Package };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  // COD/bank-transfer/credit orders are legitimately unpaid until delivery -
  // only an online (Razorpay) order stuck unpaid means the buyer abandoned
  // or lost the payment popup and the order needs their attention.
  const needsPayment =
    paymentMethod?.toUpperCase() === 'RAZORPAY' &&
    !!paymentStatus &&
    paymentStatus.toUpperCase() !== 'SUCCESS';

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
 // .glass-panel rather than the backdrop-blur-3xl this used to carry: an
      // order list renders many of these, and a per-card backdrop blur is the
      // one pattern that genuinely hurts scrolling on mid-range phones. Over
      // the page gradient the translucent version looks the same.
 className="glass-panel  p-4 sm:p-5 md:p-7 hover:shadow-[0_20px_60px_-24px_rgba(88,54,150,0.38)] transition-all duration-500 cursor-pointer group"
    >
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 md:gap-6 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500 flex-shrink-0 overflow-hidden">
            {productImage ? (
              <img src={productImage} alt={productName || 'Product'} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            ) : (
              <Package className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gray-900 stroke-[1.5px]" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 tracking-tight truncate max-w-[200px] sm:max-w-[300px]">
                {productName ? productName : `Order #${orderId}`}
              </h3>
              <span className={`text-2xs font-bold uppercase tracking-[0.15em] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border ${statusConfig.cls} flex items-center gap-1 sm:gap-1.5 flex-shrink-0`}>
                <StatusIcon className="w-3 h-3" />
                {status}
              </span>
              {needsPayment && (
                <span className="text-2xs font-bold uppercase tracking-[0.15em] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border bg-red-100 text-red-700 border-red-200 flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                  <CreditCard className="w-3 h-3" />
                  Payment pending
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-400 font-bold tracking-tight truncate">
              {productName ? `Order #${orderId} • ` : ''}{date} • <span className="text-gray-900">{itemCount} items</span>
            </p>
            {/* Show total on mobile below text */}
            <p className="text-lg font-bold text-gray-950 tracking-tighter mt-1 sm:hidden">{total}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 md:gap-8 flex-shrink-0">
          <div className="text-right hidden sm:flex flex-col">
            <p className="text-2xs font-bold text-gray-400 uppercase tracking-widest mb-1 font-sans">Total Bill</p>
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-950 tracking-tighter">{total}</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-50 group-hover:bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
