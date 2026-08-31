import { COMPANY } from '@/config/company';
import { SITE_NAME, SITE_URL, ORG_LEGAL_NAME, SUPPORT_EMAIL, absoluteUrl } from './site';

// `contact` lets the homepage pass the admin-set support details through, so
// the structured data and the contact page can never publish different
// numbers. Defaults to the built-in constants for any caller that has none.
export function organizationSchema(
  sameAs: string[] = [],
  contact: { email?: string; phone?: string } = {},
) {
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
      telephone: contact.phone || COMPANY.supportPhone,
      email: contact.email || SUPPORT_EMAIL,
      areaServed: 'IN',
      availableLanguage: ['en'],
    },
    // The entity link: connects this site to the brand's profiles elsewhere,
    // which is how Google and AI assistants corroborate they are the same
    // organisation. Omitted entirely when none are configured.
    ...(sameAs.length ? { sameAs } : {}),
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
  sku?: string | null; mpn?: string | null; gtin?: string | null;
  updatedAt?: string | Date | null;
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
    // Identifiers let Google reconcile this page with the Merchant feed as
    // ONE product instead of two unlinked descriptions of the same item.
    ...(p.sku ? { sku: p.sku } : {}),
    ...(p.mpn ? { mpn: p.mpn } : {}),
    ...(p.gtin ? { gtin: p.gtin } : {}),
    // Freshness: assistants weight recency when choosing between sources,
    // and a page that can't prove it loses to one that can.
    ...(p.updatedAt ? { dateModified: new Date(p.updatedAt).toISOString() } : {}),
    ...(price != null && hasSellers
      ? {
          offers: {
            '@type': 'Offer',
            url,
            priceCurrency: 'INR',
            price: String(price),
            // Google treats an absent/stale price date as a soft warning and
            // some surfaces then suppress the price entirely. Rolling 30 days.
            priceValidUntil: new Date(Date.now() + 30 * 86_400_000)
              .toISOString()
              .slice(0, 10),
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

/**
 * A category/collection page as a typed CollectionPage wrapping its ItemList —
 * this is what tells Google "a curated set", not "a page that happens to have
 * links". `mainEntity` keeps the list attached to the page entity.
 */
export function collectionPageSchema(opts: {
  name: string;
  path: string;
  description?: string | null;
  items: Array<{ name?: string; slug?: string; id: string }>;
  /** Newest product update in the set — the page's own freshness. */
  dateModified?: string | Date | null;
}) {
  const url = absoluteUrl(opts.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    name: opts.name,
    url,
    ...(opts.description ? { description: opts.description } : {}),
    isPartOf: { '@id': `${SITE_URL}/#website` },
    ...(opts.dateModified
      ? { dateModified: new Date(opts.dateModified).toISOString() }
      : {}),
    mainEntity: {
      '@type': 'ItemList',
      name: opts.name,
      itemListElement: opts.items.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absoluteUrl(`/products/${p.slug ?? p.id}`),
        ...(p.name ? { name: p.name } : {}),
      })),
    },
  };
}

/**
 * Collapses the page's separate JSON-LD blocks into ONE @graph.
 *
 * Emitting Organization / WebSite / Product / Breadcrumb as disconnected
 * blocks makes Google resolve four orphan facts; inside a @graph — where the
 * nodes already carry stable @ids — it resolves a single connected entity.
 * That connectedness is what entity-based search and LLM retrieval reason
 * over, so this is the strongest on-page understanding lever available.
 *
 * Each node keeps whatever @id it declared; the wrapper drops the per-node
 * @context (it belongs once, at the top).
 */
export function graph(...nodes: Array<object | null | undefined>) {
  const cleaned = nodes
    .filter((n): n is Record<string, unknown> => !!n)
    .map(({ ['@context']: _ctx, ...rest }) => rest);
  return { '@context': 'https://schema.org', '@graph': cleaned };
}
