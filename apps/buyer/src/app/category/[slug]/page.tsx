'use client';

import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import ProductCarousel from '@/components/landing/ProductCarousel';
import { useCategories } from '@/hooks/useProducts';
import { use } from 'react';

export default function CategoryPage({ params }: { params: { slug: string } | Promise<{ slug: string }> }) {
  // Handle both standard params and Next.js 15+ promise params
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const slug = resolvedParams.slug;
  
  const { data: categoriesData } = useCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.data ?? [];
  const category = categories.find((c: any) => c.id === slug || c.name.toLowerCase().replace(/\s+/g, '-') === slug);

  const handleLoginClick = () => {
    window.dispatchEvent(new CustomEvent('open-login'));
  };

  return (
    <main className="w-full bg-white min-h-screen relative pb-24 sm:pb-32">
      <Navbar showUserActions={true} onLoginClick={handleLoginClick} />
      
      <div className="w-full max-w-[1600px] mx-auto bg-white overflow-hidden flex flex-col relative min-h-screen">
        <section className="flex-1 flex flex-col w-full">
          <div className="w-full flex-shrink-0 flex flex-col">
            <HeroSection title={category?.name || slug} />
          </div>
          <div className="flex-1 min-h-[300px] overflow-hidden bg-transparent mt-4 sm:mt-6">
            <ProductCarousel categoryId={category?.id || slug} />
          </div>
        </section>
      </div>
    </main>
  );
}
