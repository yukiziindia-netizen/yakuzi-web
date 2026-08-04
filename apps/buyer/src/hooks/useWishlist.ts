'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWishlist, addToWishlist as backendAddToWishlist, removeFromWishlist as backendRemoveFromWishlist, useAuth, api } from '@yukizi/api-client';
import { localWishlist } from '@/lib/local-wishlist';
import { useEffect } from 'react';

export function useWishlist() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleStorage = () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [queryClient]);

  return useQuery({
    queryKey: ['wishlist', isAuthenticated],
    queryFn: async () => {
      const local = localWishlist.get();
      let list = local;

      if (local.items.length === 0 && isAuthenticated) {
        try {
          const backend = await getWishlist();
          if (backend.items.length > 0) {
            list = backend;
          }
        } catch (e) {
          console.error("Failed to fetch backend wishlist", e);
        }
      }

      if (list.items.length > 0) {
        const ids = list.items.map((i: any) => i.productId).filter(Boolean);
        try {
          const res = await api.post('/products/validate-ids', { ids });
          const activeIds = res.data?.data || [];
          const activeItems = list.items.filter((item: any) => activeIds.includes(item.productId));
          if (activeItems.length !== list.items.length) {
            const newList = {
              items: activeItems,
              total: activeItems.length,
            };
            if (list === local) {
              localWishlist.set(newList);
            }
            list = newList;
          }
        } catch (e) {
          console.error("Failed to validate wishlist items", e);
        }
      }

      return list;
    },
    staleTime: 15 * 1000,
    gcTime: 60 * 1000,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productData: any) => {
      return localWishlist.addItem(productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      return localWishlist.removeItem(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
}
