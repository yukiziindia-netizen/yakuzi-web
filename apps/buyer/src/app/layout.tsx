import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from './providers';
import SiteFooter from '@/components/shared/SiteFooter';
import { SITE_URL, SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from '@/lib/seo/site';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

/**
 * Admin-pasted verification tokens (Admin → Settings → Search Engine
 * Connections) take precedence over the Vercel env vars; either source
 * renders the same meta tags. Fetch is fail-open with a short timeout and
 * a 10-minute cache — an API blip just falls back to the env values.
 */
async function fetchVerificationTokens(): Promise<{
  google?: string;
  bing?: string;
  titleTemplate?: string;
  description?: string;
  ogImage?: string;
  twitter?: string;
  themeColor?: string;
}> {
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
    return {
      google: body?.data?.googleSiteVerification?.trim() || undefined,
      bing: body?.data?.bingSiteVerification?.trim() || undefined,
      titleTemplate: body?.data?.seoTitleTemplate?.trim() || undefined,
      description: body?.data?.seoDefaultDescription?.trim() || undefined,
      ogImage: body?.data?.seoDefaultOgImage?.trim() || undefined,
      twitter: body?.data?.seoTwitterHandle?.trim() || undefined,
      themeColor: body?.data?.seoThemeColor?.trim() || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * themeColor belongs to the viewport export in Next 14 — putting it on
 * `metadata` is silently ignored (and warned about in dev).
 */
export async function generateViewport(): Promise<Viewport> {
  const tokens = await fetchVerificationTokens();
  return {
    width: 'device-width',
    initialScale: 1,
    ...(tokens.themeColor ? { themeColor: tokens.themeColor } : {}),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const tokens = await fetchVerificationTokens();
  const google = tokens.google || process.env.GOOGLE_SITE_VERIFICATION;
  const bing = tokens.bing || process.env.BING_SITE_VERIFICATION;
  // Admin-set storefront defaults (Admin -> SEO -> Storefront defaults) win
  // over the built-in values; blank means "keep the built-in".
  const og = { ...(baseMetadata.openGraph as Record<string, unknown>) };
  if (tokens.description) og.description = tokens.description;
  if (tokens.ogImage) og.images = [{ url: tokens.ogImage }];
  return {
    ...baseMetadata,
    ...(tokens.description ? { description: tokens.description } : {}),
    ...(tokens.titleTemplate
      ? { title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: tokens.titleTemplate } }
      : {}),
    openGraph: og as typeof baseMetadata.openGraph,
    twitter: {
      ...(baseMetadata.twitter as Record<string, unknown>),
      ...(tokens.twitter ? { site: tokens.twitter, creator: tokens.twitter } : {}),
    } as typeof baseMetadata.twitter,
    verification: {
      ...(google ? { google } : {}),
      ...(bing ? { other: { 'msvalidate.01': bing } } : {}),
    },
  };
}

const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_IN',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
  // Animated mascot favicon (the tab previously had no icon at all).
  // Firefox animates GIF favicons; Chrome/Safari show the first frame.
  icons: { icon: [{ url: '/favicon.gif', type: 'image/gif' }] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Where every page's data and imagery comes from. Without these the first
  // request to each host pays a full DNS lookup and TLS handshake before a
  // single byte of product data or a single image starts downloading — on a
  // mobile connection that is a visible delay on the largest element.
  const apiOrigin = (() => {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      return base ? new URL(base).origin : null;
    } catch {
      return null;
    }
  })();

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {apiOrigin && <link rel="preconnect" href={apiOrigin} crossOrigin="" />}
        <link rel="preconnect" href="https://storage.googleapis.com" crossOrigin="" />
        {/* dns-prefetch as the fallback for anything that ignores preconnect. */}
        {apiOrigin && <link rel="dns-prefetch" href={apiOrigin} />}
        <link rel="dns-prefetch" href="https://storage.googleapis.com" />
      </head>
      <body className={`${inter.className} font-sans`}>
        <Providers>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <div style={{ flex: 1 }}>
              {children}
            </div>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
