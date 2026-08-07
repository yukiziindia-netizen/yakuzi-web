import type { Metadata } from 'next';
import { getBlogs } from '@yukizi/api-client';
import { absoluteUrl } from '@/lib/seo/site';
import BlogListClient from './BlogListClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Guides, news and stories from the world of anime, manga and collectibles — from the Yukizi team.',
  alternates: { canonical: absoluteUrl('/blogs') },
};

export default async function BlogsPage() {
  let initialPosts: any[] = [];
  try {
    // The API returns DRAFT posts unless explicitly filtered — the public
    // list must only ever surface PUBLISHED posts.
    const res = await getBlogs({ limit: 20, status: 'PUBLISHED' });
    initialPosts = res.data ?? [];
  } catch {
    /* fail-open: client fetch takes over */
  }
  return <BlogListClient initialPosts={initialPosts} />;
}
