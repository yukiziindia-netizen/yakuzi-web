import { getProducts } from '@yukizi/api-client';
import { absoluteUrl } from '@/lib/seo/site';

/**
 * Google image sitemap. Next 14's MetadataRoute.Sitemap has no `images`
 * field (that arrived in 15), so this is hand-rolled — worth it because
 * Google Images is a primary discovery channel for collectibles: people
 * search visually for figures. Referenced from robots.txt.
 */
export const revalidate = 3600;

function esc(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(): Promise<Response> {
  const urls: string[] = [];
  try {
    for (let page = 1; page <= 50; page++) {
      const res = await getProducts({ page, limit: 100 });
      for (const p of res.data) {
        const raw = (p as { image?: unknown }).image;
        if (!raw || typeof raw !== 'string') continue;
        const loc = absoluteUrl(`/products/${(p as { slug?: string }).slug ?? p.id}`);
        urls.push(
          `<url><loc>${esc(loc)}</loc><image:image><image:loc>${esc(raw)}</image:loc>` +
            `<image:title>${esc(String((p as { name?: string }).name ?? ''))} - Yukizi</image:title>` +
            `</image:image></url>`,
        );
      }
      if (page * res.limit >= res.total || page >= 50) break;
    }
  } catch {
    /* fail-open: an empty but valid sitemap beats a 500 */
  }
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
    `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">` +
    urls.join('') +
    `</urlset>`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
