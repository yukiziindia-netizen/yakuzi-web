import { NextRequest, NextResponse } from 'next/server';

/**
 * First-party analytics ingest proxy.
 *
 * Why a proxy instead of posting straight to the API:
 *  - same-origin path is invisible to ad-blockers' third-party filters
 *  - Vercel gives coarse geo on the request headers here for free
 *    (x-vercel-ip-country/-region/-city) — no IP is ever stored
 *  - the raw UA travels server-side, parsed once on the API
 *
 * Always answers 204 no matter what: the storefront must behave
 * identically whether analytics works or not.
 */

const MAX_BODY_BYTES = 32 * 1024;

function apiBase(): string | null {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  return base ? base.replace(/\/$/, '') : null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const base = apiBase();
    if (!base) return new NextResponse(null, { status: 204 });

    const raw = await req.text();
    if (!raw || raw.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 204 });

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return new NextResponse(null, { status: 204 });
    }

    body.country = req.headers.get('x-vercel-ip-country') ?? undefined;
    body.region = req.headers.get('x-vercel-ip-country-region') ?? undefined;
    body.city = decodeCity(req.headers.get('x-vercel-ip-city'));
    body.ua = req.headers.get('user-agent') ?? undefined;

    await fetch(`${base}/analytics/collect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    }).catch(() => undefined);
  } catch {
    // swallow everything — see contract above
  }
  return new NextResponse(null, { status: 204 });
}

/** Vercel URL-encodes city names (e.g. S%C3%A3o%20Paulo). */
function decodeCity(city: string | null): string | undefined {
  if (!city) return undefined;
  try {
    return decodeURIComponent(city);
  } catch {
    return city;
  }
}
