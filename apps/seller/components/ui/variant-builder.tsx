"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, GripVertical, Image as ImageIcon, Search, ArrowDownUp, Grid2X2, X, UploadCloud, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

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
  available: string;
  image?: string;
}

interface VariantBuilderProps {
  options: VariantOption[];
  onChangeOptions: (options: VariantOption[]) => void;
  variants?: VariantCombination[];
  onChangeVariants?: (variants: VariantCombination[]) => void;
  productMedia?: MediaItem[];
  onAddProductMedia?: (items: MediaItem[]) => void;
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
  onAddProductMedia
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
        return existing;
      }
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: comboName,
        price: "0.00",
        available: "0"
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
          <button
            type="button"
            onClick={addOption}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add options like size or color
          </button>
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
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white border border-gray-200 rounded-lg p-5"
                    >
                      <div className="space-y-4">
                        {/* Option Name Input */}
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Option name
                            </label>
                            <input
                              type="text"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                              placeholder="Size, Color, Material"
                              value={option.name}
                              onChange={(e) => updateOption(option.id, { name: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Option Values Inputs */}
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <div className="w-4 h-4" /> {/* Spacer for grip */}
                            <label className="block text-sm font-medium text-gray-700">
                              Option values
                            </label>
                          </div>
                          
                          <div className="space-y-2">
                            {[...(Array.isArray(option.values) ? option.values : []), ""].map((val, idx) => {
                              const isLast = idx === (Array.isArray(option.values) ? option.values : []).length;
                              return (
                                <div key={idx} className="flex items-center gap-3">
                                  <div className="w-4 h-4 flex items-center justify-center">
                                    {!isLast && <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />}
                                  </div>
                                  <input
                                    type="text"
                                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                                    placeholder={isLast ? "Add another value" : ""}
                                    value={val}
                                    onChange={(e) => {
                                      const newValues = [...(Array.isArray(option.values) ? option.values : [])];
                                      if (idx < (Array.isArray(option.values) ? option.values : []).length) {
                                        newValues[idx] = e.target.value;
                                      } else {
                                        if (e.target.value) newValues.push(e.target.value);
                                      }
                                      updateOption(option.id, { values: newValues });
                                    }}
                                    onBlur={() => {
                                      // Remove empty values on blur
                                      const arrValues = Array.isArray(option.values) ? option.values : [];
                                      if (idx < arrValues.length && arrValues[idx].trim() === "") {
                                        const newValues = [...arrValues];
                                        newValues.splice(idx, 1);
                                        updateOption(option.id, { values: newValues });
                                      }
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4" />
                            <button
                              type="button"
                              onClick={() => deleteOption(option.id)}
                              className="text-sm font-medium text-red-600 bg-white border border-gray-200 hover:bg-red-50 px-4 py-1.5 rounded-md transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-5 py-1.5 rounded-md transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                // Read-only chip view
                return (
                  <motion.div 
                    key={option.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="pt-1 pr-3 text-gray-400 cursor-grab">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-2">
                        {option.name || "Option"}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(option.values) ? option.values : []).filter(v => v && typeof v === 'string' && v.trim() !== "").map((val, idx) => (
                          <span 
                            key={idx} 
                            className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-md"
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setEditingId(option.id)}
                      className="text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-1.5 rounded-md transition-colors ml-4"
                    >
                      Edit
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-200">
          <button
            type="button"
            onClick={addOption}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <Plus className="w-4 h-4 mr-2 text-gray-500" />
            Add another option
          </button>
        </div>

        {variants.length > 0 && editingId === null && (
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="p-4 w-4">
                      <div className="flex items-center">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">Variant</th>
                    <th scope="col" className="px-6 py-3 font-medium">Price</th>
                    <th scope="col" className="px-6 py-3 font-medium">Stock</th>
                    <th scope="col" className="px-6 py-3 font-medium">Publishing</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant) => (
                    <tr key={variant.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="w-4 p-4">
                        <div className="flex items-center">
                          <input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                        {variant.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₹</span>
                          </div>
                          <input
                            type="text"
                            value={variant.price}
                            onChange={(e) => updateVariant(variant.id, "price", e.target.value)}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-28 pl-9 sm:text-sm border-gray-300 rounded-md py-1.5"
                            placeholder="0.00"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={variant.available}
                          onChange={(e) => updateVariant(variant.id, "available", e.target.value)}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-24 sm:text-sm border-gray-300 rounded-md py-1.5"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-500">
                          {/* Placeholder for publishing status */}
                          <span className="flex items-center mr-3">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            2
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                            0
                          </span>
                        </div>
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
        )}
      </div>
    </>
  );
};
