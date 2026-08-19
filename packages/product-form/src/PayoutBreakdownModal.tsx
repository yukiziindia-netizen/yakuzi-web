import React, { useMemo } from 'react';
import { X, Calculator } from 'lucide-react';
import { Button } from './primitives';
import { calculatePricing, formatCurrency } from '@yukizi/utils';

export interface PayoutBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  isTaxIncluded: boolean;
  platformFees: any;
  
  mrp: number;
  gstPercent: number;
  shippingCharges: number;
  discountDetails: any;
  
  variants: any[];
}

export function PayoutBreakdownModal({
  isOpen,
  onClose,
  productName,
  isTaxIncluded,
  platformFees,
  mrp,
  gstPercent,
  shippingCharges,
  discountDetails,
  variants
}: PayoutBreakdownModalProps) {
  
  // Close on Escape key
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const itemsToCalculate = useMemo(() => {
    if (variants && variants.length > 0) {
      return variants.map(v => {
        const p = Number(v.price) || 0;
        const vGst = v.gstPercent !== undefined && v.gstPercent !== "" ? Number(v.gstPercent) : (gstPercent || 0);
        const vDiscountDetails = v.discountDetails || discountDetails;
        
        const finalShipStr = v.finalShippingPrice;
        const vShipping = (finalShipStr !== undefined && finalShipStr !== null && finalShipStr !== "" && !isNaN(Number(finalShipStr))) 
            ? Number(finalShipStr) 
            : (shippingCharges || Number(v.shippingCharges) || 0);

        // Map variant discount to DiscountFormInput shape
        let mappedDiscount = vDiscountDetails;
        if (v.discount && Number(v.discount) > 0) {
          mappedDiscount = { type: 'ptr_discount', discountPercent: Number(v.discount), isTaxIncluded };
        } else if (vDiscountDetails) {
          mappedDiscount = { ...vDiscountDetails, isTaxIncluded };
        } else {
          mappedDiscount = { type: 'none', isTaxIncluded };
        }
        
        // Since variant finalShippingPrice is ALREADY inclusive of shipping GST if there's any,
        // we pass it as shippingCharge and set shippingGstPercent to 0 so calculatePricing doesn't add tax again.
        // Wait, if isTaxIncluded is false, calculatePricing WILL add shipping GST to shippingCharges unless we tell it the GST is 0.
        // If finalShippingPrice is provided, we just pass that as shippingCharges and set shippingGstPercent to 0.
        const discountInput = {
          ...mappedDiscount,
          shippingCharges: vShipping,
          shippingGstPercent: 0, 
          isTaxIncluded
        };

        const pricing = calculatePricing(p, vGst, discountInput, platformFees);

        return {
          id: v.id,
          name: v.name || 'Unnamed Variant',
          pricing
        };
      });
    } else {
      let mappedDiscount = discountDetails || {};
      if (mappedDiscount.discountPercent > 0 && (!mappedDiscount.type || mappedDiscount.type === 'none')) {
        mappedDiscount = { ...mappedDiscount, type: 'ptr_discount' };
      }
      
      const discountInput = {
        ...mappedDiscount,
        shippingCharges,
        shippingGstPercent: 0, // Since product form handles shipping GST into finalShippingPrice (if we were using it), wait: for simple products, ProductForm doesn't calculate finalShippingPrice inline for UI, but it submits it. Actually, wait. Let's just use 0 here too because the user entered `shippingCharges` which they intend to be the final shipping cost.
        isTaxIncluded
      };
      const pricing = calculatePricing(mrp || 0, gstPercent || 0, discountInput, platformFees);
      return [{
        id: 'simple',
        name: productName || 'Simple Product',
        pricing
      }];
    }
  }, [variants, mrp, gstPercent, shippingCharges, discountDetails, isTaxIncluded, platformFees, productName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Estimated Payout Breakdown</h2>
              <p className="text-xs text-muted-foreground">Preview of final pricing and seller earnings</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-semibold">Tax Settings:</span> The price entered is currently marked as 
              <span className="font-bold"> {isTaxIncluded ? "Inclusive of Taxes" : "Exclusive of Taxes"}</span>.
            </p>
          </div>

          <div className="space-y-6">
            {itemsToCalculate.map((item, idx) => (
              <div key={item.id} className="border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-muted/40 px-5 py-3 border-b border-border font-medium flex justify-between items-center">
                  <span>{itemsToCalculate.length > 1 ? `Variant: ${item.name}` : item.name}</span>
                  <span className="text-primary font-bold text-lg">{formatCurrency(item.pricing.sellerPayout)} <span className="text-xs text-muted-foreground font-normal">Payout</span></span>
                </div>
                
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                    {/* Customer Pays Section */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-1">Customer Final Price</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Price</span>
                          <span>{formatCurrency(item.pricing.basePrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Product GST ({item.pricing.productGstPercent}%)</span>
                          <span>{isTaxIncluded ? `Included (${formatCurrency(Math.round((item.pricing.basePrice - (item.pricing.basePrice / (1 + item.pricing.productGstPercent / 100))) * 100) / 100)})` : `+${formatCurrency(Math.round((item.pricing.basePrice * (item.pricing.productGstPercent / 100)) * 100) / 100)}`}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping (Inc. GST)</span>
                          <span>+{formatCurrency(item.pricing.shippingTotal)}</span>
                        </div>
                        {item.pricing.discountPercent > 0 && (
                          <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span>Discount ({item.pricing.discountPercent}%)</span>
                            <span>-{formatCurrency(item.pricing.discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold pt-2 border-t border-border border-dashed">
                          <span>Final Customer Payable</span>
                          <span>{formatCurrency(item.pricing.finalCustomerPayable)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions & Payout Section */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-1">Deductions & Seller Payout</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-red-500/80">
                          <span>Platform Commission ({item.pricing.commissionPercent}%)</span>
                          <span>-{formatCurrency(item.pricing.commissionAmount)}</span>
                        </div>
                        {item.pricing.fixedFee > 0 && (
                          <div className="flex justify-between text-red-500/80">
                            <span>Fixed Fee</span>
                            <span>-{formatCurrency(item.pricing.fixedFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-red-500/80">
                          <span>GST on Fees ({item.pricing.commissionGstPercent}%)</span>
                          <span>-{formatCurrency(item.pricing.commissionGstAmount + item.pricing.fixedFeeGstAmount)}</span>
                        </div>

                        <div className="flex justify-between text-red-500/80">
                          <span title="Shipping handled by platform">Shipping (Deducted)</span>
                          <span>-{formatCurrency(item.pricing.shippingTotal)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-primary pt-2 border-t border-border border-dashed text-base">
                          <span>Estimated Payout (Inc. Product GST)</span>
                          <span>{formatCurrency(item.pricing.sellerPayout)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-muted/10 flex justify-end">
          <Button onClick={onClose}>Close Estimate</Button>
        </div>
      </div>
    </div>
  );
}
