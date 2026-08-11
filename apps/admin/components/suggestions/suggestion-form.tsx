"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import toast from "react-hot-toast";
import { useCategories, useSubCategories, useCreateSuggestion, useUpdateSuggestion } from "@/hooks/useAdmin";
import { MediaUploader, MediaItem } from "@/components/ui/media-uploader";
import { VariantBuilder, VariantOption, VariantCombination } from "@/components/ui/variant-builder";
import {
  ProductSeoFields,
  emptyProductSeoForm,
  productSeoFormFromRecord,
  productSeoFormHasContent,
  productSeoFormToPayload,
} from "@/components/seo/product-seo-fields";
import { useSeoMetaOne, useUpsertSeoMeta } from "@/hooks/useSeo";

export interface SuggestionFormProps {
  initialData?: any;
  onClose: () => void;
}

export function SuggestionForm({ initialData, onClose }: SuggestionFormProps) {
  const { data: categoriesData } = useCategories();
  const { data: subCatsData } = useSubCategories();
  const createSuggestion = useCreateSuggestion();
  const updateSuggestion = useUpdateSuggestion();
  const upsertSeo = useUpsertSeoMeta();

  // SEO lives in the same SeoMeta record the SEO tab edits (PRODUCT + catalog
  // id). Editing an existing entry loads that record; creating one writes it
  // right after the product exists.
  const [seoForm, setSeoForm] = useState(emptyProductSeoForm());
  const [seoSeeded, setSeoSeeded] = useState(!initialData?.id);
  const { data: seoRecord, isLoading: seoLoading } = useSeoMetaOne("PRODUCT", initialData?.id);
  useEffect(() => {
    if (initialData?.id && !seoLoading && !seoSeeded) {
      setSeoForm(productSeoFormFromRecord(seoRecord));
      setSeoSeeded(true);
    }
  }, [initialData?.id, seoLoading, seoRecord, seoSeeded]);

  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories ?? []);
  const subCategories = Array.isArray(subCatsData) ? subCatsData : (subCatsData?.subCategories ?? []);

  // Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    mrp: "",
    price: "",
    gstPercent: "",
    shippingCharges: "",
    commissionPercent: "",
    commissionGstPercent: "",
    shippingGstPercent: "",
    unit: "1",
    packSize: "1",
    minimumOrderQuantity: "1",
    manufacturer: "",
    sku: "",
    serialNo: "",
    specifications: "",
    categoryId: "",
    subCategoryId: "",
    status: "active"
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [options, setOptions] = useState<VariantOption[]>([]);
  const [variants, setVariants] = useState<VariantCombination[]>([]);

  // Categories beyond the primary pair. The primary selects above stay the
  // commission/breadcrumb source of truth; these only widen where the
  // product appears.
  const [extraCategoryIds, setExtraCategoryIds] = useState<string[]>([]);
  const [extraSubCategoryIds, setExtraSubCategoryIds] = useState<string[]>([]);
  // Whether the product came in with extras — then we must keep sending the
  // fields so deselecting down to zero actually clears them server-side.
  const [hadExtras, setHadExtras] = useState(false);

  // Prepopulate data when editing
  useEffect(() => {
    if (initialData) {
      console.log('--- initialData inside SuggestionForm ---', initialData);
      
      setForm({
        title: initialData.name || "",
        description: initialData.description || "",
        mrp: initialData.mrp ? String(initialData.mrp) : "",
        price: initialData.price ? String(initialData.price) : "",
        gstPercent: initialData.gstPercent ? String(initialData.gstPercent) : "",
        shippingCharges: initialData.shippingCharges ? String(initialData.shippingCharges) : "",
        commissionPercent: initialData.commissionPercent ? String(initialData.commissionPercent) : "",
        commissionGstPercent: initialData.commissionGstPercent ? String(initialData.commissionGstPercent) : "",
        shippingGstPercent: initialData.shippingGstPercent ? String(initialData.shippingGstPercent) : "",
        unit: initialData.unit || "1",
        packSize: initialData.packSize || "1",
        minimumOrderQuantity: initialData.minimumOrderQuantity ? String(initialData.minimumOrderQuantity) : "1",
        manufacturer: initialData.manufacturer || "",
        sku: initialData.sku || "",
        serialNo: initialData.serialNo || "",
        specifications: initialData.specifications || "",
        categoryId: initialData.categoryId || "",
        subCategoryId: initialData.subCategoryId || "",
        status: initialData.isActive === false ? "draft" : "active"
      });

      // Extra categories / sub-categories
      const incomingExtraCats = Array.isArray(initialData.extraCategories)
        ? initialData.extraCategories.map((c: any) => c.id).filter(Boolean)
        : [];
      const incomingExtraSubs = Array.isArray(initialData.extraSubCategories)
        ? initialData.extraSubCategories.map((sc: any) => sc.id).filter(Boolean)
        : [];
      setExtraCategoryIds(incomingExtraCats);
      setExtraSubCategoryIds(incomingExtraSubs);
      setHadExtras(incomingExtraCats.length > 0 || incomingExtraSubs.length > 0);

      // Images
      if (initialData.images && Array.isArray(initialData.images)) {
        setMediaItems(
          initialData.images.map((img: any) => ({
            id: img.id || Math.random().toString(),
            url: img.url || img,
            type: "image",
            file: null,
            isLoading: false
          }))
        );
      }

      // Options
      let rawOptionsArray = initialData.options;
      if (typeof rawOptionsArray === 'string') {
        try { rawOptionsArray = JSON.parse(rawOptionsArray); } catch(e) {}
      }

      let parsedOptions: any[] = [];
      if (rawOptionsArray && Array.isArray(rawOptionsArray)) {
        parsedOptions = rawOptionsArray.map((o: any) => {
          let optObj = o;
          if (typeof o === 'string') {
            try { optObj = JSON.parse(o); } catch(e) { optObj = { name: o, values: [] }; }
          }
          if (!optObj || typeof optObj !== 'object') optObj = {};

          const name = optObj.name || optObj.title || optObj.key || optObj.attribute || "";
          let rawValues = optObj.values || optObj.options || optObj.choices || optObj.value || optObj.list;
          
          let parsedValues = [];
          if (Array.isArray(rawValues)) {
            parsedValues = rawValues;
          } else if (typeof rawValues === 'string') {
            try { 
              let parsed = JSON.parse(rawValues); 
              if (Array.isArray(parsed)) parsedValues = parsed;
              else parsedValues = rawValues.split(',').map((v: string) => v.trim());
            } catch (e) {
              parsedValues = rawValues.split(',').map((v: string) => v.trim());
            }
          }
          
          if (Array.isArray(parsedValues)) {
            parsedValues = parsedValues.map(v => {
              if (typeof v === 'string') return v;
              if (v && typeof v === 'object') return v.value || v.name || v.val || v.title || v.option || "";
              return String(v);
            }).filter(Boolean);
          } else {
            parsedValues = [];
          }
          
          return { id: optObj.id || Math.random().toString(36).substring(7), name: name, values: parsedValues };
        }).filter(o => o.name && o.values.length > 0); // Filter out invalid options like []
      }

      // Variants
      const incomingVariants = initialData.variants || initialData.productVariants;
      let parsedVariants: any[] = [];
      if (incomingVariants && Array.isArray(incomingVariants)) {
        parsedVariants = incomingVariants.map((v: any) => ({
          id: v.id || Math.random().toString(36).substring(7),
          name: v.name,
          sku: v.sku !== undefined ? String(v.sku) : (v.options?.sku ? String(v.options.sku) : ""),
          serialNo: v.serialNo !== undefined ? String(v.serialNo) : (v.options?.serialNo ? String(v.options.serialNo) : ""),
          shippingCharges: v.shippingCharges !== undefined ? String(v.shippingCharges) : (v.options?.shippingCharges ? String(v.options.shippingCharges) : "0"),
          finalShippingPrice: v.finalShippingPrice !== undefined ? String(v.finalShippingPrice) : (v.options?.finalShippingPrice ? String(v.options.finalShippingPrice) : undefined),
          shippingGstPercent: v.shippingGstPercent !== undefined && v.shippingGstPercent !== null ? String(v.shippingGstPercent) : (v.options?.shippingGstPercent !== undefined && v.options?.shippingGstPercent !== null ? String(v.options.shippingGstPercent) : (initialData.shippingGstPercent !== undefined && initialData.shippingGstPercent !== null ? String(initialData.shippingGstPercent) : "")),
          image: v.image || v.options?.image || undefined
        }));
        setVariants(parsedVariants);
      }

      // If options is empty but we have variants, reconstruct options to prevent VariantBuilder from clearing variants!
      if (parsedOptions.length === 0 && parsedVariants.length > 0) {
        parsedOptions = [{
          id: Math.random().toString(36).substring(7),
          name: "Variant",
          values: parsedVariants.map(v => v.name).filter(Boolean)
        }];
      }
      setOptions(parsedOptions);
    }
  }, [initialData]);

  // Filter subcategories based on selected category
  const availableSubCategories = subCategories.filter(
    (sc: any) => sc.categoryId === form.categoryId
  );

  // Every category the product belongs to (primary + extras); extra
  // sub-categories may come from any of them.
  const selectedCategoryIds = [form.categoryId, ...extraCategoryIds].filter(Boolean);
  const extraCategoryOptions = categories.filter(
    (c: any) => c.id !== form.categoryId && !extraCategoryIds.includes(c.id)
  );
  const extraSubCategoryOptions = subCategories.filter(
    (sc: any) =>
      selectedCategoryIds.includes(sc.categoryId) &&
      sc.id !== form.subCategoryId &&
      !extraSubCategoryIds.includes(sc.id)
  );
  const categoryName = (id: string) => categories.find((c: any) => c.id === id)?.name || id;
  const subCategoryLabel = (id: string) => {
    const sc = subCategories.find((s: any) => s.id === id);
    return sc ? `${sc.name} (${categoryName(sc.categoryId)})` : id;
  };

  const handlePrimaryCategoryChange = (newCategoryId: string) => {
    setForm(f => ({ ...f, categoryId: newCategoryId, subCategoryId: "" }));
    // The new primary cannot also be an extra, and extra sub-categories must
    // still belong to one of the selected categories.
    const nextExtraCats = extraCategoryIds.filter(id => id !== newCategoryId);
    const nextSelected = [newCategoryId, ...nextExtraCats];
    setExtraCategoryIds(nextExtraCats);
    setExtraSubCategoryIds(prev =>
      prev.filter(id => {
        const sc = subCategories.find((s: any) => s.id === id);
        return sc && nextSelected.includes(sc.categoryId);
      })
    );
  };

  const removeExtraCategory = (id: string) => {
    const nextExtraCats = extraCategoryIds.filter(x => x !== id);
    const nextSelected = [form.categoryId, ...nextExtraCats];
    setExtraCategoryIds(nextExtraCats);
    setExtraSubCategoryIds(prev =>
      prev.filter(sid => {
        const sc = subCategories.find((s: any) => s.id === sid);
        return sc && nextSelected.includes(sc.categoryId);
      })
    );
  };

  const handleSave = async () => {
    if (!form.title) return toast.error("Title is required");
    if (!form.categoryId) return toast.error("Category is required");
    if (!form.manufacturer) return toast.error("Company / Manufacturer is required");

    try {
      const payload = {
        name: form.title,
        description: form.description,
        mrp: form.mrp !== "" ? Number(form.mrp) : null,
        price: form.price !== "" ? Number(form.price) : null,
        gstPercent: form.gstPercent !== "" ? Number(form.gstPercent) : null,
        shippingCharges: form.shippingCharges !== "" ? Number(form.shippingCharges) : 0,
        commissionPercent: form.commissionPercent !== "" ? Number(form.commissionPercent) : null,
        commissionGstPercent: form.commissionGstPercent !== "" ? Number(form.commissionGstPercent) : null,
        shippingGstPercent: form.shippingGstPercent !== "" ? Number(form.shippingGstPercent) : null,
        unit: form.unit,
        packSize: form.packSize,
        minimumOrderQuantity: form.minimumOrderQuantity !== "" ? Number(form.minimumOrderQuantity) : null,
        manufacturer: form.manufacturer,
        sku: form.sku,
        serialNo: form.serialNo,
        specifications: form.specifications,
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId || undefined,
        isActive: form.status === "active",
        images: mediaItems.filter(m => !m.isLoading).map(m => m.url),
        options: options.length > 0 ? options.map(o => ({ name: o.name, values: o.values })) : undefined,
        variants: variants.length > 0 ? variants.map(v => ({
          name: v.name,
          sku: v.sku,
          serialNo: v.serialNo,
          shippingCharges: Number(v.shippingCharges),
          finalShippingPrice: v.finalShippingPrice !== "" && v.finalShippingPrice !== undefined ? Number(v.finalShippingPrice) : undefined,
          shippingGstPercent: v.shippingGstPercent !== "" ? Number(v.shippingGstPercent) : null,
          image: v.image,
          images: v.images
        })) : undefined,
        // Only sent when extras are (or were) in play: the live API rejects
        // unknown fields (forbidNonWhitelisted), so a build deployed ahead of
        // the API change must not send them on plain saves. When the product
        // had extras, keep sending so clearing the last chip really clears.
        ...(extraCategoryIds.length > 0 || extraSubCategoryIds.length > 0 || hadExtras
          ? { extraCategoryIds, extraSubCategoryIds }
          : {}),
      };

      // Validate SEO JSON before touching the product, so a typo can't leave
      // a product saved with its SEO silently dropped.
      const wantsSeo = productSeoFormHasContent(seoForm) || !!seoRecord;
      if (wantsSeo && productSeoFormToPayload(seoForm, "precheck") === null) return;

      let catalogId: string | undefined = initialData?.id;
      if (initialData?.id) {
        await updateSuggestion.mutateAsync({ id: initialData.id, payload });
      } else {
        const created = await createSuggestion.mutateAsync(payload);
        catalogId = created?.id;
      }

      let seoNote = "";
      if (wantsSeo && catalogId) {
        try {
          const seoPayload = productSeoFormToPayload(seoForm, catalogId);
          if (seoPayload) await upsertSeo.mutateAsync(seoPayload);
          seoNote = " with SEO (also editable under the SEO tab)";
        } catch {
          toast.error("Product saved, but its SEO failed — finish it from the SEO tab.");
        }
      }
      toast.success(initialData?.id ? `Catalog entry updated${seoNote}` : `Catalog entry created${seoNote}`);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (initialData?.id ? "Failed to update" : "Failed to create"));
    }
  };

  const loading = createSuggestion.isPending || updateSuggestion.isPending;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <h1 className="font-semibold text-2xl text-foreground">
            {initialData ? "Edit product" : "Add product"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Discard</Button>
          <Button onClick={handleSave} loading={loading} leftIcon={<Save className="h-4 w-4" />}>
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Title & Description */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
            <Input
              label="Title"
              placeholder="Short sleeve t-shirt"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
            <Textarea
              label="Description"
              placeholder="Product description..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={6}
            />
          </motion.div>

          {/* Media */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Media</h3>
            <MediaUploader items={mediaItems} onChange={setMediaItems} />
          </motion.div>

          {/* Pricing and Inventory sections removed from master catalog */}

          {/* Variants */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <VariantBuilder
              options={options}
              onChangeOptions={setOptions}
              variants={variants}
              onChangeVariants={setVariants}
              productMedia={mediaItems}
              onAddProductMedia={(items) => setMediaItems(prev => [...prev, ...items])}
            />
          </motion.div>

          {/* Search engine optimization — same record as the SEO tab */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Search engine optimization</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Optional — saves with the product and stays editable under the SEO tab. Blank fields fall back to generated defaults.
              </p>
            </div>
            {!seoSeeded ? (
              <p className="text-sm text-muted-foreground">Loading SEO…</p>
            ) : (
              <ProductSeoFields value={seoForm} onChange={setSeoForm} productName={form.title} />
            )}
          </motion.div>

        </div>

        {/* Sidebar (Right Column) */}
        <div className="space-y-6">
          
          {/* Status */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Status</h3>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full rounded-xl border border-input bg-background/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all font-medium appearance-none"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
            <p className="text-xs text-muted-foreground mt-2">
              This product will be hidden from all sales channels if set to Draft.
            </p>
          </motion.div>

          {/* Product Organization */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Product organization</h3>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Category</label>
              <select
                value={form.categoryId}
                onChange={e => handlePrimaryCategoryChange(e.target.value)}
                className="w-full rounded-xl border border-input bg-background/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all font-medium appearance-none"
              >
                <option value="" disabled>Select category</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {extraCategoryIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {extraCategoryIds.map(id => (
                    <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
                      {categoryName(id)}
                      <button
                        type="button"
                        aria-label={`Remove ${categoryName(id)}`}
                        onClick={() => removeExtraCategory(id)}
                        className="hover:text-primary/60 transition-colors leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {form.categoryId && extraCategoryOptions.length > 0 && (
                <select
                  value=""
                  onChange={e => { if (e.target.value) setExtraCategoryIds(prev => [...prev, e.target.value]); }}
                  className="w-full rounded-xl border border-dashed border-input bg-background/30 px-3 py-2 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none"
                >
                  <option value="">+ Add another category</option>
                  {extraCategoryOptions.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Sub-Category</label>
              <select
                value={form.subCategoryId}
                onChange={e => setForm(f => ({ ...f, subCategoryId: e.target.value }))}
                className="w-full rounded-xl border border-input bg-background/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all font-medium appearance-none"
                disabled={!form.categoryId || availableSubCategories.length === 0}
              >
                <option value="">None</option>
                {availableSubCategories.map((sc: any) => (
                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                ))}
              </select>
              {extraSubCategoryIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {extraSubCategoryIds.map(id => (
                    <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
                      {subCategoryLabel(id)}
                      <button
                        type="button"
                        aria-label={`Remove ${subCategoryLabel(id)}`}
                        onClick={() => setExtraSubCategoryIds(prev => prev.filter(x => x !== id))}
                        className="hover:text-primary/60 transition-colors leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {selectedCategoryIds.length > 0 && extraSubCategoryOptions.length > 0 && (
                <select
                  value=""
                  onChange={e => { if (e.target.value) setExtraSubCategoryIds(prev => [...prev, e.target.value]); }}
                  className="w-full rounded-xl border border-dashed border-input bg-background/30 px-3 py-2 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none"
                >
                  <option value="">+ Add another sub-category</option>
                  {extraSubCategoryOptions.map((sc: any) => (
                    <option key={sc.id} value={sc.id}>{sc.name} ({categoryName(sc.categoryId)})</option>
                  ))}
                </select>
              )}
            </div>

              {/* Platform Fees */}
                <div className="pt-6 mt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Platform Fees</h3>
                  <div className="grid grid-cols-1 gap-4 items-end">
                    <Input
                      type="number"
                      label="Commission (%)"
                      placeholder="e.g. 5"
                      value={form.commissionPercent}
                      onChange={e => setForm(f => ({ ...f, commissionPercent: e.target.value }))}
                    />
                  </div>
                </div>

              {/* GST on Platform Fees */}
                <div className="pt-6 mt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">GST on Platform Fees</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <Input
                      type="number"
                      label="Commission GST (%)"
                      placeholder="e.g. 18"
                      value={form.commissionGstPercent}
                      onChange={e => setForm(f => ({ ...f, commissionGstPercent: e.target.value }))}
                    />
                    {variants.length === 0 && (
                      <Input
                        type="number"
                        label="Shipping GST (%)"
                        placeholder="e.g. 18"
                        value={form.shippingGstPercent}
                        onChange={e => setForm(f => ({ ...f, shippingGstPercent: e.target.value }))}
                      />
                    )}
                  </div>
                </div>  

            <div className="pt-6 mt-6 border-t border-gray-100 space-y-4">
              <Input
                label="Company / Manufacturer *"
                placeholder="e.g. Cipla"
                value={form.manufacturer}
                onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))}
              />
              {variants.length === 0 && (
                <Input
                  label="Product SKU"
                  placeholder="e.g. SKU-12345"
                  value={form.sku}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                />
              )}
              {variants.length === 0 && (
                <Input
                  label="Serial No"
                  placeholder="e.g. SN-12345"
                  value={form.serialNo}
                  onChange={e => setForm(f => ({ ...f, serialNo: e.target.value }))}
                />
              )}
              <Textarea
                label="Product Specification"
                placeholder="e.g. 500mg, Cotton, etc. (press Enter for new lines)"
                value={form.specifications}
                onChange={e => setForm(f => ({ ...f, specifications: e.target.value }))}
                rows={4}
              />
              {variants.length === 0 && (
                <Input
                  label="Shipping Charges (₹)"
                  type="number"
                  placeholder="0"
                  value={form.shippingCharges}
                  onChange={e => setForm(f => ({ ...f, shippingCharges: e.target.value }))}
                />
              )}
            </div>

          </motion.div>

        </div>
      </div>

      {/* Bottom Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
        <Button variant="ghost" onClick={onClose} disabled={loading}>Discard</Button>
        <Button onClick={handleSave} loading={loading} leftIcon={<Save className="h-4 w-4" />}>
          Save
        </Button>
      </div>
    </div>
  );
}
