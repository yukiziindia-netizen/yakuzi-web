import io

# ── 1. tracker.ts: impression dedupe + grid helpers ──
p = 'apps/buyer/src/lib/analytics/tracker.ts'
s = io.open(p, encoding='utf8').read()

old = """export function trackProductView(productId: string): void {
  track('product_view', undefined, productId);
}"""
new = """export function trackProductView(productId: string): void {
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
}"""
assert old in s
s = s.replace(old, new, 1)

old = """export function pageView(path: string): void {
  if (!hasWindow() || disabled) return;
  enqueue({ name: 'page_view', ts: Date.now(), page: path });"""
new = """export function pageView(path: string): void {
  if (!hasWindow() || disabled) return;
  impressionSeen = new Set();
  enqueue({ name: 'page_view', ts: Date.now(), page: path });"""
assert old in s
s = s.replace(old, new, 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('tracker ok')

# ── 2. GridProductCard: impression observer + click tracking ──
p = 'apps/buyer/src/components/landing/ProductCarousel.tsx'
s = io.open(p, encoding='utf8').read()

anchor = "  const currentProductId = product?.id || `prod-${index}`;"
assert anchor in s
s = s.replace(anchor, anchor + """

  // Listing analytics: one impression per card per pageview (IntersectionObserver,
  // idle-cost only), and a click event on every navigation into the product.
  const impressionRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = impressionRef.current;
    if (!el || !product?.id || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          trackProductImpression(product.id, index);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [product?.id, index]);
  const handleCardNav = () => {
    if (product?.id) trackProductClick(product.id, index);
  };""", 1)

old = '''    <div className="relative mt-3 group flex flex-col h-auto w-full max-w-[210px] sm:max-w-none mx-auto">'''
new = '''    <div ref={impressionRef} className="relative mt-3 group flex flex-col h-auto w-full max-w-[210px] sm:max-w-none mx-auto">'''
assert old in s
s = s.replace(old, new, 1)

# attach the click handler to all three product Links (image, title, eye)
count = s.count('<Link href={`/products/${generateProductSlug(productName')
assert count >= 2, count
s = s.replace(
    '<Link href={`/products/${generateProductSlug(productName',
    '<Link onClick={handleCardNav} href={`/products/${generateProductSlug(productName',
)
# the eye/view Link at ~429 has href on its own line — handle separately if present
s = s.replace(
    "href={`/products/${generateProductSlug(productName, product?.id || 'prod-' + index, product?.slug)}`}\n",
    "onClick={handleCardNav}\n                       href={`/products/${generateProductSlug(productName, product?.id || 'prod-' + index, product?.slug)}`}\n",
    1,
) if 'onClick={handleCardNav}\n                       href=' not in s else s

# imports
old = "import { track, trackSearch } from '@/lib/analytics/tracker';"
if old in s:
    s = s.replace(old, "import { track, trackSearch, trackProductImpression, trackProductClick } from '@/lib/analytics/tracker';", 1)
else:
    import re
    m = re.search(r"^import .*?;\n", s)
    s = s.replace(m.group(0), m.group(0) + "import { trackProductImpression, trackProductClick } from '@/lib/analytics/tracker';\n", 1)
# useRef/useEffect present?
head = s[:800]
if 'useRef' not in head or 'useEffect' not in head:
    import re
    m = re.search(r'import \{([^}]*)\} from "react";', s) or re.search(r"import \{([^}]*)\} from 'react';", s)
    if m:
        names = m.group(1)
        add = [n for n in ['useRef', 'useEffect'] if n not in names]
        if add:
            s = s.replace(m.group(0), m.group(0).replace(names, names.rstrip() + ', ' + ', '.join(add)), 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('grid card ok')

# ── 3. SidebarSheet: filter_use on apply ──
p = 'apps/buyer/src/components/landing/SidebarSheet.tsx'
s = io.open(p, encoding='utf8').read()
old = """    router.push(`?${params.toString()}`, { scroll: false });
  };"""
new = """    // One event per apply, carrying the resulting filter state — compact and
    // enough for Phase-B reports to answer "which filters get used".
    track('filter_use', { query: params.toString().slice(0, 300) });
    router.push(`?${params.toString()}`, { scroll: false });
  };"""
assert old in s
s = s.replace(old, new, 1)
if "from '@/lib/analytics/tracker'" not in s:
    import re
    m = re.search(r"^import .*?;\n", s)
    s = s.replace(m.group(0), m.group(0) + "import { track } from '@/lib/analytics/tracker';\n", 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('filters ok')

# ── 4. Navbar search popup: result click ──
p = 'apps/buyer/src/components/landing/Navbar.tsx'
s = io.open(p, encoding='utf8').read()
old = """                                onClick={() => {
                                  router.push(`/products/${p.slug}`);
                                  setIsSearchChatOpen(false);
                                  setSearchInput('');
                                }}"""
new = """                                onClick={() => {
                                  track('product_click', { from: 'search', query: searchInput.trim().toLowerCase().slice(0, 100) }, p.id);
                                  router.push(`/products/${p.slug}`);
                                  setIsSearchChatOpen(false);
                                  setSearchInput('');
                                }}"""
assert old in s
s = s.replace(old, new, 1)
if "from '@/lib/analytics/tracker'" not in s:
    import re
    m = re.search(r"^import .*?;\n", s)
    s = s.replace(m.group(0), m.group(0) + "import { track } from '@/lib/analytics/tracker';\n", 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('navbar ok')
