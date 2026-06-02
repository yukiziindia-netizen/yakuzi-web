import HomeNavbar from '@/components/landing/HomeNavbar';
import HeroSection from '@/components/landing/HeroSection';
import ProductCarousel from '@/components/landing/ProductCarousel';
import { getCategories, getProducts } from '@yukizi/api-client';

export default async function CategoryPage({ params }: { params: { slug: string } | Promise<{ slug: string }> }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const slug = resolvedParams.slug;
  
  let categoryName = slug;
  let categoryId = slug;
  
  try {
    const categories = await getCategories();
    const category = categories.find((c: any) => c.id === slug || c.slug === slug || (c.name && c.name.toLowerCase().replace(/\s+/g, '-') === slug));
    if (category) {
      categoryName = category.name;
      categoryId = category.id;
    }
  } catch (error) {
    console.error("Failed to fetch categories on server", error);
  }

  let initialProducts = [];
  try {
    const res = await getProducts({ categoryId, limit: 100 });
    if (res && res.data && Array.isArray(res.data)) {
      initialProducts = res.data;
    }
  } catch (error) {
    console.error("Failed to load category products:", error);
  }

  return (
    <main className="w-full bg-white min-h-screen relative pb-24 sm:pb-32">
      <HomeNavbar />
      
      <div className="w-full max-w-[1600px] mx-auto bg-white overflow-hidden flex flex-col relative min-h-screen">
        <section className="flex-1 flex flex-col w-full">
          <div className="w-full flex-shrink-0 flex flex-col">
            <HeroSection title={categoryName} />
          </div>
          <div className="flex-1 min-h-[300px] overflow-hidden bg-transparent mt-4 sm:mt-6">
            <ProductCarousel categoryId={categoryId} initialProducts={initialProducts} />
          </div>
        </section>
      </div>
    </main>
  );
}
