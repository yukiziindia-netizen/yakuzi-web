import { absoluteUrl } from '@/lib/seo/site';
import { fetchAllProducts, isBuildPhase } from '@/lib/seo/product-fetch';

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
  const { products, failed } = await fetchAllProducts('image-sitemap');

  for (const p of products) {
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

  // An empty image sitemap is not a harmless placeholder — it tells Google the
  // catalogue has no imagery, on a site where Google Images is a primary
  // discovery channel. A 503 says "ask again later" instead, and is explicitly
  // not cached so the next request can succeed. Never during a build, where
  // this would fail a deploy over a transient blip; it regenerates hourly.
  if (failed && !isBuildPhase()) {
    return new Response('product fetch failed after retries', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
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
