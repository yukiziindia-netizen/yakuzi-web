"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, GripVertical, Image as ImageIcon, Search, ArrowDownUp, Grid2X2, X, UploadCloud, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { uploadProductMedia } from "@/api/admin.api";
import { MediaItem } from "./media-uploader";
import { cn } from "@/lib/utils";

export interface VariantOption {
  id: string;
  name: string;
  values: string[];
}

export interface VariantCombination {
  id: string; // e.g. "Medium / Red"
  name: string;
  sku: string;
  shippingCharges: string;
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

const ImageSelectionModal = ({ 
  isOpen, onClose, onSelect, productMedia = [], onAddProductMedia 
}: {
  isOpen: boolean; onClose: () => void; onSelect: (url: string) => void; 
  productMedia?: MediaItem[]; onAddProductMedia?: (items: MediaItem[]) => void;
}) => {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file), // Temp preview
      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
      isLoading: true
    }));

    if (onAddProductMedia) onAddProductMedia(newItems);

    const uploadedItems = await Promise.all(
      files.map(async (file, index) => {
        try {
          const url = await uploadProductMedia(file);
          return { ...newItems[index], url, isLoading: false };
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
          return null;
        }
      })
    );

    // Filter out failed uploads and pass to parent to replace temp items
    const successfulUploads = uploadedItems.filter(Boolean) as MediaItem[];
    if (onAddProductMedia && successfulUploads.length > 0) {
      // In a real app we'd dispatch an update to replace the isLoading=true item with the real one
      // For simplicity, we just trigger onAddProductMedia again which will append the real ones.
      // A better approach is to let the parent handle the actual uploading logic, but since we are mirroring MediaUploader:
      onAddProductMedia(successfulUploads);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOverArea = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropArea = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (files.length === 0) return;

    const dataTransfer = new DataTransfer();
    files.forEach(f => dataTransfer.items.add(f));
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
      const event = new Event('change', { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
      handleFileChange({ target: fileInputRef.current } as any);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Select image</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Controls */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search files"
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <ArrowDownUp className="w-4 h-4" /> Sort
              </button>
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Grid2X2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 border border-gray-200 border-dashed rounded-full text-sm text-gray-600 cursor-pointer hover:bg-gray-50">File size v</span>
            <span className="px-3 py-1.5 border border-gray-200 border-dashed rounded-full text-sm text-gray-600 cursor-pointer hover:bg-gray-50">Used in v</span>
            <span className="px-3 py-1.5 border border-gray-200 border-dashed rounded-full text-sm text-gray-600 cursor-pointer hover:bg-gray-50">Product v</span>
          </div>

          {/* Upload Area */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOverArea}
            onDrop={handleDropArea}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept="image/*,video/*"
            />
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white mb-2 shadow-sm">
              <Plus className="w-4 h-4" /> Add files
            </button>
            <p className="text-sm text-gray-500">Drag and drop images</p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {productMedia.map((media) => (
              <div 
                key={media.id} 
                className="group relative cursor-pointer"
                onClick={() => !media.isLoading && setSelectedUrl(media.url)}
              >
                <div className={cn(
                  "aspect-square rounded-xl border overflow-hidden relative",
                  selectedUrl === media.url ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200"
                )}>
                  {media.isLoading ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <img src={media.url} alt="Media" className="w-full h-full object-cover" />
                  )}
                  
                  {!media.isLoading && (
                    <div className="absolute top-2 left-2 z-10">
                      <div className={cn(
                        "w-5 h-5 rounded border bg-white flex items-center justify-center",
                        selectedUrl === media.url ? "border-blue-500 bg-blue-500" : "border-gray-300"
                      )}>
                        {selectedUrl === media.url && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-700 truncate px-1">
                    {media.url.split('/').pop() || 'image'}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase mt-0.5">JPG</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (selectedUrl) {
                onSelect(selectedUrl);
                onClose();
              }
            }}
            disabled={!selectedUrl}
            className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export const VariantBuilder: React.FC<VariantBuilderProps> = ({ 
  options, 
  onChangeOptions,
  variants = [],
  onChangeVariants,
  productMedia,
  onAddProductMedia
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageModalForVariant, setImageModalForVariant] = useState<string | null>(null);

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
      <ImageSelectionModal
        isOpen={!!imageModalForVariant}
        onClose={() => setImageModalForVariant(null)}
        productMedia={productMedia}
        onAddProductMedia={onAddProductMedia}
        onSelect={(url) => {
          if (imageModalForVariant) {
            updateVariant(imageModalForVariant, 'image', url);
          }
        }}
      />

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
                    <th scope="col" className="px-6 py-3 font-medium">SKU</th>
                    <th scope="col" className="px-6 py-3 font-medium">Shipping Charges (₹)</th>
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
                        <button 
                          onClick={() => setImageModalForVariant(variant.id)}
                          className="w-10 h-10 border border-gray-200 rounded-md border-dashed overflow-hidden flex items-center justify-center bg-gray-50 text-blue-500 hover:border-blue-500 transition-colors relative"
                        >
                          {variant.image ? (
                            <img src={variant.image} alt="Variant" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5" />
                          )}
                        </button>
                        {variant.name}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => updateVariant(variant.id, "sku", e.target.value)}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-28 sm:text-sm border-gray-300 rounded-md py-1.5 px-2"
                          placeholder="SKU-001"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₹</span>
                          </div>
                          <input
                            type="number"
                            value={variant.shippingCharges}
                            onChange={(e) => updateVariant(variant.id, "shippingCharges", e.target.value)}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-28 pl-9 sm:text-sm border-gray-300 rounded-md py-1.5"
                            placeholder="0"
                          />
                        </div>
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
              {variants.length} variant{variants.length !== 1 ? "s" : ""} configured
            </div>
          </div>
        )}
      </div>
    </>
  );
};
