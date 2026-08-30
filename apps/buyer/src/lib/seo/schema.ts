import { COMPANY } from '@/config/company';
import { SITE_NAME, SITE_URL, ORG_LEGAL_NAME, SUPPORT_EMAIL, absoluteUrl } from './site';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    legalName: ORG_LEGAL_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/YukiziLogo.png'),
    email: SUPPORT_EMAIL,
    // Real, published details only (the same values the Contact page shows) —
    // they let Google/LLMs pin the entity to a concrete registered business.
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Phase 2, Laxmi Narayan Residency, Flat No. 103, Jekegram',
      addressLocality: 'Thane',
      addressRegion: 'Maharashtra',
      postalCode: '400606',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: COMPANY.supportPhone,
      email: SUPPORT_EMAIL,
      areaServed: 'IN',
      availableLanguage: ['en'],
    },
  };
}

export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
    // The homepage doubles as the search-results view (?search=…), so this is
    // a real, working target — enables sitelinks-search-box eligibility.
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface BreadcrumbItem { name: string; path?: string }
export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      ...(it.path ? { item: absoluteUrl(it.path) } : {}),
    })),
  };
}

// Product schema from the public GET /products/:slug payload.
// Only include what is REAL: no invented ratings, no fake availability.
export function productSchema(p: {
  name?: string; slug?: string; id: string; description?: string;
  image?: string | null; images?: Array<{ url?: string } | string> | null;
  manufacturer?: string; price?: number | null; mrp?: number | null;
  stock?: number; hasSellers?: boolean; shippingPrice?: number | null;
  category?: { name?: string } | null;
  reviewSummary?: { average?: number; count?: number } | null;
  listings?: unknown[] | null; sellerCount?: number; sellerName?: string;
}) {
  const images: string[] = [];
  if (p.image) images.push(p.image);
  for (const im of p.images ?? []) {
    const url = typeof im === 'string' ? im : im?.url;
    if (url && !images.includes(url)) images.push(url);
  }
  const price = p.price ?? p.mrp;
  const url = absoluteUrl(`/products/${p.slug ?? p.id}`);
  const hasSellers = p.hasSellers ?? ((p.listings?.length ?? 0) > 0 || (p.sellerCount ?? 0) > 0);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    ...(p.name ? { name: p.name } : {}),
    url,
    ...(images.length ? { image: images } : {}),
    ...(p.description ? { description: p.description } : {}),
    ...(p.manufacturer ? { brand: { '@type': 'Brand', name: p.manufacturer } } : {}),
    ...(p.category?.name ? { category: p.category.name } : {}),
    ...(price != null && hasSellers
      ? {
          offers: {
            '@type': 'Offer',
            url,
            priceCurrency: 'INR',
            price: String(price),
            availability:
              (p.stock ?? 0) > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            ...(p.sellerName ? { seller: { '@type': 'Organization', name: p.sellerName } } : {}),
            // The platform has no used/refurbished concept — every listing is new.
            itemCondition: 'https://schema.org/NewCondition',
            // Real policy from /returns: damaged/wrong-item only, buyer must
            // notify within 3 days of delivery. Don't invent returnFees — the
            // policy page doesn't state who pays.
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: 'IN',
              returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
              merchandiseReturnDays: 3,
              url: absoluteUrl('/returns'),
            },
            // Only when the payload carries a real per-listing shipping price;
            // no deliveryTime — deliveryText is free-form and unparseable.
            ...(p.shippingPrice != null
              ? {
                  shippingDetails: {
                    '@type': 'OfferShippingDetails',
                    shippingRate: {
                      '@type': 'MonetaryAmount',
                      value: String(p.shippingPrice),
                      currency: 'INR',
                    },
                    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
                  },
                }
              : {}),
          },
        }
      : {}),
    ...(p.reviewSummary?.count
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: String(p.reviewSummary.average),
            reviewCount: p.reviewSummary.count,
          },
        }
      : {}),
  };
}

export function articleSchema(post: {
  title: string; slug: string; excerpt?: string; featuredImage?: string;
  createdAt?: string; updatedAt?: string; publishedAt?: string;
  author?: { name?: string } | null;
}) {
  const url = absoluteUrl(`/blogs/${post.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: post.title,
    url,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.featuredImage ? { image: [absoluteUrl(post.featuredImage)] } : {}),
    ...(post.publishedAt || post.createdAt ? { datePublished: post.publishedAt || post.createdAt } : {}),
    ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
    ...(post.author?.name ? { author: { '@type': 'Person', name: post.author.name } } : {}),
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export function itemListSchema(name: string, items: Array<{ name?: string; slug?: string; id: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`/products/${p.slug ?? p.id}`),
      ...(p.name ? { name: p.name } : {}),
    })),
  };
}

export function faqPageSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
