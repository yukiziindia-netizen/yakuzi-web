"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, Pencil, Plus, Search } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Button, EmptyState, Input, Pagination, Select, Skeleton } from "@/components/ui";
import { useSeoMetaList } from "@/hooks/useSeo";
import { META_EDITOR_ENTITY_TYPES, type SeoEntityType, type SeoMetaRecord } from "@/api/seo.api";
import { ENTITY_TYPE_LABELS } from "@/components/seo/entity-picker";
import { MetaEditor } from "@/components/seo/meta-editor";
import { ScoreChip } from "@/components/seo/serp-preview";

const MISSING_OPTIONS = [
  { value: "", label: "Any completeness" },
  { value: "title", label: "Missing title" },
  { value: "description", label: "Missing description" },
  { value: "aiSummary", label: "Missing AI summary" },
] as const;

function MetadataPageInner() {
  const params = useSearchParams();
  const initialMissing = params.get("missing");

  const [type, setType] = useState<SeoEntityType | "">("");
  const [missing, setMissing] = useState<string>(
    MISSING_OPTIONS.some((o) => o.value === initialMissing) ? (initialMissing as string) : ""
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SeoMetaRecord | null>(null);

  const { data, isLoading } = useSeoMetaList({
    type: type || undefined,
    missing: (missing || undefined) as "title" | "description" | "aiSummary" | undefined,
    search: search || undefined,
    page,
    limit: 20,
  });

  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 20)));

  const openCreate = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (record: SeoMetaRecord) => { setEditing(record); setEditorOpen(true); };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">SEO metadata</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "Loading…" : `${data?.total ?? 0} records · overrides on top of generated defaults`}
            </p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>New override</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input placeholder="Search by title or entity id…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} leftIcon={<Search className="h-4 w-4" />} />
          <Select value={type} onChange={(e) => { setType(e.target.value as SeoEntityType | ""); setPage(1); }}>
            <option value="">All page types</option>
            {META_EDITOR_ENTITY_TYPES.map((t) => <option key={t} value={t}>{ENTITY_TYPE_LABELS[t]}</option>)}
          </Select>
          <Select value={missing} onChange={(e) => { setMissing(e.target.value); setPage(1); }}>
            {MISSING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Page</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Scores</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><Skeleton className="h-6 w-full" /></td></tr>
                ))}
                {!isLoading && items.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState icon={FileText} title="No SEO records yet"
                        description="Pages fall back to generated metadata. Create an override to customize titles, descriptions, FAQs or AI summaries." />
                    </td>
                  </tr>
                )}
                {items.map((record) => (
                  <tr key={record.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant="purple">{ENTITY_TYPE_LABELS[record.entityType]}</Badge>
                      <code className="block mt-1 text-[11px] text-muted-foreground truncate max-w-[14rem]">{record.entityId}</code>
                    </td>
                    <td className="px-4 py-3 max-w-[18rem]">
                      <span className="block truncate text-foreground">{record.title ?? <span className="text-muted-foreground italic">generated</span>}</span>
                      {record.focusKeyword && <span className="block truncate text-xs text-muted-foreground">focus: {record.focusKeyword}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <ScoreChip label="SEO" value={record.seoScore} />
                        <ScoreChip label="AI" value={record.aiVisibilityScore} />
                        <ScoreChip label="Read" value={record.readabilityScore} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(record.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => openEdit(record)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </motion.div>
      </div>

      <MetaEditor open={editorOpen} onClose={() => setEditorOpen(false)} record={editing} />
    </AdminLayout>
  );
}

export default function MetadataPage() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense fallback={null}>
      <MetadataPageInner />
    </Suspense>
  );
}
