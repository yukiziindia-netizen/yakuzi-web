import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import HomeNavbar from '@/components/landing/HomeNavbar';
import HeroSection from '@/components/landing/HeroSection';
import ProductCarousel from '@/components/landing/ProductCarousel';
import CategoryScrollRow from '@/components/landing/CategoryScrollRow';
import ComingSoon from '@/components/landing/ComingSoon';
import dynamicComponent from 'next/dynamic';
const Footer = dynamicComponent(() => import('@/components/landing/Footer'), { ssr: false });
import { getProducts, getComingSoonStatus, getBanners, getHomepageSections, type HomepageSection } from '@yukizi/api-client';
import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { organizationSchema, webSiteSchema, graph } from '@/lib/seo/schema';
import { absoluteUrl } from '@/lib/seo/site';
import { applySeoOverride, fetchSeoOverride } from '@/lib/seo/overrides';

export const dynamic = 'force-dynamic';

// Was a static `metadata` export; generateMetadata lets the admin SEO
// override for the homepage (entity "/") merge over the same defaults.
export async function generateMetadata(): Promise<Metadata> {
  const derived: Metadata = { alternates: { canonical: absoluteUrl('/') } };
  return applySeoOverride(derived, await fetchSeoOverride('HOMEPAGE', '/'));
}

// Single source of truth for both "is this a filtered view" (hasSearchOrFilter)
// and the actual getProducts() query (CarouselSection) — these two used to be
// hand-maintained in parallel and drifted (sortBy/sortOrder were missing from
// the filter check), so every param CarouselSection reads must be added here,
// not duplicated at both call sites.
function buildProductQueryParams(searchParams: any) {
  return {
    search: searchParams?.search || undefined,
    sortBy: searchParams?.sortBy || undefined,
    sortOrder: searchParams?.sortOrder === 'asc' || searchParams?.sortOrder === 'desc' ? searchParams.sortOrder : undefined,
    minPrice: searchParams?.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams?.maxPrice ? Number(searchParams.maxPrice) : undefined,
    isNew: searchParams?.isNew === 'true' ? true : undefined,
    isYukiziChoice: searchParams?.isYukiziChoice === 'true' ? true : undefined,
    isBestSelling: searchParams?.isBestSelling === 'true' ? true : undefined,
    discountRange: searchParams?.discountRange && searchParams.discountRange !== 'All' ? searchParams.discountRange : undefined,
    location: searchParams?.location && searchParams.location !== 'All' ? searchParams.location : undefined,
    manufacturer: searchParams?.manufacturer && searchParams.manufacturer !== 'All' ? searchParams.manufacturer : undefined,
  };
}

// The curated category rows are a "browse everything" landing-page feature —
// they don't make sense once the homepage is being used as a search/filter
// results view instead.
function hasSearchOrFilter(searchParams: any): boolean {
  return Object.values(buildProductQueryParams(searchParams)).some((v) => v !== undefined);
}

// The product grid streams in after the shell: the (slow) products query no
// longer holds back TTFB, the hero, or the navbar. The grid is still fully
// server-rendered into the (streamed) HTML, so crawlers see every product.
async function CarouselSection({ searchParams }: { searchParams: any }) {
  let initialProducts: any[] = [];
  try {
    const res = await getProducts({
      limit: 100,
      ...buildProductQueryParams(searchParams),
    });
    if (res && res.data && Array.isArray(res.data)) {
      initialProducts = res.data;
    }
  } catch (error) {
    console.error("[HomePage] Failed to load initial products:", error);
  }
  return <ProductCarousel initialProducts={initialProducts} />;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: any;
}) {
  const showCuratedSections = !hasSearchOrFilter(searchParams);

  // One round trip instead of two: the coming-soon gate, the hero banners,
  // and (when relevant) the homepage sections are all independent, so they
  // are fetched together. If the gate closes the page, the rest is unused.
  // Fails open — see getComingSoonStatus. An unreachable API must degrade to a
  // thin storefront, never to the pre-launch splash over the whole site.
  let isComingSoon = false;
  let initialBanners: any[] | undefined;
  let sections: HomepageSection[] = [];
  try {
    const [comingSoon, banners, homepageSections] = await Promise.all([
      getComingSoonStatus(),
      getBanners().catch(() => undefined),
      showCuratedSections ? getHomepageSections().catch(() => []) : Promise.resolve([]),
    ]);
    isComingSoon = comingSoon;
    initialBanners = banners;
    sections = homepageSections;
  } catch (e) {
    console.error("[HomePage] Failed to fetch coming soon status, showing the storefront:", e);
  }

  if (isComingSoon) {
    return <ComingSoon />;
  }

  return (
    <main className="w-full bg-gray-50 min-h-screen relative pb-24 sm:pb-32">
      <JsonLd data={[graph(organizationSchema(), webSiteSchema())]} />
      {/* The hero is pure banner artwork, so the page's one H1 is screen-reader
          only — same pattern CategoryBanner already uses. Without it the
          homepage has NO h1 at all (only the category-row h2s). */}
      <h1 className="sr-only">
        Yukizi — anime figures, manga and pop-culture collectibles marketplace in India
      </h1>
      <HomeNavbar />

      <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto bg-gray-50 overflow-hidden flex flex-col relative min-h-screen">
        <section className="flex-1 flex flex-col w-full">
          <div className="w-full flex-shrink-0 flex flex-col">
            <HeroSection initialBanners={initialBanners} />
          </div>
          {showCuratedSections && sections.length > 0 && (
            <div className="flex-shrink-0 flex flex-col pt-4 sm:pt-6">
              {sections.map((section) => (
                <CategoryScrollRow key={section.id} section={section} />
              ))}
            </div>
          )}
          <div className="flex-1 min-h-[300px] overflow-hidden bg-transparent mt-0">
            <Suspense
              fallback={
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#854cbc]" />
                </div>
              }
            >
              <CarouselSection searchParams={searchParams} />
            </Suspense>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
