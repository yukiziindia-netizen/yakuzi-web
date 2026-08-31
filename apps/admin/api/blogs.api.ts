import { apiClient } from "@/lib/apiClient";
import { seoRenameFile } from "@/lib/seo-image";

// Mirrors the yakuzi-api BlogAdminController (/admin/blogs). Kept separate
// from the shared @yukizi/api-client blogs module (used by the buyer app's
// public reads) so admin auth/interceptors are used consistently.

export interface BlogAuthor {
  id: string;
  name: string;
  bio?: string | null;
  avatar?: string | null;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  featuredImage?: string | null;
  images: string[];
  authorId: string;
  categoryId: string | null;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords: string[];
  canonicalUrl?: string | null;
  ogImage?: string | null;
  readingTime: number;
  views: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: BlogAuthor;
  category?: BlogCategory | null;
}

export interface UpsertBlogPostPayload {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  images?: string[];
  authorId: string;
  categoryId: string;
  tags?: string[];
  status?: "DRAFT" | "PUBLISHED";
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

export interface BlogListQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  tag?: string;
  status?: "DRAFT" | "PUBLISHED";
}

export interface BlogListResult {
  items: BlogPost[];
  total: number;
  page: number;
  limit: number;
}

function normalizeList(body: any): BlogListResult {
  const raw = body?.data ?? body;
  if (Array.isArray(raw)) return { items: raw, total: raw.length, page: 1, limit: raw.length || 20 };
  return {
    items: raw?.items ?? raw?.data ?? [],
    total: raw?.total ?? (raw?.items ?? raw?.data ?? []).length,
    page: raw?.page ?? 1,
    limit: raw?.limit ?? 20,
  };
}

// ─── Posts ───────────────────────────────────────────

export async function getAdminBlogPosts(params: BlogListQuery = {}): Promise<BlogListResult> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") qs.set(k, String(v)); });
  const { data } = await apiClient.get(`/admin/blogs?${qs}`);
  return normalizeList(data);
}

export async function getAdminBlogPost(id: string): Promise<BlogPost> {
  const { data } = await apiClient.get(`/admin/blogs/${id}`);
  return data.data ?? data;
}

export async function createAdminBlogPost(payload: UpsertBlogPostPayload): Promise<BlogPost> {
  const { data } = await apiClient.post("/admin/blogs", payload);
  return data.data ?? data;
}

export async function updateAdminBlogPost(
  id: string,
  // createRedirect: 301 the old URL to the new one on slug change (update-only
  // field — the API strips it before persisting).
  payload: Partial<UpsertBlogPostPayload> & { createRedirect?: boolean },
): Promise<BlogPost> {
  const { data } = await apiClient.put(`/admin/blogs/${id}`, payload);
  return data.data ?? data;
}

export async function updateAdminBlogPostStatus(id: string, status: "DRAFT" | "PUBLISHED"): Promise<BlogPost> {
  const { data } = await apiClient.patch(`/admin/blogs/${id}/status`, { status });
  return data.data ?? data;
}

export async function deleteAdminBlogPost(id: string): Promise<void> {
  await apiClient.delete(`/admin/blogs/${id}`);
}

// ─── Authors ─────────────────────────────────────────

export async function getBlogAuthors(): Promise<BlogAuthor[]> {
  const { data } = await apiClient.get("/admin/blogs/authors");
  const body = data.data ?? data;
  return Array.isArray(body) ? body : [];
}

export async function createBlogAuthor(payload: { name: string; bio?: string; avatar?: string }): Promise<BlogAuthor> {
  const { data } = await apiClient.post("/admin/blogs/authors", payload);
  return data.data ?? data;
}

// ─── Categories ──────────────────────────────────────

export async function getAdminBlogCategories(): Promise<BlogCategory[]> {
  const { data } = await apiClient.get("/admin/blogs/categories");
  const body = data.data ?? data;
  return Array.isArray(body) ? body : [];
}

export async function createAdminBlogCategory(payload: { name: string; slug?: string }): Promise<BlogCategory> {
  const { data } = await apiClient.post("/admin/blogs/categories", payload);
  return data.data ?? data;
}

// ─── Image upload ────────────────────────────────────

export async function uploadBlogImage(file: File, nameHint?: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", seoRenameFile(file, nameHint));
  const { data } = await apiClient.post("/storage/blog-image", formData);
  return data.data.url;
}
