import { cache, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';
import HomeNavbar from '@/components/landing/HomeNavbar';
import CategoryBanner from '@/components/landing/CategoryBanner';
import ProductCarousel from '@/components/landing/ProductCarousel';
import { getCategories, getProducts } from '@yukizi/api-client';
import { absoluteUrl, metaTruncate, SITE_NAME } from '@/lib/seo/site';
import { applySeoOverride, fetchSeoOverride } from '@/lib/seo/overrides';
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
  const derived: Metadata = {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/category/${slug}`) }, // sub-category pages canonicalize to the parent category page to avoid duplicate-content indexing
    openGraph: { title, description, url: absoluteUrl(`/category/${slug}`) },
  };
  return applySeoOverride(derived, await fetchSeoOverride('CATEGORY', cat.id));
}

// Streams in after the shell: the banner, name and breadcrumb paint without
// waiting for the (slow) products query. The grid is still fully
// server-rendered into the streamed HTML, itemList JSON-LD included, so
// crawlers see the same markup as before.
async function CategoryProducts({
  categoryId,
  subCategoryId,
  categoryName,
  searchParams,
}: {
  categoryId: string;
  subCategoryId?: string;
  categoryName: string;
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  let initialProducts: any[] = [];
  // Same filter params the Filters panel writes to the URL on the homepage —
  // previously never read here, so opening Filters while browsing a category
  // silently did nothing.
  const str = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);
  try {
    const res = await getProducts({
      categoryId,
      subCategoryId,
      limit: 100,
      sortBy: str(searchParams?.sortBy),
      sortOrder: str(searchParams?.sortOrder) === 'asc' || str(searchParams?.sortOrder) === 'desc' ? (searchParams?.sortOrder as 'asc' | 'desc') : undefined,
      minPrice: str(searchParams?.minPrice) ? Number(searchParams?.minPrice) : undefined,
      maxPrice: str(searchParams?.maxPrice) ? Number(searchParams?.maxPrice) : undefined,
      isNew: str(searchParams?.isNew) === 'true' ? true : undefined,
      isYukiziChoice: str(searchParams?.isYukiziChoice) === 'true' ? true : undefined,
      isBestSelling: str(searchParams?.isBestSelling) === 'true' ? true : undefined,
      discountRange: str(searchParams?.discountRange) && searchParams?.discountRange !== 'All' ? str(searchParams?.discountRange) : undefined,
      location: str(searchParams?.location) && searchParams?.location !== 'All' ? str(searchParams?.location) : undefined,
      manufacturer: str(searchParams?.manufacturer) && searchParams?.manufacturer !== 'All' ? str(searchParams?.manufacturer) : undefined,
    });
    if (res && res.data && Array.isArray(res.data)) {
      initialProducts = res.data;
    }
  } catch (error) {
    console.error("Failed to load category products:", error);
  }
  return (
    <>
      <JsonLd data={[itemListSchema(categoryName, initialProducts.slice(0, 24))]} />
      <ProductCarousel categoryId={categoryId} initialProducts={initialProducts} />
    </>
  );
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
  let bannerSlides: { id?: string; image: string; mobileImage?: string | null }[] = [];
  // NOTE: unknown slugs intentionally do NOT 404 here — the page falls back to
  // rendering the raw slug as the category name with an (empty) product list.
  // Preserving that existing behavior.
  const categoryData: any = await findCategory(slug);

  let subCategoryId: string | undefined;
  let matchedSubName: string | undefined;
  if (categoryData) {
    categoryName = categoryData.name;
    categoryId = categoryData.id;
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/api$/, "");
    const absolute = (url?: string) =>
      url && url.startsWith('/') ? `${base}${url}` : url;

    // Resolve ?sub=<slug|id> against this category's own sub-categories so the
    // product grid can actually be filtered to it (previously only used for
    // the breadcrumb trail — the grid silently fell back to the whole parent
    // category, e.g. every Figurine showing on a Funko Pop sub-category page).
    let matchedSub: any;
    if (subSlug && Array.isArray(categoryData.subCategories)) {
      matchedSub = categoryData.subCategories.find(
        (s: any) => s.id === subSlug || s.slug === subSlug,
      );
      subCategoryId = matchedSub?.id;
      matchedSubName = matchedSub?.name;
    }

    // Banner slideshow: the matched sub-category's own slides when it has
    // any, else the parent category's, else the category's legacy single
    // image pair (safety for the window before the API deploy backfills
    // bannerImages).
    const toSlides = (rows: any[]): typeof bannerSlides =>
      rows
        .filter((r) => r?.image)
        .map((r) => ({
          id: r.id,
          image: absolute(r.image)!,
          mobileImage: absolute(r.mobileImage || undefined) ?? null,
        }));
    const subSlides = Array.isArray(matchedSub?.bannerImages)
      ? toSlides(matchedSub.bannerImages)
      : [];
    const categorySlides = Array.isArray(categoryData.bannerImages)
      ? toSlides(categoryData.bannerImages)
      : [];
    bannerSlides = subSlides.length > 0 ? subSlides : categorySlides;
    if (bannerSlides.length === 0 && categoryData.image) {
      bannerSlides = [
        {
          image: absolute(categoryData.image)!,
          mobileImage: absolute(categoryData.mobileImage || undefined) ?? null,
        },
      ];
    }
  }

  // Built directly from the already-resolved categoryData/matchedSub above,
  // not re-derived from a fresh slug search — a sub-category slug (e.g.
  // "funko-pop") isn't globally unique, only unique per parent category, so
  // searching the whole category tree by slug alone (the old `findPath`
  // approach) could resolve to a *different* parent than the one this page
  // actually matched, showing e.g. "DC Comics > Funko Pop" for a Funko Pop
  // page reached via Collectables.
  const breadcrumbs: string[] = categoryData
    ? matchedSubName
      ? [categoryName, matchedSubName]
      : [categoryName]
    : [];

  const displayCategoryName = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : categoryName;

  return (
    <main className="w-full bg-white min-h-screen relative pb-24 sm:pb-32">
      <JsonLd
        data={[
          breadcrumbSchema([{ name: 'Home', path: '/' }, { name: categoryName }]),
        ]}
      />
      <HomeNavbar />

      <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto bg-white overflow-hidden flex flex-col relative min-h-screen">
        <section className="flex-1 flex flex-col w-full">
          {/* Banner slideshow. One responsive component rather than a
              desktop-only block: each slide picks the phone artwork itself
              and falls back to its desktop image when a collection has no
              separate mobile upload. Sub-category pages show the sub's own
              slides when it has any, else the parent category's. */}
          <div className="w-full flex-shrink-0 flex flex-col">
            <CategoryBanner title={categoryName} banners={bannerSlides} />
          </div>

          {/* Mobile Header (Category Name & Breadcrumb). Not an h1 — the page's
              single h1 is CategoryBanner's sr-only one, and this block stays in
              the DOM at every viewport (sm:hidden only hides it visually), so an
              h1 here made every category page carry TWO h1s. */}
          <div className="flex flex-col px-4 sm:hidden pt-4 pb-2">
            <p aria-hidden="true" className="text-3xl xs:text-3xl font-bold text-gray-500 tracking-tight leading-none mb-1.5">
              {displayCategoryName}
            </p>
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
            <Suspense
              fallback={
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#854cbc]" />
                </div>
              }
            >
              <CategoryProducts categoryId={categoryId} subCategoryId={subCategoryId} categoryName={categoryName} searchParams={resolvedSearchParams} />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  );
}
