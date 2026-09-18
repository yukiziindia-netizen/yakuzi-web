import { Suspense } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import HomeNavbar from '@/components/landing/HomeNavbar';
import HeroSection from '@/components/landing/HeroSection';
import ProductCarousel from '@/components/landing/ProductCarousel';
import CategoryScrollRow from '@/components/landing/CategoryScrollRow';
import ComingSoon from '@/components/landing/ComingSoon';
import ProductSectionBoundary from '@/components/shared/ProductSectionBoundary';
import InstagramFeed from '@/components/landing/InstagramFeed';
import dynamicComponent from 'next/dynamic';
import { type HomepageSection } from '@yukizi/api-client';
import {
  getProductsCached,
  getComingSoonStatusCached,
  getBannersCached,
  getHomepageSectionsCached,
} from '@/lib/server-cache';
import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { organizationSchema, webSiteSchema, graph } from '@/lib/seo/schema';
import { fetchSocialLinks, socialUrlList } from '@/lib/seo/social';
import { fetchSupportContact } from '@/lib/seo/support-contact';
import { absoluteUrl } from '@/lib/seo/site';
import { applySeoOverride, fetchSeoOverride } from '@/lib/seo/overrides';

// No `force-dynamic` needed: this page reads `searchParams` (the navbar
// search lands on `/?search=`), which already makes every render dynamic.
// The API data it renders from is TTL-cached in @/lib/server-cache instead.

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

// How many products the browse view shows before handing off to /products.
//
// The homepage used to render the entire catalogue under the curated rows, so
// "a selection" and "everything" were the same screen — including a dozen
// products shown twice, once in a curated row and again below. That was
// invisible at a handful of products and obvious at 67.
const HOMEPAGE_GRID_LIMIT = 24;

// The product grid streams in after the shell: the (slow) products query no
// longer holds back TTFB, the hero, or the navbar. The grid is still fully
// server-rendered into the (streamed) HTML, so crawlers see every product.
async function CarouselSection({
  searchParams,
  capped,
}: {
  searchParams: any;
  /** Browse view only. A filtered or searched view shows every match. */
  capped: boolean;
}) {
  let initialProducts: any[] = [];
  let total = 0;
  try {
    const res = await getProductsCached({
      limit: 100,
      ...buildProductQueryParams(searchParams),
    });
    // getProductsCached retries, then REJECTS on a failure (see
    // fetchProductsOrThrow) — so the catch below now does fire for an API
    // failure, and the failure is never cached. A failure must surface as an
    // error (error.tsx retry UI, noindexed by Next), never as a 200
    // "No products available." shell — the soft-404 that reads to Google
    // as an empty shop. A GENUINELY empty fulfilled result renders as before.
    if (res && res.data && Array.isArray(res.data)) {
      initialProducts = res.data;
      total = res.total ?? res.data.length;
    }
  } catch (error) {
    // Rethrow, don't swallow: swallowing rendered a 200 "No products
    // available." shell whenever the API blinked — a soft-404 that reads to
    // Google as "this shop is empty". The error boundary (error.tsx) shows a
    // retry UI instead, and Next marks streamed error output noindex, so a
    // crawl during an outage is told to come back rather than told the
    // catalogue is gone. A GENUINELY empty result (fulfilled, zero rows)
    // still renders normally below.
    console.error("[HomePage] Failed to load initial products:", error);
    throw error;
  }

  const shown = capped ? initialProducts.slice(0, HOMEPAGE_GRID_LIMIT) : initialProducts;
  const hasMore = capped && total > shown.length;

  return (
    <>
      <ProductCarousel initialProducts={shown} />
      {/* A real link, not a button that fetches more: the rest of the
          catalogue lives on its own indexable page, so this is a crawlable
          path to it as well as a way for a shopper to keep browsing. */}
      {hasMore && (
        <div className="flex justify-center px-4 pb-2 pt-4">
          <Link
            href="/products"
            className="rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:border-[#854cbc] hover:text-[#854cbc]"
          >
            View all {total} products
          </Link>
        </div>
      )}
    </>
  );
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
      getComingSoonStatusCached(),
      getBannersCached().catch(() => undefined),
      showCuratedSections ? getHomepageSectionsCached().catch(() => []) : Promise.resolve([]),
    ]);
    isComingSoon = comingSoon;
    initialBanners = banners;
    sections = homepageSections;
  } catch (e) {
    console.error("[HomePage] Failed to fetch coming soon status, showing the storefront:", e);
  }

  const social = await fetchSocialLinks();
  const socialUrls = socialUrlList(social);
  const support = await fetchSupportContact();

  if (isComingSoon) {
    return <ComingSoon />;
  }

  return (
    <main className="w-full min-h-screen relative pb-[var(--nav-clearance,150px)]">
      <JsonLd data={[graph(organizationSchema(socialUrls, support), webSiteSchema())]} />
      {/* The hero is pure banner artwork, so the page's one H1 is screen-reader
          only — same pattern CategoryBanner already uses. Without it the
          homepage has NO h1 at all (only the category-row h2s). */}
      <h1 className="sr-only">
        Yukizi — anime figures, manga and pop-culture collectibles marketplace in India
      </h1>
      <HomeNavbar />

      <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto overflow-hidden flex flex-col relative min-h-screen">
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
            {/* Scoped so a products failure costs the grid, not the hero,
                the category rows and the footer with it. */}
            <ProductSectionBoundary>
              <Suspense
                fallback={
                  <div className="h-40 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#854cbc]" />
                  </div>
                }
              >
                <CarouselSection searchParams={searchParams} capped={showCuratedSections} />
              </Suspense>
            </ProductSectionBoundary>
          </div>
          {/* Below the products, and only on the browse view — the same rule
              the curated rows follow. Someone who arrived searching wants
              results, not the social rail. Streamed so a slow Instagram never
              holds up the page, and it renders nothing at all when no account
              is connected. */}
          {showCuratedSections && (
            <Suspense fallback={null}>
              <InstagramFeed profileUrl={social.instagram} />
            </Suspense>
          )}
        </section>
      </div>
    </main>
  );
}
