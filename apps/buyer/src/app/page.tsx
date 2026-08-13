import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import HomeNavbar from '@/components/landing/HomeNavbar';
import HeroSection from '@/components/landing/HeroSection';
import ProductCarousel from '@/components/landing/ProductCarousel';
import ComingSoon from '@/components/landing/ComingSoon';
import dynamicComponent from 'next/dynamic';
const Footer = dynamicComponent(() => import('@/components/landing/Footer'), { ssr: false });
import { getProducts, getComingSoonStatus, getBanners } from '@yukizi/api-client';
import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { organizationSchema, webSiteSchema } from '@/lib/seo/schema';
import { absoluteUrl } from '@/lib/seo/site';
import { applySeoOverride, fetchSeoOverride } from '@/lib/seo/overrides';

export const dynamic = 'force-dynamic';

// Was a static `metadata` export; generateMetadata lets the admin SEO
// override for the homepage (entity "/") merge over the same defaults.
export async function generateMetadata(): Promise<Metadata> {
  const derived: Metadata = { alternates: { canonical: absoluteUrl('/') } };
  return applySeoOverride(derived, await fetchSeoOverride('HOMEPAGE', '/'));
}

// The product grid streams in after the shell: the (slow) products query no
// longer holds back TTFB, the hero, or the navbar. The grid is still fully
// server-rendered into the (streamed) HTML, so crawlers see every product.
async function CarouselSection({ searchParams }: { searchParams: any }) {
  let initialProducts: any[] = [];
  try {
    const search = searchParams?.search;
    const res = await getProducts({
      limit: 100,
      search,
      minPrice: searchParams?.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPrice: searchParams?.maxPrice ? Number(searchParams.maxPrice) : undefined,
      isNew: searchParams?.isNew === 'true' ? true : undefined,
      isBestSelling: searchParams?.isBestSelling === 'true' ? true : undefined,
      discountRange: searchParams?.discountRange && searchParams.discountRange !== 'All' ? searchParams.discountRange : undefined,
      location: searchParams?.location && searchParams.location !== 'All' ? searchParams.location : undefined,
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
  // One round trip instead of two: the coming-soon gate and the hero banners
  // are independent, so they are fetched together. If the gate closes the
  // page, the banner response is simply unused.
  let isComingSoon = true;
  let initialBanners: any[] | undefined;
  try {
    const [comingSoon, banners] = await Promise.all([
      getComingSoonStatus(),
      getBanners().catch(() => undefined),
    ]);
    isComingSoon = comingSoon;
    initialBanners = banners;
  } catch (e) {
    console.error("[HomePage] Failed to fetch coming soon status, defaulting to true:", e);
  }

  if (isComingSoon) {
    return <ComingSoon />;
  }

  return (
    <main className="w-full bg-gray-50 min-h-screen relative pb-24 sm:pb-32">
      <JsonLd data={[organizationSchema(), webSiteSchema()]} />
      <HomeNavbar />

      <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto bg-gray-50 overflow-hidden flex flex-col relative min-h-screen">
        <section className="flex-1 flex flex-col w-full">
          <div className="w-full flex-shrink-0 flex flex-col">
            <HeroSection initialBanners={initialBanners} />
          </div>
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
