import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import HomeNavbar from '@/components/landing/HomeNavbar';
import CollectionGrid from '@/components/collections/CollectionGrid';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import SeoFaq from '@/components/seo/SeoFaq';
import {
  collectionPageSchema,
  breadcrumbSchema,
  faqPageSchema,
  organizationSchema,
  webSiteSchema,
  graph,
  type BreadcrumbItem,
} from '@/lib/seo/schema';
import { absoluteUrl } from '@/lib/seo/site';
import { fetchProductsOrThrow } from '@/lib/server-cache';
import { COLLECTIONS, MIN_PRODUCTS, collectionBySlug, matchProducts } from '@/data/collections';

// No searchParams here, so unlike /products and /category this page is real
// ISR: the CDN serves it cached and revalidates in the background. That is
// deliberate — these are SEO landing pages and must be fast for crawlers.
export const revalidate = 300;

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

async function fetchCollectionProducts(def: (typeof COLLECTIONS)[number]) {
  // Direct fetch, NOT getProductsCached: this page is already ISR, so the
  // fetch runs at most once per revalidation window per page — an extra
  // unstable_cache layer adds nothing, and on Next 14.2.0 an empty result
  // cached during the BUILD was never refreshed at runtime, shipping every
  // hub with a permanently empty grid (observed live on 2026-09-16).
  // Errors intentionally NOT swallowed: an API outage must surface as a 500
  // (crawlers retry those), never as a thin 200 "empty collection" soft-404.
  // getProducts NEVER throws — it swallows errors and returns
  // { data: [], failed: true }, which would render as a calm empty collection
  // (the soft-404 this page must never be). fetchProductsOrThrow retries the
  // transient case, then converts a real failure into a rejection.
  const res = await fetchProductsOrThrow({ limit: 100 }, 'collections');
  const all = res && Array.isArray(res.data) ? res.data : [];
  return matchProducts(def, all);
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const def = collectionBySlug(params.slug);
  if (!def) return { title: 'Collection not found', robots: { index: false } };
  // A hub that has thinned below MIN_PRODUCTS live matches drops out of the
  // index rather than ranking as a near-empty page. unstable_cache dedupes
  // this fetch with the page body's own.
  let thin = false;
  try {
    thin = (await fetchCollectionProducts(def)).length < MIN_PRODUCTS;
  } catch {
    // API hiccup during metadata: keep default indexability, the page render
    // itself will 500 and crawlers will retry.
  }
  return {
    title: def.title,
    description: def.metaDescription,
    alternates: { canonical: absoluteUrl(`/collections/${def.slug}`) },
    openGraph: { title: `${def.title} | Yukizi`, description: def.metaDescription },
    ...(thin ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const def = collectionBySlug(params.slug);
  if (!def) notFound();

  const products = await fetchCollectionProducts(def);

  const crumbs: BreadcrumbItem[] = [
    { name: 'Home', path: '/' },
    { name: 'Collections', path: '/collections' },
    { name: def.name },
  ];

  const jsonLd = [
    graph(
      collectionPageSchema({
        name: def.title,
        path: `/collections/${def.slug}`,
        description: def.metaDescription,
        items: products.map((p: any) => ({ name: p.name, slug: p.slug, id: p.id })),
      }),
      breadcrumbSchema(crumbs),
      def.faqs.length ? faqPageSchema(def.faqs) : null,
      // CollectionPage's isPartOf points at #website — define it on-page or
      // the reference dangles (the exact bug the category pages still have).
      organizationSchema(),
      webSiteSchema(),
    ),
  ];

  const siblings = COLLECTIONS.filter((c) => c.slug !== def.slug);

  return (
    <main className="w-full min-h-screen relative pb-[var(--nav-clearance,150px)]">
      <JsonLd data={jsonLd} />
      <HomeNavbar />

      <div className="w-full max-w-[1600px] mx-auto flex flex-col">
        <header className="mx-auto w-full max-w-4xl px-4 pt-6 sm:pt-10">
          <Breadcrumbs items={crumbs} className="mb-3" />
          {/* A real, visible H1 — these pages exist to rank, so the headline
              is text, not banner artwork. */}
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">{def.h1}</h1>
          <div className="mt-4 flex flex-col gap-3 text-sm sm:text-base leading-relaxed text-gray-600">
            {def.intro.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </header>

        <section aria-label={`${def.name} products`} className="mt-2">
          {products.length > 0 ? (
            <CollectionGrid products={products} />
          ) : (
            <p className="px-4 py-10 text-center text-gray-500">
              No {def.name} products are listed right now — new arrivals appear here automatically.{' '}
              <Link href="/products" className="text-[#854cbc] underline underline-offset-4">
                Browse the full catalogue
              </Link>
              .
            </p>
          )}
        </section>

        <SeoFaq faqs={def.faqs} />

        <nav aria-label="More collections" className="mx-auto w-full max-w-4xl px-4 pb-8">
          <h2 className="text-base font-semibold text-gray-800 mb-3">More collections</h2>
          <ul className="flex flex-wrap gap-2">
            {siblings.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/collections/${c.slug}`}
                  className="inline-block rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 transition-colors hover:border-[#854cbc] hover:text-[#854cbc]"
                >
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/products"
                className="inline-block rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 transition-colors hover:border-[#854cbc] hover:text-[#854cbc]"
              >
                All products
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </main>
  );
}
