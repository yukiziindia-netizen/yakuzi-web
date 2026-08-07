import type { MetadataRoute } from 'next';
import { getProducts, getCategories, getBlogs } from '@yukizi/api-client';
import { absoluteUrl } from '@/lib/seo/site';

export const revalidate = 3600; // rebuild at most hourly

const STATIC_PATHS = ['/', '/blogs', '/about', '/contact', '/privacy', '/terms', '/returns', '/shipping'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: absoluteUrl(p),
    changeFrequency: p === '/' ? 'daily' : 'weekly',
    priority: p === '/' ? 1 : 0.5,
  }));

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

  try {
    // getCategories() returns Category[] directly, not wrapped in { data }.
    const cats = await getCategories();
    for (const c of Array.isArray(cats) ? cats : []) {
      if (c?.slug) entries.push({ url: absoluteUrl(`/category/${c.slug}`), changeFrequency: 'weekly', priority: 0.7 });
    }
  } catch {
    /* fail-open */
  }

  try {
    const blogs = await getBlogs({ limit: 100 });
    for (const b of blogs.data) {
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
