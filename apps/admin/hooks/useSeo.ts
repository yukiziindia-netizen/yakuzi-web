"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listSeoMeta, getSeoMetaOne, upsertSeoMeta, getSeoRevisions, restoreSeoRevision,
  listSeoRedirects, createSeoRedirect, updateSeoRedirect, deleteSeoRedirect,
  listSeoKeywords, createSeoKeyword, updateSeoKeyword, deleteSeoKeyword,
  getSeoKeywordLinks, linkSeoKeyword, unlinkSeoKeyword,
  getSeoProductSlug, updateSeoProductSlug,
  resolveSeoRedirect, exportSeoRedirects, bulkCreateSeoRedirects,
  bulkSetSeoRedirectActive, bulkDeleteSeoRedirects,
  listSeoNotFound, getSeoNotFoundSummary, setSeoNotFoundStatus,
  deleteSeoNotFound, clearResolvedSeoNotFound,
  type SeoEntityType, type KeywordType, type UpsertSeoMetaPayload,
  type RedirectListParams, type NotFoundStatus,
} from "@/api/seo.api";

// ─── Product URL slug ────────────────────────────────

export function useSeoProductSlug(id?: string) {
  return useQuery({
    queryKey: ["admin", "seo", "product-slug", id],
    queryFn: () => getSeoProductSlug(id as string),
    enabled: !!id,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useUpdateSeoProductSlug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, slug, createRedirect }: { id: string; slug: string; createRedirect?: boolean }) =>
      updateSeoProductSlug(id, slug, createRedirect),
    onSuccess: (_data, { id }) =>
      void qc.invalidateQueries({ queryKey: ["admin", "seo", "product-slug", id] }),
  });
}

// ─── Metadata ────────────────────────────────────────

export function useSeoMetaList(params: {
  type?: SeoEntityType; missing?: "title" | "description" | "aiSummary";
  search?: string; page?: number; limit?: number;
} = {}) {
  return useQuery({ queryKey: ["admin", "seo", "meta", params], queryFn: () => listSeoMeta(params), staleTime: 60_000, retry: 1 });
}

export function useSeoMetaOne(type?: SeoEntityType, id?: string) {
  return useQuery({
    queryKey: ["admin", "seo", "meta-one", type, id],
    queryFn: () => getSeoMetaOne(type as SeoEntityType, id as string),
    enabled: !!type && !!id,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useUpsertSeoMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertSeoMetaPayload) => upsertSeoMeta(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "seo"] }),
  });
}

export function useSeoRevisions(metaId?: string) {
  return useQuery({
    queryKey: ["admin", "seo", "revisions", metaId],
    queryFn: () => getSeoRevisions(metaId as string),
    enabled: !!metaId,
    retry: 1,
  });
}

export function useRestoreSeoRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ metaId, revisionId }: { metaId: string; revisionId: string }) =>
      restoreSeoRevision(metaId, revisionId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "seo"] }),
  });
}

// ─── Redirects ───────────────────────────────────────

export function useSeoRedirects(params: RedirectListParams = {}) {
  return useQuery({ queryKey: ["admin", "seo", "redirects", params], queryFn: () => listSeoRedirects(params), staleTime: 60_000, retry: 1 });
}

export function useCreateSeoRedirect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSeoRedirect,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "seo", "redirects"] });
      // Creating a redirect marks matching 404s FIXED server-side, so that
      // list is stale too.
      void qc.invalidateQueries({ queryKey: ["admin", "seo", "not-found"] });
    },
  });
}

export function useUpdateSeoRedirect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateSeoRedirect>[1] }) =>
      updateSeoRedirect(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "seo", "redirects"] }),
  });
}

export function useDeleteSeoRedirect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSeoRedirect,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "seo", "redirects"] }),
  });
}

// ─── Redirect tool: tester, bulk, 404 log ────────────

/**
 * Creating or importing a redirect can flip a 404 to FIXED server-side, so
 * every mutation here invalidates both lists rather than only its own.
 */
function invalidateRedirectTool(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["admin", "seo", "redirects"] });
  void qc.invalidateQueries({ queryKey: ["admin", "seo", "not-found"] });
}

export function useResolveSeoRedirect(path: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "seo", "redirects", "resolve", path],
    queryFn: () => resolveSeoRedirect(path),
    enabled: enabled && !!path.trim(),
    retry: false,
    staleTime: 0,
  });
}

export function useBulkCreateSeoRedirects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkCreateSeoRedirects,
    onSuccess: () => invalidateRedirectTool(qc),
  });
}

export function useBulkSetSeoRedirectActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      bulkSetSeoRedirectActive(ids, isActive),
    onSuccess: () => invalidateRedirectTool(qc),
  });
}

export function useBulkDeleteSeoRedirects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkDeleteSeoRedirects,
    onSuccess: () => invalidateRedirectTool(qc),
  });
}

export function useExportSeoRedirects() {
  return useMutation({ mutationFn: exportSeoRedirects });
}

export function useSeoNotFound(params: {
  status?: NotFoundStatus; search?: string; sort?: "hits" | "recent" | "oldest";
  page?: number; limit?: number;
} = {}) {
  return useQuery({
    queryKey: ["admin", "seo", "not-found", params],
    queryFn: () => listSeoNotFound(params),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useSeoNotFoundSummary() {
  return useQuery({
    queryKey: ["admin", "seo", "not-found", "summary"],
    queryFn: getSeoNotFoundSummary,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useSetSeoNotFoundStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: NotFoundStatus }) =>
      setSeoNotFoundStatus(id, status),
    onSuccess: () => invalidateRedirectTool(qc),
  });
}

export function useDeleteSeoNotFound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSeoNotFound,
    onSuccess: () => invalidateRedirectTool(qc),
  });
}

export function useClearResolvedSeoNotFound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearResolvedSeoNotFound,
    onSuccess: () => invalidateRedirectTool(qc),
  });
}

// ─── Keywords ────────────────────────────────────────

export function useSeoKeywords(params: { type?: KeywordType; search?: string; includeInactive?: boolean } = {}) {
  return useQuery({ queryKey: ["admin", "seo", "keywords", params], queryFn: () => listSeoKeywords(params), staleTime: 60_000, retry: 1 });
}

export function useCreateSeoKeyword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSeoKeyword,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "seo", "keywords"] }),
  });
}

export function useUpdateSeoKeyword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateSeoKeyword>[1] }) =>
      updateSeoKeyword(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "seo", "keywords"] }),
  });
}

export function useDeleteSeoKeyword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSeoKeyword,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "seo", "keywords"] }),
  });
}

export function useSeoKeywordLinks(keywordId?: string) {
  return useQuery({
    queryKey: ["admin", "seo", "keyword-links", keywordId],
    queryFn: () => getSeoKeywordLinks(keywordId as string),
    enabled: !!keywordId,
    retry: 1,
  });
}

export function useLinkSeoKeyword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof linkSeoKeyword>[1] }) =>
      linkSeoKeyword(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "seo", "keyword-links"] });
      void qc.invalidateQueries({ queryKey: ["admin", "seo", "keywords"] });
    },
  });
}

export function useUnlinkSeoKeyword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entityType, entityId }: { id: string; entityType: SeoEntityType; entityId: string }) =>
      unlinkSeoKeyword(id, entityType, entityId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "seo", "keyword-links"] });
      void qc.invalidateQueries({ queryKey: ["admin", "seo", "keywords"] });
    },
  });
}
