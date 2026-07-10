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
import { CategorySelector } from "./CategorySelector";
import { VariantBuilder, VariantOption, VariantCombination } from "../ui/variant-builder";
import { PayoutBreakdownModal } from "./PayoutBreakdownModal";
import type { DiscountFormDetails, Suggestion } from "@yukizi/utils";
import {
  productFormSchema,
  type ProductFormValues,
  VALID_GST_PERCENTAGES,
  calculatePricing
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
  initialMasterId,
  activeVariantId,
  initialPlatformFees,
}: { 
  defaultValues?: Partial<FormValues>; 
  productId?: string;
  initialOptions?: any[];
  initialVariants?: any[];
  initialCategoryName?: string;
  initialSubcategoryName?: string;
  initialMasterId?: string;
  activeVariantId?: string;
  initialPlatformFees?: any;
}) {
  const router = useRouter();
  const createProduct = useCreateSellerProduct();
  const updateProduct = useUpdateSellerProduct();
  const isEditing = !!productId;

  // Suggestion autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(initialMasterId || null);
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
      is_tax_included: true,
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
  let platformFees: any = initialPlatformFees;
  if (selectedSuggestion?.commissionPercent !== undefined && selectedSuggestion?.commissionPercent !== null) {
    platformFees = {
      commissionPercent: selectedSuggestion.commissionPercent,
      fixedFee: selectedSuggestion.fixedFee || 0,
      commissionGstPercent: selectedSuggestion.commissionGstPercent || 18,
      fixedFeeGstPercent: selectedSuggestion.fixedFeeGstPercent || 18,
      shippingGstPercent: selectedSuggestion.shippingGstPercent || 18,
    };
  } else if (allCategories && watchCategories?.[0]) {
    const selectedCategory = allCategories.find((c: any) => c.id === watchCategories[0]);
    if (selectedCategory) {
      let feesSource: any = selectedCategory;
      const watchSubCategories = watch("sub_categories");
      if (watchSubCategories?.[0] && selectedCategory.subcategories) {
        const sub: any = selectedCategory.subcategories.find((s: any) => s.id === watchSubCategories[0]);
        if (sub && sub.commissionPercent !== null && sub.commissionPercent !== undefined) {
          feesSource = sub;
        }
      }
      
      if (feesSource.commissionPercent !== undefined && feesSource.commissionPercent !== null) {
        platformFees = {
          commissionPercent: feesSource.commissionPercent,
          fixedFee: feesSource.fixedFee || 0,
          commissionGstPercent: feesSource.commissionGstPercent || 18,
          fixedFeeGstPercent: feesSource.fixedFeeGstPercent || 18,
          shippingGstPercent: feesSource.shippingGstPercent || 18,
        };
      }
    }
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

  // Sync variants into form data so Zod validation knows if variants exist
  useEffect(() => {
    setValue("variants", variants, { shouldValidate: true });
  }, [variants, setValue]);

    const handleSuggestionSelect = useCallback(async (suggestion: Suggestion) => {
    setSelectedMasterId(suggestion.id);
    setSelectedSuggestion(suggestion);
    setValue("product_name", suggestion.productName, { shouldDirty: true });
    setValue("company_name", suggestion.companyName, { shouldDirty: true });
    
    if (suggestion.sku) {
      setValue("sku", suggestion.sku, { shouldDirty: true });
    }
    if ((suggestion as any).serialNo) {
      setValue("serialNo", (suggestion as any).serialNo, { shouldDirty: true });
    }
    if (suggestion.specifications) {
      setValue("specifications", suggestion.specifications, { shouldDirty: true });
    }
    
    if (suggestion.mrp !== undefined) {
      setValue("product_price", suggestion.mrp, { shouldDirty: true });
    }
    if ((suggestion as any).gstPercent !== undefined) {
      setValue("gst_percent", (suggestion as any).gstPercent, { shouldDirty: true });
    }
    const shippingGst = (suggestion as any).shippingGstPercent ?? 18;
    const baseShip = (suggestion as any).shippingCharges ?? 0;
    const isTaxIncludedForSug = (suggestion as any).isTaxIncluded ?? false;
    const computedPricing = calculatePricing(0, 0, { type: 'none', shippingCharges: baseShip, shippingGstPercent: shippingGst, isTaxIncluded: isTaxIncludedForSug });
    const computedFinalShip = computedPricing.shippingTotal;
    const finalShip = (suggestion as any).finalShippingPrice !== undefined && (suggestion as any).finalShippingPrice !== null 
      ? (suggestion as any).finalShippingPrice 
      : computedFinalShip;
    if (finalShip !== undefined) {
      setValue("shipping_charges", finalShip, { shouldDirty: true });
    }
    if ((suggestion as any).isTaxIncluded !== undefined) {
      setValue("is_tax_included", (suggestion as any).isTaxIncluded, { shouldDirty: true });
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
        const defaultGstP = Number(fullProduct?.shippingGstPercent || suggestion.shippingGstPercent || 0);
        finalVariants = variantsToUse.map((v: any) => {
          const shipCharges = Number(v.shippingCharges?.toString() || v.options?.shippingCharges?.toString() || "0");
          const shipGst = Number(v.shippingGstPercent?.toString() || v.options?.shippingGstPercent?.toString() || defaultGstP);
          const isTaxInc = (fullProduct as any)?.isTaxIncluded ?? (suggestion as any).isTaxIncluded ?? false;
          const computedFinal = calculatePricing(0, 0, { type: 'none', shippingCharges: shipCharges, shippingGstPercent: shipGst, isTaxIncluded: isTaxInc }).shippingTotal;
          const rawFinal = v.finalShippingPrice?.toString() || v.options?.finalShippingPrice?.toString();
          const finalShippingPriceVal = (rawFinal !== undefined && rawFinal !== null && String(rawFinal) !== "0") 
            ? rawFinal 
            : computedFinal.toString();
          
          return {
            id: Math.random().toString(36).substr(2, 9),
            name: v.name,
            price: v.price?.toString() || v.options?.price?.toString() || "0",
            compareAtPrice: v.compareAtPrice?.toString() || v.options?.compareAtPrice?.toString() || "0",
            gstPercent: v.gstPercent?.toString() || v.options?.gstPercent?.toString() || "0",
            discount: v.discount?.toString() ?? v.options?.discount?.toString() ?? "",
            available: v.available?.toString() || v.options?.available?.toString() || "0",
            image: v.image || v.options?.image,
            sku: v.sku || v.options?.sku || "",
            serialNo: v.serialNo || v.options?.serialNo || "",
            shippingCharges: shipCharges.toString(),
            shippingGstPercent: shipGst,
            finalShippingPrice: finalShippingPriceVal
          };
        });
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
        const defaultGstP = Number(suggestion.shippingGstPercent || 0);
        finalVariantsFallback = suggestion.variants.map(v => {
          const shipCharges = Number(v.shippingCharges?.toString() || v.options?.shippingCharges?.toString() || "0");
          const shipGst = Number(v.shippingGstPercent?.toString() || v.options?.shippingGstPercent?.toString() || defaultGstP);
          const isTaxInc = (suggestion as any).isTaxIncluded ?? false;
          const computedFinal = calculatePricing(0, 0, { type: 'none', shippingCharges: shipCharges, shippingGstPercent: shipGst, isTaxIncluded: isTaxInc }).shippingTotal;
          const rawFinal = v.finalShippingPrice?.toString() || v.options?.finalShippingPrice?.toString();
          const finalShippingPriceVal = (rawFinal !== undefined && rawFinal !== null && String(rawFinal) !== "0") 
            ? rawFinal 
            : computedFinal.toString();
            
          return {
            id: Math.random().toString(36).substr(2, 9),
            name: v.name,
            price: v.price?.toString() || v.options?.price?.toString() || "0",
            compareAtPrice: v.compareAtPrice?.toString() || v.options?.compareAtPrice?.toString() || "0",
            gstPercent: v.gstPercent?.toString() ?? v.options?.gstPercent?.toString() ?? "",
            discount: v.discount?.toString() ?? v.options?.discount?.toString() ?? "",
            available: v.available?.toString() || v.options?.available?.toString() || "0",
            image: v.image || v.options?.image,
            sku: v.sku || v.options?.sku || "",
            serialNo: v.serialNo || v.options?.serialNo || "",
            shippingCharges: shipCharges.toString(),
            shippingGstPercent: shipGst,
            finalShippingPrice: finalShippingPriceVal
          };
        });
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

      // Filter out data URLs (base64) — only send real URLs
      const realImages = (data.image_list || []).filter((url) => url.startsWith("http"));

      const discountPercent = data.discount_form_details?.discountPercent;
      let mappedDiscountType = discountPercent && Number(discountPercent) > 0 ? "PTR_DISCOUNT" : undefined;
      let payloadDiscountMeta = discountPercent && Number(discountPercent) > 0 ? { discountPercent: Number(discountPercent) } : null;

      let payloadMrp = data.product_price;
      let payloadStock = data.stock;
      let payloadGst = data.gst_percent || 0;
      let payloadShipping = data.shipping_charges || 0;

      if (activeVariantId && variants.length > 0) {
        const activeV = variants.find(v => v.id === activeVariantId);
        if (activeV) {
          // Since the main inputs are hidden when variants exist, 
          // we must take the edited values from the variant table
          payloadMrp = Number(activeV.price) || payloadMrp;
          payloadStock = Number(activeV.available) || 0;
          payloadGst = Number(activeV.gstPercent) || 0;
          payloadShipping = Number(activeV.shippingCharges) || 0;
          
          if (activeV.discount) {
            mappedDiscountType = "PTR_DISCOUNT";
            payloadDiscountMeta = { discountPercent: Number(activeV.discount) };
          } else {
            mappedDiscountType = undefined;
            payloadDiscountMeta = null;
          }
        }
      }

      const mergedExtraFields = {
        ...extra_fields,
        ...(data.compare_at_price && { compare_at_price: String(data.compare_at_price) }),
        ...(data.unit && { unit: data.unit }),
        ...(data.pack_size && { pack_size: data.pack_size }),
      };

      const backendPayload: Record<string, any> = {
          name: data.product_name,
          mrp: payloadMrp,
          manufacturer: data.company_name,
          ...(data.sku && { sku: data.sku }),
          ...(data.serialNo && { serialNo: data.serialNo }),
          ...(data.specifications && { specifications: data.specifications }),
        categoryId: data.categories[0],
        ...(data.sub_categories?.length && { subCategoryId: data.sub_categories[0] }),
        stock: payloadStock,
        expiryDate: new Date('2099-12-31').toISOString(),
        minimumOrderQuantity: data.min_order_qty,
        maximumOrderQuantity: data.max_order_qty,
        gstPercent: payloadGst,
        isTaxIncluded: true,
        shippingCharges: payloadShipping,
        finalShippingPrice: payloadShipping,
        ...(data.delivery_text && { deliveryText: `${data.delivery_text} ${Number(data.delivery_text) === 1 ? 'day' : 'days'}` }),
        ...(realImages.length > 0 && { images: realImages }),
        ...(Object.keys(mergedExtraFields).length > 0 && { extraFields: mergedExtraFields }),
        discountType: mappedDiscountType || null,
        discountMeta: payloadDiscountMeta,
        ...(selectedMasterId && { masterProductId: selectedMasterId }),
        ...(options.length > 0 && { options: options.map(o => ({ name: o.name, values: o.values })) }),
        ...((variants.filter(v => Number(v.price) > 0 && (!activeVariantId || v.id === activeVariantId))).length > 0 && { 
          variants: variants.filter(v => Number(v.price) > 0 && (!activeVariantId || v.id === activeVariantId)).map(v => ({ 
            id: v.id && v.id.includes('-') ? v.id : undefined,
            name: v.name, 
            variantName: v.name,
            price: Number(v.price), 
            available: Number(v.available),
            image: v.image,
            sku: v.sku,
            serialNo: v.serialNo,
            gstPercent: Number(v.gstPercent) || 0,
            gst: Number(v.gstPercent) || 0,
            discountPercent: Number(v.discount) > 0 ? Number(v.discount) : undefined,
            discount: Number(v.discount) > 0 ? Number(v.discount) : undefined,
            shippingCharges: Number(v.shippingCharges) || 0,
            shippingGstPercent: Number(v.shippingGstPercent) || 0,
            finalShippingPrice: Number(v.finalShippingPrice) || calculatePricing(0, 0, { type: 'none', shippingCharges: Number(v.shippingCharges || 0), shippingGstPercent: Number(v.shippingGstPercent || 0), isTaxIncluded: true }).shippingTotal,
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
      if (isEditing) router.back(); else router.push("/products");
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
          if (isEditing) router.back(); else router.push("/products");
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
                <>
                  <Input label="Product SKU" placeholder="e.g. SKU-12345" error={errors.sku?.message} {...register("sku")} disabled={!!selectedMasterId} />
                  <Input label="Serial No" placeholder="e.g. SN-12345" error={errors.serialNo?.message} {...register("serialNo")} disabled={!!selectedMasterId} />
                </>
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
                <div className="space-y-1">
                  <Input 
                    label="Final Shipping Price (₹)" 
                    type="number"
                    min={0}
                    placeholder="0" 
                    error={errors.shipping_charges?.message} 
                    {...register("shipping_charges", { valueAsNumber: true })} 
                    disabled={!!selectedMasterId}
                  />
                </div>
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
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Discount (%)"
                  type="number"
                  placeholder="0"
                  min={0}
                  max={100}
                  {...register("discount_form_details.discountPercent", { valueAsNumber: true })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <Input
                  label="Current Stock *"
                  type="number"
                  min={0}
                  placeholder="0"
                  error={errors.stock?.message}
                  {...register("stock", { valueAsNumber: true })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <Input 
                    label="Charge tax on this product (%)" 
                    type="number" 
                    placeholder="12"
                    error={errors.gst_percent?.message} 
                    {...register("gst_percent", { valueAsNumber: true })} 
                  />
                </div>
            </>
          )}
        </div>

        {/* Variants */}
        <div className="glass-card rounded-2xl p-6 space-y-4 relative z-[42] transition-opacity duration-300">
          <VariantBuilder 
            options={options} 
            onChangeOptions={setOptions} 
            variants={variants}
            onChangeVariants={setVariants}
            productMedia={mediaItems}
            onAddProductMedia={(items) => {
              const newItems = items.filter(i => !mediaItems.some(existing => existing.url === i.url));
              if (newItems.length > 0) {
                const updatedMedia = [...mediaItems, ...newItems];
                setMediaItems(updatedMedia);
                setValue("image_list", updatedMedia.map(m => m.url), { shouldDirty: true, shouldValidate: true });
              }
            }}
            gstPercent={watchGst}
            discountDetails={watchDiscount}
            shippingCharges={watchShippingCharges}
            isTaxIncluded={watchTaxStatus}
            isSuggestedProductSelected={!!selectedMasterId}
            activeVariantId={activeVariantId}
            isEditMode={isEditing}
          />
        </div>






        {/* Submit */}
        <div className="flex justify-end gap-3 sticky bottom-6 z-[100] p-4 bg-background/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg">
          <Button type="button" variant="info" onClick={() => setShowPayoutModal(true)}>Estimate Payout</Button>
          <Button type="button" variant="outline" onClick={() => isEditing ? router.back() : router.push("/products")} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isEditing ? "Update Product" : "Add Product"}</Button>
        </div>
      </form>
      
      <PayoutBreakdownModal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        productName={getValues("product_name")}
        isTaxIncluded={watchTaxStatus}
        platformFees={platformFees}
        mrp={watchMrp}
        gstPercent={watchGst}
        shippingCharges={watchShippingCharges}
        discountDetails={watchDiscount}
        variants={variants}
      />
    </div>
  );
}


