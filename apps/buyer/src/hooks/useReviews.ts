'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getReviewEligibility,
  useAuth,
  type CreateReviewInput,
} from '@yukizi/api-client';

export function useProductReviews(productId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['reviews', productId, params],
    queryFn: () => getProductReviews(productId, params),
    enabled: !!productId,
  });
}

// Only meaningful once logged in — a signed-out shopper always hits the
// existing "please log in" message on submit, so there's nothing to check
// here until they're authenticated.
export function useReviewEligibility(productId: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['review-eligibility', productId],
    queryFn: () => getReviewEligibility(productId),
    enabled: !!productId && isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => createReview(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.catalogProductId] });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, input }: { reviewId: string; input: Partial<CreateReviewInput> }) =>
      updateReview(reviewId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
