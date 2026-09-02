import type { MetadataRoute } from 'next';
import { getCategories, getBlogs } from '@yukizi/api-client';
import { authorSlug } from '@/lib/seo/schema';
import { absoluteUrl } from '@/lib/seo/site';
import { fetchAllProducts, isBuildPhase } from '@/lib/seo/product-fetch';

export const revalidate = 3600; // rebuild at most hourly

const STATIC_PATHS = ['/', '/blogs', '/about', '/contact', '/privacy', '/terms', '/returns', '/shipping', '/cookie-policy'];

async function fetchProductEntries(): Promise<{ entries: MetadataRoute.Sitemap; failed: boolean }> {
  const { products, failed } = await fetchAllProducts('sitemap');
  const entries: MetadataRoute.Sitemap = [];
  for (const p of products) {
    if (!p.isActive && p.isActive !== undefined) continue;
    entries.push({
      url: absoluteUrl(`/products/${p.slug ?? p.id}`),
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: 'daily',
      priority: 0.8,
    });
  }
  return { entries, failed };
}

async function fetchCategoryEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  try {
    // getCategories() returns Category[] directly, not wrapped in { data }.
    const cats = await getCategories();
    for (const c of Array.isArray(cats) ? cats : []) {
      if (!c?.slug) continue;
      entries.push({ url: absoluteUrl(`/category/${c.slug}`), changeFrequency: 'weekly', priority: 0.7 });
      // Sub-collection URLs are deliberately NOT listed.
      //
      // They were added here on the reasoning that they are the most
      // commercially-targeted URLs on the site — but every one of them
      // canonicalises to its parent category, and all 45 shared the parent's
      // title and meta description verbatim. Listing a URL in the sitemap
      // while its canonical points elsewhere is a contradiction: the sitemap
      // says "index this", the canonical says "index the parent instead".
      // Google crawls them, discards them as "Alternate page with proper
      // canonical tag", and trusts the sitemap a little less.
      //
      // Making them indexable in their own right is the better long-term
      // answer, but that needs distinct titles, descriptions and enough
      // products per sub-collection to not be thin — several currently have
      // none. Until then, one honest signal beats two conflicting ones.
    }
  } catch {
    /* fail-open */
  }
  return entries;
}

async function fetchBlogEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  try {
    const blogs = await getBlogs({ limit: 100, status: 'PUBLISHED' });
    // Authors get one entry each, not one per post they wrote.
    const authors = new Set<string>();
    for (const b of blogs.data) {
      if ((b as any).status && (b as any).status !== 'PUBLISHED') continue;
      if (b?.slug) entries.push({
        url: absoluteUrl(`/blogs/${b.slug}`),
        lastModified: b.publishedAt ? new Date(b.publishedAt) : b.createdAt ? new Date(b.createdAt) : undefined,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
      if (b?.author?.name) authors.add(authorSlug(b.author.name));
    }
    for (const slug of authors) {
      entries.push({
        url: absoluteUrl(`/blogs/author/${slug}`),
        changeFrequency: 'monthly',
        priority: 0.3,
      });
    }
  } catch {
    /* fail-open */
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: absoluteUrl(p),
    changeFrequency: p === '/' ? 'daily' : 'weekly',
    priority: p === '/' ? 1 : 0.5,
  }));

  // Run independently of each other so one slow/timed-out call doesn't push
  // the others past Vercel's 60s static-generation budget — previously these
  // were awaited sequentially, so worst case (3 x 30s axios timeout) could
  // exceed the limit on its own and fail the whole build (see PR #129/#130
  // build failures: "Static page generation for /sitemap.xml is still
  // timing out after 3 attempts").
  const [products, categories, blogs] = await Promise.all([
    fetchProductEntries(),
    fetchCategoryEntries(),
    fetchBlogEntries(),
  ]);
  entries.push(...products.entries, ...categories, ...blogs);

  // Refuse to publish a sitemap that says the catalogue does not exist.
  //
  // A 200 with the static pages and no products is the worst outcome: it is a
  // confident, cacheable statement that the shop has nothing in it, and Google
  // acts on it by dropping product URLs it already knew. A 500 costs nothing —
  // Search Console flags "couldn't fetch", the last good sitemap stays in
  // effect, and Google retries.
  //
  // Not during a build, though. Failing there would block a deploy over a
  // transient upstream blip, and the route regenerates hourly anyway, so the
  // first revalidation after the build fixes it.
  if (products.failed && !isBuildPhase()) {
    throw new Error('[sitemap] product fetch failed after retries; refusing to publish a sitemap with no products');
  }

  return entries;
}
