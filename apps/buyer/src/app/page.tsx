'use client';

import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import BrandsStrip from '@/components/landing/BrandsStrip';
import ProductCarousel from '@/components/landing/ProductCarousel';
import TrustSection from '@/components/landing/TrustSection';
import Testimonials from '@/components/landing/Testimonials';

export default function HomePage() {
  const handleLoginClick = () => {
    window.dispatchEvent(new CustomEvent('open-login'));
  };

  return (
    <main className="w-full bg-white min-h-screen relative pb-24 sm:pb-32">
      <Navbar showUserActions={true} onLoginClick={handleLoginClick} />
      
      <div className="w-full max-w-[1600px] mx-auto bg-white overflow-hidden flex flex-col relative min-h-screen">
        <section className="flex-1 flex flex-col w-full">
          <div className="w-full flex-shrink-0 flex flex-col">
            <HeroSection />
          </div>
          <div className="flex-1 min-h-[300px] overflow-hidden bg-transparent mt-4 sm:mt-6">
            <ProductCarousel />
          </div>
        </section>
      </div>
    </main>
  );
}
