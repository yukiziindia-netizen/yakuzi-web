import { cache } from 'react';
import type { Metadata } from 'next';
import HomeNavbar from '@/components/landing/HomeNavbar';
import CategoryBanner from '@/components/landing/CategoryBanner';
import ProductCarousel from '@/components/landing/ProductCarousel';
import { getCategories, getProducts } from '@yukizi/api-client';
import { absoluteUrl, metaTruncate, SITE_NAME } from '@/lib/seo/site';
import { breadcrumbSchema, itemListSchema } from '@/lib/seo/schema';
import JsonLd from '@/components/seo/JsonLd';

export const dynamic = 'force-dynamic';

// Shared across generateMetadata + the page body so both consume the same
// getCategories() fetch (deduped per-request by React's cache()).
const getCategoriesCached = cache(async (): Promise<any[]> => {
  try {
    const categories = await getCategories();
    return Array.isArray(categories) ? categories : [];
  } catch (error) {
    console.error("Failed to fetch categories on server", error);
    return [];
  }
});

const findCategory = cache(async (slug: string) => {
  const categories = await getCategoriesCached();
  return (
    categories.find(
      (c: any) =>
        c.id === slug || c.slug === slug || (c.name && c.name.toLowerCase().replace(/\s+/g, '-') === slug),
    ) ?? null
  );
});

export async function generateMetadata({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = params instanceof Promise ? await params : params;
  const slug = resolvedParams.slug;
  const cat: any = await findCategory(slug);
  if (!cat) return { title: 'Category not found', robots: { index: false } };
  const title = `${cat.name} — Buy Online`;
  const description = metaTruncate(
    cat.description || `Shop ${cat.name} on ${SITE_NAME}: authentic products from verified sellers with fast shipping across India.`,
  );
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/category/${slug}`) }, // ?sub= does not filter → always canonicalize to base
    openGraph: { title, description, url: absoluteUrl(`/category/${slug}`) },
  };
}

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
  let categoryMobileImage: string | undefined = undefined;
  // NOTE: unknown slugs intentionally do NOT 404 here — the page falls back to
  // rendering the raw slug as the category name with an (empty) product list.
  // Preserving that existing behavior.
  const categoryData: any = await findCategory(slug);
  const allCategories: any[] = await getCategoriesCached();

  if (categoryData) {
    categoryName = categoryData.name;
    categoryId = categoryData.id;
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/api$/, "");
    const absolute = (url?: string) =>
      url && url.startsWith('/') ? `${base}${url}` : url;
    categoryImage = absolute(categoryData.image || undefined);
    categoryMobileImage = absolute(categoryData.mobileImage || undefined);
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
      <JsonLd
        data={[
          breadcrumbSchema([{ name: 'Home', path: '/' }, { name: categoryName }]),
          itemListSchema(categoryName, initialProducts.slice(0, 24)),
        ]}
      />
      <HomeNavbar />

      <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto bg-white overflow-hidden flex flex-col relative min-h-screen">
        <section className="flex-1 flex flex-col w-full">
          {/* Banner. One responsive component rather than a desktop-only block:
              it picks the phone artwork itself and falls back to the desktop
              image when a collection has no separate mobile upload. */}
          <div className="w-full flex-shrink-0 flex flex-col">
            <CategoryBanner
              title={categoryName}
              imageUrl={categoryImage}
              mobileImageUrl={categoryMobileImage}
            />
          </div>

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

          <div className="flex-1 min-h-[300px] overflow-hidden bg-transparent mt-4 sm:mt-6">
            <ProductCarousel categoryId={categoryId} initialProducts={initialProducts} />
          </div>
        </section>
      </div>
    </main>
  );
}
