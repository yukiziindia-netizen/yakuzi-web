import { cache, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HomeNavbar from '@/components/landing/HomeNavbar';
import CategoryBanner from '@/components/landing/CategoryBanner';
import ProductCarousel from '@/components/landing/ProductCarousel';
import { getCategories, getProducts } from '@yukizi/api-client';
import { absoluteUrl, metaTruncate, SITE_NAME } from '@/lib/seo/site';
import { applySeoOverride, fetchSeoOverride, validFaqs } from '@/lib/seo/overrides';
import { breadcrumbSchema, faqPageSchema, collectionPageSchema } from '@/lib/seo/schema';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import SeoFaq from '@/components/seo/SeoFaq';

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
  searchParams,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
  searchParams?: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolvedParams = params instanceof Promise ? await params : params;
  const slug = resolvedParams.slug;
  const cat: any = await findCategory(slug);
  if (!cat) return { title: 'Category not found', robots: { index: false } };
  const resolvedSearch = searchParams instanceof Promise ? await searchParams : searchParams;
  const subParam = typeof resolvedSearch?.sub === 'string' ? resolvedSearch.sub : undefined;
  const matchedSub = subParam && Array.isArray(cat.subCategories)
    ? cat.subCategories.find((sc: any) => sc.id === subParam || sc.slug === subParam)
    : undefined;
  const title = `${cat.name} — Buy Online`;
  const description = metaTruncate(
    cat.description || `Shop ${cat.name} on ${SITE_NAME}: authentic products from verified sellers with fast shipping across India.`,
  );
  // Category pages previously shipped NO og:image at all (the site logo isn't
  // even inherited here) — use the category's own banner artwork, matching the
  // fallback order the page body uses for the visible banner.
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000').replace(/\/api$/, '');
  const absoluteImage = (url?: string) => (url && url.startsWith('/') ? `${apiBase}${url}` : url);
  const ogImage = absoluteImage(
    (Array.isArray(cat.bannerImages) && cat.bannerImages[0]?.image) || cat.image || undefined,
  );
  const derived: Metadata = {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/category/${slug}`) }, // sub-category pages canonicalize to the parent category page to avoid duplicate-content indexing
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/category/${slug}`),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
  // Sub-collection pages: admin-set meta title/description apply, but the
  // canonical DEFAULTS to the parent URL (duplicate-content protection) —
  // only an explicitly-set canonicalUrl on the sub's record overrides it.
  if (matchedSub) {
    const subOverride = await fetchSeoOverride('SUB_CATEGORY', matchedSub.id);
    if (subOverride) return applySeoOverride(derived, subOverride);
  }
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
  categorySlug,
  searchParams,
}: {
  categoryId: string;
  subCategoryId?: string;
  categoryName: string;
  categorySlug: string;
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
      <JsonLd data={[collectionPageSchema({
        name: categoryName,
        path: `/category/${categorySlug}`,
        items: initialProducts.slice(0, 24),
        // Newest product change in the set = when this listing last changed.
        dateModified: initialProducts
          .map((p: any) => p?.updatedAt)
          .filter(Boolean)
          .sort()
          .pop() ?? null,
      })]} />
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
  const categoryData: any = await findCategory(slug);
  // Unknown slugs used to render an empty page at HTTP 200 — a soft-404 that
  // Google counts against the whole category directory. Products already
  // 404 correctly; categories now match.
  if (!categoryData) notFound();

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

  // Admin-authored category FAQs (SEO dashboard → CATEGORY override), same
  // pattern the PDP uses: visible <SeoFaq> + FAQPage JSON-LD from the SAME
  // entries, so the markup never advertises hidden content. Renders nothing
  // until an admin actually writes FAQs for this category. The override fetch
  // is Next-cached (revalidate 300), so generateMetadata's identical call and
  // this one cost a single origin request between them.
  // Sub-collection pages show the sub's own FAQs when an admin has written
  // any, else the parent collection's.
  let faqs: ReturnType<typeof validFaqs> = [];
  if (categoryData) {
    if (subCategoryId) {
      faqs = validFaqs((await fetchSeoOverride('SUB_CATEGORY', subCategoryId))?.faq);
    }
    if (faqs.length === 0) {
      faqs = validFaqs((await fetchSeoOverride('CATEGORY', categoryData.id))?.faq);
    }
  }
  // One array, used for both the JSON-LD and the visible trail below, so the
  // two can never describe different navigation.
  const crumbs = [{ name: 'Home', path: '/' }, { name: categoryName }];

  const jsonLd: object[] = [
    breadcrumbSchema(crumbs),
  ];
  if (faqs.length) jsonLd.push(faqPageSchema(faqs));

  return (
    <main className="w-full bg-white min-h-screen relative pb-24 sm:pb-32">
      <JsonLd data={jsonLd} />
      <HomeNavbar />

      <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto bg-white overflow-hidden flex flex-col relative min-h-screen">
        {/* The trail the BreadcrumbList has always described but the page
            never showed. */}
        <Breadcrumbs items={crumbs} className="px-[4vw] pt-24 sm:pt-28 md:pt-32" />
        <section className="flex-1 flex flex-col w-full">
          {/* Banner slideshow. One responsive component rather than a
              desktop-only block: each slide picks the phone artwork itself
              and falls back to its desktop image when a collection has no
              separate mobile upload. Sub-category pages show the sub's own
              slides when it has any, else the parent category's. */}
          <div className="w-full flex-shrink-0 flex flex-col">
            <CategoryBanner title={categoryName} banners={bannerSlides} />
          </div>

          {/* Admin-authored intro copy (Collections modal -> Description).
              Server-rendered, so crawlers finally get real words on what was
              previously a name + product grid. Feeds the meta description via
              generateMetadata's existing cat.description read. */}
          {categoryData?.description && (
            <div className="px-4 sm:px-6 pt-3 sm:pt-4 max-w-3xl">
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {categoryData.description}
              </p>
            </div>
          )}

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
              <CategoryProducts categoryId={categoryId} subCategoryId={subCategoryId} categoryName={categoryName} categorySlug={slug} searchParams={resolvedSearchParams} />
            </Suspense>
          </div>

          <SeoFaq faqs={faqs} />
        </section>
      </div>
    </main>
  );
}
