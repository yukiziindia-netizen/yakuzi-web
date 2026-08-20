'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWishlist, addToWishlist as backendAddToWishlist, removeFromWishlist as backendRemoveFromWishlist, useAuth, api } from '@yukizi/api-client';
import { localWishlist } from '@/lib/local-wishlist';
import { track } from '@/lib/analytics/tracker';
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
    // Flip the bookmark icon the instant you click, rather than waiting on the
    // invalidate->refetch round trip — that chain of microtask hops is what
    // made the button feel like it "reacts late".
    onMutate: async (productData: any) => {
      const id = productData?.productId ?? productData?.id;
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      queryClient.setQueriesData({ queryKey: ['wishlist'] }, (old: any) => {
        if (!old || old.items?.some((item: any) => item.productId === id)) return old;
        return { ...old, items: [...(old.items || []), { id: `optimistic-${id}`, productId: id, product: productData }] };
      });
    },
    onSuccess: (_data, productData) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      track('wishlist_add', undefined, productData?.productId ?? productData?.id);
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      return localWishlist.removeItem(productId);
    },
    onMutate: async (productId: string) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      queryClient.setQueriesData({ queryKey: ['wishlist'] }, (old: any) => {
        if (!old) return old;
        return { ...old, items: (old.items || []).filter((item: any) => item.productId !== productId) };
      });
    },
    onSuccess: (_data, productId) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      track('wishlist_remove', undefined, productId);
    },
  });
}
