'use client';

import { Plus, Clock, Loader2, Dot } from 'lucide-react';

export type StockStatus = 'good' | 'selling-fast' | 'low' | 'out-of-stock';

interface StockBasedButtonProps {
  stock: number;
  onAddToCart?: () => void;
  onNotifyStockAlert?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  moq?: number;
  isWaitlisted?: boolean;
}

export function StockBasedButton({
  stock,
  onAddToCart,
  onNotifyStockAlert,
  isLoading = false,
  disabled = false,
  moq = 1,
  isWaitlisted = false,
}: StockBasedButtonProps) {
  // Determine stock status
  let status: StockStatus;
  if (stock === 0) {
    status = 'out-of-stock';
  } else if (stock > 100) {
    status = 'good';
  } else if (stock > 20) {
    status = 'selling-fast';
  } else {
    status = 'low';
  }

  // Icon color mapping (no fill, just icon color)
  const iconColorMap = {
    'good': 'text-black hover:text-black/80',
    'selling-fast': 'text-black hover:text-black/80',
    'low': 'text-black hover:text-black/80',
    'out-of-stock': 'text-red-500 cursor-not-allowed',
  };

  // Badge text mapping
  const badgeMap = {
    'good': '',
    'selling-fast': 'SELLING FAST',
    'low': '',
    'out-of-stock': '',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (status === 'out-of-stock') {
      onNotifyStockAlert?.();
    } else {
      onAddToCart?.();
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={`
          p-1 transition-all duration-150 active:scale-90 rounded-full
          ${status === 'out-of-stock' ? (isWaitlisted ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50') : iconColorMap[status]}
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title={status === 'out-of-stock' ? (isWaitlisted ? 'Remove from waitlist' : 'Notify me when available') : 'Add to bag'}
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        )
          : status === 'out-of-stock' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isWaitlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          )
            :
            (
              <Plus className="w-5 h-5" strokeWidth={3} />
            )}
      </button>

      {/* Stock Status Badge */}
      {badgeMap[status] && (
        <div className={`text-[8px] font-bold text-center truncate px-1 ${status === 'selling-fast' ? 'text-yellow-700' :
          status === 'low' ? 'text-red-600' :
            'text-gray-500'
          }`}>
          {badgeMap[status]}
        </div>
      )}
    </div>
  );
}
