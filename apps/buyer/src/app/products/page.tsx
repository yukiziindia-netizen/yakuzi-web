import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';
import HomeNavbar from '@/components/landing/HomeNavbar';
import ProductCarousel from '@/components/landing/ProductCarousel';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { getProducts } from '@yukizi/api-client';
import { absoluteUrl, metaTruncate, SITE_NAME } from '@/lib/seo/site';
import { applySeoOverride, fetchSeoOverride } from '@/lib/seo/overrides';
import { breadcrumbSchema, collectionPageSchema } from '@/lib/seo/schema';

/**
 * The full catalogue.
 *
 * The homepage used to be this page: it rendered every product under the
 * curated rows, so "a selection" and "everything" were the same screen. That
 * worked at a handful of products and stopped working at 67. The homepage now
 * shows a sample and links here, which needs somewhere to link to — this.
 *
 * It is also the destination the rest of the SEO work already assumed:
 * itemListSchema has taken `/products` as its basePath since it was written,
 * and until now no page lived there.
 */

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const title = 'All Products';
  const description = metaTruncate(
    `Browse every product on ${SITE_NAME}: anime figures, manga, collectibles and cosplay props from verified sellers, shipped across India.`,
  );
  const derived: Metadata = {
    title,
    description,
    alternates: { canonical: absoluteUrl('/products') },
    openGraph: { title, description, url: absoluteUrl('/products') },
  };
  return applySeoOverride(derived, await fetchSeoOverride('CATEGORY', 'all-products'));
}

// Streamed, exactly like the category grid: the nav and heading paint without
// waiting on the products query, and the grid is still server-rendered into
// the streamed HTML so crawlers see every product.
async function AllProducts({ searchParams }: { searchParams?: Record<string, any> }) {
  let products: any[] = [];
  const str = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);
  try {
    const res = await getProducts({
      limit: 100,
      sortBy: str(searchParams?.sortBy),
      sortOrder: str(searchParams?.sortOrder) === 'asc' || str(searchParams?.sortOrder) === 'desc'
        ? (searchParams?.sortOrder as 'asc' | 'desc')
        : undefined,
      minPrice: str(searchParams?.minPrice) ? Number(searchParams?.minPrice) : undefined,
      maxPrice: str(searchParams?.maxPrice) ? Number(searchParams?.maxPrice) : undefined,
      isNew: str(searchParams?.isNew) === 'true' ? true : undefined,
      isYukiziChoice: str(searchParams?.isYukiziChoice) === 'true' ? true : undefined,
      isBestSelling: str(searchParams?.isBestSelling) === 'true' ? true : undefined,
      discountRange: str(searchParams?.discountRange) && searchParams?.discountRange !== 'All' ? str(searchParams?.discountRange) : undefined,
      location: str(searchParams?.location) && searchParams?.location !== 'All' ? str(searchParams?.location) : undefined,
      manufacturer: str(searchParams?.manufacturer) && searchParams?.manufacturer !== 'All' ? str(searchParams?.manufacturer) : undefined,
      search: str(searchParams?.search),
    });
    if (Array.isArray(res?.data)) products = res.data;
  } catch (error) {
    console.error('[AllProducts] Failed to load products:', error);
  }

  return (
    <>
      <JsonLd
        data={[
          collectionPageSchema({
            name: 'All Products',
            path: '/products',
            items: products.slice(0, 24),
            dateModified: products.map((p: any) => p?.updatedAt).filter(Boolean).sort().pop() ?? null,
          }),
        ]}
      />
      <ProductCarousel initialProducts={products} />
    </>
  );
}

export default async function AllProductsPage({ searchParams }: { searchParams?: any }) {
  const resolved = searchParams instanceof Promise ? await searchParams : searchParams;
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'All Products' }];

  return (
    <main className="w-full bg-gray-50 min-h-screen relative pb-24 sm:pb-32">
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <HomeNavbar />

      <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto bg-gray-50 overflow-hidden flex flex-col relative min-h-screen">
        <section className="flex-1 flex flex-col w-full pt-24 sm:pt-28 md:pt-32">
          <Breadcrumbs items={crumbs} className="px-4 sm:px-6" />
          <div className="px-4 sm:px-6 pt-2 pb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">All Products</h1>
            <p className="mt-1 text-sm text-gray-600">
              Every figure, book and collectible on {SITE_NAME}.
            </p>
          </div>
          <div className="flex-1 min-h-[300px] overflow-hidden bg-transparent">
            <Suspense
              fallback={
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#854cbc]" />
                </div>
              }
            >
              <AllProducts searchParams={resolved} />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  );
}
