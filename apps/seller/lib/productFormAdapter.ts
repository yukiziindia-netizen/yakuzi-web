"use client";
import type { ProductFormAdapter } from "@yukizi/product-form";
import { useCreateSellerProduct, useUpdateSellerProduct } from "@/hooks/useSeller";
import { getCategoriesWithSubs, searchSuggestions, getSellerProductById } from "@/api/seller.api";

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
