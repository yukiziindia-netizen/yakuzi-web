'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { HomepageSection } from '@yukizi/api-client';
import { GridProductCard } from './ProductCarousel';
import QuickReviewModal from './QuickReviewModal';

export default function CategoryScrollRow({ section }: { section: HomepageSection }) {
  const [reviewProduct, setReviewProduct] = useState<any | null>(null);

  // The API already omits sections with zero products (findAllPublic filters
  // them server-side) — this is defense-in-depth against a contract violation,
  // not the primary guard against an empty row rendering.
  if (!section.products?.length) return null;

  return (
    <div className="w-full max-w-[1600px] 2xl:max-w-none mx-auto mb-8 sm:mb-12">
      <div className="flex items-center justify-between px-4 sm:px-8 mb-3">
        <h2 className="text-base sm:text-xl font-semibold text-[#333333]">{section.title}</h2>
        <Link
          href={`/category/${section.category.slug}`}
          className="flex items-center justify-center h-7 w-7 rounded-full text-gray-500 hover:text-[#7B2FBE] hover:bg-[#7B2FBE]/10 transition-colors shrink-0"
          aria-label={`View all products in ${section.title}`}
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 px-4 sm:px-8 pb-1 scrollbar-hide">
        {section.products.map((product, index) => (
          <div key={`${product?.id || 'prod'}-${index}`} className="snap-start shrink-0 w-[150px] sm:w-[210px]">
            <GridProductCard product={product} index={index} onOpenReview={setReviewProduct} />
          </div>
        ))}
      </div>

      {reviewProduct && (
        <QuickReviewModal
          isOpen={!!reviewProduct}
          onClose={() => setReviewProduct(null)}
          product={reviewProduct}
        />
      )}
    </div>
  );
}
