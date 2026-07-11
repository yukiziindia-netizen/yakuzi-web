"use client";
import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ProductForm } from "@/components/products/ProductForm";
import { useSellerProduct } from "@/hooks/useSeller";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import { calculatePricing } from "@yukizi/utils";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const variantParam = searchParams.get("variant");
  const productId = params.id as string;
  const { data: product, isLoading, error } = useSellerProduct(productId);
  const productAny = product as any;
  const productVariants = productAny?.variants || [];
  const productListings = productAny?.listings || [];

  let activeVariantId = undefined;
  if (variantParam) {
    activeVariantId = productVariants.find((v: any) => v.name === variantParam || v.options?.name === variantParam)?.id;
  }
  if (!activeVariantId && product && productId !== product.id) {
    activeVariantId = productVariants.find((v: any) => {
      const listing = productListings.find(
        (l: any) => l.variantName === v.name || l.variantName === v.options?.name || l.variantId === v.id || (l.variant && l.variant.id === v.id) || (l.name && typeof l.name === 'string' && typeof v.name === 'string' && l.name.includes(v.name))
      );
      return listing?.id === productId || v.id === productId;
    })?.id || productId;
  }

  const activeVariant = activeVariantId
    ? productVariants.find((v: any) => v.id === activeVariantId)
    : undefined;
  const activeListing = activeVariant
    ? productListings.find((l: any) => l.variantName === activeVariant.name || l.variantName === activeVariant.options?.name)
    : productListings.find((l: any) => l.id === productId);
  const resolvedSku = productAny?.sku || activeVariant?.sku || activeVariant?.options?.sku || activeListing?.sku || productAny?.variant?.sku || "";
  const resolvedSerialNo = productAny?.serialNo || activeVariant?.serialNo || activeVariant?.options?.serialNo || activeListing?.serialNo || productAny?.variant?.serialNo || "";
  const resolvedSpecifications = productAny?.specifications || activeVariant?.specifications || activeVariant?.options?.specifications || activeListing?.specifications || "";

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
                gst_percent: product.gstPercent ?? (product as any).gst ?? 0,
                compare_at_price: (product as any).compareAtPrice || 0,
                is_tax_included: (product as any).masterProductId ? true : ((product as any).isTaxIncluded || false),
                shipping_charges: (product as any).finalShippingPrice !== null && (product as any).finalShippingPrice !== undefined 
                  ? (product as any).finalShippingPrice 
                  : 0,
                sku: resolvedSku,
                serialNo: resolvedSerialNo,
                specifications: resolvedSpecifications,
                delivery_text: (product as any).deliveryText ? String(parseInt(String((product as any).deliveryText).match(/\d+/)?.[0] || "0") || "") : "",
                image_list: Array.isArray((product as any).images) ? (product as any).images.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean) : [],
                custom_extra_fields: (product as any).extraFields || [],
                discount_form_details: (product as any).discountFormDetails || {
                  type: (product as any).discountType ? ({
                    "PTR_DISCOUNT": "ptr_discount",
                    "SAME_PRODUCT_BONUS": "same_product_bonus",
                    "PTR_PLUS_SAME_PRODUCT_BONUS": "ptr_discount_and_same_product_bonus",
                    "DIFFERENT_PRODUCT_BONUS": "different_product_bonus",
                    "PTR_PLUS_DIFFERENT_PRODUCT_BONUS": "ptr_discount_and_different_product_bonus",
                    "SPECIAL_PRICE": "special_price",
                  } as any)[(product as any).discountType] || "none" : "none",
                  ...(product as any).discountMeta,
                  discountPercent: Number((product as any).discount ?? (product as any).discountMeta?.discountPercent ?? 0) ?? undefined
                } as any,
              }} 
              initialPlatformFees={{
                commissionPercent: (product as any).commissionPercent ?? undefined,
                fixedFee: (product as any).fixedFee ?? undefined,
                commissionGstPercent: (product as any).commissionGstPercent ?? undefined,
                fixedFeeGstPercent: (product as any).fixedFeeGstPercent ?? undefined,
                shippingGstPercent: (product as any).shippingGstPercent ?? undefined,
              }}
              initialOptions={((product as any).options && (product as any).options.length > 0) ? (product as any).options : (
                ((product as any).variants && ((product as any).variants.length > 1 || ((product as any).variants.length === 1 && !['Default', product.name].includes((product as any).variants[0].name)))) ? [{
                  id: Math.random().toString(36).substr(2, 9),
                  name: "Variant",
                  values: Array.from(new Set(((product as any).variants).map((v: any) => v.name || v.options?.name).filter(Boolean)))
                }] : []
              )}
              initialVariants={((product as any).variants && ((product as any).variants.length > 1 || ((product as any).variants.length === 1 && !['Default', product.name].includes((product as any).variants[0].name)))) ? ((product as any).variants || []).map((v: any) => {
                const mainGst = product.gstPercent ?? (product as any).gst ?? 0;
                const mainDiscount = (product as any).discountFormDetails?.discountPercent ?? (product as any).discountMeta?.discountPercent ?? (product as any).discount ?? 0;
                
                // Try to find the corresponding listing to extract backend-calculated values
                const listing = (product.listings || []).find((l: any) => l.variantName === v.name || l.variantName === v.options?.name || l.variantId === v.id || (l.variant && l.variant.id === v.id) || (l.name && typeof l.name === 'string' && typeof v.name === 'string' && l.name.includes(v.name)));
                let derivedDiscount;
                
                if (listing) {
                  derivedDiscount = listing.discountMeta?.discountPercent ?? (listing as any).discountPercent ?? (listing as any).discount;
                }

                const vGstRaw = (listing as any)?.gstPercent ?? (listing as any)?.gst ?? v.gstPercent ?? v.options?.gstPercent ?? v.gst ?? v.gstValue;
                const vDiscountRaw = derivedDiscount ?? v.discountPercent ?? v.discount ?? v.options?.discountPercent ?? v.options?.discount ?? v.discountMeta?.discountPercent;

                const vPrice = (listing as any)?.mrp ?? (listing as any)?.price ?? v.price ?? "";
                const vCompareAt = (listing as any)?.compareAtPrice ?? v.compareAtPrice ?? "";

                return {
                  id: v.id || (listing?.id === productId ? productId : Math.random().toString(36).substr(2, 9)),
                  name: v.name,
                  price: vPrice.toString(),
                  compareAtPrice: vCompareAt.toString(),
                  gstPercent: vGstRaw !== undefined && vGstRaw !== null ? vGstRaw.toString() : "",
                  discount: vDiscountRaw !== undefined && vDiscountRaw !== null ? vDiscountRaw.toString() : "",
                  available: ((listing as any)?.stock ?? v.available ?? 0).toString(),
                  image: v.image,
                  sku: (listing as any)?.sku || v.sku || "",
                  serialNo: (listing as any)?.serialNo || v.serialNo || "",
                  shippingCharges: ((listing as any)?.shippingCharges !== undefined && (listing as any)?.shippingCharges !== null) ? (listing as any).shippingCharges.toString() : (v.shippingCharges !== undefined && v.shippingCharges !== null ? v.shippingCharges.toString() : ""),
                  shippingGstPercent: Number((listing as any)?.shippingGstPercent ?? v.shippingGstPercent ?? 0),
                  finalShippingPrice: ((listing as any)?.finalShippingPrice !== undefined && (listing as any)?.finalShippingPrice !== null) ? (listing as any).finalShippingPrice.toString() : (v.finalShippingPrice !== undefined && v.finalShippingPrice !== null ? v.finalShippingPrice.toString() : "")
                };
              }) : []}
              initialCategoryName={typeof (product as any).category === 'object' ? (product as any).category?.name || (product as any).category?.id : (product as any).category}
              initialSubcategoryName={typeof (product as any).subCategory === 'object' ? (product as any).subCategory?.name || (product as any).subCategory?.id : (product as any).subCategory}
              initialMasterId={(product as any).masterProductId || (product as any).id || undefined}
              activeVariantId={activeVariantId}
            />
          )}
        </div>
        </ErrorBoundary>
  );
}
