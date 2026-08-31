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
        const row = p as { image?: unknown; images?: unknown; slug?: string; name?: string };
        // Every picture, not just the primary one. This listed a single image
        // per product until the list payload started returning them all
        // (api#107) — on a collectibles catalogue that left most of the
        // imagery undiscoverable in Google Images.
        const all = Array.isArray(row.images) ? row.images : [];
        const picked = [
          ...(typeof row.image === 'string' ? [row.image] : []),
          ...all.filter((u): u is string => typeof u === 'string'),
        ];
        const unique = [...new Set(picked)];
        if (!unique.length) continue;

        const loc = absoluteUrl(`/products/${row.slug ?? p.id}`);
        const title = `${esc(String(row.name ?? ''))} - Yukizi`;
        // Google caps an image sitemap at 1,000 images per URL; a product
        // gallery never approaches that, but slice defensively anyway.
        const tags = unique
          .slice(0, 1000)
          .map((u) => `<image:image><image:loc>${esc(u)}</image:loc><image:title>${title}</image:title></image:image>`)
          .join('');
        urls.push(`<url><loc>${esc(loc)}</loc>${tags}</url>`);
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
