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
  available: string;
  image?: string;
  sku?: string;
  shippingCharges?: string;
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
  isTaxIncluded?: boolean;
  isSuggestedProductSelected?: boolean;
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
  isTaxIncluded,
  isSuggestedProductSelected = false
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sync variants when options change
  useEffect(() => {
    const newCombinations = generateCombinations(options);
    
    // If no valid combinations, clear variants
    if (newCombinations.length === 0) {
      if (variants.length > 0 && onChangeVariants) {
        onChangeVariants([]);
      }
      return;
    }

    // Map new combinations, preserving existing data if the name matches
    const updatedVariants: VariantCombination[] = newCombinations.map(comboName => {
      const existing = variants.find(v => v.name === comboName);
      if (existing) {
        return {
          ...existing,
          sku: existing.sku || "",
          shippingCharges: existing.shippingCharges || "0"
        };
      }
      return { 
        id: Math.random().toString(36).substring(2, 9), 
        name: comboName, 
        price: "", 
        compareAtPrice: "",
        discount: "",
        available: "",
        sku: "",
        shippingCharges: "0"
      };
    });

    // Only call onChange if the variants actually changed structurally
    const currentNames = variants.map(v => v.name).join("|");
    const newNames = updatedVariants.map(v => v.name).join("|");
    
    if (currentNames !== newNames && onChangeVariants) {
      onChangeVariants(updatedVariants);
    }
  }, [options, variants, onChangeVariants]);

  const addOption = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    onChangeOptions([...options, { id: newId, name: "", values: [] }]);
    setEditingId(newId);
  };

  const updateOption = (id: string, updates: Partial<VariantOption>) => {
    onChangeOptions(options.map((opt) => (opt.id === id ? { ...opt, ...updates } : opt)));
  };

  const deleteOption = (id: string) => {
    onChangeOptions(options.filter((opt) => opt.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const updateVariant = (id: string, field: keyof VariantCombination, value: string) => {
    if (!onChangeVariants) return;
    onChangeVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  if (options.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Variants</h2>
          {isSuggestedProductSelected && (
            <button
              type="button"
              onClick={addOption}
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add options like size or color
            </button>
          )}
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
                      <button
                        type="button"
                        onClick={() => setEditingId(option.id)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        Edit
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {!editingId && isSuggestedProductSelected && (
              <button
                type="button"
                onClick={addOption}
                className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add another option
              </button>
            )}
          </div>
        </div>
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">Variant</th>
                    <th scope="col" className="px-6 py-3 font-medium">SKU</th>
                    <th scope="col" className="px-6 py-3 font-medium">Price</th>
                    <th scope="col" className="px-6 py-3 font-medium">Compare at price</th>
                    <th scope="col" className="px-6 py-3 font-medium">Discount</th>
                    <th scope="col" className="px-6 py-3 font-medium">Shipping</th>
                    <th scope="col" className="px-6 py-3 font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant) => (
                    <tr key={variant.id} className="bg-white border-b hover:bg-gray-50">
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
                        <div className="relative rounded-md shadow-sm w-32">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₹</span>
                          </div>
                          <input
                            type="text"
                            value={variant.price}
                            onChange={(e) => updateVariant(variant.id, "price", e.target.value)}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 pr-3 sm:text-sm border-gray-300 rounded-md py-1.5"
                            placeholder="0.00"
                          />
                        </div>
                        {(() => {
                          const p = Number(variant.price);
                          if (p > 0) {
                            try {
                              let finalPrice = p;
                              const discountType = discountDetails?.type || 'none';
                              let discountAmount = 0;
                              
                              if (discountType === 'ptr_discount' || discountType === 'ptr_discount_and_same_product_bonus' || discountType === 'ptr_discount_and_different_product_bonus') {
                                discountAmount = p * (discountDetails?.discountPercent || 0) / 100;
                              }

                              if (discountType === 'special_price') {
                                finalPrice = discountDetails?.specialPrice || 0;
                              } else {
                                finalPrice = p - discountAmount;
                              }

                              if (!isTaxIncluded) {
                                finalPrice += (finalPrice * (gstPercent || 0)) / 100;
                              }

                              finalPrice += (shippingCharges || Number(variant.shippingCharges) || 0);

                              return <div className="text-[10px] mt-1 text-primary/80 font-medium whitespace-nowrap">Final: {formatCurrency(finalPrice)}</div>;
                            } catch (e) {
                              return null;
                            }
                          }
                          return null;
                        })()}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="relative rounded-md shadow-sm w-32">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₹</span>
                          </div>
                          <input
                            type="text"
                            value={variant.compareAtPrice || ""}
                            onChange={(e) => updateVariant(variant.id, "compareAtPrice", e.target.value)}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 pr-3 sm:text-sm border-gray-300 rounded-md py-1.5"
                            placeholder="0.00"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="relative rounded-md shadow-sm w-32">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                          </div>
                          <input
                            type="text"
                            value={variant.discount || ""}
                            onChange={(e) => updateVariant(variant.id, "discount", e.target.value)}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 pr-3 sm:text-sm border-gray-300 rounded-md py-1.5"
                            placeholder="0"
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
                            value={variant.shippingCharges || "0"}
                            disabled
                            className="block w-full pl-9 pr-3 sm:text-sm border-gray-300 rounded-md py-1.5 bg-gray-100 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <input
                          type="number"
                          value={variant.available}
                          onChange={(e) => updateVariant(variant.id, "available", e.target.value)}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-28 px-3 sm:text-sm border-gray-300 rounded-md py-1.5"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
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
