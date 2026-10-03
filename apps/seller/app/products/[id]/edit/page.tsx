"use client";
import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ProductForm, buildProductFormPrefill } from "@yukizi/product-form";
import { useSellerProductFormAdapter } from "@/lib/productFormAdapter";
import { useSellerProduct, useSellerProfile } from "@/hooks/useSeller";
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
  const { data: product, isLoading, error, refetch, isRefetching } = useSellerProduct(productId);
  // Only a real 404 means the product doesn't exist. Anything else (429
  // rate-limit, timeout, network) is temporary — telling the seller the
  // product is missing or they lack permission would be wrong.
  const isRealMiss = error ? (error as any)?.response?.status === 404 : !product;
  const adapter = useSellerProductFormAdapter();
  // Self-ship decides whether the shipping field is this seller's to set.
  const { data: profile } = useSellerProfile();
  // The prefill mapping now lives in @yukizi/product-form so the admin's
  // "edit on behalf of a seller" screen opens a listing exactly the way its
  // own seller does. Behaviour is unchanged — the code moved.
  const prefill = product
    ? buildProductFormPrefill(product, { productId, variantParam })
    : null;

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
            isRealMiss ? (
              <div className="text-center py-12 p-6 glass-card rounded-2xl max-w-lg mx-auto mt-20">
                <h2 className="text-xl font-bold text-foreground mb-2">Product not found</h2>
                <p className="text-muted-foreground mb-6">This product does not exist or has been removed.</p>
                <Button onClick={() => router.push("/products")} leftIcon={<ArrowLeft className="h-4 w-4" />}>Go back to Products</Button>
              </div>
            ) : (
              <div className="text-center py-12 p-6 glass-card rounded-2xl max-w-lg mx-auto mt-20">
                <h2 className="text-xl font-bold text-foreground mb-2">Couldn&apos;t load this product</h2>
                <p className="text-muted-foreground mb-6">This is usually temporary — the server may be busy or the connection dropped. Your product is safe; it just couldn&apos;t be fetched right now.</p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={() => router.push("/products")} leftIcon={<ArrowLeft className="h-4 w-4" />}>Back to Products</Button>
                  <Button onClick={() => refetch()} loading={isRefetching}>Try again</Button>
                </div>
              </div>
            )
          ) : (
            <ProductForm
              adapter={adapter}
              productId={productId}
              defaultValues={prefill!.defaultValues as never}
              initialPlatformFees={prefill!.initialPlatformFees as never}
              initialOptions={prefill!.initialOptions}
              initialVariants={prefill!.initialVariants}
              initialCategoryName={prefill!.initialCategoryName}
              initialSubcategoryName={prefill!.initialSubcategoryName}
              initialMasterId={prefill!.initialMasterId}
              activeVariantId={prefill!.activeVariantId}
              // Self-ship sellers set their own delivery charge; for everyone
              // else Yukizi books the courier and the catalogue's charge stands.
              selfShip={!!profile?.selfShipEnabled}
            />
          )}
        </div>
        </ErrorBoundary>
  );
}
