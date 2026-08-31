import type { Metadata } from 'next';
import { getBlogs } from '@yukizi/api-client';
import { absoluteUrl } from '@/lib/seo/site';
import { blogSchema, itemListSchema } from '@/lib/seo/schema';
import JsonLd from '@/components/seo/JsonLd';
import BlogListClient from './BlogListClient';

// Posts change rarely; ten minutes is plenty. Was force-dynamic.
export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Guides, news and stories from the world of anime, manga and collectibles — from the Yukizi team.',
  alternates: {
    canonical: absoluteUrl('/blogs'),
    // Points readers, aggregators and feed-reading crawlers at the feed
    // instead of leaving them to guess from the HTML.
    types: { 'application/rss+xml': absoluteUrl('/blogs/rss.xml') },
  },
};

export default async function BlogsPage() {
  let initialPosts: any[] = [];
  try {
    // The API returns DRAFT posts unless explicitly filtered — the public
    // list must only ever surface PUBLISHED posts. The controller ignores
    // page/limit/search entirely and always returns every published post,
    // so no `limit` is passed here — passing one would fabricate a `total`
    // that silently breaks the moment API-side pagination lands.
    const res = await getBlogs({ status: 'PUBLISHED' });
    initialPosts = res.data ?? [];
  } catch {
    /* fail-open: client fetch takes over */
  }
  return (
    <>
      {/* The Blog node every post declares itself isPartOf, plus the posts as
          an ordered list so the index is more than a page of links. */}
      <JsonLd
        data={[
          blogSchema(),
          ...(initialPosts.length
            ? [
                itemListSchema(
                  'Yukizi Blog',
                  initialPosts.map((p: any) => ({ id: p.id, name: p.title, slug: p.slug })),
                  '/blogs',
                ),
              ]
            : []),
        ]}
      />
      <BlogListClient initialPosts={initialPosts} />
    </>
  );
}
