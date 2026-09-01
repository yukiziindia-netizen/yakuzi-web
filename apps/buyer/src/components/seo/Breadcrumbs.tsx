import Link from 'next/link';
import type { BreadcrumbItem } from '@/lib/seo/schema';

/**
 * The visible breadcrumb, built from the same array as the JSON-LD.
 *
 * Five page types emitted a BreadcrumbList and only one rendered a trail, so
 * four of them told Google about navigation that was not on the page. Google's
 * guidance is that structured data must represent visible content, and a
 * mismatch is grounds to ignore the markup — the rich result was at risk on
 * every one of them.
 *
 * Taking the same `BreadcrumbItem[]` the schema builder takes is the point:
 * the two are rendered from one array, so they cannot drift apart again. The
 * product page's separate visible trail had gained a sub-collection step the
 * schema never learned about, which is exactly that drift.
 *
 * The last item is the current page: no link, and aria-current so assistive
 * technology says so.
 */
export default function Breadcrumbs({
  items,
  className = '',
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`hide-scrollbar flex items-center gap-1 overflow-x-auto whitespace-nowrap text-sm font-normal text-gray-600 ${className}`}
    >
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${item.name}-${i}`} className="flex items-center gap-1">
            {i > 0 && <span className="mx-1 text-gray-400">&gt;</span>}
            {item.path && !last ? (
              <Link href={item.path} className="transition-colors hover:text-[#854cbc]">
                {item.name}
              </Link>
            ) : (
              <span className={last ? 'max-w-[240px] truncate text-gray-700' : ''} aria-current={last ? 'page' : undefined}>
                {item.name}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
