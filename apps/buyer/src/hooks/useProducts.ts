'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, getProductById, getCategories, getManufacturers, getCities, getDiscountDetails, getBrands, getMyWaitlist, addToWaitlist, removeFromWaitlist } from '@yukizi/api-client';

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
    staleTime: 60 * 60 * 1000,
  });
}

export function useProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
  manufacturer?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  isNew?: boolean;
  isDiscounted?: boolean;
  isBestSelling?: boolean;
}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
  });
}

export function useProductById(id: string, options: any = {}) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    enabled: !!id,
    ...options,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
    staleTime: 30 * 60 * 1000, // 30 min — categories rarely change
  });
}

export function useManufacturers() {
  return useQuery({
    queryKey: ['manufacturers'],
    queryFn: getManufacturers,
    staleTime: 30 * 60 * 1000, // 30 min — manufacturers rarely change
  });
}

export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: getCities,
    staleTime: 60 * 60 * 1000, // 1 hour — cities basically never change
  });
}

export function useDiscountDetails(productId: string) {
  return useQuery({
    queryKey: ['discount', productId],
    queryFn: () => getDiscountDetails(productId),
    enabled: !!productId,
  });
}

export function useWaitlist() {
  return useQuery({
    queryKey: ['waitlist'],
    queryFn: getMyWaitlist,
  });
}

export function useAddToWaitlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => addToWaitlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    },
  });
}

export function useRemoveFromWaitlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => removeFromWaitlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    },
  });
}
