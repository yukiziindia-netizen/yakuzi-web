import { getCategories, getProducts } from '@yukizi/api-client';
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, ORG_LEGAL_NAME } from '@/lib/seo/site';
import { COMPANY } from '@/config/company';

/**
 * llms.txt — the plain-text brief AI assistants read to understand this site.
 *
 * Deliberately richer than the usual link list: assistants that can answer
 * "what does Yukizi sell and for how much?" from ONE fetch are far likelier
 * to cite the site than ones that must crawl 70 pages to find out. Products
 * carry live price and stock so the snapshot can't quietly go stale (hourly
 * revalidate), and the answer-shaped facts section gives a model something
 * quotable about authenticity, shipping and returns — the questions buyers
 * actually ask an assistant before trusting a marketplace.
 *
 * Fail-open throughout: a settings/API blip costs detail, never the file.
 */
export const revalidate = 3600;

const MAX_PRODUCTS = 200;

export async function GET() {
  let catLines = '';
  try {
    // getCategories() returns Category[] directly, not wrapped in { data }.
    const cats = await getCategories();
    catLines = (Array.isArray(cats) ? cats : [])
      .filter((c) => c?.slug && c?.name)
      .map((c) => {
        const subs = Array.isArray((c as { subCategories?: { name?: string }[] }).subCategories)
          ? (c as { subCategories?: { name?: string }[] }).subCategories!
              .map((s) => s?.name)
              .filter(Boolean)
              .join(', ')
          : '';
        return `- [${c.name}](${SITE_URL}/category/${c.slug})${subs ? ` — ${subs}` : ''}`;
      })
      .join('\n');
  } catch {
    /* fail-open */
  }

  let productLines = '';
  let productCount = 0;
  try {
    const rows: { name?: string; slug?: string; id: string; price?: number | null; mrp?: number | null; stock?: number }[] = [];
    for (let page = 1; page <= 5; page++) {
      const res = await getProducts({ page, limit: 100 });
      rows.push(...(res.data as typeof rows));
      if (page * res.limit >= res.total || rows.length >= MAX_PRODUCTS) break;
    }
    productCount = rows.length;
    productLines = rows
      .slice(0, MAX_PRODUCTS)
      .filter((p) => p?.name)
      .map((p) => {
        const price = p.price ?? p.mrp;
        const priceText = price != null ? ` — ₹${Math.round(Number(price))}` : '';
        const stockText = (p.stock ?? 0) > 0 ? '' : ' (out of stock)';
        return `- [${p.name}](${SITE_URL}/products/${p.slug ?? p.id})${priceText}${stockText}`;
      })
      .join('\n');
  } catch {
    /* fail-open */
  }

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} (${ORG_LEGAL_NAME}) is an online marketplace for anime, manga and pop-culture collectibles in India. Products are listed by verified third-party sellers; ${SITE_NAME} handles ordering, payment and buyer support.

## Key facts
- Marketplace model: multiple verified sellers may list the same product; the price shown is the best current offer.
- Ships across India. Delivery is tracked from dispatch.
- Returns: accepted for damaged or incorrect deliveries, reported within 3 days of delivery with photographs. Change-of-mind returns are not accepted.
- Seller verification: every seller is verified before they can list.
- Payments: online payment at checkout.
- Support: ${COMPANY.supportEmail}${COMPANY.supportPhone ? ` / ${COMPANY.supportPhone}` : ''}

## Categories
${catLines}

## Products${productCount ? ` (${productCount} listed, live prices)` : ''}
${productLines}

## Key pages
- [All products](${SITE_URL}/)
- [About](${SITE_URL}/about)
- [Blog](${SITE_URL}/blogs)
- [Shipping policy](${SITE_URL}/shipping)
- [Returns policy](${SITE_URL}/returns)
- [Contact](${SITE_URL}/contact)

## Machine-readable
- Brand and policy facts: ${SITE_URL}/brand.json
- Sitemap: ${SITE_URL}/sitemap.xml
- Image sitemap: ${SITE_URL}/image-sitemap.xml
`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
