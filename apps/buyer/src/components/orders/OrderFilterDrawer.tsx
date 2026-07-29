import React, { useState } from 'react';
import { RotateCcw, CreditCard, ShoppingCart, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface OrderFilters {
  paymentStatus: string;
  orderStatus: string;
  year: string;
  month: string;
}

interface OrderFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: OrderFilters;
  onApplyFilters: (filters: OrderFilters) => void;
}

export function OrderFilterDrawer({ isOpen, onClose, filters, onApplyFilters }: OrderFilterDrawerProps) {
  // Local state for the drawer before applying
  const [localFilters, setLocalFilters] = useState<OrderFilters>(filters);

  // Sync when opened
  React.useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const setPaymentStatus = (v: string) => setLocalFilters(prev => ({ ...prev, paymentStatus: v }));
  const setOrderStatus = (v: string) => setLocalFilters(prev => ({ ...prev, orderStatus: v }));
  const setYear = (v: string) => setLocalFilters(prev => ({ ...prev, year: v }));
  const setMonth = (v: string) => setLocalFilters(prev => ({ ...prev, month: v }));

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for filter drawer (darkens the Order Drawer) */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100] transition-opacity" 
        onClick={onClose}
      />

      {/* Filter Drawer Panel (styled as a full-page overlay) */}
      <div className="fixed inset-0 w-full h-full bg-white z-[110] flex flex-col overflow-hidden animate-slide-in-right">
        <div className="w-full min-h-screen bg-white relative flex flex-col overflow-hidden">
          {/* Close Button */}
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 bg-white/80 rounded-full z-[80] transition-colors border border-gray-100 shadow-sm">
            <X className="w-6 h-6" />
          </button>
        
        {/* Header */}
        <div className="flex justify-between items-center pr-6 pl-14 py-5 border-b border-gray-100 shrink-0 relative">
          <button onClick={onClose} className="absolute left-4 top-5 text-gray-400 hover:text-gray-800 transition-colors p-1.5 z-[80]">
             <ChevronLeft className="w-8 h-8" />
          </button>
          <h2 className="text-[34px] font-extrabold text-gray-800">Filters</h2>
          <button 
            className="text-purple-600 hover:text-purple-700 transition-colors p-2"
            onClick={() => {
              setLocalFilters({
                paymentStatus: 'All',
                orderStatus: 'All orders',
                year: 'All',
                month: 'All',
              });
            }}
          >
            <RotateCcw className="w-7 h-7" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          
          {/* Payment Status */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3.5">
              <h3 className="text-[24px] font-extrabold text-gray-800">Payment Status</h3>
              <CreditCard className="w-7 h-7 text-gray-400" />
            </div>
            <div className="flex gap-2.5">
              {['All', 'COD', 'PREPAID'].map((status) => (
                <button
                  key={status}
                  onClick={() => setPaymentStatus(status)}
                  className={`flex-1 py-3 text-[16px] font-bold rounded-lg ${
                    localFilters.paymentStatus === status 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-[#d1d1d1] text-white hover:bg-gray-400'
                  } transition-colors`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Order Status */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3.5">
              <h3 className="text-[24px] font-extrabold text-gray-800">Order Status</h3>
              <ShoppingCart className="w-7 h-7 text-gray-400" />
            </div>
            <div className="flex flex-col gap-2.5">
              {['Canceled', 'Replacement', 'Returned', 'Delivered', 'Out for delivery', 'In transit / Placed', 'All orders'].map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderStatus(status)}
                  className={`w-full py-3.5 text-[16px] font-bold rounded-lg ${
                    localFilters.orderStatus === status 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-[#d1d1d1] text-white hover:bg-gray-400'
                  } transition-colors`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 my-4" />

          {/* Year */}
          <div className="mb-6">
            <h3 className="text-[24px] font-extrabold text-gray-800 mb-3.5">Year</h3>
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 text-gray-400 hover:text-gray-600"><ChevronLeft className="w-6 h-6" /></button>
              <div className="flex flex-1 gap-2.5">
                {['All', '2024', '2025', '2026'].map((y) => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={`flex-1 py-3 text-[16px] font-bold rounded-lg ${
                      localFilters.year === y 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-[#d1d1d1] text-white hover:bg-gray-400'
                    } transition-colors`}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <button className="p-1.5 text-gray-400 hover:text-gray-600"><ChevronRight className="w-6 h-6" /></button>
            </div>
          </div>

          {/* Month */}
          <div className="mb-6">
            <h3 className="text-[24px] font-extrabold text-gray-800 mb-3.5">Month</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {['All', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonth(m)}
                  className={`py-3 text-[15px] font-bold rounded-lg ${
                    localFilters.month === m 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-[#d1d1d1] text-white hover:bg-gray-400'
                  } transition-colors`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button 
            onClick={() => {
              onApplyFilters(localFilters);
              onClose();
            }} 
            className="w-full bg-purple-600 text-white font-bold py-5 text-[20px] rounded-2xl hover:bg-purple-700 transition-colors"
          >
            Done
          </button>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slide-in-right {
            from { transform: translateX(20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .animate-slide-in-right {
            animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}} />
        </div>
      </div>
    </>
  );
}
