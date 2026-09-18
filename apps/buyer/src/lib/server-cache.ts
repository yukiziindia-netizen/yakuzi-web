import { unstable_cache } from 'next/cache';
import {
  getProducts,
  getBanners,
  getComingSoonStatus,
  getHomepageSections,
  getCategories,
} from '@yukizi/api-client';

// Cross-request TTL caches for the anonymous storefront's server fetches.
//
// The homepage, /products and /category/[slug] all read searchParams (the
// navbar search lands on `/?search=`, the listing filters are URL-driven), so
// Next renders them dynamically on every request and the CDN cannot cache the
// HTML the way it does the PDP. But the underlying API data is identical for
// every visitor, so caching it here cuts the per-request render cost from
// several API round trips to near zero once warm.
//
// Safety properties, all load-bearing — keep them:
// - unstable_cache stores FULFILLED results only. A rejected promise is never
//   cached, so during an API outage every request still sees the error and the
//   call sites' existing try/catch behaviour is byte-identical to today.
//   For the same reason the call-site `.catch()`s must stay OUTSIDE these
//   wrappers — moving a catch inside would cache the empty fallback.
//   ⚠️ This property protects a function that REJECTS. getProducts does not:
//   it swallows every error and FULFILS with { data: [], failed: true }, which
//   is precisely the kind of value unstable_cache stores. See
//   fetchProductsOrThrow below for why that mattered.
// - The serialized arguments are part of the cache key, so every distinct
//   filter/search combination caches separately and can never bleed into
//   another URL's results.
// - getComingSoonStatus fails OPEN inside the api-client (returns false on
//   error rather than throwing) — cached or not, an unreachable API degrades
//   to the thin storefront, never to the splash. The short TTL below bounds
//   how long an admin's coming-soon toggle takes to appear.

// A page render cannot wait out a throttle window the way the sitemaps can
// (see lib/seo/product-fetch.ts, which retries the same call over 30 seconds
// because nobody is watching it). These delays are sized for a shopper who is:
// they cover the burst case — a deploy prerendering every static page, or a
// traffic spike, briefly crowding the API's 300-requests-per-minute-per-IP
// limit — and give up quickly rather than holding the page open.
const PRODUCT_RETRY_DELAYS_MS = [150, 400, 1000];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Products, or a rejection — never a fulfilled failure.
 *
 * getProducts NEVER throws: it catches everything and returns
 * { data: [], total: 0, failed: true }. Two separate things then went wrong.
 *
 * 1. That object is a FULFILLED value, so unstable_cache stored it like any
 *    other result. The storefront pages throw on `failed` (so an API blip
 *    surfaces as a retryable error rather than a 200 "empty shop" soft-404),
 *    which meant ONE lost request was cached for the full TTL and rethrown for
 *    every visitor behind that cache key until a revalidation happened to
 *    succeed. A single blip became a site-wide error page for minutes.
 * 2. Nothing retried. The failure most likely to hit this path is a 429 from a
 *    momentary burst, which is gone by the next request.
 *
 * Throwing HERE fixes both: the promise rejects, so nothing is stored and the
 * next request tries again for real, and the retries mean most blips never
 * reach a shopper at all. The call sites keep their existing try/catch — they
 * now catch a rejection instead of inspecting a flag, which is what their
 * comments always described.
 */
export async function fetchProductsOrThrow(
  params: Parameters<typeof getProducts>[0],
  label = 'storefront',
) {
  for (let attempt = 0; ; attempt++) {
    const res = await getProducts(params);
    if (!(res as any)?.failed) return res;
    if (attempt >= PRODUCT_RETRY_DELAYS_MS.length) {
      throw new Error(`[${label}] products fetch failed after ${attempt + 1} attempts`);
    }
    console.warn(`[${label}] products fetch failed; retrying in ${PRODUCT_RETRY_DELAYS_MS[attempt]}ms`);
    await sleep(PRODUCT_RETRY_DELAYS_MS[attempt]);
  }
}

export const getProductsCached = unstable_cache(
  (params: Parameters<typeof getProducts>[0]) => fetchProductsOrThrow(params),
  ['storefront:getProducts'],
  { revalidate: 120 },
);

export const getBannersCached = unstable_cache(
  () => getBanners(),
  ['storefront:getBanners'],
  { revalidate: 120 },
);

export const getHomepageSectionsCached = unstable_cache(
  () => getHomepageSections(),
  ['storefront:getHomepageSections'],
  { revalidate: 120 },
);

export const getComingSoonStatusCached = unstable_cache(
  () => getComingSoonStatus(),
  ['storefront:getComingSoonStatus'],
  { revalidate: 60 },
);

export const getCategoriesCachedShared = unstable_cache(
  () => getCategories(),
  ['storefront:getCategories'],
  { revalidate: 300 },
);
