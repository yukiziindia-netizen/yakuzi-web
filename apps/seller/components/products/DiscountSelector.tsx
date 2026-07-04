"use client";
import React, { useMemo } from "react";
import { Select, Input, Badge } from "@/components/ui";
import type { DiscountFormDetails, DiscountType } from "@yukizi/utils";
import {
  calculatePricing,
  requiresDiscountPercent,
  requiresBuyGet,
  requiresBonusProductName,
  isSpecialPriceType,
  formatCurrency,
} from "@yukizi/utils";

interface Props {
  value: DiscountFormDetails;
  onChange: (value: DiscountFormDetails) => void;
  mrp: number;
  gstPercent: number;
  platformFees?: { commissionPercent: number; fixedFee: number; commissionGstPercent: number };
  error?: string;
}

const DISCOUNT_OPTIONS: { label: string; value: string }[] = [
  { label: "None", value: "none" },
  { label: "Discount", value: "ptr_discount" },
];

export function DiscountSelector({ value, onChange, mrp, gstPercent, platformFees, error }: Props) {
  const showPercent = requiresDiscountPercent(value.type);
  const showBonus = requiresBuyGet(value.type);
  const showBonusName = requiresBonusProductName(value.type);
  const showSpecialPrice = isSpecialPriceType(value.type);

  // Real-time pricing preview
  const pricing = useMemo(() => {
    if (mrp <= 0 || ![0, 5, 12, 18].includes(gstPercent)) return null;
    try {
      return calculatePricing(mrp, gstPercent, {
        type: value.type,
        discountPercent: value.discountPercent,
        buy: value.buy,
        get: value.get,
        bonusProductName: value.bonusProductName,
        specialPrice: value.specialPrice,
      }, platformFees);
    } catch {
      return null;
    }
  }, [mrp, gstPercent, value]);

  const handleTypeChange = (newType: DiscountType) => {
    onChange({
      type: newType,
      discountPercent: undefined,
      buy: undefined,
      get: undefined,
      bonusProductName: undefined,
      specialPrice: undefined,
    });
  };

  return (
    <div className="space-y-4 rounded-xl border p-4 bg-muted/10">
      <Select
        label="Discount Type"
        options={DISCOUNT_OPTIONS}
        value={value.type}
        onChange={(e) => handleTypeChange(e.target.value as DiscountType)}
        error={error}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {showPercent && (
          <Input
            label="Discount %"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={value.discountPercent ?? ""}
            onChange={(e) => onChange({ ...value, discountPercent: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="e.g 10"
          />
        )}

        {showBonus && (
          <div className="grid grid-cols-2 gap-4 sm:col-span-2">
            <Input
              label="Buy Quantity"
              type="number"
              min={1}
              step={1}
              value={value.buy ?? ""}
              onChange={(e) => onChange({ ...value, buy: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g 10"
            />
            <Input
              label="Get Quantity (Free)"
              type="number"
              min={1}
              step={1}
              value={value.get ?? ""}
              onChange={(e) => onChange({ ...value, get: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g 2"
            />
          </div>
        )}

        {showBonusName && (
          <div className="sm:col-span-2">
            <Input
              label="Bonus Product Name"
              value={value.bonusProductName ?? ""}
              onChange={(e) => onChange({ ...value, bonusProductName: e.target.value })}
              placeholder="e.g Cetirizine 10mg"
            />
          </div>
        )}

        {showSpecialPrice && (
          <Input
            label="Special Price (₹)"
            type="number"
            min={0}
            step={0.01}
            value={value.specialPrice ?? ""}
            onChange={(e) => onChange({ ...value, specialPrice: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Fixed selling price"
          />
        )}
      </div>

      {pricing && (
        <div className="mt-6 rounded-2xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="bg-muted/30 p-4 border-b">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
              Expected Settlement Preview
            </h3>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Base Price (MRP)</span>
              <span className="font-medium text-right min-w-[80px]">{formatCurrency(pricing.basePrice)}</span>
            </div>
            
            {pricing.discountAmount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span>Discount ({pricing.discountPercent}%)</span>
                <span className="font-medium text-right min-w-[80px]">- {formatCurrency(pricing.discountAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-2 border-t border-dashed">
              <span className="font-medium text-foreground">Discounted Selling Price</span>
              <span className="font-semibold text-right min-w-[80px]">{formatCurrency(pricing.discountedPrice)}</span>
            </div>

            <div className="pt-3 pb-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Platform Deductions</div>
              <div className="space-y-2 pl-2 border-l-2 border-muted">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Platform Commission ({pricing.commissionPercent}%)</span>
                  <span className="text-destructive font-medium text-right min-w-[80px]">- {formatCurrency(pricing.commissionAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fixed Fee</span>
                  <span className="text-destructive font-medium text-right min-w-[80px]">- {formatCurrency(pricing.fixedFee)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">GST on Platform Fees</span>
                  <span className="text-destructive font-medium text-right min-w-[80px]">- {formatCurrency(pricing.commissionGstAmount + pricing.fixedFeeGstAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 mt-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-100 dark:border-green-900/30">
              <span className="font-bold text-base text-green-800 dark:text-green-300">Estimated Payout (per unit)</span>
              <span className="font-bold text-lg text-green-700 dark:text-green-400 text-right min-w-[80px]">{formatCurrency(pricing.sellerPayout)}</span>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-start gap-3 border border-blue-100 dark:border-blue-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                <strong className="font-semibold">Note:</strong> Final customer pays <strong>{formatCurrency(pricing.finalCustomerPayable)}</strong> (includes {pricing.productGstPercent}% Product GST {pricing.shippingTotal > 0 ? `+ ${formatCurrency(pricing.shippingTotal)} Total Shipping` : ''}). You are responsible for remitting Product GST to the government out of your payout.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
