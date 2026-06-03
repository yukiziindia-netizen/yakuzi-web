import HomeNavbar from '@/components/landing/HomeNavbar';
import HeroSection from '@/components/landing/HeroSection';
import ProductCarousel from '@/components/landing/ProductCarousel';
import { getProducts } from '@yukizi/api-client';

export default async function HomePage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string };
}) {
  let initialProducts: any[] = [];
  try {
    const search = searchParams?.search;
    const res = await getProducts({ limit: 100, search });
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
      
      <div className="w-full max-w-[1600px] mx-auto bg-white overflow-hidden flex flex-col relative min-h-screen">
        <section className="flex-1 flex flex-col w-full">
          <div className="w-full flex-shrink-0 flex flex-col">
            <HeroSection />
          </div>
          <div className="flex-1 min-h-[300px] overflow-hidden bg-transparent mt-4 sm:mt-6">
            <ProductCarousel initialProducts={initialProducts} />
          </div>
        </section>
      </div>
    </main>
  );
}
