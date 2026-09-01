import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById, getProducts } from '@yukizi/api-client';
import { parseProductIdFromSlug } from '@yukizi/utils';
import { absoluteUrl, metaTruncate, SITE_NAME } from '@/lib/seo/site';
import { productSchema, breadcrumbSchema, faqPageSchema, graph, organizationSchema, webSiteSchema } from '@/lib/seo/schema';
import { applySeoOverride, fetchSeoOverride, mergeStructuredData, validFaqs } from '@/lib/seo/overrides';
import JsonLd from '@/components/seo/JsonLd';
import RelatedProductsServer from '@/components/product/RelatedProductsServer';
import SeoFaq from '@/components/seo/SeoFaq';
import ProductPageClient from './ProductPageClient';

// Was force-dynamic, which sets `private, no-store` and made every product
// page a cache miss on every request. This page reads no search params, so it
// can be generated and revalidated on a timer instead.
//
// Five minutes of possible staleness on price and stock is safe here: the cart
// re-reads live price and the checkout charges it (api#62), so a stale figure
// on the page can never become a stale figure on the invoice.
export const revalidate = 300;

/**
 * Prerender the catalogue at build time.
 *
 * A dynamic segment with no generateStaticParams is server-rendered on every
 * request and served `no-store`, whatever `revalidate` says — verified by
 * building and reading the header, not by trusting the build legend. Listing
 * the slugs is what actually makes the page cacheable.
 *
 * dynamicParams stays at its default of true, so a product added after the
 * build still renders on demand and is then cached like the rest. If the API
 * is unreachable at build time this returns nothing and every page simply
 * falls back to on-demand rendering — the previous behaviour, not a failure.
 */
export async function generateStaticParams() {
  try {
    const res = await getProducts({ page: 1, limit: 200 });
    return (res.data ?? [])
      .map((p: { slug?: string; id: string }) => p.slug ?? p.id)
      .filter(Boolean)
      .map((productSlug: string) => ({ productSlug }));
  } catch {
    return [];
  }
}

// React cache() dedupes the fetch between generateMetadata and the page render.
const fetchProduct = cache(async (slugOrId: string) => {
  try {
    return await getProductById(slugOrId);
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err; // real failure → error boundary/500, NOT a soft-404
  }
});

// Admin SEO override, deduped between generateMetadata and the page render.
// fetchSeoOverride is fail-open (null until the API ships /seo/meta).
const fetchProductOverride = cache(async (productId: string) =>
  fetchSeoOverride('PRODUCT', productId),
);

// SEO records are keyed by the STABLE catalog id, never the listing id: the
// payload's `id` is the seller offer when a listing exists (formatMasterDetail)
// and would change whenever listings do. masterProductId is always the catalog
// product; `id` is only a fallback for very old cached payloads.
function overrideKey(p: { id: string; masterProductId?: string }): string {
  return p.masterProductId || p.id;
}

// Adapt the detail payload (formatMasterDetail) to what productSchema() expects.
// price/stock/sellerName MUST all come from the same listing — mixing the cheapest
// listing's price with a different (in-stock) listing's seller would misattribute
// the Offer. Choose the cheapest in-stock listing; if none is in stock, fall back
// to the top-level (cheapest overall) price/stock and report OutOfStock, no seller.
function buildSchemaInput(p: any) {
  const listings: any[] = Array.isArray(p.listings) ? p.listings : [];
  const inStock = listings.filter((l) => (l?.stock ?? 0) > 0);
  const chosen = inStock.length
    ? inStock.reduce((a, b) => ((a.price ?? Infinity) <= (b.price ?? Infinity) ? a : b))
    : undefined;
  return {
    ...p,
    ...(chosen
      ? {
          price: chosen.price ?? p.price,
          stock: chosen.stock,
          sellerName: chosen.sellerName || undefined,
          // Same-listing rule applies to shipping too: prefer the chosen
          // listing's own shipping price, fall back to the top-level one.
          shippingPrice:
            chosen.finalShippingPrice ?? chosen.shippingCharges ?? p.finalShippingPrice ?? p.shippingCharges ?? null,
        }
      : {
          stock: 0,
          sellerName: undefined,
          shippingPrice: p.finalShippingPrice ?? p.shippingCharges ?? null,
        }),
  };
}

export async function generateMetadata({ params }: { params: { productSlug: string } }): Promise<Metadata> {
  const p = await fetchProduct(parseProductIdFromSlug(params.productSlug));
  if (!p) return { title: 'Product not found', robots: { index: false } };
  const canonicalPath = `/products/${(p as any).slug ?? p.id}`;
  const title = p.name ?? 'Product';
  const description = metaTruncate(
    (p as any).description || `Buy ${p.name} online at ${SITE_NAME}. Authentic collectibles from verified sellers.`,
  );
  const images: string[] = Array.isArray((p as any).images)
    ? (p as any).images.map((im: any) => (typeof im === 'string' ? im : im?.url)).filter(Boolean)
    : [];
  const derived: Metadata = {
    title,
    description,
    alternates: { canonical: absoluteUrl(canonicalPath) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonicalPath),
      // Ideally 'product' — Facebook, WhatsApp and Pinterest treat that
      // differently from a generic page. Next 14's metadata types only allow
      // website/article/book/profile/music/video, and emitting a second raw
      // og:type tag alongside Next's own would be worse than a generic one.
      // Left as-is deliberately.
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_IN',
      // alt on the share image: read aloud by screen readers on social, and
      // one of the few og fields that was simply missing.
      ...(images.length
        ? { images: [{ url: images[0], alt: `${p.name ?? SITE_NAME} - ${SITE_NAME}` }] }
        : {}),
    },
    // NOTE: no `twitter` key here on purpose. Declaring one replaces the root
    // layout's block wholesale, which dropped twitter:site/creator (the
    // admin-set handle). Next inherits the root's card/site and fills
    // title/description from this page's own values.
  };
  return applySeoOverride(derived, await fetchProductOverride(overrideKey(p)));
}

export default async function ProductPage({ params }: { params: { productSlug: string } }) {
  const slugOrId = parseProductIdFromSlug(params.productSlug);
  const product = await fetchProduct(slugOrId);
  if (!product) notFound();
  const p: any = product;
  const crumbs: Array<{ name: string; path?: string }> = [{ name: 'Home', path: '/' }];
  if (p.category?.name) {
    crumbs.push({ name: p.category.name, ...(p.category.slug ? { path: `/category/${p.category.slug}` } : {}) });
  }
  crumbs.push({ name: p.name ?? 'Product' });
  const override = await fetchProductOverride(overrideKey(p));
  const faqs = validFaqs(override?.faq);
  // ONE @graph rather than separate blocks — see graph() for why.
  const jsonLd: object[] = [
    graph(
      mergeStructuredData(productSchema(buildSchemaInput(p)), override?.structuredDataOverride),
      breadcrumbSchema(crumbs),
      faqs.length ? faqPageSchema(faqs) : null,
      // The site's entity travels with every product page. Google does not
      // resolve @id references across URLs, so a page that names the brand
      // without defining it leaves the reference dangling.
      organizationSchema(),
      webSiteSchema(),
    ),
  ];
  return (
    <>
      <JsonLd data={jsonLd} />
      <ProductPageClient productSlug={params.productSlug} initialProduct={product} imageAltOverrides={override?.imageAltOverrides ?? undefined} />
      {/* Server-rendered links to sibling products. The existing related rail
          is client-only, so the served HTML had no product links at all. */}
      <RelatedProductsServer
        currentId={p.id}
        currentSlug={params.productSlug}
        categoryId={p.category?.id}
        categoryName={p.category?.name}
        categorySlug={p.category?.slug}
      />
      {/* Visible, server-rendered — outside the client component, so the PDP's
          mobile/desktop dual JSX trees are not involved. */}
      <SeoFaq faqs={faqs} />
    </>
  );
}
