import HomeNavbar from '@/components/landing/HomeNavbar';
import CategoryBanner from '@/components/landing/CategoryBanner';
import ProductCarousel from '@/components/landing/ProductCarousel';
import { getCategories, getProducts } from '@yukizi/api-client';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ 
  params,
  searchParams,
}: { 
  params: { slug: string } | Promise<{ slug: string }>;
  searchParams?: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const slug = resolvedParams.slug;
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams;
  const subSlug = resolvedSearchParams?.sub as string | undefined;
  
  let categoryName = slug;
  let categoryId = slug;
  let categoryImage: string | undefined = undefined;
  let categoryData: any = null;
  let allCategories: any[] = [];
  
  try {
    const categories = await getCategories();
    allCategories = categories;
    const category = categories.find((c: any) => c.id === slug || c.slug === slug || (c.name && c.name.toLowerCase().replace(/\s+/g, '-') === slug));
    if (category) {
      categoryData = category;
      categoryName = category.name;
      categoryId = category.id;
      categoryImage = category.image || undefined;
      if (categoryImage && categoryImage.startsWith('/')) {
        const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/api$/, "");
        categoryImage = `${base}${categoryImage}`;
      }
    }
  } catch (error) {
    console.error("Failed to fetch categories on server", error);
  }

  let initialProducts: any[] = [];
  try {
    const res = await getProducts({ categoryId, limit: 100 });
    if (res && res.data && Array.isArray(res.data)) {
      initialProducts = res.data;
    }
  } catch (error) {
    console.error("Failed to load category products:", error);
  }

  let breadcrumbs: string[] = [];
  if (categoryData) {
    const findPath = (cats: any[], targetId: string, path: string[]): string[] | null => {
      for (const c of cats) {
        if (c.id === targetId || c.slug === targetId || c.name === targetId) return [...path, c.name];
        if (c.subCategories && Array.isArray(c.subCategories)) {
          const found = findPath(c.subCategories, targetId, [...path, c.name]);
          if (found) return found;
        }
      }
      return null;
    };
    
    // We wrap in try/catch just in case the categories array doesn't match expectations
    try {
      const targetSlug = subSlug || slug;
      const path = findPath(allCategories, targetSlug, []);
      if (path && path.length > 0) {
        breadcrumbs = path;
      } else {
        breadcrumbs = [categoryName];
      }
    } catch (err) {
      breadcrumbs = [categoryName];
    }
  }

  const displayCategoryName = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : categoryName;

  return (
    <main className="w-full bg-white min-h-screen relative pb-24 sm:pb-32">
      <HomeNavbar />
      
      <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto bg-white overflow-hidden flex flex-col relative min-h-screen">
        <section className="flex-1 flex flex-col w-full">
          {/* Mobile Header (Category Name & Breadcrumb) */}
          <div className="flex flex-col px-4 sm:hidden pt-4 pb-2">
            <h1 className="text-3xl xs:text-3xl font-bold text-gray-500 tracking-tight leading-none mb-1.5">
              {displayCategoryName}
            </h1>
            <p className="text-sm xs:text-sm text-gray-400 font-medium flex flex-wrap gap-1 items-center">
              {breadcrumbs.length > 0 
                ? breadcrumbs.map((crumb, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      {crumb}
                      {idx < breadcrumbs.length - 1 && <span>&gt;</span>}
                    </span>
                  ))
                : categoryName}
            </p>
          </div>

          {/* Desktop Banner */}
          <div className="hidden sm:flex w-full flex-shrink-0 flex-col">
            <CategoryBanner title={categoryName} imageUrl={categoryImage} />
          </div>
          <div className="flex-1 min-h-[300px] overflow-hidden bg-transparent mt-4 sm:mt-6">
            <ProductCarousel categoryId={categoryId} initialProducts={initialProducts} />
          </div>
        </section>
      </div>
    </main>
  );
}
