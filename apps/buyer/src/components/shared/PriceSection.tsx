'use client';

interface PriceSectionProps {
  mrp: number;
  sellingPrice?: number;
  ptr?: number;
  gstPercent?: number;
  discountPercent?: number;
  buyGetTag?: string;
  compact?: boolean;
  showPTR?: boolean;
}

export function PriceSection({
  mrp,
  sellingPrice,
  ptr,
  gstPercent,
  discountPercent,
  buyGetTag,
  compact = false,
  showPTR = true,
}: PriceSectionProps) {
  // Use selling price if provided, otherwise use mrp
  const finalPrice = sellingPrice ?? mrp;
  
  // Calculate discount if not provided
  const calculatedDiscount = discountPercent ?? (mrp > finalPrice ? Math.round(((mrp - finalPrice) / mrp) * 100) : 0);

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-400 line-through">₹{mrp.toLocaleString('en-IN')}</span>
          {calculatedDiscount > 0 && (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
              {calculatedDiscount}% OFF
            </span>
          )}
        </div>
        <div className="text-base font-black text-gray-900">
          ₹{finalPrice.toLocaleString('en-IN')}
        </div>
        {showPTR && ptr && (
          <div className="text-xs text-gray-500 font-medium">
            PTR: ₹{ptr.toLocaleString('en-IN')}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-4">
        <span className="text-4xl font-bold text-gray-900">
          ₹{finalPrice.toLocaleString('en-IN')}
        </span>
        {mrp > finalPrice && (
          <>
            <span className="text-xl text-gray-400 line-through">
              ₹{mrp.toLocaleString('en-IN')}
            </span>
            {calculatedDiscount > 0 && (
              <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-2xl">
                {calculatedDiscount}% OFF
              </span>
            )}
          </>
        )}
      </div>

      {gstPercent !== undefined && (
        <p className="text-xs text-gray-500 font-medium">
          GST {gstPercent}% • Inclusive of all taxes
        </p>
      )}

      {showPTR && ptr && (
        <p className="text-sm text-gray-600 font-medium">
          PTR: ₹{ptr.toLocaleString('en-IN')}
        </p>
      )}

      {buyGetTag && (
        <span className="inline-block text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-2xl">
          {buyGetTag}
        </span>
      )}
    </div>
  );
}
