"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listSeoMeta, getSeoMetaOne, upsertSeoMeta, getSeoRevisions, restoreSeoRevision,
  listSeoRedirects, createSeoRedirect, updateSeoRedirect, deleteSeoRedirect,
  listSeoKeywords, createSeoKeyword, updateSeoKeyword, deleteSeoKeyword,
  getSeoKeywordLinks, linkSeoKeyword, unlinkSeoKeyword,
  getSeoProductSlug, updateSeoProductSlug,
  type SeoEntityType, type KeywordType, type UpsertSeoMetaPayload,
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

export function useSeoRedirects(params: { search?: string; page?: number; limit?: number } = {}) {
  return useQuery({ queryKey: ["admin", "seo", "redirects", params], queryFn: () => listSeoRedirects(params), staleTime: 60_000, retry: 1 });
}

export function useCreateSeoRedirect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSeoRedirect,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "seo", "redirects"] }),
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
