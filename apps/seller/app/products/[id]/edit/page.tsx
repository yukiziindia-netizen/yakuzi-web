"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ProductForm } from "@/components/products/ProductForm";
import { useSellerProduct } from "@/hooks/useSeller";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { data: product, isLoading, error } = useSellerProduct(productId);

  return (
        <ErrorBoundary>
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Products
              </Button>
            </div>

            {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Loading product details...</p>
            </div>
          ) : error || !product ? (
            <div className="text-center py-12 p-6 glass-card rounded-2xl max-w-lg mx-auto mt-20">
              <h2 className="text-xl font-bold text-foreground mb-2">Product not found</h2>
              <p className="text-muted-foreground mb-6">The product you are trying to edit does not exist or you lack permission.</p>
              <Button onClick={() => router.push("/products")} leftIcon={<ArrowLeft className="h-4 w-4" />}>Go back to Products</Button>
            </div>
          ) : (
            <ProductForm 
              productId={productId} 
              defaultValues={{
                product_name: product.name,
                product_price: product.mrp ?? product.price,
                company_name: product.manufacturer || "",
                chemical_combination: product.chemicalComposition || "",
                categories: product.categoryId ? [product.categoryId] : [],
                sub_categories: product.subCategoryId ? [product.subCategoryId] : [],
                stock: product.stock || 0,
                min_order_qty: product.minimumOrderQuantity || 1,
                max_order_qty: product.maximumOrderQuantity || 100,
                gst_percent: product.gstPercent || (product as any).gst || 0,
                compare_at_price: (product as any).compareAtPrice || 0,
                is_tax_included: (product as any).isTaxIncluded || false,
                shipping_charges: (product as any).shippingCharges || 0,
                sku: (product as any).sku || (product as any).variant?.sku || "",
                delivery_text: (product as any).deliveryText ? String(parseInt(String((product as any).deliveryText).match(/\d+/)?.[0] || "0") || "") : "",
                image_list: Array.isArray((product as any).images) ? (product as any).images.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean) : [],
                custom_extra_fields: (product as any).extraFields || [],
                discount_form_details: (product as any).discountFormDetails || ((product as any).discountType && ((product as any).discount || (product as any).discountMeta?.discountPercent || (product as any).discountMeta?.specialPrice) ? {
                  type: ({
                    "PTR_DISCOUNT": "ptr_discount",
                    "SAME_PRODUCT_BONUS": "same_product_bonus",
                    "PTR_PLUS_SAME_PRODUCT_BONUS": "ptr_discount_and_same_product_bonus",
                    "DIFFERENT_PRODUCT_BONUS": "different_product_bonus",
                    "PTR_PLUS_DIFFERENT_PRODUCT_BONUS": "ptr_discount_and_different_product_bonus",
                    "SPECIAL_PRICE": "special_price",
                  } as any)[(product as any).discountType] || "none",
                  ...(product as any).discountMeta,
                  discountPercent: (product as any).discount || (product as any).discountMeta?.discountPercent
                } : { type: "none" }) as any,
              }} 
              initialOptions={((product as any).options && (product as any).options.length > 0) ? (product as any).options : (
                ((product as any).variants && (product as any).variants.length > 0) ? [{
                  id: Math.random().toString(36).substr(2, 9),
                  name: "Variant",
                  values: Array.from(new Set(((product as any).variants).map((v: any) => v.name || v.options?.name).filter(Boolean)))
                }] : []
              )}
              initialVariants={((product as any).variants || []).map((v: any) => {
                const mainGst = product.gstPercent || (product as any).gst || 0;
                const mainDiscount = (product as any).discountFormDetails?.discountPercent || (product as any).discountMeta?.discountPercent || (product as any).discount || 0;
                
                // Try to find the corresponding listing to extract backend-calculated values
                const listing = (product.listings || []).find((l: any) => l.variantName === v.name || l.variantName === v.options?.name);
                let derivedDiscount;
                let derivedGst;
                
                if (listing) {
                  derivedDiscount = listing.discountMeta?.discountPercent ?? (listing as any).discountPercent ?? (listing as any).discount;
                  
                  if ((listing as any).basePrice && (listing as any).mrp) {
                    const discountVal = derivedDiscount ?? mainDiscount;
                    const dPrice = discountVal ? (listing as any).mrp * (1 - discountVal / 100) : (listing as any).mrp;
                    if (dPrice > 0) {
                      derivedGst = Math.round((((listing as any).basePrice / dPrice) - 1) * 100);
                    }
                  }
                }

                const vGstRaw = v.gstPercent !== undefined && v.gstPercent !== null ? v.gstPercent : (v.options?.gstPercent !== undefined ? v.options?.gstPercent : (v.gst !== undefined ? v.gst : (v.gstValue !== undefined ? v.gstValue : derivedGst)));
                const vGst = vGstRaw !== undefined && vGstRaw !== null ? vGstRaw : mainGst;
                
                const vDiscountRaw = v.discountPercent !== undefined && v.discountPercent !== null ? v.discountPercent : (v.discount !== undefined && v.discount !== null ? v.discount : (v.options?.discountPercent !== undefined ? v.options?.discountPercent : (v.options?.discount !== undefined ? v.options?.discount : (v.discountMeta?.discountPercent !== undefined ? v.discountMeta?.discountPercent : derivedDiscount))));
                const vDiscount = vDiscountRaw !== undefined && vDiscountRaw !== null ? vDiscountRaw : mainDiscount;

                const vPrice = v.price ?? (listing as any)?.mrp ?? (listing as any)?.price ?? "";
                const vCompareAt = v.compareAtPrice ?? (listing as any)?.compareAtPrice ?? "";

                return {
                  id: v.id || Math.random().toString(36).substr(2, 9),
                  name: v.name,
                  price: vPrice.toString(),
                  compareAtPrice: vCompareAt.toString(),
                  gstPercent: vGst.toString(),
                  discount: vDiscount.toString(),
                  available: (v.available ?? (listing as any)?.stock ?? 0).toString(),
                  image: v.image,
                  sku: v.sku || (listing as any)?.sku || "",
                  serialNo: v.serialNo || (listing as any)?.serialNo || "",
                  shippingCharges: (v.shippingCharges ?? (listing as any)?.shippingCharges ?? 0).toString(),
                  shippingGstPercent: Number(v.shippingGstPercent ?? (listing as any)?.shippingGstPercent ?? 0),
                  finalShippingPrice: (() => {
                    const rawShip = v.shippingCharges ?? (listing as any)?.shippingCharges ?? 0;
                    const rawGst = v.shippingGstPercent ?? (listing as any)?.shippingGstPercent ?? 0;
                    const calculated = Number(rawShip) + (Number(rawShip) * Number(rawGst) / 100);
                    const actualFinal = v.finalShippingPrice ?? (listing as any)?.finalShippingPrice;
                    return (actualFinal !== undefined && actualFinal !== null && String(actualFinal) !== "0")
                      ? actualFinal.toString()
                      : calculated.toString();
                  })()
                };
              })}
              initialCategoryName={typeof (product as any).category === 'object' ? (product as any).category?.name || (product as any).category?.id : (product as any).category}
              initialSubcategoryName={typeof (product as any).subCategory === 'object' ? (product as any).subCategory?.name || (product as any).subCategory?.id : (product as any).subCategory}
              initialMasterId={(product as any).masterProductId || undefined}
              activeVariantId={
                productId !== product.id 
                  ? ((product as any).variants || []).find((v: any) => {
                      const l = (product.listings || []).find((l: any) => l.variantName === v.name || l.variantName === v.options?.name);
                      return l?.id === productId || v.id === productId;
                    })?.id || productId
                  : undefined
              }
            />
          )}
        </div>
        </ErrorBoundary>
  );
}
