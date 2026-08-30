import type { Metadata } from 'next';
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
async function fetchVerificationTokens(): Promise<{ google?: string; bing?: string }> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  if (!base) return {};
  try {
    const res = await Promise.race([
      fetch(`${base}/config/platform`, { next: { revalidate: 600 } }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
    ]);
    if (!res || !res.ok) return {};
    const body = (await res.json().catch(() => null)) as {
      data?: { googleSiteVerification?: string; bingSiteVerification?: string };
    } | null;
    return {
      google: body?.data?.googleSiteVerification?.trim() || undefined,
      bing: body?.data?.bingSiteVerification?.trim() || undefined,
    };
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const tokens = await fetchVerificationTokens();
  const google = tokens.google || process.env.GOOGLE_SITE_VERIFICATION;
  const bing = tokens.bing || process.env.BING_SITE_VERIFICATION;
  return {
    ...baseMetadata,
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
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: { card: 'summary_large_image' },
  // Animated mascot favicon (the tab previously had no icon at all).
  // Firefox animates GIF favicons; Chrome/Safari show the first frame.
  icons: { icon: [{ url: '/favicon.gif', type: 'image/gif' }] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
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
