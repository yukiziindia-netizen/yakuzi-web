import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById } from '@yukizi/api-client';
import { parseProductIdFromSlug } from '@yukizi/utils';
import { absoluteUrl, metaTruncate, SITE_NAME } from '@/lib/seo/site';
import { productSchema, breadcrumbSchema } from '@/lib/seo/schema';
import JsonLd from '@/components/seo/JsonLd';
import ProductPageClient from './ProductPageClient';

export const dynamic = 'force-dynamic';

// React cache() dedupes the fetch between generateMetadata and the page render.
const fetchProduct = cache(async (slugOrId: string) => {
  try {
    return await getProductById(slugOrId);
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err; // real failure → error boundary/500, NOT a soft-404
  }
});

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
      ? { price: chosen.price ?? p.price, stock: chosen.stock, sellerName: chosen.sellerName || undefined }
      : { stock: 0, sellerName: undefined }),
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
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(canonicalPath) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonicalPath),
      type: 'website',
      ...(images.length ? { images: [{ url: images[0] }] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description },
  };
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
  return (
    <>
      <JsonLd data={[productSchema(buildSchemaInput(p)), breadcrumbSchema(crumbs)]} />
      <ProductPageClient productSlug={params.productSlug} initialProduct={product} />
    </>
  );
}
