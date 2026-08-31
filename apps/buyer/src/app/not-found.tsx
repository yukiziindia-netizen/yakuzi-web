import Link from 'next/link';
import { headers } from 'next/headers';

export const metadata = { title: 'Page not found' };

// Next prerenders the root not-found page by default, which would freeze it at
// build time and mean the 404 report below never ran. Reading request headers
// is the whole point here, so it has to be rendered per request.
export const dynamic = 'force-dynamic';

/**
 * Report the 404 so it lands in Admin -> SEO -> Redirects -> Broken links.
 *
 * Without this, a broken URL only ever surfaces in Search Console — weeks
 * after the link rotted, and only for pages Google happened to recrawl.
 *
 * The path comes from a header set by middleware, because a server component
 * has no other way to learn which URL was requested. Awaited but bounded at
 * one second: a 404 page must not hang on a reporting call, and a report
 * that never arrives is a missing row, not a broken page.
 */
async function reportNotFound() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  if (!base) return;

  const h = headers();
  const path = h.get('x-yukizi-path');
  if (!path) return;

  try {
    await Promise.race([
      fetch(`${base}/seo/not-found`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          referrer: h.get('referer') ?? undefined,
          userAgent: h.get('user-agent') ?? undefined,
        }),
        cache: 'no-store',
      }),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
  } catch {
    // Never let bookkeeping break the page the visitor is already on.
  }
}

export default async function NotFound() {
  await reportNotFound();

  return (
    <>
      <header className="border-b px-4 py-4">
        <Link href="/" className="inline-flex items-center">
          <img src="/YukiziLogo.png" alt="Yukizi" className="h-8 w-auto" />
        </Link>
      </header>
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-6xl font-bold">404</p>
        <h1 className="text-xl font-semibold">This page doesn&apos;t exist</h1>
        <p className="text-sm text-gray-500">
          The link may be broken, or the product may have been removed.
        </p>
        <div className="flex gap-3">
          <Link href="/" className="rounded-full bg-black px-5 py-2 text-sm text-white">Go home</Link>
          <Link href="/blogs" className="rounded-full border px-5 py-2 text-sm">Read the blog</Link>
        </div>
      </main>
    </>
  );
}
