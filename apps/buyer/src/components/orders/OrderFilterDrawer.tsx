import React, { useState } from 'react';
import { RotateCcw, CreditCard, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';

interface OrderFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters?: () => void;
}

export function OrderFilterDrawer({ isOpen, onClose, onApplyFilters }: OrderFilterDrawerProps) {
  // Mock states for UI interactivity
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [orderStatus, setOrderStatus] = useState('All orders');
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('JAN');

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for filter drawer (darkens the Order Drawer) */}
      <div 
        className="fixed inset-0 bg-black/20 z-[60] transition-opacity rounded-l-3xl" 
        onClick={onClose}
      />

      {/* Filter Drawer Panel */}
      <div className="fixed right-0 inset-y-0 w-[320px] bg-white rounded-l-3xl shadow-2xl z-[70] flex flex-col overflow-hidden animate-slide-in-right">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-700">Filters</h2>
          <button 
            className="text-purple-600 hover:text-purple-700 transition-colors"
            onClick={() => {
              setPaymentStatus('All');
              setOrderStatus('All orders');
              setYear('2026');
              setMonth('JAN');
            }}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          
          {/* Payment Status */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[15px] font-bold text-gray-700">Payment Status</h3>
              <CreditCard className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex gap-2">
              {['All', 'COD', 'PREPAID'].map((status) => (
                <button
                  key={status}
                  onClick={() => setPaymentStatus(status)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded ${
                    paymentStatus === status 
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
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[15px] font-bold text-gray-700">Order Status</h3>
              <ShoppingCart className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex flex-col gap-2">
              {['Canceled', 'Replacement', 'Returned', 'Delivered', 'Out for delivery', 'In transit / Placed', 'All orders'].map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderStatus(status)}
                  className={`w-full py-2 text-xs font-bold rounded ${
                    orderStatus === status 
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
            <h3 className="text-[15px] font-bold text-gray-700 mb-3">Year</h3>
            <div className="flex items-center gap-1">
              <button className="p-1 text-gray-400 hover:text-gray-600"><ChevronLeft className="w-4 h-4" /></button>
              <div className="flex flex-1 gap-2">
                {['2024', '2025', '2026'].map((y) => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded ${
                      year === y 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-[#d1d1d1] text-white hover:bg-gray-400'
                    } transition-colors`}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Month */}
          <div className="mb-6">
            <h3 className="text-[15px] font-bold text-gray-700 mb-3">Month</h3>
            <div className="grid grid-cols-3 gap-2">
              {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonth(m)}
                  className={`py-1.5 text-xs font-bold rounded ${
                    month === m 
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
              if (onApplyFilters) onApplyFilters();
              onClose();
            }} 
            className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors"
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
    </>
  );
}
