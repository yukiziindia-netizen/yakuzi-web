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
import { useCreateSellerProduct, useUpdateSellerProduct, useSuggestionSearch, useCategories } from "@/hooks/useSeller";
import { getSellerProductById } from "@/api/seller.api";

type FormValues = ProductFormValues;

export function ProductForm({ 
  defaultValues, 
  productId,
  initialOptions = [],
  initialVariants = [],
  initialCategoryName,
  initialSubcategoryName,
}: { 
  defaultValues?: Partial<FormValues>; 
  productId?: string;
  initialOptions?: any[];
  initialVariants?: any[];
  initialCategoryName?: string;
  initialSubcategoryName?: string;
}) {
  const router = useRouter();
  const createProduct = useCreateSellerProduct();
  const updateProduct = useUpdateSellerProduct();
  const isEditing = !!productId;

  // Suggestion autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const { data: suggestions = [] } = useSuggestionSearch(searchQuery, "master");

  const { register, control, handleSubmit, setValue, getValues, formState: { errors, isSubmitting, isDirty }, watch } = useForm<FormValues>({
    mode: "onChange",
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: defaultValues || {
      product_name: "",
      product_price: 0,
      compare_at_price: 0,
      gst_percent: 12,
      is_tax_included: false,
      unit: "1",
      pack_size: "1",
      company_name: "",
      categories: [],
      sub_categories: [],
      stock: 0,
      min_order_qty: 1,
      max_order_qty: 100,
      delivery_text: "",
      shipping_charges: 0,
      image_list: [],
      custom_extra_fields: [],
      discount_form_details: { type: "none" } as DiscountFormDetails,
    },
  });

  const [options, setOptions] = useState<VariantOption[]>(() => {
    if (initialOptions.length === 0 && initialVariants.length > 0) {
      return [{
        id: Math.random().toString(36).substr(2, 9),
        name: "Variant",
        values: initialVariants.map(v => v.name).filter(Boolean)
      }];
    }
    return initialOptions;
  });
  const [variants, setVariants] = useState<VariantCombination[]>(initialVariants);
  const [mediaItems, setMediaItems] = useState<any[]>([]);

  const { data: allCategories } = useCategories();

  useEffect(() => {
    if (allCategories && initialCategoryName && getValues("categories").length === 0) {
      const cat = allCategories.find((c: any) => c.name === initialCategoryName || c.id === initialCategoryName);
      if (cat) {
        setValue("categories", [cat.id]);
        if (initialSubcategoryName && cat.subcategories) {
          const sub = cat.subcategories.find((s: any) => s.name === initialSubcategoryName || s.id === initialSubcategoryName);
          if (sub) setValue("sub_categories", [sub.id]);
        }
      }
    }
  }, [allCategories, initialCategoryName, initialSubcategoryName, setValue, getValues]);

  const watchMrp = watch("product_price");
  const watchCompareAt = watch("compare_at_price");
  const watchGst = watch("gst_percent") || 0;
  const watchMinMoq = watch("min_order_qty");
  const watchStock = watch("stock");
  const watchMaxMoq = watch("max_order_qty");
  const watchDiscount = watch("discount_form_details");
  const watchShippingCharges = watch("shipping_charges") || 0;
  const watchTaxStatus = watch("is_tax_included") || false;
  const watchCategories = watch("categories");
  const lastMrpRef = useRef<number>(0);

  const selectedCat = watchCategories?.[0] ? allCategories?.find((c: any) => c.id === watchCategories[0]) : null;
  const cat: any = selectedCat;
  
  // Platform fees logic: prioritize selected suggestion fees, then category fees.
  let platformFees: any = undefined;
  if (selectedSuggestion?.commissionPercent !== undefined && selectedSuggestion?.commissionPercent !== null) {
    platformFees = {
      commissionPercent: selectedSuggestion.commissionPercent,
      fixedFee: selectedSuggestion.fixedFee || 0,
      commissionGstPercent: selectedSuggestion.commissionGstPercent || 18,
    };
  } else if (cat) {
    platformFees = {
      commissionPercent: cat.commissionPercent || 0,
      fixedFee: cat.fixedFee || 0,
      commissionGstPercent: cat.commissionGstPercent || 18,
    };
  }

  // Real-time discount calculation when compare_at_price is added/updated
  useEffect(() => {
    if (watchCompareAt && watchMrp && watchMrp > watchCompareAt) {
      const discountPercent = parseFloat((((watchMrp - watchCompareAt) / watchMrp) * 100).toFixed(2));
      setValue("discount_form_details", {
        type: "ptr_discount",
        discountPercent: discountPercent,
      }, { shouldDirty: true, shouldValidate: true });
    }
  }, [watchCompareAt, watchMrp, setValue]);

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
    setSelectedSuggestion(suggestion);
    setValue("product_name", suggestion.productName, { shouldDirty: true });
    setValue("company_name", suggestion.companyName, { shouldDirty: true });
    
    if (suggestion.sku) {
      setValue("sku", suggestion.sku, { shouldDirty: true });
    }
    if (suggestion.specifications) {
      setValue("specifications", suggestion.specifications, { shouldDirty: true });
    }
    
    if (suggestion.mrp !== undefined) {
      setValue("product_price", suggestion.mrp, { shouldDirty: true });
    }
    const compareAt = (suggestion as any).extraFields?.compare_at_price ? Number((suggestion as any).extraFields.compare_at_price) : 0;
    setValue("compare_at_price", compareAt, { shouldDirty: true });
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
      // Fetch the full product to ensure we get all variants, options, and extra fields
      const fullProduct = await getSellerProductById(suggestion.id);
      
      // Sync sku and specifications from the full product (more complete data)
      const resolvedSku = (fullProduct as any)?.sku ?? (suggestion as any).sku ?? "";
      const resolvedSpecs = (fullProduct as any)?.specifications ?? (suggestion as any).specifications ?? "";
      setValue("sku", resolvedSku, { shouldDirty: true });
      setValue("specifications", resolvedSpecs, { shouldDirty: true });

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
          price: v.price?.toString() || v.options?.price?.toString() || "0",
          available: v.available?.toString() || v.options?.available?.toString() || "0",
          image: v.image || v.options?.image,
          sku: v.sku || v.options?.sku || "",
          shippingCharges: v.shippingCharges?.toString() || v.options?.shippingCharges?.toString() || "0"
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
          price: v.price?.toString() || v.options?.price?.toString() || "0",
          available: v.available?.toString() || v.options?.available?.toString() || "0",
          image: v.image || v.options?.image,
          sku: v.sku || v.options?.sku || "",
          shippingCharges: v.shippingCharges?.toString() || v.options?.shippingCharges?.toString() || "0"
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
        const p = calculatePricing(data.product_price, 0, {
          type: data.discount_form_details.type,
          discountPercent: data.discount_form_details.discountPercent,
          buy: data.discount_form_details.buy,
          get: data.discount_form_details.get,
          bonusProductName: data.discount_form_details.bonusProductName,
          specialPrice: data.discount_form_details.specialPrice,
          shippingCharges: data.shipping_charges,
        }, platformFees);
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

      const mergedExtraFields = {
        ...extra_fields,
        ...(data.compare_at_price && { compare_at_price: String(data.compare_at_price) }),
        ...(data.unit && { unit: data.unit }),
        ...(data.pack_size && { pack_size: data.pack_size }),
      };

      const backendPayload: Record<string, any> = {
        name: data.product_name,
        mrp: data.product_price,
        manufacturer: data.company_name,
        ...(data.sku && { sku: data.sku }),
        ...(data.specifications && { specifications: data.specifications }),
        categoryId: data.categories[0],
        ...(data.sub_categories?.length && { subCategoryId: data.sub_categories[0] }),
        stock: data.stock,
        expiryDate: new Date('2099-12-31').toISOString(),
        minimumOrderQuantity: data.min_order_qty,
        maximumOrderQuantity: data.max_order_qty,
        gstPercent: data.gst_percent || 0,
        isTaxIncluded: data.is_tax_included || false,
        shippingCharges: data.shipping_charges || 0,
        ...(data.delivery_text && { deliveryText: `${data.delivery_text} ${Number(data.delivery_text) === 1 ? 'day' : 'days'}` }),
        ...(realImages.length > 0 && { images: realImages }),
        ...(Object.keys(mergedExtraFields).length > 0 && { extraFields: mergedExtraFields }),
        discountType: mappedDiscountType || null,
        discountMeta: Object.keys(discountMeta).length > 0 ? discountMeta : null,
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
              {variants.length === 0 && (
                <Input label="Product SKU" placeholder="e.g. SKU-12345" error={errors.sku?.message} {...register("sku")} disabled={!!selectedMasterId} />
              )}
              <Input label="Product Specification" placeholder="e.g. 500mg, Cotton, etc." error={errors.specifications?.message} {...register("specifications")} disabled={!!selectedMasterId} />
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
                      disabled={isEditing}
                    />
                  )}
                />
              )}
            />
          </div>
        </div>

          {/* Shipping & Delivery */}
          <div className="glass-card rounded-2xl p-6 space-y-4 relative z-[43] transition-opacity duration-300">
            <h2 className="font-semibold text-lg text-foreground border-b border-border/50 pb-2">Shipping & Delivery</h2>
            <div className="grid grid-cols-1 gap-4 pt-2">
              <Input 
                label="Delivery Time (in days)" 
                type="number"
                min={1}
                placeholder="e.g. 3" 
                error={errors.delivery_text?.message} 
                {...register("delivery_text")} 
              />
              {variants.length === 0 && (
                <Input 
                  label="Shipping Charges (₹)" 
                  type="number"
                  min={0}
                  placeholder="0" 
                  error={errors.shipping_charges?.message} 
                  {...register("shipping_charges", { valueAsNumber: true })} 
                />
              )}
            </div>
          </div>

        {/* Pricing */}
        <div className="glass-card rounded-2xl p-6 space-y-4 relative z-[43] transition-opacity duration-300">
          <h2 className="font-semibold text-lg text-foreground border-b border-border/50 pb-2">Pricing</h2>

          {variants.length === 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input 
                  label="Product Price (MRP) *" 
                  type="number" 
                  placeholder="1000"
                  error={errors.product_price?.message} 
                  {...register("product_price", { valueAsNumber: true })} 
                  disabled={!!selectedMasterId}
                />
                <Input 
                  label="Compare at Price (Optional)" 
                  type="number" 
                  placeholder="1200"
                  error={errors.compare_at_price?.message} 
                  {...register("compare_at_price", { valueAsNumber: true })} 
                  disabled={!!selectedMasterId}
                />
              </div>

              <div className="pt-2">
                <Controller
                  name="discount_form_details"
                  control={control}
                  render={({ field }) => (
                    <DiscountSelector 
                      value={field.value} 
                      onChange={field.onChange} 
                      mrp={watchMrp || 0}
                      gstPercent={watchGst || 0}
                      platformFees={platformFees}
                    />
                  )}
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Input 
              label="Charge tax on this product (%)" 
              type="number" 
              placeholder="12"
              error={errors.gst_percent?.message} 
              {...register("gst_percent", { valueAsNumber: true })} 
            />
          </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="block text-[13px] font-semibold text-foreground/80 mb-1">Tax Status</label>
                <Controller
                  name="is_tax_included"
                  control={control}
                  render={({ field }) => (
                    <select
                      className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                      value={field.value ? "include" : "exclude"}
                      onChange={(e) => field.onChange(e.target.value === "include")}
                    >
                      <option value="include">Include (Price includes tax)</option>
                      <option value="exclude">Exclude (Price excludes tax)</option>
                    </select>
                  )}
                />
              </div>
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
            gstPercent={watchGst}
            discountDetails={watchDiscount}
            shippingCharges={watchShippingCharges}
            isTaxIncluded={watchTaxStatus}
            isSuggestedProductSelected={!!selectedMasterId}
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
