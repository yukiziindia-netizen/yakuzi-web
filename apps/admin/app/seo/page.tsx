"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Globe, KeyRound, Route, Sparkles, Type as TypeIcon } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Button, Skeleton, StatCard } from "@/components/ui";
import { useSeoKeywords, useSeoMetaList, useSeoRedirects } from "@/hooks/useSeo";
import { SEO_ENTITY_TYPES, type SeoEntityType } from "@/api/seo.api";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";
import { ImageIcon } from "lucide-react";
import { ENTITY_TYPE_LABELS } from "@/components/seo/entity-picker";

const SECTIONS = [
  { href: "/seo/metadata", title: "Metadata", description: "Titles, descriptions, Open Graph, FAQs, AI summaries and structured-data overrides per page.", icon: FileText },
  { href: "/seo/redirects", title: "Redirects", description: "301/302 redirects with hit tracking — fix moved or retired URLs.", icon: Route },
  { href: "/seo/keywords", title: "Keywords & entities", description: "Topic clusters, synonyms and entity links for semantic optimization.", icon: KeyRound },
];

function TypeRow({ type }: { type: SeoEntityType }) {
  const { data, isLoading } = useSeoMetaList({ type, limit: 1 });
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-foreground">{ENTITY_TYPE_LABELS[type]}</span>
      {isLoading ? <Skeleton className="h-5 w-10" /> : (
        <Badge variant={(data?.total ?? 0) > 0 ? "purple" : "outline"}>{data?.total ?? 0}</Badge>
      )}
    </div>
  );
}

export default function SeoOverviewPage() {
  // Batched, re-runnable SEO rename of EXISTING product images (copy-not-move
  // server-side, so old URLs never break). Loops until the API reports no
  // products left with un-renamed images.
  const [renaming, setRenaming] = useState(false);
  const [renameProgress, setRenameProgress] = useState<string | null>(null);
  const runImageRename = async () => {
    setRenaming(true);
    setRenameProgress("Starting…");
    let renamed = 0, failed = 0, guard = 0;
    try {
      for (;;) {
        const { data } = await apiClient.post<{ data: { renamed: number; failed: number; remaining: number } }>(
          "/admin/seo/rename-product-images", { limit: 20 });
        renamed += data.data.renamed; failed += data.data.failed;
        setRenameProgress(`${renamed} renamed so far — ${data.data.remaining} products left…`);
        if (data.data.remaining === 0 || ++guard > 100) break;
      }
      setRenameProgress(null);
      toast.success(failed ? `Done: ${renamed} images renamed, ${failed} failed (see server logs)` : `Done: ${renamed} images renamed for SEO`);
    } catch (e: any) {
      setRenameProgress(null);
      toast.error(e?.response?.data?.message ?? "Image rename failed — try again");
    } finally {
      setRenaming(false);
    }
  };
  const all = useSeoMetaList({ limit: 1 });
  const missingTitle = useSeoMetaList({ missing: "title", limit: 1 });
  const missingDescription = useSeoMetaList({ missing: "description", limit: 1 });
  const missingAi = useSeoMetaList({ missing: "aiSummary", limit: 1 });
  const redirects = useSeoRedirects({ limit: 1 });
  const keywords = useSeoKeywords();

  const fmt = (q: { data?: { total?: number } | any[]; isLoading: boolean }) =>
    q.isLoading ? "…" : String(Array.isArray(q.data) ? q.data.length : (q.data?.total ?? 0));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">SEO</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Search & AI visibility management — overrides apply on top of the storefront's generated defaults.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="SEO records" value={fmt(all)} icon={Globe} delay={0} href="/seo/metadata" />
          <StatCard title="Missing title" value={fmt(missingTitle)} icon={TypeIcon} delay={0.05}
            alert={(missingTitle.data?.total ?? 0) > 0} change={(missingTitle.data?.total ?? 0) > 0 ? "records without a custom title" : undefined} href="/seo/metadata?missing=title" />
          <StatCard title="Missing AI summary" value={fmt(missingAi)} icon={Sparkles} delay={0.1}
            alert={(missingAi.data?.total ?? 0) > 0} change={(missingAi.data?.total ?? 0) > 0 ? "records invisible to AI answers" : undefined} href="/seo/metadata?missing=aiSummary" />
          <StatCard title="Redirects" value={fmt(redirects)} icon={Route} delay={0.15} href="/seo/redirects" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {SECTIONS.map(({ href, title, description, icon: Icon }, i) => (
            <motion.div key={href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}>
              <Link href={href} className="glass-card rounded-2xl p-5 flex flex-col gap-3 h-full hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-4.5 w-4.5" /></div>
                <div>
                  <h2 className="font-semibold text-foreground flex items-center gap-1.5">{title} <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" /></h2>
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><ImageIcon className="h-4.5 w-4.5" /></div>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground text-sm">Image SEO — rename existing product images</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Copies every already-uploaded product image to an SEO filename ("product-name-yukizi-1.png") and points the product at it. Old URLs stay alive, so nothing breaks. Safe to run again anytime — already-renamed images are skipped. New uploads are named automatically.
            </p>
            {renameProgress && <p className="text-xs text-primary mt-1.5">{renameProgress}</p>}
          </div>
          <Button onClick={runImageRename} loading={renaming} disabled={renaming}>
            {renaming ? "Renaming…" : "Rename images"}
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }} className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50">
              <h2 className="font-semibold text-foreground text-sm">Records by page type</h2>
            </div>
            <div className="divide-y divide-border/40">
              {SEO_ENTITY_TYPES.map((t) => <TypeRow key={t} type={t} />)}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }} className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50">
              <h2 className="font-semibold text-foreground text-sm">Coverage gaps</h2>
            </div>
            <div className="divide-y divide-border/40">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-foreground">Records missing a meta description</span>
                <Badge variant={(missingDescription.data?.total ?? 0) > 0 ? "warning" : "success"}>{fmt(missingDescription)}</Badge>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-foreground">Records missing an AI summary</span>
                <Badge variant={(missingAi.data?.total ?? 0) > 0 ? "warning" : "success"}>{fmt(missingAi)}</Badge>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-foreground">Keywords defined</span>
                <Badge variant={(keywords.data?.length ?? 0) > 0 ? "purple" : "outline"}>{fmt(keywords)}</Badge>
              </div>
              <div className="px-4 py-3 text-xs text-muted-foreground">
                Pages without a record here still get sensible generated metadata — records are only needed where you want to override or enrich (FAQ, AI summary, keywords).
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
