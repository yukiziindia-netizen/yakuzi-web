'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getStoredConsent, setMetaPixelId } from '@/lib/cookie-consent';
import { initMetaPixel, metaPixelPageView } from '@/lib/analytics/meta-pixel';

/**
 * Mounts the Meta Pixel: registers the Pixel ID for the consent layer, starts
 * the Pixel for a returning visitor who already accepted marketing, and fires
 * a PageView on each App Router navigation. Renders nothing.
 *
 * Gated entirely on marketing consent — this never starts the Pixel on its
 * own; it only honours a choice the visitor already made (the consent bar
 * handles a fresh accept). No Pixel ID (Meta switched off) means it is inert.
 */
export function MetaPixelProvider({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    setMetaPixelId(pixelId || null);
    if (pixelId && getStoredConsent()?.marketing) {
      initMetaPixel(pixelId); // fires the first PageView itself
    }
  }, [pixelId]);

  // Self-gating: no-ops until the Pixel has been started by consent, so this
  // fires SPA-navigation PageViews whether consent was granted before load or
  // via the consent bar after it.
  useEffect(() => {
    if (pathname) metaPixelPageView();
  }, [pathname]);

  return null;
}
