"use client";
import type { ProductFormAdapter } from "@yukizi/product-form";
import { useCreateSellerProduct, useUpdateSellerProduct } from "@/hooks/useSeller";
import { getCategoriesWithSubs, searchSuggestions, getSellerProductById } from "@/api/seller.api";

// uploadMedia is deliberately omitted: catalog images are authored by the
// admin (Suggestions), and the API discards any `images` a seller sends on
// create/update — so the shared form hides its Product Images section here.
export function useSellerProductFormAdapter(onDone?: () => void): ProductFormAdapter {
  const createProduct = useCreateSellerProduct();
  const updateProduct = useUpdateSellerProduct();
  return {
    createProduct: (payload) => createProduct.mutateAsync(payload),
    updateProduct: (productId, payload) => updateProduct.mutateAsync({ productId, input: payload }),
    getCategories: getCategoriesWithSubs,
    searchSuggestions,
    getSuggestionDetails: getSellerProductById,
    onDone,
  };
}
