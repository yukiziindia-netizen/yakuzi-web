'use client';

import { useEffect, useState } from 'react';

// Matches the >=1024px split PremiumNavbar already uses to decide mobile vs.
// desktop nav behavior - kept in sync with that so a drawer and the nav bar
// that opens it never disagree about which layout is active.
const DESKTOP_QUERY = '(min-width: 1024px)';

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}
