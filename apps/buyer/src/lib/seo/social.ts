/**
 * Admin-set social profile URLs (Admin -> SEO -> Social profiles).
 *
 * Used in two places that must never disagree: the storefront footer links
 * and the Organization schema's sameAs. Fail-open and revalidating, like
 * every other settings read here — a settings outage costs the icons, never
 * the page.
 */
export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  x?: string;
  discord?: string;
  linkedin?: string;
  whatsapp?: string;
}

export async function fetchSocialLinks(): Promise<SocialLinks> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  if (!base) return {};
  try {
    const res = await Promise.race([
      fetch(`${base}/config/platform`, { next: { revalidate: 600 } }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
    ]);
    if (!res || !res.ok) return {};
    const body = (await res.json().catch(() => null)) as {
      data?: Record<string, string | undefined>;
    } | null;
    const d = body?.data ?? {};
    const pick = (k: string) => d[k]?.trim() || undefined;
    return {
      instagram: pick('socialInstagram'),
      facebook: pick('socialFacebook'),
      youtube: pick('socialYoutube'),
      x: pick('socialX'),
      discord: pick('socialDiscord'),
      linkedin: pick('socialLinkedin'),
      whatsapp: pick('socialWhatsapp'),
    };
  } catch {
    return {};
  }
}

/** Just the URLs that are set — the exact list schema.org sameAs wants. */
export function socialUrlList(links: SocialLinks): string[] {
  return Object.values(links).filter((v): v is string => !!v);
}
