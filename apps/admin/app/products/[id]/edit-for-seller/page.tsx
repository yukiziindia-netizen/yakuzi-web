"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ProductForm, buildProductFormPrefill } from "@yukizi/product-form";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui";
import { apiClient } from "@/lib/apiClient";
import { useAdminProductEditAdapter } from "@/lib/productFormAdapter";

/**
 * Edit a seller's listing on their behalf.
 *
 * The counterpart to "Add item for a seller". Admin could create a listing
 * for a seller but never change one afterwards — a wrong price or a stock
 * count could only be fixed by asking the seller to do it.
 *
 * Same form, same prefill helper and same API path the seller's own edit
 * screen uses, so the rules cannot differ by who is saving. The listing's
 * owner is resolved server-side from the listing itself; nothing here can
 * reassign it.
 */
export default function EditForSellerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const variantParam = useSearchParams().get("variant");
  const adapter = useAdminProductEditAdapter(() => router.push(`/products/${id}`));

  // The same public read the seller's edit screen uses, so the form is
  // prefilled from exactly the shape it was written against.
  const { data: product, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["admin", "product-listing", id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: any }>(`/products/${id}`);
      return data.data;
    },
    enabled: !!id,
    retry: 1,
  });

  // Only a real 404 means it is gone. A 429, a timeout or a dropped
  // connection is temporary, and saying "not found" would send an admin
  // looking for a listing that is fine.
  const reallyMissing = isError
    ? (error as { response?: { status?: number } })?.response?.status === 404
    : !product;

  const prefill = product ? buildProductFormPrefill(product, { productId: id, variantParam }) : null;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/products/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-2xl text-foreground">Edit listing for a seller</h1>
            {product?.seller?.companyName && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Saved as {product.seller.companyName}, exactly as they would.
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading the listing…</p>
          </div>
        ) : !prefill ? (
          <div className="glass-card rounded-2xl p-6 text-center max-w-lg mx-auto mt-16">
            <h2 className="text-xl font-bold text-foreground mb-2">
              {reallyMissing ? "Listing not found" : "Couldn't load this listing"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {reallyMissing
                ? "This listing does not exist or has been removed."
                : "This is usually temporary — the server may be busy or the connection dropped. Nothing has been changed."}
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.push("/products")} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back to products
              </Button>
              {!reallyMissing && (
                <Button onClick={() => refetch()} loading={isRefetching}>Try again</Button>
              )}
            </div>
          </div>
        ) : (
          <ProductForm
            adapter={adapter}
            productId={id}
            defaultValues={prefill.defaultValues as never}
            initialPlatformFees={prefill.initialPlatformFees as never}
            initialOptions={prefill.initialOptions}
            initialVariants={prefill.initialVariants}
            initialCategoryName={prefill.initialCategoryName}
            initialSubcategoryName={prefill.initialSubcategoryName}
            initialMasterId={prefill.initialMasterId}
            activeVariantId={prefill.activeVariantId}
            // Whose shipping charge this listing carries: its owner's if they
            // self-ship, Yukizi's otherwise. Read off the listing's own seller,
            // never chosen here — the API resolves the owner from the listing.
            selfShip={!!product?.seller?.selfShipEnabled}
          />
        )}
      </div>
    </AdminLayout>
  );
}
