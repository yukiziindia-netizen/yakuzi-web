import { z } from 'zod';
import { api } from '../api';

// ─── Schemas ────────────────────────────────────────

export const ReviewSchema = z.object({
  id: z.string(),
  catalogProductId: z.string(),
  userId: z.string(),
  userName: z.string().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  images: z.array(z.string()).optional(),
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
  catalogProductId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export const ReviewEligibilitySchema = z.object({
  canReview: z.boolean(),
  reason: z.enum(['NOT_PURCHASED', 'ALREADY_REVIEWED']).nullable(),
});

// ─── Types ──────────────────────────────────────────

export type Review = z.infer<typeof ReviewSchema>;
export type ReviewListResponse = z.infer<typeof ReviewListResponseSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type ReviewEligibility = z.infer<typeof ReviewEligibilitySchema>;

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

export async function getReviewEligibility(productId: string): Promise<ReviewEligibility> {
  const { data } = await api.get(`/reviews/eligibility/${productId}`);
  return ReviewEligibilitySchema.parse(data);
}

export interface AdminReviewFilters {
  page?: number;
  limit?: number;
  /** Seller whose LISTING was purchased — not "sellers of this product". */
  sellerId?: string;
  productId?: string;
  userId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  rating?: number;
  search?: string;
}

export async function getAdminReviews(params?: AdminReviewFilters) {
  const { data } = await api.get('/reviews/admin', { params });
  return data;
}

/** Seller-facing filters: no customer dimension by design. */
export interface SellerReviewFilters {
  page?: number;
  limit?: number;
  productId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  rating?: number;
}

export async function getSellerReviews(params?: SellerReviewFilters) {
  const { data } = await api.get('/reviews/seller', { params });
  return data;
}

export async function deleteAdminReview(reviewId: string) {
  const { data } = await api.delete(`/reviews/admin/${reviewId}`);
  return data;
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
