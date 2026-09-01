import Link from 'next/link';
import { getProducts } from '@yukizi/api-client';
import { productImageAlt } from '@/lib/seo/image-alt';

/**
 * Related products, rendered on the server.
 *
 * The product page already showed a "Related Products" rail, but it was built
 * client-side: the served HTML contained the heading and not one link. A
 * product page carried 14 internal links, every one of them navigation or
 * policy, and **zero** to another product.
 *
 * That made every product a dead end. Link equity arrived from the category
 * page and stopped there, and the strongest relevance signal a shop has —
 * this item is related to that one — existed only after JavaScript ran, which
 * Google treats as a lower-priority second pass.
 *
 * Same category, cheapest-first, current product excluded. Rendered as plain
 * anchors so the links exist without JavaScript.
 */
interface Props {
  currentId: string;
  currentSlug: string;
  categoryId?: string;
  categoryName?: string;
  /** Category URLs are keyed by slug, never by id. */
  categorySlug?: string;
}

export default async function RelatedProductsServer({
  currentId,
  currentSlug,
  categoryId,
  categoryName,
  categorySlug,
}: Props) {
  if (!categoryId) return null;

  let items: any[] = [];
  try {
    const res = await getProducts({ categoryId, limit: 12 });
    items = (res.data ?? [])
      .filter((p: any) => p?.name && p.id !== currentId && (p.slug ?? p.id) !== currentSlug)
      .slice(0, 8);
  } catch {
    // Fail open: the client rail still renders, exactly as before.
    return null;
  }
  if (!items.length) return null;

  return (
    <section aria-labelledby="related-server-heading" className="mx-auto max-w-7xl px-[4vw] pb-16">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id="related-server-heading" className="text-lg font-bold text-gray-900">
          More from {categoryName ?? 'this category'}
        </h2>
        {categorySlug && (
          <Link href={`/category/${categorySlug}`} className="text-sm font-semibold text-[#854cbc] hover:underline">
            View all
          </Link>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {items.map((p: any) => (
          <li key={p.id}>
            <Link href={`/products/${p.slug ?? p.id}`} className="group block">
              <div className="aspect-square overflow-hidden rounded-xl bg-[#f8f8f8]">
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt={productImageAlt(p.name)}
                    loading="lazy"
                    decoding="async"
                    width={200}
                    height={200}
                    className="h-full w-full object-contain p-2 transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-xs font-medium text-gray-800">{p.name}</p>
              {p.price != null && (
                <p className="text-xs font-bold text-gray-900">₹{Math.round(Number(p.price))}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
