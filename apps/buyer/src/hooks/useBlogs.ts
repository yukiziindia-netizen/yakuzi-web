'use client';

import { useQuery } from '@tanstack/react-query';
import { getBlogs, getBlogById, getBlogBySlug } from '@yukizi/api-client';

export function useBlogs(
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    tag?: string;
    status?: string;
  },
  options: any = {},
) {
  return useQuery({
    queryKey: ['blogs', params],
    queryFn: () => getBlogs(params),
    ...options,
  });
}

export function useBlogById(id: string) {
  return useQuery({
    queryKey: ['blog', id],
    queryFn: () => getBlogById(id),
    enabled: !!id,
  });
}

export function useBlogBySlug(slug: string, options: any = {}) {
  return useQuery({
    queryKey: ['blog-slug', slug],
    queryFn: () => getBlogBySlug(slug),
    enabled: !!slug,
    ...options,
  });
}
