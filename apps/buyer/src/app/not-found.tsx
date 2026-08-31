import Link from 'next/link';
import NotFoundReporter from '@/components/seo/NotFoundReporter';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <>
      {/* Records the broken URL for Admin -> SEO -> Broken links. Client-side
          on purpose: the server version read a request header that middleware
          had to set, and that mutation made every page on the site
          uncacheable. force-dynamic is gone with it — this page can be
          prerendered again. */}
      <NotFoundReporter />
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
