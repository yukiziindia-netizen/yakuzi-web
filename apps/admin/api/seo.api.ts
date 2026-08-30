import { apiClient } from "@/lib/apiClient";

// Mirrors the yakuzi-api SEO platform (src/modules/seo). Kept separate from
// admin.api.ts so concurrent work on that file doesn't conflict.

export type SeoEntityType =
  | "PRODUCT"
  | "CATEGORY"
  | "SUB_CATEGORY"
  | "BRAND"
  | "COLLECTION"
  | "BLOG_POST"
  | "STATIC_PAGE"
  | "HOMEPAGE"
  | "LANDING_PAGE";

export type KeywordType =
  | "PRIMARY_TOPIC"
  | "SECONDARY_TOPIC"
  | "SYNONYM"
  | "RELATED_ENTITY"
  | "BRAND_ENTITY"
  | "CATEGORY_ENTITY"
  | "NEGATIVE"
  | "SEASONAL";

// BLOG_POST is deliberately NOT offered here: blog posts carry their own SEO
// fields (meta title/description, canonical, OG image) in the blog editor,
// which is what the live post page actually reads — offering them here too
// created a second, silently-dead control surface. The type stays in the
// union so any historical records still render labels without crashing.
export const SEO_ENTITY_TYPES: SeoEntityType[] = [
  "PRODUCT", "CATEGORY", "SUB_CATEGORY", "BRAND", "COLLECTION",
  "STATIC_PAGE", "HOMEPAGE", "LANDING_PAGE",
];

// The meta editor's create flow deliberately does NOT offer PRODUCT: product
// SEO (meta, slug/301s, FAQs, keywords, structured data) is edited on the
// product add/edit pages themselves, which save to the same SeoMeta record.
// Per Rishi: one editing surface per thing. PRODUCT stays in SEO_ENTITY_TYPES
// so the records list can still filter/label product rows, and the keywords
// page can still link keywords to products (not duplicated anywhere else).
export const META_EDITOR_ENTITY_TYPES: SeoEntityType[] = SEO_ENTITY_TYPES.filter(
  (t) => t !== "PRODUCT",
);

export const KEYWORD_TYPES: KeywordType[] = [
  "PRIMARY_TOPIC", "SECONDARY_TOPIC", "SYNONYM", "RELATED_ENTITY",
  "BRAND_ENTITY", "CATEGORY_ENTITY", "NEGATIVE", "SEASONAL",
];

export interface SeoFaqEntry { question: string; answer: string; }

export interface SeoMetaRecord {
  id: string;
  entityType: SeoEntityType;
  entityId: string;
  title: string | null;
  description: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  twitterCard: string | null;
  robots: string | null;
  focusKeyword: string | null;
  secondaryKeywords: string[];
  entityDescription: string | null;
  aiSummary: string | null;
  faq: SeoFaqEntry[] | null;
  structuredDataOverride: Record<string, unknown> | null;
  imageAltOverrides: Record<string, string> | null;
  seoScore: number | null;
  aiVisibilityScore: number | null;
  readabilityScore: number | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SeoMetaRevision {
  id: string;
  seoMetaId: string;
  snapshot: Partial<SeoMetaRecord>;
  changedById: string | null;
  createdAt: string;
}

export interface SeoRedirect {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  isActive: boolean;
  note: string | null;
  hits: number;
  lastHitAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SeoKeyword {
  id: string;
  name: string;
  type: KeywordType;
  canonicalName: string | null;
  synonyms: string[];
  description: string | null;
  parentId: string | null;
  seasonStart: string | null;
  seasonEnd: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { links: number; children: number };
}

export interface SeoKeywordLink {
  id: string;
  keywordId: string;
  entityType: SeoEntityType;
  entityId: string;
  weight: number;
}

export interface UpsertSeoMetaPayload {
  entityType: SeoEntityType;
  /** Entity id, or the path for STATIC_PAGE / HOMEPAGE / LANDING_PAGE (e.g. "/about"). */
  entityId: string;
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  twitterCard?: string;
  robots?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  entityDescription?: string;
  aiSummary?: string;
  faq?: SeoFaqEntry[];
  structuredDataOverride?: Record<string, unknown>;
  imageAltOverrides?: Record<string, string>;
}

// ─── Product URL slug ────────────────────────────────
// Catalog-id keyed, same keyspace as PRODUCT SeoMeta records. Unlike the
// Canonical URL field (a meta tag only), this changes the product's REAL
// public URL — the backend 301-redirects the old URL automatically.

export interface ProductSlugInfo {
  id: string;
  name: string;
  slug: string | null;
}

export async function getSeoProductSlug(id: string): Promise<ProductSlugInfo> {
  const { data } = await apiClient.get<{ data: ProductSlugInfo }>(
    `/admin/seo/product-slug/${id}`
  );
  return data.data;
}

export async function updateSeoProductSlug(id: string, slug: string, createRedirect = true): Promise<{ id: string; slug: string }> {
  const { data } = await apiClient.patch<{ data: { id: string; slug: string } }>(
    `/admin/seo/product-slug/${id}`,
    { slug, createRedirect }
  );
  return data.data;
}

// ─── Metadata ────────────────────────────────────────

export async function listSeoMeta(params: {
  type?: SeoEntityType;
  missing?: "title" | "description" | "aiSummary";
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ items: SeoMetaRecord[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
  const { data } = await apiClient.get<{ data: any }>(`/admin/seo/meta?${qs}`);
  return data.data ?? { items: [], total: 0, page: 1, limit: 20 };
}

export async function getSeoMetaOne(type: SeoEntityType, id: string): Promise<SeoMetaRecord | null> {
  const { data } = await apiClient.get<{ data: any }>(
    `/admin/seo/meta/one?type=${type}&id=${encodeURIComponent(id)}`
  );
  return data.data ?? null;
}

export async function upsertSeoMeta(payload: UpsertSeoMetaPayload): Promise<SeoMetaRecord> {
  const { data } = await apiClient.put<{ data: any }>("/admin/seo/meta", payload);
  return data.data;
}

export async function getSeoRevisions(metaId: string): Promise<SeoMetaRevision[]> {
  const { data } = await apiClient.get<{ data: any }>(`/admin/seo/meta/${metaId}/revisions`);
  return Array.isArray(data.data) ? data.data : [];
}

export async function restoreSeoRevision(metaId: string, revisionId: string): Promise<SeoMetaRecord> {
  const { data } = await apiClient.post<{ data: any }>(
    `/admin/seo/meta/${metaId}/revisions/${revisionId}/restore`
  );
  return data.data;
}

// ─── Redirects ───────────────────────────────────────

export async function listSeoRedirects(params: { search?: string; page?: number; limit?: number } = {}):
  Promise<{ items: SeoRedirect[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
  const { data } = await apiClient.get<{ data: any }>(`/admin/seo/redirects?${qs}`);
  return data.data ?? { items: [], total: 0, page: 1, limit: 20 };
}

export async function createSeoRedirect(payload: {
  fromPath: string; toPath: string; statusCode?: number; isActive?: boolean; note?: string;
}): Promise<SeoRedirect> {
  const { data } = await apiClient.post<{ data: any }>("/admin/seo/redirects", payload);
  return data.data;
}

export async function updateSeoRedirect(id: string, payload: Partial<{
  fromPath: string; toPath: string; statusCode: number; isActive: boolean; note: string;
}>): Promise<SeoRedirect> {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/seo/redirects/${id}`, payload);
  return data.data;
}

export async function deleteSeoRedirect(id: string): Promise<void> {
  await apiClient.delete(`/admin/seo/redirects/${id}`);
}

// ─── Keywords ────────────────────────────────────────

export async function listSeoKeywords(params: {
  type?: KeywordType; search?: string; includeInactive?: boolean;
} = {}): Promise<SeoKeyword[]> {
  const qs = new URLSearchParams();
  if (params.type) qs.set("type", params.type);
  if (params.search) qs.set("search", params.search);
  if (params.includeInactive) qs.set("includeInactive", "true");
  const { data } = await apiClient.get<{ data: any }>(`/admin/seo/keywords?${qs}`);
  return Array.isArray(data.data) ? data.data : [];
}

export async function createSeoKeyword(payload: {
  name: string; type: KeywordType; canonicalName?: string; synonyms?: string[];
  description?: string; parentId?: string; seasonStart?: string; seasonEnd?: string; isActive?: boolean;
}): Promise<SeoKeyword> {
  const { data } = await apiClient.post<{ data: any }>("/admin/seo/keywords", payload);
  return data.data;
}

export async function updateSeoKeyword(id: string, payload: Partial<{
  name: string; type: KeywordType; canonicalName: string; synonyms: string[];
  description: string; parentId: string; seasonStart: string; seasonEnd: string; isActive: boolean;
}>): Promise<SeoKeyword> {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/seo/keywords/${id}`, payload);
  return data.data;
}

export async function deleteSeoKeyword(id: string): Promise<void> {
  await apiClient.delete(`/admin/seo/keywords/${id}`);
}

/**
 * Requires yakuzi-api#37. Returns null (not an error) until that endpoint is
 * deployed so the links modal can show a hint instead of breaking.
 */
export async function getSeoKeywordLinks(id: string): Promise<SeoKeywordLink[] | null> {
  try {
    const { data } = await apiClient.get<{ data: any }>(`/admin/seo/keywords/${id}/links`);
    return Array.isArray(data.data) ? data.data : [];
  } catch {
    return null;
  }
}

export async function linkSeoKeyword(id: string, payload: {
  entityType: SeoEntityType; entityId: string; weight?: number;
}): Promise<SeoKeywordLink> {
  const { data } = await apiClient.post<{ data: any }>(`/admin/seo/keywords/${id}/links`, payload);
  return data.data;
}

export async function unlinkSeoKeyword(id: string, entityType: SeoEntityType, entityId: string): Promise<void> {
  await apiClient.delete(
    `/admin/seo/keywords/${id}/links?type=${entityType}&entityId=${encodeURIComponent(entityId)}`
  );
}

// ─── Entity picker sources ───────────────────────────

/** Admin-authed: OptionalJwtAuthGuard returns drafts too for ADMIN tokens. */
export async function getBlogPostsForPicker(): Promise<Array<{ id: string; title: string; slug: string; status?: string }>> {
  const { data } = await apiClient.get<any>("/blog/posts");
  const body = data?.data ?? data;
  return Array.isArray(body) ? body : (Array.isArray(body?.items) ? body.items : []);
}
