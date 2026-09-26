'use client';

/**
 * Meta (Facebook) Pixel — the browser half of Meta tracking.
 *
 * Independent of the first-party analytics tracker on purpose: they answer to
 * DIFFERENT consent categories. A visitor may accept anonymous first-party
 * analytics and decline advertising, or the reverse, so the Pixel keeps its
 * own gate and never rides the tracker's. It fires nothing until
 * initMetaPixel() is called with marketing consent — and stops the moment
 * consent is withdrawn.
 *
 * Purchase carries an eventID equal to the order id, so this event and the
 * server-side Conversions API event for the same order are deduplicated by
 * Meta and counted once.
 */

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string };
    _fbq?: unknown;
  }
}

let started = false;
let loadedPixelId: string | null = null;

function loadBaseCode(): void {
  if (typeof window === 'undefined' || window.fbq) return;
  // Meta's standard base snippet, transcribed (no eval, no remote-built string).
  const fbq: Window['fbq'] = function (...args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    (fbq!.queue = fbq!.queue || []).push(args);
  } as Window['fbq'];
  fbq!.queue = [];
  fbq!.loaded = true;
  fbq!.version = '2.0';
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
}

/** Start (or restart) the Pixel. Safe to call repeatedly; only inits once per id. */
export function initMetaPixel(pixelId: string): void {
  if (typeof window === 'undefined') return;
  const id = pixelId.trim();
  if (!id) return;
  loadBaseCode();
  if (loadedPixelId !== id) {
    // PII is never passed to fbq; disable Meta's automatic form/email grabbing
    // so nothing unhashed leaves the page without our say-so.
    window.fbq?.('set', 'autoConfig', false, id);
    window.fbq?.('init', id);
    loadedPixelId = id;
  }
  started = true;
  window.fbq?.('track', 'PageView');
}

/** Stop firing. Consent withdrawn — we cannot unload Meta's script, but we
 *  can and do stop sending it anything. */
export function disableMetaPixel(): void {
  started = false;
}

export function metaPixelPageView(): void {
  if (!started) return;
  window.fbq?.('track', 'PageView');
}

/**
 * Forward a first-party event name to its Meta standard event. Called from the
 * tracker's single choke point so the mapping lives in one place; a name with
 * no Meta equivalent is ignored. No-ops entirely without marketing consent.
 */
export function metaPixelForward(
  name: string,
  props?: Record<string, unknown>,
  productId?: string,
): void {
  if (!started || !window.fbq) return;
  const contents = productId ? { content_ids: [productId], content_type: 'product' } : {};
  switch (name) {
    case 'product_view':
      window.fbq('track', 'ViewContent', contents);
      break;
    case 'add_to_cart':
      window.fbq('track', 'AddToCart', { ...contents, ...numeric(props) });
      break;
    case 'checkout_started':
      window.fbq('track', 'InitiateCheckout', numeric(props));
      break;
    case 'search':
      window.fbq('track', 'Search', props?.query ? { search_string: String(props.query) } : {});
      break;
    default:
      break;
  }
}

/** The Purchase event, deduplicated with the server via the order id. */
export function metaPixelPurchase(input: { orderId: string; value: number; currency?: string }): void {
  if (!started || !window.fbq) return;
  window.fbq(
    'track',
    'Purchase',
    { value: Number(input.value.toFixed(2)), currency: input.currency ?? 'INR' },
    { eventID: input.orderId },
  );
}

/** Only the numeric extras Meta understands, never arbitrary props. */
function numeric(props?: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  if (props && typeof props.value === 'number') out.value = props.value;
  return out;
}
