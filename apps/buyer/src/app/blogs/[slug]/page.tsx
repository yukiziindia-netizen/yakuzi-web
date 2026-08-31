import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogBySlug } from '@yukizi/api-client';
import { absoluteUrl, metaTruncate } from '@/lib/seo/site';
import { articleSchema, breadcrumbSchema, blogSchema, faqPageSchema } from '@/lib/seo/schema';
import { applySeoOverride, fetchSeoOverride, mergeStructuredData, validFaqs } from '@/lib/seo/overrides';
import JsonLd from '@/components/seo/JsonLd';
import SeoFaq from '@/components/seo/SeoFaq';
import PostFooterLinks from '@/components/blog/PostFooterLinks';
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
  const derived: Metadata = {
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
  // The blog editor's "Advanced SEO" modal writes a BLOG_POST SeoMeta record
  // (keyed by post id). Those values — when set — win over the post's own
  // CMS fields; both are edited from the same blog-editor surface.
  return applySeoOverride(derived, await fetchSeoOverride('BLOG_POST', post.id));
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);
  if (!post) notFound();
  // Same Advanced-SEO record as generateMetadata (Next dedupes the fetch):
  // admin-authored FAQs render visibly + as FAQPage JSON-LD, and any
  // structured-data override merges into the Article schema — the exact
  // contract product pages already have.
  const override = await fetchSeoOverride('BLOG_POST', post.id);
  const faqs = validFaqs(override?.faq);
  const jsonLd: object[] = [
    mergeStructuredData(articleSchema(post), override?.structuredDataOverride),
    breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blogs' }, { name: post.title }]),
    // The Blog the post declares itself part of, so isPartOf resolves to a
    // real node rather than dangling.
    blogSchema(),
  ];
  if (faqs.length) jsonLd.push(faqPageSchema(faqs));
  return (
    <>
      <JsonLd data={jsonLd} />
      <BlogPostClient slug={params.slug} initialPost={post} />
      {/* Visible, server-rendered — the same entries the FAQPage JSON-LD
          advertises, so there is no hidden-content markup. */}
      <SeoFaq faqs={faqs} />
      {/* Related reading and the products the post is about — the internal
          links a post on a shop should carry and previously did not. */}
      <PostFooterLinks
        currentSlug={params.slug}
        categoryName={post.category?.name}
        tags={post.tags}
      />
    </>
  );
}
