import type { Metadata } from 'next';
import { absoluteUrl } from './site';

/**
 * Admin-managed SEO overrides served by `GET /api/seo/meta` (yakuzi-api).
 * Everything here is FAIL-OPEN: until the API ships the endpoint (or when it
 * errors/times out), every helper returns the derived defaults untouched —
 * merging this code before the API change is deliberately a no-op.
 */

export type SeoEntityType =
  | 'PRODUCT'
  | 'CATEGORY'
  | 'SUB_CATEGORY'
  | 'BRAND'
  | 'COLLECTION'
  | 'BLOG_POST'
  | 'STATIC_PAGE'
  | 'HOMEPAGE'
  | 'LANDING_PAGE';

export interface SeoFaqEntry {
  question: string;
  answer: string;
}

export interface SeoOverride {
  title?: string | null;
  description?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  twitterCard?: string | null;
  robots?: string | null;
  aiSummary?: string | null;
  faq?: SeoFaqEntry[] | null;
  structuredDataOverride?: Record<string, unknown> | null;
}

const OVERRIDE_TIMEOUT_MS = 2000;

function apiBase(): string | null {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  return base ? base.replace(/\/$/, '') : null;
}

/**
 * Latency bound WITHOUT AbortSignal: aborting opts a Next 14 fetch out of the
 * data cache, so instead the fetch is raced against a timer — a slow response
 * still completes in the background and lands in the cache for the next hit.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export async function fetchSeoOverride(
  type: SeoEntityType,
  id: string,
): Promise<SeoOverride | null> {
  const base = apiBase();
  if (!base || !id) return null;
  try {
    const res = await withTimeout(
      fetch(`${base}/seo/meta?type=${type}&id=${encodeURIComponent(id)}`, {
        next: { revalidate: 300 },
      }),
      OVERRIDE_TIMEOUT_MS,
    );
    if (!res || !res.ok) return null;
    const body = (await res.json().catch(() => null)) as
      | { data?: SeoOverride | null }
      | null;
    return body?.data ?? null;
  } catch {
    return null;
  }
}

function nonEmpty(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/** Merge an admin override over derived metadata. Only set fields win. */
export function applySeoOverride(base: Metadata, override: SeoOverride | null): Metadata {
  if (!override) return base;

  const out: Metadata = { ...base };
  const og: NonNullable<Metadata['openGraph']> = { ...(base.openGraph ?? {}) };
  const twitter: NonNullable<Metadata['twitter']> = { ...(base.twitter ?? {}) };

  if (nonEmpty(override.title)) {
    out.title = override.title;
    if (!nonEmpty(override.ogTitle)) og.title = override.title;
    twitter.title = override.title;
  }
  if (nonEmpty(override.description)) {
    out.description = override.description;
    if (!nonEmpty(override.ogDescription)) og.description = override.description;
    twitter.description = override.description;
  }
  if (nonEmpty(override.ogTitle)) og.title = override.ogTitle;
  if (nonEmpty(override.ogDescription)) og.description = override.ogDescription;
  if (nonEmpty(override.ogImageUrl)) {
    const url = absoluteUrl(override.ogImageUrl);
    og.images = [{ url }];
    (twitter as { images?: string[] }).images = [url];
  }
  if (nonEmpty(override.twitterCard)) {
    (twitter as { card?: string }).card = override.twitterCard;
  }
  if (nonEmpty(override.canonicalUrl)) {
    out.alternates = {
      ...(base.alternates ?? {}),
      canonical: absoluteUrl(override.canonicalUrl),
    };
  }
  if (nonEmpty(override.robots)) {
    out.robots = override.robots;
  }

  out.openGraph = og;
  out.twitter = twitter;
  return out;
}

/** Shallow-merge an admin structured-data override over generated JSON-LD. */
export function mergeStructuredData(
  generated: Record<string, unknown>,
  override: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!override || typeof override !== 'object' || Array.isArray(override)) {
    return generated;
  }
  return { ...generated, ...override };
}

/** Well-formed FAQ entries only — mirrors the API's faqCount() rules. */
export function validFaqs(faq: SeoOverride['faq']): SeoFaqEntry[] {
  if (!Array.isArray(faq)) return [];
  return faq.filter(
    (f): f is SeoFaqEntry =>
      !!f &&
      typeof f === 'object' &&
      typeof f.question === 'string' &&
      f.question.trim() !== '' &&
      typeof f.answer === 'string' &&
      f.answer.trim() !== '',
  );
}

/**
 * Static pages (about/contact/policies): admin-set STATIC_PAGE overrides
 * (SEO tab, keyed by path) win over the page's hardcoded defaults. Fail-open
 * like everything here; the revalidating fetch means edits appear within
 * ~5 minutes without a deploy.
 */
export async function staticPageMetadata(path: string, derived: Metadata): Promise<Metadata> {
  return applySeoOverride(derived, await fetchSeoOverride('STATIC_PAGE', path));
}
