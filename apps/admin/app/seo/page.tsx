"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Globe, KeyRound, Route, Sparkles, Type as TypeIcon } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Button, Input, Skeleton, StatCard } from "@/components/ui";
import { useSeoKeywords, useSeoMetaList, useSeoRedirects } from "@/hooks/useSeo";
import { usePlatformSettings, useUpdatePlatformSettings } from "@/hooks/useAdmin";
import { META_EDITOR_ENTITY_TYPES, type SeoEntityType } from "@/api/seo.api";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";
import { ImageIcon, Search as SearchIcon } from "lucide-react";
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
  // Search Console / Bing verification tokens. They live in platform
  // settings (the storefront reads them per-request) but belong here, where
  // an admin actually goes looking for search-engine connections.
  const { data: settings } = usePlatformSettings();
  const updateSettings = useUpdatePlatformSettings();
  const [gsc, setGsc] = useState("");
  const [bing, setBing] = useState("");
  const [gscSeeded, setGscSeeded] = useState(false);
  const [gscSaving, setGscSaving] = useState(false);
  useEffect(() => {
    if (!gscSeeded && settings) {
      setGsc((settings as any).googleSiteVerification ?? "");
      setBing((settings as any).bingSiteVerification ?? "");
      setGscSeeded(true);
    }
  }, [settings, gscSeeded]);
  // Storefront-wide SEO defaults — the values that used to require a code
  // change (title template, fallback description/share image, twitter handle,
  // theme colour).
  const [defs, setDefs] = useState<Record<string, string | boolean>>({});
  const [defsSeeded, setDefsSeeded] = useState(false);
  const [defsSaving, setDefsSaving] = useState(false);
  useEffect(() => {
    if (!defsSeeded && settings) {
      const s = settings as Record<string, unknown>;
      setDefs({
        seoTitleTemplate: String(s.seoTitleTemplate ?? ""),
        seoDefaultDescription: String(s.seoDefaultDescription ?? ""),
        seoDefaultOgImage: String(s.seoDefaultOgImage ?? ""),
        seoTwitterHandle: String(s.seoTwitterHandle ?? ""),
        seoThemeColor: String(s.seoThemeColor ?? ""),
        seoProductTitleSuffix: String(s.seoProductTitleSuffix ?? ""),
      });
      setDefsSeeded(true);
    }
  }, [settings, defsSeeded]);
  // Social profile URLs — rendered in the storefront footer AND emitted as
  // schema.org sameAs, the link Google/AI use to connect this site to the
  // brand elsewhere.
  const SOCIAL_FIELDS: { key: string; label: string; placeholder: string }[] = [
    { key: "socialInstagram", label: "Instagram", placeholder: "https://instagram.com/yukizi" },
    { key: "socialFacebook", label: "Facebook", placeholder: "https://facebook.com/yukizi" },
    { key: "socialYoutube", label: "YouTube", placeholder: "https://youtube.com/@yukizi" },
    { key: "socialX", label: "X (Twitter)", placeholder: "https://x.com/yukizi" },
    { key: "socialDiscord", label: "Discord", placeholder: "https://discord.gg/…" },
    { key: "socialLinkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/yukizi" },
    { key: "socialWhatsapp", label: "WhatsApp", placeholder: "https://wa.me/9182912…" },
  ];
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [socialsSeeded, setSocialsSeeded] = useState(false);
  const [socialsSaving, setSocialsSaving] = useState(false);
  useEffect(() => {
    if (!socialsSeeded && settings) {
      const src = settings as Record<string, unknown>;
      const next: Record<string, string> = {};
      SOCIAL_FIELDS.forEach((f) => { next[f.key] = String(src[f.key] ?? ""); });
      setSocials(next);
      setSocialsSeeded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, socialsSeeded]);
  const saveSocials = async () => {
    setSocialsSaving(true);
    try {
      await updateSettings.mutateAsync({ ...(settings as Record<string, unknown> ?? {}), ...socials } as any);
      toast.success("Social profiles saved — footer and schema update within ~5 minutes");
    } catch {
      toast.error("Could not save the social profiles");
    } finally {
      setSocialsSaving(false);
    }
  };

  const saveDefaults = async () => {
    setDefsSaving(true);
    try {
      await updateSettings.mutateAsync({ ...(settings as Record<string, unknown> ?? {}), ...defs } as any);
      toast.success("Storefront defaults saved — live within ~5 minutes, no deploy");
    } catch {
      toast.error("Could not save the storefront defaults");
    } finally {
      setDefsSaving(false);
    }
  };

  const saveVerification = async () => {
    setGscSaving(true);
    try {
      // Merge over current settings so this partial save can't clear others.
      await updateSettings.mutateAsync({
        ...(settings as Record<string, unknown> ?? {}),
        googleSiteVerification: gsc.trim(),
        bingSiteVerification: bing.trim(),
      } as any);
      toast.success("Saved — verify the property in Search Console, then submit sitemap.xml");
    } catch {
      toast.error("Could not save the verification tokens");
    } finally {
      setGscSaving(false);
    }
  };

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

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.4 }} className="glass-card rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><SearchIcon className="h-4.5 w-4.5" /></div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground text-sm">Search Console &amp; Bing connection</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Paste the verification tokens to prove you own yukizi.com. Google: Search Console → Add property → URL prefix → HTML tag → copy the <code className="text-xs">content</code> value. Bing: Webmaster Tools → same flow (<code className="text-xs">msvalidate.01</code>). Saving publishes the meta tags on the storefront within ~5 minutes — no deploy. Then verify, and submit <code className="text-xs">sitemap.xml</code> in both.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Google Search Console token" value={gsc} onChange={(e) => setGsc(e.target.value)} placeholder="e.g. AbCdEf1234…" />
            <Input label="Bing Webmaster Tools token" value={bing} onChange={(e) => setBing(e.target.value)} placeholder="msvalidate.01 value" />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={saveVerification} loading={gscSaving} disabled={gscSaving}>Save tokens</Button>
            {(gsc.trim() || bing.trim()) && <Badge variant="success">Configured</Badge>}
            {!gsc.trim() && !bing.trim() && <Badge variant="outline">Not connected</Badge>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.295, duration: 0.4 }} className="glass-card rounded-2xl p-5 space-y-3">
          <div>
            <h2 className="font-semibold text-foreground text-sm">Social profiles</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Paste the full URL of each profile you have. They appear as icons in the storefront footer <strong>and</strong> as <code className="text-xs">sameAs</code> in your Organization schema — the link Google and AI assistants use to connect yukizi.com to your brand elsewhere. Leave blank to hide.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SOCIAL_FIELDS.map((f) => (
              <Input key={f.key} label={f.label} placeholder={f.placeholder}
                value={socials[f.key] ?? ""}
                onChange={(e) => setSocials((v) => ({ ...v, [f.key]: e.target.value }))} />
            ))}
          </div>
          <Button onClick={saveSocials} loading={socialsSaving} disabled={socialsSaving}>Save social profiles</Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.29, duration: 0.4 }} className="glass-card rounded-2xl p-5 space-y-3">
          <div>
            <h2 className="font-semibold text-foreground text-sm">Storefront SEO defaults</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Site-wide fallbacks used wherever a page has no override of its own. Blank = keep the built-in default. Saved changes are live within ~5 minutes with no deploy.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Title template" value={String(defs.seoTitleTemplate ?? "")} placeholder="%s | Yukizi"
              onChange={(e) => setDefs((d) => ({ ...d, seoTitleTemplate: e.target.value }))} />
            <Input label="Product title suffix" value={String(defs.seoProductTitleSuffix ?? "")} placeholder="e.g. — Buy Online in India"
              onChange={(e) => setDefs((d) => ({ ...d, seoProductTitleSuffix: e.target.value }))} />
            <Input label="Default meta description" value={String(defs.seoDefaultDescription ?? "")} placeholder="Used when a page has none of its own"
              onChange={(e) => setDefs((d) => ({ ...d, seoDefaultDescription: e.target.value }))} />
            <Input label="Default share image URL" value={String(defs.seoDefaultOgImage ?? "")} placeholder="https://yukizi.com/og-default.png"
              onChange={(e) => setDefs((d) => ({ ...d, seoDefaultOgImage: e.target.value }))} />
            <Input label="X / Twitter handle" value={String(defs.seoTwitterHandle ?? "")} placeholder="@yukizi"
              onChange={(e) => setDefs((d) => ({ ...d, seoTwitterHandle: e.target.value }))} />
            <Input label="Browser theme colour" value={String(defs.seoThemeColor ?? "")} placeholder="#562996"
              onChange={(e) => setDefs((d) => ({ ...d, seoThemeColor: e.target.value }))} />
          </div>
          <Button onClick={saveDefaults} loading={defsSaving} disabled={defsSaving}>Save defaults</Button>
        </motion.div>

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
              {META_EDITOR_ENTITY_TYPES.map((t) => <TypeRow key={t} type={t} />)}
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
