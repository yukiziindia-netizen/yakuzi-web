'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Reports a 404 to Admin -> SEO -> Redirects -> Broken links.
 *
 * This used to run on the server, using a path that middleware wrote into a
 * request header. That header mutation marked every response dynamic, so the
 * entire site was served `private, no-store` and missed the CDN on every
 * request — a very expensive way to log a 404. Reading the path on the client
 * costs nothing and leaves every page cacheable again.
 *
 * The trade: crawlers do not run this, so bot-hit 404s no longer appear here.
 * Search Console reports those anyway, and the entries worth acting on are the
 * ones real visitors reach — a broken link someone actually followed.
 *
 * keepalive so the request survives the visitor navigating away immediately,
 * which on a 404 page is the likely case.
 */
export default function NotFoundReporter() {
  const pathname = usePathname();

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
    if (!base || !pathname) return;

    fetch(`${base}/seo/not-found`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || undefined,
        userAgent: navigator.userAgent,
      }),
      keepalive: true,
    }).catch(() => {
      // Never let bookkeeping surface on a page that is already an error.
    });
  }, [pathname]);

  return null;
}
