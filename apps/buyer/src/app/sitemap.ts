import type { MetadataRoute } from 'next';
import { getProducts, getCategories, getBlogs } from '@yukizi/api-client';
import { absoluteUrl } from '@/lib/seo/site';

export const revalidate = 3600; // rebuild at most hourly

const STATIC_PATHS = ['/', '/blogs', '/about', '/contact', '/privacy', '/terms', '/returns', '/shipping', '/cookie-policy'];

async function fetchProductEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  try {
    // catalog is small (~44); paginate defensively up to 5000
    let page = 1;
    for (;;) {
      const res = await getProducts({ page, limit: 100 });
      for (const p of res.data) {
        if (!p.isActive && p.isActive !== undefined) continue;
        entries.push({
          url: absoluteUrl(`/products/${p.slug ?? p.id}`),
          lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
          changeFrequency: 'daily',
          priority: 0.8,
        });
      }
      if (page * res.limit >= res.total || page >= 50) break;
      page += 1;
    }
  } catch {
    /* fail-open: ship the static entries rather than a 500 sitemap */
  }
  return entries;
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
    for (const b of blogs.data) {
      if ((b as any).status && (b as any).status !== 'PUBLISHED') continue;
      if (b?.slug) entries.push({
        url: absoluteUrl(`/blogs/${b.slug}`),
        lastModified: b.publishedAt ? new Date(b.publishedAt) : b.createdAt ? new Date(b.createdAt) : undefined,
        changeFrequency: 'weekly',
        priority: 0.6,
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
  entries.push(...products, ...categories, ...blogs);

  return entries;
}
