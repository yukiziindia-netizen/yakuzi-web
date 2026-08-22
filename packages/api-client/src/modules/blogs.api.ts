import { api } from '../api';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: any;
  featuredImage?: string;
  coverImage?: string; // Alias for buyer app compatibility
  images?: string[];
  authorId: string;
  categoryId: string;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  views?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  author?: {
    id?: string;
    name: string;
    avatar?: string;
    bio?: string;
  };
  category?: {
    id?: string;
    name: string;
    slug: string;
  };
}

export interface BlogListResponse {
  data: BlogPost[];
  total: number;
}

export interface BlogAuthor {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface UpsertBlogPostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content: any;
  featuredImage?: string;
  images?: string[];
  authorId: string;
  categoryId: string;
  tags?: string[];
  status?: 'DRAFT' | 'PUBLISHED';
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

export async function getBlogs(params?: { categoryId?: string; status?: string; page?: number; limit?: number; search?: string }): Promise<BlogListResponse> {
  const { data } = await api.get('/blog/posts', { params });
  return {
    data: data.data || data,
    total: data.total || (data.data || data).length,
  };
}

export async function getBlogById(id: string): Promise<BlogPost> {
  const { data } = await api.get(`/blog/posts/${id}`);
  const blog = data.data || data;
  if (blog) {
    blog.coverImage = blog.featuredImage;
  }
  return blog;
}

export async function getBlogBySlug(slug: string): Promise<BlogPost> {
  const { data } = await api.get(`/blog/posts/${slug}`);
  const blog = data.data || data;
  if (blog) {
    blog.coverImage = blog.featuredImage;
  }
  return blog;
}

export async function createBlogPost(postData: any): Promise<BlogPost> {
  const { data } = await api.post('/blog/posts', postData);
  return data.data || data;
}

export async function updateBlogPost(id: string, postData: any): Promise<BlogPost> {
  const { data } = await api.patch(`/blog/posts/${id}`, postData);
  return data.data || data;
}

export async function deleteBlogPost(id: string): Promise<void> {
  await api.delete(`/blog/posts/${id}`);
}

export async function getBlogCategories(): Promise<any[]> {
  const { data } = await api.get('/blog/categories');
  return data.data || data;
}

export async function createBlogCategory(categoryData: any): Promise<any> {
  const { data } = await api.post('/blog/categories', categoryData);
  return data.data || data;
}

export async function uploadBlogImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/storage/blog-image', formData);

  return data.data.url;
}

// ─── Admin (full CRUD, drafts included, SEO fields, authors) ──────────
// Hits BlogAdminController (/admin/blogs/*) — the fully-typed, admin-only
// counterpart to the loosely-typed /blog/posts routes above.

export async function getAdminBlogPosts(params?: {
  page?: number; limit?: number; search?: string; category?: string; categoryId?: string; tag?: string; status?: 'DRAFT' | 'PUBLISHED';
}): Promise<BlogListResponse> {
  const { data } = await api.get('/admin/blogs', { params });
  const body = data.data ?? data;
  return {
    data: body.data ?? body,
    total: body.total ?? (Array.isArray(body.data) ? body.data.length : (Array.isArray(body) ? body.length : 0)),
  };
}

export async function getAdminBlogById(id: string): Promise<BlogPost> {
  const { data } = await api.get(`/admin/blogs/${id}`);
  return data.data ?? data;
}

export async function createAdminBlogPost(postData: UpsertBlogPostInput): Promise<BlogPost> {
  const { data } = await api.post('/admin/blogs', postData);
  return data.data ?? data;
}

export async function updateAdminBlogPost(id: string, postData: Partial<UpsertBlogPostInput>): Promise<BlogPost> {
  const { data } = await api.put(`/admin/blogs/${id}`, postData);
  return data.data ?? data;
}

export async function updateAdminBlogPostStatus(id: string, status: 'DRAFT' | 'PUBLISHED'): Promise<BlogPost> {
  const { data } = await api.patch(`/admin/blogs/${id}/status`, { status });
  return data.data ?? data;
}

export async function deleteAdminBlogPost(id: string): Promise<void> {
  await api.delete(`/admin/blogs/${id}`);
}

export async function getBlogAuthors(): Promise<BlogAuthor[]> {
  const { data } = await api.get('/admin/blogs/authors');
  const body = data.data ?? data;
  return Array.isArray(body) ? body : [];
}

export async function createBlogAuthor(payload: { name: string; bio?: string; avatar?: string }): Promise<BlogAuthor> {
  const { data } = await api.post('/admin/blogs/authors', payload);
  return data.data ?? data;
}

export async function getAdminBlogCategories(): Promise<BlogCategory[]> {
  const { data } = await api.get('/admin/blogs/categories');
  const body = data.data ?? data;
  return Array.isArray(body) ? body : [];
}

export async function createAdminBlogCategory(payload: { name: string; slug?: string }): Promise<BlogCategory> {
  const { data } = await api.post('/admin/blogs/categories', payload);
  return data.data ?? data;
}
