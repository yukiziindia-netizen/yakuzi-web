"use client";
import { useEffect, useState } from "react";
import { History, RotateCcw, Save } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, Input, Modal, Select, Skeleton, Tabs, Textarea } from "@/components/ui";
import { useRestoreSeoRevision, useSeoRevisions, useSeoProductSlug, useUpdateSeoProductSlug, useUpsertSeoMeta } from "@/hooks/useSeo";
import type { SeoEntityType, SeoFaqEntry, SeoMetaRecord, UpsertSeoMetaPayload } from "@/api/seo.api";
import { CharCounter, OgPreview, ScoreChip, SerpPreview } from "./serp-preview";
import { ChipsInput } from "./chips-input";
import { FaqEditor } from "./faq-editor";
import { EntityPicker, ENTITY_TYPE_LABELS } from "./entity-picker";
import { META_EDITOR_ENTITY_TYPES } from "@/api/seo.api";

const ROBOTS_PRESETS = ["", "index,follow", "noindex,follow", "noindex,nofollow"];

/** Mirrors the backend's normalizeSlug: lowercase, non-alphanumerics → single hyphens. */
function normalizeSlugInput(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-{2,}/g, "-");
}

/** Rough storefront path per type, purely for the previews. */
function previewPath(type: SeoEntityType, entityId: string): string {
  switch (type) {
    case "HOMEPAGE": return "/";
    case "PRODUCT": return "/products/…";
    case "CATEGORY": case "SUB_CATEGORY": case "COLLECTION": return "/category/…";
    case "BLOG_POST": return "/blogs/…";
    default: return entityId.startsWith("/") ? entityId : `/${entityId}`;
  }
}

interface FormState {
  title: string; description: string; canonicalUrl: string;
  ogTitle: string; ogDescription: string; ogImageUrl: string; twitterCard: string; robots: string;
  focusKeyword: string; secondaryKeywords: string[]; entityDescription: string; aiSummary: string;
  faq: SeoFaqEntry[]; structuredDataJson: string; imageAltJson: string;
}

function toForm(record?: SeoMetaRecord | null): FormState {
  return {
    title: record?.title ?? "",
    description: record?.description ?? "",
    canonicalUrl: record?.canonicalUrl ?? "",
    ogTitle: record?.ogTitle ?? "",
    ogDescription: record?.ogDescription ?? "",
    ogImageUrl: record?.ogImageUrl ?? "",
    twitterCard: record?.twitterCard ?? "summary_large_image",
    robots: record?.robots ?? "",
    focusKeyword: record?.focusKeyword ?? "",
    secondaryKeywords: record?.secondaryKeywords ?? [],
    entityDescription: record?.entityDescription ?? "",
    aiSummary: record?.aiSummary ?? "",
    faq: Array.isArray(record?.faq) ? (record?.faq as SeoFaqEntry[]) : [],
    structuredDataJson: record?.structuredDataOverride ? JSON.stringify(record.structuredDataOverride, null, 2) : "",
    imageAltJson: record?.imageAltOverrides ? JSON.stringify(record.imageAltOverrides, null, 2) : "",
  };
}

const TABS = [
  { label: "Basics", value: "basic" },
  { label: "Social", value: "social" },
  { label: "Keywords & AI", value: "ai" },
  { label: "FAQ", value: "faq" },
  { label: "Advanced", value: "advanced" },
];

export function MetaEditor({ open, onClose, record, presetType, presetId }: {
  open: boolean;
  onClose: () => void;
  /** Existing record to edit; null/undefined = create flow with the entity picker. */
  record?: SeoMetaRecord | null;
  presetType?: SeoEntityType;
  presetId?: string;
}) {
  const upsert = useUpsertSeoMeta();
  const restore = useRestoreSeoRevision();

  const [tab, setTab] = useState("basic");
  const [entityType, setEntityType] = useState<SeoEntityType>(record?.entityType ?? presetType ?? "STATIC_PAGE");
  const [entityId, setEntityId] = useState(record?.entityId ?? presetId ?? "");
  const [entityLabel, setEntityLabel] = useState<string>("");
  const [form, setForm] = useState<FormState>(() => toForm(record));
  const [savedRecord, setSavedRecord] = useState<SeoMetaRecord | null>(record ?? null);
  const [showHistory, setShowHistory] = useState(false);

  // The product's REAL URL slug — unlike everything else in this editor it is
  // not SeoMeta; it lives on the catalog product and changes the live URL.
  const isProduct = entityType === "PRODUCT" && !!entityId.trim();
  const { data: slugInfo, isError: slugLoadFailed } = useSeoProductSlug(open && isProduct ? entityId : undefined);
  const updateSlug = useUpdateSeoProductSlug();
  const [slugDraft, setSlugDraft] = useState("");
  // 301 the old URL to the new one on slug change. Default ON - opting out
  // is for URLs that were never shared/indexed.
  const [slugRedirect, setSlugRedirect] = useState(true);

  useEffect(() => {
    setSlugDraft(slugInfo?.slug ?? "");
  }, [slugInfo, entityId]);

  // Re-seed when the modal opens on a different record.
  useEffect(() => {
    if (!open) return;
    setTab("basic");
    setSlugRedirect(true);
    setShowHistory(false);
    setEntityType(record?.entityType ?? presetType ?? "STATIC_PAGE");
    setEntityId(record?.entityId ?? presetId ?? (presetType === "HOMEPAGE" ? "/" : ""));
    setEntityLabel("");
    setForm(toForm(record));
    setSavedRecord(record ?? null);
  }, [open, record, presetType, presetId]);

  const { data: revisions, isLoading: revisionsLoading } = useSeoRevisions(showHistory ? savedRecord?.id : undefined);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!entityId.trim()) { toast.error("Pick the page/entity this record is for first."); return; }

    let structuredDataOverride: Record<string, unknown> | undefined;
    if (form.structuredDataJson.trim()) {
      try {
        const parsed = JSON.parse(form.structuredDataJson);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
        structuredDataOverride = parsed;
      } catch { toast.error("Structured data override must be a valid JSON object."); setTab("advanced"); return; }
    }
    let imageAltOverrides: Record<string, string> | undefined;
    if (form.imageAltJson.trim()) {
      try {
        const parsed = JSON.parse(form.imageAltJson);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
        imageAltOverrides = parsed;
      } catch { toast.error('Image ALT overrides must be a JSON object like {"image-url": "alt text"}.'); setTab("advanced"); return; }
    }

    const payload: UpsertSeoMetaPayload = {
      entityType,
      entityId: entityId.trim(),
      title: form.title,
      description: form.description,
      canonicalUrl: form.canonicalUrl,
      ogTitle: form.ogTitle,
      ogDescription: form.ogDescription,
      ogImageUrl: form.ogImageUrl,
      twitterCard: form.twitterCard,
      robots: form.robots,
      focusKeyword: form.focusKeyword,
      secondaryKeywords: form.secondaryKeywords,
      entityDescription: form.entityDescription,
      aiSummary: form.aiSummary,
      faq: form.faq.filter((f) => f.question.trim() && f.answer.trim()),
      ...(structuredDataOverride !== undefined && { structuredDataOverride }),
      ...(imageAltOverrides !== undefined && { imageAltOverrides }),
    };

    // The URL slug is not SeoMeta — it changes the product's real URL. Apply
    // it first so a rejected slug (taken/invalid) stops the save while the
    // admin can still see and fix it, instead of half-saving silently.
    const trimmedSlug = slugDraft.trim().replace(/(^-|-$)+/g, "");
    // If the admin typed a slug but the product's current slug never loaded,
    // refuse to save rather than silently skipping the URL change — that
    // silent skip is indistinguishable from "the URL feature doesn't work".
    if (isProduct && trimmedSlug && !slugInfo) {
      toast.error(
        "The product's current URL could not be loaded, so the URL slug was NOT changed. Check the entity id is a catalog product and try again."
      );
      setTab("basic");
      return;
    }
    if (isProduct && slugInfo && trimmedSlug && trimmedSlug !== (slugInfo.slug ?? "")) {
      try {
        await updateSlug.mutateAsync({ id: entityId.trim(), slug: trimmedSlug, createRedirect: slugRedirect });
        toast.success(
          slugRedirect
            ? "Product URL updated — the old URL now redirects to the new one."
            : "Product URL updated — no redirect was created from the old URL.",
        );
      } catch (e: any) {
        toast.error(e?.response?.data?.message ?? "Could not update the product URL slug.");
        setTab("basic");
        return;
      }
    }

    try {
      const saved = await upsert.mutateAsync(payload);
      setSavedRecord(saved);
      toast.success(`Saved — SEO ${saved.seoScore ?? "—"} · AI ${saved.aiVisibilityScore ?? "—"} · Readability ${saved.readabilityScore ?? "—"}`);
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not save SEO metadata.");
    }
  };

  const handleRestore = async (revisionId: string) => {
    if (!savedRecord?.id) return;
    if (!window.confirm("Restore this revision? Current values become a new revision.")) return;
    try {
      const restored = await restore.mutateAsync({ metaId: savedRecord.id, revisionId });
      setSavedRecord(restored);
      setForm(toForm(restored));
      setShowHistory(false);
      toast.success("Revision restored.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not restore the revision.");
    }
  };

  const title = record
    ? `Edit SEO — ${ENTITY_TYPE_LABELS[record.entityType]}`
    : "New SEO override";

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-4xl">
      <div className="space-y-5">
        {/* Entity selection (locked for existing records) */}
        {record ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="purple">{ENTITY_TYPE_LABELS[record.entityType]}</Badge>
            <code className="rounded bg-muted px-2 py-0.5 text-xs">{record.entityId}</code>
            <span className="ml-auto flex gap-1.5">
              <ScoreChip label="SEO" value={savedRecord?.seoScore} />
              <ScoreChip label="AI" value={savedRecord?.aiVisibilityScore} />
              <ScoreChip label="Read" value={savedRecord?.readabilityScore} />
            </span>
          </div>
        ) : (
          <EntityPicker
            type={entityType}
            entityId={entityId}
            onTypeChange={setEntityType}
            onSelect={(id, label) => { setEntityId(id); if (label) setEntityLabel(label); }}
            // Products are edited on their own add/edit pages (same SeoMeta
            // record) — not offered here to keep one editing surface per thing.
            types={META_EDITOR_ENTITY_TYPES}
          />
        )}
        {!record && entityId && (
          <p className="text-xs text-muted-foreground">
            Editing: <span className="font-medium text-foreground">{entityLabel || entityId}</span>
          </p>
        )}

        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "basic" && (
          <div className="space-y-4">
            {isProduct && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">URL slug</label>
                <Input
                  placeholder={slugInfo ? "e.g. dragon-ball-goku-figurine" : slugLoadFailed ? "Could not load" : "Loading…"}
                  value={slugDraft}
                  onChange={(e) => setSlugDraft(normalizeSlugInput(e.target.value))}
                  disabled={!slugInfo}
                />
                {slugLoadFailed && (
                  <p className="text-xs text-red-500">
                    Could not load this product&apos;s current URL — the entity id must be a catalog product id
                    (pick the product from the list when creating the record). The URL cannot be changed until this loads.
                  </p>
                )}
                {slugInfo?.slug && slugDraft.replace(/(^-|-$)+/g, "") !== slugInfo.slug && (
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slugRedirect}
                      onChange={(e) => setSlugRedirect(e.target.checked)}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    Redirect the old URL to the new one (recommended — keeps Google results and shared links working)
                  </label>
                )}
                <p className="text-xs text-muted-foreground">
                  This is the product's REAL address: <span className="font-medium text-foreground">yukizi.com/products/{slugDraft.replace(/(^-|-$)+/g, "") || "…"}</span>
                  {slugInfo?.slug && slugDraft.replace(/(^-|-$)+/g, "") !== slugInfo.slug && (
                    <> — saving redirects the old URL here automatically.</>
                  )}
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">SEO title</label>
                <CharCounter value={form.title} max={60} />
              </div>
              <Input maxLength={60} placeholder="Leave blank to keep the generated title" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">Meta description</label>
                <CharCounter value={form.description} max={160} />
              </div>
              <Textarea maxLength={160} rows={3} placeholder="Leave blank to keep the generated description" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Input label="Canonical URL" placeholder="https://yukizi.com/…" value={form.canonicalUrl} onChange={(e) => set("canonicalUrl", e.target.value)} />
                {entityType === "PRODUCT" && (
                  <p className="text-xs text-muted-foreground">
                    This only sets the SEO canonical tag. To change the page's actual URL, use the URL slug field at the top of this tab.
                  </p>
                )}
              </div>
              <Select label="Robots" value={form.robots} onChange={(e) => set("robots", e.target.value)}>
                {ROBOTS_PRESETS.map((r) => <option key={r} value={r}>{r === "" ? "Default (index,follow)" : r}</option>)}
              </Select>
            </div>
            <SerpPreview title={form.title} description={form.description} path={previewPath(entityType, entityId)} />
          </div>
        )}

        {tab === "social" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-foreground">OG title</label>
                    <CharCounter value={form.ogTitle} max={95} />
                  </div>
                  <Input maxLength={95} placeholder="Falls back to the SEO title" value={form.ogTitle} onChange={(e) => set("ogTitle", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-foreground">OG description</label>
                    <CharCounter value={form.ogDescription} max={200} />
                  </div>
                  <Textarea maxLength={200} rows={3} placeholder="Falls back to the meta description" value={form.ogDescription} onChange={(e) => set("ogDescription", e.target.value)} />
                </div>
                <Input label="OG image URL" placeholder="https://…/share.jpg (1200×630)" value={form.ogImageUrl} onChange={(e) => set("ogImageUrl", e.target.value)} />
                <Select label="Twitter card" value={form.twitterCard} onChange={(e) => set("twitterCard", e.target.value)}>
                  <option value="summary_large_image">summary_large_image</option>
                  <option value="summary">summary</option>
                </Select>
              </div>
              <div className="flex items-start justify-center pt-2">
                <OgPreview
                  title={form.ogTitle || form.title}
                  description={form.ogDescription || form.description}
                  imageUrl={form.ogImageUrl}
                  path={previewPath(entityType, entityId)}
                />
              </div>
            </div>
          </div>
        )}

        {tab === "ai" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Focus keyword" placeholder="e.g. anime figures" value={form.focusKeyword} onChange={(e) => set("focusKeyword", e.target.value)} />
              <div className="pt-0.5">
                <ChipsInput label="Secondary keywords" values={form.secondaryKeywords} onChange={(v) => set("secondaryKeywords", v)} placeholder="Type and press Enter" />
              </div>
            </div>
            <Textarea label="Entity description" rows={3}
              placeholder="Factual description of this entity, written for knowledge graphs (who/what it is, consistent naming)."
              value={form.entityDescription} onChange={(e) => set("entityDescription", e.target.value)} />
            <Textarea label="AI summary" rows={4}
              placeholder="Concise, factual summary for AI search engines (ChatGPT, Gemini, Perplexity…). Plain statements, no marketing fluff."
              value={form.aiSummary} onChange={(e) => set("aiSummary", e.target.value)} />
          </div>
        )}

        {tab === "faq" && <FaqEditor value={form.faq} onChange={(v) => set("faq", v)} />}

        {tab === "advanced" && (
          <div className="space-y-4">
            <Textarea label="Structured data override (JSON object)" rows={6} className="font-mono text-xs"
              placeholder='{"@type": "Product", "brand": {"@type": "Brand", "name": "…"}} — merged over the generated JSON-LD'
              value={form.structuredDataJson} onChange={(e) => set("structuredDataJson", e.target.value)} />
            <Textarea label="Image ALT overrides (JSON object)" rows={4} className="font-mono text-xs"
              placeholder='{"https://…/image1.jpg": "Descriptive alt text"}'
              value={form.imageAltJson} onChange={(e) => set("imageAltJson", e.target.value)} />
          </div>
        )}

        {/* Revision history */}
        {savedRecord?.id && (
          <div className="rounded-xl border border-border/60">
            <button type="button" onClick={() => setShowHistory((s) => !s)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors rounded-xl">
              <History className="h-4 w-4 text-muted-foreground" />
              Version history
              <span className="ml-auto text-xs text-muted-foreground">{showHistory ? "Hide" : "Show"}</span>
            </button>
            {showHistory && (
              <div className="border-t border-border/60 max-h-48 overflow-y-auto divide-y divide-border/40">
                {revisionsLoading && <div className="p-3"><Skeleton className="h-5 w-full" /></div>}
                {!revisionsLoading && (revisions ?? []).length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">No previous versions yet — a revision is stored on every save.</p>
                )}
                {(revisions ?? []).map((rev) => (
                  <div key={rev.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                    <span className="text-foreground">{new Date(rev.createdAt).toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground truncate flex-1">
                      {(rev.snapshot?.title as string) || "(no title)"}
                    </span>
                    <Button variant="ghost" size="xs" leftIcon={<RotateCcw className="h-3 w-3" />}
                      loading={restore.isPending} onClick={() => handleRestore(rev.id)}>
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button leftIcon={<Save className="h-4 w-4" />} loading={upsert.isPending} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
