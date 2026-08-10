'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  flush,
  onVisibilityChange,
  pageLeft,
  pageView,
  reportScroll,
  startTracker,
} from '@/lib/analytics/tracker';

/**
 * Mounts the analytics tracker: page views on App Router navigation,
 * engagement time + scroll depth per page, flush-on-hide. Renders nothing
 * and never blocks — the tracker itself is a no-op under DNT or failures.
 */
export function AnalyticsProvider() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    startTracker();

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable > 0) reportScroll(((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100);
    };
    const onHide = () => {
      if (previousPath.current) pageLeft(previousPath.current, true);
      else flush(true);
    };
    const onVisibility = () => onVisibilityChange();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (previousPath.current && previousPath.current !== pathname) {
      pageLeft(previousPath.current);
    }
    pageView(pathname);
    previousPath.current = pathname;
  }, [pathname]);

  return null;
}
