"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import toast from "react-hot-toast";
import { useCategories, useSubCategories, useCreateSuggestion, useUpdateSuggestion } from "@/hooks/useAdmin";
import { MediaUploader, MediaItem } from "@/components/ui/media-uploader";
import { VariantBuilder, VariantOption, VariantCombination } from "@/components/ui/variant-builder";

export interface SuggestionFormProps {
  initialData?: any;
  onClose: () => void;
}

export function SuggestionForm({ initialData, onClose }: SuggestionFormProps) {
  const { data: categoriesData } = useCategories();
  const { data: subCatsData } = useSubCategories();
  const createSuggestion = useCreateSuggestion();
  const updateSuggestion = useUpdateSuggestion();

  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories ?? []);
  const subCategories = Array.isArray(subCatsData) ? subCatsData : (subCatsData?.subCategories ?? []);

  // Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    mrp: "",
    price: "",
    gstPercent: "",
    shippingCharges: "0",
    unit: "1",
    packSize: "1",
    minimumOrderQuantity: "1",
    manufacturer: "",
    sku: "",
    specifications: "",
    categoryId: "",
    subCategoryId: "",
    status: "active"
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [options, setOptions] = useState<VariantOption[]>([]);
  const [variants, setVariants] = useState<VariantCombination[]>([]);

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
        shippingCharges: initialData.shippingCharges ? String(initialData.shippingCharges) : "0",
        unit: initialData.unit || "1",
        packSize: initialData.packSize || "1",
        minimumOrderQuantity: initialData.minimumOrderQuantity ? String(initialData.minimumOrderQuantity) : "1",
        manufacturer: initialData.manufacturer || "",
        sku: initialData.sku || "",
        specifications: initialData.specifications || "",
        categoryId: initialData.categoryId || "",
        subCategoryId: initialData.subCategoryId || "",
        status: initialData.isActive === false ? "draft" : "active"
      });

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
          shippingCharges: v.shippingCharges !== undefined ? String(v.shippingCharges) : (v.options?.shippingCharges ? String(v.options.shippingCharges) : "0"),
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

  const handleSave = async () => {
    if (!form.title) return toast.error("Title is required");
    if (!form.categoryId) return toast.error("Category is required");

    try {
      const payload = {
        name: form.title,
        description: form.description,
        mrp: form.mrp !== "" ? Number(form.mrp) : null,
        price: form.price !== "" ? Number(form.price) : null,
        gstPercent: form.gstPercent !== "" ? Number(form.gstPercent) : null,
        shippingCharges: form.shippingCharges !== "" ? Number(form.shippingCharges) : 0,
        unit: form.unit,
        packSize: form.packSize,
        minimumOrderQuantity: form.minimumOrderQuantity !== "" ? Number(form.minimumOrderQuantity) : null,
        manufacturer: form.manufacturer,
        sku: form.sku,
        specifications: form.specifications,
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId || undefined,
        isActive: form.status === "active",
        images: mediaItems.filter(m => !m.isLoading).map(m => m.url),
        options: options.length > 0 ? options.map(o => ({ name: o.name, values: o.values })) : undefined,
        variants: variants.length > 0 ? variants.map(v => ({ 
          name: v.name, 
          sku: v.sku,
          shippingCharges: Number(v.shippingCharges),
          image: v.image,
          images: v.images
        })) : undefined,
      };

      if (initialData?.id) {
        await updateSuggestion.mutateAsync({ id: initialData.id, payload });
        toast.success("Catalog entry updated successfully");
      } else {
        await createSuggestion.mutateAsync(payload);
        toast.success("Catalog entry created successfully");
      }
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
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value, subCategoryId: "" }))}
                className="w-full rounded-xl border border-input bg-background/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all font-medium appearance-none"
              >
                <option value="" disabled>Select category</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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
            </div>

            <div className="pt-2 space-y-4">
              <Input
                label="Manufacturer / Vendor"
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
