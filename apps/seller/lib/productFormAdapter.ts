"use client";
import type { ProductFormAdapter } from "@yukizi/product-form";
import { useCreateSellerProduct, useUpdateSellerProduct } from "@/hooks/useSeller";
import { getCategoriesWithSubs, searchSuggestions, getSellerProductById, uploadProductImage } from "@/api/seller.api";

// uploadProductImage() takes a pre-built FormData and resolves the raw
// response body ({ url } — see /storage/product-image's controller); the
// shared ProductFormAdapter contract just wants a URL string back per file.
async function uploadMedia(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const result = await uploadProductImage(formData);
  return result?.url ?? result;
}

export function useSellerProductFormAdapter(onDone?: () => void): ProductFormAdapter {
  const createProduct = useCreateSellerProduct();
  const updateProduct = useUpdateSellerProduct();
  return {
    createProduct: (payload) => createProduct.mutateAsync(payload),
    updateProduct: (productId, payload) => updateProduct.mutateAsync({ productId, input: payload }),
    getCategories: getCategoriesWithSubs,
    searchSuggestions,
    getSuggestionDetails: getSellerProductById,
    uploadMedia,
    onDone,
  };
}
