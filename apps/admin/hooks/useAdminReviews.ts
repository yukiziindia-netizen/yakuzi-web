'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminReviews, deleteAdminReview, type AdminReviewFilters } from '@yukizi/api-client';

export function useAdminReviews(params?: AdminReviewFilters) {
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
