'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart, useAuth, api } from '@yukizi/api-client';
import { localCart } from '@/lib/local-cart';
import { track } from '@/lib/analytics/tracker';
import { useEffect, useState } from 'react';

export function useCart() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleStorage = () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [queryClient]);

  return useQuery({
    queryKey: ['cart', isAuthenticated],
    queryFn: async () => {
      // Local cart is the strict source of truth for the UI until Checkout.
      // This prevents "ghost items" from the backend magically reappearing after a local deletion.
      const local = localCart.get();
      if (local.items.length === 0) return local;

      const ids = local.items.map((i: any) => i.productId).filter(Boolean);
      try {
        const res = await api.post('/products/validate-ids', { ids });
        const activeIds = res.data?.data || [];
        const activeItems = local.items.filter((item: any) => activeIds.includes(item.productId));
        if (activeItems.length !== local.items.length) {
          const newCart = {
            ...local,
            items: activeItems,
            subtotal: activeItems.reduce((sum, item) => sum + (item.price || item.product?.price || 0) * item.quantity, 0),
          };
          newCart.total = newCart.subtotal;
          localCart.set(newCart);
          return newCart;
        }
      } catch (e) {
        console.error("Failed to validate local cart items", e);
      }

      return local;
    },
    staleTime: 15 * 1000,
    gcTime: 60 * 1000,
  });
}

// The cart query's fetcher hits /products/validate-ids over the network, so
// invalidating alone leaves the UI (e.g. the +/- stepper) waiting on a round
// trip to show a change that already landed in localStorage synchronously.
// Writing the mutation's own return value into the cache updates the UI
// immediately; invalidate still runs after so the network validation catches
// up in the background.
function applyCartUpdate(queryClient: ReturnType<typeof useQueryClient>, cart: any) {
  queryClient.setQueriesData({ queryKey: ['cart'] }, cart);
  queryClient.invalidateQueries({ queryKey: ['cart'] });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantity, replace = false, ...extra }: { productId: string; quantity?: number; replace?: boolean; [key: string]: any }) => {
      return localCart.addItem({
        productId,
        quantity: quantity !== undefined ? quantity : 1,
        ...extra
      } as any, replace);
    },
    onSuccess: (cart, variables) => {
      applyCartUpdate(queryClient, cart);
      track('add_to_cart', { quantity: variables.quantity ?? 1 }, variables.productId);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      return localCart.updateItem(itemId, quantity);
    },
    onSuccess: (cart) => {
      applyCartUpdate(queryClient, cart);
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      return localCart.removeItem(itemId);
    },
    onSuccess: (cart) => {
      applyCartUpdate(queryClient, cart);
      track('remove_from_cart');
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return localCart.clear();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useSyncCart() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) return null;
      const local = localCart.get();
      if (local.items.length === 0) return null;

      // 1. Fetch current backend cart to see what's already there
      const backendCart = await getCart();
      const backendItems = backendCart.items || [];
      const errors: string[] = [];

      // 2. Sync local items to backend
      for (const item of local.items) {
        if (!item.productId) continue;

        try {
          const targetId = (item as any).listingId || item.productId;
          // Check if this product is already in the backend cart
          const existingBackendItem = backendItems.find(
            (bi: any) => bi.productId === targetId || bi.product?.id === targetId || bi.sellerOffer?.id === targetId
          );

          if (existingBackendItem) {
            // If it exists, update it (PATCH)
            // Note: We use the ID of the cart item specifically
            await updateCartItem(existingBackendItem.id, item.quantity);
          } else {
            // If it doesn't exist, add it (POST)
            await addToCart(targetId, item.quantity);
          }
        } catch (e: any) {
          const msg = e?.response?.data?.message || e.message;
          const productName = item.productName || item.name || item.product?.name || 'Product';
          errors.push(`${productName}: ${msg}`);
          console.error(`Failed to sync item ${item.productId}`, e);
        }
      }

      if (errors.length > 0) {
        const uniqueErrors = Array.from(new Set(errors));
        throw new Error(uniqueErrors.join('; '));
      }
      
      return getCart();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });
}
