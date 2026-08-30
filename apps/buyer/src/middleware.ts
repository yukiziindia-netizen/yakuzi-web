import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin-managed redirects (yakuzi-api /seo/redirects/map).
 *
 * FAIL-OPEN by design: until the API ships the endpoint — and whenever it
 * errors or times out — the map is treated as empty and every request passes
 * straight through. The map is cached in module scope per edge instance
 * (5 min on success, 60 s after a failure so an API outage isn't hammered),
 * so the origin sees roughly one request per instance per 5 minutes.
 */

type RedirectMap = Record<string, { to: string; code: number }>;

const SUCCESS_TTL_MS = 5 * 60_000;
const FAILURE_TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 1500;

let cache: { map: RedirectMap; expiresAt: number } | null = null;
let inflight: Promise<RedirectMap> | null = null;

async function loadMap(): Promise<RedirectMap> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  if (!base) return {};
  try {
    const res = await Promise.race([
      fetch(`${base}/seo/redirects/map`),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), FETCH_TIMEOUT_MS)),
    ]);
    if (!res || !res.ok) throw new Error('unavailable');
    const body = (await res.json()) as { data?: RedirectMap };
    const map = body?.data && typeof body.data === 'object' ? body.data : {};
    cache = { map, expiresAt: Date.now() + SUCCESS_TTL_MS };
    return map;
  } catch {
    const stale = cache?.map ?? {};
    cache = { map: stale, expiresAt: Date.now() + FAILURE_TTL_MS };
    return stale;
  }
}

async function getMap(): Promise<RedirectMap> {
  if (cache && cache.expiresAt > Date.now()) return cache.map;
  if (!inflight) {
    inflight = loadMap().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export async function middleware(req: NextRequest) {
  // Mixed-case URLs (e.g. /CATEGORY/figurines) previously served 200 as
  // duplicates of the lowercase page, leaving canonical tags to clean up.
  // Every route and every stored slug on this site is lowercase, so a
  // permanent redirect is always correct. Runs before the redirect-map fetch
  // so these requests never touch the API. Query string is preserved as-is
  // (?sub= values are matched case-sensitively by id as well as slug).
  if (/[A-Z]/.test(req.nextUrl.pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = req.nextUrl.pathname.toLowerCase();
    return NextResponse.redirect(url, 308);
  }

  const map = await getMap();

  // The API stores fromPath lowercase without a trailing slash.
  let path = req.nextUrl.pathname.toLowerCase();
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);

  const entry = map[path];
  if (!entry) return NextResponse.next();

  if (entry.code === 410) return new NextResponse(null, { status: 410 });

  const destination = /^https?:\/\//i.test(entry.to)
    ? entry.to
    : new URL(entry.to, req.nextUrl.origin);
  const code = entry.code === 302 ? 302 : entry.code === 308 ? 308 : 301;
  return NextResponse.redirect(destination, code);
}

export const config = {
  // Pages only: skip Next internals, API routes, and anything with a file
  // extension (images, feeds, manifest, …) — the map only holds page paths.
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};
