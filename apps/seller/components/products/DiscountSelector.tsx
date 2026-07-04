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
        <div className="mt-4 p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-2 text-sm">
          <div className="font-medium text-primary mb-2">Expected Settlement Preview</div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base Price (MRP)</span>
            <span>{formatCurrency(pricing.basePrice)}</span>
          </div>
          {pricing.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({pricing.discountPercent}%)</span>
              <span>-{formatCurrency(pricing.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <span>Discounted Selling Price</span>
            <span>{formatCurrency(pricing.discountedPrice)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="text-muted-foreground">Platform Commission ({pricing.commissionPercent}%)</span>
            <span className="text-red-500">-{formatCurrency(pricing.commissionAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fixed Fee</span>
            <span className="text-red-500">-{formatCurrency(pricing.fixedFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST on Platform Fees ({pricing.commissionGstPercent}%)</span>
            <span className="text-red-500">-{formatCurrency(pricing.commissionGstAmount + pricing.fixedFeeGstAmount)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2 font-bold text-base">
            <span>Estimated Payout (per unit)</span>
            <span className="text-green-600">{formatCurrency(pricing.sellerPayout)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            * Final customer pays {formatCurrency(pricing.finalCustomerPayable)} (includes {pricing.productGstPercent}% Product GST + Shipping if applicable). You are responsible for remitting Product GST to the government out of your payout.
          </p>
        </div>
      )}
    </div>
  );
}
