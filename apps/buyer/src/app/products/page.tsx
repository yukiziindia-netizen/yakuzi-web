import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';
import HomeNavbar from '@/components/landing/HomeNavbar';
import CategoryBanner from '@/components/landing/CategoryBanner';
import ProductCarousel from '@/components/landing/ProductCarousel';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { getBanners, getProducts } from '@yukizi/api-client';
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

  // The same banners the homepage hero shows. Filtered and ordered exactly as
  // HeroSection does it: the API sorts by `order`, but the admin form never
  // sets it, so every banner comes back with the same value and Postgres
  // breaks the tie arbitrarily — sort defensively or the sequence differs
  // between the two pages showing the same artwork.
  let bannerSlides: { id?: string; image: string; mobileImage?: string | null }[] = [];
  try {
    const banners = await getBanners();
    bannerSlides = (Array.isArray(banners) ? banners : [])
      .filter((b: any) => b?.isActive !== false && b?.imageUrl)
      .sort((a: any, b: any) => {
        const byOrder = (a.order ?? 0) - (b.order ?? 0);
        if (byOrder !== 0) return byOrder;
        return (
          new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
        );
      })
      .map((b: any) => ({
        id: b.id,
        image: b.imageUrl,
        mobileImage: b.mobileImageUrl ?? null,
      }));
  } catch (error) {
    // A banner is decoration; the catalogue is the page. Render without it.
    console.error('[AllProducts] Failed to load banners:', error);
  }

  return (
    // No `bg-gray-50`. It was an opaque layer painted over the site's lavender
    // field (`body::before`), which is why this page read as flat grey while
    // the homepage and every category page read as glass over lavender —
    // the glass surfaces had nothing to pick up.
    //
    // `--nav-clearance` instead of a hardcoded `pb-24 sm:pb-32`: the floating
    // bar lifts as it approaches the footer, so a fixed value is always short
    // and the last row of products ends up underneath it. The nav publishes
    // its own clearance; home and the category pages already use it.
    <main className="w-full min-h-screen relative pb-[var(--nav-clearance,150px)]">
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <HomeNavbar />

      <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto overflow-hidden flex flex-col relative min-h-screen">
        <section className="flex-1 flex flex-col w-full">
          {/* Same component the category pages use, so one banner behaves
              identically everywhere: it picks the phone artwork itself and
              falls back to the desktop image when there is no mobile upload.
              It also replaces the page's old top padding — that padding
              existed only to clear the fixed nav, and on its own it opened a
              band of empty grey across the top of the page. */}
          <div className="w-full flex-shrink-0 flex flex-col">
            <CategoryBanner title="All Products" banners={bannerSlides} />
          </div>

          <Breadcrumbs items={crumbs} className="px-4 sm:px-6 pt-3 sm:pt-4" />
          <div className="px-4 sm:px-6 pt-2 pb-1">
            {/* An h2, not an h1: CategoryBanner renders the page's single
                sr-only h1. Two h1s is the exact bug the category pages
                already carry a comment about. Visually unchanged. */}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">All Products</h2>
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
