import Link from 'next/link';
import type { Metadata } from 'next';
import HomeNavbar from '@/components/landing/HomeNavbar';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import {
  breadcrumbSchema,
  organizationSchema,
  webSiteSchema,
  graph,
  type BreadcrumbItem,
} from '@/lib/seo/schema';
import { absoluteUrl, SITE_URL } from '@/lib/seo/site';
import { fetchProductsOrThrow } from '@/lib/server-cache';
import { COLLECTIONS, matchProducts } from '@/data/collections';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Shop by Series & Brand',
  description:
    'Browse Yukizi collections — Naruto, Demon Slayer, One Piece and Dragon Ball figures, Funko Pops, Marvel statues and video game collectibles, all in India.',
  alternates: { canonical: absoluteUrl('/collections') },
};

const KIND_LABEL: Record<string, string> = {
  series: 'Anime series',
  brand: 'Brand',
  theme: 'Theme',
  character: 'Character',
  price: 'By budget',
  gift: 'Gifting',
};

export default async function CollectionsIndexPage() {
  // Same hard-fail rule as the hub pages: an API outage is a 500, not an
  // "every collection is empty" soft-404. Direct fetch, not unstable_cache —
  // this page is ISR; see the hub page's note on the build-poisoned cache.
  // fetchProductsOrThrow retries a transient failure before giving up, then
  // throws — the uncached path, so nothing here is stored either way.
  const res = await fetchProductsOrThrow({ limit: 100 }, 'collections');
  const all = res && Array.isArray(res.data) ? res.data : [];
  const withCounts = COLLECTIONS.map((def) => ({ def, count: matchProducts(def, all).length }));

  const crumbs: BreadcrumbItem[] = [{ name: 'Home', path: '/' }, { name: 'Collections' }];

  const jsonLd = [
    graph(
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${absoluteUrl('/collections')}#collection`,
        name: 'Yukizi Collections — Shop by Series & Brand',
        url: absoluteUrl('/collections'),
        isPartOf: { '@id': `${SITE_URL}/#website` },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: COLLECTIONS.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.name,
            url: absoluteUrl(`/collections/${c.slug}`),
          })),
        },
      },
      breadcrumbSchema(crumbs),
      organizationSchema(),
      webSiteSchema(),
    ),
  ];

  return (
    <main className="w-full min-h-screen relative pb-[var(--nav-clearance,150px)]">
      <JsonLd data={jsonLd} />
      <HomeNavbar />

      <div className="mx-auto w-full max-w-4xl px-4 pt-6 sm:pt-10">
        <Breadcrumbs items={crumbs} className="mb-3" />
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Shop by Series &amp; Brand</h1>
        <p className="mt-4 text-sm sm:text-base leading-relaxed text-gray-600">
          Every collection below is a living page — products join automatically as sellers list
          them, so the Naruto page always holds every Naruto figure on the marketplace, the Funko
          page every Pop. Pick the series you watch, the brand you collect, or the shelf you are
          trying to build.
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {withCounts.map(({ def, count }) => (
            <li key={def.slug}>
              <Link
                href={`/collections/${def.slug}`}
                className="block h-full rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-[#854cbc]"
              >
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  {KIND_LABEL[def.kind]}
                </span>
                <span className="mt-1 block text-lg font-semibold text-gray-900">{def.name}</span>
                <span className="mt-1 block text-sm text-gray-500">
                  {count} product{count === 1 ? '' : 's'}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-gray-600">
                  {def.metaDescription}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
