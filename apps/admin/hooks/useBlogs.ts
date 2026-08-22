"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminBlogPosts, getAdminBlogPost, createAdminBlogPost, updateAdminBlogPost,
  updateAdminBlogPostStatus, deleteAdminBlogPost,
  getBlogAuthors, createBlogAuthor,
  getAdminBlogCategories, createAdminBlogCategory,
  type BlogListQuery, type UpsertBlogPostPayload,
} from "@/api/blogs.api";

const KEY = ["admin", "blogs"] as const;

export function useAdminBlogPosts(params: BlogListQuery = {}) {
  return useQuery({ queryKey: [...KEY, "list", params], queryFn: () => getAdminBlogPosts(params), staleTime: 30_000 });
}

export function useAdminBlogPost(id: string | undefined) {
  return useQuery({ queryKey: [...KEY, "one", id], queryFn: () => getAdminBlogPost(id as string), enabled: !!id });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertBlogPostPayload) => createAdminBlogPost(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UpsertBlogPostPayload> }) => updateAdminBlogPost(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateBlogPostStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "DRAFT" | "PUBLISHED" }) => updateAdminBlogPostStatus(id, status),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminBlogPost(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useBlogAuthors() {
  return useQuery({ queryKey: [...KEY, "authors"], queryFn: getBlogAuthors, staleTime: 60_000 });
}

export function useCreateBlogAuthor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBlogAuthor,
    onSuccess: () => void qc.invalidateQueries({ queryKey: [...KEY, "authors"] }),
  });
}

export function useAdminBlogCategories() {
  return useQuery({ queryKey: [...KEY, "categories"], queryFn: getAdminBlogCategories, staleTime: 60_000 });
}

export function useCreateBlogCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdminBlogCategory,
    onSuccess: () => void qc.invalidateQueries({ queryKey: [...KEY, "categories"] }),
  });
}
