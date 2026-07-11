"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, GripVertical, Image as ImageIcon, Search, ArrowDownUp, Grid2X2, X, UploadCloud, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { calculatePricing, formatCurrency } from "@yukizi/utils";
import type { DiscountFormDetails } from "@yukizi/utils";

export type MediaItem = {
  id: string;
  url: string;
  type: "image" | "video";
  isLoading?: boolean;
};

export interface VariantOption {
  id: string;
  name: string;
  values: string[];
}

export interface VariantCombination {
  id: string; // e.g. "Medium / Red"
  name: string;
  price: string;
  compareAtPrice?: string;
  discount?: string;
  discountDetails?: DiscountFormDetails;
  gstPercent?: number;
  available: string;
  image?: string;
  sku?: string;
  serialNo?: string;
  shippingCharges?: string;
  shippingGstPercent?: number;
  finalShippingPrice?: string;
}

interface VariantBuilderProps {
  options: VariantOption[];
  onChangeOptions: (options: VariantOption[]) => void;
  variants?: VariantCombination[];
  onChangeVariants?: (variants: VariantCombination[]) => void;
  productMedia?: MediaItem[];
  onAddProductMedia?: (items: MediaItem[]) => void;
  gstPercent?: number;
  discountDetails?: DiscountFormDetails;
  shippingCharges?: number;
  shippingGstPercent?: number;
  isTaxIncluded?: boolean;
  isSuggestedProductSelected?: boolean;
  activeVariantId?: string;
  isEditMode?: boolean;
}

// Helper to generate cartesian product
function generateCombinations(options: VariantOption[]): string[] {
  const validOptions = options.map(o => ({
    ...o,
    values: (Array.isArray(o.values) ? o.values : []).filter(v => v && typeof v === 'string' && v.trim() !== "")
  })).filter(o => o.name && o.name.trim() !== "" && (Array.isArray(o.values) ? o.values : []).length > 0);

  if (validOptions.length === 0) return [];
  
  const arrays = validOptions.map(o => o.values);
  
  const combinations = arrays.reduce((acc, curr) => {
    const res: string[] = [];
    acc.forEach(a => {
      curr.forEach(c => {
        res.push(`${a} / ${c}`);
      });
    });
    return res;
  });
  
  return combinations;
}

// ImageSelectionModal removed for seller app

export const VariantBuilder: React.FC<VariantBuilderProps> = ({ 
  options, 
  onChangeOptions,
  variants = [],
  onChangeVariants,
  productMedia,
  onAddProductMedia,
  gstPercent,
  discountDetails,
  shippingCharges,
  shippingGstPercent,
  isTaxIncluded,
  isSuggestedProductSelected = false,
  activeVariantId,
  isEditMode = false
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  // Auto-generation of variants on option change has been removed.
  // We now synchronously update variants when option values are added or deleted,
  // preventing previously disabled variants from automatically reappearing when
  // the component mounts or when unrelated options change.

  const addOption = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    onChangeOptions([...options, { id: newId, name: "", values: [] }]);
    setEditingId(newId);
  };

  const updateOption = (id: string, updates: Partial<VariantOption>) => {
    const oldOption = options.find(opt => opt.id === id);
    if (!oldOption) return;

    const newOptions = options.map((opt) => (opt.id === id ? { ...opt, ...updates } : opt));
    onChangeOptions(newOptions);

    if (updates.values && onChangeVariants) {
      // Find what was added or removed
      const oldVals = oldOption.values || [];
      const newVals = updates.values;
      
      const addedVals = newVals.filter(v => !oldVals.includes(v));
      const removedVals = oldVals.filter(v => !newVals.includes(v));

      let currentVariants = [...variants];

      // If values were removed, delete affected variants
      if (removedVals.length > 0) {
        const optionIndex = options.findIndex(opt => opt.id === id);
        currentVariants = currentVariants.filter(v => {
          const parts = v.name.split(' / ');
          if (parts.length > optionIndex) {
            return !removedVals.includes(parts[optionIndex]);
          }
          return true;
        });
      }

      // If values were added, generate new combinations ONLY for the added values
      if (addedVals.length > 0) {
        // Pretend this option only has the newly added values
        const addedOptions = newOptions.map(opt => 
          opt.id === id ? { ...opt, values: addedVals } : opt
        );
        const newCombinations = generateCombinations(addedOptions);
        
        const newVariants: VariantCombination[] = newCombinations.map(comboName => ({
          id: Math.random().toString(36).substring(2, 9), 
          name: comboName, 
          price: "", 
          compareAtPrice: "",
          discount: discountDetails?.discountPercent?.toString() || "",
          gstPercent: gstPercent || undefined,
          available: "",
          sku: "",
          serialNo: "",
          shippingCharges: "0",
          shippingGstPercent: 0,
          finalShippingPrice: "0"
        }));
        
        currentVariants = [...currentVariants, ...newVariants];
      }

      onChangeVariants(currentVariants);
    }
  };

  const deleteOption = (id: string) => {
    const optionIndex = options.findIndex(opt => opt.id === id);
    const newOptions = options.filter((opt) => opt.id !== id);
    onChangeOptions(newOptions);
    if (editingId === id) setEditingId(null);

    // Update existing variants to remove the deleted option's part
    if (onChangeVariants) {
      if (newOptions.length === 0) {
        onChangeVariants([]);
      } else {
        const updatedVariants = variants.map(v => {
          const parts = v.name.split(' / ');
          if (parts.length > optionIndex) {
            parts.splice(optionIndex, 1);
          }
          return { ...v, name: parts.join(' / ') };
        });
        
        // Deduplicate variants that might now have the same name
        const deduplicated: VariantCombination[] = [];
        const seen = new Set();
        for (const v of updatedVariants) {
          if (!seen.has(v.name)) {
            seen.add(v.name);
            deduplicated.push(v);
          }
        }
        onChangeVariants(deduplicated);
      }
    }
  };

  const updateVariant = (id: string, field: keyof VariantCombination, value: string) => {
    if (!onChangeVariants) return;
    onChangeVariants(variants.map(v => {
      if (v.id === id) {
        const updated = { ...v, [field]: value };
        if (field === 'shippingCharges' || field === 'shippingGstPercent') {
          const sc = Number(updated.shippingCharges || 0);
          const gst = Number(updated.shippingGstPercent || 0);
          const pricing = calculatePricing(0, 0, { type: 'none', shippingCharges: sc, shippingGstPercent: gst, isTaxIncluded });
          updated.finalShippingPrice = pricing.shippingTotal.toString();
        }
        return updated;
      }
      return v;
    }));
  };

  if (options.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Variants</h2>

        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Variants</h2>
          
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {options.map((option) => {
                const isEditing = editingId === option.id;
                
                if (isEditing) {
                  return (
                    <motion.div 
                      key={option.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                    >
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Option name</label>
                          <input
                            type="text"
                            value={option.name}
                            onChange={(e) => updateOption(option.id, { name: e.target.value })}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                            placeholder="e.g. Size, Color, Material"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Option values</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = e.currentTarget.value.trim();
                                  if (val && !option.values.includes(val)) {
                                    updateOption(option.id, { values: [...option.values, val] });
                                    e.currentTarget.value = "";
                                  }
                                }
                              }}
                              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                              placeholder="Type a value and press Enter"
                            />
                          </div>
                          {option.values.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {option.values.map((val, idx) => (
                                <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-white border border-gray-200 text-gray-700 shadow-sm">
                                  {val}
                                  <button
                                    type="button"
                                    onClick={() => updateOption(option.id, { values: option.values.filter(v => v !== val) })}
                                    className="ml-1.5 inline-flex items-center justify-center text-gray-400 hover:text-gray-500"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => deleteOption(option.id)}
                            className="text-sm font-medium text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="ml-auto px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div 
                    key={option.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 group"
                  >
                    <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-gray-300 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{option.name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{option.values.join(", ")}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>


          </div>
        </div>
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">Variant</th>
                    <th scope="col" className="px-6 py-3 font-medium">SKU</th>
                    <th scope="col" className="px-6 py-3 font-medium">Serial No</th>
                    <th scope="col" className="px-6 py-3 font-medium">Base Price (MRP)</th>
                    <th scope="col" className="px-6 py-3 font-medium">GST (%)</th>
                    <th scope="col" className="px-6 py-3 font-medium">Discount</th>
                    <th scope="col" className="px-6 py-3 font-medium">Shipping (₹)</th>
                    <th scope="col" className="px-6 py-3 font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant) => {
                    const isVariantEditing = editingVariantId === variant.id;
                    const isDisabled = activeVariantId ? variant.id !== activeVariantId : false;
                    return (
                    <tr key={variant.id} className={`border-b ${isDisabled ? 'bg-gray-50/50' : 'bg-white hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 font-medium text-gray-900 align-middle">
                        {variant.name}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <input
                          type="text"
                          value={variant.sku || "-"}
                          disabled
                          className="block w-32 px-3 sm:text-sm border-gray-300 rounded-md py-1.5 bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <input
                          type="text"
                          value={variant.serialNo || "-"}
                          disabled
                          className="block w-32 px-3 sm:text-sm border-gray-300 rounded-md py-1.5 bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="relative rounded-md shadow-sm w-32">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₹</span>
                          </div>
                          <input
                            type="text"
                            value={variant.price}
                            onChange={(e) => updateVariant(variant.id, "price", e.target.value)}
                            disabled={isDisabled}
                            className={`block w-full pl-7 pr-3 sm:text-sm border-gray-300 rounded-md py-1.5 border ${isDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                            placeholder="0.00"
                          />
                        </div>
                        {(() => {
                          const p = Number(variant.price);
                          if (p > 0) {
                            try {
                              const vGst = (variant.gstPercent !== undefined && variant.gstPercent !== null) ? Number(variant.gstPercent) : (gstPercent || 0);
                              
                              const vDiscountDetails = variant.discountDetails || discountDetails;
                              const discountType = vDiscountDetails?.type || 'none';
                              let discountPercent = 0;
                              if (variant.discount && Number(variant.discount) > 0) {
                                discountPercent = Number(variant.discount);
                              } else if (discountType === 'ptr_discount' || discountType === 'ptr_discount_and_same_product_bonus' || discountType === 'ptr_discount_and_different_product_bonus') {
                                discountPercent = vDiscountDetails?.discountPercent || 0;
                              }

                              const pricing = calculatePricing(p, vGst, {
                                type: discountPercent > 0 ? 'ptr_discount' : discountType,
                                discountPercent: discountPercent,
                                shippingCharges: (variant.shippingCharges !== undefined && variant.shippingCharges !== null && variant.shippingCharges !== "" && !isNaN(Number(variant.shippingCharges))) ? Number(variant.shippingCharges) : (shippingCharges || 0),
                                shippingGstPercent: (variant.shippingGstPercent !== undefined && variant.shippingGstPercent !== null && variant.shippingGstPercent !== 0 && variant.shippingGstPercent !== "" as any) ? Number(variant.shippingGstPercent) : (shippingGstPercent || 0),
                                isTaxIncluded: isTaxIncluded
                              });


                              return <div className="text-[10px] mt-1 text-primary/80 font-medium whitespace-nowrap">Final: {formatCurrency(pricing.finalCustomerPayable)}</div>;
                            } catch (e) {
                              return null;
                            }
                          }
                          return null;
                        })()}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="relative rounded-md shadow-sm w-24">
                          <input
                            type="number"
                            value={variant.gstPercent ?? ""}
                            onChange={(e) => updateVariant(variant.id, "gstPercent", e.target.value)}
                            disabled={isDisabled}
                            className={`block w-full px-3 sm:text-sm border-gray-300 rounded-md py-1.5 border ${isDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                            placeholder={gstPercent ? gstPercent.toString() : "0"}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="relative rounded-md shadow-sm w-24">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                          </div>
                          <input
                            type="number"
                            value={variant.discount || ""}
                            onChange={(e) => updateVariant(variant.id, "discount", e.target.value)}
                            disabled={isDisabled}
                            className={`block w-full pl-7 pr-3 sm:text-sm border-gray-300 rounded-md py-1.5 border ${isDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                            placeholder={discountDetails?.discountPercent ? discountDetails.discountPercent.toString() : "0"}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="relative rounded-md shadow-sm w-32">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₹</span>
                          </div>
                          <input
                            type="text"
                            value={(() => {
                              const sc = (variant.shippingCharges !== undefined && variant.shippingCharges !== null && variant.shippingCharges !== "") ? Number(variant.shippingCharges) : (shippingCharges || 0);
                              const gst = (variant.shippingGstPercent !== undefined && variant.shippingGstPercent !== null && variant.shippingGstPercent !== 0 && variant.shippingGstPercent !== "" as any) ? Number(variant.shippingGstPercent) : (shippingGstPercent || 18);
                              const computed = calculatePricing(0, 0, { type: 'none', shippingCharges: sc, shippingGstPercent: gst, isTaxIncluded: false }).shippingTotal;
                              return computed.toString();
                            })()}
                            onChange={(e) => updateVariant(variant.id, "finalShippingPrice", e.target.value)}
                            disabled={true}
                            className="block w-full pl-9 pr-3 sm:text-sm border-gray-300 rounded-md py-1.5 border bg-gray-100 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                          <input
                            type="number"
                            value={variant.available}
                            onChange={(e) => updateVariant(variant.id, "available", e.target.value)}
                            disabled={isDisabled}
                            className={`block w-24 px-3 sm:text-sm border-gray-300 rounded-md py-1.5 border ${isDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                            placeholder="0"
                          />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-gray-50 text-sm text-gray-600 border-t border-gray-200">
              Total inventory at Shop location: {variants.reduce((acc, v) => acc + (parseInt(v.available) || 0), 0)} available
            </div>
          </div>
      </div>
    </>
  );
};
