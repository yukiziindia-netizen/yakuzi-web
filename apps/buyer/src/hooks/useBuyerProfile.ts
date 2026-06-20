'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBuyerProfile,
  createBuyerProfile,
  updateBuyerProfile,
  verifyPanGst,
  getBuyerInvoices,
  type CreateBuyerProfileInput,
  type UpdateBuyerProfileInput,
  useAuth,
} from '@yukizi/api-client';

export function useBuyerProfile() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['buyerProfile'],
    queryFn: getBuyerProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 min — profile changes rarely during a session
  });
}

export function useCreateBuyerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBuyerProfileInput) => createBuyerProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerProfile'] });
    },
  });
}

export function useUpdateBuyerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBuyerProfileInput) => updateBuyerProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerProfile'] });
    },
  });
}

export function useVerifyPanGst() {
  return useMutation({
    mutationFn: (params: { type: 'GST' | 'PAN'; value: string }) => verifyPanGst(params),
  });
}

export function useBuyerInvoices(params?: { page?: number; limit?: number }) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['buyerInvoices', params],
    queryFn: () => getBuyerInvoices(params),
    enabled: isAuthenticated,
  });
}
