/**
 * Yukizi first-party analytics tracker.
 *
 * Design rules:
 *  - ZERO impact on the storefront: every call is fire-and-forget, every
 *    failure is swallowed, nothing here may throw into app code.
 *  - Privacy: random UUID visitor id (no fingerprinting), no PII in events,
 *    tracking fully disabled when the browser sends DNT=1.
 *  - Session rule: a session ends after 30 minutes of inactivity; arriving
 *    with a NEW utm_* set also starts a new session (campaign re-entry).
 *  - Batching: events queue in memory and flush every 5s / 20 events /
 *    on page hide via sendBeacon to the same-origin /api/track proxy
 *    (which adds geo + UA and forwards to the API).
 *
 * Public API:
 *   track(name, props?)            – custom events (snake_case names)
 *   trackProductView(productId)
 *   trackSearch(query, results)
 *   pageView(path)                 – called by AnalyticsProvider on route change
 *   pageLeft(path)                 – flushes engagement for the page being left
 *   reportScroll(pct)              – AnalyticsProvider feeds max scroll depth
 *   disable()                      – consent hook: stops tracking + wipes ids
 */

const VISITOR_KEY = 'yz_vid';
const SESSION_KEY = 'yz_sid';
const SESSION_LAST_ACTIVE_KEY = 'yz_sla';
const SESSION_ATTR_KEY = 'yz_sat'; // JSON: attribution captured at session start
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH = 20;

interface QueuedEvent {
  name: string;
  ts: number;
  page?: string;
  productId?: string;
  props?: Record<string, unknown>;
}

interface SessionAttribution {
  landingPage: string;
  referrer: string;
  utm: Record<string, string>;
  clickIds: Record<string, string>;
  utmSignature: string;
}

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let sessionIsNewForNextFlush = false;
let visitorIsNew = false;
let started = false;
let disabled = false;

// Engagement accounting for the current page.
let engagedSince: number | null = null;
let engagedAccumulatedMs = 0;
let maxScrollPct = 0;

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function dntEnabled(): boolean {
  if (!hasWindow()) return true;
  const nav = navigator as Navigator & { msDoNotTrack?: string };
  return nav.doNotTrack === '1' || nav.msDoNotTrack === '1' || (window as { doNotTrack?: string }).doNotTrack === '1';
}

function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null; // storage blocked: tracking degrades to per-pageload ids
  }
}

let memVisitorId: string | null = null;
let memSessionId: string | null = null;

export function getVisitorId(): string | null {
  if (!hasWindow() || disabled) return null;
  const store = storage();
  if (!store) {
    if (!memVisitorId) { memVisitorId = uuid(); visitorIsNew = true; }
    return memVisitorId;
  }
  let id = store.getItem(VISITOR_KEY);
  if (!id) {
    id = uuid();
    visitorIsNew = true;
    store.setItem(VISITOR_KEY, id);
    // Cookie mirror so future server-side needs can read it (1st-party, Lax).
    try {
      document.cookie = `${VISITOR_KEY}=${id}; path=/; max-age=31536000; SameSite=Lax`;
    } catch { /* ignore */ }
  }
  return id;
}

function currentUtm(): { utm: Record<string, string>; clickIds: Record<string, string>; signature: string } {
  const utm: Record<string, string> = {};
  const clickIds: Record<string, string> = {};
  try {
    const params = new URLSearchParams(window.location.search);
    for (const [k, v] of params) {
      if (!v) continue;
      if (k.startsWith('utm_')) utm[k.slice(4)] = v.slice(0, 200);
      if (['gclid', 'fbclid', 'msclkid', 'ttclid'].includes(k)) clickIds[k] = v.slice(0, 200);
    }
  } catch { /* ignore */ }
  const signature = ['source', 'medium', 'campaign'].map((k) => utm[k] ?? '').join('|');
  return { utm, clickIds, signature };
}

function externalReferrer(): string {
  try {
    const ref = document.referrer;
    if (!ref) return '';
    if (new URL(ref).host === window.location.host) return ''; // internal nav is not a source
    return ref.slice(0, 2000);
  } catch {
    return '';
  }
}

function loadAttr(store: Storage | null): SessionAttribution | null {
  try {
    const raw = store?.getItem(SESSION_ATTR_KEY);
    return raw ? (JSON.parse(raw) as SessionAttribution) : null;
  } catch {
    return null;
  }
}

/** Returns the active session id, rotating per the documented session rules. */
function getSessionId(): { id: string; attribution: SessionAttribution } {
  const store = storage();
  const now = Date.now();
  const { utm, clickIds, signature } = currentUtm();

  const lastActive = Number(store?.getItem(SESSION_LAST_ACTIVE_KEY) ?? 0);
  const existingId = store ? store.getItem(SESSION_KEY) : memSessionId;
  const existingAttr = loadAttr(store);

  const timedOut = !existingId || now - lastActive > SESSION_TIMEOUT_MS;
  const newCampaign = signature !== '' && existingAttr !== null && existingAttr.utmSignature !== signature;

  if (timedOut || newCampaign || !existingAttr) {
    const id = uuid();
    const attribution: SessionAttribution = {
      landingPage: window.location.pathname,
      referrer: externalReferrer(),
      utm,
      clickIds,
      utmSignature: signature,
    };
    sessionIsNewForNextFlush = true;
    memSessionId = id;
    try {
      store?.setItem(SESSION_KEY, id);
      store?.setItem(SESSION_ATTR_KEY, JSON.stringify(attribution));
    } catch { /* ignore */ }
    touchSession();
    return { id, attribution };
  }

  touchSession();
  return { id: existingId!, attribution: existingAttr };
}

function touchSession(): void {
  try {
    storage()?.setItem(SESSION_LAST_ACTIVE_KEY, String(Date.now()));
  } catch { /* ignore */ }
}

// ─── Queue + transport ─────────────────────────────────────────────────

function enqueue(event: QueuedEvent): void {
  if (!hasWindow() || disabled) return;
  queue.push(event);
  if (queue.length >= MAX_BATCH) flush();
}

export function flush(useBeacon = false): void {
  if (!hasWindow() || disabled || queue.length === 0) return;
  const visitorId = getVisitorId();
  if (!visitorId) return;
  const { id: sessionId, attribution } = getSessionId();

  const events = queue.splice(0, MAX_BATCH);
  const body = JSON.stringify({
    visitor: {
      id: visitorId,
      screenW: window.screen?.width,
      screenH: window.screen?.height,
      language: navigator.language?.slice(0, 16),
      timezone: safeTimezone(),
    },
    session: {
      id: sessionId,
      isNew: sessionIsNewForNextFlush || undefined,
      isNewVisitor: visitorIsNew || undefined,
      landingPage: attribution.landingPage,
      referrer: attribution.referrer || undefined,
      utm: Object.keys(attribution.utm).length ? attribution.utm : undefined,
      clickIds: Object.keys(attribution.clickIds).length ? attribution.clickIds : undefined,
    },
    events,
  });
  sessionIsNewForNextFlush = false;

  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    } else {
      void fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch { /* analytics must never surface errors */ }
}

function safeTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

// ─── Public tracking API ───────────────────────────────────────────────

export function track(name: string, props?: Record<string, unknown>, productId?: string): void {
  if (!hasWindow() || disabled) return;
  enqueue({ name, ts: Date.now(), page: window.location.pathname, productId, props });
  touchSession();
}

export function trackProductView(productId: string): void {
  track('product_view', undefined, productId);
}

// ─── Listing impressions & clicks ──────────────────────────────────────
// Impressions dedupe per (path, product): a card scrolled past twice on the
// same pageview counts once. The set resets on every pageView() so revisits
// count again — matching how GA4's view_item_list dedupes.
let impressionSeen = new Set<string>();

/** 'home' | 'category' | 'search' | raw path — where the listing lives. */
function listFromPath(): string {
  const path = window.location.pathname;
  if (path === '/') return 'home';
  if (path.startsWith('/category/')) return 'category';
  if (path.startsWith('/search')) return 'search';
  return path;
}

export function trackProductImpression(productId: string, position: number): void {
  if (!hasWindow() || disabled) return;
  const key = `${window.location.pathname}|${productId}`;
  if (impressionSeen.has(key)) return;
  impressionSeen.add(key);
  track('product_impression', { list: listFromPath(), position }, productId);
}

export function trackProductClick(
  productId: string,
  position?: number,
  props?: Record<string, unknown>,
): void {
  track(
    'product_click',
    { list: listFromPath(), ...(position !== undefined && { position }), ...props },
    productId,
  );
}

export function trackSearch(query: string, results?: number): void {
  const q = query.trim().toLowerCase().slice(0, 100);
  if (!q) return;
  track('search', { query: q, ...(results !== undefined && { results }) });
}

export function pageView(path: string): void {
  if (!hasWindow() || disabled) return;
  impressionSeen = new Set();
  enqueue({ name: 'page_view', ts: Date.now(), page: path });
  engagedAccumulatedMs = 0;
  maxScrollPct = 0;
  engagedSince = document.visibilityState === 'visible' ? Date.now() : null;
  touchSession();
}

/** Emits the engagement summary for the page being left. */
export function pageLeft(path: string, viaBeacon = false): void {
  if (!hasWindow() || disabled) return;
  settleEngagement();
  if (engagedAccumulatedMs > 500 || maxScrollPct > 0) {
    enqueue({
      name: 'page_engagement',
      ts: Date.now(),
      page: path,
      props: { engagedMs: Math.round(engagedAccumulatedMs), maxScroll: maxScrollPct },
    });
  }
  engagedAccumulatedMs = 0;
  maxScrollPct = 0;
  flush(viaBeacon);
}

export function reportScroll(pct: number): void {
  if (pct > maxScrollPct) maxScrollPct = Math.min(Math.round(pct), 100);
}

function settleEngagement(): void {
  if (engagedSince !== null) {
    engagedAccumulatedMs += Date.now() - engagedSince;
    engagedSince = null;
  }
}

export function onVisibilityChange(): void {
  if (!hasWindow() || disabled) return;
  if (document.visibilityState === 'hidden') {
    settleEngagement();
    flush(true);
  } else {
    engagedSince = Date.now();
  }
}

/** Consent hook: stop all tracking and remove stored identifiers. */
export function disable(): void {
  disabled = true;
  queue = [];
  if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
  try {
    const store = storage();
    store?.removeItem(VISITOR_KEY);
    store?.removeItem(SESSION_KEY);
    store?.removeItem(SESSION_ATTR_KEY);
    store?.removeItem(SESSION_LAST_ACTIVE_KEY);
    document.cookie = `${VISITOR_KEY}=; path=/; max-age=0`;
  } catch { /* ignore */ }
}

/** Idempotent boot, called once by AnalyticsProvider. */
export function startTracker(): void {
  if (!hasWindow() || started) return;
  started = true;
  if (dntEnabled()) {
    disabled = true;
    return;
  }
  getVisitorId();
  getSessionId();
  flushTimer = setInterval(() => flush(), FLUSH_INTERVAL_MS);
}
