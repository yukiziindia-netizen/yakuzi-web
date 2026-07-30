import HomeNavbar from '@/components/landing/HomeNavbar';
import HeroSection from '@/components/landing/HeroSection';
import ProductCarousel from '@/components/landing/ProductCarousel';
import ComingSoon from '@/components/landing/ComingSoon';
import dynamicComponent from 'next/dynamic';
const Footer = dynamicComponent(() => import('@/components/landing/Footer'), { ssr: false });
import { getProducts, getComingSoonStatus } from '@yukizi/api-client';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: any;
}) {
  let isComingSoon = true;
  try {
    isComingSoon = await getComingSoonStatus();
  } catch (e) {
    console.error("[HomePage] Failed to fetch coming soon status, defaulting to true:", e);
  }

  if (isComingSoon) {
    return <ComingSoon />;
  }

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
    console.log("[HomePage] Fetched products count:", initialProducts.length);
  } catch (error) {
    console.error("[HomePage] Failed to load initial products:", error);
  }

  return (
    <main className="w-full bg-white min-h-screen relative pb-24 sm:pb-32">
      <HomeNavbar />
      
      <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto bg-white overflow-hidden flex flex-col relative min-h-screen">
        <section className="flex-1 flex flex-col w-full">
          <div className="w-full flex-shrink-0 flex flex-col">
            <HeroSection />
          </div>
          <div className="flex-1 min-h-[300px] overflow-hidden bg-transparent mt-0">
            <ProductCarousel initialProducts={initialProducts} />
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}

