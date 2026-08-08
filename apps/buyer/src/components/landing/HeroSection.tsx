'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBrands, useBanners } from '@/hooks/useProducts';

// Routes a remote image through /_next/image so the browser downloads a
// resized AVIF/WebP variant instead of the original upload (banner uploads
// measure 200-300KB each; the optimized variant is a fraction of that).
// SVGs and non-absolute URLs are left alone - the optimizer refuses SVG,
// and the Wikimedia fallback logos are SVG.
const canOptimize = (url?: string) =>
  !!url && /^https?:\/\//i.test(url) && !/\.svg([?#]|$)/i.test(url);
const optimizedUrl = (url: string, w: number) =>
  `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`;
// Widths must come from next.config's deviceSizes/imageSizes defaults.
const bannerSrcSet = (url?: string) =>
  canOptimize(url)
    ? [640, 750, 1080, 1920].map((w) => `${optimizedUrl(url!, w)} ${w}w`).join(', ')
    : undefined;
const logoSrcSet = (url?: string) =>
  canOptimize(url)
    ? `${optimizedUrl(url!, 128)} 1x, ${optimizedUrl(url!, 256)} 2x`
    : undefined;

export default function HeroSection({ initialBanners }: { initialBanners?: any[] }) {
  const { data: brandsData, isLoading: isLoadingBrands } = useBrands();
  const { data: bannersData } = useBanners(initialBanners);

  // The API sorts by `order`, but the admin form does not set it, so every
  // banner currently comes back with the same value and the tie is broken
  // arbitrarily by Postgres. Sort defensively so the sequence is stable across
  // requests: by `order`, then oldest first.
  const banners = React.useMemo(() => {
    const list = Array.isArray(bannersData)
      ? bannersData.filter((b) => b.isActive !== false)
      : [];
    return [...list].sort((a, b) => {
      const orderDiff = (a.order ?? 0) - (b.order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return (
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      );
    });
  }, [bannersData]);

  // The hero cycles through every active banner the admin has uploaded, in the
  // order the API returns them (it already sorts by `order` and filters out
  // inactive ones). With a single banner this renders exactly as before: no
  // dots, no arrows, no auto-advance.
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isBannerPaused, setIsBannerPaused] = useState(false);

  const hasBannerSlideshow = banners.length > 1;

  // Guard against the index dangling past the end when banners are added or
  // removed while the page is open.
  useEffect(() => {
    if (bannerIndex > banners.length - 1) {
      setBannerIndex(0);
    }
  }, [banners.length, bannerIndex]);

  useEffect(() => {
    if (!hasBannerSlideshow || isBannerPaused) return;
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [hasBannerSlideshow, isBannerPaused, banners.length]);

  const goToPrevBanner = useCallback(() => {
    setBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToNextBanner = useCallback(() => {
    setBannerIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const heroBanner = banners[bannerIndex];
  const heroBannerImage =
    heroBanner?.imageUrl || 'https://placehold.co/1600x300/f3f4f6/9ca3af?text=Banner';

  const brands = Array.isArray(brandsData) ? brandsData.filter((b) => b.isActive !== false) : [];

  // Fallback images if no brands exist in the database yet
  const fallbackBrands = [
    {
      id: '1',
      name: 'Naruto',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Naruto_logo.svg',
    },
    {
      id: '2',
      name: 'Attack on Titan',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Attack_on_Titan_logo.png',
    },
    {
      id: '3',
      name: 'One Piece',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/29/One_Piece_Logo.svg',
    },
    {
      id: '4',
      name: 'Demon Slayer',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/9/91/Demon_Slayer_Kimetsu_no_Yaiba_logo.svg',
    },
  ];

  const displayBrands = brands.length > 0 ? brands : fallbackBrands;

  // The strip revolves continuously rather than stepping through pages, so it
  // needs no index, no timer and no arrows - the animation is entirely in CSS.
  //
  // The track is rendered as two identical halves and shifted by -50%, which
  // lands on the start of the second half and loops without a visible jump.
  // With only a handful of logos the list is repeated more times so the track
  // is still wider than a large screen, which it must be or the loop shows a
  // gap. The count stays even to keep the two halves identical.
  const marqueeRepeats = displayBrands.length >= 6 ? 2 : 4;
  const marqueeBrands: any[] = [];
  for (let i = 0; i < marqueeRepeats; i += 1) {
    marqueeBrands.push(...displayBrands);
  }
  const marqueeHalfLength = marqueeBrands.length / 2;

  // Longer lists take proportionally longer, so the logos travel at the same
  // speed whatever the brand count.
  const marqueeDuration = `${Math.max(marqueeHalfLength * 5, 20)}s`;

  return (
    <div className="relative z-10 flex w-full flex-col bg-white">
      {/* Top Main Section: full-width banner, cycling when there is more than one */}
      <div className="border-b border-gray-200">
        <div
          className="relative h-[250px] w-full overflow-hidden bg-white md:h-[300px]"
          onMouseEnter={() => setIsBannerPaused(true)}
          onMouseLeave={() => setIsBannerPaused(false)}
          role={hasBannerSlideshow ? 'region' : undefined}
          aria-label={hasBannerSlideshow ? 'Featured banners' : undefined}
          aria-roledescription={hasBannerSlideshow ? 'carousel' : undefined}
        >
          {banners.length === 0 ? (
            <img
              src={heroBannerImage}
              alt="Featured"
              className="h-full w-full object-cover"
            />
          ) : (
            banners.map((banner, index) => {
              const isCurrent = index === bannerIndex;
              const desktopImage = banner?.imageUrl || heroBannerImage;
              // Admins can upload a separate narrow-viewport crop; without
              // one, phones simply get the desktop art as before.
              const mobileImage = banner?.mobileImageUrl || desktopImage;
              const slide = (
                <picture className="block h-full w-full">
                  <source
                    media="(min-width: 1024px)"
                    srcSet={bannerSrcSet(desktopImage) ?? desktopImage}
                    sizes="100vw"
                  />
                  <img
                    src={mobileImage}
                    srcSet={bannerSrcSet(mobileImage)}
                    sizes={bannerSrcSet(mobileImage) ? '100vw' : undefined}
                    alt={banner?.title || 'Featured'}
                    className="h-full w-full object-cover"
                    // The first slide is the LCP element: ask the browser to
                    // fetch it ahead of the rest of the image flood. Lowercase
                    // because React 18 only passes the hint through as a plain
                    // attribute (and @types/react 18.2 has no camelCase prop).
                    {...(index === 0 ? ({ fetchpriority: 'high' } as any) : {})}
                  />
                </picture>
              );

              return (
                <div
                  key={banner?.id ?? index}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    isCurrent ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                  aria-hidden={!isCurrent}
                >
                  {banner?.link ? (
                    <a
                      href={banner.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full w-full"
                      tabIndex={isCurrent ? undefined : -1}
                    >
                      {slide}
                    </a>
                  ) : (
                    slide
                  )}
                </div>
              );
            })
          )}

          {(heroBanner as any)?.isAd && (
            <div className="absolute top-3 left-4 z-20 bg-white/80 backdrop-blur-sm text-gray-700 px-1.5 py-0.5 rounded text-xs sm:text-xs font-medium shadow-sm">
              Ad
            </div>
          )}

          {hasBannerSlideshow && (
            <>
              <button
                type="button"
                onClick={goToPrevBanner}
                aria-label="Previous banner"
                className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/70 p-2 text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white focus:outline-none sm:flex"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={goToNextBanner}
                aria-label="Next banner"
                className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/70 p-2 text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white focus:outline-none sm:flex"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={3} />
              </button>

              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
                {banners.map((banner, index) => (
                  <button
                    key={banner?.id ?? index}
                    type="button"
                    onClick={() => setBannerIndex(index)}
                    aria-label={`Go to banner ${index + 1}`}
                    aria-current={index === bannerIndex}
                    className={`h-2 rounded-full transition-all ${
                      index === bannerIndex
                        ? 'w-5 bg-white'
                        : 'w-2 bg-white/60 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {/* Bottom Strip: brand logos, revolving continuously */}
      <div className="border-b border-gray-300 bg-[#e2e2e2] px-4 py-1.5 sm:py-2">
        {isLoadingBrands ? (
          <div className="flex justify-center">
            <span className="text-sm italic text-gray-400">Loading brands...</span>
          </div>
        ) : (
          <div className="brand-marquee w-full overflow-hidden">
            <div
              className="brand-marquee-track flex w-max items-center"
              style={
                { '--brand-marquee-duration': marqueeDuration } as React.CSSProperties
              }
            >
              {marqueeBrands.map((brand: any, index: number) => (
                <div
                  key={`${brand.id}-${index}`}
                  className="flex shrink-0 items-center justify-center px-6 xs:px-8 md:px-12"
                  // The repeated halves exist only to make the loop seamless;
                  // a screen reader should hear each brand once.
                  aria-hidden={index >= marqueeHalfLength}
                >
                  <img
                    src={brand.imageUrl}
                    srcSet={logoSrcSet(brand.imageUrl)}
                    alt={brand.name}
                    loading="lazy"
                    decoding="async"
                    className="h-[24px] xs:h-[36px] md:h-[54px] cursor-pointer object-contain mix-blend-multiply transition-transform hover:scale-110"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
