"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Textarea, Select } from "@/components/ui";
import { MediaUploader, MediaItem } from "@/components/ui/media-uploader";
import { VariantBuilder, VariantOption, VariantCombination } from "@/components/ui/variant-builder";
import { useCategories, useSubCategories, useSellers } from "@/hooks/useAdmin";
import { adminCreateProductForSeller } from "@/api/admin.api";
import { productFormSchema } from "@yukizi/utils";
import toast from "react-hot-toast";

export default function AddProductForSellerPage() {
  const router = useRouter();
  const { data: sellersData } = useSellers({ status: "APPROVED", limit: 500 });
  const sellers = Array.isArray(sellersData) ? sellersData : (sellersData?.data ?? []);

  const [sellerId, setSellerId] = useState("");

  const { data: categoriesData } = useCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories ?? []);

  const [form, setForm] = useState({
    name: "",
    manufacturer: "",
    sku: "",
    serialNo: "",
    specifications: "",
    mrp: "",
    gstPercent: "12",
    isTaxIncluded: true,
    discountPercent: "",
    shippingCharges: "0",
    minimumOrderQuantity: "1",
    maximumOrderQuantity: "100",
    stock: "0",
    deliveryText: "",
    categoryId: "",
    subCategoryId: "",
  });

  // Server-side filtered by category, same as productFormSchema's real
  // consumer (ProductForm.tsx) would expect a subcategory scoped to it.
  const { data: subCatsData } = useSubCategories(form.categoryId || undefined);
  const availableSubCategories = Array.isArray(subCatsData) ? subCatsData : (subCatsData?.subCategories ?? []);

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [options, setOptions] = useState<VariantOption[]>([]);
  const [variants, setVariants] = useState<VariantCombination[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!sellerId) return toast.error("Select a seller first");
    if (!form.categoryId) return toast.error("Select a category");
    if (!form.subCategoryId) return toast.error("Select a sub-category");

    // Validate against the SAME schema the seller's own form uses (productFormSchema
    // from @yukizi/utils, confirmed current as of writing this page) — real field-name
    // parity, not a hand-maintained parallel rule set. The seller form's internal field
    // names (product_name, company_name, categories[], etc.) differ from the backend's;
    // we map ours directly to backend names below and only need productFormSchema's
    // cross-field rules (stock/MOQ consistency), so we validate a translated shape
    // rather than fighting the schema's own snake_case field names.
    //
    // Note: unlike an earlier draft of this page, sub_categories is NOT optional in the
    // real schema (`.min(1, 'Select at least one sub-category')`), so the UI above
    // requires a sub-category before this ever runs, and we never submit an empty array.
    const validation = productFormSchema.safeParse({
      product_name: form.name,
      product_price: Number(form.mrp) || 0,
      compare_at_price: 0,
      gst_percent: Number(form.gstPercent) || 0,
      is_tax_included: form.isTaxIncluded,
      unit: "1",
      pack_size: "1",
      company_name: form.manufacturer,
      sku: form.sku || undefined,
      serialNo: form.serialNo || undefined,
      specifications: form.specifications || undefined,
      chemical_combination: undefined,
      categories: [form.categoryId],
      sub_categories: [form.subCategoryId],
      stock: Number(form.stock) || 0,
      min_order_qty: Number(form.minimumOrderQuantity) || 1,
      max_order_qty: Number(form.maximumOrderQuantity) || 1,
      delivery_text: form.deliveryText || undefined,
      shipping_charges: Number(form.shippingCharges) || 0,
      image_list: mediaItems.filter((m) => !m.isLoading).map((m) => m.url),
      custom_extra_fields: [],
      // Mirrors the seller form's real "Discount (%)" input (ProductForm.tsx, the
      // Input registered on "discount_form_details.discountPercent") — on the seller
      // side that direct input leaves `type` as "none" too (only the compare-at-price
      // effect ever sets type to "ptr_discount"); the real onSubmit derives the actual
      // discountType/discountMeta sent to the backend purely from discountPercent > 0
      // (see below), not from this `type` field. So `{ type: "none", discountPercent }`
      // here is not a placeholder — it's the same shape the seller form itself produces
      // for this exact input path.
      discount_form_details: {
        type: "none",
        discountPercent: form.discountPercent ? Number(form.discountPercent) : undefined,
      },
      options,
      variants,
    });
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      toast.error(firstError?.message || "Please check the form for errors");
      return;
    }

    setLoading(true);
    try {
      // Mirrors ProductForm.tsx's real backendPayload construction (the same
      // creation logic the seller's own add-item flow uses), adapted to the fields
      // this admin form actually collects. Two notable, deliberate differences from
      // the seller form, both because this simplified admin flow doesn't fetch
      // per-category platform fees (commissionGstPercent/shippingGstPercent):
      //  - shippingCharges is sent as entered rather than back-calculated from a
      //    tax-exclusive figure when isTaxIncluded is false (that back-calculation
      //    needs platformFees.shippingGstPercent, which isn't available here).
      //  - finalShippingPrice mirrors the same raw value, matching the real
      //    payload's key so downstream code that reads it doesn't see it missing.
      const rawShipping = Number(form.shippingCharges) || 0;

      // Same derivation as ProductForm.tsx's real onSubmit: the backend discountType/
      // discountMeta come straight from discountPercent > 0, not from discount_form_details.type.
      const discountPercentNum = Number(form.discountPercent) || 0;
      const discountType = discountPercentNum > 0 ? "PTR_DISCOUNT" : null;
      const discountMeta = discountPercentNum > 0 ? { discountPercent: discountPercentNum } : null;

      const payload: Record<string, any> = {
        sellerId,
        name: form.name,
        mrp: Number(form.mrp) || 0,
        manufacturer: form.manufacturer,
        ...(form.sku && { sku: form.sku }),
        ...(form.serialNo && { serialNo: form.serialNo }),
        ...(form.specifications && { specifications: form.specifications }),
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId,
        stock: Number(form.stock) || 0,
        expiryDate: new Date('2099-12-31').toISOString(),
        minimumOrderQuantity: Number(form.minimumOrderQuantity) || 1,
        maximumOrderQuantity: Number(form.maximumOrderQuantity) || undefined,
        gstPercent: Number(form.gstPercent) || 0,
        isTaxIncluded: form.isTaxIncluded,
        shippingCharges: rawShipping,
        finalShippingPrice: rawShipping,
        discountType,
        discountMeta,
        ...(form.deliveryText && { deliveryText: `${form.deliveryText} ${Number(form.deliveryText) === 1 ? 'day' : 'days'}` }),
        images: mediaItems.filter((m) => !m.isLoading).map((m) => m.url),
        ...(options.length > 0 && { options: options.map((o) => ({ name: o.name, values: o.values })) }),
        // The admin VariantBuilder (apps/admin/components/ui/variant-builder.tsx) only
        // collects sku/serialNo/shipping/image per combination — unlike the seller app's
        // own variant builder, it has no per-variant price/stock inputs. So, unlike
        // ProductForm.tsx's backendPayload, we can't send per-variant price/available
        // here; that's a pre-existing gap in this shared admin component (the existing
        // apps/admin/app/products/add/page.tsx has the same gap).
        ...(variants.filter((v) => v.name).length > 0 && {
          variants: variants.filter((v) => v.name).map((v) => ({
            name: v.name,
            sku: v.sku || undefined,
            serialNo: v.serialNo || undefined,
            image: v.image,
            shippingCharges: Number(v.shippingCharges) || 0,
            shippingGstPercent: Number(v.shippingGstPercent) || 0,
            finalShippingPrice: Number(v.finalShippingPrice) || 0,
          })),
        }),
      };

      await adminCreateProductForSeller(payload);
      toast.success("Product created for seller");
      router.push("/products");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to create product";
      toast.error(Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <h1 className="font-semibold text-2xl text-foreground">Add item for a seller</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.back()}>Discard</Button>
            <Button onClick={handleSave} loading={loading} leftIcon={<Save className="h-4 w-4" />}>
              Save
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
          <Select
            label="Seller"
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
          >
            <option value="" disabled>Select a seller</option>
            {sellers.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.sellerProfile?.companyName || s.sellerProfile?.businessName || s.phone || s.email || s.id}
              </option>
            ))}
          </Select>
        </div>

        {sellerId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
                <Input
                  label="Product name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <Input
                  label="Manufacturer / Company name"
                  value={form.manufacturer}
                  onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="SKU"
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  />
                  <Input
                    label="Serial No"
                    value={form.serialNo}
                    onChange={(e) => setForm((f) => ({ ...f, serialNo: e.target.value }))}
                  />
                </div>
                <Textarea
                  label="Specifications"
                  value={form.specifications}
                  onChange={(e) => setForm((f) => ({ ...f, specifications: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
                <h3 className="text-base font-semibold text-foreground">Media</h3>
                <MediaUploader items={mediaItems} onChange={setMediaItems} />
              </div>

              <div className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
                <h3 className="text-base font-semibold text-foreground">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="MRP (₹)"
                    type="number"
                    value={form.mrp}
                    onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))}
                  />
                  <Input
                    label="GST (%)"
                    type="number"
                    value={form.gstPercent}
                    onChange={(e) => setForm((f) => ({ ...f, gstPercent: e.target.value }))}
                  />
                  <Input
                    label="Discount (%)"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                    value={form.discountPercent}
                    onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
                  />
                  <Input
                    label="Shipping charges (₹)"
                    type="number"
                    value={form.shippingCharges}
                    onChange={(e) => setForm((f) => ({ ...f, shippingCharges: e.target.value }))}
                  />
                  <div className="flex items-center gap-2 mt-8">
                    <input
                      type="checkbox"
                      id="isTaxIncluded"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={form.isTaxIncluded}
                      onChange={(e) => setForm((f) => ({ ...f, isTaxIncluded: e.target.checked }))}
                    />
                    <label htmlFor="isTaxIncluded" className="text-sm font-medium text-foreground cursor-pointer">
                      Price includes tax
                    </label>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
                <h3 className="text-base font-semibold text-foreground">Inventory</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Stock"
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  />
                  <Input
                    label="Minimum order quantity"
                    type="number"
                    value={form.minimumOrderQuantity}
                    onChange={(e) => setForm((f) => ({ ...f, minimumOrderQuantity: e.target.value }))}
                  />
                  <Input
                    label="Maximum order quantity"
                    type="number"
                    value={form.maximumOrderQuantity}
                    onChange={(e) => setForm((f) => ({ ...f, maximumOrderQuantity: e.target.value }))}
                  />
                </div>
                <Input
                  label="Delivery time (days)"
                  type="number"
                  value={form.deliveryText}
                  onChange={(e) => setForm((f) => ({ ...f, deliveryText: e.target.value }))}
                  placeholder="e.g. 2"
                />
              </div>

              <VariantBuilder
                options={options}
                onChangeOptions={setOptions}
                variants={variants}
                onChangeVariants={setVariants}
                productMedia={mediaItems}
                onAddProductMedia={(items) => setMediaItems((prev) => [...prev, ...items])}
              />
            </div>

            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
                <h3 className="text-base font-semibold text-foreground">Product organization</h3>
                <Select
                  label="Category"
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value, subCategoryId: "" }))}
                  required
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
                <Select
                  label="Sub-category"
                  value={form.subCategoryId}
                  onChange={(e) => setForm((f) => ({ ...f, subCategoryId: e.target.value }))}
                  disabled={!form.categoryId}
                  required
                >
                  <option value="" disabled>Select sub-category</option>
                  {availableSubCategories.map((sc: any) => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
