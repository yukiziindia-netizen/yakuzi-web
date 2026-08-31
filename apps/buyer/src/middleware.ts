import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';

/**
 * Admin-managed redirects (yakuzi-api /seo/redirects/map).
 *
 * FAIL-OPEN by design: until the API ships the endpoint — and whenever it
 * errors or times out — the map is treated as empty and every request passes
 * straight through. The map is cached in module scope per edge instance
 * (5 min on success, 60 s after a failure so an API outage isn't hammered),
 * so the origin sees roughly one request per instance per 5 minutes.
 */

type ExactMap = Record<string, { to: string; code: number }>;
type WildcardRule = { from: string; to: string; code: number };

/**
 * Wildcard rules move a whole section: /old-shop/* -> /shop/* rewrites
 * /old-shop/a/b to /shop/a/b. Exact rules win; among wildcards the API sends
 * them longest-prefix first, so /shop/manga/* is checked before /shop/*.
 */
type RedirectMap = { exact: ExactMap; wildcards: WildcardRule[] };

const EMPTY_MAP: RedirectMap = { exact: {}, wildcards: [] };

/** Substitute a concrete path into a wildcard rule, or null if it misses. */
function applyWildcard(rule: WildcardRule, path: string): string | null {
  const prefix = rule.from.slice(0, -2) || '/'; // strip the trailing "/*"
  // The boundary is a path segment: /old/* covers /old/a but not /older.
  if (!path.startsWith(prefix + '/')) return null;
  if (!rule.to.endsWith('/*')) return rule.to;
  const tail = path.slice(prefix.length);
  const targetPrefix = rule.to.slice(0, -2);
  return targetPrefix === '' || targetPrefix === '/' ? tail : `${targetPrefix}${tail}`;
}

const SUCCESS_TTL_MS = 5 * 60_000;
const FAILURE_TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 1500;

let cache: { map: RedirectMap; expiresAt: number } | null = null;
let inflight: Promise<RedirectMap> | null = null;

async function loadMap(): Promise<RedirectMap> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  if (!base) return EMPTY_MAP;
  try {
    const res = await Promise.race([
      fetch(`${base}/seo/redirects/map`),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), FETCH_TIMEOUT_MS)),
    ]);
    if (!res || !res.ok) throw new Error('unavailable');
    // `data` is the exact map and has always been; `wildcards` is newer, so an
    // API deployed before wildcards shipped just yields an empty list here.
    const body = (await res.json()) as { data?: ExactMap; wildcards?: WildcardRule[] };
    const map: RedirectMap = {
      exact: body?.data && typeof body.data === 'object' ? body.data : {},
      wildcards: Array.isArray(body?.wildcards) ? body.wildcards : [],
    };
    cache = { map, expiresAt: Date.now() + SUCCESS_TTL_MS };
    return map;
  } catch {
    const stale = cache?.map ?? EMPTY_MAP;
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

/**
 * Tell the API a rule fired, so the admin's hit counters mean something.
 *
 * Fire-and-forget through waitUntil: the redirect response is returned
 * immediately and the report finishes afterwards, so counting never adds
 * latency for the visitor. Failures are swallowed — a redirect that works but
 * is not counted is infinitely better than one that stalls.
 */
function reportHit(event: NextFetchEvent, path: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  if (!base) return;
  event.waitUntil(
    fetch(`${base}/seo/redirects/hit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    }).catch(() => {}),
  );
}

export async function middleware(req: NextRequest, event: NextFetchEvent) {
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

  let entry = map.exact[path];
  // Which rule fired, for the hit counter. A wildcard's counter belongs to the
  // rule (/old/*), not to whichever URL happened to match it — reporting the
  // request path would leave every wildcard rule reading zero forever.
  let matchedRule = path;
  if (!entry) {
    for (const rule of map.wildcards) {
      const target = applyWildcard(rule, path);
      if (target) {
        entry = { to: target, code: rule.code };
        matchedRule = rule.from;
        break;
      }
    }
  }
  if (!entry) {
    // Pass the requested path along so the not-found boundary can report it —
    // a server component otherwise has no way to know which URL was asked for.
    const headers = new Headers(req.headers);
    headers.set('x-yukizi-path', path);
    return NextResponse.next({ request: { headers } });
  }

  reportHit(event, matchedRule);

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
