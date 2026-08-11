"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Image as ImageIcon, UploadCloud } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useCategories, useSubCategories } from "@/hooks/useAdmin";
import { apiClient } from "@/lib/apiClient";
import { MediaUploader, MediaItem } from "@/components/ui/media-uploader";
import { VariantBuilder, VariantOption, VariantCombination } from "@/components/ui/variant-builder";
import {
  ProductSeoFields,
  emptyProductSeoForm,
  productSeoFormHasContent,
  productSeoFormToPayload,
} from "@/components/seo/product-seo-fields";
import { upsertSeoMeta } from "@/api/seo.api";

export default function AddProductPage() {
  const router = useRouter();
  const { data: categoriesData } = useCategories();
  const { data: subCatsData } = useSubCategories();

  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories ?? []);
  const subCategories = Array.isArray(subCatsData) ? subCatsData : (subCatsData?.subCategories ?? []);

  // Form State modeling Shopify
  const [form, setForm] = useState({
    title: "",
    description: "",
    mrp: "",
    price: "",
    gstPercent: "",
    isTaxIncluded: false,
    shippingCharges: "0",
    unit: "1",
    packSize: "1",
    minimumOrderQuantity: "1",
    manufacturer: "",
    sku: "",
    specifications: "",
    chemicalComposition: "",
    categoryId: "",
    subCategoryId: "",
    status: "active",
    isYukiziChoice: false,
    isBestSeller: false,
    isAd: false
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [options, setOptions] = useState<VariantOption[]>([]);
  const [variants, setVariants] = useState<VariantCombination[]>([]);
  const [seoForm, setSeoForm] = useState(emptyProductSeoForm());
  const [loading, setLoading] = useState(false);

  // Filter subcategories based on selected category
  const availableSubCategories = subCategories.filter(
    (sc: any) => sc.categoryId === form.categoryId
  );

  const handleSave = async () => {
    if (!form.title) return toast.error("Title is required");
    if (!form.categoryId) return toast.error("Category is required");

    setLoading(true);
    try {
      const payload = {
        name: form.title,
        description: form.description,
        mrp: form.mrp ? Number(form.mrp) : undefined,
        price: form.price ? Number(form.price) : undefined,
        gstPercent: form.gstPercent ? Number(form.gstPercent) : undefined,
        isTaxIncluded: form.isTaxIncluded,
        shippingCharges: form.shippingCharges ? Number(form.shippingCharges) : 0,
        unit: form.unit,
        packSize: form.packSize,
        minimumOrderQuantity: form.minimumOrderQuantity ? Number(form.minimumOrderQuantity) : undefined,
        manufacturer: form.manufacturer,
        sku: form.sku,
        specifications: form.specifications,
        chemicalComposition: form.chemicalComposition,
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId || undefined,
        isActive: form.status === "active",
        isYukiziChoice: form.isYukiziChoice,
        isBestSeller: form.isBestSeller,
        isAd: form.isAd,
        images: mediaItems.filter(m => !m.isLoading).map(m => m.url),
        options: options.length > 0 ? options.map(o => ({ name: o.name, values: o.values })) : undefined,
        variants: variants.length > 0 ? variants.map((v: any) => ({ 
          name: v.name, 
          price: Number(v.price), 
          available: Number(v.available),
          image: v.image
        })) : undefined,
      };

      // Validate SEO JSON fields BEFORE creating, so a bad value can't leave
      // a product created but its SEO silently dropped.
      const wantsSeo = productSeoFormHasContent(seoForm);
      if (wantsSeo && productSeoFormToPayload(seoForm, "precheck") === null) {
        setLoading(false);
        return;
      }

      const res = await apiClient.post<{ data: any }>("/admin/suggestions", payload);
      const created = res.data?.data;

      // Same record the SEO tab edits: PRODUCT + the new catalog id.
      if (wantsSeo && created?.id) {
        try {
          const seoPayload = productSeoFormToPayload(seoForm, created.id);
          if (seoPayload) await upsertSeoMeta(seoPayload);
          toast.success("Product created with SEO — also editable under the SEO tab");
        } catch {
          toast.error("Product created, but saving its SEO failed — add it from the SEO tab.");
        }
      } else {
        toast.success("Product created successfully");
      }
      router.push("/products");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <h1 className="font-semibold text-2xl text-foreground">Add product</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.back()}>Discard</Button>
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

            {/* Pricing */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
              <h3 className="text-base font-semibold text-foreground">Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Price (₹)"
                  type="number"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                />
                <Input
                  label="Compare at price (MRP) (₹)"
                  type="number"
                  placeholder="0.00"
                  value={form.mrp}
                  onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))}
                />
                <Input
                  label="Charge tax on this product (%)"
                  type="number"
                  placeholder="e.g. 12"
                  value={form.gstPercent}
                  onChange={e => setForm(f => ({ ...f, gstPercent: e.target.value }))}
                />
                <div className="flex items-center gap-2 mt-8">
                  <input
                    type="checkbox"
                    id="isTaxIncluded"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={form.isTaxIncluded}
                    onChange={e => setForm(f => ({ ...f, isTaxIncluded: e.target.checked }))}
                  />
                  <label htmlFor="isTaxIncluded" className="text-sm font-medium text-foreground cursor-pointer">
                    Price includes tax
                  </label>
                </div>
              </div>
            </motion.div>

            {/* Inventory / Shipping */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
              <h3 className="text-base font-semibold text-foreground">Inventory</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Unit (e.g., Tablet, Bottle)"
                  placeholder="Tablet"
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                />
                <Input
                  label="Pack Size (e.g., 10x10)"
                  placeholder="10x10"
                  value={form.packSize}
                  onChange={e => setForm(f => ({ ...f, packSize: e.target.value }))}
                />
                <Input
                  label="Minimum Order Quantity"
                  type="number"
                  placeholder="1"
                  value={form.minimumOrderQuantity}
                  onChange={e => setForm(f => ({ ...f, minimumOrderQuantity: e.target.value }))}
                />
              </div>
            </motion.div>

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

            {/* Search engine optimization — saves to the same record as the SEO tab */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Search engine optimization</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Optional — everything here saves with the product and stays editable under the SEO tab. Blank fields fall back to sensible generated defaults.
                </p>
              </div>
              <ProductSeoFields value={seoForm} onChange={setSeoForm} productName={form.title} />
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

            {/* Badges */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 }} className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
              <h3 className="text-base font-semibold text-foreground">Badges</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isYukiziChoice} onChange={e => setForm(f => ({ ...f, isYukiziChoice: e.target.checked }))} className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary" />
                  <span className="text-sm text-foreground">Yukizi Choice</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isBestSeller} onChange={e => setForm(f => ({ ...f, isBestSeller: e.target.checked }))} className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary" />
                  <span className="text-sm text-foreground">Best Seller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isAd} onChange={e => setForm(f => ({ ...f, isAd: e.target.checked }))} className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary" />
                  <span className="text-sm text-foreground">Ad</span>
                </label>
              </div>
            </motion.div>

            {/* Product Organization */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
              <h3 className="text-base font-semibold text-foreground">Product organization</h3>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Category (Collection)</label>
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
                <Input
                  label="Product SKU"
                  placeholder="e.g. SKU-12345"
                  value={form.sku}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                />
                <Input
                  label="Product Specification"
                  placeholder="e.g. 500mg, Cotton, etc."
                  value={form.specifications}
                  onChange={e => setForm(f => ({ ...f, specifications: e.target.value }))}
                />
                <Input
                  label="Shipping Charges (₹)"
                  type="number"
                  placeholder="0"
                  value={form.shippingCharges}
                  onChange={e => setForm(f => ({ ...f, shippingCharges: e.target.value }))}
                />
              </div>

              <div className="pt-2">
                <Input
                  label="Chemical Composition"
                  placeholder="e.g. Paracetamol 500mg"
                  value={form.chemicalComposition}
                  onChange={e => setForm(f => ({ ...f, chemicalComposition: e.target.value }))}
                />
              </div>

            </motion.div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
