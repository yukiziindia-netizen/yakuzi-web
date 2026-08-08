import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogBySlug } from '@yukizi/api-client';
import { absoluteUrl, metaTruncate } from '@/lib/seo/site';
import { articleSchema, breadcrumbSchema } from '@/lib/seo/schema';
import JsonLd from '@/components/seo/JsonLd';
import BlogPostClient from './BlogPostClient';

export const dynamic = 'force-dynamic';

// React cache() dedupes the fetch between generateMetadata and the page render.
const fetchPost = cache(async (slug: string) => {
  try {
    const post: any = await getBlogBySlug(slug);
    if (!post) return null;
    // The API returns DRAFT posts by slug too — a draft's URL must 404, not render.
    if (post.status && post.status !== 'PUBLISHED') return null;
    return post;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err; // real failure → error boundary/500, NOT a soft-404
  }
});

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await fetchPost(params.slug);
  if (!post) return { title: 'Article not found', robots: { index: false } };
  // Prefer the CMS's own SEO fields when the author has set them; fall back
  // to content-derived defaults otherwise.
  const title = post.metaTitle || post.title;
  const description = metaTruncate(post.metaDescription || post.excerpt || post.title);
  const canonical = post.canonicalUrl || absoluteUrl(`/blogs/${post.slug}`);
  const ogImg = post.ogImage || post.featuredImage;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
      ...(ogImg ? { images: [{ url: ogImg }] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);
  if (!post) notFound();
  return (
    <>
      <JsonLd
        data={[
          articleSchema(post),
          breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blogs' }, { name: post.title }]),
        ]}
      />
      <BlogPostClient slug={params.slug} initialPost={post} />
    </>
  );
}
