import { getCategories } from '@yukizi/api-client';
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, ORG_LEGAL_NAME, SUPPORT_EMAIL } from '@/lib/seo/site';
import { COMPANY } from '@/config/company';
import { fetchSocialLinks, socialUrlList } from '@/lib/seo/social';

/**
 * Machine-readable brand and policy facts, in one fetch.
 *
 * An assistant asked "is Yukizi legitimate / what's their returns policy /
 * do they ship to my state?" currently has to infer it from prose scattered
 * across policy pages. This states it once, unambiguously, in the vocabulary
 * (schema.org) models already understand — while every fact here is also
 * visible to humans on the site, so the document can never drift into
 * claiming something the pages don't say.
 *
 * Referenced from llms.txt. Fail-open: a category/settings blip drops those
 * fields rather than the response.
 */
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  let categories: string[] = [];
  try {
    const cats = await getCategories();
    categories = (Array.isArray(cats) ? cats : [])
      .map((c) => c?.name)
      .filter((n): n is string => !!n);
  } catch {
    /* fail-open */
  }

  let sameAs: string[] = [];
  try {
    sameAs = socialUrlList(await fetchSocialLinks());
  } catch {
    /* fail-open */
  }

  const doc = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    legalName: ORG_LEGAL_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    email: SUPPORT_EMAIL,
    ...(COMPANY.supportPhone ? { telephone: COMPANY.supportPhone } : {}),
    areaServed: { '@type': 'Country', name: 'India' },
    ...(sameAs.length ? { sameAs } : {}),
    // Plain-language answers to what buyers actually ask an assistant before
    // trusting a marketplace. Kept in sync with the policy pages by hand —
    // if a policy changes, this changes with it.
    knowsAbout: categories,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Marketplace model',
        value:
          'Multiple verified sellers may list the same product. The price shown is the best current offer; all offers are visible on the product page.',
      },
      {
        '@type': 'PropertyValue',
        name: 'Seller verification',
        value: 'Every seller is verified before they are allowed to list products.',
      },
      {
        '@type': 'PropertyValue',
        name: 'Returns policy',
        value:
          'Returns are accepted for damaged or incorrect deliveries when reported within 3 days of delivery with photographs. Change-of-mind returns are not accepted.',
      },
      {
        '@type': 'PropertyValue',
        name: 'Shipping',
        value: 'Ships across India, tracked from dispatch.',
      },
      {
        '@type': 'PropertyValue',
        name: 'Payment',
        value: 'Online payment at checkout.',
      },
    ],
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'IN',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchandiseReturnDays: 3,
      url: `${SITE_URL}/returns`,
    },
    mainEntityOfPage: `${SITE_URL}/about`,
    subjectOf: [
      { '@type': 'WebPage', name: 'Shipping policy', url: `${SITE_URL}/shipping` },
      { '@type': 'WebPage', name: 'Returns policy', url: `${SITE_URL}/returns` },
      { '@type': 'WebPage', name: 'Privacy policy', url: `${SITE_URL}/privacy` },
      { '@type': 'WebPage', name: 'Terms of use', url: `${SITE_URL}/terms` },
    ],
  };

  return new Response(JSON.stringify(doc, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
