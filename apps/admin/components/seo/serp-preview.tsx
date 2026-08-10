"use client";
import { Globe } from "lucide-react";

const SITE_URL = "https://yukizi.com";

function displayUrl(path?: string | null): string {
  const clean = (path || "/").trim();
  if (/^https?:\/\//.test(clean)) return clean;
  return `${SITE_URL}${clean.startsWith("/") ? clean : `/${clean}`}`;
}

/** Approximation of a Google desktop result. Truncation mirrors Google's ~600px/~160ch cuts. */
export function SerpPreview({ title, description, path }: { title?: string | null; description?: string | null; path?: string | null }) {
  const t = (title || "").trim() || "Page title preview";
  const d = (description || "").trim() || "The meta description will appear here. Keep it within 160 characters so it isn't cut off in results.";
  const url = displayUrl(path);
  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-1" aria-label="Search result preview">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center"><Globe className="h-3.5 w-3.5" /></span>
        <div className="min-w-0">
          <div className="text-foreground/80 leading-tight">Yukizi</div>
          <div className="truncate leading-tight">{url}</div>
        </div>
      </div>
      <p className="text-[#1a0dab] dark:text-blue-400 text-lg leading-snug truncate">{t.slice(0, 70)}{t.length > 70 ? "…" : ""}</p>
      <p className="text-sm text-muted-foreground leading-snug line-clamp-2">{d.slice(0, 170)}{d.length > 170 ? "…" : ""}</p>
    </div>
  );
}

/** Approximation of the large-image OG/Twitter card. */
export function OgPreview({ title, description, imageUrl, path }: {
  title?: string | null; description?: string | null; imageUrl?: string | null; path?: string | null;
}) {
  const t = (title || "").trim() || "Social share title";
  const d = (description || "").trim() || "Social share description preview.";
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-background max-w-md" aria-label="Social share preview">
      <div className="aspect-[1.91/1] bg-muted flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          // Arbitrary admin-entered URL — next/image would need remotePatterns per host.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Open Graph preview" className="w-full h-full object-cover" />
        ) : (
          <Globe className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="p-3 space-y-0.5">
        <p className="text-[11px] uppercase text-muted-foreground truncate">{displayUrl(path).replace(/^https?:\/\//, "")}</p>
        <p className="text-sm font-semibold text-foreground truncate">{t}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{d}</p>
      </div>
    </div>
  );
}

/** n/max counter that flips red past the limit. */
export function CharCounter({ value, max }: { value: string; max: number }) {
  const n = value.length;
  return (
    <span className={n > max ? "text-xs text-red-500 font-medium" : "text-xs text-muted-foreground"}>
      {n}/{max}
    </span>
  );
}

/** 0–100 score chip: green ≥80, yellow ≥50, red below, muted dash when unscored. */
export function ScoreChip({ label, value }: { label: string; value: number | null | undefined }) {
  const cls =
    value == null ? "bg-muted text-muted-foreground border-border"
    : value >= 80 ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
    : value >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
    : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`} title={`${label} score`}>
      {label} {value == null ? "—" : value}
    </span>
  );
}
