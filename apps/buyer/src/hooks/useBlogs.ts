'use client';

import { useQuery } from '@tanstack/react-query';
import { getBlogs, getBlogById, getBlogBySlug } from '@pharmabag/api-client';

export function useBlogs(params?: {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
}) {
  return useQuery({
    queryKey: ['blogs', params],
    queryFn: () => getBlogs(params),
  });
}

export function useBlogById(id: string) {
  return useQuery({
    queryKey: ['blog', id],
    queryFn: () => getBlogById(id),
    enabled: !!id,
  });
}

export function useBlogBySlug(slug: string) {
  return useQuery({
    queryKey: ['blog-slug', slug],
    queryFn: () => getBlogBySlug(slug),
    enabled: !!slug,
  });
}
