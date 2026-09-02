import { getProducts } from '@yukizi/api-client';

/**
 * Product fetching for the sitemaps, with retries.
 *
 * getProducts() swallows its errors and returns an empty list so a flaky API
 * costs a page its grid rather than the whole page. That is right for the
 * storefront and wrong here: a sitemap cannot tell "no products" from "could
 * not ask", so one lost request publishes a sitemap announcing that the
 * catalogue does not exist. It now sets `failed`, which is what this reads.
 *
 * Why requests get lost: the API throttles at 100 requests per minute per IP,
 * and a build prerenders 67 product pages plus the homepage and every
 * category — comfortably over that inside one minute. The sitemap's request is
 * one of the crowd.
 *
 * The backoff is deliberately long. A 429 is not cleared by trying again
 * immediately, only by waiting out the window, and sitemap generation is on
 * nobody's critical path — it can afford to wait where a page render cannot.
 */

const RETRY_DELAYS_MS = [2000, 8000, 20000];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchProductPage(page: number, label: string) {
  for (let attempt = 0; ; attempt++) {
    const res = await getProducts({ page, limit: 100 });
    if (!res.failed) return res;
    if (attempt >= RETRY_DELAYS_MS.length) return res;
    console.warn(`[${label}] products page ${page} failed; retrying in ${RETRY_DELAYS_MS[attempt]}ms`);
    await sleep(RETRY_DELAYS_MS[attempt]);
  }
}

/**
 * Every product, or a failure flag — never a quietly truncated list.
 *
 * Stopping mid-catalogue would be the same lie in smaller print, so a failure
 * on page three discards nothing but is reported as a failure.
 */
export async function fetchAllProducts(
  label: string,
): Promise<{ products: any[]; failed: boolean }> {
  const products: any[] = [];
  try {
    for (let page = 1; page <= 50; page++) {
      const res = await fetchProductPage(page, label);
      if (res.failed) return { products, failed: true };
      products.push(...res.data);
      if (page * res.limit >= res.total) break;
    }
  } catch {
    return { products, failed: true };
  }
  return { products, failed: false };
}

/**
 * True when this is running during `next build`.
 *
 * Both sitemaps refuse to publish a product-less document, but failing during
 * a build would block a deploy over a transient upstream blip. They regenerate
 * hourly, so the first revalidation after the build corrects it.
 */
export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}
