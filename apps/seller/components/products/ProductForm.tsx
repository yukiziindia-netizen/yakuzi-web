"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button, Input, Textarea, Select, ExpiryPicker } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ImageUploader } from "./ImageUploader";
import { DiscountSelector } from "./DiscountSelector";
import { CategorySelector } from "./CategorySelector";
import { VariantBuilder, VariantOption, VariantCombination } from "../ui/variant-builder";
import type { DiscountFormDetails, Suggestion } from "@yukizi/utils";
import {
  productFormSchema,
  type ProductFormValues,
  calculatePricing,
  VALID_GST_PERCENTAGES,
} from "@yukizi/utils";
import { useCreateSellerProduct, useUpdateSellerProduct, useSuggestionSearch } from "@/hooks/useSeller";
import { getSellerProductById } from "@/api/seller.api";

type FormValues = ProductFormValues;

export function ProductForm({ defaultValues, productId }: { defaultValues?: Partial<FormValues>; productId?: string }) {
  const router = useRouter();
  const createProduct = useCreateSellerProduct();
  const updateProduct = useUpdateSellerProduct();
  const isEditing = !!productId;

  // Suggestion autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const { data: suggestions = [] } = useSuggestionSearch(searchQuery, "master");

  const { register, control, handleSubmit, setValue, getValues, formState: { errors, isSubmitting, isDirty }, watch } = useForm<FormValues>({
    mode: "onChange",
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: defaultValues || {
      product_name: "",
      product_price: 0,
      company_name: "",
      categories: [],
      sub_categories: [],
      stock: 0,
      min_order_qty: 1,
      max_order_qty: 100,
      delivery_text: "",
      image_list: [],
      custom_extra_fields: [],
      discount_form_details: { type: "ptr_discount" } as DiscountFormDetails,
    },
  });

  const [options, setOptions] = useState<VariantOption[]>([]);
  const [variants, setVariants] = useState<VariantCombination[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);

  const watchMrp = watch("product_price");
  const watchGst = watch("gst_percent");
  const watchMinMoq = watch("min_order_qty");
  const watchStock = watch("stock");
  const watchMaxMoq = watch("max_order_qty");
  const lastMrpRef = useRef<number>(0);

  // Real-time synchronization when MRP changes
  useEffect(() => {
    if (!watchMrp || watchMrp <= 0) return;

    const minRequiredMoq = Math.ceil(20000 / watchMrp);

    // Only auto-sync values when MRP changes
    const isPriceChanged = watchMrp !== lastMrpRef.current;

    if (isPriceChanged) {
      // Sync both to the minimum required for the new price
      setValue("min_order_qty", minRequiredMoq, { shouldDirty: true, shouldValidate: true });
      if (watchStock < minRequiredMoq) {
        setValue("stock", minRequiredMoq, { shouldDirty: true, shouldValidate: true });
      }
      lastMrpRef.current = watchMrp;
    }
  }, [watchMrp, setValue, watchStock]);

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        handleSuggestionSelect(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Confirmation before leaving unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Sync variant stock to current stock
  useEffect(() => {
    if (variants && variants.length > 0) {
      const totalStock = variants.reduce((acc, v) => acc + (parseInt(v.available) || 0), 0);
      setValue("stock", totalStock, { shouldValidate: true, shouldDirty: true });
    }
  }, [variants, setValue]);

  const handleSuggestionSelect = useCallback(async (suggestion: Suggestion) => {
    setSelectedMasterId(suggestion.id);
    setValue("product_name", suggestion.productName, { shouldDirty: true });
    setValue("company_name", suggestion.companyName, { shouldDirty: true });
    if (suggestion.gstPercent !== undefined) {
      setValue("gst_percent", suggestion.gstPercent, { shouldDirty: true });
    }
    if (suggestion.mrp !== undefined) {
      setValue("product_price", suggestion.mrp, { shouldDirty: true });
    }
    if (suggestion.categoryId) {
      setValue("categories", [suggestion.categoryId], { shouldDirty: true });
    }
    if (suggestion.subCategoryId) {
      setValue("sub_categories", [suggestion.subCategoryId], { shouldDirty: true });
    }
    if (suggestion.description) {
      // If we had a description field in the form, we'd set it here
    }
    if (suggestion.images && Array.isArray(suggestion.images)) {
      setValue("image_list", suggestion.images.map((img: any) => typeof img === 'string' ? img : img.url), { shouldDirty: true });
    }

    try {
      // Fetch the full product to ensure we get all variants and options
      const fullProduct = await getSellerProductById(suggestion.id);
      
      const optionsToUse = fullProduct?.options || suggestion.options;
      const variantsToUse = fullProduct?.variants || suggestion.variants;

      let finalOptions: any[] = [];
      let finalVariants: any[] = [];

      if (optionsToUse && Array.isArray(optionsToUse)) {
        finalOptions = optionsToUse
          .filter((o: any) => o && typeof o === 'object' && !Array.isArray(o) && o.name)
          .map((o: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: o.name,
            values: o.values || []
          }));
      }

      if (variantsToUse && Array.isArray(variantsToUse)) {
        finalVariants = variantsToUse.map((v: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: v.name,
          price: v.price?.toString() || "0",
          available: v.available?.toString() || "0",
          image: v.image
        }));
      }
      
      // If options is empty but we have variants, reconstruct options to prevent VariantBuilder from clearing variants!
      if (finalOptions.length === 0 && finalVariants.length > 0) {
        finalOptions = [{
          id: Math.random().toString(36).substr(2, 9),
          name: "Variant",
          values: finalVariants.map(v => v.name).filter(Boolean)
        }];
      }

      setOptions(finalOptions);
      setVariants(finalVariants);
    } catch (err) {
      console.error("Failed to fetch full product details for suggestion", err);
      // Fallback to suggestion options
      let finalOptionsFallback: any[] = [];
      let finalVariantsFallback: any[] = [];

      if (suggestion.options && Array.isArray(suggestion.options)) {
        finalOptionsFallback = suggestion.options
          .filter((o: any) => o && typeof o === 'object' && !Array.isArray(o) && o.name)
          .map((o: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: o.name,
            values: o.values || []
          }));
      }

      if (suggestion.variants && Array.isArray(suggestion.variants)) {
        finalVariantsFallback = suggestion.variants.map(v => ({
          id: Math.random().toString(36).substr(2, 9),
          name: v.name,
          price: v.price?.toString() || "0",
          available: v.available?.toString() || "0",
          image: v.image
        }));
      }

      if (finalOptionsFallback.length === 0 && finalVariantsFallback.length > 0) {
        finalOptionsFallback = [{
          id: Math.random().toString(36).substr(2, 9),
          name: "Variant",
          values: finalVariantsFallback.map(v => v.name).filter(Boolean)
        }];
      }

      setOptions(finalOptionsFallback);
      setVariants(finalVariantsFallback);
    }
    
    setShowSuggestions(false);
    setSearchQuery("");
  }, [setValue]);

  const onSubmit = async (data: FormValues) => {
    try {
      const extra_fields = data.custom_extra_fields.reduce<Record<string, string>>((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});

      // Compute pricing via centralized engine
      let computedPricing: Record<string, any> = {};
      try {
        const p = calculatePricing(data.product_price, data.gst_percent, {
          type: data.discount_form_details.type,
          discountPercent: data.discount_form_details.discountPercent,
          buy: data.discount_form_details.buy,
          get: data.discount_form_details.get,
          bonusProductName: data.discount_form_details.bonusProductName,
          specialPrice: data.discount_form_details.specialPrice,
        });
        computedPricing = {
          ptr: p.ptr,
          finalPtr: p.finalPtr,
          discountValue: p.discountValue,
          gstValue: p.gstValue,
          perPtrWithGst: p.perPtrWithGst,
          itemsToPayFor: p.itemsToPayFor,
          finalUserBuy: p.finalUserBuy,
          finalOrderValue: p.finalOrderValue,
          retailMarginPercent: p.retailMarginPercent,
        };
      } catch {
        // Pricing calculation failed — continue with form details only
      }

      // Filter out data URLs (base64) — only send real URLs
      const realImages = (data.image_list || []).filter((url) => url.startsWith("http"));

      // Map discount form details to backend DTO format
      // Map form discount types to backend enum values
      const discountTypeMap: Record<string, string> = {
        ptr_discount: "PTR_DISCOUNT",
        same_product_bonus: "SAME_PRODUCT_BONUS",
        ptr_discount_and_same_product_bonus: "PTR_PLUS_SAME_PRODUCT_BONUS",
        different_product_bonus: "DIFFERENT_PRODUCT_BONUS",
        ptr_discount_and_different_product_bonus: "PTR_PLUS_DIFFERENT_PRODUCT_BONUS",
        special_price: "SPECIAL_PRICE",
      };
      const discountMeta: Record<string, any> = {};
      const formDiscountType = data.discount_form_details?.type;
      const df = data.discount_form_details;

      if (formDiscountType === "ptr_discount") {
        if (df?.discountPercent) discountMeta.discountPercent = df.discountPercent;
      } else if (formDiscountType === "same_product_bonus") {
        if (df?.buy) discountMeta.buy = df.buy;
        if (df?.get) discountMeta.get = df.get;
      } else if (formDiscountType === "different_product_bonus") {
        if (df?.buy) discountMeta.buy = df.buy;
        if (df?.get) discountMeta.get = df.get;
        if (df?.bonusProductName) discountMeta.bonusProductName = df.bonusProductName;
      } else if (formDiscountType === "ptr_discount_and_same_product_bonus") {
        if (df?.discountPercent) discountMeta.discountPercent = df.discountPercent;
        if (df?.buy) discountMeta.buy = df.buy;
        if (df?.get) discountMeta.get = df.get;
      } else if (formDiscountType === "ptr_discount_and_different_product_bonus") {
        if (df?.discountPercent) discountMeta.discountPercent = df.discountPercent;
        if (df?.buy) discountMeta.buy = df.buy;
        if (df?.get) discountMeta.get = df.get;
        if (df?.bonusProductName) discountMeta.bonusProductName = df.bonusProductName;
      } else if (formDiscountType === "special_price") {
        if (df?.specialPrice) discountMeta.specialPrice = df.specialPrice;
      }

      // Map discount type if present
      const mappedDiscountType = formDiscountType ? discountTypeMap[formDiscountType as keyof typeof discountTypeMap] : undefined;

      const backendPayload: Record<string, any> = {
        name: data.product_name,
        mrp: data.product_price,
        manufacturer: data.company_name,
        categoryId: data.categories[0],
        ...(data.sub_categories?.length && { subCategoryId: data.sub_categories[0] }),
        stock: data.stock,
        expiryDate: new Date('2099-12-31').toISOString(),
        minimumOrderQuantity: data.min_order_qty,
        maximumOrderQuantity: data.max_order_qty,
        gstPercent: 0,
        ...(data.delivery_text && { deliveryText: data.delivery_text }),
        ...(realImages.length > 0 && { images: realImages }),
        ...(Object.keys(extra_fields).length > 0 && { extraFields: extra_fields }),
        ...(mappedDiscountType && { discountType: mappedDiscountType }),
        ...(Object.keys(discountMeta).length > 0 && { discountMeta }),
        ...(selectedMasterId && { masterProductId: selectedMasterId }),
        ...(options.length > 0 && { options: options.map(o => ({ name: o.name, values: o.values })) }),
        ...((variants.filter(v => Number(v.price) > 0)).length > 0 && { 
          variants: variants.filter(v => Number(v.price) > 0).map(v => ({ 
            name: v.name, 
            price: Number(v.price), 
            available: Number(v.available),
            image: v.image
          })) 
        }),
      };

      if (isEditing) {
        await updateProduct.mutateAsync({ productId: productId!, input: backendPayload as any });
        toast.success("Product updated successfully");
      } else {
        await createProduct.mutateAsync(backendPayload as any);
        toast.success("Product added successfully");
      }
      router.push("/products");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err.message || "Something went wrong saving the product";
      toast.error(Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => {
          if (isDirty && !window.confirm("You have unsaved changes. Discard?")) return;
          router.push("/products");
        }}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-2xl text-foreground">{isEditing ? "Edit Product" : "Add New Product"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Please fill in the product details carefully.</p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit(onSubmit, (validationErrors) => {
        console.error("Form validation errors:", validationErrors);
        const firstError = Object.values(validationErrors)[0];
        const msg = (firstError as any)?.message || "Please fix the form errors";
        toast.error(String(msg));
      })} className="space-y-6">
        {/* Suggestion Search */}
        {!isEditing && (
          <div className="glass-card rounded-2xl p-6 space-y-4 relative z-50" ref={suggestionRef}>
            <h2 className="font-semibold text-lg text-foreground border-b border-border/50 pb-2">Quick Search (Autocomplete)</h2>
            <div className="relative">
              <Input
                label="Search product catalog"
                placeholder="Type product name, company, or chemical..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                leftIcon={<Search className="h-4 w-4" />}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-primary/20 rounded-xl shadow-2xl max-h-64 overflow-y-auto backdrop-blur-xl">
                  {suggestions.map((s: Suggestion, index: number) => (
                    <button
                      key={s.id}
                      type="button"
                      className={cn(
                        "w-full text-left px-4 py-3 transition-colors border-b border-border/30 last:border-0 group",
                        activeIndex === index ? "bg-primary/20" : "hover:bg-primary/10"
                      )}
                      onClick={() => handleSuggestionSelect(s)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{s.productName}</p>
                        {s.mrp && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">₹{s.mrp}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.companyName} {s.chemicalCombination ? `| ${s.chemicalCombination}` : ""}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Select from suggestions to auto-fill product details, or enter manually below.</p>
          </div>
        )}

        {/* Basic Info */}
        <div className="glass-card rounded-2xl p-6 space-y-4 relative z-[45] transition-opacity duration-300">
          <h2 className="font-semibold text-lg text-foreground border-b border-border/50 pb-2">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Product Name *" error={errors.product_name?.message} {...register("product_name")} disabled={!!selectedMasterId} />
            <Input label="Company / Manufacturer *" error={errors.company_name?.message} {...register("company_name")} disabled={!!selectedMasterId} />
          </div>
        </div>

        {/* Categories */}
        <div className="glass-card rounded-2xl p-6 space-y-4 relative z-[44] transition-opacity duration-300">
          <h2 className="font-semibold text-lg text-foreground border-b border-border/50 pb-2">Categorization</h2>
          <div>
            <Controller
              control={control}
              name="categories"
              render={({ field: { value: cats, onChange: setCats } }: any) => (
                <Controller
                  control={control}
                  name="sub_categories"
                  render={({ field: { value: subcats, onChange: setSubcats } }: any) => (
                    <CategorySelector
                      selectedCategoryIds={cats}
                      onChangeCategories={setCats}
                      selectedSubcategoryIds={subcats || []}
                      onChangeSubcategories={setSubcats}
                      error={errors.categories?.message}
                    />
                  )}
                />
              )}
            />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="glass-card rounded-2xl p-6 space-y-4 relative z-[43] transition-opacity duration-300">
          <h2 className="font-semibold text-lg text-foreground border-b border-border/50 pb-2">Pricing & Stock</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input 
              label="MRP (₹) *" 
              type="number" 
              step="0.01" 
              error={errors.product_price?.message} 
              {...register("product_price", { valueAsNumber: true })} 
            />
            <Input 
              label="Current Stock *" 
              type="number" 
              min={watchMrp > 0 ? Math.ceil(20000 / watchMrp) : 1}
              error={errors.stock?.message} 
              disabled={variants && variants.length > 0}
              {...register("stock", { valueAsNumber: true })} 
            />
            <Input 
              label="Delivery Time (e.g. 3 days, Tomorrow)" 
              placeholder="e.g. 3 days, Tomorrow" 
              error={errors.delivery_text?.message} 
              {...register("delivery_text")} 
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <Input 
                label="Minimum Order Qty *" 
                type="number" 
                min={watchMrp > 0 ? Math.ceil(20000 / watchMrp) : 1}
                error={errors.min_order_qty?.message} 
                {...register("min_order_qty", { valueAsNumber: true })} 
              />
              {watchMrp > 0 && (
                <p className="text-[10px] text-muted-foreground px-1">
                  Min. {Math.ceil(20000 / watchMrp)} units (₹20k min)
                </p>
              )}
            </div>
            <Input 
              label="Maximum Order Qty *" 
              type="number" 
              min={watchMinMoq}
              error={errors.max_order_qty?.message} 
              {...register("max_order_qty", { valueAsNumber: true })} 
            />
          </div>
        </div>

        {/* Variants */}
        <div className="glass-card rounded-2xl p-6 space-y-4 relative z-[42] transition-opacity duration-300">
          <VariantBuilder 
            options={options} 
            onChangeOptions={setOptions} 
            variants={variants}
            onChangeVariants={setVariants}
            productMedia={mediaItems}
            onAddProductMedia={(items) => setMediaItems(prev => [...prev, ...items])}
          />
        </div>

        {/* Discounts & Pricing Engine */}
        <div className="glass-card rounded-2xl p-6 space-y-4 relative z-[41] transition-opacity duration-300">
          <h2 className="font-semibold text-lg text-foreground border-b border-border/50 pb-2">Discount & Bonuses</h2>
          <Controller
            control={control}
            name="discount_form_details"
            render={({ field }: any) => (
              <DiscountSelector
                value={field.value}
                onChange={field.onChange}
                mrp={watchMrp}
                gstPercent={watchGst}
                error={(errors.discount_form_details as any)?.message || (errors.discount_form_details as any)?.discountPercent?.message || (errors.discount_form_details as any)?.buy?.message || (errors.discount_form_details as any)?.bonusProductName?.message || (errors.discount_form_details as any)?.specialPrice?.message}
              />
            )}
          />
        </div>




        {/* Submit */}
        <div className="flex justify-end gap-3 sticky bottom-6 z-[100] p-4 bg-background/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg">
          <Button type="button" variant="outline" onClick={() => router.push("/products")} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isEditing ? "Update Product" : "Add Product"}</Button>
        </div>
      </form>
    </div>
  );
}
