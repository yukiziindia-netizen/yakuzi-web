'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import ProductCard from '@/components/shared/ProductCard';
import { getFeaturedProducts } from '@pharmabag/api-client';

interface ProductCarouselProps {
  reverse?: boolean;
  slot?: 'HOMEPAGE_CAROUSEL' | 'LOGIN_CAROUSEL';
}

export default function ProductCarousel({ reverse = false, slot = 'HOMEPAGE_CAROUSEL' }: ProductCarouselProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getFeaturedProducts(slot);
        if (data && Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to load featured products', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slot]);

  if (loading) return <div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>;
  if (!products.length) return null;

  // Duplicating for infinite scroll effect (need at least a few items for it to look good)
  const scrollProducts = products.length >= 4 
    ? [...products, ...products, ...products] 
    : [...products, ...products, ...products, ...products, ...products];

  return (
    <div className="w-full h-full mb-4 sm:mb-6 lg:mb-8 overflow-hidden bg-transparent mx-auto pl-[4vw] lg:pl-4 pr-[4vw] flex flex-col justify-center items-center pt-0 lg:pt-2">
      <div className="relative w-full flex items-center bg-transparent">
        <motion.div
          animate={{ x: reverse ? ['-33.33%', 0] : [0, '-33.33%'] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 40,
              ease: "linear",
            }
          }}
          className="flex w-max gap-4 sm:gap-6"
        >
          {scrollProducts.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="flex-shrink-0 w-[120px] sm:w-[130px] md:w-[150px]"
            >
              <ProductCard
                name={product.name}
                price={`₹${product.mrp || 545}`}
                image={product.images?.[0]?.url || product.image || '/products/pharma_bottle.png'}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
