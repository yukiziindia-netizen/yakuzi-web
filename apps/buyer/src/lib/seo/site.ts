// Central SEO constants. NEXT_PUBLIC_SITE_URL must be set per environment
// (dev: https://dev.yukizi.com, prod: the production domain) — falls back to dev.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.yukizi.com').replace(/\/$/, '');
export const SITE_NAME = 'Yukizi';
export const SITE_TAGLINE = 'Anime, Manga & Collectibles Marketplace';
export const SITE_DESCRIPTION =
  'Shop authentic anime figures, manga, action figures, trading cards and pop-culture collectibles from verified sellers across India on Yukizi.';
export const ORG_LEGAL_NAME = 'Yukizi Market Private Limited';
export const SUPPORT_EMAIL = 'support@yukizi.com';
export const DEFAULT_OG_IMAGE = '/YukiziLogo.png';

export function absoluteUrl(path: string): string {
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
