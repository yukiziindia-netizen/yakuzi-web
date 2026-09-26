'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { applyConsent, hasStoredConsent, saveConsent } from '@/lib/cookie-consent';

/**
 * Minimal cookie-consent bar, fixed to the TOP of the viewport.
 *
 * Two opt-in categories, each honest about what it does:
 *   - Analytics: the first-party visitor id (yz_vid), anonymous. Declining it
 *     genuinely disables the tracker and removes the cookie.
 *   - Marketing: the Meta advertising Pixel (+ server Conversions API).
 *     Declining it means no Pixel loads and no ad event fires.
 * The choice offered is the choice enforced (see applyConsent). Essential
 * cookies (checkout/session) cannot be toggled — shown locked.
 *
 * Renders nothing until mounted (consent state lives in localStorage), so
 * it adds zero server HTML and zero CLS — it overlays the page rather than
 * pushing it down.
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(true);
  const [marketingOn, setMarketingOn] = useState(true);

  useEffect(() => {
    if (!hasStoredConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  const decide = (analytics: boolean, marketing: boolean) => {
    saveConsent({ analytics, marketing });
    applyConsent({ analytics, marketing });
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="glass-chrome fixed inset-x-0 top-0 z-[120] border-b border-white/20 shadow-md"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-2.5 sm:px-6">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-white sm:text-sm">
            We use essential cookies to run the store, optional analytics to understand how
            it&rsquo;s used, and optional marketing cookies to measure our ads.{' '}
            <Link href="/cookie-policy" className="underline underline-offset-2 hover:opacity-80">
              Cookie policy
            </Link>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPrefs((v) => !v)}
              aria-expanded={showPrefs}
              className="yz-consent-btn-pref rounded-full px-4 py-1.5 text-xs font-semibold transition-colors sm:text-sm"
            >
              Preferences
            </button>
            <button
              type="button"
              onClick={() => decide(true, true)}
              className="yz-consent-btn-accept rounded-full px-4 py-1.5 text-xs font-semibold transition-colors sm:text-sm"
            >
              Accept all
            </button>
          </div>
        </div>

        {showPrefs && (
          <div className="flex flex-col gap-2 border-t border-white/20 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1.5 text-xs text-white sm:flex-row sm:items-center sm:gap-5 sm:text-sm">
              <label className="flex items-center gap-2 opacity-80">
                <input type="checkbox" checked disabled className="h-3.5 w-3.5 accent-white" />
                Essential (required — cart, checkout, sign-in)
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={analyticsOn}
                  onChange={(e) => setAnalyticsOn(e.target.checked)}
                  className="h-3.5 w-3.5 accent-white"
                />
                Analytics (anonymous, first-party only)
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={marketingOn}
                  onChange={(e) => setMarketingOn(e.target.checked)}
                  className="h-3.5 w-3.5 accent-white"
                />
                Marketing (Meta ads measurement)
              </label>
            </div>
            <button
              type="button"
              onClick={() => decide(analyticsOn, marketingOn)}
              className="yz-consent-btn-accept self-start rounded-full px-4 py-1.5 text-xs font-semibold transition-colors sm:self-auto sm:text-sm"
            >
              Save choices
            </button>
          </div>
        )}
      </div>

      {/*
        Button colours stated explicitly rather than via bg-white/text-[#...]
        utilities.

        globals.css deliberately remaps those utilities inside `.dark`
        (`.dark .bg-white` -> the dark surface, `.dark .text-[#562996]` ->
        the lifted violet), which is right for content cards but wrong for a
        button sitting ON the dark chrome: it turned Accept into a
        translucent plate with light-violet text, measured at 3.11:1 - below
        the 4.5:1 readable threshold and visibly washed out.

        A dedicated class name matches no remap list, so one rule serves both
        themes. Measured against the live stylesheet in both modes: 11.23:1.
      */}
      <style jsx global>{`
        .yz-consent-btn-accept {
          background-color: #ffffff !important;
          color: #4a2287 !important;
        }
        .yz-consent-btn-accept:hover {
          background-color: #f3ecff !important;
        }
        .yz-consent-btn-pref {
          border: 1px solid rgba(255, 255, 255, 0.55) !important;
          color: #ffffff !important;
          background-color: transparent !important;
        }
        .yz-consent-btn-pref:hover {
          background-color: rgba(255, 255, 255, 0.14) !important;
        }
      `}</style>
    </div>
  );
}
