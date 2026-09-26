'use client';

import { disable as disableTracker, startTracker } from '@/lib/analytics/tracker';
import { disableMetaPixel, initMetaPixel } from '@/lib/analytics/meta-pixel';

/**
 * Cookie-consent state, shared between the consent bar, the first-party
 * analytics tracker, and the Meta advertising Pixel. One localStorage record:
 *   { analytics: boolean, marketing: boolean, ts: number }
 *
 * TWO independent categories, because they carry different promises:
 *   - analytics: anonymous, first-party only (the yz_vid tracker).
 *   - marketing: third-party advertising (the Meta Pixel + Conversions API).
 * A visitor can accept one and decline the other, and each gate is enforced
 * separately. Consent is OPT-IN: until a choice is made, neither runs.
 *
 * Backward-compatible: a record saved before `marketing` existed has no such
 * field, which reads as false — nobody is opted into advertising by an old
 * cookie.
 */

export const CONSENT_KEY = 'yz_cookie_consent';

export interface CookieConsentState {
  analytics: boolean;
  marketing: boolean;
  ts: number;
}

/** The Pixel ID is stamped here by the app root so consent changes can start
 *  the Pixel without a reload. Null until known / when Meta is switched off. */
let metaPixelId: string | null = null;
export function setMetaPixelId(id: string | null): void {
  metaPixelId = id && id.trim() ? id.trim() : null;
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getStoredConsent(): CookieConsentState | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.analytics !== 'boolean') return null;
    return { analytics: parsed.analytics, marketing: parsed.marketing === true, ts: parsed.ts ?? 0 };
  } catch {
    return null;
  }
}

export function hasStoredConsent(): boolean {
  return getStoredConsent() !== null;
}

export function saveConsent(choice: { analytics: boolean; marketing: boolean }): void {
  const store = storage();
  try {
    store?.setItem(
      CONSENT_KEY,
      JSON.stringify({ analytics: choice.analytics, marketing: choice.marketing, ts: Date.now() }),
    );
  } catch {
    /* storage blocked: the choice still applies for this pageload */
  }
}

/** Enforce the visitor's choices immediately, without a reload. */
export function applyConsent(choice: { analytics: boolean; marketing: boolean }): void {
  if (typeof window === 'undefined') return;
  if (choice.analytics) startTracker();
  else disableTracker();

  if (choice.marketing && metaPixelId) initMetaPixel(metaPixelId);
  else disableMetaPixel();
}
