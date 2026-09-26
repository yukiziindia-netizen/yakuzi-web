'use client';

import { openCookiePreferences } from '@/lib/cookie-consent';

/**
 * Footer link that reopens the cookie-consent bar. A client island so the
 * footer itself can stay a server component. Styled to match the sibling
 * policy links exactly.
 */
export function CookiePreferencesLink() {
  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className="transition-colors hover:text-[#562996] hover:underline underline-offset-4"
    >
      Cookie preferences
    </button>
  );
}
