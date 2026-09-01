import Link from 'next/link';
import Image from 'next/image';
import { getBlogs, getCategories, getProducts } from '@yukizi/api-client';
import { productImageAlt } from '@/lib/seo/image-alt';

/**
 * What sits under a post: related reading, and the products the post is about.
 *
 * Two gaps this closes. Posts linked to nothing, so every article was an
 * island — no topical cluster for search engines to read, and no path from a
 * reader to anything for sale. On a shop, an article that never links to the
 * catalogue has no commercial function at all.
 *
 * Both blocks are derived, not curated: related posts come from the same blog
 * category, and products come from the storefront category whose name matches
 * it. When there is no confident match the block is omitted rather than
 * padded with arbitrary products — a "related" rail of unrelated things is
 * worse than none.
 */

interface Props {
  currentSlug: string;
  categoryName?: string;
  tags?: string[];
}

async function relatedPosts(currentSlug: string, categoryName?: string, tags?: string[]) {
  try {
    const res = await getBlogs({ limit: 50, status: 'PUBLISHED' });
    const all = (res.data ?? []).filter((p) => p.slug !== currentSlug);
    if (!all.length) return [];

    const sameCategory = categoryName
      ? all.filter((p) => p.category?.name?.toLowerCase() === categoryName.toLowerCase())
      : [];
    const sharesTag = tags?.length
      ? all.filter((p) => p.tags?.some((t) => tags.some((x) => x.toLowerCase() === t.toLowerCase())))
      : [];

    // Category first, then a shared tag, then simply the newest — so the rail
    // is populated even for the very first posts, when nothing matches yet.
    const ranked = [...sameCategory, ...sharesTag, ...all];
    const seen = new Set<string>();
    return ranked.filter((p) => !seen.has(p.id) && seen.add(p.id)).slice(0, 3);
  } catch {
    return [];
  }
}

async function shoppableCategory(categoryName?: string) {
  if (!categoryName) return null;
  try {
    const cats = await getCategories();
    const match = (Array.isArray(cats) ? cats : []).find(
      (c) => c?.name?.toLowerCase() === categoryName.toLowerCase(),
    );
    if (!match?.slug) return null;
    const res = await getProducts({ categoryId: match.id, limit: 4 });
    const products = (res.data ?? []).filter((p: { name?: string }) => p?.name);
    if (!products.length) return null;
    return { name: match.name as string, slug: match.slug as string, products };
  } catch {
    return null;
  }
}

export default async function PostFooterLinks({ currentSlug, categoryName, tags }: Props) {
  const [posts, shop] = await Promise.all([
    relatedPosts(currentSlug, categoryName, tags),
    shoppableCategory(categoryName),
  ]);

  if (!posts.length && !shop) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-12 px-4 pb-16">
      {shop && (
        <section aria-labelledby="shop-heading">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 id="shop-heading" className="text-lg font-bold text-gray-900">
              Shop {shop.name}
            </h2>
            <Link href={`/category/${shop.slug}`} className="text-sm font-semibold text-[#854cbc] hover:underline">
              View all
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {shop.products.map((p: any) => (
              <li key={p.id}>
                <Link href={`/products/${p.slug ?? p.id}`} className="group block">
                  <div className="aspect-square overflow-hidden rounded-xl bg-gray-50">
                    {p.images?.[0]?.url && (
                      <Image
                        src={p.images[0].url}
                        alt={productImageAlt(p.name)}
                        width={240}
                        height={240}
                        loading="lazy"
                        className="h-full w-full object-contain transition-transform group-hover:scale-105"
                      />
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-gray-800">{p.name}</p>
                  {p.price != null && (
                    <p className="text-sm font-bold text-gray-900">₹{Math.round(Number(p.price))}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {posts.length > 0 && (
        <section aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-4 text-lg font-bold text-gray-900">
            Keep reading
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={`/blogs/${post.slug}`} className="group block">
                  {post.featuredImage && (
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      width={320}
                      height={180}
                      loading="lazy"
                      className="mb-2 aspect-[16/9] w-full rounded-xl object-cover"
                    />
                  )}
                  <h3 className="text-sm font-semibold leading-snug text-gray-900 group-hover:text-[#854cbc]">
                    {post.title}
                  </h3>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
