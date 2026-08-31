import { getBlogs } from '@yukizi/api-client';
import { SITE_NAME, SITE_URL, absoluteUrl } from '@/lib/seo/site';

/**
 * RSS for the blog.
 *
 * Feeds are not a legacy curiosity here: aggregators, newsreaders and several
 * AI crawlers prefer a feed to guessing at HTML, and it is the cheapest way to
 * tell anything "these are the posts, newest first, with dates". Nothing was
 * offering that.
 *
 * Fail-open like the other machine-readable routes — a settings or API blip
 * costs items, never the response.
 */
export const revalidate = 3600;

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET(): Promise<Response> {
  let items = '';
  try {
    const res = await getBlogs({ limit: 50, status: 'PUBLISHED' });
    items = (res.data ?? [])
      .filter((p) => p?.slug && p?.title)
      .map((p) => {
        const url = absoluteUrl(`/blogs/${p.slug}`);
        const date = p.publishedAt || p.createdAt;
        return [
          '<item>',
          `<title>${esc(p.title)}</title>`,
          `<link>${url}</link>`,
          `<guid isPermaLink="true">${url}</guid>`,
          p.excerpt ? `<description>${esc(p.excerpt)}</description>` : '',
          p.author?.name ? `<dc:creator>${esc(p.author.name)}</dc:creator>` : '',
          p.category?.name ? `<category>${esc(p.category.name)}</category>` : '',
          date ? `<pubDate>${new Date(date).toUTCString()}</pubDate>` : '',
          '</item>',
        ].join('');
      })
      .join('');
  } catch {
    /* fail-open: an empty but valid feed beats a 500 */
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">` +
    `<channel>` +
    `<title>${esc(`${SITE_NAME} Blog`)}</title>` +
    `<link>${absoluteUrl('/blogs')}</link>` +
    `<description>${esc(`Guides and stories about anime, manga and collectibles from ${SITE_NAME}.`)}</description>` +
    `<language>en-in</language>` +
    `<atom:link href="${SITE_URL}/blogs/rss.xml" rel="self" type="application/rss+xml"/>` +
    items +
    `</channel></rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
