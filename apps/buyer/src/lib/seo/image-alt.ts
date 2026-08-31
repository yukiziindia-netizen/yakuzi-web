/**
 * Default alt text for product imagery: "<product name> - Yukizi", with the
 * admin's per-image override (product SEO card -> Advanced -> image ALT
 * overrides, keyed by image URL) winning when set. Gallery images beyond the
 * first get an index suffix so they stay distinguishable in image search.
 */
export function productImageAlt(
  productName?: string | null,
  override?: string | null,
  index?: number,
): string {
  if (override && override.trim()) return override.trim();
  const base = productName && productName.trim() ? `${productName.trim()} - Yukizi` : 'Yukizi';
  return index && index > 0 ? `${base} (image ${index + 1})` : base;
}
