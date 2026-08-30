import { COMPANY } from '@/config/company';

// Central SEO constants. NEXT_PUBLIC_SITE_URL must be set per environment
// (dev: https://dev.yukizi.com, prod: the production domain, INCLUDING the scheme) — falls back to dev.
const DEV_SITE_URL = 'https://dev.yukizi.com';
const rawSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || DEV_SITE_URL).replace(/\/$/, '');

function isValidAbsoluteUrl(candidate: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(candidate);
    return true;
  } catch {
    return false;
  }
}

// `metadataBase: new URL(SITE_URL)` runs at module load in the root layout — a malformed
// env value (e.g. missing "https://") must never throw and crash every render.
export const SITE_URL = isValidAbsoluteUrl(rawSiteUrl) ? rawSiteUrl : DEV_SITE_URL;

if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SITE_URL) {
  console.warn('[seo] NEXT_PUBLIC_SITE_URL is not set — canonicals and JSON-LD will point at the dev domain');
} else if (process.env.NEXT_PUBLIC_SITE_URL && SITE_URL !== rawSiteUrl) {
  console.warn(`[seo] NEXT_PUBLIC_SITE_URL="${process.env.NEXT_PUBLIC_SITE_URL}" is not a valid absolute URL (needs a scheme, e.g. https://) — falling back to ${DEV_SITE_URL}`);
}
export const SITE_NAME = 'Yukizi';
export const SITE_TAGLINE = 'Anime, Manga & Collectibles Marketplace';
export const SITE_DESCRIPTION =
  'Shop authentic anime figures, manga, action figures, trading cards and pop-culture collectibles from verified sellers across India on Yukizi.';
// Sourced from the single COMPANY config (not a second hardcoded copy) so
// this can't drift from the legal name shown on the About/Contact/policy
// pages again - it already had, silently, until 19 August 2026.
export const ORG_LEGAL_NAME = COMPANY.legalName;
export const SUPPORT_EMAIL = 'support@yukizi.com';
// 1200x630 branded share card (logo + mascot + tagline). The old value was
// the raw square logo, which platforms crop/squish in link previews.
export const DEFAULT_OG_IMAGE = '/og-default.png';

export function absoluteUrl(path: string): string {
  if (path.startsWith('//')) return `https:${path}`;
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Trim to a max length on a word boundary for meta descriptions. */
export function metaTruncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 40))}…`;
}
