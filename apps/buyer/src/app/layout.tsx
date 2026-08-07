import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from './providers';
import SiteFooter from '@/components/shared/SiteFooter';
import { SITE_URL, SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from '@/lib/seo/site';

const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans', display: 'swap' });

export const metadata: Metadata = {
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={openSans.variable}>
      <head>
        {/* globals.css / tailwind.config.ts force 'Google Sans' first (!important) across
            nearly all text — this stylesheet is what actually registers that font, live and
            verified serving real @font-face rules today. Removing it changes the site's
            rendered typeface. Left in place; the render-blocking cost is a separate,
            deliberate CWV task (self-hosting isn't possible — Google Sans isn't in this
            Next.js version's next/font/google catalog). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap" />
      </head>
      <body className={`${openSans.className} font-sans`}>
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
