import { z } from 'zod';
import { api } from '../api';

// ─── Schemas ────────────────────────────────────────

export const ReviewSchema = z.object({
  id: z.string(),
  productId: z.string(),
  userId: z.string(),
  userName: z.string().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  createdAt: z.string(),
});

export const ReviewListResponseSchema = z.object({
  data: z.array(ReviewSchema),
  total: z.number(),
  averageRating: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const CreateReviewSchema = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// ─── Types ──────────────────────────────────────────

export type Review = z.infer<typeof ReviewSchema>;
export type ReviewListResponse = z.infer<typeof ReviewListResponseSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

// ─── API Functions ──────────────────────────────────

export async function getProductReviews(
  productId: string,
  params?: { page?: number; limit?: number },
): Promise<ReviewListResponse> {
  const { data } = await api.get(`/reviews/product/${productId}`, { params });
  return ReviewListResponseSchema.parse(data);
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const body = CreateReviewSchema.parse(input);
  const { data } = await api.post('/reviews', body);
  return ReviewSchema.parse(data);
}

export async function updateReview(
  reviewId: string,
  input: Partial<CreateReviewInput>,
): Promise<Review> {
  const { data } = await api.patch(`/reviews/${reviewId}`, input);
  return ReviewSchema.parse(data);
}

export async function deleteReview(reviewId: string): Promise<void> {
  await api.delete(`/reviews/${reviewId}`);
}
