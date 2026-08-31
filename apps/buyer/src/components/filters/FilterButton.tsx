'use client';

import { useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Filter } from 'lucide-react';
import { FilterPanel, activeFilterCount } from '@/components/filters/FilterPanel';
import { filterConfigFor } from '@/lib/filters/registry';

/**
 * The nav's filter button, and the drawer it opens.
 *
 * Kept out of Navbar so `useSearchParams()` sits behind its own Suspense
 * boundary — calling it directly in Navbar made every statically prerendered
 * page that renders the nav (e.g. /profile) fail to build.
 *
 * Renders nothing at all when the current route declares no filters. The
 * button used to appear on every page and always open the product-catalogue
 * filter, writing sortBy/minPrice into URLs that no page read.
 */
interface FilterButtonProps {
  /** Dim the icon while another drawer is over the page, matching its siblings. */
  isAnyDrawerOpen: boolean;
  /** Close the cart/wishlist/menu before the filter drawer opens. */
  onOpen: () => void;
  isDesktop: boolean;
}

export function FilterButton({ isAnyDrawerOpen, onOpen, isDesktop }: FilterButtonProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const config = filterConfigFor(pathname ?? '/');
  if (!config) return null;

  const active = activeFilterCount(config, new URLSearchParams(searchParams?.toString() ?? ''));

  return (
    <>
      <button
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) onOpen();
        }}
        aria-label={config.title}
        aria-expanded={isOpen}
        className={`relative transition-all duration-200 hover:scale-110 ${
          isOpen
            ? 'text-[#562996] sm:text-white scale-110 opacity-100'
            : isAnyDrawerOpen
              ? 'text-[#562996]/40 sm:text-white/40 opacity-50'
              : 'text-[#562996] sm:text-white sm:hover:text-purple-300'
        }`}
      >
        <Filter
          className="w-[18px] h-[18px] xs:w-[24px] xs:h-[24px] sm:w-[26px] sm:h-[26px] md:w-[28px] md:h-[28px] stroke-[2]"
          fill={isOpen ? 'currentColor' : 'none'}
        />
        {active > 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 sm:text-[9px] bg-[#f7941d] text-white text-[8px] xs:text-[9px] font-bold rounded-full flex items-center justify-center border border-white sm:border-[#562996]">
            {active}
          </span>
        )}
      </button>

      <FilterPanel
        config={config}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isDesktop={isDesktop}
      />
    </>
  );
}
