'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminReviews, deleteAdminReview } from '@yukizi/api-client';

export function useAdminReviews(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin-reviews', params],
    queryFn: () => getAdminReviews(params),
  });
}

export function useDeleteAdminReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => deleteAdminReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });
}
