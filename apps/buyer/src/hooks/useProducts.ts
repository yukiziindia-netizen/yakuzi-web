'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, getProductById, getCategories, getManufacturers, getCities, getDiscountDetails, getBrands, getBanners, getMyWaitlist, addToWaitlist, removeFromWaitlist, useAuth } from '@yukizi/api-client';

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
    staleTime: 60 * 60 * 1000,
  });
}

// The homepage passes the banners it already fetched during SSR so the hero
// image is in the initial HTML instead of waiting for hydration + an XHR.
export function useBanners(initialData?: Awaited<ReturnType<typeof getBanners>>) {
  return useQuery({
    queryKey: ['banners'],
    queryFn: getBanners,
    staleTime: 60 * 60 * 1000,
    ...(initialData !== undefined ? { initialData } : {}),
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
  isYukiziChoice?: boolean;
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
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['waitlist'],
    queryFn: getMyWaitlist,
    enabled: isAuthenticated,
  });
}

export function useAddToWaitlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, email }: { productId: string; email?: string }) =>
      addToWaitlist(productId, email),
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
