"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Save } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Input, Select, Skeleton, Tabs, Textarea } from "@/components/ui";
import { useSeoMetaOne, useUpsertSeoMeta } from "@/hooks/useSeo";
import { CharCounter, OgPreview, ScoreChip, SerpPreview } from "./serp-preview";
import { ChipsInput } from "./chips-input";
import { FaqEditor } from "./faq-editor";
import type { SeoFaqEntry, SeoMetaRecord, UpsertSeoMetaPayload } from "@/api/seo.api";

/**
 * Inline product-SEO form used by the Add/Edit Product pages. Writes the SAME
 * SeoMeta record as the SEO tab's editor (PUT /admin/seo/meta with
 * entityType=PRODUCT + the catalog id), so both surfaces always show the
 * same data. The modal editor in meta-editor.tsx is intentionally untouched.
 */

export interface ProductSeoForm {
  title: string;
  description: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  twitterCard: string;
  robots: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  entityDescription: string;
  aiSummary: string;
  faq: SeoFaqEntry[];
  structuredDataJson: string;
  imageAltJson: string;
}

export function emptyProductSeoForm(): ProductSeoForm {
  return {
    title: "", description: "", canonicalUrl: "", ogTitle: "", ogDescription: "",
    ogImageUrl: "", twitterCard: "summary_large_image", robots: "", focusKeyword: "",
    secondaryKeywords: [], entityDescription: "", aiSummary: "", faq: [],
    structuredDataJson: "", imageAltJson: "",
  };
}

export function productSeoFormFromRecord(record: SeoMetaRecord | null | undefined): ProductSeoForm {
  if (!record) return emptyProductSeoForm();
  return {
    title: record.title ?? "",
    description: record.description ?? "",
    canonicalUrl: record.canonicalUrl ?? "",
    ogTitle: record.ogTitle ?? "",
    ogDescription: record.ogDescription ?? "",
    ogImageUrl: record.ogImageUrl ?? "",
    twitterCard: record.twitterCard ?? "summary_large_image",
    robots: record.robots ?? "",
    focusKeyword: record.focusKeyword ?? "",
    secondaryKeywords: record.secondaryKeywords ?? [],
    entityDescription: record.entityDescription ?? "",
    aiSummary: record.aiSummary ?? "",
    faq: Array.isArray(record.faq) ? record.faq : [],
    structuredDataJson: record.structuredDataOverride ? JSON.stringify(record.structuredDataOverride, null, 2) : "",
    imageAltJson: record.imageAltOverrides ? JSON.stringify(record.imageAltOverrides, null, 2) : "",
  };
}

/** True when the admin typed anything worth saving. */
export function productSeoFormHasContent(form: ProductSeoForm): boolean {
  const empty = emptyProductSeoForm();
  return (Object.keys(empty) as Array<keyof ProductSeoForm>).some((k) => {
    const v = form[k];
    if (Array.isArray(v)) return v.length > 0;
    return typeof v === "string" && v.trim() !== "" && v !== empty[k];
  });
}

/**
 * Builds the upsert payload; returns null (with a toast) when a JSON field is
 * invalid so callers can abort the save.
 */
export function productSeoFormToPayload(
  form: ProductSeoForm,
  entityId: string,
  // The form is entity-agnostic; collections reuse it with their own type.
  entityType: UpsertSeoMetaPayload["entityType"] = "PRODUCT",
): UpsertSeoMetaPayload | null {
  let structuredDataOverride: Record<string, unknown> | undefined;
  if (form.structuredDataJson.trim()) {
    try {
      const parsed = JSON.parse(form.structuredDataJson);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
      structuredDataOverride = parsed;
    } catch { toast.error("SEO: structured data override must be a valid JSON object."); return null; }
  }
  let imageAltOverrides: Record<string, string> | undefined;
  if (form.imageAltJson.trim()) {
    try {
      const parsed = JSON.parse(form.imageAltJson);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
      imageAltOverrides = parsed;
    } catch { toast.error('SEO: image ALT overrides must be a JSON object like {"image-url": "alt"}.'); return null; }
  }
  return {
    entityType,
    entityId,
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
}

/**
 * Self-contained SEO card for the product EDIT page: loads the product's
 * existing SeoMeta record (the one the SEO tab edits), saves with its own
 * button, shows the recomputed scores.
 */
export function ProductSeoSection({ catalogProductId, productName, slug, images }: {
  catalogProductId: string;
  productName?: string;
  slug?: string | null;
  /** Current product image URLs — enables the per-image alt editor. */
  images?: string[];
}) {
  const { data: record, isLoading } = useSeoMetaOne("PRODUCT", catalogProductId);
  const upsert = useUpsertSeoMeta();
  const [form, setForm] = useState<ProductSeoForm>(emptyProductSeoForm());
  const [seeded, setSeeded] = useState(false);
  const [scores, setScores] = useState<SeoMetaRecord | null>(null);

  useEffect(() => {
    if (!isLoading && !seeded) {
      setForm(productSeoFormFromRecord(record));
      setScores(record ?? null);
      setSeeded(true);
    }
  }, [isLoading, record, seeded]);

  const handleSave = async () => {
    const payload = productSeoFormToPayload(form, catalogProductId);
    if (!payload) return;
    try {
      const saved = await upsert.mutateAsync(payload);
      setScores(saved);
      toast.success(`SEO saved — SEO ${saved.seoScore ?? "—"} · AI ${saved.aiVisibilityScore ?? "—"} · Readability ${saved.readabilityScore ?? "—"}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not save SEO.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">Search engine optimization</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Same record as the SEO tab — edits here appear there and vice versa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ScoreChip label="SEO" value={scores?.seoScore} />
          <ScoreChip label="AI" value={scores?.aiVisibilityScore} />
          <ScoreChip label="Read" value={scores?.readabilityScore} />
          <Button size="sm" leftIcon={<Save className="h-3.5 w-3.5" />} loading={upsert.isPending} onClick={handleSave}>
            Save SEO
          </Button>
        </div>
      </div>
      {!seeded ? <Skeleton className="h-40 w-full" /> : (
        <ProductSeoFields value={form} onChange={setForm} productName={productName} slug={slug ?? undefined} images={images} />
      )}
    </motion.div>
  );
}

const TABS = [
  { label: "Basics", value: "basic" },
  { label: "Social", value: "social" },
  { label: "Keywords & AI", value: "ai" },
  { label: "FAQ", value: "faq" },
  { label: "Advanced", value: "advanced" },
];

const ROBOTS_PRESETS = ["", "index,follow", "noindex,follow", "noindex,nofollow"];

export function ProductSeoFields({ value, onChange, productName, slug, previewPath: previewPathProp, entityLabel = "product", images, onRenameImage }: {
  value: ProductSeoForm;
  onChange: (next: ProductSeoForm) => void;
  /** Used for preview fallbacks so the SERP card reflects the product being edited. */
  productName?: string;
  slug?: string;
  /** Overrides the SERP-preview path (non-product entities). */
  previewPath?: string;
  /** Wording in hints; "product" keeps the original copy. */
  entityLabel?: string;
  /** Image URLs for the per-image alt editor (Advanced tab). */
  images?: string[];
  /**
   * When provided, each image row offers a filename rename. Must return the
   * new URL on success (the row migrates its alt override to it) or null.
   */
  onRenameImage?: (url: string, newName: string) => Promise<string | null>;
}) {
  const [tab, setTab] = useState("basic");
  const set = <K extends keyof ProductSeoForm>(key: K, v: ProductSeoForm[K]) => onChange({ ...value, [key]: v });
  const previewPath = previewPathProp ?? (slug ? `/products/${slug}` : "/products/…");

  // Friendly per-image alt editing over the same imageAltJson the record
  // stores — one source of truth, no drift with the raw JSON field.
  const altMap = useMemo<Record<string, string>>(() => {
    try {
      const parsed = JSON.parse(value.imageAltJson || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }, [value.imageAltJson]);
  const setImageAlt = (url: string, alt: string) => {
    const next: Record<string, string> = { ...altMap };
    if (alt.trim()) next[url] = alt;
    else delete next[url];
    set("imageAltJson", Object.keys(next).length ? JSON.stringify(next, null, 2) : "");
  };
  const fileNameOf = (url: string) => {
    try { return decodeURIComponent(url.split("/").pop() || url); } catch { return url; }
  };
  const [renameFor, setRenameFor] = useState<{ url: string; draft: string } | null>(null);
  const [renameBusy, setRenameBusy] = useState(false);
  const submitRename = async () => {
    if (!renameFor || !onRenameImage || renameBusy) return;
    setRenameBusy(true);
    try {
      const newUrl = await onRenameImage(renameFor.url, renameFor.draft);
      if (newUrl && newUrl !== renameFor.url) {
        // Follow the rename in the alt map in ONE write (two setImageAlt
        // calls would race on the same value prop).
        const alt = altMap[renameFor.url];
        if (alt) {
          const next = { ...altMap };
          delete next[renameFor.url];
          next[newUrl] = alt;
          set("imageAltJson", JSON.stringify(next, null, 2));
        }
      }
      if (newUrl) setRenameFor(null);
    } finally {
      setRenameBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "basic" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">SEO title</label>
              <CharCounter value={value.title} max={60} />
            </div>
            <Input maxLength={60} placeholder={productName ? `Defaults to "${productName.slice(0, 40)}"` : "Leave blank to use the product name"}
              value={value.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">Meta description</label>
              <CharCounter value={value.description} max={160} />
            </div>
            <Textarea maxLength={160} rows={3} placeholder="Leave blank to use the product description"
              value={value.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Input label="Canonical URL (advanced)" placeholder="Almost always leave empty"
                value={value.canonicalUrl} onChange={(e) => set("canonicalUrl", e.target.value)} />
              <p className="text-[11px] text-muted-foreground">
                Invisible duplicate-content hint for Google — does NOT change the page URL{entityLabel === "product" ? " — use the product's URL slug for that" : ""}.
              </p>
            </div>
            <Select label="Robots" value={value.robots} onChange={(e) => set("robots", e.target.value)}>
              {ROBOTS_PRESETS.map((r) => <option key={r} value={r}>{r === "" ? "Default (index,follow)" : r}</option>)}
            </Select>
          </div>
          <SerpPreview title={value.title || productName} description={value.description} path={previewPath} />
        </div>
      )}

      {tab === "social" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">OG title</label>
                <CharCounter value={value.ogTitle} max={95} />
              </div>
              <Input maxLength={95} placeholder="Falls back to the SEO title" value={value.ogTitle} onChange={(e) => set("ogTitle", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">OG description</label>
                <CharCounter value={value.ogDescription} max={200} />
              </div>
              <Textarea maxLength={200} rows={3} placeholder="Falls back to the meta description"
                value={value.ogDescription} onChange={(e) => set("ogDescription", e.target.value)} />
            </div>
            <Input label="OG image URL" placeholder="https://…/share.jpg (1200×630)" value={value.ogImageUrl} onChange={(e) => set("ogImageUrl", e.target.value)} />
            <Select label="Twitter card" value={value.twitterCard} onChange={(e) => set("twitterCard", e.target.value)}>
              <option value="summary_large_image">summary_large_image</option>
              <option value="summary">summary</option>
            </Select>
          </div>
          <div className="flex items-start justify-center pt-2">
            <OgPreview title={value.ogTitle || value.title || productName} description={value.ogDescription || value.description}
              imageUrl={value.ogImageUrl} path={previewPath} />
          </div>
        </div>
      )}

      {tab === "ai" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Focus keyword" placeholder="e.g. iron man figurine" value={value.focusKeyword} onChange={(e) => set("focusKeyword", e.target.value)} />
            <div className="pt-0.5">
              <ChipsInput label="Secondary keywords" values={value.secondaryKeywords} onChange={(v) => set("secondaryKeywords", v)} placeholder="Type and press Enter" />
            </div>
          </div>
          <Textarea label="Entity description" rows={3}
            placeholder="Factual description of this product for knowledge graphs (what it is, brand, series, material)."
            value={value.entityDescription} onChange={(e) => set("entityDescription", e.target.value)} />
          <Textarea label="AI summary" rows={4}
            placeholder="Concise, factual summary for AI search engines (ChatGPT, Gemini, Perplexity…). Plain statements, no marketing fluff."
            value={value.aiSummary} onChange={(e) => set("aiSummary", e.target.value)} />
        </div>
      )}

      {tab === "faq" && <FaqEditor value={value.faq} onChange={(v) => set("faq", v)} />}

      {tab === "advanced" && (
        <div className="space-y-4">
          <Textarea label="Structured data override (JSON object)" rows={5} className="font-mono text-xs"
            placeholder='{"brand": {"@type": "Brand", "name": "…"}} — merged over the generated product JSON-LD'
            value={value.structuredDataJson} onChange={(e) => set("structuredDataJson", e.target.value)} />
          {images && images.length > 0 ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Image alt text</label>
              <p className="text-xs text-muted-foreground -mt-1">
                Blank = automatic (&quot;{productName || "product name"} - Yukizi&quot;). Type to override per image.
              </p>
              {images.map((url) => (
                <div key={url} className="flex items-center gap-3 rounded-xl border border-border p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-12 w-12 rounded-lg object-contain bg-white shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Input
                      placeholder={`Automatic: ${productName ? `${productName} - Yukizi` : "<name> - Yukizi"}`}
                      value={altMap[url] ?? ""}
                      onChange={(e) => setImageAlt(url, e.target.value)}
                    />
                    {renameFor?.url === url ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={renameFor.draft}
                          onChange={(e) => setRenameFor({ url, draft: e.target.value })}
                          placeholder="new-file-name (extension is kept)"
                        />
                        <Button type="button" size="sm" loading={renameBusy} onClick={submitRename}>Rename</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setRenameFor(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <p className="text-2xs text-muted-foreground truncate mt-1" title={url}>
                        {fileNameOf(url)}
                        {onRenameImage && (
                          <button type="button" className="ml-2 text-primary hover:underline" onClick={() => {
                            const base = fileNameOf(url);
                            const dot = base.lastIndexOf(".");
                            setRenameFor({ url, draft: dot > -1 ? base.slice(0, dot) : base });
                          }}>
                            Rename file
                          </button>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Textarea label="Image ALT overrides (JSON object)" rows={4} className="font-mono text-xs"
              placeholder='{"https://…/image1.jpg": "Descriptive alt text"}'
              value={value.imageAltJson} onChange={(e) => set("imageAltJson", e.target.value)} />
          )}
        </div>
      )}
    </div>
  );
}
