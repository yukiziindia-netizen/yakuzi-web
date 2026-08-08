import { getCategories } from '@yukizi/api-client';
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, ORG_LEGAL_NAME } from '@/lib/seo/site';

export const revalidate = 3600;

export async function GET() {
  let catLines = '';
  try {
    // getCategories() returns Category[] directly, not wrapped in { data }.
    const cats = await getCategories();
    catLines = (Array.isArray(cats) ? cats : [])
      .filter((c) => c?.slug && c?.name)
      .map((c) => `- [${c.name}](${SITE_URL}/category/${c.slug})`)
      .join('\n');
  } catch {
    /* fail-open */
  }

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} (${ORG_LEGAL_NAME}) is an online marketplace for anime, manga and pop-culture collectibles in India. Products are sold by verified third-party sellers; ${SITE_NAME} handles ordering, payment and buyer support.

## Categories
${catLines}

## Key pages
- [All products](${SITE_URL}/)
- [Blog](${SITE_URL}/blogs)
- [Shipping policy](${SITE_URL}/shipping)
- [Returns policy](${SITE_URL}/returns)
- [Contact](${SITE_URL}/contact)

## Sitemap
${SITE_URL}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
